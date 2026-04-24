import { InstanceContainer } from "../instance-container";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import Dockerode, { Container, ContainerInfo, ContainerInspectInfo } from 'dockerode';
import { DockerodeGameBuildMetadata } from "../dockerode-data";
import * as fs from 'fs';
import * as path from 'path';
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { GameInstance } from "../../game-instance";
import { DockerContainerEvent } from "../docker-event";
import { InstanceContainerProvider } from "../instance-container-provider";
import { PortPool } from "../../port-pool";
import { GAME_INSTANCES_CONFIG } from "@src/config/hms/game-instances.config";
import { GAME_SERVER_BUILDS } from "@src/config/hms/dockerode.config";

const BUILDS_DIR = 'game-instances-builds';
const GAME_SERVER_DOCKER_FILEPATH = './docker/Dockerfile.game-instances';

type Entry = {
    instanceContainer: InstanceContainer,
    inspectInfo: ContainerInspectInfo,
    instance: GameInstance,
};

@Injectable()
export class DockerodeContainerProvider implements InstanceContainerProvider {
    private readonly docker: Dockerode;
    private containers: Map<string, Entry> = new Map<string, Entry>();
    private rootPath: string;
    private shouldClearCacheForBuild = false;
    private isProductionBuild = false;
    private portPool: PortPool;
    private logger: BetterLogger;
    private underDestruction: Set<string> = new Set<string>();

    /**
     * Indicates whether more game instances can be created.
     *
     * This depends on whether there are still ports available in the configured
     * range.
     *
     * @returns {boolean} Whether more game instances can be created.
     */
    get canCreate(): boolean {
        return this.portPool.hasAvailablePorts;
    }

    constructor(
        private configService: ConfigService,
    ) {
        this.docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
        this.rootPath = path.resolve(process.cwd());
        this.shouldClearCacheForBuild = this.configService.get<boolean>('DOCKER_CLEAR_CACHE_FOR_BUILD', true);

        // The amount of available ports is equal to the maximum number 
        // of simultaneous active instances
        this.portPool = new PortPool(
            GAME_INSTANCES_CONFIG.ports.startingPoolNumber,
            // The last port in the range is the maximum port number
            GAME_INSTANCES_CONFIG.ports.startingPoolNumber + GAME_INSTANCES_CONFIG.maxSimultaneousInstances - 1
        );

        this.isProductionBuild = this.configService.get<string>('APP_ENVIRONMENT') === 'production';

        // Start the dockerode event listener
        this.listenForContainerEvents().catch(err => {
            console.error('Failed to start Docker event listener:', err);
        });
    }

    async init(): Promise<boolean> {
        try {
            await this.clearContainers();
            if (this.isProductionBuild) {
                this.logger.log('Skipping building game images in production');
            }
            else {
                await this.buildImages();
            }
            return true;
        }
        catch (error) {
            this.logger.error('Error initializing DockerodeContainerProvider:', error);
            return false;
        }
    }

    async dismiss(): Promise<boolean> {
        try {
            await this.clearContainers();
            return true;
        }
        catch (error) {
            this.logger.error('Error clearing containers:', error);
            return false;
        }
    }

    async all(): Promise<InstanceContainer[]> {
        throw new Error("Method not implemented.");
    }

    async create(id: string, imageName: string, instance: GameInstance, environmentVariables?: string[]): Promise<InstanceContainer> {
        if (!this.canCreate) {
            throw new Error('No more container instances can be created');
        }

        try {
            const externalPort = this.portPool.acquire();
            this.logger.log(`Creating docker container for port ${externalPort}`);

            const containerName = `${GAME_INSTANCES_CONFIG.dockerContainerPrefix}_${id}`;
            const tcpPort = `${GAME_INSTANCES_CONFIG.internalPort}/tcp`;
            const udpPort = `${GAME_INSTANCES_CONFIG.internalPort}/udp`;
            const container = await this.docker.createContainer({
                Image: `hms/${imageName}`,
                ExposedPorts: { [tcpPort]: {}, [udpPort]: {} },
                HostConfig: {
                    PortBindings: {
                        [tcpPort]: [{ HostPort: `${externalPort}` }],
                        [udpPort]: [{ HostPort: `${externalPort}` }]
                    },
                },
                Env: environmentVariables,
                name: containerName,
            });

            const inspectInfo = await container.inspect();
            const entry: Entry = {
                instanceContainer: {
                    id: inspectInfo.Id,
                    image: inspectInfo.Config.Image,
                    port: externalPort
                },
                inspectInfo,
                instance: instance,
            }
            this.containers.set(id, entry);
            return entry.instanceContainer;
        }
        catch (error) {
            this.logger.error('Error creating container:', error);
            return null;
        }
    }

