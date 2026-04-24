// user.entity.ts (trecho relevante)
import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Check,
  BeforeInsert, BeforeUpdate,
} from 'typeorm';
import { UserAuthProvider } from './user-auth-provider.entity';
import { AdminUser } from './admin-user.entity';
import { UserTwoFactorMethod } from './user-two-factor-method.entity';

@Entity('hms_users')
@Index('UQ_hms_users_email', ['email'], { unique: true })
@Index('UQ_hms_users_username', ['username'], { unique: true })
@Check(`"username" IS NULL OR "username" ~ '^[a-z0-9_]{4,25}$'`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_id', type: 'uuid', nullable: true })
  admin_id?: string | null;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
  admin?: AdminUser | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 25, unique: true, nullable: true })
  username?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  display_name?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string | null;

  @Column({ type: 'boolean', default: false })
  email_verified!: boolean;

  @Column({ type: 'boolean', default: false })
  two_factor_enabled!: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at!: Date;

  @OneToMany(() => UserAuthProvider, (uap) => uap.user)
  auth_providers!: UserAuthProvider[];

  @OneToMany(() => UserTwoFactorMethod, (m) => m.user)
  twoFactorMethods!: UserTwoFactorMethod[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeUsername(): void {
    if (typeof this.username === 'string') {
      const lowered = this.username.trim().toLowerCase();
      this.username = lowered.length ? lowered : null;
    }
  }

  isAdminUser(): boolean {
    return !!this.admin_id;
  }
}
