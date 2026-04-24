import { NotFoundException } from '@nestjs/common';
import { AcknowledgeVersionUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/acknowledge-version.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
import { DevelopmentStatus, VersionDevelopmentMetadata } from '@hms/shared-types';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';

describe('AcknowledgeVersionUseCase', () => {
    let useCase: AcknowledgeVersionUseCase;
    let repo: jest.Mocked<VersionRepository>;
    let logger: jest.Mocked<BetterLogger>;

    const versionId = '11111111-1111-1111-1111-111111111111';

    beforeEach(() => {
        repo = {
            findOne: jest.fn(),
            update: jest.fn(),
        } as unknown as jest.Mocked<VersionRepository>;

        logger = {
            setContext: jest.fn(),
            log: jest.fn(),
        } as unknown as jest.Mocked<BetterLogger>;

        useCase = new AcknowledgeVersionUseCase(logger, repo);
    });

    it('should throw NotFoundException when version does not exist', async () => {
        (repo.findOne as jest.Mock).mockResolvedValue(null);

        await expect(useCase.execute(versionId)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('should acknowledge version and start development', async () => {
        const existingDev: VersionDevelopmentMetadata = {
            acknowledgment: {
                acknowledged: false,
            },
            development: {
                status: DevelopmentStatus.NotStarted,
                progressPercentage: 0,
            },
            testing: {
                status: 'not_started' as any,
                testsCompleted: 0,
                testsTotal: 0,
                criticalIssuesFound: 0,
            },
        };

        const version: Partial<Version> = {
            id: versionId,
            development: existingDev,
        };

        (repo.findOne as jest.Mock).mockResolvedValue(version as Version);
        (repo.update as jest.Mock).mockResolvedValue({ affected: 1 });

        const result = await useCase.execute(versionId);

        expect(result.acknowledgment.acknowledged).toBe(true);
        expect(result.acknowledgment.acknowledgedAt).toBeDefined();
        expect(result.development.status).toBe(DevelopmentStatus.InProgress);
        expect(result.development.startedAt).toBeDefined();
        expect(repo.update).toHaveBeenCalledWith(
            { id: versionId },
            expect.objectContaining({ development: expect.any(Object) }),
        );
    });

    it('should add notes when provided', async () => {
        const existingDev: VersionDevelopmentMetadata = {
            acknowledgment: {
                acknowledged: false,
            },
            development: {
                status: DevelopmentStatus.NotStarted,
                progressPercentage: 0,
            },
            testing: {
                status: 'not_started' as any,
                testsCompleted: 0,
                testsTotal: 0,
                criticalIssuesFound: 0,
            },
        };

        const version: Partial<Version> = {
            id: versionId,
            development: existingDev,
        };

        const notes = 'Starting development for new features';

        (repo.findOne as jest.Mock).mockResolvedValue(version as Version);
        (repo.update as jest.Mock).mockResolvedValue({ affected: 1 });

        const result = await useCase.execute(versionId, notes);

        expect(result.acknowledgment.notes).toBe(notes);
    });

    it('should preserve existing startedAt if already set', async () => {
        const existingStartedAt = '2026-01-01T10:00:00.000Z';

        const existingDev: VersionDevelopmentMetadata = {
            acknowledgment: {
                acknowledged: false,
            },
            development: {
                status: DevelopmentStatus.NotStarted,
                progressPercentage: 0,
                startedAt: existingStartedAt,
            },
            testing: {
                status: 'not_started' as any,
                testsCompleted: 0,
                testsTotal: 0,
                criticalIssuesFound: 0,
            },
        };

        const version: Partial<Version> = {
            id: versionId,
            development: existingDev,
        };

        (repo.findOne as jest.Mock).mockResolvedValue(version as Version);
        (repo.update as jest.Mock).mockResolvedValue({ affected: 1 });

        const result = await useCase.execute(versionId);

        expect(result.development.startedAt).toBe(existingStartedAt);
    });

    it('should initialize default metadata when version has no meta', async () => {
        const version: Partial<Version> = {
            id: versionId,
            development: null,
        };

        (repo.findOne as jest.Mock).mockResolvedValue(version as Version);
        (repo.update as jest.Mock).mockResolvedValue({ affected: 1 });

        const result = await useCase.execute(versionId);

        expect(result.acknowledgment.acknowledged).toBe(true);
        expect(result.development.status).toBe(DevelopmentStatus.InProgress);
        expect(result.testing).toBeDefined();
    });

    it('should log acknowledgment action', async () => {
        const existingMeta: VersionMetadata = {
            acknowledgment: {
                acknowledged: false,
            },
            development: {
                status: DevelopmentStatus.NotStarted,
                progressPercentage: 0,
            },
            testing: {
                status: 'not_started' as any,
                testsCompleted: 0,
                testsTotal: 0,
                criticalIssuesFound: 0,
            },
            metadata: {
                tags: [],
                linkedIssues: [],
            },
        };

        const version: Partial<Version> = {
            id: versionId,
            meta: existingMeta,
        };

        (repo.findOne as jest.Mock).mockResolvedValue(version as Version);
        (repo.update as jest.Mock).mockResolvedValue({ affected: 1 });

        await useCase.execute(versionId);

        expect(logger.log).toHaveBeenCalledWith(
            expect.stringContaining(`Version '${versionId}' acknowledged`),
        );
    });
});
