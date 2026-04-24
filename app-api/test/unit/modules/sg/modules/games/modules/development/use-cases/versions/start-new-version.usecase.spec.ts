import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { StartNewVersionUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/start-new-version.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { GameVersionState } from '@hms/shared-types';
import { VersionUpdateType } from '@src/modules/sg/core/enums/version-update-type.enum';
import { DataSource, QueryRunner } from 'typeorm';

describe('StartNewVersionUseCase', () => {
    let useCase: StartNewVersionUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let gameRepository: jest.Mocked<GameRepository>;
    let dataSource: jest.Mocked<DataSource>;
    let queryRunner: jest.Mocked<QueryRunner>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(async () => {
        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                save: jest.fn(),
            },
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StartNewVersionUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOne: jest.fn(),
                        findCurrent: jest.fn(),
                        create: jest.fn(),
                        createQueryBuilder: jest.fn(() => ({
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            getOne: jest.fn(),
                        })),
                    },
                },
                {
                    provide: GameRepository,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn(() => queryRunner),
                    },
                },
                {
                    provide: BetterLogger,
                    useValue: {
                        setContext: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<StartNewVersionUseCase>(StartNewVersionUseCase);
        versionRepository = module.get(VersionRepository);
        gameRepository = module.get(GameRepository);
        dataSource = module.get(DataSource);
        logger = module.get(BetterLogger);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    it('should throw NotFoundException when game does not exist', async () => {
        gameRepository.findOne.mockResolvedValue(null);

        const payload = {
            version_update_type: VersionUpdateType.Minor,
            is_prerelease: false,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw ConflictException when version is already in preparation', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockExistingVersion = {
            semver: { raw: '1.1.0' },
            state: GameVersionState.AwaitingDevelopmentApproval,
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(mockExistingVersion as any);

        const payload = {
            version_update_type: VersionUpdateType.Minor,
            is_prerelease: false,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            ConflictException,
        );
    });

    it('should throw BadRequestException when Specific type without specific_version', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(null);

        const payload = {
            version_update_type: VersionUpdateType.Specific,
            is_prerelease: false,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            BadRequestException,
        );
    });
});
