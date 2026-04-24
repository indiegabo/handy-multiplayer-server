import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateHMSLobbiesTables1744843922791 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure UUID generation function is available for PK defaults.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        // hms_lobbies
        await queryRunner.createTable(
            new Table({
                name: 'hms_lobbies',
                columns: [
                    {
                        // PK migrated to UUID
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'max_users',
                        type: 'int',
                        default: 10,
                    },
                    {
                        name: 'current_users_count',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['composing', 'game_in_progress', 'game_ended'],
                        default: "'composing'",
                    },
                    {
                        // Kept as original (no FK here in your schema)
                        name: 'game_instance_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'owner_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'invite_only',
                        type: 'boolean',
                        default: false,
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
                foreignKeys: [
                    {
                        name: 'FK_lobbies_owner',
                        columnNames: ['owner_id'],
                        referencedTableName: 'hms_users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true, // CreateIfNotExists
        );

        // hms_lobbies_users (junction)
        await queryRunner.createTable(
            new Table({
                name: 'hms_lobbies_users',
                columns: [
                    {
                        // Composite PK part → uuid
                        name: 'lobby_id',
                        type: 'uuid',
                        isPrimary: true,
                    },
                    {
                        // Composite PK part → uuid
                        name: 'user_id',
                        type: 'uuid',
                        isPrimary: true,
                    },
                    {
                        name: 'joined_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        name: 'FK_lobby_users_lobby',
                        columnNames: ['lobby_id'],
                        referencedTableName: 'hms_lobbies',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        name: 'FK_lobby_users',
                        columnNames: ['user_id'],
                        referencedTableName: 'hms_users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true, // CreateIfNotExists
        );

        // hms_lobbies_invites
        await queryRunner.createTable(
            new Table({
                name: 'hms_lobbies_invites',
                columns: [
                    {
                        // PK migrated to UUID
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        // FK to hms_lobbies(id) -> uuid
                        name: 'lobby_id',
                        type: 'uuid',
                    },
                    {
                        // FK to hms_users(id) -> uuid
                        name: 'inviter_id',
                        type: 'uuid',
                    },
                    {
                        // FK to hms_users(id) -> uuid
                        name: 'invitee_id',
                        type: 'uuid',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'accepted', 'declined'],
                        default: "'pending'",
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
                foreignKeys: [
                    {
                        name: 'FK_lobby_invites_lobby',
                        columnNames: ['lobby_id'],
                        referencedTableName: 'hms_lobbies',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        name: 'FK_lobby_invites_inviter',
                        columnNames: ['inviter_id'],
                        referencedTableName: 'hms_users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        name: 'FK_lobby_invites_invitee',
                        columnNames: ['invitee_id'],
                        referencedTableName: 'hms_users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true, // CreateIfNotExists
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('hms_lobbies_invites');
        await queryRunner.dropTable('hms_lobbies_users');
        await queryRunner.dropTable('hms_lobbies');
    }
}
