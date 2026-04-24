// src/core/modules/docker/docker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker, { Container, ContainerInfo } from 'dockerode';

@Injectable()
export class DockerService {
    private readonly logger = new Logger(DockerService.name);
    private readonly docker: Docker;

    constructor(private readonly config: ConfigService) {
        this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
        this.logger.log('Docker service initialized');
    }

    async listContainers(all = true): Promise<ContainerInfo[]> {
        try {
            const containers = await this.docker.listContainers({ all });
            this.logger.log(`Retrieved ${containers.length} containers`);
            return containers;
        } catch (error) {
            this.logger.error('Error listing containers', error as any);
            throw error;
        }
    }

    async startContainer(containerIdOrName: string): Promise<void> {
        try {
            const container = this.docker.getContainer(containerIdOrName);
            await container.start();
            this.logger.log(`Container ${containerIdOrName} started`);
        } catch (error: any) {
            if (error?.statusCode === 304) {
                this.logger.warn('Container already started');
                return;
            }
            this.logger.error(
                `Error starting container ${containerIdOrName}`,
                error,
            );
            throw error;
        }
    }

    async stopContainer(containerIdOrName: string): Promise<void> {
        try {
            const container = this.docker.getContainer(containerIdOrName);
            await container.stop({ t: 10 });
            this.logger.log(`Container ${containerIdOrName} stopped`);
        } catch (error: any) {
            if (error?.statusCode === 304) {
                this.logger.warn('Container already stopped');
                return;
            }
            this.logger.error(
                `Error stopping container ${containerIdOrName}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Returns a handle by exact Docker container name.
     * Accepts names with or without the leading slash.
     */
    getContainerByName(name: string): Container {
        const clean = name.startsWith('/') ? name.slice(1) : name;
        return this.docker.getContainer(clean);
    }

    async startContainerByName(containerName: string): Promise<void> {
        const c = this.getContainerByName(containerName);
        try {
            await c.start();
            this.logger.log(
                `Container ${containerName} started successfully`,
            );
        } catch (error: any) {
            if (error?.statusCode === 304) {
                this.logger.warn('Container already started');
                return;
            }
            this.logger.error(
                `Error starting container by name ${containerName}`,
                error,
            );
            throw error;
        }
    }

    async stopContainerByName(containerName: string): Promise<void> {
        const c = this.getContainerByName(containerName);
        try {
            await c.stop({ t: 10 });
            this.logger.log(`Container ${containerName} stopped successfully`);
        } catch (error: any) {
            if (error?.statusCode === 304) {
                this.logger.warn('Container already stopped');
                return;
            }
            this.logger.error(
                `Error stopping container by name ${containerName}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Resolves a container by Docker Compose service name using labels.
     * Looks for: com.docker.compose.service=<serviceName>
     * Optionally narrows by project via com.docker.compose.project if provided.
     */
    private async resolveByComposeService(
        serviceName: string,
        projectName?: string,
    ): Promise<ContainerInfo | undefined> {
        const filters: Record<string, string[]> = {
            label: [`com.docker.compose.service=${serviceName}`],
        };
        if (projectName && projectName.trim().length > 0) {
            filters.label.push(`com.docker.compose.project=${projectName.trim()}`);
        }

        const list = await this.docker.listContainers({
            all: true,
            // Docker API expects a JSON string for filters; dockerode accepts object.
            filters,
        });

        // If multiple (replicas), pick the first or prefer 'running' state.
        const running = list.find((c) => c.State === 'running');
        return running ?? list[0];
    }

    /**
     * Convenience: start API by Compose service name.
     * Env:
     *  - DOCKER_COMPOSE_API_SERVICE (default: 'hms-api')
     *  - DOCKER_COMPOSE_PROJECT (optional, narrows the search)
     */
    async startApiContainer(): Promise<void> {
        const service =
            this.config.get<string>('DOCKER_COMPOSE_API_SERVICE') || 'hms-api';
        const project = this.config.get<string>('DOCKER_COMPOSE_PROJECT');

        const info = await this.resolveByComposeService(service, project);
        if (!info) {
            throw new Error(
                `API container not found for service "${service}"` +
                (project ? ` (project "${project}")` : ''),
            );
        }

        await this.startContainer(info.Id);
    }

    async stopApiContainer(): Promise<void> {
        const service =
            this.config.get<string>('DOCKER_COMPOSE_API_SERVICE') || 'hms-api';
        const project = this.config.get<string>('DOCKER_COMPOSE_PROJECT');

        const info = await this.resolveByComposeService(service, project);
        if (!info) {
            throw new Error(
                `API container not found for service "${service}"` +
                (project ? ` (project "${project}")` : ''),
            );
        }

        await this.stopContainer(info.Id);
    }
}
