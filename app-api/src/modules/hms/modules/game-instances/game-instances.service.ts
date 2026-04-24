import { HttpStatus, Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConstructionData, GameInstance, GameInstanceInfo } from './game-instance';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InstanceContainerProvider } from './instance-containers/instance-container-provider';
import { INSTANCE_PROVIDER_NAME } from './instance-containers/instance-container-provider-resolver';
import { Observable, Subject } from 'rxjs';
import { v1 as uuidv1 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { GameInstanceCreationFailedException } from './exceptions/game-instance-creation-failed.exception';
import { ShutdownService } from '@hms-module/modules/life-cycle/shutdown/shutdown.service';
import { StepResult } from '@hms-module/modules/life-cycle/init/types';
import { InitStep } from '@hms-module/modules/life-cycle/init/decorators';

export enum GameInstanceEvent {
    Created = 'game-instance.created',
    Destroyed = 'game-instance.destroyed',
    StatusChanged = 'game-instance.status.changed',
}

const API_INTEROPS_HOST_KEY = 'HMS_API_INTEROPS_HOST';
const API_INTEROPS_PORT_ENV_KEY = 'HMS_API_INTEROPS_PORT';

@Injectable()
export class GameInstancesService {
    private _instances: Map<string, GameInstance> = new Map<string, GameInstance>();
    private _initialized$: Subject<boolean> = new Subject<boolean>();
    private _isInitialized: boolean;
    private _io: Server;

    /**
     * Indicates whether more game instances can be created.
     *
     * This depends on the configured container provider and the ports range.
     * If the provider can create more containers and there are still ports
     * available in the configured range, this will return `true`.
     *
     * @returns {boolean} Whether more game instances can be created.
     */
    get canAddMoreInstances(): boolean {
        return this.containerProvider.canCreate;
    }

    /**
     * An observable that emits when the service is initialized.
     *
     * This observable emits `true` when the service is fully initialized and
     * `false` when it is not. This can be used to wait for the service to be
     * fully initialized before attempting to create game instances.
     *
     * @returns An observable that emits the initialization state of the service.
     */
    get initialized$(): Observable<boolean> {
        return this._initialized$.asObservable();
    }

    /**
     * Indicates whether the game instances service is initialized.
     *
     * @returns `true` if the service is initialized, `false` otherwise.
     */
    get isInitialized(): boolean {
        return this._isInitialized;
    }

    constructor(
        private configService: ConfigService,
        private shutdownService: ShutdownService,
        private logger: BetterLogger,
        private emitter: EventEmitter2,
        @Inject(INSTANCE_PROVIDER_NAME)
        private containerProvider: InstanceContainerProvider
    ) {
        this.logger.setContext(GameInstancesService.name);
        this.logger.setMessagesColor(BetterLogger.BRIGHT_MAGENTA);
        this.shutdownService.registerShutdownRoutine(this.gracefullShutdown.bind(this));
    }

    setSocketServer(server: Server) {
        this._io = server;
    }

    @InitStep({ name: 'Game Instances Setup', priority: 10 })
    async init(): Promise<StepResult> {
        try {
            await this.containerProvider.init();
            this._isInitialized = true;
            this._initialized$.next(true);
            return { status: 'success' };
        } catch (error) {
            return {
                status: 'failed',
                message: 'Some instances failed to initialize'
            };
        }
    }

    async gracefullShutdown() {
        await this.containerProvider.dismiss();
    }

    /**
     * Create a new game instance.
     *
     * This method will fail if it is not possible to create more game instances.
     * @returns A new `GameInstance` object.
     * @throws {Error} If no more instances can be created.
     */
    create(imageName: string, customID?: string): GameInstance {
        if (!this.canAddMoreInstances) {
            throw new GameInstanceCreationFailedException('Game instance creation limit reached', HttpStatus.INSUFFICIENT_STORAGE);
        }

        if (customID && this.isIDTaken(customID))
            throw new GameInstanceCreationFailedException(`Instance with ID ${customID} already exists`, HttpStatus.CONFLICT);

        return this.generateInstance({
            id: customID ? customID : this.generateInstanceID(),
            containerProvider: this.containerProvider,
            autoInit: true,
            interopsHost: this.configService.get<string>(API_INTEROPS_HOST_KEY),
            interopsPort: this.configService.get<number>(API_INTEROPS_PORT_ENV_KEY),
            imageName
        });
    }

    /**
     * Creates a new game instance asynchronously.
     *
     * This method will fail if it is not possible to create more game instances.
     * @returns A promise that resolves to a new `GameInstance` object.
     * @throws {Error} If no more instances can be created.
     */
    async createAsync(imageName: string, customID?: string): Promise<GameInstance> {
        if (!this.canAddMoreInstances) {
            throw new GameInstanceCreationFailedException('Game instance creation limit reached', HttpStatus.INSUFFICIENT_STORAGE);
        }

        if (customID && this.isIDTaken(customID))
            throw new GameInstanceCreationFailedException(`Instance with ID ${customID} already exists`, HttpStatus.CONFLICT);

        try {
            const instance = this.generateInstance({
                id: customID ? customID : this.generateInstanceID(),
                containerProvider: this.containerProvider,
                interopsHost: this.configService.get<string>(API_INTEROPS_HOST_KEY),
                interopsPort: this.configService.get<number>(API_INTEROPS_PORT_ENV_KEY),
                imageName,
            });
            await instance.init();
            return instance;
        } catch (error) {
            this.logger.error('Error creating game instance:', error);
            throw error;
        }
    }

    /**
     * Check if a game instance with the given ID exists.
     *
     * @param id The ID of the instance to check.
     *
     * @returns `true` if an instance with the given ID exists, `false` otherwise.
     */
    has(id: string): boolean {
        return this._instances.has(id);
    }

    /**
     * Retrieve a game instance by its ID.
     *
     * @param id The ID of the instance to retrieve.
     *
     * @returns The `GameInstance` object with the given ID, or `undefined` if no instance with the given ID exists.
     */
    get(id: string): GameInstance {
        return this._instances.get(id);
    }

    /**
     * Retrieves all game instances currently registered.
     *
     * @returns An array of all existing `GameInstance` objects.
     */
    all(): GameInstance[] {
        return Array.from(this._instances.values());
    }

    /**
     * Retrieves information for all game instances currently registered.
     *
     * This method maps each registered game instance to its corresponding
     * `GameInstanceInfo` object.
     *
     * @returns An array of `GameInstanceInfo` objects for all existing game instances.
     */
    allInfos(): GameInstanceInfo[] {
        return this.all().map((i) => i.info);
    }

    /**
     * Generates a new `GameInstance` and assigns a unique ID to it.
     *
     * This method creates a new game instance, subscribes to its destroyed event
     * to handle cleanup, and emits events for instance creation and destruction.
     * The created instance is stored in the internal instances map.
     *
     * @returns The newly created `GameInstance`.
     */
    private generateInstance(data: ConstructionData): GameInstance {
        const logger = new BetterLogger();
        const ioNamespace = this._io.of(`/game-instance-${data.id}`);
        ioNamespace.use(this.instanceIPValidationMiddleware.bind(this));
        const instance = new GameInstance(data.id, data, ioNamespace, logger);

        instance.destroyed$.subscribe(() => {
            if (this._io._nsps.has(ioNamespace.name)) {
                this._io._nsps.delete(ioNamespace.name);
            }

            if (!this._instances.has(instance.id)) return;

            this._instances.delete(instance.id);
            this.emitter.emit(GameInstanceEvent.Destroyed, data.id);
        });

        instance.statusChanged$.subscribe(info => this.emitter.emit(GameInstanceEvent.StatusChanged, info));

        this._instances.set(data.id, instance);
        this.emitter.emit(GameInstanceEvent.Created, instance);
        this.logger.debug(`Created instance ${instance.id}`);

        return instance;
    }

    private isIDTaken(id: string): boolean {
        return this._instances.has(id);
    }

    /**
     * Generates a unique identifier for a new game instance.
     *
     * This method uses the UUID version 1 to ensure a unique ID is generated.
     *
     * @returns A unique string identifier for the game instance.
     */
    private generateInstanceID(): string {
        const id = uuidv1();
        if (this._instances.has(id)) {
            return this.generateInstanceID(); // Recursively generate a new ID if it already exists
        }
        return id;
    }

    /**
     * Middleware to authorize WebSocket connections based on client IP.
     * 
     * This method retrieves and logs the client IP from the socket handshake
     * and the host IP. It denies access if the client is the host itself.
     * It further checks if the client IP is allowed within the specified 
     * subnet range. If the IP is allowed, the connection proceeds; otherwise,
     * an error is passed to the callback function to deny access.
     *
     * @param socket - The socket instance representing the client connection.
     * @param next - A callback function to continue or terminate the connection.
     */
    private instanceIPValidationMiddleware(socket: Socket, next: (err?: any) => void): void {
        const clientIp = socket.handshake.address.replace(/^::ffff:/, '');
        const subnet = this.configService.get<string>('GAME_NETWORK_SUBNET', '172.16.0.0/21');
        const hostIp = this.extractHostIp(subnet);
        // Host cannot access this
        if (clientIp === hostIp) {
            return next(new Error('Host cannot access this'));
        }

        // Check if the client IP is in the subnet range
        if (this.isIpAllowed(clientIp, subnet)) {
            next(); // allow the connection
        } else {
            next(new Error(`Access denied for client IP ${clientIp}. Not in the subnet range.`));
        }
    }

    /**
     * Checks if the given IP address is in the subnet range.
     *
     * The method converts the IP address and subnet IP to 32-bit numbers and
     * applies the subnet mask to both values. It then checks if the result of
     * the bitwise AND operation is the same for both values. If the result is the
     * same, the IP address is in the subnet range.
     * @param ip The IP address to check.
     * @returns true if the IP address is in the subnet range, false otherwise.
     */
    private isIpAllowed(ip: string, subnet: string): boolean {
        const [subnetIp, subnetMaskBits] = subnet.split('/');
        const subnetMask = parseInt(subnetMaskBits);

        // Convert IP and subnet IP to 32-bit numbers
        const ipParts = ip.split('.');
        const subnetIpParts = subnetIp.split('.');

        const ipNumber = ipParts.reduce((acc, part, i) => acc + parseInt(part) * 256 ** (3 - i), 0);
        const subnetIpNumber = subnetIpParts.reduce((acc, part, i) => acc + parseInt(part) * 256 ** (3 - i), 0);

        // Calculate the subnet mask
        const mask = -1 << (32 - subnetMask);

        // Check if the IP address is within the subnet
        return (ipNumber & mask) === (subnetIpNumber & mask);
    }

    /**
     * Extracts the host IP from the subnet.
     * 
     * This function is used to determine the host IP that is used to access the game server.
     * It does this by incrementing the subnet IP by 1.
     * 
     * @returns The host IP as a string.
     */
    private extractHostIp(subnet: string): string {
        const [subnetIp] = subnet.split('/');

        // Convert IP and subnet IP to 32-bit numbers
        const subnetIpParts = subnetIp.split('.');
        const subnetIpNumber = subnetIpParts.reduce((acc, part, i) => acc + parseInt(part) * 256 ** (3 - i), 0);

        // Calculate the host IP
        const hostIpNumber = subnetIpNumber + 1;

        // Convert the host IP number back to a string
        const hostIpParts = [
            (hostIpNumber >> 24) & 0xFF,
            (hostIpNumber >> 16) & 0xFF,
            (hostIpNumber >> 8) & 0xFF,
            hostIpNumber & 0xFF
        ];

        // Return the host IP as a string
        return hostIpParts.join('.');
    }
}
