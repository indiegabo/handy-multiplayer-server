import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { MediaService } from
    '@hms-module/modules/media/services/media.service';
import { CreateUserProfilePictureUseCase } from '../../../../../../../../src/modules/hms/modules/users/use-cases/end-users/create-user-profile-picture.usecase';
import { UsersRepository } from '../../../../../../../../src/modules/hms/modules/users/repositories/users.repository';

/**
 * Mock the user->view mapper to avoid coupling with mapper internals.
 * We only need a stable shape for attachToView input/output.
 */
jest.mock('../../../../../../../../src/modules/hms/modules/users/mappers/user.mapper', () => ({
    mapUserToViewDto: (u: any) => ({ id: u.id }),
}));

describe('CreateUserProfilePictureUseCase', () => {
    let useCase: CreateUserProfilePictureUseCase;

    let usersRepo: jest.Mocked<UsersRepository>;
    let mediaService: jest.Mocked<MediaService>;

    /**
     * Utility: build a minimal mock for UsersRepository.
     */
    function createUsersRepoMock(): jest.Mocked<UsersRepository> {
        return {
            findById: jest.fn(),
        } as unknown as jest.Mocked<UsersRepository>;
    }

    /**
     * Utility: build a minimal mock for MediaService.
     */
    function createMediaServiceMock(): jest.Mocked<MediaService> {
        return {
            createUploadUrl: jest.fn(),
            finalizeUploadAndAttach: jest.fn(),
            createMediaFromMulter: jest.fn(),
            attachMedia: jest.fn(),
            attachToView: jest.fn(),
        } as unknown as jest.Mocked<MediaService>;
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateUserProfilePictureUseCase,
                { provide: UsersRepository, useValue: createUsersRepoMock() },
                { provide: MediaService, useValue: createMediaServiceMock() },
            ],
        }).compile();

        useCase = module.get(CreateUserProfilePictureUseCase);
        usersRepo = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
        mediaService = module.get(MediaService) as jest.Mocked<MediaService>;
    });

    describe('requestUploadUrl', () => {
        it('should create a presigned URL when user exists', async () => {
            // Arrange
            const userId = 'user-123';
            usersRepo.findById.mockResolvedValue({ id: userId } as any);

            mediaService.createUploadUrl.mockResolvedValue({
                url: 'https://s3.test/presigned',
                method: 'PUT',
                expires_at: new Date(Date.now() + 900 * 1000),
                // Some implementations may return "file_key" or "key".
                file_key: 'uploads/users/user-123/profile/avatar.png',
                content_type: 'image/png',
            } as any);

            const dto = {
                filename: 'avatar.png',
                content_type: 'image/png',
            } as any;

            // Act
            const result = await useCase.requestUploadUrl(userId, dto);

            // Assert
            expect(usersRepo.findById).toHaveBeenCalledWith(userId);
            expect(mediaService.createUploadUrl).toHaveBeenCalledWith(
                'uploads/users/user-123/profile',
                'avatar.png',
                'image/png',
                900,
            );
            expect(result.url).toBe('https://s3.test/presigned');
            expect(result.method).toBe('PUT');

            // Be resilient to different DTO field names.
            const returnedKey =
                (result as any).file_key ?? (result as any).key;
            expect(returnedKey).toBeDefined();
            expect(String(returnedKey))
                .toContain('uploads/users/user-123/profile');
        });

        it('should throw NotFoundException if user does not exist', async () => {
            // Arrange
            const userId = 'missing-user';
            usersRepo.findById.mockResolvedValue(null);

            const dto = {
                filename: 'avatar.png',
                content_type: 'image/png',
            } as any;

            // Act + Assert
            await expect(useCase.requestUploadUrl(userId, dto))
                .rejects
                .toBeInstanceOf(NotFoundException);

            expect(mediaService.createUploadUrl).not.toHaveBeenCalled();
        });
    });

    describe('finalizeAfterUpload', () => {
        it('should finalize upload, attach, and return user view with profile',
            async () => {
                // Arrange
                const userId = 'user-999';
                const userEntity = { id: userId } as any;

                usersRepo.findById.mockResolvedValue(userEntity);

                mediaService.finalizeUploadAndAttach.mockResolvedValue(undefined);

                const attachedView = {
                    id: userId,
                    profile_picture: {
                        id: 'media-abc',
                        url: 'https://cdn.test/user-999/profile.png',
                    },
                };

                mediaService.attachToView.mockResolvedValue([attachedView] as any);

                const dto = {
                    file_key: 'uploads/users/user-999/profile/avatar.png',
                    filename: 'avatar.png',
                    mimetype: 'image/png',
                    size: 123456,
                    metadata: { foo: 'bar' },
                } as any;

                // Act
                const result = await useCase.finalizeAfterUpload(userId, dto);

                // Assert
                expect(usersRepo.findById).toHaveBeenCalledWith(userId);
                expect(mediaService.finalizeUploadAndAttach).toHaveBeenCalledWith(
                    'uploads/users/user-999/profile/avatar.png',
                    expect.objectContaining({
                        filename: 'avatar.png',
                        mimetype: 'image/png',
                        size: 123456,
                        metadata: { foo: 'bar' },
                        entity: {
                            type: 'User',
                            id: userId,
                            collection: 'profile',
                            asSingleton: true,
                        },
                    }),
                );

                // Reload call
                expect(usersRepo.findById).toHaveBeenCalledTimes(2);

                expect(mediaService.attachToView).toHaveBeenCalledWith(
                    'User',
                    [{ id: userId }],
                    ['profile'],
                    expect.objectContaining({
                        fieldMap: { profile: 'profile_picture' },
                        singletons: ['profile'],
                        includeCollectionsField: false,
                        emitNullForMissing: true,
                        emitEmptyArrayForLists: true,
                    }),
                );

                expect(result.id).toBe(userId);
                expect(result.profile_picture.id).toBe('media-abc');
            });

        it('should throw NotFoundException if user does not exist', async () => {
            // Arrange
            const userId = 'ghost';
            usersRepo.findById.mockResolvedValue(null);

            const dto = {
                file_key: 'uploads/users/ghost/profile/x.png',
                filename: 'x.png',
                mimetype: 'image/png',
                size: 100,
            } as any;

            // Act + Assert
            await expect(useCase.finalizeAfterUpload(userId, dto))
                .rejects
                .toBeInstanceOf(NotFoundException);

            expect(mediaService.finalizeUploadAndAttach).not.toHaveBeenCalled();
            expect(mediaService.attachToView).not.toHaveBeenCalled();
        });
    });

    describe('fromMulter', () => {
        it('should create media, attach as singleton, and return user view',
            async () => {
                // Arrange
                const userId = 'user-321';
                const userEntity = { id: userId } as any;

                usersRepo.findById.mockResolvedValue(userEntity);

                mediaService.createMediaFromMulter.mockResolvedValue({
                    id: 'media-123',
                } as any);

                mediaService.attachMedia.mockResolvedValue(undefined);

                const attachedView = {
                    id: userId,
                    profile_picture: {
                        id: 'media-123',
                        url: 'https://cdn.test/user-321/profile.png',
                    },
                };

                mediaService.attachToView.mockResolvedValue([attachedView] as any);

                const file: Express.Multer.File = {
                    fieldname: 'file',
                    originalname: 'avatar.jpg',
                    encoding: '7bit',
                    mimetype: 'image/jpeg',
                    size: 234567,
                    buffer: Buffer.from('fake'),
                    destination: '',
                    filename: '',
                    path: '',
                    stream: null as any,
                };

                const metadata = { origin: 'web' };

                // Act
                const result = await useCase.fromMulter(userId, file, metadata);

                // Assert
                expect(usersRepo.findById).toHaveBeenCalledWith(userId);

                expect(mediaService.createMediaFromMulter).toHaveBeenCalledWith(
                    file,
                    metadata,
                );

                expect(mediaService.attachMedia).toHaveBeenCalledWith(
                    'User',
                    userId,
                    'media-123',
                    'profile',
                    { asSingleton: true },
                );

                // Reload call
                expect(usersRepo.findById).toHaveBeenCalledTimes(2);

                expect(mediaService.attachToView).toHaveBeenCalledWith(
                    'User',
                    [{ id: userId }],
                    ['profile'],
                    expect.objectContaining({
                        fieldMap: { profile: 'profile_picture' },
                        singletons: ['profile'],
                        includeCollectionsField: false,
                        emitNullForMissing: true,
                        emitEmptyArrayForLists: true,
                    }),
                );

                expect(result.id).toBe(userId);
                expect(result.profile_picture.id).toBe('media-123');
            });

        it('should throw NotFoundException if user does not exist', async () => {
            // Arrange
            const userId = 'nope';
            usersRepo.findById.mockResolvedValue(null);

            const file = {
                fieldname: 'file',
                originalname: 'avatar.png',
                encoding: '7bit',
                mimetype: 'image/png',
                size: 1234,
                buffer: Buffer.from('x'),
                destination: '',
                filename: '',
                path: '',
                stream: null as any,
            } as Express.Multer.File;

            // Act + Assert
            await expect(useCase.fromMulter(userId, file))
                .rejects
                .toBeInstanceOf(NotFoundException);

            expect(mediaService.createMediaFromMulter).not.toHaveBeenCalled();
            expect(mediaService.attachMedia).not.toHaveBeenCalled();
            expect(mediaService.attachToView).not.toHaveBeenCalled();
        });
    });
});
