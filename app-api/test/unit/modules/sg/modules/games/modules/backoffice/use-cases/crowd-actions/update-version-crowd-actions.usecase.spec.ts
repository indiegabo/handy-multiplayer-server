import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { UpdateVersionCrowdActionsUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/crowd-actions/update-version-crowd-actions.usecase';
// CrowdActionsRepository removed; use string token in test DI
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
// legacy CrowdActions entity removed; tests use runtime-based shapes now
import { Game } from '@src/modules/sg/core/entities/game.entity';
import { CrowdAction, ArgumentType, ChatCommand } from '@hms/shared-types';

describe('UpdateVersionCrowdActionsUseCase', () => {
    let useCase: UpdateVersionCrowdActionsUseCase;
    let crowdActionsRepo: any;
    let versionRepo: jest.Mocked<VersionRepository>;

    const gameId = 'game-id-123';
    const versionId = 'version-id-456';

    const validActions: CrowdAction[] = [
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
        {
            identifier: 'spawn-enemy',
            name: 'Spawn Enemy',
            description: 'Spawn an enemy',
            args: [],
        },
    ];

    beforeEach(async () => {
        const mockCrowdActionsRepo = {};

        const mockVersionRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateVersionCrowdActionsUseCase,
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

        useCase = module.get<UpdateVersionCrowdActionsUseCase>(
            UpdateVersionCrowdActionsUseCase,
        );
        crowdActionsRepo = module.get('CrowdActionsRepository');
        versionRepo = module.get(VersionRepository);
    });

    describe('execute', () => {
        it('should throw NotFoundException when version does not exist', async () => {
            versionRepo.findOne.mockResolvedValue(null);

            await expect(
                useCase.execute(gameId, versionId, validActions),
            ).rejects.toThrow(NotFoundException);

            expect(versionRepo.findOne).toHaveBeenCalledWith({
                where: {
                    id: versionId,
                    entity_type: Game.name,
                    entity_id: gameId,
                },
            });
        });

        it('should update crowd actions successfully', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const existingCrowdActions: any = {
                id: 'ca-id-1',
                version_id: versionId,
                actions: [],
                mappings: [
                    {
                        identifier: 'jump',
                        triggers: [],
                        commands: [{
                            name: 'jump',
                            aliases: ['!jump'],
                            description: 'Jump command',
                            args: [],
                            global_cooldown: 0,
                            user_cooldown: 0,
                            admin_only: false,
                            is_enabled: true,
                        }],
                    },
                ],
            };

            const updatedCrowdActions: any = {
                id: 'ca-id-1',
                version_id: versionId,
                actions: validActions,
                mappings: existingCrowdActions.mappings,
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            // existing mappings should be preserved from runtime
            (mockVersion as any).runtime = {
                crowd: {
                    actions: [],
                    mappings: existingCrowdActions.mappings,
                },
            };

            versionRepo.save.mockResolvedValue({ ...mockVersion, runtime: (mockVersion as any).runtime });

            const result = await useCase.execute(gameId, versionId, validActions);

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
                actions: validActions,
                mappings: existingCrowdActions.mappings,
            });
        });

        it('should create new crowd actions when none exist', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const newCrowdActions: any = {
                id: 'ca-id-new',
                version_id: versionId,
                actions: validActions,
                mappings: [],
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);
            (mockVersion as any).runtime = {};
            versionRepo.save.mockResolvedValue({ ...mockVersion, runtime: (mockVersion as any).runtime });

            const result = await useCase.execute(gameId, versionId, validActions);

            expect(versionRepo.save).toHaveBeenCalled();
            expect(result).toEqual({
                version_id: versionId,
                actions: validActions,
                mappings: [],
            });
        });

        it('should throw BadRequestException when actions is not an array', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            // existing runtime preserved
            (mockVersion as any).runtime = {
                crowd: {
                    actions: [],
                    mappings: [],
                },
            };
            versionRepo.save.mockResolvedValue({ ...mockVersion, runtime: (mockVersion as any).runtime });

            const invalidActions = [
                {
                    name: 'Jump',
                    description: 'Make the player jump',
                    args: [],
                },
            ] as CrowdAction[];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidActions),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when action is missing name', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            (mockVersion as any).runtime = {};
            versionRepo.save.mockResolvedValue({ ...mockVersion, runtime: (mockVersion as any).runtime });

            const invalidActions = [
                {
                    identifier: 'jump',
                    description: 'Make the player jump',
                    args: [],
                },
            ] as CrowdAction[];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidActions),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when action is missing description', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidActions = [
                {
                    identifier: 'jump',
                    name: 'Jump',
                    args: [],
                },
            ] as CrowdAction[];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidActions),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when action args is not an array', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidActions = [
                {
                    identifier: 'jump',
                    name: 'Jump',
                    description: 'Make the player jump',
                    args: 'invalid' as any,
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidActions as CrowdAction[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when argument is missing key', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidActions = [
                {
                    identifier: 'jump',
                    name: 'Jump',
                    description: 'Make the player jump',
                    args: [{ type: ArgumentType.Float, required: true }],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidActions as CrowdAction[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when argument is missing type', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const invalidActions = [
                {
                    identifier: 'jump',
                    name: 'Jump',
                    description: 'Make the player jump',
                    args: [{ key: 'height', required: true }],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, invalidActions as CrowdAction[]),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when duplicate identifiers exist', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
            };

            const duplicateActions: CrowdAction[] = [
                {
                    identifier: 'jump',
                    name: 'Jump',
                    description: 'Make the player jump',
                    args: [],
                },
                {
                    identifier: 'jump',
                    name: 'Another Jump',
                    description: 'Duplicate identifier',
                    args: [],
                },
            ];

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            await expect(
                useCase.execute(gameId, versionId, duplicateActions),
            ).rejects.toThrow(BadRequestException);
        });

        it('should accept and persist default_value when argument type is not none', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
                runtime: {
                    crowd: {
                        actions: [],
                        mappings: [],
                    },
                } as any,
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);
            versionRepo.save.mockImplementation(async (entity: any) => entity);

            const actionsWithDefaultValue: CrowdAction[] = [
                {
                    identifier: 'set-speed',
                    name: 'Set Speed',
                    description: 'Set player speed',
                    args: [
                        {
                            key: 'speed',
                            type: ArgumentType.Float,
                            required: false,
                            default_value: 1.25,
                        } as any,
                    ],
                },
            ];

            const result = await useCase.execute(
                gameId,
                versionId,
                actionsWithDefaultValue,
            );

            expect(result.actions[0].args[0]).toMatchObject({
                key: 'speed',
                type: ArgumentType.Float,
                required: false,
                default_value: 1.25,
            });

            const savedVersion = versionRepo.save.mock.calls[0][0] as any;
            expect(savedVersion.runtime.crowd.actions[0].args[0]).toMatchObject({
                key: 'speed',
                type: ArgumentType.Float,
                required: false,
                default_value: 1.25,
            });
        });

        it('should normalize legacy defaultValue to default_value when persisting', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
                runtime: {
                    crowd: {
                        actions: [],
                        mappings: [],
                    },
                } as any,
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);
            versionRepo.save.mockImplementation(async (entity: any) => entity);

            const actionsWithLegacyDefault: CrowdAction[] = [
                {
                    identifier: 'set-lives',
                    name: 'Set Lives',
                    description: 'Set player lives',
                    args: [
                        {
                            key: 'lives',
                            type: ArgumentType.Integer,
                            required: false,
                            defaultValue: 3,
                        } as any,
                    ],
                },
            ];

            await useCase.execute(
                gameId,
                versionId,
                actionsWithLegacyDefault,
            );

            const savedArg = (versionRepo.save.mock.calls[0][0] as any)
                .runtime.crowd.actions[0].args[0];

            expect(savedArg.default_value).toBe(3);
            expect(savedArg.defaultValue).toBeUndefined();
        });

        it('should accept default value when argument type is none', async () => {
            const mockVersion: Partial<Version> = {
                id: versionId,
                entity_type: Game.name,
                entity_id: gameId,
                runtime: {
                    crowd: {
                        actions: [],
                        mappings: [],
                    },
                } as any,
            };

            versionRepo.findOne.mockResolvedValue(mockVersion as Version);

            const invalidActions: CrowdAction[] = [
                {
                    identifier: 'noop',
                    name: 'No-op',
                    description: 'No operation',
                    args: [
                        {
                            key: 'unused',
                            type: ArgumentType.None,
                            required: false,
                            default_value: 'allowed',
                        } as any,
                    ],
                },
            ];

            const result = await useCase.execute(gameId, versionId, invalidActions);

            expect(result.actions[0].args[0]).toMatchObject({
                key: 'unused',
                type: ArgumentType.None,
                required: false,
                default_value: 'allowed',
            });
        });
    });
});
