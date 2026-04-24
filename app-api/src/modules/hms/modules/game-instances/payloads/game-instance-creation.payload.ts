import { IsString, IsOptional } from 'class-validator';

export class GameInstanceCreationPayload {
    @IsString()
    identifier: string;

    @IsString()
    @IsOptional()
    custom_id?: string;
}