import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { MediaService } from
    '@hms-module/modules/media/services/media.service';
import { PresignedURLDTO } from
    '@hms-module/modules/storage/dto/presigned-url.dto';
import { FinalizeProfileUploadDto, MediaView, RequestProfileUploadUrlDto, UserBackofficeViewDto } from "@hms/shared-types/hms";
import { UsersRepository } from '../../repositories/users.repository';
import { User } from '../../entities/user.entity';
import { mapUserToViewDto } from '../../mappers/user.mapper';

/**
 * Use case to create (or replace) a user's profile picture.
 * Supports:
 * - S3 presigned upload (request URL, finalize)
 * - Multer direct upload
 */
@Injectable()
export class CreateUserProfilePictureUseCase {
    constructor(
        private readonly usersRepo: UsersRepository,
        private readonly mediaService: MediaService,
    ) { }

    /**
     * Starts the presigned flow: generates a PUT URL for S3.
     */
    async requestUploadUrl(
        userId: string,
        dto: RequestProfileUploadUrlDto,
    ): Promise<PresignedURLDTO> {
        await this.assertUserExists(userId);

        // You can customize the key prefix strategy here.
        const keyPrefix = `uploads/users/${userId}/profile`;
        return this.mediaService.createUploadUrl(
            keyPrefix,
            dto.filename,
            dto.content_type,
            900,
        );
    }

    /**
     * Finalizes the presigned flow:
     * - Creates Media from the uploaded object
     * - Attaches as singleton to collection 'profile'
     * - Returns the updated user with profile_picture
     */
    async finalizeAfterUpload(
        userId: string,
        dto: FinalizeProfileUploadDto,
    ): Promise<UserBackofficeViewDto> {
        await this.assertUserExists(userId);

        await this.mediaService.finalizeUploadAndAttach(
            dto.file_key,
            {
                filename: dto.filename,
                mimetype: dto.mimetype,
                size: dto.size,
                metadata: dto.metadata,
                entity: {
                    type: 'User',
                    id: userId,
                    collection: 'profile',
                    asSingleton: true,
                },
            },
        );

        // Reload the user minimal data and attach profile as MediaView
        const user = await this.usersRepo.findById(userId);
        const [withMedia] = await this.mediaService.attachToView(
            User.name,
            [mapUserToViewDto(user!)],
            ['profile'],
            {
                fieldMap: { profile: 'profile_picture' },
                singletons: ['profile'],
                includeCollectionsField: false,
                emitNullForMissing: true,
                emitEmptyArrayForLists: true,
            },
        );

        return withMedia as UserBackofficeViewDto;
    }

    /**
     * Direct upload via multer:
     * - Persists media from Express.Multer.File
     * - Attaches as singleton to collection 'profile'
     * - Returns the updated user with profile_picture
     */
    async fromMulter(
        userId: string,
        file: Express.Multer.File,
        metadata?: Record<string, any>,
    ): Promise<UserBackofficeViewDto> {
        await this.assertUserExists(userId);

        const media = await this.mediaService.createMediaFromMulter(
            file,
            metadata,
        );

        await this.mediaService.attachMedia(
            'User',
            userId,
            media.id,
            'profile',
            { asSingleton: true },
        );

        const user = await this.usersRepo.findById(userId);
        const [withMedia] = await this.mediaService.attachToView(
            'User',
            [mapUserToViewDto(user!)],
            ['profile'],
            {
                fieldMap: { profile: 'profile_picture' },
                singletons: ['profile'],
                includeCollectionsField: false,
                emitNullForMissing: true,
                emitEmptyArrayForLists: true,
            },
        );

        return withMedia as UserBackofficeViewDto;
    }

    /**
     * Ensures the user exists. Throws if not.
     */
    private async assertUserExists(userId: string): Promise<void> {
        const exists = await this.usersRepo.findById(userId);
        if (!exists) {
            throw new NotFoundException('User not found');
        }
    }
}
