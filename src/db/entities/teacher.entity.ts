import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { BaseCreateUpdateColumnEntity } from './base-create-update-column.entity';
import { DepartmentEntity } from './department.entity';

@Entity('t_teacher')
export class TeacherEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'm_department_id' })
  m_department_id: number;

  @Column({ type: 'varchar', name: 'teacher_code', unique: true })
  teacher_code: string;

  @Column({ type: 'varchar', name: 'email', unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password' })
  password: string;

  @Column({ type: 'varchar', name: 'last_name' })
  last_name: string;

  @Column({ type: 'varchar', name: 'first_name' })
  first_name: string;

  @Column({ type: 'varchar', name: 'phone_number', nullable: true })
  phone_number?: string;

  @Column({ type: 'mediumtext', name: 'description', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    name: 'password_reset_code',
    nullable: true,
    unique: true,
  })
  password_reset_code: string | null;

  @Column({
    type: 'datetime',
    name: 'password_reset_expired_at',
    nullable: true,
  })
  password_reset_expired_at: Date | null;

  /**
   * relations
   */
  @ManyToOne(() => DepartmentEntity, (department) => department.teachers)
  @JoinColumn({ name: 'm_department_id' })
  department?: DepartmentEntity;

  @OneToMany(() => CourseEntity, (course) => course.teacher)
  courses?: CourseEntity[];
}
