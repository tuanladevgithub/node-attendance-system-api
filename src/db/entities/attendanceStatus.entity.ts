import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { AttendanceResultEntity } from './attendanceResult.entity';

@Entity('t_attendance_status')
export class AttendanceStatusEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 't_course_id' })
  t_course_id: number;

  @Column({ type: 'varchar', name: 'title' })
  title: string;

  @Column({ type: 'varchar', name: 'acronym' })
  acronym: string;

  @Column({ type: 'tinyint', name: 'auto_set', default: 0 })
  auto_set: string;

  /**
   * relations
   */
  @ManyToOne(() => CourseEntity, (course) => course.attendanceStatuses)
  course?: CourseEntity;

  @OneToMany(() => AttendanceResultEntity, (result) => result.attendanceSession)
  attendanceResults?: AttendanceResultEntity[];
}
