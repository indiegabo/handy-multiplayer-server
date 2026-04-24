export const CONTAINER_INFO_MOCK_COLLECTION = [
    {
        Id: 'container1',
        Names: ['/api-service'],
        Image: 'api-image:latest',
        ImageID: 'sha256:1234567890abcdef',
        Command: 'npm start',
        Created: Date.now() / 1000 - 7200, // 2 hours ago
        Ports: [
            {
                IP: '0.0.0.0',
                PrivatePort: 3000,
                PublicPort: 3000,
                Type: 'tcp'
            }
        ],
        Labels: {
            'com.example.version': '1.0.0'
        },
        State: 'running',
        Status: 'Up 2 hours',
        HostConfig: {
            NetworkMode: 'bridge'
        },
        NetworkSettings: {
            Networks: {
                bridge: {
                    IPAMConfig: null,
                    Links: null,
                    Aliases: null,
                    NetworkID: 'network1',
                    EndpointID: 'endpoint1',
                    Gateway: '172.17.0.1',
                    IPAddress: '172.17.0.2',
                    IPPrefixLen: 16,
                    IPv6Gateway: '',
                    GlobalIPv6Address: '',
                    GlobalIPv6PrefixLen: 0,
                    MacAddress: '02:42:ac:11:00:02',
                }
            }
        },
        Mounts: []
    },
    {
        Id: 'container2',
        Names: ['/db-service'],
        Image: 'postgres:13',
        ImageID: 'sha256:abcdef1234567890',
        Command: 'docker-entrypoint.sh postgres',
        Created: Date.now() / 1000 - 86400, // 1 day ago
        Ports: [
            {
                IP: '0.0.0.1',
                PrivatePort: 5432,
                PublicPort: 5432,
                Type: 'tcp'
            }
        ],
        Labels: {
            'com.example.version': '1.0.0'
        },
        State: 'exited',
        Status: 'Exited (0) 5 minutes ago',
        HostConfig: {
            NetworkMode: 'bridge'
        },
        NetworkSettings: {
            Networks: {
                bridge: {
                    IPAMConfig: null,
                    Links: null,
                    Aliases: null,
                    NetworkID: 'network1',
                    EndpointID: 'endpoint2',
                    Gateway: '172.17.0.1',
                    IPAddress: '172.17.0.3',
                    IPPrefixLen: 16,
                    IPv6Gateway: '',
                    GlobalIPv6Address: '',
                    GlobalIPv6PrefixLen: 0,
                    MacAddress: '02:42:ac:11:00:03'
                }
            }
        },
        Mounts: [
            {
                Type: 'volume',
                Source: 'db-data',
                Destination: '/var/lib/postgresql/data',
                Mode: 'rw',
                RW: true,
                Propagation: ''
            }
        ]
    }
];