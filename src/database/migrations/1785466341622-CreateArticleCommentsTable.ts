import { MigrationInterface, QueryRunner } from 'typeorm';

const DROP_ARTICLE_COMMENTS_TABLE_SQL = 'DROP TABLE `article_comments`';

export class CreateArticleCommentsTable1785466341622 implements MigrationInterface {
  name = 'CreateArticleCommentsTable1785466341622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`article_comments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`body\` text NOT NULL,
        \`article_id\` int NOT NULL,
        \`author_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_article_comments_article_id\` (\`article_id\`),
        INDEX \`IDX_article_comments_author_id\` (\`author_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_article_comments_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_article_comments_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE = InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(DROP_ARTICLE_COMMENTS_TABLE_SQL);
  }
}
