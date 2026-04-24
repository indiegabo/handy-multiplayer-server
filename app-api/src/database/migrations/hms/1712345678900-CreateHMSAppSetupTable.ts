import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAppSetupTable1712345678900 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'hms_app_setup',
                columns: [
                    {
                        name: 'id',
                        type: 'smallint',
                        isPrimary: true,
                        default: 1,
                    },
                    {
                        name: 'is_seeded',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'is_complete',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'completed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'setup_details',
                        type: 'jsonb',
                        isNullable: true,
                    },
                ],
            }),
            true, // CreateIfNotExists
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('hms_app_setup');
    }
}