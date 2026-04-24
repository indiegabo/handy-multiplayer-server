import { GetHomologationAccessUseCase } from '@src/modules/sg/modules/games/modules/runtime/use-cases/get-homologation-access.usecase';
import { HomologationAccessPolicyService } from '@src/modules/sg/modules/games/modules/runtime/services/homologation-access-policy.service';

describe('GetHomologationAccessUseCase', () => {
    let useCase: GetHomologationAccessUseCase;
    let accessPolicy: jest.Mocked<HomologationAccessPolicyService>;

    beforeEach(() => {
        accessPolicy = {
            resolve: jest.fn(),
            countWaitingVersions: jest.fn(),
        } as any;

        useCase = new GetHomologationAccessUseCase(accessPolicy);
    });

    it('returns access flags and waiting count when user can view', async () => {
        accessPolicy.resolve.mockResolvedValue({
            can_view_waiting_versions: true,
            can_install_waiting_versions: true,
            policy_source: 'role:admin',
        });
        accessPolicy.countWaitingVersions.mockResolvedValue(6);

        const result = await useCase.execute('game-1', null as any);

        expect(result.game_id).toBe('game-1');
        expect(result.can_view_waiting_versions).toBe(true);
        expect(result.can_install_waiting_versions).toBe(true);
        expect(result.policy_source).toBe('role:admin');
        expect(result.waiting_versions_count).toBe(6);
        expect(result.checked_at).toEqual(expect.any(String));
        expect(accessPolicy.countWaitingVersions).toHaveBeenCalledWith('game-1');
    });

    it('omits waiting count when user cannot view', async () => {
        accessPolicy.resolve.mockResolvedValue({
            can_view_waiting_versions: false,
            can_install_waiting_versions: false,
            policy_source: 'none',
        });

        const result = await useCase.execute('game-2', null as any);

        expect(result.game_id).toBe('game-2');
        expect(result.can_view_waiting_versions).toBe(false);
        expect(result.can_install_waiting_versions).toBe(false);
        expect(result.waiting_versions_count).toBeUndefined();
        expect(accessPolicy.countWaitingVersions).not.toHaveBeenCalled();
    });

    it('enforces can_view true whenever can_install is true', async () => {
        accessPolicy.resolve.mockResolvedValue({
            can_view_waiting_versions: false,
            can_install_waiting_versions: true,
            policy_source: 'custom',
        });
        accessPolicy.countWaitingVersions.mockResolvedValue(1);

        const result = await useCase.execute('game-3', null as any);

        expect(result.can_install_waiting_versions).toBe(true);
        expect(result.can_view_waiting_versions).toBe(true);
        expect(result.waiting_versions_count).toBe(1);
    });
});
