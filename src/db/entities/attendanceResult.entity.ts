import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { AttendanceSessionEntity } from './attendanceSession.entity';
import { StudentEntity } from './student.entity';
import { AttendanceStatusEntity } from './attendanceStatus.entity';

@Entity('t_attendance_result')
export class AttendanceResultEntity {
  @PrimaryColumn({ type: 'int', name: 't_attendance_session_id' })
  t_attendance_session_id: number;

  @PrimaryColumn({ type: 'int', name: 't_student_id' })
  t_student_id: number;

  @Column({ type: 'int', name: 't_attendance_status_id', nullable: true })
  t_attendance_status_id?: number;

  @Column({ type: 'datetime', name: 'record_time', nullable: true })
  record_time?: string;

  @Column({ type: 'varchar', name: 'ip_address' })
  ip_address: string;

  /**
   * relations
   */
  @ManyToOne(
    () => AttendanceSessionEntity,
    (session) => session.attendanceResults,
  )
  attendanceSession?: AttendanceSessionEntity;

  @ManyToOne(() => StudentEntity, (student) => student.attendanceResults)
  student?: StudentEntity;

  @ManyToOne(() => AttendanceStatusEntity, (status) => status.attendanceResults)
  attendanceStatus?: AttendanceStatusEntity;
}
