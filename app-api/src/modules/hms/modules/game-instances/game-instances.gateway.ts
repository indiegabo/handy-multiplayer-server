import { OnGatewayConnection, OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { Server } from "socket.io";
import { ConfigService } from "@nestjs/config";
import { GameInstancesService } from "./game-instances.service";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";

@WebSocketGateway()
export class GameInstanceGateway implements OnGatewayConnection, OnGatewayInit {

    private _server: Server;

    constructor(
        private logger: BetterLogger,
        private configService: ConfigService,
        private instancesService: GameInstancesService,
    ) {
        this.logger.setContext(GameInstanceGateway.name);
    }

    handleConnection(client: any, ...args: any[]) {
        this.logger.log(`Client connected on ${GameInstanceGateway.name}: ${client.id} (${client.handshake.address})`);
    }

    /**
     * Called after the WebSocket server is initialized.
     * This method sets up the authorization middleware for the namespace.
     */
    afterInit(server: Server) {
        this._server = server;

        // Apply the authorization middleware to the namespace
        // namespace.use(this.authorizationMiddleware.bind(this));
        this.instancesService.setSocketServer(this._server);
    }
}