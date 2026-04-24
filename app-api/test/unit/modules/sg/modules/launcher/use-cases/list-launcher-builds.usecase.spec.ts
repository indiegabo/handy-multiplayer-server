import { Test, TestingModule } from '@nestjs/testing';
import { GameBuildPlatform } from '@hms/shared-types';
import { ListLauncherBuildsUseCase } from '@src/modules/sg/modules/launcher/use-cases/list-launcher-builds.usecase';
import { LauncherService } from '@src/modules/sg/modules/launcher/services/launcher.service';

describe('ListLauncherBuildsUseCase', () => {
    let useCase: ListLauncherBuildsUseCase;
    let launcherService: jest.Mocked<LauncherService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListLauncherBuildsUseCase,
                {
                    provide: LauncherService,
                    useValue: {
                        listBuildsPaginated: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<ListLauncherBuildsUseCase>(ListLauncherBuildsUseCase);
        launcherService = module.get(LauncherService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call service with default filters', async () => {
        launcherService.listBuildsPaginated.mockResolvedValue({
            channel: 'latest',
            items: [],
            pagination: {
                page: 1,
                per_page: 20,
                total: 0,
                total_pages: 1,
                is_truncated: false,
                next_continuation_token: null,
            },
        });

        await useCase.execute({});

        expect(launcherService.listBuildsPaginated).toHaveBeenCalledWith({
            channel: 'latest',
            platform: GameBuildPlatform.Windows,
            page: undefined,
            perPage: 20,
            continuationToken: undefined,
        });
    });

    it('should forward explicit query filters and cursor', async () => {
        launcherService.listBuildsPaginated.mockResolvedValue({
            channel: 'alpha',
            items: [],
            pagination: {
                page: 2,
                per_page: 7,
                total: 50,
                total_pages: 8,
                is_truncated: true,
                next_continuation_token: '3',
            },
        });

        await useCase.execute({
            channel: 'alpha',
            platform: GameBuildPlatform.Linux,
            limit: 7,
            continuation_token: 'cursor-0',
        });

        expect(launcherService.listBuildsPaginated).toHaveBeenCalledWith({
            channel: 'alpha',
            platform: GameBuildPlatform.Linux,
            page: undefined,
            perPage: 7,
            continuationToken: 'cursor-0',
        });
    });

    it('should prioritize page/per_page when both syntaxes are provided', async () => {
        launcherService.listBuildsPaginated.mockResolvedValue({
            channel: 'beta',
            items: [],
            pagination: {
                page: 4,
                per_page: 10,
                total: 40,
                total_pages: 4,
                is_truncated: false,
                next_continuation_token: null,
            },
        });

        await useCase.execute({
            channel: 'beta',
            page: 4,
            per_page: 10,
            limit: 30,
        });

        expect(launcherService.listBuildsPaginated).toHaveBeenCalledWith({
            channel: 'beta',
            platform: GameBuildPlatform.Windows,
            page: 4,
            perPage: 10,
            continuationToken: undefined,
        });
    });
});
