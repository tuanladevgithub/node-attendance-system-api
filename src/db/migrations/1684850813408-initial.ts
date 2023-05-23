import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1684850813408 implements MigrationInterface {
  name = 'Initial1684850813408';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_result\` CHANGE \`record_time\` \`record_time\` datetime NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_attendance_result\` CHANGE \`record_time\` \`record_time\` datetime NULL`,
    );
  }
}
