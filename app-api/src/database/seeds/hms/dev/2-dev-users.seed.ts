import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Seeder } from 'typeorm-extension';
import { v4 as uuidv4 } from 'uuid';
import { BetterLogger } from '@src/modules/hms/modules/better-logger/better-logger.service';
import { AUTH_CONFIG } from '@src/config/hms/auth.config';
import { User } from '@src/modules/hms/modules/users/entities/user.entity';
import { USERS_CONFIG } from '@src/config/hms/users.config';
import { Seed, SeedEnvironment, SeedType } from '@src/modules/hms/core/decorators/seed.decorator';

@Seed({
    name: 'UsersSeed',
    environment: SeedEnvironment.DEVELOPMENT,
    type: SeedType.MAIN,
    priority: 2,
})
export class DevUsersSeed implements Seeder {
    private readonly logger: BetterLogger;

    constructor() {
        this.logger = new BetterLogger();
        this.logger.setContext(DevUsersSeed.name);
        this.logger.setMessagesColor(BetterLogger.BRIGHT_WHITE);
    }

    /**
     * Seeds dev users with human-recognizable or generated UUID v4 IDs.
     */
    async run(dataSource: DataSource): Promise<void> {
        const userRepository = dataSource.getRepository(User);

        const passwordHash = await bcrypt.hash(
            '$P@ssw0rd#',
            AUTH_CONFIG.passwords.saltRounds,
        );

        const usersToSeed: Array<Partial<User>> = [
            {
                id: '11111111-1111-4111-8111-111111111111',
                email: 'test1@hms.com',
                display_name: 'Test User 1',
                username: 'test1',
                password: passwordHash,
            },
            {
                id: '22222222-2222-4222-8222-222222222222',
                email: 'test2@hms.com',
                display_name: 'Test User 2',
                username: 'test2',
                password: passwordHash,
            },
        ];

        // Add dev users from USERS_CONFIG
        if (USERS_CONFIG?.seed?.dev?.length) {
            for (const devUser of USERS_CONFIG.seed.dev) {
                usersToSeed.push({
                    id: uuidv4(),
                    email: devUser.email,
                    display_name: devUser.display_name ?? devUser.username,
                    username: devUser.username,
                    password: passwordHash,
                });
            }
        }

        for (const userData of usersToSeed) {
            const existing = await userRepository.findOne({
                where: [{ email: userData.email }, { id: userData.id }],
            });

            if (existing) {
                this.logger.warn(
                    `User ${userData.email} already exists. Skipping...`,
                );
                continue;
            }

            const user = userRepository.create(userData);
            await userRepository.save(user);

            this.logger.log(
                `User ${userData.email} successfully seeded `
                + `(id: ${userData.id}).`,
            );
        }

        this.logger.log('Dev users seeding completed.');
    }
}
