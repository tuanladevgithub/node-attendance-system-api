import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1684548560833 implements MigrationInterface {
  name = 'Initial1684548560833';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`t_teacher\` DROP COLUMN \`gender\``);
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD \`gender\` enum ('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE'`,
    );
    await queryRunner.query(`ALTER TABLE \`t_student\` DROP COLUMN \`gender\``);
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD \`gender\` enum ('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`t_student\` DROP COLUMN \`gender\``);
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD \`gender\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`t_teacher\` DROP COLUMN \`gender\``);
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD \`gender\` varchar(255) NOT NULL`,
    );
  }
}
