import { BadRequestException } from '@nestjs/common';
import { CreateGameVersionUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/create-game-version.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
// legacy CrowdActions entity removed; tests use meta-based shapes now
import { GameVersionState, DevelopmentStatus, TestingStatus } from '@hms/shared-types';

describe('CreateGameVersionUseCase', () => {
    let useCase: CreateGameVersionUseCase;
    let repo: jest.Mocked<VersionRepository>;

    const gameId = '11111111-1111-1111-1111-111111111111';

    beforeEach(() => {
        repo = {
            findOneByEntityAndStates: jest.fn(),
            findLatestBySemver: jest.fn(),
            findOneBySemverRaw: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            // Unused methods in this spec
        } as unknown as jest.Mocked<VersionRepository>;

        useCase = new CreateGameVersionUseCase(repo);
    });

    const blockingStates = [
        GameVersionState.AwaitingDevelopmentApproval,
        GameVersionState.UnderDevelopment,
        GameVersionState.Homologation,
    ];

    test.each(blockingStates)('should reject when version is in blocking state %s', async (state) => {
        const blocking: Partial<Version> = { state: state as GameVersionState };
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(blocking as Version);

        await expect(useCase.execute(gameId, '1.2.3')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject when version already exists for game', async () => {
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue({ id: 'v1' } as Version);

        await expect(useCase.execute(gameId, '1.2.3')).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should reject when semver is lower than current', async () => {
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue(null);
        (repo.findLatestBySemver as jest.Mock).mockResolvedValue({
            semver: { raw: '2.0.0' },
        } as unknown as Version);

        await expect(useCase.execute(gameId, '1.9.9')).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should create version when rules pass', async () => {
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue(null);
        (repo.findLatestBySemver as jest.Mock).mockResolvedValue({
            semver: { raw: '1.0.0' },
        } as unknown as Version);

        const created: Partial<Version> = {
            id: 'new-ver-id',
            entity_type: 'game',
            entity_id: gameId,
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.AwaitingDevelopmentApproval,
        };
        (repo.create as jest.Mock).mockReturnValue(created as Version);
        (repo.save as jest.Mock).mockResolvedValue(created as Version);

        const result = await useCase.execute(gameId, '1.1.0');
        expect(repo.create).toHaveBeenCalled();
        expect(repo.save).toHaveBeenCalled();
        expect(result.id).toBe('new-ver-id');
        expect(result.state).toBe(GameVersionState.AwaitingDevelopmentApproval);
    });

    it('should set is_prerelease=true when semver contains prerelease', async () => {
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue(null);
        (repo.findLatestBySemver as jest.Mock).mockResolvedValue({
            semver: { raw: '1.0.0' },
        } as unknown as Version);

        const created: Partial<Version> = {
            id: 'new-ver-pre',
            entity_type: 'game',
            entity_id: gameId,
            semver: { raw: '1.1.0-alpha.1', major: 1, minor: 1, patch: 0, prerelease: 'alpha.1' },
            state: GameVersionState.AwaitingDevelopmentApproval,
            is_current: false,
            is_prerelease: true,
        };
        (repo.create as jest.Mock).mockReturnValue(created as Version);
        (repo.save as jest.Mock).mockResolvedValue(created as Version);

        const result = await useCase.execute(gameId, '1.1.0-alpha.1');
        expect(result.is_prerelease).toBe(true);
        expect(result.semver.prerelease).toBe('alpha.1');
    });

    it('should duplicate crowd actions from latest version when it exists', async () => {
        const latestVersionId = 'latest-ver-id';
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue(null);
        (repo.findLatestBySemver as jest.Mock).mockResolvedValue({
            id: latestVersionId,
            semver: { raw: '1.0.0' },
            runtime: {
                crowd: {
                    actions: [
                        { identifier: 'action-1', name: 'Jump', description: 'Make player jump', args: [] },
                    ],
                    mappings: [
                        { identifier: 'action-1', triggers: [], commands: [] },
                    ],
                },
            },
        } as unknown as Version);
        const created: Partial<Version> = {
            id: 'new-ver-id',
            entity_type: 'game',
            entity_id: gameId,
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.AwaitingDevelopmentApproval,
        };
        (repo.create as jest.Mock).mockReturnValue(created as Version);
        (repo.save as jest.Mock).mockResolvedValue(created as Version);

        await useCase.execute(gameId, '1.1.0');

        const createCall = (repo.create as jest.Mock).mock.calls[0][0];
        expect(createCall.runtime).toBeDefined();
        expect(createCall.runtime.crowd).toEqual({
            actions: [
                { identifier: 'action-1', name: 'Jump', description: 'Make player jump', args: [] },
            ],
            mappings: [
                { identifier: 'action-1', triggers: [], commands: [] },
            ],
        });
    });

    it('should create empty crowd actions when latest version has no crowd actions', async () => {
        const latestVersionId = 'latest-ver-id';
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue(null);
        (repo.findLatestBySemver as jest.Mock).mockResolvedValue({
            id: latestVersionId,
            semver: { raw: '1.0.0' },
            runtime: {},
        } as unknown as Version);
        const created: Partial<Version> = {
            id: 'new-ver-id',
            entity_type: 'game',
            entity_id: gameId,
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.AwaitingDevelopmentApproval,
        };
        (repo.create as jest.Mock).mockReturnValue(created as Version);
        (repo.save as jest.Mock).mockResolvedValue(created as Version);

        await useCase.execute(gameId, '1.1.0');

        const createCall = (repo.create as jest.Mock).mock.calls[0][0];
        expect(createCall.runtime.crowd).toEqual({
            actions: [],
            mappings: [],
        });
    });

    it('should create empty crowd actions when no previous version exists', async () => {
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue(null);
        (repo.findLatestBySemver as jest.Mock).mockResolvedValue(null);

        const created: Partial<Version> = {
            id: 'new-ver-id',
            entity_type: 'game',
            entity_id: gameId,
            semver: { raw: '1.0.0', major: 1, minor: 0, patch: 0 },
            state: GameVersionState.AwaitingDevelopmentApproval,
        };
        (repo.create as jest.Mock).mockReturnValue(created as Version);
        (repo.save as jest.Mock).mockResolvedValue(created as Version);

        await useCase.execute(gameId, '1.0.0');

        const createCall = (repo.create as jest.Mock).mock.calls[0][0];
        expect(createCall.runtime.crowd).toEqual({
            actions: [],
            mappings: [],
        });
    });

    it('should initialize meta field with default structure', async () => {
        (repo.findOneByEntityAndStates as jest.Mock).mockResolvedValue(null);
        (repo.findOneBySemverRaw as jest.Mock).mockResolvedValue(null);
        (repo.findLatestBySemver as jest.Mock).mockResolvedValue({
            semver: { raw: '1.0.0' },
        } as unknown as Version);

        const created: Partial<Version> = {
            id: 'new-ver-id',
            entity_type: 'game',
            entity_id: gameId,
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.AwaitingDevelopmentApproval,
        };
        (repo.create as jest.Mock).mockReturnValue(created as Version);
        (repo.save as jest.Mock).mockResolvedValue(created as Version);
        await useCase.execute(gameId, '1.1.0');

        const createCall = (repo.create as jest.Mock).mock.calls[0][0];
        expect(createCall.development).toBeDefined();
        expect(createCall.development.acknowledgment).toEqual({
            acknowledged: false,
        });
        expect(createCall.development.development).toEqual({
            status: DevelopmentStatus.NotStarted,
            progressPercentage: 0,
        });
        expect(createCall.development.testing).toEqual({
            status: TestingStatus.NotStarted,
            testsCompleted: 0,
            testsTotal: 0,
            criticalIssuesFound: 0,
        });
        // runtime should include crowd and platforms
        expect(createCall.runtime).toBeDefined();
        expect(createCall.runtime.crowd).toEqual({
            actions: [],
            mappings: [],
        });
    });
});
