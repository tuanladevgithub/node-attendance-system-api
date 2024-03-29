import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from 'src/db/entities/student.entity';
import { DataSource, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dto/create-student.dto';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { CourseParticipationEntity } from 'src/db/entities/course-participation.entity';
import { CourseScheduleEntity } from 'src/db/entities/course-schedule.entity';
import { AttendanceSessionEntity } from 'src/db/entities/attendance-session.entity';
import { AttendanceResultEntity } from 'src/db/entities/attendance-result.entity';
import { AttendanceStatusEntity } from 'src/db/entities/attendance-status.entity';
import { JwtQrCodePayload } from 'src/types/qr-code.type';
import { JwtService } from '@nestjs/jwt';
import { add, isAfter, isBefore, parse } from 'date-fns';
import { UserGender } from 'src/types/common.type';

@Injectable()
export class StudentService {
  constructor(
    private dataSource: DataSource,

    private jwtService: JwtService,

    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,

    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,

    @InjectRepository(CourseScheduleEntity)
    private readonly courseScheduleRepository: Repository<CourseScheduleEntity>,

    @InjectRepository(CourseParticipationEntity)
    private readonly courseParticipationRepository: Repository<CourseParticipationEntity>,

    @InjectRepository(AttendanceSessionEntity)
    private readonly attendanceSessionRepository: Repository<AttendanceSessionEntity>,

    @InjectRepository(AttendanceResultEntity)
    private readonly attendanceResultRepository: Repository<AttendanceResultEntity>,

    @InjectRepository(AttendanceStatusEntity)
    private readonly attendanceStatusRepository: Repository<AttendanceStatusEntity>,
  ) {}

  getOneById(id: number): Promise<StudentEntity> {
    return this.studentRepository.findOneOrFail({ where: { id } });
  }

  updateStudentInfo(
    id: number,
    first_name?: string,
    last_name?: string,
    phone_number?: string,
    gender?: UserGender,
    age?: number,
  ) {
    return this.studentRepository
      .createQueryBuilder()
      .update()
      .set({
        first_name: first_name ?? (() => 'first_name'),
        last_name: last_name ?? (() => 'last_name'),
        phone_number,
        gender: gender ?? (() => 'gender'),
        age,
      })
      .where('id = :id', { id })
      .execute();
  }

  async changePassword(id: number, curPass: string, newPass: string) {
    const student = await this.studentRepository.findOneOrFail({
      where: { id },
    });

    if (!(await bcrypt.compare(curPass, student.password)))
      throw new BadRequestException('The current password is not valid');
    else
      await this.studentRepository.update(
        { id: student.id },
        { password: await bcrypt.hash(newPass, 12) },
      );
  }

  getOneByEmail(email: string): Promise<StudentEntity | null> {
    return this.studentRepository.findOne({ where: { email } });
  }

  updatePasswordResetCode(
    studentId: number,
    resetCode: string | null,
    resetCodeExpiredAt: Date | null,
  ) {
    return this.studentRepository
      .createQueryBuilder()
      .update()
      .set({
        password_reset_code: resetCode,
        password_reset_expired_at: resetCodeExpiredAt,
      })
      .where('id = :studentId', { studentId })
      .execute();
  }

  async resetPassword(resetCode: string, newPassword: string) {
    const student = await this.studentRepository.findOne({
      where: {
        password_reset_code: resetCode,
        password_reset_expired_at: MoreThan(new Date()),
      },
    });

    if (!student)
      throw new BadRequestException('Invalid token or token has expired.');

    const hashPassword = await bcrypt.hash(newPassword, 12);

    student.password = hashPassword;
    student.password_reset_code = null;
    student.password_reset_expired_at = null;
    await this.studentRepository.save(student);
  }

  genRandomPassword() {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let counter = 0;
    while (counter < 10) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
      counter += 1;
    }
    return result;
  }

  async createNewStudent(createStudentDto: CreateStudentDto) {
    const existsAccount = await this.studentRepository.findOne({
      where: { email: createStudentDto.email },
    });
    if (existsAccount) throw new BadRequestException('Email already exists.');

    const currentNewestStudent = await this.studentRepository
      .createQueryBuilder('student')
      .select('MAX(student.student_code) as maxStudentCode')
      .getRawOne();

    const genPassword = createStudentDto.password ?? this.genRandomPassword();
    const hashPassword = await bcrypt.hash(genPassword, 12);

    const newStudent = await this.studentRepository.save(
      this.studentRepository.create({
        student_code: !currentNewestStudent?.maxStudentCode
          ? '20230001'
          : parseInt(currentNewestStudent.maxStudentCode) + 1 + '',
        email: createStudentDto.email,
        password: hashPassword,
        last_name: createStudentDto.last_name,
        first_name: createStudentDto.first_name,
        gender: createStudentDto.gender,
        phone_number: createStudentDto.phone_number,
        age: createStudentDto.age,
      }),
    );

    // send mail:

    return newStudent;
  }

  getRecentHistory(studentId: number) {
    return this.attendanceResultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect(
        'result.attendanceStatus',
        'status',
        'status.id = result.m_attendance_status_id',
      )
      .leftJoinAndSelect(
        'result.attendanceSession',
        'session',
        'session.id = result.t_attendance_session_id',
      )
      .leftJoinAndSelect(
        'session.course',
        'course',
        'course.id = session.t_course_id',
      )
      .leftJoinAndSelect(
        'course.subject',
        'subject',
        'subject.id = course.m_subject_id',
      )
      .where('result.t_student_id = :studentId', { studentId })
      .andWhere('result.m_attendance_status_id IN (:...statusIds)', {
        statusIds: [1, 2, 3],
      })
      .orderBy('result.record_time', 'DESC')
      .limit(5)
      .getMany();
  }

  getRecentAbsences(studentId: number) {
    return this.attendanceSessionRepository
      .createQueryBuilder('session')
      .innerJoinAndSelect(
        'session.course',
        'course',
        'course.id = session.t_course_id',
      )
      .innerJoinAndSelect(
        'course.subject',
        'subject',
        'subject.id = course.m_subject_id',
      )
      .innerJoin(
        CourseParticipationEntity,
        'class',
        'class.t_course_id = course.id AND class.t_student_id = :studentId',
        { studentId },
      )
      .leftJoin(
        AttendanceResultEntity,
        'result',
        'result.t_attendance_session_id = session.id AND result.t_student_id = :studentId',
        { studentId },
      )
      .where(
        `
      (
        session.session_date < DATE(NOW())
            OR 
            (
          session.session_date = DATE(NOW()) 
                AND 
                (session.end_hour * 60 + session.end_min + IF(session.overtime_minutes_for_late IS NULL, 0, session.overtime_minutes_for_late)) <= (HOUR(NOW()) * 60 + MINUTE(NOW()))
        )
      )
      AND 
        (result.m_attendance_status_id IS NULL OR result.m_attendance_status_id = 4)
      `,
      )
      .orderBy('session.session_date', 'DESC')
      .addOrderBy('session.start_hour', 'DESC')
      .addOrderBy('session.start_min', 'DESC')
      .limit(5)
      .getMany();
  }

  getListCourse(studentId: number) {
    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoin(
        CourseParticipationEntity,
        'participation',
        'participation.t_course_id = course.id',
      )
      .leftJoinAndMapOne(
        'course.subject',
        SubjectEntity,
        'subject',
        'subject.id = course.m_subject_id',
      )
      .leftJoinAndMapOne(
        'course.teacher',
        TeacherEntity,
        'teacher',
        'teacher.id = course.t_teacher_id',
      )
      .where('participation.t_student_id = :studentId', { studentId });

    return query.getMany();
  }

  async getCourseData(studentId: number, courseId: number) {
    const courseParticipation =
      await this.courseParticipationRepository.findOne({
        where: { t_student_id: studentId, t_course_id: courseId },
      });
    if (!courseParticipation)
      throw new ForbiddenException('Student cannot access this course.');

    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndMapOne(
        'course.subject',
        SubjectEntity,
        'subject',
        'subject.id = course.m_subject_id',
      )
      .leftJoinAndMapOne(
        'course.teacher',
        TeacherEntity,
        'teacher',
        'teacher.id = course.t_teacher_id',
      )
      .leftJoinAndMapMany(
        'course.courseSchedules',
        CourseScheduleEntity,
        'schedule',
        'schedule.t_course_id = course.id',
      )
      .loadRelationCountAndMap(
        'course.countStudents',
        'course.courseParticipation',
      )
      .where('course.id = :courseId', { courseId })
      .orderBy('schedule.start_hour', 'ASC')
      .addOrderBy('schedule.start_min', 'ASC')
      .getOneOrFail();

    return course;
  }

  getListSchedule(studentId: number) {
    return this.courseScheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndMapOne(
        'schedule.course',
        CourseEntity,
        'course',
        'course.id = schedule.t_course_id',
      )
      .leftJoinAndMapOne(
        'course.subject',
        SubjectEntity,
        'subject',
        'subject.id = course.m_subject_id',
      )
      .innerJoin(
        CourseParticipationEntity,
        'participation',
        'participation.t_course_id = course.id',
      )
      .where('participation.t_student_id = :studentId', { studentId })
      .groupBy('schedule.id')
      .getMany();
  }

  async getListOfCourseAttendanceSession(studentId: number, courseId: number) {
    const courseParticipation =
      await this.courseParticipationRepository.findOne({
        where: { t_student_id: studentId, t_course_id: courseId },
      });
    if (!courseParticipation)
      throw new ForbiddenException('Student cannot access this course.');

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) throw new BadRequestException('Course does not exist.');

    return await this.attendanceSessionRepository.find({
      where: { t_course_id: course.id },
      order: { created_at: 'DESC' },
    });
  }

  async getAttendanceSessionData(
    studentId: number,
    courseId: number,
    sessionId: number,
  ) {
    const courseParticipation =
      await this.courseParticipationRepository.findOne({
        where: { t_student_id: studentId, t_course_id: courseId },
      });
    if (!courseParticipation)
      throw new ForbiddenException('Student cannot access this course.');

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) throw new BadRequestException('Course does not exist.');

    const attendanceSession =
      await this.attendanceSessionRepository.findOneOrFail({
        where: { t_course_id: course.id, id: sessionId },
      });

    return attendanceSession;
  }

  async getSessionResultForStudent(
    studentId: number,
    courseId: number,
    sessionId: number,
  ) {
    const courseParticipation =
      await this.courseParticipationRepository.findOne({
        where: { t_student_id: studentId, t_course_id: courseId },
      });
    if (!courseParticipation)
      throw new ForbiddenException('Student cannot access this course.');

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) throw new BadRequestException('Course does not exist.');

    const attendanceSession =
      await this.attendanceSessionRepository.findOneOrFail({
        where: { t_course_id: course.id, id: sessionId },
      });

    return await this.attendanceResultRepository
      .createQueryBuilder('session_result')
      .leftJoinAndMapOne(
        'session_result.attendanceStatus',
        AttendanceStatusEntity,
        'status',
        'status.id = session_result.m_attendance_status_id',
      )
      .where('session_result.t_attendance_session_id = :sessionId', {
        sessionId: attendanceSession.id,
      })
      .andWhere('session_result.t_student_id = :studentId', { studentId })
      .getOne();
  }

  async recordAttendanceSession(
    studentId: number,
    qrToken: string,
    ipAddr?: string,
  ) {
    let courseId: number, sessionId: number;
    try {
      const payload = await this.jwtService.verifyAsync<JwtQrCodePayload>(
        qrToken,
        {
          secret: 'QR_SECRET_KEY',
        },
      );
      courseId = payload.courseId;
      sessionId = payload.sessionId;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('QR-code invalid or expired.');
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) throw new BadRequestException('Course not found.');

    const participation = await this.courseParticipationRepository.findOne({
      where: { t_course_id: courseId, t_student_id: studentId },
    });
    if (!participation)
      throw new ForbiddenException('You cannot access this course.');

    const session = await this.attendanceSessionRepository.findOne({
      where: { t_course_id: course.id, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found.');

    const attendanceResult = await this.attendanceResultRepository.findOne({
      where: { t_attendance_session_id: session.id, t_student_id: studentId },
    });
    if (attendanceResult) return attendanceResult;

    if (course.prevent_student_use_same_address)
      if (ipAddr) {
        const attendanceResultSameIpAddr =
          await this.attendanceResultRepository.findOne({
            where: {
              t_attendance_session_id: session.id,
              record_by_teacher: 0,
              ip_address: ipAddr,
            },
          });
        if (attendanceResultSameIpAddr)
          throw new BadRequestException('Your IP address is duplicated.');
      }

    const recordDatetime = new Date();

    const sessionDatetimeStart = new Date(session.session_date);
    sessionDatetimeStart.setHours(session.start_hour, session.start_min);

    const sessionDatetimeEnd = new Date(session.session_date);
    sessionDatetimeEnd.setHours(session.end_hour, session.end_min);

    const sessionDatetimeOvertime = add(sessionDatetimeEnd, {
      minutes: session.overtime_minutes_for_late,
    });

    if (isBefore(recordDatetime, sessionDatetimeStart))
      throw new BadRequestException('Session has not started.');

    if (isAfter(recordDatetime, sessionDatetimeOvertime))
      throw new BadRequestException('Session has finished.');

    if (
      recordDatetime.getTime() >= sessionDatetimeStart.getTime() &&
      recordDatetime.getTime() <= sessionDatetimeEnd.getTime()
    ) {
      const presentStatus = await this.attendanceStatusRepository.findOneOrFail(
        {
          where: { acronym: 'P' },
        },
      );
      await this.attendanceResultRepository
        .createQueryBuilder()
        .insert()
        .into(AttendanceResultEntity)
        .values({
          t_attendance_session_id: session.id,
          t_student_id: studentId,
          m_attendance_status_id: presentStatus.id,
          record_time: () => 'NOW()',
          ip_address: ipAddr,
        })
        .execute();
    }

    if (
      recordDatetime.getTime() > sessionDatetimeEnd.getTime() &&
      recordDatetime.getTime() <= sessionDatetimeOvertime.getTime()
    ) {
      const lateStatus = await this.attendanceStatusRepository.findOneOrFail({
        where: { acronym: 'L' },
      });
      await this.attendanceResultRepository
        .createQueryBuilder()
        .insert()
        .into(AttendanceResultEntity)
        .values({
          t_attendance_session_id: session.id,
          t_student_id: studentId,
          m_attendance_status_id: lateStatus.id,
          record_time: () => 'NOW()',
          ip_address: ipAddr,
        })
        .execute();
    }

    return await this.attendanceResultRepository.findOne({
      where: { t_attendance_session_id: session.id, t_student_id: studentId },
    });
  }
}
