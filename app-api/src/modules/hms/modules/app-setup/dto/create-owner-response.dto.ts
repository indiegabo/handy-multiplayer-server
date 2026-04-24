import { ConnectionStatusDto } from "./connection-status.dto";

export class OwnerResponseDto {
    id: string;
    email: string;
    name: string;
    created_at: Date;
}

export class CreateOwnerResponseDto {
    success: boolean;
    owner: OwnerResponseDto;
    servicesStatus: ConnectionStatusDto[];
}

export type OwnerCheckUpDto = {
    owner: OwnerResponseDto;
    two_fa_enabled: boolean;
}

export type OwnerCreationStartResponseDto = {
    email: string;
    qrcode_url: string;
    manual_entry_code: string;
    setup_token: string;
}