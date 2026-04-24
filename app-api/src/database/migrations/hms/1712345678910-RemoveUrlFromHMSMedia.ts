import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUrlFromHMSMedia1712345678910 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the url column if it exists. Consumers should store the storage key
        // in media.metadata.file_key instead.
        await queryRunner.query(`ALTER TABLE hms_media DROP COLUMN IF EXISTS url;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the url column as text. Note: restoring data is not possible.
        await queryRunner.query(`ALTER TABLE hms_media ADD COLUMN url text;`);
    }
}
