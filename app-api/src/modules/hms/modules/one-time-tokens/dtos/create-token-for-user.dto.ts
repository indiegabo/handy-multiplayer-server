import { IsOptional, IsString } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';

export class CreateTokenForUserDTO {

    readonly user: User | AdminUser;

    @IsString()
    @IsOptional()
    readonly data?: any;

    @IsString()
    @IsOptional()
    readonly ttl?: number;
}
