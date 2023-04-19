import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { StudentEntity } from './student.entity';
import { CourseEntity } from './course.entity';

@Entity('t_course_participation')
export class CourseParticipationEntity {
  @PrimaryColumn({ type: 'int', name: 't_student_id' })
  t_student_id: number;

  @PrimaryColumn({ type: 'int', name: 't_course_id' })
  t_course_id: number;

  /**
   * relations
   */
  @ManyToOne(() => StudentEntity, (student) => student.courseParticipation)
  student?: StudentEntity;

  @ManyToOne(() => CourseEntity, (course) => course.courseParticipation)
  course?: CourseEntity;
}
