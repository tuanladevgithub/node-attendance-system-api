import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1684766510015 implements MigrationInterface {
  name = 'Initial1684766510015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`start_datetime\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`end_datetime\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`session_date\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`start_hour\` int UNSIGNED NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`start_min\` int UNSIGNED NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`end_hour\` int UNSIGNED NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`end_min\` int UNSIGNED NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`end_min\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`end_hour\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`start_min\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`start_hour\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`session_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`end_datetime\` datetime NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`start_datetime\` datetime NOT NULL`,
    );
  }
}
