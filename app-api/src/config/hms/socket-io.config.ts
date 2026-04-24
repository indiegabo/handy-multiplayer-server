export const SOCKET_IO_CONFIG = {
    /**
    * The namespace used for SocketIO communications for game instances as 
    * the game build will need to connect to this NestJS SocketIO server.
    * 
    * Example of host URI used in the game build  http://{host}:{port}/{socketNamespace}
    */
    gameInstancesNamespace: 'game-instances-socket',
}