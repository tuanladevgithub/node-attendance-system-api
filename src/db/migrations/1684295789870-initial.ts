import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1684295789870 implements MigrationInterface {
  name = 'Initial1684295789870';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_course\` DROP COLUMN \`course_name\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD \`phone_number\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD \`phone_number\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_student\` DROP COLUMN \`phone_number\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` DROP COLUMN \`phone_number\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` ADD \`course_name\` varchar(255) NOT NULL`,
    );
  }
}
