import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVersionMetadataUseCase } from '../../../../../../../src/modules/sg/core/use-cases/versions/get-version-metadata.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';

describe('GetVersionMetadataUseCase', () => {
    let useCase: GetVersionMetadataUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const mockVersionRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetVersionMetadataUseCase,
                {
                    provide: VersionRepository,
                    useValue: mockVersionRepository,
                },
            ],
        }).compile();

        useCase = module.get<GetVersionMetadataUseCase>(GetVersionMetadataUseCase);
        versionRepository = module.get(VersionRepository);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('execute', () => {
        const mockVersionId = 'version-uuid-123';
        const mockMeta = {
            acknowledgment: {
                acknowledged: true,
                acknowledgedAt: '2026-01-15T10:30:00Z',
                acknowledgedBy: 'admin-uuid',
            },
            development: {
                status: 'in_progress',
                startedAt: '2026-01-15T11:00:00Z',
            },
        };

        it('should return version metadata when version exists', async () => {
            versionRepository.findOne.mockResolvedValue({
                id: mockVersionId,
                development: mockMeta,
            } as any);

            const result = await useCase.execute(mockVersionId);

            expect(result).toEqual(mockMeta);
            expect(versionRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockVersionId },
                select: ['id', 'development'],
            });
        });

        it('should return null when meta field is null', async () => {
            versionRepository.findOne.mockResolvedValue({
                id: mockVersionId,
                development: null,
            } as any);

            const result = await useCase.execute(mockVersionId);

            expect(result).toBeNull();
        });

        it('should throw NotFoundException when version does not exist', async () => {
            versionRepository.findOne.mockResolvedValue(null);

            await expect(useCase.execute(mockVersionId)).rejects.toThrow(
                new NotFoundException(`Version with ID '${mockVersionId}' not found`),
            );
        });

        it('should only select id and meta fields', async () => {
            versionRepository.findOne.mockResolvedValue({
                id: mockVersionId,
                development: mockMeta,
            } as any);

            await useCase.execute(mockVersionId);

            expect(versionRepository.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    select: ['id', 'development'],
                }),
            );
        });
    });
});
