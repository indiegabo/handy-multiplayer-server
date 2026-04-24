import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateVersionCrowdMappingsUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/crowd-actions/update-version-crowd-mappings.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
// legacy CrowdActions entity removed; tests use meta-based shapes now
import { Game } from '@src/modules/sg/core/entities/game.entity';
import {
    CrowdActionMapping,
    CrowdAction,
    ArgumentType,
    ConnectionPlatform,
} from '@hms/shared-types';

describe('UpdateVersionCrowdMappingsUseCase', () => {
    let useCase: UpdateVersionCrowdMappingsUseCase;
    let versionRepo: jest.Mocked<VersionRepository>;

    const gameId = 'game-id-123';
    const versionId = 'version-id-456';

    const validMappings: CrowdActionMapping[] = [
        {
            identifier: 'jump',
            triggers: [
                {
                    platform: ConnectionPlatform.Twitch,
                    trigger_type: 'channel_points',
                    conditions: { reward_id: 'abc123' },
                    is_enabled: true,
                },
            ],
            commands: [
                {
                    name: 'jump',
                    aliases: ['!jump', '!pular'],
                    description: 'Make the player jump',

                    global_cooldown: 5,
                    user_cooldown: 30,
                    admin_only: false,
                    is_enabled: true,
                },
            ],
        },
        {
            identifier: 'spawn-enemy',
            triggers: [],
            commands: [
                {
                    name: 'spawn',
                    aliases: ['!spawn'],
                    description: 'Spawn an enemy',
                    global_cooldown: 10,
                    user_cooldown: 60,
                    admin_only: true,
                    is_enabled: true,
                },
            ],
        },
    ];

    const existingActions: CrowdAction[] = [
        {
            identifier: 'jump',
            name: 'Jump',
            description: 'Make the player jump',
            args: [
                {
                    key: 'height',
                    type: ArgumentType.Float,
                    required: true,
                },
            ],
        },
    ];

    beforeEach(async () => {
        const mockVersionRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateVersionCrowdMappingsUseCase,
                {
                    provide: VersionRepository,
                    useValue: mockVersionRepo,
                },
            ],
        }).compile();

        useCase = module.get<UpdateVersionCrowdMappingsUseCase>(
            UpdateVersionCrowdMappingsUseCase,
        );
        versionRepo = module.get(VersionRepository);
    });

    describe('execute', () => {
        it('should throw NotFoundException when version does not exist', async () => {
            versionRepo.findOne.mockResolvedValue(null);

            await expect(
                useCase.execute(gameId, versionId, validMappings),
            ).rejects.toThrow(NotFoundException);

            expect(versionRepo.findOne).toHaveBeenCalledWith({
                where: {
                    id: versionId,
                    entity_type: Game.name,
                    entity_id: gameId,
                },
            });
        });

        it('should update crowd mappings successfully', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const existingCrowdActions: any = {
                id: 'ca-id-1',
                version_id: versionId,
                actions: existingActions,
                mappings: [],
            };

            const updatedCrowdActions: any = {
                id: 'ca-id-1',
                version_id: versionId,
                actions: existingActions,
                mappings: validMappings,
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);
            (mockVersion as any).runtime = {
                crowd: {
                    actions: existingActions,
                    mappings: [],
                },
            };

            versionRepo.save.mockResolvedValue({ ...mockVersion, runtime: (mockVersion as any).runtime });

            const result = await useCase.execute(gameId, versionId, validMappings);

            expect(versionRepo.findOne).toHaveBeenCalledWith({
                where: {
                    id: versionId,
                    entity_type: Game.name,
                    entity_id: gameId,
                },
            });
            expect(versionRepo.save).toHaveBeenCalled();
            expect(result).toEqual({
                version_id: versionId,
                actions: existingActions,
                mappings: validMappings,
            });
        });

        it('should create new crowd mappings when none exist', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const newCrowdActions: any = {
                id: 'ca-id-new',
                version_id: versionId,
                actions: [],
                mappings: validMappings,
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);
            (mockVersion as any).runtime = {};
            versionRepo.save.mockResolvedValue({ ...mockVersion, runtime: (mockVersion as any).runtime });

            const result = await useCase.execute(gameId, versionId, validMappings);

            expect(versionRepo.save).toHaveBeenCalled();
            expect(result).toEqual({
                version_id: versionId,
                actions: [],
                mappings: validMappings,
            });
        });

        it('should throw BadRequestException when mappings is not an array', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, {} as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when mapping is missing identifier', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    triggers: [],
                    commands: [],
                },
            ] as CrowdActionMapping[];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when mapping triggers is not an array', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: 'invalid' as any,
                    commands: [],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when mapping commands is not an array', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: [],
                    commands: 'invalid' as any,
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when trigger is missing platform', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: [
                        {
                            trigger_type: 'channel_points',
                            conditions: {},
                            is_enabled: true,
                        },
                    ],
                    commands: [],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when trigger is missing trigger_type', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: [
                        {
                            platform: ConnectionPlatform.Twitch,
                            conditions: {},
                            is_enabled: true,
                        },
                    ],
                    commands: [],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when trigger is missing is_enabled', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: [
                        {
                            platform: ConnectionPlatform.Twitch,
                            trigger_type: 'channel_points',
                            conditions: {},
                        },
                    ],
                    commands: [],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when command is missing name', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: [],
                    commands: [
                        {
                            aliases: ['!jump'],
                            description: 'Jump command',
                            global_cooldown: 5,
                            user_cooldown: 30,
                            admin_only: false,
                            is_enabled: true,
                        },
                    ],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when command aliases is not an array', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: [],
                    commands: [
                        {
                            name: 'jump',
                            aliases: 'invalid' as any,
                            description: 'Jump command',
                            global_cooldown: 5,
                            user_cooldown: 30,
                            admin_only: false,
                            is_enabled: true,
                        },
                    ],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when command is missing cooldown fields', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidMappings = [
                {
                    identifier: 'jump',
                    triggers: [],
                    commands: [
                        {
                            name: 'jump',
                            aliases: ['!jump'],
                            description: 'Jump command',
                            admin_only: false,
                            is_enabled: true,
                        },
                    ],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidMappings as CrowdActionMapping[]),
            ).rejects.toThrow(BadRequestException);
        });



        it('should throw BadRequestException when duplicate identifiers exist', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const duplicateMappings: CrowdActionMapping[] = [
                {
                    identifier: 'jump',
                    triggers: [],
                    commands: [],
                },
                {
                    identifier: 'jump',
                    triggers: [],
                    commands: [],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, duplicateMappings),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
