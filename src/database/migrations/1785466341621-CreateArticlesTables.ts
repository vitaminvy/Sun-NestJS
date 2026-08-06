import { MigrationInterface, QueryRunner } from 'typeorm';

const DROP_ARTICLE_FAVORITES_TABLE_SQL = 'DROP TABLE `article_favorites`';
const DROP_ARTICLE_TAGS_TABLE_SQL = 'DROP TABLE `article_tags`';
const DROP_TAGS_TABLE_SQL = 'DROP TABLE `tags`';
const DROP_ARTICLES_TABLE_SQL = 'DROP TABLE `articles`';

export class CreateArticlesTables1785466341621 implements MigrationInterface {
  name = 'CreateArticlesTables1785466341621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`articles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`slug\` varchar(255) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NOT NULL,
        \`body\` text NOT NULL,
        \`author_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_articles_slug\` (\`slug\`),
        INDEX \`IDX_articles_author_id\` (\`author_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_articles_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`tags\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        UNIQUE INDEX \`IDX_tags_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`article_tags\` (
        \`article_id\` int NOT NULL,
        \`tag_id\` int NOT NULL,
        INDEX \`IDX_article_tags_tag_id\` (\`tag_id\`),
        PRIMARY KEY (\`article_id\`, \`tag_id\`),
        CONSTRAINT \`FK_article_tags_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_article_tags_tag\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\`(\`id\`) ON DELETE CASCADE
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`article_favorites\` (
        \`article_id\` int NOT NULL,
        \`user_id\` int NOT NULL,
        INDEX \`IDX_article_favorites_user_id\` (\`user_id\`),
        PRIMARY KEY (\`article_id\`, \`user_id\`),
        CONSTRAINT \`FK_article_favorites_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_article_favorites_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE = InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(DROP_ARTICLE_FAVORITES_TABLE_SQL);
    await queryRunner.query(DROP_ARTICLE_TAGS_TABLE_SQL);
    await queryRunner.query(DROP_TAGS_TABLE_SQL);
    await queryRunner.query(DROP_ARTICLES_TABLE_SQL);
  }
}
