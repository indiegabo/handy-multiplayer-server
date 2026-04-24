// sg/modules/games/backoffice/use-cases/get-version-crowd-actions.usecase.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVersionCrowdActionsUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/runtime/use-cases/get-version-crowd-actions.usecase';
// CrowdActionsRepository removed; use string token in test DI
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
import { Game } from '@src/modules/sg/core/entities/game.entity';
import {
    CrowdAction,
    CrowdActionMapping,
    VersionCrowdActionsDTO,
} from '@hms/shared-types';

describe('GetVersionCrowdActionsUseCase', () => {
    let useCase: GetVersionCrowdActionsUseCase;
    let crowdActionsRepo: any;
    let versionRepo: jest.Mocked<VersionRepository>;

    const gameId = '11111111-1111-4111-8111-111111111111';
    const versionId = '22222222-2222-4222-8222-222222222222';
    const versionSemver = '1.0.0-beta.1';

    const mockVersion: Partial<Version> = {
        id: versionId,
        entity_type: Game.name,
        entity_id: gameId,
        semver: {
            raw: versionSemver,
            major: 1,
            minor: 0,
            patch: 0,
        },
    };

    const mockActions: CrowdAction[] = [
        {
            identifier: 'action-1',
            name: 'Test Action',
            description: 'A test action',
            args: [],
        },
    ];

    const mockMappings: CrowdActionMapping[] = [
        {
            identifier: 'action-1',
            triggers: [],
            commands: [],
        },
    ];

    beforeEach(async () => {
        const mockCrowdActionsRepo = {};

        const mockVersionRepo = {
            findOne: jest.fn(),
            findOneBySemverRaw: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetVersionCrowdActionsUseCase,
                {
                    provide: 'CrowdActionsRepository',
                    useValue: mockCrowdActionsRepo,
                },
                {
                    provide: VersionRepository,
                    useValue: mockVersionRepo,
                },
            ],
        }).compile();

        useCase = module.get<GetVersionCrowdActionsUseCase>(
            GetVersionCrowdActionsUseCase,
        );
        crowdActionsRepo = module.get('CrowdActionsRepository');
        versionRepo = module.get(VersionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('should resolve by UUID and return crowd actions and mappings', async () => {
            // Arrange
            // prepare version with meta
            const versionWithMeta: Partial<Version> = {
                ...mockVersion,
                runtime: {
                    crowd: {
                        actions: mockActions,
                        mappings: mockMappings,
                    },
                },
            };

            versionRepo.findOne.mockResolvedValue(versionWithMeta as Version);

            // Act
            const result = await useCase.execute(gameId, versionId);

            // Assert
            expect(result).toEqual({
                version_id: versionId,
                actions: mockActions,
                mappings: mockMappings,
            } as VersionCrowdActionsDTO);

            expect(versionRepo.findOne).toHaveBeenCalledWith({
                where: {
                    id: versionId,
                    entity_type: Game.name,
                    entity_id: gameId,
                },
            });
        });

        it('should resolve by SemVer and return crowd actions and mappings', async () => {
            // Arrange
            const versionWithMeta: Partial<Version> = {
                ...mockVersion,
                runtime: {
                    crowd: {
                        actions: mockActions,
                        mappings: mockMappings,
                    },
                },
            };

            versionRepo.findOneBySemverRaw.mockResolvedValue(versionWithMeta as Version);

            // Act
            const result = await useCase.execute(gameId, versionSemver);

            // Assert
            expect(result).toEqual({
                version_id: versionId,
                actions: mockActions,
                mappings: mockMappings,
            } as VersionCrowdActionsDTO);

            expect(versionRepo.findOneBySemverRaw).toHaveBeenCalledWith(
                Game.name,
                gameId,
                versionSemver,
            );

            expect(versionRepo.findOne).not.toHaveBeenCalled();
        });

        it('should return empty arrays when no crowd actions exist', async () => {
            // Arrange
            const versionWithEmptyMeta: Partial<Version> = {
                ...mockVersion,
                runtime: {},
            };

            versionRepo.findOneBySemverRaw.mockResolvedValue(versionWithEmptyMeta as Version);

            // Act
            const result = await useCase.execute(gameId, versionSemver);

            // Assert
            expect(result).toEqual({
                version_id: versionId,
                actions: [],
                mappings: [],
            } as VersionCrowdActionsDTO);
        });

        it('should throw NotFoundException when version does not exist', async () => {
            // Arrange
            versionRepo.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(
                useCase.execute(gameId, versionId),
            ).rejects.toThrow(NotFoundException);

            await expect(
                useCase.execute(gameId, versionId),
            ).rejects.toThrow(
                `Version ${versionId} not found for game ${gameId}`,
            );

            expect(versionRepo.findOne).toHaveBeenCalledWith({
                where: {
                    id: versionId,
                    entity_type: Game.name,
                    entity_id: gameId,
                },
            });
        });

        it('should throw NotFoundException when version belongs to different game', async () => {
            // Arrange
            versionRepo.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(
                useCase.execute('different-game-id', versionId),
            ).rejects.toThrow(NotFoundException);

            expect(versionRepo.findOne).toHaveBeenCalledWith({
                where: {
                    id: versionId,
                    entity_type: Game.name,
                    entity_id: 'different-game-id',
                },
            });
        });

        it('should throw NotFoundException when semver does not exist', async () => {
            // Arrange
            versionRepo.findOneBySemverRaw.mockResolvedValue(null);

            // Act & Assert
            await expect(
                useCase.execute(gameId, versionSemver),
            ).rejects.toThrow(NotFoundException);

            await expect(
                useCase.execute(gameId, versionSemver),
            ).rejects.toThrow(
                `Version ${versionSemver} not found for game ${gameId}`,
            );

            expect(versionRepo.findOneBySemverRaw).toHaveBeenCalledWith(
                Game.name,
                gameId,
                versionSemver,
            );
        });

        it('should handle crowd actions with empty actions array', async () => {
            // Arrange
            const mockCrowdActions: Partial<CrowdActions> = {
                id: 'crowd-actions-id',
                version_id: versionId,
                actions: [],
                mappings: mockMappings,
            };

            const versionWithMeta: Partial<Version> = {
                ...mockVersion,
                runtime: {
                    crowd: {
                        actions: [],
                        mappings: mockMappings,
                    },
                },
            };

            versionRepo.findOneBySemverRaw.mockResolvedValue(versionWithMeta as Version);

            // Act
            const result = await useCase.execute(gameId, versionSemver);

            // Assert
            expect(result.actions).toEqual([]);
            expect(result.mappings).toEqual(mockMappings);
        });

        it('should handle crowd actions with empty mappings array', async () => {
            // Arrange
            const mockCrowdActions: Partial<CrowdActions> = {
                id: 'crowd-actions-id',
                version_id: versionId,
                actions: mockActions,
                mappings: [],
            };

            const versionWithMeta: Partial<Version> = {
                ...mockVersion,
                runtime: {
                    crowd: {
                        actions: mockActions,
                        mappings: [],
                    },
                },
            };

            versionRepo.findOneBySemverRaw.mockResolvedValue(versionWithMeta as Version);

            // Act
            const result = await useCase.execute(gameId, versionSemver);

            // Assert
            expect(result.actions).toEqual(mockActions);
            expect(result.mappings).toEqual([]);
        });
    });
});
