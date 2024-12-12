import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { AppLogger } from 'src/shared/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import Dockerode, { Container, ContainerInfo } from 'dockerode';
import { InstanceEntry } from './instance-entry';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PortPool } from './port-pool';
import * as path from 'path';
import { instancesServiceConfig as config } from './instances-service-config';

export enum GameInstanceEvent {
    InstanceRegistered = 'instance.registered',
    InstanceUnregistered = 'instance.unregistered',
}

@Injectable()
export class GameInstancesService implements OnApplicationBootstrap, OnApplicationShutdown {

    private readonly docker: Dockerode;
    private rootPath: string;
    private shouldClearCacheForBuild = false;
    private appName: string;
    private owner: string;
    private imageName: string;
    private isProductionBuild = false;
    private portPool: PortPool;
    private instances: Map<number, InstanceEntry> = new Map<number, InstanceEntry>();

    get canAddMoreInstances(): boolean {
        return this.portPool.hasAvailablePorts;
    }

    constructor(
        private logger: AppLogger,
        private configService: ConfigService,
        private emitter: EventEmitter2,
    ) {
        this.logger.setContext(GameInstancesService.name);
        this.portPool = new PortPool(config.portsRange.min, config.portsRange.max);
        this.docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
        this.rootPath = path.resolve(__dirname, '../../../');
        this.shouldClearCacheForBuild = this.configService.get<boolean>('DOCKER_CLEAR_CACHE_FOR_BUILD', true);
        this.appName = this.configService.get<string>('APP_NAME', 'game-api');
        this.owner = this.configService.get<string>('APP_OWNER', 'some-company');
        this.imageName = `${this.owner}/${this.appName}-game-instance:latest`;
        this.isProductionBuild = this.configService.get<string>('APP_ENVIRONMENT') === 'production';
        this.logger.log('Created');
    }

    async onApplicationBootstrap() {
        await this.buildGameImage();
        await this.startGameInstance();
        await this.startGameInstance();
    }

    async onApplicationShutdown(signal?: string) {
        await this.clearContainers();
    }

    /**
     * Add a new game container to the system.
     * @returns `true` if the container was successfully created and started, `false` otherwise.
     */
    async startGameInstance(): Promise<boolean> {
        const externalPort = this.portPool.acquire();
        if (!externalPort) {
            this.logger.warn('No ports available');
            return false;
        }

        const containerName = `${this.appName}-game-server-${externalPort}`;
        let containerInfo = await this.getContainerByName(containerName);

        if (containerInfo) {
            this.logger.debug(`Container ${containerName} already exists. Starting...`);
            const container = this.docker.getContainer(containerInfo.Id);
            await this.startContainer(container);
            this.registerInstance(container, externalPort);
            return true;
        }

        try {
            this.logger.debug(`Creating docker container for port ${externalPort}`);
            const tcpPort = `${config.gameInternalPort}/tcp`;
            const udpPort = `${config.gameInternalPort}/udp`;

            const container = await this.docker.createContainer({
                Image: this.imageName,
                ExposedPorts: { [tcpPort]: {}, [udpPort]: {} },
                HostConfig: {
                    PortBindings: {
                        [tcpPort]: [{ HostPort: `${externalPort}` }],
                        [udpPort]: [{ HostPort: `${externalPort}` }]
                    }
                },
                name: containerName,
            });
            await this.startContainer(container);
            this.registerInstance(container, externalPort);
            return true;
        } catch (error) {
            this.logger.error('Error creating container:', error);
            return false;
        }
    }

    /**
     * Stop a game instance by ID.
     *
     * Stop a game instance, identified by its container ID, and unregister it
     * with the service. If the container does not exist, the call is ignored.
     *
     * @param containerId The ID of the container to stop
     */
    async stopGameInstance(id: number): Promise<void> {
        try {
            const entry = this.instances.get(id);
            if (!entry) {
                this.logger.warn(`Instance ${id} not found`);
                return;
            }
            const container = this.docker.getContainer(entry.containerId);
            await this.stopContainer(container);
            this.unregisterInstance(id);
        }
        catch (error) {
            this.logger.error(`Error stopping instance ${id}:`, error);
        }
    }

