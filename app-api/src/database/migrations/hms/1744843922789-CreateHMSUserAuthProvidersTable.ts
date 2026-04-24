import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from "typeorm";

export class CreateHMSUserAuthProvidersTable1744843922789
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure UUID generation is available (id uses uuid_generate_v4()).
        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        );

        await queryRunner.createTable(
            new Table({
                name: "hms_users_auth_providers",
                columns: [
                    {
                        // PK already uuid in the original file; keep as is.
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "user_type",
                        type: "enum",
                        enum: ["end_user", "admin"],
                        default: "'end_user'",
                        isNullable: false,
                    },
                    {
                        // FK type aligned to hms_users.id (uuid).
                        name: "user_id",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "provider",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "data",
                        type: "jsonb",
                        isNullable: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true, // CreateIfNotExists
        );

        // FK aligned to uuid PK on hms_users.
        await queryRunner.createForeignKey(
            "hms_users_auth_providers",
            new TableForeignKey({
                name: "FK_users_users_auth_providers",
                columnNames: ["user_id"],
                referencedTableName: "hms_users",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the FK from the correct table name.
        await queryRunner.dropForeignKey(
            "hms_users_auth_providers",
            "FK_users_users_auth_providers",
        );

        await queryRunner.dropTable("hms_users_auth_providers");
    }
}
