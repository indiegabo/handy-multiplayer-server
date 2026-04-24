import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaService } from '@hms-module/modules/media/services/media.service';
import { UserBackofficeViewDto } from "@hms/shared-types/hms";
import { UsersRepository } from '../../repositories/users.repository';
import { mapUserToViewDto } from '../../mappers/user.mapper';
import { User } from '../../entities/user.entity';

/**
 * Use case for fetching an end user by username.
 * Attaches profile picture as MediaView when available.
 */
@Injectable()
export class GetEndUserByUsernameUseCase {
    constructor(
        private readonly usersRepo: UsersRepository,
        private readonly mediaService: MediaService,
    ) { }

    /**
     * Fetches a user by username, maps to view dto and attaches media.
     * @throws NotFoundException if user is not found.
     */
    async execute(username: string): Promise<UserBackofficeViewDto> {
        const user = await this.usersRepo.findByUsername(username);
        if (!user) {
            throw new NotFoundException('User not found.');
        }

        const dto = mapUserToViewDto(user);

        const [withMedia] = await this.mediaService.attachToView(
            User.name,
            [dto],
            ['profile'],
            {
                fieldMap: { profile: 'profile_picture' },
                singletons: ['profile'],
            },
        );

        return withMedia ?? dto;
    }
}
