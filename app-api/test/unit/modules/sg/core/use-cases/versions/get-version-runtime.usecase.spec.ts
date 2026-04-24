import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVersionRuntimeUseCase } from '../../../../../../../src/modules/sg/modules/games/modules/runtime/use-cases/versions/get-version-runtime.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';

describe('GetVersionRuntimeUseCase', () => {
    let useCase: GetVersionRuntimeUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const mockVersionRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetVersionRuntimeUseCase,
                {
                    provide: VersionRepository,
                    useValue: mockVersionRepository,
                },
            ],
        }).compile();

        useCase = module.get<GetVersionRuntimeUseCase>(GetVersionRuntimeUseCase);
        versionRepository = module.get(VersionRepository);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('execute', () => {
        const mockVersionId = 'version-uuid-123';
        const mockRuntime = { platforms: ['twitch'], flags: { foo: true } };

        it('should return DTO with crowd and platforms when version exists', async () => {
            versionRepository.findOne.mockResolvedValue({ id: mockVersionId, runtime: mockRuntime } as any);

            const result = await useCase.execute(mockVersionId);

            expect(result).toEqual({
                crowd: null,
                platforms: ['twitch'],
            });
            expect(versionRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockVersionId },
                select: ['id', 'runtime'],
            });
        });

        it('should return empty DTO when runtime field is null', async () => {
            versionRepository.findOne.mockResolvedValue({ id: mockVersionId, runtime: null } as any);

            const result = await useCase.execute(mockVersionId);

            expect(result).toEqual({
                crowd: null,
                platforms: [],
            });
        });

        it('should throw NotFoundException when version does not exist', async () => {
            versionRepository.findOne.mockResolvedValue(null);

            await expect(useCase.execute(mockVersionId)).rejects.toThrow(
                new NotFoundException(`Version with ID '${mockVersionId}' not found`),
            );
        });

        it('should only select id and runtime fields', async () => {
            versionRepository.findOne.mockResolvedValue({ id: mockVersionId, runtime: mockRuntime } as any);

            await useCase.execute(mockVersionId);

            expect(versionRepository.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    select: ['id', 'runtime'],
                }),
            );
        });
    });
});