    async destroy(id: string): Promise<boolean> {
        if (!this.containers.has(id)) {
            this.logger.warn(`Container ${id} not found for destruction`);
            return false;
        }

        if (this.underDestruction.has(id)) {
            return true;
        }

        try {

            this.underDestruction.add(id);
            const entry = this.containers.get(id);
            const container = this.docker.getContainer(entry.inspectInfo.Id);
            if (container) {
                await container.remove({ force: true });
            }
            this.containers.delete(id);
            this.portPool.release(entry.instanceContainer.port);
            this.logger.log(`Container  \"${entry.inspectInfo.Name}(${entry.inspectInfo.Id})\" destroyed`);
            this.underDestruction.delete(id);
            return true;

        }
        catch (error) {
            this.logger.error(`Error destroying container ${id}`);
            this.logger.debug(error);
            return false;
        }
    }

    async start(id: string): Promise<boolean> {
        if (!this.containers.has(id)) {
            return false;
        }
        try {
            const entry = this.containers.get(id);
            const container = this.docker.getContainer(entry.inspectInfo.Id);
            await container.start();

            const network = this.docker.getNetwork(GAME_INSTANCES_CONFIG.dockerNetworkName);
            await network.connect({ Container: container.id });

            this.logger.log(`Container  \"${entry.inspectInfo.Name}(${entry.inspectInfo.Id})\" started`);
            return true;
        }
        catch (error) {
            this.logger.log('Error starting container:', error);
            return false;
        }
    }

    async stop(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async restart(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    setLogger(logger: BetterLogger): void {
        this.logger = logger;
        this.logger.setMessagesColor(BetterLogger.BRIGHT_YELLOW);
    }

    /**
     * Builds the Docker image for the game.
     *
     * Game instances are Docker containers created using the Docker imagem built
     * by this method.
     */
    private async buildImages(): Promise<void> {
        const buildsDirectoryPath = path.join(this.rootPath, BUILDS_DIR);

        if (!fs.existsSync(buildsDirectoryPath)) {
            throw new Error('Game instances build directory not found at ' + buildsDirectoryPath);
        }

        if (!GAME_SERVER_BUILDS || GAME_SERVER_BUILDS.length === 0) {
            this.logger.warn('No game server builds found');
            return;
        }

        this.logger.log('Building server game images');

        for (const metadata of GAME_SERVER_BUILDS) {
            const directoryLocation = path.join(buildsDirectoryPath, metadata.directoryLocation);
            if (!fs.existsSync(directoryLocation)) {
                this.logger.error(`Game instances build directory for ${metadata.identifier} not found at ${directoryLocation}`);
                continue;
            }
            await this.buildImage(metadata, directoryLocation);
        }

        this.logger.log('Finished building server game images');
    }

    private async buildImage(buildMetadata: DockerodeGameBuildMetadata, contextPath: string): Promise<void> {
        const buildName = this.generateImageCompleteName(buildMetadata);

        try {
            this.logger.log(`Building ${buildName} image from ${contextPath}`);
            const stream = await this.docker.buildImage(
                {
                    context: contextPath,
                    src: ['.', '../../docker'],
                },
                {
                    t: `hms/${buildMetadata.identifier}`,
                    q: this.isProductionBuild,
                    dockerfile: GAME_SERVER_DOCKER_FILEPATH,
                    nocache: this.shouldClearCacheForBuild,
                }
            );

            if (!this.isProductionBuild) {
                stream.on('data', (chunk) => {
                    const inputString = chunk.toString();
                    const sanitizedString = inputString.replace(/(\r\n|\n|\r)/gm, '').replace(/\\n/g, '');
                    const jsonArray = sanitizedString
                        .split(/(?=\{"stream":)/) // Separa em objetos JSON começando com {"stream":
                        .map(json => {
                            try {
                                return JSON.parse(json);
                            }
                            catch (error) {
                                return json;
                            }
                        }); // Converte cada string em objeto JSON
                    let finalString = '';

                    jsonArray.forEach((json) => {
                        if (json.stream) {
                            finalString += ' ' + json.stream;
                        }
                    });
                    this.logger.log(`(${buildName}) ${finalString}`);
                });
            }

            await new Promise<any[]>((resolve, reject) => {
                this.docker.modem.followProgress(
                    stream,
                    (err, res) => err ? reject(err) : resolve(res)
                );
            });

            this.logger.log(`Game image built: ${buildName}`);
        }
        catch (error) {
            this.logger.error(`Error building game image: ${buildName}`, error);
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
                    name: [containerName]
                },
            });
            if (!result.length) return null;
            return result[0];
        }
        catch (error) {
            this.logger.log(`Error getting container ${containerName}:`, error);
            return null;
        }
    }

