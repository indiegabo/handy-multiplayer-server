import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserAuthProvider } from './user-auth-provider.entity';
import { AdminPermissions } from '../../auth/types/admin-permissions.type';
import { UserTwoFactorMethod } from './user-two-factor-method.entity';

/**
 * NOTE:
 * - Uses UUID v4 as primary key.
 * - Make sure your DB has "uuid-ossp" extension enabled or you set
 *   the default on migration (uuid_generate_v4()).
 * - Update FK columns in related entities to use "uuid" (type string).
 */
@Entity('hms_admin_users')
@Index('UQ_hms_admin_users_email', ['email'], { unique: true })
export class AdminUser {
  /**
   * Primary key as UUID v4.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Unique email for admin login.
   */
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email!: string;

  /**
   * Optional display name.
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  name?: string | null;

  /**
   * Optional password hash (can be null if SSO-only).
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  password?: string | null;

  /**
   * Global 2FA toggle for the admin account.
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  two_factor_enabled!: boolean;

  /**
   * JSON permissions blob for flexible RBAC.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  admin_permissions?: AdminPermissions | null;

  /**
   * Whether this admin is the account owner.
   */
  @Column({
    type: 'boolean',
    default: false,
  })
  is_owner!: boolean;

  /**
   * When the admin became owner (if applicable).
   */
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  became_owner_at?: Date | null;

  /**
   * Creation timestamp.
   */
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  created_at!: Date;

  /**
   * Update timestamp.
   */
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updated_at!: Date;

  /**
   * Linked authentication providers (FK must be UUID).
   */
  @OneToMany(
    () => UserAuthProvider,
    (userAuthProvider) => userAuthProvider.user,
  )
  auth_providers!: UserAuthProvider[];

  /**
   * 2FA methods registered by this admin (FK must be UUID).
   */
  @OneToMany(
    () => UserTwoFactorMethod,
    (method) => method.admin,
  )
  twoFactorMethods!: UserTwoFactorMethod[];
}
