import { AdminUserAuthInfoDto } from "../auth";

export type OwnerCheckUpDto = {
    owner: AdminUserAuthInfoDto;
    two_fa_enabled: boolean;
}

export type StartOwnerCreationDto = {
    email: string;
}