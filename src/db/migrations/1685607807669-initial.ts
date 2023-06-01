import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1685607807669 implements MigrationInterface {
  name = 'Initial1685607807669';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_course_schedule\` CHANGE \`day_of_week\` \`day_of_week\` enum ('0', '1', '2', '3', '4', '5', '6') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_course_schedule\` CHANGE \`day_of_week\` \`day_of_week\` enum ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL`,
    );
  }
}
