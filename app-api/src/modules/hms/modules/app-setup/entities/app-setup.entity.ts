import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('hms_app_setup')
export class AppSetup {
    @PrimaryColumn({ default: 1, type: 'smallint' })
    id: number;

    @Column({ default: false })
    is_seeded: boolean;

    @Column({ default: false })
    is_complete: boolean;

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date;

    @Column({ type: 'jsonb', nullable: true })
    setup_details: Record<string, any>;
}