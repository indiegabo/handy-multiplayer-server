import { MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { BetterLogger } from "@src/modules/hms/modules/better-logger/better-logger.service";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    namespace: 'api-socket'
})
export class TestGateway implements OnGatewayConnection, OnGatewayInit {

    constructor(
        private logger: BetterLogger
    ) {
        this.logger.setContext(TestGateway.name);
    }

    handleConnection(client: any, ...args: any[]) {
        this.logger.log(`Client connected on ${TestGateway.name}: ${client.id} (${client.handshake.address})`);
    }

    afterInit(server: Server) {
    }

    @SubscribeMessage('test.hello')
    handleHello() {
        this.logger.debug(`Hello from ${TestGateway.name}`);
    }
}