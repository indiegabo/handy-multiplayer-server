import { IsArray, IsOptional, IsUUID } from "class-validator";

export class STCreationPayloadDTO {
    @IsArray()
    scopes: string[];

    @IsOptional()
    data?: any;
}
