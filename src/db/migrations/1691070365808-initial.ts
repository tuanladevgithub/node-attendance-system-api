import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1691070365808 implements MigrationInterface {
  name = 'Initial1691070365808';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD \`password_reset_code\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD UNIQUE INDEX \`IDX_56c0960da7d4b21ea51111b268\` (\`password_reset_code\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD \`password_reset_expired_at\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD \`password_reset_code\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD UNIQUE INDEX \`IDX_703f9b175dcfd9ef4a46385764\` (\`password_reset_code\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD \`password_reset_expired_at\` datetime NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_student\` DROP COLUMN \`password_reset_expired_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` DROP INDEX \`IDX_703f9b175dcfd9ef4a46385764\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` DROP COLUMN \`password_reset_code\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` DROP COLUMN \`password_reset_expired_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` DROP INDEX \`IDX_56c0960da7d4b21ea51111b268\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` DROP COLUMN \`password_reset_code\``,
    );
  }
}
