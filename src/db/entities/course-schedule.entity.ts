import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DayOfWeek } from 'src/types/common.type';
import { CourseEntity } from './course.entity';

@Entity('t_course_schedule')
export class CourseScheduleEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 't_course_id' })
  t_course_id: number;

  @Column({ type: 'enum', name: 'day_of_week', enum: DayOfWeek })
  day_of_week: DayOfWeek;

  @Column({ type: 'int', name: 'start_hour', unsigned: true })
  start_hour: number;

  @Column({ type: 'int', name: 'start_min', unsigned: true })
  start_min: number;

  @Column({ type: 'int', name: 'end_hour', unsigned: true })
  end_hour: number;

  @Column({ type: 'int', name: 'end_min', unsigned: true })
  end_min: number;

  /**
   * relations
   */
  @ManyToOne(() => CourseEntity, (course) => course.courseSchedules)
  @JoinColumn({ name: 't_course_id' })
  course?: CourseEntity;
}