    private async buildGameImage(): Promise<void> {
        this.logger.debug('Building game image');
        const contextPath = path.join(this.rootPath, 'game-build');
        const dockerFilePath = './assets/Dockerfile.game';

        try {
            const stream = await this.docker.buildImage(
                {
                    context: contextPath, // Pasta como contexto
                    src: ['.', '../assets'], // Incluir todos os arquivos da pasta
                },
                {
                    t: this.imageName,
                    q: this.isProductionBuild,
                    dockerfile: dockerFilePath,
                    nocache: this.shouldClearCacheForBuild,
                }
            );

            // stream.on('data', (data) => {
            //     this.logger.debug(data);
            // });

            await new Promise<any[]>((resolve, reject) => {
                this.docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
            });

            this.logger.debug(`Game image built: ${this.imageName}`);
        }
        catch (error) {
            this.logger.error('Error building game image', error);
        }
    }

    /**
     * Tries to find a container by name, limited to containers using the current
     * game image.
     *
     * @param containerName The name of the container to find.
     *
     * @returns The container information if found, or null.
     */
    private async getContainerByName(containerName: string): Promise<ContainerInfo | null> {
        try {
            const result = await this.docker.listContainers({
                limit: 1,
                filters: {
                    name: [containerName],
                    ancestor: [this.imageName]
                },
            });
            if (!result.length) return null;
            return result[0];
        }
        catch (error) {
            this.logger.error(`Error getting container ${containerName}:`, error);
            return null;
        }
    }

    private async listAllContainers(): Promise<ContainerInfo[]> {
        try {
            const containers = await this.docker.listContainers({
                all: true,
                filters: {
                    ancestor: [this.imageName] // Filtra por containers que foram criados a partir da imagem especificada
                }
            });
            return containers;
        }
        catch (error) {
            this.logger.error('Error listing containers:', error);
            return [];
        }
    }

    private async startContainer(container: Container): Promise<void> {
        try {
            const inspectInfo = await container.inspect();
            if (!inspectInfo.State.Running) {
                await container.start();
            }
            this.logger.log(`Container  \"${inspectInfo.Name}(${inspectInfo.Id})\" started`);
        }
        catch (error) {
            this.logger.error('Error starting container:', error);
        }
    }

    private async stopContainer(container: Container): Promise<void> {
        try {
            const inspectInfo = await container.inspect();
            if (inspectInfo.State.Running) {
                await container.stop();
            }
            this.logger.log(`Container  \"${inspectInfo.Name}(${inspectInfo.Id})\" stopped`);
        }
        catch (error) {
            this.logger.error('Error stopping container:', error);
        }
    }

    private async clearContainers(): Promise<void> {
        this.logger.log('Clearing containers...');
        try {
            const infos = await this.listAllContainers();
            for (const info of infos) {
                const container = this.docker.getContainer(info.Id);
                await container.remove({ force: true });
                this.logger.log(`Container (${info.Id}) removed`);
            }
        }
        catch (error) {
            this.logger.error('Error clearing containers:', error);
        }
    }

    /**
     * Register a game instance.
     * @param container The container to register
     * @param port The port the container is listening on
     * @returns Nothing
     *
     * Registers a game instance with the service. The instance is identified by the
     * container ID and is associated with the specified port. If a container with the
     * same ID is already registered, the call is ignored. The instance is registered
     * with the event emitter.
     */
    private registerInstance(container: Container, port: number): void {

        const entry = {
            id: this.generateEntryID(),
            port: port,
            containerId: container.id
        };

        this.instances.set(entry.id, entry);
        this.emitter.emit(GameInstanceEvent.InstanceRegistered, entry);
    }

    /**
     * Unregister a game instance.
     * @param containerId The ID of the container to unregister
     *
     * Unregisters a game instance with the service. The instance is identified by the
     * container ID and its associated port is released back to the port pool. If a
     * container with the same ID is not registered, the call is ignored. The instance
     * is unregistered with the event emitter.
     */
    private unregisterInstance(id: number): void {
        if (!this.instances.has(id)) {
            return;
        }
        const entry = this.instances.get(id)!;
        this.instances.delete(id);
        this.portPool.release(entry.port);
        this.emitter.emit(GameInstanceEvent.InstanceUnregistered, entry);
    }

    private generateEntryID(): number {
        let id: number;
        do {
            id = Math.floor(100000 + Math.random() * 900000);
        } while (this.instances.has(id));

        return id;
    }
}
