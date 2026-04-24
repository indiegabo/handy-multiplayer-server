import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { SentToHomologationUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/send-to-homologation.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { GameVersionState } from '@hms/shared-types';
import { GameBuildState } from '@src/modules/sg/core/enums/game-build-state.enum';
import { DataSource, QueryRunner } from 'typeorm';

describe('SentToHomologationUseCase', () => {
    let useCase: SentToHomologationUseCase;
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
                SentToHomologationUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
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
                        log: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<SentToHomologationUseCase>(
            SentToHomologationUseCase,
        );
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

        const payload = { semver: '1.1.0' };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw NotFoundException when version is not found', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockQueryBuilder = versionRepository.createQueryBuilder();

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(null);

        const payload = { semver: '1.1.0' };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw BadRequestException when builds are not all active', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockBuilds = [
            { id: 'build-1', state: GameBuildState.Active },
            { id: 'build-2', state: GameBuildState.Pending },
        ];
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.1.0' },
            state: GameVersionState.UnderDevelopment,
            builds: mockBuilds,
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);

        const queryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersion),
        };
        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

        const payload = { semver: '1.1.0' };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            BadRequestException,
        );
    });

    it('should successfully transition version to Homologation state', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockBuilds = [
            { id: 'build-1', state: GameBuildState.Active },
            { id: 'build-2', state: GameBuildState.Active },
        ];
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.1.0' },
            state: GameVersionState.UnderDevelopment,
            builds: mockBuilds,
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);

        const queryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersion),
        };
        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

        const payload = { semver: '1.1.0' };

        await useCase.execute('game-id', payload);

        expect(mockVersion.state).toBe(GameVersionState.Homologation);
        expect(queryRunner.manager.save).toHaveBeenCalledWith(mockVersion);
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
});
