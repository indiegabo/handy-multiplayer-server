export const GAME_INSTANCES_CONFIG = {

    /**
     * Configuration for the range of ports used to create game instances.
     *
     * This range determines the minimum and maximum ports that can be assigned
     * to game instances. It also defines the maximum number of instances that
     * can be created based on the available ports in this range.
     */
    ports: {
        /**
         * Minimum port number in the range.
         * Game instances will be assigned port numbers starting from this value.
         */
        startingPoolNumber: 4550,
    },

    /**
     * The maximum number of game instances that can be up at the same time.
     */
    maxSimultaneousInstances: 20,

    /**
     * The game server build port.
     *
     * This is the port that the game's client code will need to connect to
     * in order to communicate with the instance.
     */
    internalPort: 4550,

    /**
     * Docker network name where all game instance containers are connected.
     * This network is created in when the main docker container is started.
     * 
     * It needs to match the docker-compose.yml network name.
     */
    dockerNetworkName: 'hms-internal-network',

    /**
     * The Docker image tag used to run the game instance.
     * This tag is used to build the Docker image for the game.
     */
    dockerImageTag: 'indiegabo/hms-game-instance:latest',

    /**
     * The prefix used to name the Docker containers created by the
     * DockerodeContainerProvider.
     */
    dockerContainerPrefix: 'HMS-GAME-INSTANCE',

    /**
     * The timeout in seconds for the alive signal sent by game instances.
     * If no signal is received within this timeframe, the game instance is
     * considered to be offline and will be destroyed.
     */
    aliveSignalTimeout: 1000 * 60 * 1, // 1 minute

    /**
     * The type of container provider used to create game instances.
     * The DockerodeContainerProvider is the default provider.
     */
    defaultInstanceContainerProvider: 'dockerode',

    heartbeats: {
        /**
         * The maximum number of heartbeats that can be missed before a game instance
         * is considered offline and destroyed.
         */
        maxMissed: 3,

        /**
         * The interval in milliseconds at which heartbeats should be sent from 
         * the actual game instance to the HMS api.
         */
        interval: 1000 * 10 // 10 seconds
    },

    /**
     * Players configuration
     */
    players: {
        joinTimeout: 1000 * 60, // 1 minute
    }
};