import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TeacherEntity } from './teacher.entity';

@Entity('m_department')
export class DepartmentEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'varchar', name: 'department_name' })
  department_name: string;

  /**
   * relations
   */

  @OneToMany(() => TeacherEntity, (teacher) => teacher.department)
  teachers?: TeacherEntity[];
}
