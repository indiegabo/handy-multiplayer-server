import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateHMSRefreshTokensTable1744843922790 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure UUID generation is available (PK uses uuid_generate_v4()).
        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        await queryRunner.createTable(
            new Table({
                name: 'hms_refresh_tokens',
                columns: [
                    {
                        // Primary key remains UUID.
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'token',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        // Polymorphic reference: align type to UUID without FK.
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
                        name: 'device_info',
                        type: 'jsonb',
                        isNullable: true,
                        comment: 'Informações do dispositivo/cliente',
                    },
                    {
                        name: 'ip_address',
                        type: 'varchar',
                        length: '45', // IPv6 support
                        isNullable: true,
                    },
                    {
                        name: 'is_revoked',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'last_used_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'refresh_count',
                        type: 'int',
                        default: 0,
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
                        name: 'IDX_REFRESH_TOKEN_USER',
                        columnNames: ['user_id', 'user_type'],
                    },
                    {
                        name: 'IDX_REFRESH_TOKEN_EXPIRES',
                        columnNames: ['expires_at'],
                    },
                    {
                        name: 'IDX_REFRESH_TOKEN_REVOKED',
                        columnNames: ['is_revoked'],
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('hms_refresh_tokens');
    }
}
