import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1686760186144 implements MigrationInterface {
  name = 'Initial1686760186144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`m_semester\` (\`id\` int NOT NULL AUTO_INCREMENT, \`semester_name\` varchar(255) NOT NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`m_semester\``);
  }
}
