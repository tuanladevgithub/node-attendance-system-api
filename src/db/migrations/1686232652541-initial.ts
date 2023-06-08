import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1686232652541 implements MigrationInterface {
  name = 'Initial1686232652541';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`t_teacher\` DROP COLUMN \`gender\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD \`gender\` enum ('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE'`,
    );
  }
}
