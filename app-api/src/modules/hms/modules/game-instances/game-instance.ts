import { Observable, Subject } from "rxjs";
import { InstanceContainer } from "./instance-containers/instance-container";
import { InstanceContainerProvider } from "./instance-containers/instance-container-provider";
import { GAME_INSTANCES_CONFIG as config, GAME_INSTANCES_CONFIG } from '@src/config/hms/game-instances.config';
import { Namespace, Socket } from "socket.io";
import { PlayersManager } from "./players/players-manager";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { InstanceConnectivityData } from "@src/testing/payloads";
import { CancellablePromise, Delay } from "@hms-module/core/utils/delay";

/**
 * Represents the status of a game instance.
 *
 * The status might be:
 * - `InstanceStatus.Idle`: The instance is not initialized.
 * - `InstanceStatus.Initializing`: The instance is being initialized.
 * - `InstanceStatus.InitializationFailed`: The instance failed to initialize.
 * - `InstanceStatus.Running`: The instance is running.
 * - `InstanceStatus.Stopped`: The instance is stopped.
 * - `InstanceStatus.Destroying`: The instance is being destroyed.
 */
export enum InstanceStatus {
    /** The instance is not initialized. */
    Idle = 0,

    /** The instance is being initialized. */
    Initializing = 1,

    /** The instance failed to initialize. */
    InitializationFailed = 2,

    /** The instance is running. */
    Running = 3,

    /** The instance is stopped. */
    Stopped = 4,

    /** The instance is being destroyed. */
    Destroying = 5,
}

export type GameInstanceInfo = {
    id: string;
    status: InstanceStatus;
}

export type ConstructionData = {
    id: string;
    containerProvider: InstanceContainerProvider;
    imageName: string;
    interopsHost: string;
    interopsPort: number;
    autoInit?: boolean;
    environmentVariables?: string[];
}

export enum LifeCyleEvents {
    Alive = 'game-instance.lfc.alive',
    Heartbeat = 'game-instance.lfc.heartbeat',
    Ready = 'game-instance.lfc.ready',
};

type AcknowledgeSocketResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
}

export class GameInstance {
    private _status: InstanceStatus;
    private _id: string;
    private _port: number;
    private _container: InstanceContainer;
    private _aliveTimeoutPromise: CancellablePromise<void>;

    private _statusChanged$: Subject<GameInstanceInfo> = new Subject<GameInstanceInfo>();
    private _destroyed$ = new Subject<void>();
    private _logger?: BetterLogger;
    private _ioNamespace: Namespace;
    private _instanceSocket?: Socket;

    // Player Management
    private _playerManager: PlayersManager;

    // Heartbeat
    private _lastHeartbeat: number;
    private _heartbeatCheckInterval: NodeJS.Timeout;

    private _data: ConstructionData;

    /**
     * Retrieves the unique identifier of the game instance.
     *
     * @returns The unique ID of the instance.
     */
    get id(): string {
        return this._id;
    }

    /**
     * Retrieves the current status of the game instance.
     * @returns The current `GameStatus` of the instance.
     */
    get status(): InstanceStatus {
        return this._status;
    }

    /**
     * The Socket.IO namespace used for communication between the client game build
     * and this game instance.
     *
     * This is the namespace that the game instance is listening on for incoming
     * connections from the client game build.
     *
     * @returns The Socket.IO namespace used for communication.
     */
    get ioNamespace(): Namespace {
        return this._ioNamespace;
    }

    /**
     * The socket instance that the game instance is currently connected with.
     * 
     * This is the socket that the game instance is using to communicate with
     * the client game build in an authoritative manner.
     * 
     * @returns The socket instance, or `undefined` if the instance is not connected.
     */
    get instanceSocket(): Socket | undefined {
        return this._instanceSocket;
    }

    get logger(): BetterLogger | undefined {
        return this._logger;
    }

    /**
     * The port number that the game instance is listening on. Wich means
     * that a **HMS-CLIENT** will need to connect to this port
     * in order to communicate with the game instance in an authoritative 
     * manner.
     * 
     * This is `undefined` until the instance is initialized.
     *
     * @returns The port number that the game instance is listening on, or
     * `undefined` if the instance is not initialized.
     */
    get port(): number {
        return this._port;
    }

    /**
     * An observable that emits every time the instance's status changes.
     *
     * @returns An observable that emits the instance's current status whenever
     * it changes.
     */
    get statusChanged$(): Observable<GameInstanceInfo> {
        return this._statusChanged$.asObservable();
    }

    /**
     * Observable that emits when the instance is destroyed.
     *
     * This can be used to clean up resources that are only needed while the
     * instance is running.
     */
    get destroyed$(): Observable<void> {
        return this._destroyed$.asObservable();
    }

