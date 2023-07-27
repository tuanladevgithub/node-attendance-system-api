import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1690445682896 implements MigrationInterface {
  name = 'Initial1690445682896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_course\` ADD \`rotate_qrcode_interval_seconds\` int NOT NULL DEFAULT '30'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` ADD \`prevent_student_use_same_address\` tinyint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` ADD \`attendance_rate\` int NOT NULL DEFAULT '80'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_course\` DROP COLUMN \`attendance_rate\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` DROP COLUMN \`prevent_student_use_same_address\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` DROP COLUMN \`rotate_qrcode_interval_seconds\``,
    );
  }
}
