import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
// import { CourseEntity } from './course.entity';

@Entity('m_semester')
export class SemesterEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'varchar', name: 'semester_name' })
  semester_name: string;

  @Column({ type: 'date', name: 'start_date' })
  start_date: string;

  @Column({ type: 'date', name: 'end_date' })
  end_date: string;

  /**
   * relations
   */

  // @OneToMany(() => CourseEntity, (course) => course.semester)
  // courses?: CourseEntity[];
}
