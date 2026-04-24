import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Seeder } from 'typeorm-extension';
import { AdminUser } from
    '@src/modules/hms/modules/users/entities/admin-user.entity';
import { Seed, SeedEnvironment, SeedType } from '@src/modules/hms/core/decorators/seed.decorator';
import { BetterLogger } from '@src/modules/hms/modules/better-logger/better-logger.service';
import { AUTH_CONFIG } from '@src/config/hms/auth.config';

@Seed({
    name: 'AdminsSeed',
    environment: SeedEnvironment.DEVELOPMENT,
    type: SeedType.MAIN,
    priority: 1,
})
export class DevAdminsSeed implements Seeder {
    private readonly logger: BetterLogger;

    constructor() {
        this.logger = new BetterLogger();
        this.logger.setContext(DevAdminsSeed.name);
        this.logger.setMessagesColor(BetterLogger.BRIGHT_WHITE);
    }

    public async run(dataSource: DataSource): Promise<void> {
        const adminsRepository = dataSource.getRepository(AdminUser);
        const now = new Date();

        const defaultPassword = '$P@ssw0rd#';

        const usersToSeed = [
            {
                email: 'owner@hms.com',
                name: 'HMS Owner',
                is_owner: true,
                became_owner_at: now,
                two_factor_enabled: false,
            },
            {
                email: 'admin1@hms.com',
                name: 'Admin One',
                is_owner: false,
                became_owner_at: null as Date | null,
                two_factor_enabled: false,
            },
            {
                email: 'admin2@hms.com',
                name: 'Admin Two',
                is_owner: false,
                became_owner_at: null as Date | null,
                two_factor_enabled: false,
            },
            {
                email: 'admin3@hms.com',
                name: 'Admin Three',
                is_owner: false,
                became_owner_at: null as Date | null,
                two_factor_enabled: false,
            },
        ];

        // Pre-hash once per user to avoid re-hashing on retries.
        const usersWithHashes = await Promise.all(
            usersToSeed.map(async (u) => ({
                ...u,
                password: await bcrypt.hash(defaultPassword, AUTH_CONFIG.passwords.saltRounds),
            })),
        );

        for (const seedData of usersWithHashes) {
            const existing = await adminsRepository.findOne({
                where: { email: seedData.email },
            });

            if (!existing) {
                const created = adminsRepository.create({
                    email: seedData.email,
                    name: seedData.name,
                    password: seedData.password,
                    two_factor_enabled: seedData.two_factor_enabled,
                    is_owner: seedData.is_owner,
                    became_owner_at: seedData.became_owner_at,
                    admin_permissions: null,
                });

                await adminsRepository.save(created);
                this.logger.log(
                    `Admin ${seedData.email} successfully created (owner=` +
                    `${seedData.is_owner}).`,
                );
                continue;
            }

            // Ensure flags comply with requested state on existing rows.
            let changed = false;

            if (existing.two_factor_enabled !== seedData.two_factor_enabled) {
                existing.two_factor_enabled = seedData.two_factor_enabled;
                changed = true;
            }

            if (existing.is_owner !== seedData.is_owner) {
                existing.is_owner = seedData.is_owner;
                changed = true;
            }

            if (
                (seedData.is_owner && !existing.became_owner_at) ||
                (!seedData.is_owner && existing.became_owner_at !== null)
            ) {
                existing.became_owner_at = seedData.became_owner_at;
                changed = true;
            }

            // Optional: ensure a password exists (e.g., SSO-only accounts).
            if (!existing.password) {
                existing.password = seedData.password;
                changed = true;
            }

            // Optional: keep display name aligned.
            if (existing.name !== seedData.name) {
                existing.name = seedData.name;
                changed = true;
            }

            if (changed) {
                await adminsRepository.save(existing);
                this.logger.log(
                    `Admin ${seedData.email} updated to desired state.`,
                );
            } else {
                this.logger.log(
                    `Admin ${seedData.email} already compliant. Skipping.`,
                );
            }
        }
    }
}
