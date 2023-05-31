import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1685541883103 implements MigrationInterface {
  name = 'Initial1685541883103';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`t_course_schedule\` (\`id\` int NOT NULL AUTO_INCREMENT, \`t_course_id\` int NOT NULL, \`day_of_week\` enum ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL, \`start_hour\` int UNSIGNED NOT NULL, \`start_min\` int UNSIGNED NOT NULL, \`end_hour\` int UNSIGNED NOT NULL, \`end_min\` int UNSIGNED NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course_schedule\` ADD CONSTRAINT \`FK_8ec666824fd061ac6898d5aa0e6\` FOREIGN KEY (\`t_course_id\`) REFERENCES \`t_course\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_course_schedule\` DROP FOREIGN KEY \`FK_8ec666824fd061ac6898d5aa0e6\``,
    );
    await queryRunner.query(`DROP TABLE \`t_course_schedule\``);
  }
}
