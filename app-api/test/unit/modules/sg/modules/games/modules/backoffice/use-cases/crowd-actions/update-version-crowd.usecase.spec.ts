import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { UpdateVersionCrowdUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/crowd-actions/update-version-crowd.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
import { Game } from '@src/modules/sg/core/entities/game.entity';
import { ArgumentType } from '@hms/shared-types';

describe('UpdateVersionCrowdUseCase', () => {
    let useCase: UpdateVersionCrowdUseCase;
    let versionRepo: jest.Mocked<VersionRepository>;

    const gameId = 'game-id-123';
    const versionId = 'version-id-456';

    const validActions = [
        {
            identifier: 'a1',
            name: 'Action 1',
            description: 'desc',
            args: [],
        },
    ];

    const validMappings = [
        {
            identifier: 'a1',
            triggers: [],
            commands: [],
        },
    ];

    beforeEach(async () => {
        const mockVersionRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateVersionCrowdUseCase,
                { provide: VersionRepository, useValue: mockVersionRepo },
            ],
        }).compile();

        useCase = module.get<UpdateVersionCrowdUseCase>(UpdateVersionCrowdUseCase);
        versionRepo = module.get(VersionRepository);
    });

    it('throws NotFoundException when version missing', async () => {
        versionRepo.findOne.mockResolvedValue(null);
        await expect(useCase.execute(gameId, versionId, validActions as any, validMappings as any))
            .rejects.toThrow(NotFoundException);
    });

    it('updates both actions and mappings successfully', async () => {
        const mockVersion: Partial<Version> = {
            id: versionId,
            entity_type: Game.name,
            entity_id: gameId,
        };
        versionRepo.findOne.mockResolvedValue(mockVersion as Version);
        (mockVersion as any).runtime = {};
        versionRepo.save.mockResolvedValue({ ...mockVersion, runtime: (mockVersion as any).runtime });

        const result = await useCase.execute(gameId, versionId, validActions as any, validMappings as any);

        expect(versionRepo.save).toHaveBeenCalled();
        expect(result).toEqual({ version_id: versionId, actions: validActions, mappings: validMappings });
    });

    it('throws BadRequestException when mapping references unknown action', async () => {
        const mockVersion: Partial<Version> = {
            id: versionId,
            entity_type: Game.name,
            entity_id: gameId,
        };
        versionRepo.findOne.mockResolvedValue(mockVersion as Version);
        (mockVersion as any).runtime = {};

        const badMappings = [{ identifier: 'unknown', triggers: [], commands: [] }];

        await expect(useCase.execute(gameId, versionId, validActions as any, badMappings as any))
            .rejects.toThrow(BadRequestException);
    });

    it('accepts and persists default_value when argument type is not none', async () => {
        const mockVersion: Partial<Version> = {
            id: versionId,
            entity_type: Game.name,
            entity_id: gameId,
            runtime: {},
        };

        versionRepo.findOne.mockResolvedValue(mockVersion as Version);
        versionRepo.save.mockImplementation(async (entity: any) => entity);

        const actions = [
            {
                identifier: 'set-volume',
                name: 'Set Volume',
                description: 'Set game volume',
                args: [
                    {
                        key: 'value',
                        type: ArgumentType.Float,
                        required: false,
                        default_value: 0.75,
                    },
                ],
            },
        ];

        const mappings = [
            {
                identifier: 'set-volume',
                triggers: [],
                commands: [],
            },
        ];

        const result = await useCase.execute(gameId, versionId, actions as any, mappings as any);
        const savedArg = (versionRepo.save.mock.calls[0][0] as any).runtime.crowd.actions[0].args[0];

        expect(result.actions[0].args[0].default_value).toBe(0.75);
        expect(savedArg.default_value).toBe(0.75);
    });

    it('normalizes legacy defaultValue to default_value in atomic update', async () => {
        const mockVersion: Partial<Version> = {
            id: versionId,
            entity_type: Game.name,
            entity_id: gameId,
            runtime: {},
        };

        versionRepo.findOne.mockResolvedValue(mockVersion as Version);
        versionRepo.save.mockImplementation(async (entity: any) => entity);

        const actions = [
            {
                identifier: 'set-score',
                name: 'Set Score',
                description: 'Set player score',
                args: [
                    {
                        key: 'score',
                        type: ArgumentType.Integer,
                        required: false,
                        defaultValue: 100,
                    },
                ],
            },
        ];

        const mappings = [
            {
                identifier: 'set-score',
                triggers: [],
                commands: [],
            },
        ];

        await useCase.execute(gameId, versionId, actions as any, mappings as any);
        const savedArg = (versionRepo.save.mock.calls[0][0] as any).runtime.crowd.actions[0].args[0];

        expect(savedArg.default_value).toBe(100);
        expect(savedArg.defaultValue).toBeUndefined();
    });

    it('accepts default value when argument type is none in atomic update', async () => {
        const mockVersion: Partial<Version> = {
            id: versionId,
            entity_type: Game.name,
            entity_id: gameId,
            runtime: {},
        };

        versionRepo.findOne.mockResolvedValue(mockVersion as Version);

        const actions = [
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
                    },
                ],
            },
        ];

        const mappings = [
            {
                identifier: 'noop',
                triggers: [],
                commands: [],
            },
        ];

        const result = await useCase.execute(gameId, versionId, actions as any, mappings as any);
        expect(result.actions[0].args[0].default_value).toBe('allowed');
    });
});
