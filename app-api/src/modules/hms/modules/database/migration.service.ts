import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BetterLogger } from '../better-logger/better-logger.service';
import { StepResult } from '../life-cycle/init/types';
import { InitStep } from '../life-cycle/init/decorators';

@Injectable()
export class MigrationService {

    constructor(
        private logger: BetterLogger,
        @Inject(DataSource)
        private dataSource: DataSource,
        private configService: ConfigService,
    ) {
        this.logger.setContext(MigrationService.name);
        this.logger.setMessagesColor(BetterLogger.CYAN);
    }

    @InitStep({ name: 'Database migration', priority: 51 })
    async perform(): Promise<StepResult> {
        try {
            this.logger.debug('Starting database migrations...');

            // The DataSource should already be initialized by TypeOrmModule.forRootAsync
            // when InitService's init methods are called, but keeping this for extreme robustness.
            if (!this.dataSource.isInitialized) {
                this.logger.warn('TypeORM DataSource not initialized. Attempting to initialize...');
                await this.dataSource.initialize();
                this.logger.debug('TypeORM DataSource initialized.');
            }


            // List all migration files registered in the DataSource
            const migrations = this.dataSource.migrations;
            this.logger.debug(`Found ${migrations.length} migration file(s) registered in DataSource.`);

            // Check how many migrations are pending
            const executed = await this.dataSource.query(`SELECT name FROM "migrations"`)
                .then((rows: any[]) => rows.map(r => r.name))
                .catch(() => []);
            const pendingMigrations = migrations
                .map(m => m.name)
                .filter(name => !executed.includes(name));
            this.logger.debug(`Found ${pendingMigrations.length} pending migration(s).`);

            // Check if there are any pending migrations
            const hasPendingMigrations = await this.dataSource.showMigrations();
            if (hasPendingMigrations) {
                this.logger.debug('Pending migrations found. Running them now...');
            } else {
                this.logger.debug('No pending migrations to run.');
            }

            const executedMigrations = await this.dataSource.runMigrations();

            if (executedMigrations.length > 0) {
                this.logger.log(`Successfully executed ${executedMigrations.length} migrations.`);
                // executedMigrations is an array of Migration objects, each having a 'name' property
                executedMigrations.forEach(migration => this.logger.debug(`- ${migration.name}`));
            } else {
                this.logger.log('No new migrations were executed (already up-to-date or none found).');
            }

            return { status: 'success', message: `Executed ${executedMigrations.length} migrations.` };
        }
        catch (error) {
            this.logger.error('Error performing migrations', error);
            return {
                status: 'failed',
                message: `Error performing migrations: ${error.message}`
            };
        }
    }
}