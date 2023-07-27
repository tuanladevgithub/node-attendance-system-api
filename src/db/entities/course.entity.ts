import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TeacherEntity } from './teacher.entity';
import { CourseParticipationEntity } from './course-participation.entity';
import { AttendanceSessionEntity } from './attendance-session.entity';
import { AttendanceSettingEntity } from './attendance-setting.entity';
import { BaseCreateUpdateColumnEntity } from './base-create-update-column.entity';
import { SubjectEntity } from './subject.entity';
import { CourseScheduleEntity } from './course-schedule.entity';

@Entity('t_course')
export class CourseEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'm_subject_id' })
  m_subject_id: number;

  @Column({ type: 'int', name: 't_teacher_id' })
  t_teacher_id: number;

  @Column({ type: 'varchar', name: 'course_code' })
  course_code: string;

  // @Column({ type: 'varchar', name: 'course_name' })
  // course_name: string;

  @Column({ type: 'mediumtext', name: 'description', nullable: true })
  description?: string;

  @Column({ type: 'date', name: 'start_date' })
  start_date: string;

  @Column({ type: 'date', name: 'end_date' })
  end_date: string;

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

  countStudents?: number;

  /**
   * relations
   */
  @ManyToOne(() => SubjectEntity, (subject) => subject.courses)
  @JoinColumn({ name: 'm_subject_id' })
  subject?: SubjectEntity;

  @ManyToOne(() => TeacherEntity, (teacher) => teacher.courses)
  @JoinColumn({ name: 't_teacher_id' })
  teacher?: TeacherEntity;

  @OneToMany(
    () => CourseParticipationEntity,
    (participation) => participation.course,
  )
  courseParticipation?: CourseParticipationEntity[];

  @OneToOne(() => AttendanceSettingEntity, (setting) => setting.course)
  attendanceSetting?: AttendanceSettingEntity;

  // @OneToMany(() => AttendanceStatusEntity, (status) => status.course)
  // attendanceStatuses?: AttendanceStatusEntity[];

  @OneToMany(() => AttendanceSessionEntity, (attendance) => attendance.course)
  attendanceSessions?: AttendanceSessionEntity[];

  @OneToMany(() => CourseScheduleEntity, (schedule) => schedule.course)
  courseSchedules?: CourseScheduleEntity[];
}
