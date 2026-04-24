import { NotFoundException } from '@nestjs/common';
import { GameVersionState } from '@hms/shared-types';
import { AdminUser } from '@src/modules/hms/modules/users/entities/admin-user.entity';
import { User } from '@hms-module/modules/users/entities/user.entity';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { GameTesterRepository } from '@src/modules/sg/core/repositories/game-tester.repository';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { HomologationAccessPolicyService } from '@src/modules/sg/modules/games/modules/runtime/services/homologation-access-policy.service';

describe('HomologationAccessPolicyService', () => {
    let service: HomologationAccessPolicyService;

    let gameRepository: jest.Mocked<GameRepository>;
    let gameTesterRepository: jest.Mocked<GameTesterRepository>;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(() => {
        gameRepository = {
            findOne: jest.fn(),
        } as any;

        gameTesterRepository = {
            findActive: jest.fn(),
        } as any;

        versionRepository = {
            count: jest.fn(),
        } as any;

        service = new HomologationAccessPolicyService(
            gameRepository,
            gameTesterRepository,
            versionRepository,
        );
    });

    it('throws NotFoundException when game does not exist', async () => {
        gameRepository.findOne.mockResolvedValue(null);

        await expect(
            service.resolve('missing-game-id', null),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns admin access policy for admin users', async () => {
        const admin = Object.assign(new AdminUser(), {
            id: 'admin-1',
        });

        gameRepository.findOne.mockResolvedValue({
            id: 'game-1',
        } as any);

        const policy = await service.resolve('game-1', admin);

        expect(policy).toEqual({
            can_view_waiting_versions: true,
            can_install_waiting_versions: true,
            policy_source: 'role:admin',
        });
        expect(gameTesterRepository.findActive).not.toHaveBeenCalled();
    });

    it('returns per-game tester access policy for active testers', async () => {
        const user = Object.assign(new User(), {
            id: 'user-1',
        });

        gameRepository.findOne.mockResolvedValue({
            id: 'game-1',
        } as any);
        gameTesterRepository.findActive.mockResolvedValue({
            id: 'tester-1',
        } as any);

        const policy = await service.resolve('game-1', user);

        expect(policy).toEqual({
            can_view_waiting_versions: true,
            can_install_waiting_versions: true,
            policy_source: 'per-game:active-tester',
        });
        expect(gameTesterRepository.findActive).toHaveBeenCalledWith(
            'user-1',
            'game-1',
        );
    });

    it('returns no access policy when user has no active tester grant', async () => {
        const user = Object.assign(new User(), {
            id: 'user-2',
        });

        gameRepository.findOne.mockResolvedValue({
            id: 'game-1',
        } as any);
        gameTesterRepository.findActive.mockResolvedValue(null);

        const policy = await service.resolve('game-1', user);

        expect(policy).toEqual({
            can_view_waiting_versions: false,
            can_install_waiting_versions: false,
            policy_source: 'none',
        });
    });

    it('counts waiting versions using homologation state filter', async () => {
        versionRepository.count.mockResolvedValue(4 as any);

        const count = await service.countWaitingVersions('game-2');

        expect(count).toBe(4);
        expect(versionRepository.count).toHaveBeenCalledWith({
            where: {
                entity_type: 'Game',
                entity_id: 'game-2',
                state: GameVersionState.Homologation,
            },
        });
    });
});
