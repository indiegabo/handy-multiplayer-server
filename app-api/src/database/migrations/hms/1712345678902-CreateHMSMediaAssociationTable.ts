// migrations/1712345678902-CreateHMSMediaAssociationTable.ts
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateHMSMediaAssociationTable1712345678902
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure uuid generation is available for PK defaults.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        await queryRunner.createTable(
            new Table({
                name: 'hms_media_association',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'media_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'entity_type',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'entity_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'collection_name',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        // New: ordering inside a collection (0-based).
                        name: 'position',
                        type: 'int',
                        isNullable: false,
                        default: 0,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // FK to hms_media(id)
        await queryRunner.createForeignKey(
            'hms_media_association',
            new TableForeignKey({
                columnNames: ['media_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'hms_media',
                onDelete: 'CASCADE',
            }),
        );

        // Non-unique indexes (kept from your original migration)
        await queryRunner.createIndex(
            'hms_media_association',
            new TableIndex({
                name: 'IDX_MEDIA_ASSOCIATION_ENTITY',
                columnNames: ['entity_type', 'entity_id'],
            }),
        );
        await queryRunner.createIndex(
            'hms_media_association',
            new TableIndex({
                name: 'IDX_MEDIA_ASSOCIATION_COLLECTION',
                columnNames: ['collection_name'],
            }),
        );

        // ------------------------------------------------------------
        // Unique constraints with NULL-safe semantics (PostgreSQL):
        // - duplicates should be prevented both when collection_name IS NULL
        //   and when it is NOT NULL. We use partial unique indexes.
        // ------------------------------------------------------------

        // (A) Unique media per entity when collection_name IS NULL
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_MEDIA_ASSOC_UNIQUE_MEDIA_NULL"
            ON "hms_media_association" ("entity_type", "entity_id", "media_id")
            WHERE "collection_name" IS NULL;
        `);

        // (B) Unique media per entity+collection when collection_name IS NOT NULL
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_MEDIA_ASSOC_UNIQUE_MEDIA_NOT_NULL"
            ON "hms_media_association" ("entity_type", "entity_id", "collection_name", "media_id")
            WHERE "collection_name" IS NOT NULL;
        `);

        // (C) Unique position per entity when collection_name IS NULL
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_MEDIA_ASSOC_UNIQUE_POS_NULL"
            ON "hms_media_association" ("entity_type", "entity_id", "position")
            WHERE "collection_name" IS NULL;
        `);

        // (D) Unique position per entity+collection when collection_name IS NOT NULL
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_MEDIA_ASSOC_UNIQUE_POS_NOT_NULL"
            ON "hms_media_association" ("entity_type", "entity_id", "collection_name", "position")
            WHERE "collection_name" IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop partial unique indexes explicitly before dropping table
        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_MEDIA_ASSOC_UNIQUE_POS_NOT_NULL";`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_MEDIA_ASSOC_UNIQUE_POS_NULL";`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_MEDIA_ASSOC_UNIQUE_MEDIA_NOT_NULL";`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_MEDIA_ASSOC_UNIQUE_MEDIA_NULL";`,
        );

        // Drop non-unique indexes (TypeORM-created)
        await queryRunner.dropIndex(
            'hms_media_association',
            'IDX_MEDIA_ASSOCIATION_COLLECTION',
        );
        await queryRunner.dropIndex(
            'hms_media_association',
            'IDX_MEDIA_ASSOCIATION_ENTITY',
        );

        // Finally the table
        await queryRunner.dropTable('hms_media_association');
    }
}
