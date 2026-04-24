import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTwoFactorMethodsTable1744843922788 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure UUID generation is available
        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        await queryRunner.createTable(
            new Table({
                name: 'hms_user_two_factor_methods',
                columns: [
                    {
                        // PK migrated to UUID
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        // FK type aligned to UUID — polymorphic target (admin or end_user)
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'user_type',
                        type: 'enum',
                        enum: ['end_user', 'admin'],
                        default: "'end_user'",
                        isNullable: false,
                    },
                    {
                        name: 'method_type',
                        type: 'enum',
                        enum: ['email', 'authenticator', 'sms', 'backup_code'],
                        isNullable: false,
                    },
                    {
                        name: 'is_primary',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'is_enabled',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'secret_data',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
                indices: [
                    {
                        columnNames: ['user_id', 'method_type'],
                        isUnique: true,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('hms_user_two_factor_methods');
    }
}
