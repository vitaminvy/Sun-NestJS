import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUserFollowsAndAttachmentsTables1785466341620 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_follows',
        columns: [
          {
            name: 'follower_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'following_id',
            type: 'int',
            isPrimary: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_user_follows_follower',
            columnNames: ['follower_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_user_follows_following',
            columnNames: ['following_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'user_follows',
      new TableIndex({
        name: 'IDX_user_follows_following_id',
        columnNames: ['following_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'attachments',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'attachable_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'attachable_id',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'field_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'file_size',
            type: 'int',
            unsigned: true,
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
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_attachments_attachable',
        columnNames: ['attachable_type', 'attachable_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('attachments');
    await queryRunner.dropTable('user_follows');
  }
}
