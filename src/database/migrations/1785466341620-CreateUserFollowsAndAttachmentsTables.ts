import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserFollowsAndAttachmentsTables1785466341620 implements MigrationInterface {
  name = 'CreateUserFollowsAndAttachmentsTables1785466341620';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`attachments\` (
        \`id\` varchar(36) NOT NULL,
        \`attachable_type\` varchar(100) NOT NULL,
        \`attachable_id\` varchar(100) NOT NULL,
        \`field_name\` varchar(100) NULL,
        \`url\` varchar(500) NOT NULL,
        \`file_name\` varchar(255) NOT NULL,
        \`file_type\` varchar(100) NOT NULL,
        \`file_size\` int UNSIGNED NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_418b716a9043b7a66cfa8d22db\` (\`attachable_type\`, \`attachable_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`user_follows\` (
        \`follower_id\` int NOT NULL,
        \`following_id\` int NOT NULL,
        INDEX \`IDX_f7af3bf8f2dcba61b4adc10823\` (\`follower_id\`),
        INDEX \`IDX_5a71643cec3110af425f92e76e\` (\`following_id\`),
        PRIMARY KEY (\`follower_id\`, \`following_id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_follows\`
      ADD CONSTRAINT \`FK_f7af3bf8f2dcba61b4adc108239\`
      FOREIGN KEY (\`follower_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_follows\`
      ADD CONSTRAINT \`FK_5a71643cec3110af425f92e76e5\`
      FOREIGN KEY (\`following_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`user_follows\`
      DROP FOREIGN KEY \`FK_5a71643cec3110af425f92e76e5\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_follows\`
      DROP FOREIGN KEY \`FK_f7af3bf8f2dcba61b4adc108239\`
    `);
    await queryRunner.query(`
      DROP INDEX \`IDX_5a71643cec3110af425f92e76e\` ON \`user_follows\`
    `);
    await queryRunner.query(`
      DROP INDEX \`IDX_f7af3bf8f2dcba61b4adc10823\` ON \`user_follows\`
    `);
    await queryRunner.query(`
      DROP TABLE \`user_follows\`
    `);
    await queryRunner.query(`
      DROP INDEX \`IDX_418b716a9043b7a66cfa8d22db\` ON \`attachments\`
    `);
    await queryRunner.query(`
      DROP TABLE \`attachments\`
    `);
  }
}
