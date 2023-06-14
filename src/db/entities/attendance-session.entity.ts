import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { AttendanceResultEntity } from './attendance-result.entity';
import { BaseCreateUpdateColumnEntity } from './base-create-update-column.entity';

@Entity('t_attendance_session')
export class AttendanceSessionEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 't_course_id' })
  t_course_id: number;

  @Column({ type: 'varchar', name: 'password', nullable: true })
  password?: string;

  @Column({ type: 'date', name: 'session_date' })
  session_date: string;

  @Column({ type: 'int', name: 'start_hour', unsigned: true })
  start_hour: number;

  @Column({ type: 'int', name: 'start_min', unsigned: true })
  start_min: number;

  @Column({ type: 'int', name: 'end_hour', unsigned: true })
  end_hour: number;

  @Column({ type: 'int', name: 'end_min', unsigned: true })
  end_min: number;

  @Column({ type: 'mediumtext', name: 'description', nullable: true })
  description?: string;

  /**
   * relations
   */
  @ManyToOne(() => CourseEntity, (course) => course.attendanceSessions)
  @JoinColumn({ name: 't_course_id' })
  course?: CourseEntity;

  @OneToMany(() => AttendanceResultEntity, (result) => result.attendanceSession)
  attendanceResults?: AttendanceResultEntity[];
}
