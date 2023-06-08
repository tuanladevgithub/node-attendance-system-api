import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1686194121363 implements MigrationInterface {
  name = 'Initial1686194121363';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`m_department\` (\`id\` int NOT NULL AUTO_INCREMENT, \`department_name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD \`m_department_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` ADD CONSTRAINT \`FK_cd9bc595c3b3490abdebe170b89\` FOREIGN KEY (\`m_department_id\`) REFERENCES \`m_department\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` DROP FOREIGN KEY \`FK_cd9bc595c3b3490abdebe170b89\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`t_teacher\` DROP COLUMN \`m_department_id\``,
    );
    await queryRunner.query(`DROP TABLE \`m_department\``);
  }
}
