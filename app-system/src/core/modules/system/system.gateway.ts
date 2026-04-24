import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SystemStatusData } from '@hms/shared-types/hms';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SystemGateway implements OnGatewayInit {
    private readonly logger = new Logger(SystemGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
    ) {
    }

    afterInit(server: any) {
        this.logger.log('MaintenanceGateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        // Você pode adicionar lógica de autenticação aqui se necessário
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    // Método para notificar sobre estado de manutenção (para todos no namespace)
    notifySystemStatus(
        payload: SystemStatusData
    ) {
        this.server.emit('status', payload);
    }

    // Se precisar enviar para um client específico
    notifySingleClient(clientId: string, payload: SystemStatusData) {
        this.server.to(clientId).emit('status', payload);
    }
}