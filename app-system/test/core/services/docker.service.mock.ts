// src/docker/docker.service.mock.ts
import { jest } from '@jest/globals';
import Dockerode, { Container, ContainerInfo, NetworkInfo, Port } from 'dockerode';
import { CONTAINER_INFO_MOCK_COLLECTION } from '../entities/container-info.mock';
import { DockerService } from '@src/core/modules/docker/docker.service';

export type MockDockerService = Partial<Record<keyof DockerService, jest.Mock>> & {
    _containers: ContainerInfo[];
    _containerStatuses: Record<string, { running: boolean }>;
    _simulateContainerState: (idOrName: string, running: boolean) => void;
    _addContainer: (container: ContainerInfo) => void;
    _clear: () => void;
};

export const createMockDockerService = (): MockDockerService => {
    const containers: ContainerInfo[] = CONTAINER_INFO_MOCK_COLLECTION;

    const containerStatuses: Record<string, { running: boolean }> = {
        'container1': { running: true },
        'container2': { running: false },
        'api-service': { running: true },
        'db-service': { running: false }
    };

    const mockContainer: jest.Mocked<Container> = {
        start: jest.fn().mockImplementation(async () => {
            containerStatuses['container1'].running = true;
            containerStatuses['api-service'].running = true;
        }),
        stop: jest.fn().mockImplementation(async () => {
            containerStatuses['container1'].running = false;
            containerStatuses['api-service'].running = false;
        }),
        inspect: jest.fn().mockImplementation(async () => ({
            Id: 'container1',
            State: {
                Running: containerStatuses['container1'].running,
                Status: containerStatuses['container1'].running ? 'running' : 'exited'
            },
            Config: {},
            HostConfig: {},
            NetworkSettings: {}
        })),
    } as unknown as jest.Mocked<Container>;

    // Definindo explicitamente o tipo dos mocks para resolver os erros
    const mockService: MockDockerService = {
        listContainers: jest.fn().mockImplementation(async (): Promise<ContainerInfo[]> => containers),
        startContainer: jest.fn().mockImplementation(async (id: string): Promise<void> => {
            containerStatuses[id].running = true;
        }),
        stopContainer: jest.fn().mockImplementation(async (id: string): Promise<void> => {
            containerStatuses[id].running = false;
        }),
        getContainerByName: jest.fn().mockImplementation((name: string): Container => {
            const cleanName = name.startsWith('/') ? name.substring(1) : name;
            return mockContainer;
        }),
        startContainerByName: jest.fn().mockImplementation(async (name: string): Promise<void> => {
            containerStatuses[name].running = true;
        }),
        stopContainerByName: jest.fn().mockImplementation(async (name: string): Promise<void> => {
            containerStatuses[name].running = false;
        }),
        startApiContainer: jest.fn().mockImplementation(async (): Promise<void> => undefined),
        stopApiContainer: jest.fn().mockImplementation(async (): Promise<void> => undefined),

        // Propriedades internas
        _containers: containers,
        _containerStatuses: containerStatuses,

        // Métodos auxiliares
        _simulateContainerState: (idOrName: string, running: boolean) => {
            containerStatuses[idOrName] = { running };
        },
        _addContainer: (container: ContainerInfo) => {
            containers.push(container);
            const names = container.Names.map(n => n.startsWith('/') ? n.substring(1) : n);
            names.forEach(name => {
                containerStatuses[name] = { running: container.State === 'running' };
            });
            containerStatuses[container.Id] = { running: container.State === 'running' };
        },
        _clear: () => {
            containers.length = 0;
            Object.keys(containerStatuses).forEach(key => delete containerStatuses[key]);
        }
    };

    return mockService;
};