    /**
     * Retrieves the current information of the game instance.
     *
     * @returns An object containing the instance's ID, status, and port number.
     */
    get info(): GameInstanceInfo {
        return {
            id: this._id,
            status: this._status,
        };
    }

    get connectivity(): InstanceConnectivityData {
        return {
            instance_id: this._id,
            status: this._status,
            tcp_port: this._port,
            udp_port: this._port
        };
    }

    /**
     * A manager for the players in the game instance.
     *
     * This object provides methods for managing the players in the game
     * instance, such as adding, removing, and retrieving players.
     * 
     * @returns The `PlayerManager` object.
     */
    get players(): PlayersManager {
        return this._playerManager;
    }

    constructor(id: string, data: ConstructionData, ioNamespace: Namespace, logger?: BetterLogger) {
        this._id = id;
        this._status = InstanceStatus.Idle;
        this._logger = logger;
        if (this._logger) {
            const context = `${GameInstance.name}#${id}`;
            logger.setContext(context);
            logger.setMessagesColor(BetterLogger.BRIGHT_MAGENTA);
        }
        this._data = data;
        this._ioNamespace = ioNamespace;

        if (data.autoInit) {
            this.init();
        }
    }

    /**
     * Initialize the game instance. If the instance is already initialized, it will just return true.
     * 
     * @returns true if the instance was successfully initialized, false otherwise.
     */
    async init(): Promise<boolean> {
        if (this._container) {
            return true;
        }

        try {
            this.setStatus(InstanceStatus.Initializing);

            this._ioNamespace.on('connection', (socket: Socket) => {
                if (this._instanceSocket) {
                    // Only allow one connection
                    socket.disconnect(true);
                    return;
                }
                this._instanceSocket = socket;
                this.registerSocketListeners(socket);
                this._playerManager = new PlayersManager(this);
            });

            this._ioNamespace.on('disconnect', () => {
                this._instanceSocket = null;
                this._playerManager = null;
            });

            this._container = await this._data.containerProvider.create(
                this._id,
                this._data.imageName,
                this,
                this.generateContainerEnvironmentVariables()
            );

            const success = await this._data.containerProvider.start(this._id);
            if (success) {
                this._port = this._container.port;
                this.initiateAliveSignalTimeout();
                this.initializeHeartbeatMonitoring();
            }
            else {
                this.setStatus(InstanceStatus.InitializationFailed);
            }

            return success;
        }
        catch (error) {
            this.setStatus(InstanceStatus.InitializationFailed);
            return false;
        }
    }

    /**
     * Dispatches an event to the connected game instance.
     *
     * This method emits an event with an optional payload to the instance's socket.
     * It ensures that the instance is currently running before dispatching the event.
     *
     * @param evt - The name of the event to dispatch.
     * @param payload - Optional data to send with the event.
     * @throws An error if the instance is not in the running state.
     */
    dispatchToInstance(evt: string, payload?: any): void {
        if (this._status !== InstanceStatus.Running) {
            throw new Error(`Instance ${this._id} is not running.`);
        }
        this._instanceSocket?.emit(evt, payload);
    }

