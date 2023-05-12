import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1683881441242 implements MigrationInterface {
  name = 'Initial1683881441242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`m_subject\` (\`id\` int NOT NULL AUTO_INCREMENT, \`subject_code\` varchar(255) NOT NULL, \`subject_name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` ADD \`m_subject_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` ADD CONSTRAINT \`FK_b5dae04da9a0a47ea4881bb1b64\` FOREIGN KEY (\`m_subject_id\`) REFERENCES \`m_subject\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_course\` DROP FOREIGN KEY \`FK_b5dae04da9a0a47ea4881bb1b64\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_course\` DROP COLUMN \`m_subject_id\``,
    );
    await queryRunner.query(`DROP TABLE \`m_subject\``);
  }
}
