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
import { CourseParticipationEntity } from './courseParticipation.entity';
import { AttendanceSessionEntity } from './attendanceSession.entity';
// import { AttendanceStatusEntity } from './attendanceStatus.entity';
import { AttendanceSettingEntity } from './attendanceSetting.entity';
import { BaseCreateUpdateColumnEntity } from './baseCreateUpdateColumn.entity';

@Entity('t_course')
export class CourseEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 't_teacher_id' })
  t_teacher_id: number;

  @Column({ type: 'varchar', name: 'course_code' })
  course_code: string;

  @Column({ type: 'varchar', name: 'course_name' })
  course_name: string;

  @Column({ type: 'mediumtext', name: 'description', nullable: true })
  description?: string;

  @Column({ type: 'varchar', name: 'start_date' })
  start_date: string;

  @Column({ type: 'varchar', name: 'end_date', nullable: true })
  end_date?: string;

  /**
   * relations
   */
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
}
