import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1690445286896 implements MigrationInterface {
  name = 'Initial1690445286896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` DROP COLUMN \`allow_send_email\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` DROP COLUMN \`allow_students_to_record_own_attendance\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` DROP COLUMN \`notify_email_content\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` DROP COLUMN \`notify_email_subject\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` DROP COLUMN \`warning_email_content\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` DROP COLUMN \`warning_email_subject\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` ADD \`attendance_rate\` int NOT NULL DEFAULT '80'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` CHANGE \`rotate_qrcode_interval_seconds\` \`rotate_qrcode_interval_seconds\` int NOT NULL DEFAULT '30'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` CHANGE \`prevent_student_use_same_address\` \`prevent_student_use_same_address\` tinyint NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` CHANGE \`prevent_student_use_same_address\` \`prevent_student_use_same_address\` tinyint NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` CHANGE \`rotate_qrcode_interval_seconds\` \`rotate_qrcode_interval_seconds\` int NULL DEFAULT '15'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` DROP COLUMN \`attendance_rate\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` ADD \`warning_email_subject\` varchar(255) NOT NULL DEFAULT 'Warning attendance email'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` ADD \`warning_email_content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` ADD \`notify_email_subject\` varchar(255) NOT NULL DEFAULT 'Notification attendance email'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` ADD \`notify_email_content\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` ADD \`allow_students_to_record_own_attendance\` tinyint NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_setting\` ADD \`allow_send_email\` tinyint NOT NULL DEFAULT '1'`,
    );
  }
}
