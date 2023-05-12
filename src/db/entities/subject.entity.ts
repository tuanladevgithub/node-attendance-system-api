import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourseEntity } from './course.entity';

@Entity('m_subject')
export class SubjectEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'varchar', name: 'subject_code' })
  subject_code: string;

  @Column({ type: 'varchar', name: 'subject_name' })
  subject_name: string;

  /**
   * relations
   */

  @OneToMany(() => CourseEntity, (course) => course.subject)
  courses?: CourseEntity[];
}
