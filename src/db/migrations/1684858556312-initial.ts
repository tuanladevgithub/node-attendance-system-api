import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1684858556312 implements MigrationInterface {
  name = 'Initial1684858556312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_1c70c17caec9eab453b255cbd3\` ON \`t_student\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` CHANGE \`teacher_code\` \`student_code\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` DROP COLUMN \`student_code\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD \`student_code\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD UNIQUE INDEX \`IDX_c0aa1770ad043a54aa819a6178\` (\`student_code\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_student\` DROP INDEX \`IDX_c0aa1770ad043a54aa819a6178\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` DROP COLUMN \`student_code\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` ADD \`student_code\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_student\` CHANGE \`student_code\` \`teacher_code\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_1c70c17caec9eab453b255cbd3\` ON \`t_student\` (\`teacher_code\`)`,
    );
  }
}
