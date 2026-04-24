"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockDockerService = void 0;
// src/docker/docker.service.mock.ts
const globals_1 = require("@jest/globals");
const container_info_mock_1 = require("../entities/container-info.mock");
const createMockDockerService = () => {
    const containers = container_info_mock_1.CONTAINER_INFO_MOCK_COLLECTION;
    const containerStatuses = {
        'container1': { running: true },
        'container2': { running: false },
        'api-service': { running: true },
        'db-service': { running: false }
    };
    const mockContainer = {
        start: globals_1.jest.fn().mockImplementation(async () => {
            containerStatuses['container1'].running = true;
            containerStatuses['api-service'].running = true;
        }),
        stop: globals_1.jest.fn().mockImplementation(async () => {
            containerStatuses['container1'].running = false;
            containerStatuses['api-service'].running = false;
        }),
        inspect: globals_1.jest.fn().mockImplementation(async () => ({
            Id: 'container1',
            State: {
                Running: containerStatuses['container1'].running,
                Status: containerStatuses['container1'].running ? 'running' : 'exited'
            },
            Config: {},
            HostConfig: {},
            NetworkSettings: {}
        })),
    };
    // Definindo explicitamente o tipo dos mocks para resolver os erros
    const mockService = {
        listContainers: globals_1.jest.fn().mockImplementation(async () => containers),
        startContainer: globals_1.jest.fn().mockImplementation(async (id) => {
            containerStatuses[id].running = true;
        }),
        stopContainer: globals_1.jest.fn().mockImplementation(async (id) => {
            containerStatuses[id].running = false;
        }),
        getContainerByName: globals_1.jest.fn().mockImplementation((name) => {
            const cleanName = name.startsWith('/') ? name.substring(1) : name;
            return mockContainer;
        }),
        startContainerByName: globals_1.jest.fn().mockImplementation(async (name) => {
            containerStatuses[name].running = true;
        }),
        stopContainerByName: globals_1.jest.fn().mockImplementation(async (name) => {
            containerStatuses[name].running = false;
        }),
        startApiContainer: globals_1.jest.fn().mockImplementation(async () => undefined),
        stopApiContainer: globals_1.jest.fn().mockImplementation(async () => undefined),
        // Propriedades internas
        _containers: containers,
        _containerStatuses: containerStatuses,
        // Métodos auxiliares
        _simulateContainerState: (idOrName, running) => {
            containerStatuses[idOrName] = { running };
        },
        _addContainer: (container) => {
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
exports.createMockDockerService = createMockDockerService;
//# sourceMappingURL=docker.service.mock.js.map