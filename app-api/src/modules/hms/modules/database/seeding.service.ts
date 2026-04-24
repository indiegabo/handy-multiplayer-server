import { Inject, Injectable, Optional } from '@nestjs/common';
import { runSeeders, SeederConstructor } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection as MongooseConnection } from 'mongoose';
import { GameDBSeedConstructor } from './game-db-seed-constructor.type';

import { BetterLogger } from '../better-logger/better-logger.service';
import { InitStep } from '../life-cycle/init/decorators';
import { StepResult } from '../life-cycle/init/types';
import { importAllSeeds } from './seed-loader';
import { AppSetup } from '../app-setup/entities/app-setup.entity';
import { GlobalSeedRegistry, RegisteredSeed, SeedEnvironment, SeedOptions, SeedType } from '@hms-module/core/decorators/seed.decorator';


/**
 * Service responsible for orchestrating database seeding operations.
 * Discovers, filters, and executes seed classes registered via the Seed decorator.
 * Ensures seeds are executed only once automatically, and in the correct order.
 *
 * @class SeedingService
 */
@Injectable()
export class SeedingService {

    /**
     * Initializes the service and configures the logger context.
     *
     * @param logger {BetterLogger} - Logger instance
     * @param dataSource {DataSource} - TypeORM data source
     * @param mongoConnection {MongooseConnection} - Mongoose connection (optional when MongoDB disabled)
     * @param configService {ConfigService} - Configuration service
     */
    constructor(
        private logger: BetterLogger,
        @Inject(DataSource)
        private dataSource: DataSource,
        @Optional()
        @InjectConnection()
        private mongoConnection: MongooseConnection,
        private configService: ConfigService,
    ) {
        this.logger.setContext(SeedingService.name);
        this.logger.setMessagesColor(BetterLogger.CYAN);
    }

    /**
     * Main entrypoint for database seeding.
     * Discovers all seeds, filters by environment, type and priority,
     * and executes them in the correct order. Ensures single execution.
     *
     * @returns {Promise<StepResult>} - Result of the seeding process
     */
    @InitStep({ name: 'Database seeding', priority: 50 })
    async perform(): Promise<StepResult> {
        try {
            this.logger.log('Performing seeds');

            // Dynamically import all seed files to ensure registration
            await importAllSeeds();

            // Discover environment
            const appEnv = this.configService.get('APP_ENVIRONMENT');
            const isDevelopment = appEnv === 'development';

            // Filter seeds by environment
            const seedsToRun: RegisteredSeed[] = GlobalSeedRegistry.filter(seed => {
                if (seed.options.environment === SeedEnvironment.PRODUCTION) return true;
                if (seed.options.environment === SeedEnvironment.DEVELOPMENT && isDevelopment) return true;
                return false;
            });

            const repeatableSeeds = seedsToRun
                .filter((seed) => seed.options.repeatable === true);

            // Checks if seeding has already been performed
            const alreadySeeded = await this.hasSeedingAlreadyRun();

            if (alreadySeeded) {
                if (repeatableSeeds.length === 0) {
                    this.logger.log('Seeding already performed. Skipping.');
                    return {
                        status: 'success',
                        message: 'Seeding already performed.'
                    };
                }

                this.logger.log(
                    'Seeding already performed. Running repeatable seeds only.',
                );

                await this.runSeedsByPriority(repeatableSeeds, isDevelopment);

                return {
                    status: 'success',
                    message: 'Repeatable seeds executed.'
                };
            }

            await this.runSeedsByPriority(seedsToRun, isDevelopment);

            await this.markSeedingAsDone();
            this.logger.log('Seeding perfomed');
            return { status: 'success' };
        }
        catch (error) {
            const errorMsg = error?.message || 'Error performing seeds';
            const errorStack = error?.stack ? `\n${error.stack}` : '';
            this.logger.error('Error performing seeds', error);
            return {
                status: 'failed',
                message: errorMsg + errorStack
            };
        }
    }

