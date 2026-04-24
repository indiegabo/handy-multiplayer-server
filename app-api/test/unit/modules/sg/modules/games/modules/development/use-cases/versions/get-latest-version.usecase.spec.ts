import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetLatestVersionUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/get-latest-version.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameVersionState } from '@hms/shared-types';

describe('GetLatestVersionUseCase', () => {
    let useCase: GetLatestVersionUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetLatestVersionUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findLatestBySemver: jest.fn(),
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

        useCase = module.get<GetLatestVersionUseCase>(GetLatestVersionUseCase);
        versionRepository = module.get(VersionRepository);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });
});
