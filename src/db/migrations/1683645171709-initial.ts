import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1683645171709 implements MigrationInterface {
    name = 'Initial1683645171709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`t_admin\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_5f36faa51a6a7b379e8d5e3860\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`t_teacher\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`teacher_code\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`last_name\` varchar(255) NOT NULL, \`first_name\` varchar(255) NOT NULL, \`gender\` varchar(255) NOT NULL, \`description\` mediumtext NULL, UNIQUE INDEX \`IDX_75285f37c6e2c0e0249e66d5ff\` (\`teacher_code\`), UNIQUE INDEX \`IDX_c7fdc528f5d440bf14d75803fc\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`t_student\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`teacher_code\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`last_name\` varchar(255) NOT NULL, \`first_name\` varchar(255) NOT NULL, \`gender\` varchar(255) NOT NULL, \`age\` int NULL, UNIQUE INDEX \`IDX_1c70c17caec9eab453b255cbd3\` (\`teacher_code\`), UNIQUE INDEX \`IDX_d51de5a12b5a5be6e21911c0f9\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`t_course_participation\` (\`t_student_id\` int NOT NULL, \`t_course_id\` int NOT NULL, PRIMARY KEY (\`t_student_id\`, \`t_course_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`t_attendance_setting\` (\`id\` int NOT NULL AUTO_INCREMENT, \`t_course_id\` int NOT NULL, \`allow_students_to_record_own_attendance\` tinyint NOT NULL DEFAULT '1', \`rotate_qrcode_interval_seconds\` int NULL DEFAULT '15', \`prevent_student_use_same_address\` tinyint NOT NULL DEFAULT '1', \`allow_send_email\` tinyint NOT NULL DEFAULT '1', \`warning_email_subject\` varchar(255) NOT NULL DEFAULT 'Warning attendance email', \`warning_email_content\` text NOT NULL, \`notify_email_subject\` varchar(255) NOT NULL DEFAULT 'Notification attendance email', \`notify_email_content\` text NOT NULL, UNIQUE INDEX \`REL_165dc322099600e7d93b529a8b\` (\`t_course_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`t_course\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`t_teacher_id\` int NOT NULL, \`course_code\` varchar(255) NOT NULL, \`course_name\` varchar(255) NOT NULL, \`description\` mediumtext NULL, \`start_date\` varchar(255) NOT NULL, \`end_date\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`t_attendance_session\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`t_course_id\` int NOT NULL, \`password\` varchar(255) NULL, \`start_datetime\` datetime NOT NULL, \`end_datetime\` datetime NOT NULL, \`description\` mediumtext NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`m_attendance_status\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`acronym\` varchar(255) NOT NULL, \`point\` int NOT NULL, \`auto_set_when_not_marked\` tinyint NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`t_attendance_result\` (\`t_attendance_session_id\` int NOT NULL, \`t_student_id\` int NOT NULL, \`m_attendance_status_id\` int NULL, \`record_time\` datetime NULL, \`ip_address\` varchar(255) NOT NULL, PRIMARY KEY (\`t_attendance_session_id\`, \`t_student_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`t_course_participation\` ADD CONSTRAINT \`FK_256234aabf02280b8150b62bc1e\` FOREIGN KEY (\`t_student_id\`) REFERENCES \`t_student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`t_course_participation\` ADD CONSTRAINT \`FK_902e590eee82adadcc9caeed883\` FOREIGN KEY (\`t_course_id\`) REFERENCES \`t_course\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`t_attendance_setting\` ADD CONSTRAINT \`FK_165dc322099600e7d93b529a8ba\` FOREIGN KEY (\`t_course_id\`) REFERENCES \`t_course\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`t_course\` ADD CONSTRAINT \`FK_9223942a2f558f74f46fa2fc31d\` FOREIGN KEY (\`t_teacher_id\`) REFERENCES \`t_teacher\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`t_attendance_session\` ADD CONSTRAINT \`FK_c2a3c36cd7986b670d24c692a13\` FOREIGN KEY (\`t_course_id\`) REFERENCES \`t_course\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`t_attendance_result\` ADD CONSTRAINT \`FK_8e36ddcf16b95941b054a80906e\` FOREIGN KEY (\`t_attendance_session_id\`) REFERENCES \`t_attendance_session\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`t_attendance_result\` ADD CONSTRAINT \`FK_ddbe38f707e7c9be0f1ac5bde80\` FOREIGN KEY (\`t_student_id\`) REFERENCES \`t_student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`t_attendance_result\` ADD CONSTRAINT \`FK_5b9965187f3e2d24760adb24b80\` FOREIGN KEY (\`m_attendance_status_id\`) REFERENCES \`m_attendance_status\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`t_attendance_result\` DROP FOREIGN KEY \`FK_5b9965187f3e2d24760adb24b80\``);
        await queryRunner.query(`ALTER TABLE \`t_attendance_result\` DROP FOREIGN KEY \`FK_ddbe38f707e7c9be0f1ac5bde80\``);
        await queryRunner.query(`ALTER TABLE \`t_attendance_result\` DROP FOREIGN KEY \`FK_8e36ddcf16b95941b054a80906e\``);
        await queryRunner.query(`ALTER TABLE \`t_attendance_session\` DROP FOREIGN KEY \`FK_c2a3c36cd7986b670d24c692a13\``);
        await queryRunner.query(`ALTER TABLE \`t_course\` DROP FOREIGN KEY \`FK_9223942a2f558f74f46fa2fc31d\``);
        await queryRunner.query(`ALTER TABLE \`t_attendance_setting\` DROP FOREIGN KEY \`FK_165dc322099600e7d93b529a8ba\``);
        await queryRunner.query(`ALTER TABLE \`t_course_participation\` DROP FOREIGN KEY \`FK_902e590eee82adadcc9caeed883\``);
        await queryRunner.query(`ALTER TABLE \`t_course_participation\` DROP FOREIGN KEY \`FK_256234aabf02280b8150b62bc1e\``);
        await queryRunner.query(`DROP TABLE \`t_attendance_result\``);
        await queryRunner.query(`DROP TABLE \`m_attendance_status\``);
        await queryRunner.query(`DROP TABLE \`t_attendance_session\``);
        await queryRunner.query(`DROP TABLE \`t_course\``);
        await queryRunner.query(`DROP INDEX \`REL_165dc322099600e7d93b529a8b\` ON \`t_attendance_setting\``);
        await queryRunner.query(`DROP TABLE \`t_attendance_setting\``);
        await queryRunner.query(`DROP TABLE \`t_course_participation\``);
        await queryRunner.query(`DROP INDEX \`IDX_d51de5a12b5a5be6e21911c0f9\` ON \`t_student\``);
        await queryRunner.query(`DROP INDEX \`IDX_1c70c17caec9eab453b255cbd3\` ON \`t_student\``);
        await queryRunner.query(`DROP TABLE \`t_student\``);
        await queryRunner.query(`DROP INDEX \`IDX_c7fdc528f5d440bf14d75803fc\` ON \`t_teacher\``);
        await queryRunner.query(`DROP INDEX \`IDX_75285f37c6e2c0e0249e66d5ff\` ON \`t_teacher\``);
        await queryRunner.query(`DROP TABLE \`t_teacher\``);
        await queryRunner.query(`DROP INDEX \`IDX_5f36faa51a6a7b379e8d5e3860\` ON \`t_admin\``);
        await queryRunner.query(`DROP TABLE \`t_admin\``);
    }

}
