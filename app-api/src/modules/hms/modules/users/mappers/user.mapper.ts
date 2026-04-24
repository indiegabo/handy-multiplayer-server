import { UserBackofficeViewDto } from "@hms/shared-types/hms";
import { User } from '../entities/user.entity';

/**
 * Maps a User entity (end user) to the lightweight view used in listings.
 */
export function mapUserToViewDto(user: User): UserBackofficeViewDto {
    return {
        id: user.id ?? null,
        admin_id: user.admin_id ?? null,
        email: user.email ?? null,
        username: user.username ?? null,
        display_name: user.display_name ?? null,
        two_factor_enabled: user.two_factor_enabled ?? false,
        profile_picture: null,
    };
}