    private async listAllContainers(): Promise<ContainerInfo[]> {
        try {
            const containers = GAME_SERVER_BUILDS.map(async buildMetadata => {
                const containers = await this.docker.listContainers({
                    all: true,
                    filters: {
                        ancestor: [this.generateImageCompleteName(buildMetadata)]
                    }
                });
                return containers;
            });

            return (await Promise.all(containers)).flat();
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
            this.logger.log('Error starting container:', error);
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
            this.logger.log('Error stopping container:', error);
        }
    }

    private async destroyContainer(container: Container): Promise<void> {
        try {
            await container.remove({ force: true });
            this.logger.log(`Container  \"${container.id}\" successfully destroyed`);
        }
        catch (error) {
            this.logger.log('Error removing container:', error);
        }
    }

    private async clearContainers(): Promise<void> {
        this.logger.log('Clearing containers...');
        try {
            const infos = await this.listAllContainers();
            const promises: Promise<void>[] = [];
            for (const info of infos) {
                const container = this.docker.getContainer(info.Id);
                const promise = this.destroyContainer(container);
                promises.push(promise);
            }
            await Promise.all(promises);
        }
        catch (error) {
            this.logger.error('Error clearing containers:', error);
        }
    }

    private listImediateSubdirectories(path: string): string[] {
        return fs.readdirSync(path, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
    }

    private generateImageCompleteName(metadata: DockerodeGameBuildMetadata): string {
        return `hms/${metadata.identifier}:${metadata.imageTag}`;
    }

    private async listenForContainerEvents() {
        // Listen to all major container lifecycle events
        const eventStream = await this.docker.getEvents({
            filters: {
                type: ['container'],
                event: [
                    'create', 'start', 'die', 'destroy',
                    'stop', 'kill', 'restart', 'pause',
                    'unpause', 'oom'
                ],
            },
        });

        this.logger?.log('Listening for container events...');

        eventStream.on('data', (chunk: Buffer) => {
            const event: DockerContainerEvent = JSON.parse(chunk.toString());
            this.logger?.log(`[Docker Event] ID: ${event.id} | Action: ${event.Action} | Status: ${event.status}`);

            if (!event.Actor || !event.Actor.Attributes || !event.Actor.Attributes.name) {
                this.logger?.warn('No actor found in event.');
                return;
            }

            const containerName = event.Actor.Attributes.name.replace(
                GAME_INSTANCES_CONFIG.dockerContainerPrefix + '_',
                ''
            );

            const entry = this.containers.get(containerName);
            if (!entry) {
                return;
            }

            // Handle different container events
            switch (event.Action) {
                case 'destroy':
                case 'kill':
                    this.logger?.log(`Container ${containerName} was REMOVED by Docker operation.`);
                    entry.instance.handleContainerDestroyed();
                    this.containers.delete(containerName);
                    break;
                case 'die':
                    this.logger?.log(`Container ${containerName} STOPPED (exit code: ${event.Actor.Attributes.exitCode}).`);
                    entry.instance.handleContainerStop();
                    break;
                case 'stop':
                    this.logger?.log(`Container ${containerName} was STOPPED normally.`);
                    entry.instance.handleContainerStop();
                    break;
                case 'restart':
                    this.logger?.log(`Container ${containerName} was RESTARTED.`);
                    entry.instance.handleContainerUp();
                    break;
                case 'pause':
                    this.logger?.log(`Container ${containerName} was PAUSED.`);
                    break;
                case 'unpause':
                    this.logger?.log(`Container ${containerName} was UNPAUSED.`);
                    break;
                case 'oom':
                    this.logger?.log(`Container ${containerName} was killed due to OUT OF MEMORY.`);
                    entry.instance.handleContainerDestroyed();
                    this.containers.delete(containerName);
                    break;
            }
        });

        eventStream.on('error', (err) => {
            this.logger?.error('Docker event stream error:', err);
        });
    }


}