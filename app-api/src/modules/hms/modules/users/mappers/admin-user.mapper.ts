// src/hms/modules/users/mappers/admin-user.mapper.ts
import { AdminUser } from '../entities/admin-user.entity';
import { AdminUserBackofficeViewDto } from "@hms/shared-types/hms";

/**
 * Maps an AdminUser entity to a lightweight backoffice view.
 * Ensures optional fields are normalized and provides a
 * predictable shape for media enrichment.
 */
export function mapAdminUserToViewDto(
    admin: AdminUser,
): AdminUserBackofficeViewDto {
    return {
        id: admin.id ?? null as any,
        email: admin.email ?? null as any,
        name: admin.name ?? null as any,
        admin_permissions: admin.admin_permissions ?? undefined,
        is_owner: Boolean(admin.is_owner),
        became_owner_at: admin.became_owner_at ?? undefined,
        profile_picture: undefined,
    };
}
