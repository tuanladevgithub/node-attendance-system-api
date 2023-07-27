import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';

@Entity('t_attendance_setting')
export class AttendanceSettingEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 't_course_id' })
  t_course_id: number;

  // @Column({
  //   type: 'tinyint',
  //   name: 'allow_students_to_record_own_attendance',
  //   default: 1,
  // })
  // allow_students_to_record_own_attendance: number;

  @Column({
    type: 'int',
    name: 'rotate_qrcode_interval_seconds',
    default: 30,
  })
  rotate_qrcode_interval_seconds: number;

  @Column({
    type: 'tinyint',
    name: 'prevent_student_use_same_address',
    default: 0,
  })
  prevent_student_use_same_address: number;

  @Column({
    type: 'int',
    name: 'attendance_rate',
    default: 80,
  })
  attendance_rate: number;

  // @Column({
  //   type: 'tinyint',
  //   name: 'allow_send_email',
  //   default: 1,
  // })
  // allow_send_email: number;

  // @Column({
  //   type: 'varchar',
  //   name: 'warning_email_subject',
  //   default: 'Warning attendance email',
  // })
  // warning_email_subject: string;

  // @Column({ type: 'text', name: 'warning_email_content' })
  // warning_email_content: string;

  // @Column({
  //   type: 'varchar',
  //   name: 'notify_email_subject',
  //   default: 'Notification attendance email',
  // })
  // notify_email_subject: string;

  // @Column({ type: 'text', name: 'notify_email_content' })
  // notify_email_content: string;

  /**
   * relations
   */
  @OneToOne(() => CourseEntity, (course) => course.attendanceSetting)
  @JoinColumn({ name: 't_course_id' })
  course?: CourseEntity;
}
