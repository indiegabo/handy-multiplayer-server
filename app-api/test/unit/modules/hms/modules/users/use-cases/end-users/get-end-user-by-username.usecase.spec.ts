import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { GetEndUserByUsernameUseCase } from
    '../../../../../../../../src/modules/hms/modules/users/use-cases/end-users/get-end-user-by-username.usecase';
import { MediaService } from
    '@hms-module/modules/media/services/media.service';
import { UsersRepository } from '../../../../../../../../src/modules/hms/modules/users/repositories/users.repository';
import { User } from '../../../../../../../../src/modules/hms/modules/users/entities/user.entity';

/**
 * Keep mapper simple to avoid coupling the test to mapping details.
 * Only ensure an id is present for attachToView to work with.
 */
jest.mock('../../../../../../../../src/modules/hms/modules/users/mappers/user.mapper', () => ({
    mapUserToViewDto: (u: any) => ({ id: u.id }),
}));

describe('GetEndUserByUsernameUseCase', () => {
    let useCase: GetEndUserByUsernameUseCase;

    let usersRepo: jest.Mocked<UsersRepository>;
    let mediaService: jest.Mocked<MediaService>;

    /**
     * Minimal UsersRepository mock.
     */
    function createUsersRepoMock(): jest.Mocked<UsersRepository> {
        return {
            findByUsername: jest.fn(),
        } as unknown as jest.Mocked<UsersRepository>;
    }

    /**
     * Minimal MediaService mock.
     */
    function createMediaServiceMock(): jest.Mocked<MediaService> {
        return {
            attachToView: jest.fn(),
        } as unknown as jest.Mocked<MediaService>;
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetEndUserByUsernameUseCase,
                { provide: UsersRepository, useValue: createUsersRepoMock() },
                { provide: MediaService, useValue: createMediaServiceMock() },
            ],
        }).compile();

        useCase = module.get(GetEndUserByUsernameUseCase);
        usersRepo = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
        mediaService = module.get(MediaService) as jest.Mocked<MediaService>;
    });

    describe('execute', () => {
        it('should return dto enriched with profile media when available',
            async () => {
                // Arrange
                const username = 'player1';
                const userEntity = { id: 'u-1', username } as any;

                usersRepo.findByUsername.mockResolvedValue(userEntity);

                const enriched = {
                    id: 'u-1',
                    profile_picture: {
                        id: 'media-123',
                        url: 'https://cdn.example/u-1.png',
                    },
                };

                mediaService.attachToView.mockResolvedValue([enriched] as any);

                // Act
                const result = await useCase.execute(username);

                // Assert
                expect(usersRepo.findByUsername).toHaveBeenCalledWith(username);
                expect(mediaService.attachToView).toHaveBeenCalledWith(
                    User.name,
                    [{ id: 'u-1' }],
                    ['profile'],
                    {
                        fieldMap: { profile: 'profile_picture' },
                        singletons: ['profile'],
                    },
                );
                expect(result.id).toBe('u-1');
                expect(result.profile_picture?.id).toBe('media-123');
            });

        it('should return plain dto if attachToView returns empty/undefined',
            async () => {
                // Arrange
                const username = 'player2';
                const userEntity = { id: 'u-2', username } as any;

                usersRepo.findByUsername.mockResolvedValue(userEntity);
                mediaService.attachToView.mockResolvedValue([undefined] as any);

                // Act
                const result = await useCase.execute(username);

                // Assert
                expect(result).toEqual({ id: 'u-2' });
                expect(result.profile_picture).toBeUndefined();
            });

        it('should throw NotFoundException when user does not exist', async () => {
            // Arrange
            const username = 'missing';
            usersRepo.findByUsername.mockResolvedValue(null);

            // Act + Assert
            await expect(useCase.execute(username))
                .rejects
                .toBeInstanceOf(NotFoundException);

            expect(mediaService.attachToView).not.toHaveBeenCalled();
        });
    });
});
