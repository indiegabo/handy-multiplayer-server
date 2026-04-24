export type DockerContainerEvent = {
    Type: 'container';
    Action: 'create' | 'start' | 'die' | 'destroy' | 'stop' | 'kill' | 'restart' | 'pause' | 'unpause' | 'oom';
    Actor: {
        ID: string;
        Attributes: {
            name?: string;
            image?: string;
            exitCode?: string;
            signal?: string;
            // Additional attributes that may appear in different events
            [key: string]: string | undefined;
        };
    };
    time: number;
    timeNano: number;
    status?: string;
    id?: string;  // Alternative to Actor.ID in some versions
};