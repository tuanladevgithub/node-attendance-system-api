import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourseEntity } from './course.entity';
import { BaseCreateUpdateColumnEntity } from './baseCreateUpdateColumn.entity';
import { UserGender } from 'src/types/common.type';

@Entity('t_teacher')
export class TeacherEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

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

  @Column({
    type: 'enum',
    name: 'gender',
    enum: UserGender,
    default: UserGender.MALE,
  })
  gender: UserGender;

  @Column({ type: 'varchar', name: 'phone_number', nullable: true })
  phone_number?: string;

  @Column({ type: 'mediumtext', name: 'description', nullable: true })
  description?: string;

  /**
   * relations
   */
  @OneToMany(() => CourseEntity, (course) => course.teacher)
  courses?: CourseEntity[];
}
