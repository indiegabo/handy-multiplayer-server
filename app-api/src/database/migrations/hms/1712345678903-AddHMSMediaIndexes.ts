import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddHMSMediaIndexes1712345678903 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(
            'hms_media',
            new TableIndex({
                name: 'IDX_MEDIA_TYPE',
                columnNames: ['type'],
            }),
        );

        await queryRunner.createIndex(
            'hms_media',
            new TableIndex({
                name: 'IDX_MEDIA_CREATED_AT',
                columnNames: ['created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('hms_media', 'IDX_MEDIA_TYPE');
        await queryRunner.dropIndex('hms_media', 'IDX_MEDIA_CREATED_AT');
    }
}