import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1688283354423 implements MigrationInterface {
  name = 'Initial1688283354423';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_result\` ADD \`record_by_teacher\` tinyint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_result\` CHANGE \`ip_address\` \`ip_address\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_result\` CHANGE \`ip_address\` \`ip_address\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_result\` DROP COLUMN \`record_by_teacher\``,
    );
  }
}
