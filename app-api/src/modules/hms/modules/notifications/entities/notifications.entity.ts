// src/core/notifications/entities/notifications.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Entity({ name: 'hms_notifications' })
@Index(
    'IDX_hms_notifications_notifiable',
    ['notifiable_type', 'notifiable_id'],
)
@Index(
    'IDX_hms_notifications_notifier_id',
    ['notifier_id'],
)
@Index(
    'IDX_hms_notifications_channel',
    ['channel'],
)
@Index(
    'IDX_hms_notifications_status',
    ['status'],
)
@Index(
    'IDX_hms_notifications_scheduled_at',
    ['scheduled_at'],
)
/** New composite index for queue-style queries. */
@Index(
    'IDX_hms_notifications_status_channel_queued',
    ['status', 'channel', 'queued_at'],
)
/** New composite index for time-ordered lookups per entity. */
@Index(
    'IDX_hms_notifications_notifiable_created',
    ['notifiable_type', 'notifiable_id', 'created_at'],
)
export class HmsNotification {
    /** PK using UUID v4. */
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Polymorphic receiver (no strict FK). */
    @Column({
        name: 'notifiable_type',
        type: 'varchar',
        length: 255,
    })
    notifiable_type!: string;

    @Column({
        name: 'notifiable_id',
        type: 'uuid',
    })
    notifiable_id!: string;

    /** Notifier admin (nullable). */
    @Column({
        name: 'notifier_id',
        type: 'uuid',
        nullable: true,
    })
    notifier_id?: string | null;

    @ManyToOne(
        () => AdminUser,
        { nullable: true, onDelete: 'SET NULL' },
    )
    @JoinColumn({ name: 'notifier_id' })
    notifier?: AdminUser | null;

    /** Channel and status. */
    @Column({
        name: 'channel',
        type: 'enum',
        enum: NotificationChannel,
        enumName: 'hms_notifications_channel_enum',
    })
    channel!: NotificationChannel;

    @Column({
        name: 'status',
        type: 'enum',
        enum: NotificationStatus,
        enumName: 'hms_notifications_status_enum',
        default: NotificationStatus.QUEUED,
    })
    status!: NotificationStatus;

    /** Template metadata. */
    @Column({
        name: 'template_key',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    template_key?: string | null;

    @Column({
        name: 'template_version',
        type: 'varchar',
        length: 64,
        nullable: true,
    })
    template_version?: string | null;

    /** Human-facing content. */
    @Column({
        name: 'subject',
        type: 'varchar',
        length: 512,
        nullable: true,
    })
    subject?: string | null;

    @Column({
        name: 'body',
        type: 'text',
        nullable: true,
    })
    body?: string | null;

    /** Payloads. */
    @Column({
        name: 'data_context',
        type: 'jsonb',
        nullable: true,
    })
    data_context?: Record<string, any> | null;

    @Column({
        name: 'delivery_payload',
        type: 'jsonb',
        nullable: true,
    })
    delivery_payload?: Record<string, any> | null;

    @Column({
        name: 'meta',
        type: 'jsonb',
        nullable: true,
    })
    meta?: Record<string, any> | null;

    /** Scheduling & lifecycle. */
    @Column({
        name: 'scheduled_at',
        type: 'timestamp',
        nullable: true,
    })
    scheduled_at?: Date | null;

    @Column({
        name: 'queued_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    queued_at!: Date;

    @Column({
        name: 'sent_at',
        type: 'timestamp',
        nullable: true,
    })
    sent_at?: Date | null;

    @Column({
        name: 'delivered_at',
        type: 'timestamp',
        nullable: true,
    })
    delivered_at?: Date | null;

    @Column({
        name: 'read_at',
        type: 'timestamp',
        nullable: true,
    })
    read_at?: Date | null;

    @Column({
        name: 'failed_at',
        type: 'timestamp',
        nullable: true,
    })
    failed_at?: Date | null;

    /** Error diagnostics. */
    @Column({
        name: 'error_code',
        type: 'varchar',
        length: 128,
        nullable: true,
    })
    error_code?: string | null;

    @Column({
        name: 'error_message',
        type: 'varchar',
        length: 1024,
        nullable: true,
    })
    error_message?: string | null;

    /** Common timestamps. */
    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    created_at!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updated_at!: Date;
}
