import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1688367697689 implements MigrationInterface {
  name = 'Initial1688367697689';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` ADD \`overtime_minutes_for_late\` int NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_session\` DROP COLUMN \`overtime_minutes_for_late\``,
    );
  }
}