    /**
     * Executes seed groups in deterministic order:
     * main-prod, games-prod, main-dev, games-dev.
     */
    private async runSeedsByPriority(
        seedsToRun: RegisteredSeed[],
        isDevelopment: boolean,
    ): Promise<void> {
        for (const env of [SeedEnvironment.PRODUCTION, SeedEnvironment.DEVELOPMENT]) {
            if (env === SeedEnvironment.DEVELOPMENT && !isDevelopment) {
                continue;
            }

            for (const type of [SeedType.MAIN, SeedType.GAMES]) {
                const filtered = seedsToRun
                    .filter((seed) => (
                        seed.options.environment === env
                        && seed.options.type === type
                    ))
                    .sort((left, right) => left.options.priority - right.options.priority);

                for (const seed of filtered) {
                    await this.executeSeed(seed.target, seed.options);
                }
            }
        }
    }

    /**
     * Executes a seed based on its type (MAIN for TypeORM, GAMES for Mongoose).
     *
     * @param seedCtor {any} - Seed class constructor
     * @param options {SeedOptions} - Seed options metadata
     */
    private async executeSeed(seedCtor: any, options: SeedOptions): Promise<void> {
        if (options.type === SeedType.MAIN) {
            await this.runMainDBSeed(seedCtor);
        } else if (options.type === SeedType.GAMES) {
            await this.runGamesDBSeed(seedCtor);
        } else {
            this.logger.error(`Unknown seed type for ${seedCtor.name}: ${options.type}`);
        }
    }

    /**
     * Checks if seeding has already been performed.
     * Should be implemented using a control collection/table.
     *
     * @returns {Promise<boolean>} - True if already seeded
     */

    /**
     * Checks if seeding has already been performed using hms_app_setup table.
     *
     * @returns {Promise<boolean>} - True if already seeded
     */
    private async hasSeedingAlreadyRun(): Promise<boolean> {
        const repo = this.dataSource.getRepository(AppSetup);
        const setup = await repo.findOne({ where: { id: 1 } });
        return !!setup && !!setup.is_seeded;
    }

    /**
     * Marks that seeding has been performed.
     * Should be implemented using a control collection/table.
     *
     * @returns {Promise<void>}
     */

    /**
     * Marks that seeding has been performed in hms_app_setup table.
     *
     * @returns {Promise<void>}
     */
    private async markSeedingAsDone(): Promise<void> {
        const repo = this.dataSource.getRepository(AppSetup);
        let setup = await repo.findOne({ where: { id: 1 } });
        if (!setup) {
            setup = repo.create({ id: 1, is_seeded: true });
        } else {
            setup.is_seeded = true;
        }
        await repo.save(setup);
    }

    /**
     * Executes a TypeORM seed (main DB).
     *
     * @param seedToRun {SeederConstructor} - Seed class constructor
     */
    private async runMainDBSeed(seedToRun: SeederConstructor): Promise<void> {
        this.logger.log(`Running seed: ${seedToRun.name}`);
        try {
            await runSeeders(this.dataSource, {
                seeds: [seedToRun],
            });
            this.logger.log(`Seed ${seedToRun.name} executed successfully`);
        }
        catch (error) {
            this.logger.error(`Error running seed ${seedToRun.name}: ${error}`);
        }
    }

    /**
     * Executes a Mongo seed (games DB).
     *
     * @param seedToRun {GameDBSeedConstructor} - Seed class constructor
     */
    private async runGamesDBSeed(seedToRun: GameDBSeedConstructor): Promise<void> {
        if (!this.mongoConnection) {
            this.logger.warn(
                `Skipping MongoDB seed ${seedToRun.name}: MongoDB is disabled (DB_GAME_ENABLED=no)`
            );
            return;
        }

        this.logger.log(`Running seed: ${seedToRun.name}`);
        try {
            const seed = new seedToRun();
            await seed.run(this.mongoConnection);
            this.logger.log(`Seed ${seedToRun.name} executed successfully`);
        }
        catch (error) {
            this.logger.error(`Error running seed ${seedToRun.name}: ${error}`);
        }
    }
}