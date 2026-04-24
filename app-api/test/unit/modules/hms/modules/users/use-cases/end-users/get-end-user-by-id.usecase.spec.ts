import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { GetEndUserByIdUseCase } from
    '../../../../../../../../src/modules/hms/modules/users/use-cases/end-users/get-end-user-by-id.usecase';
import { MediaService } from
    '@hms-module/modules/media/services/media.service';
import { UsersRepository } from '../../../../../../../../src/modules/hms/modules/users/repositories/users.repository';
import { User } from '../../../../../../../../src/modules/hms/modules/users/entities/user.entity';

/**
 * Keep the mapper minimal to avoid coupling the test to mapping details.
 * We only need a stable shape (id) that attachToView knows how to enrich.
 */
jest.mock('../../../../../../../../src/modules/hms/modules/users/mappers/user.mapper', () => ({
    mapUserToViewDto: (u: any) => ({ id: u.id }),
}));

describe('GetEndUserByIdUseCase', () => {
    let useCase: GetEndUserByIdUseCase;

    let usersRepo: jest.Mocked<UsersRepository>;
    let mediaService: jest.Mocked<MediaService>;

    /**
     * Minimal UsersRepository mock.
     */
    function createUsersRepoMock(): jest.Mocked<UsersRepository> {
        return {
            findById: jest.fn(),
        } as unknown as jest.Mocked<UsersRepository>;
    }

    /**
     * Minimal MediaService mock (only what we use).
     */
    function createMediaServiceMock(): jest.Mocked<MediaService> {
        return {
            attachToView: jest.fn(),
        } as unknown as jest.Mocked<MediaService>;
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetEndUserByIdUseCase,
                { provide: UsersRepository, useValue: createUsersRepoMock() },
                { provide: MediaService, useValue: createMediaServiceMock() },
            ],
        }).compile();

        useCase = module.get(GetEndUserByIdUseCase);
        usersRepo = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
        mediaService = module.get(MediaService) as jest.Mocked<MediaService>;
    });

    describe('execute', () => {
        it('should return user dto enriched with profile media when available',
            async () => {
                // Arrange
                const userId = 'user-1';
                const userEntity = { id: userId } as any;

                usersRepo.findById.mockResolvedValue(userEntity);

                const enriched = {
                    id: userId,
                    profile_picture: {
                        id: 'media-123',
                        url: 'https://cdn.example/user-1.png',
                    },
                };

                mediaService.attachToView.mockResolvedValue([enriched] as any);

                // Act
                const result = await useCase.execute(userId);

                // Assert
                expect(usersRepo.findById).toHaveBeenCalledWith(userId);

                expect(mediaService.attachToView).toHaveBeenCalledWith(
                    User.name,
                    [{ id: userId }],
                    ['profile'],
                    {
                        fieldMap: { profile: 'profile_picture' },
                        singletons: ['profile'],
                    },
                );

                expect(result.id).toBe(userId);
                expect(result.profile_picture?.id).toBe('media-123');
            });

        it('should return plain dto if attachToView returns empty or undefined',
            async () => {
                // Arrange
                const userId = 'user-2';
                const userEntity = { id: userId } as any;

                usersRepo.findById.mockResolvedValue(userEntity);

                // Simulate "no enrichment"
                mediaService.attachToView.mockResolvedValue([undefined] as any);

                // Act
                const result = await useCase.execute(userId);

                // Assert
                expect(result).toEqual({ id: userId });
                expect(result.profile_picture).toBeUndefined();
            });

        it('should throw NotFoundException when user does not exist', async () => {
            // Arrange
            const userId = 'missing';
            usersRepo.findById.mockResolvedValue(null);

            // Act + Assert
            await expect(useCase.execute(userId))
                .rejects
                .toBeInstanceOf(NotFoundException);

            expect(mediaService.attachToView).not.toHaveBeenCalled();
        });
    });
});
