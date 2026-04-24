import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from "typeorm";

export class CreateHMSScopedTokensTable1744843922793
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure UUID generation is available for PK defaults.
        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        await queryRunner.createTable(
            new Table({
                name: 'hms_scoped_tokens',
                columns: [
                    {
                        // PK remains UUID.
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'creator_type',
                        type: 'enum',
                        enum: ['end_user', 'admin'],
                        default: "'end_user'",
                        isNullable: false,
                    },
                    {
                        name: 'creator_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'data',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'scopes',
                        type: 'jsonb',
                        isNullable: false,
                    },
                    {
                        name: 'revoker_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'revoked_at',
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
                ]
            }),
            true,
        );

        // Add FKs aligned to UUID PK on hms_admin_users.
        await queryRunner.createForeignKey(
            'hms_scoped_tokens',
            new TableForeignKey({
                name: 'FK_scoped_tokens_creator',
                columnNames: ['creator_id'],
                referencedTableName: 'hms_admin_users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'hms_scoped_tokens',
            new TableForeignKey({
                name: 'FK_scoped_tokens_revoker',
                columnNames: ['revoker_id'],
                referencedTableName: 'hms_admin_users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey(
            'hms_scoped_tokens',
            'FK_scoped_tokens_creator',
        );
        await queryRunner.dropForeignKey(
            'hms_scoped_tokens',
            'FK_scoped_tokens_revoker',
        );

        await queryRunner.dropTable('hms_scoped_tokens');
    }
}
