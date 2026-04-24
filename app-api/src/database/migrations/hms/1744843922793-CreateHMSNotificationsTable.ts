// src/database/migrations/1744843922793-create-hms-notifications-table.ts
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

/**
 * Initial creation of the hms_notifications table,
 * including enums, FKs, and relevant indexes.
 *
 * Notes:
 * - Includes 'socket_io' in the channel enum.
 * - Adds composite indexes tuned for queue analytics
 *   and entity-scoped lookups.
 */
export class CreateHMSNotificationsTable1744843922793
    implements MigrationInterface {

    public async up(
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Ensure uuid generation function is available.
        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        // Create enum types for Postgres explicitly (idempotent).
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname =
                      'hms_notifications_status_enum'
                ) THEN
                    CREATE TYPE
                      "hms_notifications_status_enum"
                    AS ENUM (
                        'queued',
                        'scheduled',
                        'sending',
                        'sent',
                        'delivered',
                        'failed',
                        'read'
                    );
                END IF;
            END$$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname =
                      'hms_notifications_channel_enum'
                ) THEN
                    CREATE TYPE
                      "hms_notifications_channel_enum"
                    AS ENUM (
                        'email',
                        'sms',
                        'discord',
                        'push',
                        'in_app',
                        'webhook',
                        'socket_io'
                    );
                END IF;
            END$$;
        `);

        await queryRunner.createTable(
            new Table({
                name: 'hms_notifications',
                columns: [
                    {
                        // PK using UUID v4.
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },

                    /**
                     * Polymorphic receiver (who gets the notification).
                     * Not a strict FK by design.
                     */
                    {
                        name: 'notifiable_type',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'notifiable_id',
                        type: 'uuid',
                        isNullable: false,
                    },

                    /**
                     * Notifier admin ID (FK to hms_admin_users.id).
                     * If NULL, the system is the emitter.
                     */
                    {
                        name: 'notifier_id',
                        type: 'uuid',
                        isNullable: true,
                    },

                    /**
                     * Delivery channel and status.
                     */
                    {
                        name: 'channel',
                        type: 'hms_notifications_channel_enum',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'hms_notifications_status_enum',
                        isNullable: false,
                        default: `'queued'`,
                    },

                    /**
                     * Template metadata.
                     */
                    {
                        name: 'template_key',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'template_version',
                        type: 'varchar',
                        length: '64',
                        isNullable: true,
                    },

                    /**
                     * Human-facing content.
                     */
                    {
                        name: 'subject',
                        type: 'varchar',
                        length: '512',
                        isNullable: true,
                    },
                    {
                        name: 'body',
                        type: 'text',
                        isNullable: true,
                    },

                    /**
                     * Payloads.
                     */
                    {
                        name: 'data_context',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'delivery_payload',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'meta',
                        type: 'jsonb',
                        isNullable: true,
                    },

                    /**
                     * Scheduling and lifecycle timestamps.
                     */
                    {
                        name: 'scheduled_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'queued_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'sent_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'delivered_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'read_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'failed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },

                    /**
                     * Error diagnostics.
                     */
                    {
                        name: 'error_code',
                        type: 'varchar',
                        length: '128',
                        isNullable: true,
                    },
                    {
                        name: 'error_message',
                        type: 'varchar',
                        length: '1024',
                        isNullable: true,
                    },

                    /**
                     * Common timestamps.
                     */
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
                    new TableForeignKey({
                        columnNames: ['notifier_id'],
                        referencedTableName: 'hms_admin_users',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    }),
                ],
            }),
            true,
        );

        // Simple indexes.
        await queryRunner.createIndex(
            'hms_notifications',
            new TableIndex({
                name: 'IDX_hms_notifications_notifiable',
                columnNames: [
                    'notifiable_type',
                    'notifiable_id',
                ],
            }),
        );

        await queryRunner.createIndex(
            'hms_notifications',
            new TableIndex({
                name: 'IDX_hms_notifications_notifier_id',
                columnNames: ['notifier_id'],
            }),
        );

        await queryRunner.createIndex(
            'hms_notifications',
            new TableIndex({
                name: 'IDX_hms_notifications_channel',
                columnNames: ['channel'],
            }),
        );

        await queryRunner.createIndex(
            'hms_notifications',
            new TableIndex({
                name: 'IDX_hms_notifications_status',
                columnNames: ['status'],
            }),
        );

        await queryRunner.createIndex(
            'hms_notifications',
            new TableIndex({
                name: 'IDX_hms_notifications_scheduled_at',
                columnNames: ['scheduled_at'],
            }),
        );

        // Composite indexes (queue analytics and lookups).
        await queryRunner.createIndex(
            'hms_notifications',
            new TableIndex({
                name:
                    'IDX_hms_notifications_status_channel_queued',
                columnNames: [
                    'status',
                    'channel',
                    'queued_at',
                ],
            }),
        );

        await queryRunner.createIndex(
            'hms_notifications',
            new TableIndex({
                name:
                    'IDX_hms_notifications_notifiable_created',
                columnNames: [
                    'notifiable_type',
                    'notifiable_id',
                    'created_at',
                ],
            }),
        );
    }

    public async down(
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Drop composite indexes.
        await queryRunner.dropIndex(
            'hms_notifications',
            'IDX_hms_notifications_status_channel_queued',
        );

        await queryRunner.dropIndex(
            'hms_notifications',
            'IDX_hms_notifications_notifiable_created',
        );

        // Drop simple indexes.
        await queryRunner.dropIndex(
            'hms_notifications',
            'IDX_hms_notifications_notifiable',
        );
        await queryRunner.dropIndex(
            'hms_notifications',
            'IDX_hms_notifications_notifier_id',
        );
        await queryRunner.dropIndex(
            'hms_notifications',
            'IDX_hms_notifications_channel',
        );
        await queryRunner.dropIndex(
            'hms_notifications',
            'IDX_hms_notifications_status',
        );
        await queryRunner.dropIndex(
            'hms_notifications',
            'IDX_hms_notifications_scheduled_at',
        );

        await queryRunner.dropTable('hms_notifications');

        // Drop types. Safe if table is already dropped.
        await queryRunner.query(
            `DROP TYPE IF EXISTS "hms_notifications_status_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "hms_notifications_channel_enum"`,
        );
    }
}
