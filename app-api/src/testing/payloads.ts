import { InstanceStatus } from "@src/modules/hms/modules/game-instances/game-instance";
import { IsString } from "class-validator";

export class JoinInstancePayload {
    @IsString()
    instance_id: string;
}

export type JoinInstanceData = {
    bridge_token: string;
    connectivity: InstanceConnectivityData;
}

export type InstanceConnectivityData = {
    instance_id: string;
    status: InstanceStatus;
    tcp_port: number;
    udp_port: number;
}