import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { AttendanceResultEntity } from './attendanceResult.entity';

@Entity('t_attendance_session')
export class AttendanceSessionEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 't_course_id' })
  t_course_id: number;

  @Column({ type: 'datetime', name: 'start_datetime' })
  start_datetime: Date;

  @Column({ type: 'int', name: 'duration' })
  duration: number;

  @Column({ type: 'mediumtext', name: 'description', nullable: true })
  description?: string;

  /**
   * relations
   */
  @ManyToOne(() => CourseEntity, (course) => course.attendanceSessions)
  course?: CourseEntity;

  @OneToMany(() => AttendanceResultEntity, (result) => result.attendanceSession)
  attendanceResults?: AttendanceResultEntity[];
}
