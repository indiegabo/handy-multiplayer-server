import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateHMSUsersTable1744843614981
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure UUID generation is available in Postgres.
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    );

    await queryRunner.createTable(
      new Table({
        name: "hms_users",
        columns: [
          {
            // Primary key as UUID v4.
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            // FK aligned to UUID (hms_admin_users.id).
            name: "admin_id",
            type: "uuid",
            isNullable: true,
          },
          {
            // Unique email for login.
            name: "email",
            type: "varchar",
            length: "255",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "username",
            type: "varchar",
            length: "255",
            isNullable: true,
            isUnique: false,
          },
          {
            // Optional display name.
            name: "display_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            // Optional password hash (may be null for SSO-only).
            name: "password",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "email_verified",
            type: "boolean",
            default: false,
          },
          {
            name: "two_factor_enabled",
            type: "boolean",
            default: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            // Timestamp parity; application should update this column.
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ["admin_id"],
            referencedTableName: "hms_admin_users",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL",
          }),
        ],
      }),
      true, // createIfNotExists
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("hms_users");
  }
}
