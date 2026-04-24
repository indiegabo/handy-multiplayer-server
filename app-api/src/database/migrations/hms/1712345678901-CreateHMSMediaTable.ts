import {
  MigrationInterface,
  QueryRunner,
  Table,
} from 'typeorm';

export class CreateHMSMediaTable1712345678901
  implements MigrationInterface {

  public async up(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Ensure uuid generation function is available.
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'hms_media',
        columns: [
          {
            // Primary key migrated to UUID.
            // Do not use auto-increment with UUID.
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['image', 'video', 'audio', 'document'],
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'mimetype',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
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
      }),
      true,
    );
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.dropTable('hms_media');
  }
}
