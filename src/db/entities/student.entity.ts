import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourseParticipationEntity } from './courseParticipation.entity';
import { AttendanceResultEntity } from './attendanceResult.entity';
import { BaseCreateUpdateColumnEntity } from './baseCreateUpdateColumn.entity';

@Entity('t_student')
export class StudentEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'varchar', name: 'teacher_code', unique: true })
  student_code: string;

  @Column({ type: 'varchar', name: 'email', unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password' })
  password: string;

  @Column({ type: 'varchar', name: 'name' })
  name: string;

  @Column({ type: 'varchar', name: 'gender' })
  gender: string;

  @Column({ type: 'mediumtext', name: 'description', nullable: true })
  age?: number;

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
