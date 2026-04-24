import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateHMSAdminUsersTable1744843614980 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure uuid generation function is available.
        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        await queryRunner.createTable(
            new Table({
                name: 'hms_admin_users',
                columns: [
                    {
                        // PK migrated to UUID
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'two_factor_enabled',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'admin_permissions',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'is_owner',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'became_owner_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true, // CreateIfNotExists
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('hms_admin_users');
    }
}
