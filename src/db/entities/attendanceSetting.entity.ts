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

  @Column({
    type: 'tinyint',
    name: 'allow_student_record_attendance',
    default: 1,
  })
  allow_student_record_attendance: number;

  @Column({ type: 'int', name: 'time_reset_qr', default: 15 })
  time_reset_qr: number;

  @Column({
    type: 'tinyint',
    name: 'prevent_student_use_same_address',
    default: 1,
  })
  prevent_student_use_same_address: number;

  /**
   * relations
   */
  @OneToOne(() => CourseEntity, (course) => course.attendanceSetting)
  @JoinColumn({ name: 't_course_id' })
  course?: CourseEntity;
}
