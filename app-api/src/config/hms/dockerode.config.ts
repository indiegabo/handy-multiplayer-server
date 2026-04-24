import { DockerodeGameBuildMetadata } from "@src/modules/hms/modules/game-instances/instance-containers/dockerode-data";


export const GAME_SERVER_BUILDS: DockerodeGameBuildMetadata[] = [
    {
        identifier: 'server-1',
        imageTag: 'latest',
        directoryLocation: 'unity-server',
    },
];