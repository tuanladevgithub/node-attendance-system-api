import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AttendanceSessionEntity } from './attendance-session.entity';
import { StudentEntity } from './student.entity';
import { AttendanceStatusEntity } from './attendance-status.entity';

@Entity('t_attendance_result')
export class AttendanceResultEntity {
  @PrimaryColumn({ type: 'int', name: 't_attendance_session_id' })
  t_attendance_session_id: number;

  @PrimaryColumn({ type: 'int', name: 't_student_id' })
  t_student_id: number;

  @Column({ type: 'int', name: 'm_attendance_status_id', nullable: true })
  m_attendance_status_id?: number;

  @Column({ type: 'datetime', name: 'record_time' })
  record_time: Date;

  @Column({ type: 'varchar', name: 'ip_address' })
  ip_address: string;

  /**
   * relations
   */
  @ManyToOne(
    () => AttendanceSessionEntity,
    (session) => session.attendanceResults,
  )
  @JoinColumn({ name: 't_attendance_session_id' })
  attendanceSession?: AttendanceSessionEntity;

  @ManyToOne(() => StudentEntity, (student) => student.attendanceResults)
  @JoinColumn({ name: 't_student_id' })
  student?: StudentEntity;

  @ManyToOne(() => AttendanceStatusEntity, (status) => status.attendanceResults)
  @JoinColumn({ name: 'm_attendance_status_id' })
  attendanceStatus?: AttendanceStatusEntity;
}
