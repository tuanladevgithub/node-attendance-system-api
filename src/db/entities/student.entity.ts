import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourseParticipationEntity } from './course-participation.entity';
import { AttendanceResultEntity } from './attendance-result.entity';
import { BaseCreateUpdateColumnEntity } from './base-create-update-column.entity';
import { UserGender } from 'src/types/common.type';

@Entity('t_student')
export class StudentEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'varchar', name: 'student_code', unique: true })
  student_code: string;

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

  @Column({ type: 'int', name: 'age', nullable: true })
  age?: number;

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

  sessionResult?: AttendanceResultEntity;

  /**
   * relations
   */
  @OneToMany(
    () => CourseParticipationEntity,
    (participation) => participation.student,
  )
  courseParticipation?: CourseParticipationEntity[];

  @OneToMany(() => AttendanceResultEntity, (result) => result.attendanceSession)
  attendanceResults?: AttendanceResultEntity[];
}