    /**
     * Dispatches an event to the connected game instance asynchronously.
     *
     * This method emits an event with an optional payload to the instance's socket
     * and waits for an acknowledgement from the instance. It ensures that the
     * instance is currently running before dispatching the event.
     *
     * @param evt - The name of the event to dispatch.
     * @param payload - Optional data to send with the event.
     * @param timeout - Optional timeout in milliseconds for the acknowledgement.
     *                  Defaults to 5000.
     * @returns A Promise that resolves to the response from the instance.
     */
    async dispatchToInstanceAsync<T>(evt: string, payload?: any, timeout: number = 5000): Promise<AcknowledgeSocketResponse<T>> {
        if (this._status !== InstanceStatus.Running) {
            return {
                success: false,
                error: `Instance ${this._id} is not running.`
            }
        }

        try {
            const data = await this._instanceSocket.timeout(timeout).emitWithAck(evt, payload);
            return {
                success: true,
                data: data ? JSON.parse(data) as T : undefined,
            };
        }
        catch (error) {
            this._logger?.error(`Error dispatching event ${evt} to instance ${this._id}: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Destroy the game instance.
     *
     * @returns true if the instance was successfully destroyed, false otherwise.
     */
    async destroy(): Promise<boolean> {
        try {
            this.setStatus(InstanceStatus.Destroying);

            if (this._heartbeatCheckInterval) {
                clearTimeout(this._heartbeatCheckInterval);
            }

            this._ioNamespace?.sockets.forEach((socket: Socket) => {
                socket.disconnect(true);
            });

            this._ioNamespace?.removeAllListeners();

            await this._data.containerProvider.destroy(this._id);

            this._destroyed$.next();
            this._destroyed$.complete();
            return true;
        }
        catch (error) {
            this.logger.error(`Error destroying instance ${this._id}:`);
            this.logger.debug(error);
            return false;
        }
    }

    /**
     * Registers that the game instance is alive meaning it 
     * will not be destroyed automatically for the configured timeout.
     */
    registerAliveSignal(): void {
        this._aliveTimeoutPromise?.cancel();
        this._logger?.log(`Instance ${this._id} is alive`);
    }

    /**
     * Indicates that the game instance is ready and running.    
     * Sets the instance's status to `GameStatus.Running`.
     */
    registerReadySignal(): void {
        this.setStatus(InstanceStatus.Running);
        this._logger?.log(`Instance ${this._id} is running`);
    }

    registerHeartbeatSignal(): void {
        this._lastHeartbeat = Date.now();
    }

    handleContainerDestroyed(): void {
        this.destroy();
    }

    handleContainerStop(): void {

    }

    handleContainerUp(): void {

    }

    /**
     * Updates the current status of the game instance and emits the updated status.
     *
     * @param newStatus - The new status to set for the game instance.
     */
    private setStatus(newStatus: InstanceStatus) {
        this._status = newStatus;
        this._statusChanged$.next(this.info);
    }

    private initiateAliveSignalTimeout() {
        const timeoutSeconds = config.aliveSignalTimeout * 10000;
        this._aliveTimeoutPromise = Delay.for(timeoutSeconds);
        this._aliveTimeoutPromise.promise.then(() => {
            this._logger?.warn(
                `Instance ${this._id} did not send alive signal in ${timeoutSeconds} seconds. Destroying...`
            );
            this.destroy();
        });
    }

    /**
     * Generates environment variables for the container.
     *
     * The generated environment variables include the instance ID,
     * the namespace and host/port for the socket connection, and
     * the HTTP host and port. Additionally, the heartbeat interval
     * is included, which is used by the game instance to send heartbeats
     * to the API.
     * @returns An array of strings, where each string is a key-value pair
     * in the format "KEY=VALUE".
     */
    private generateContainerEnvironmentVariables() {
        return [
            `HMS_INSTANCE_ID=${this.id}`,
            `HMS_API_INTEROPS_HOST=${this._data.interopsHost}`,
            `HMS_API_INTEROPS_PORT=${this._data.interopsPort}`,
            `HEARTBEAT_INTERVAL=${GAME_INSTANCES_CONFIG.heartbeats.interval}`,
        ];
    }

    private initializeHeartbeatMonitoring(): void {
        this._lastHeartbeat = Date.now();

        // Reinicia o timeout
        if (this._heartbeatCheckInterval) {
            clearTimeout(this._heartbeatCheckInterval);
        }

        // Verifica periodicamente a conexão
        this._heartbeatCheckInterval = setInterval(() => {
            this.checkHeartbeat();
        }, GAME_INSTANCES_CONFIG.heartbeats.interval);
    }

    /**
     * Checks if the game instance has missed a number of heartbeats beyond the allowed threshold.
     *
     * This method calculates the time elapsed since the last received heartbeat
     * and compares it against the maximum allowable wait time, which is determined
     * by the heartbeat interval and the maximum number of missed heartbeats allowed.
     * If the time elapsed exceeds the maximum wait time, it logs a warning message
     * indicating potential connection issues and triggers the heartbeat timeout handler.
     */
    private checkHeartbeat(): void {
        const timeSinceLastHeartbeat = Date.now() - this._lastHeartbeat;
        const maxWaitTime = GAME_INSTANCES_CONFIG.heartbeats.interval * GAME_INSTANCES_CONFIG.heartbeats.maxMissed;

        if (timeSinceLastHeartbeat <= maxWaitTime) return;

        // From here we can consider the instance is having connection troubles
        this._logger.warn(`Missed ${GAME_INSTANCES_CONFIG.heartbeats.maxMissed} heartbeats...`);
        this.handleHeartbeatTimeout();
    }

    private handleHeartbeatTimeout(): void {

        this.setStatus(InstanceStatus.Stopped);
        this.destroy();
    }

    private registerSocketListeners(socket: Socket): void {
        socket.on(LifeCyleEvents.Alive, () => this.registerAliveSignal());
        socket.on(LifeCyleEvents.Heartbeat, () => this.registerHeartbeatSignal());
        socket.on(LifeCyleEvents.Ready, () => this.registerReadySignal());
    }
}