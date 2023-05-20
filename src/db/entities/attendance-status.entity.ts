import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AttendanceResultEntity } from './attendance-result.entity';

@Entity('m_attendance_status')
export class AttendanceStatusEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  // @Column({ type: 'int', name: 't_course_id' })
  // t_course_id: number;

  @Column({ type: 'varchar', name: 'title' })
  title: string;

  @Column({ type: 'varchar', name: 'acronym' })
  acronym: string;

  @Column({ type: 'int', name: 'point' })
  point: number;

  @Column({ type: 'tinyint', name: 'auto_set_when_not_marked', default: 0 })
  auto_set_when_not_marked: number;

  /**
   * relations
   */
  // @ManyToOne(() => CourseEntity, (course) => course.attendanceStatuses)
  // course?: CourseEntity;

  @OneToMany(() => AttendanceResultEntity, (result) => result.attendanceSession)
  attendanceResults?: AttendanceResultEntity[];
}
