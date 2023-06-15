import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, DataSource, Not, Repository } from 'typeorm';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import * as bcrypt from 'bcrypt';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { AttendanceSessionEntity } from 'src/db/entities/attendance-session.entity';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { compareAsc } from 'date-fns';
import { AttendanceResultEntity } from 'src/db/entities/attendance-result.entity';
import { StudentEntity } from 'src/db/entities/student.entity';
import { CourseParticipationEntity } from 'src/db/entities/course-participation.entity';
import { CourseScheduleEntity } from 'src/db/entities/course-schedule.entity';
import { DayOfWeek } from 'src/types/common.type';

@Injectable()
export class TeacherService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,

    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,

    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,

    @InjectRepository(CourseScheduleEntity)
    private readonly courseScheduleRepository: Repository<CourseScheduleEntity>,

    @InjectRepository(AttendanceSessionEntity)
    private readonly attendanceSessionRepository: Repository<AttendanceSessionEntity>,
  ) {}

  getOneById(id: number): Promise<TeacherEntity> {
    return this.teacherRepository.findOneOrFail({ where: { id } });
  }

  getOneByEmail(email: string): Promise<TeacherEntity | null> {
    return this.teacherRepository.findOne({ where: { email } });
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

  async createNewTeacher(createTeacherDto: CreateTeacherDto) {
    const existsAccount = await this.teacherRepository.findOne({
      where: { email: createTeacherDto.email },
    });
    if (existsAccount) throw new BadRequestException('Email already exists.');

    const currentNewestTeacher = await this.teacherRepository
      .createQueryBuilder('teacher')
      .select('MAX(teacher.teacher_code) as maxTeacherCode')
      .getRawOne();

    const genPassword = createTeacherDto.password || this.genRandomPassword();
    const hashPassword = await bcrypt.hash(genPassword, 12);

    const newTeacher = await this.teacherRepository.save(
      this.teacherRepository.create({
        m_department_id: createTeacherDto.m_department_id,
        teacher_code:
          !currentNewestTeacher || !currentNewestTeacher.maxTeacherCode
            ? '20230001'
            : parseInt(currentNewestTeacher.maxTeacherCode) + 1 + '',
        email: createTeacherDto.email,
        password: hashPassword,
        last_name: createTeacherDto.last_name,
        first_name: createTeacherDto.first_name,
        phone_number: createTeacherDto.phone_number,
        description: createTeacherDto.description,
      }),
    );

    // send mail:

    return newTeacher;
  }

  async getMonthSessions(teacherId: number, yearMonth: string) {
    const sessions = await this.attendanceSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndMapOne(
        'session.course',
        CourseEntity,
        'course',
        'course.id = session.t_course_id',
      )
      .leftJoinAndMapOne(
        'course.subject',
        SubjectEntity,
        'subject',
        'subject.id = course.m_subject_id',
      )
      .leftJoin(TeacherEntity, 'teacher', 'teacher.id = course.t_teacher_id')
      .where('teacher.id = :teacherId', { teacherId })
      .andWhere('session.session_date LIKE :sessionDate', {
        sessionDate: `${yearMonth}%`,
      })
      .orderBy('session.session_date', 'ASC')
      .addOrderBy('session.start_hour', 'ASC')
      .addOrderBy('session.start_min', 'ASC')
      .getMany();

    const result: { [sessionDateProp: string]: AttendanceSessionEntity[] } = {};

    if (sessions && sessions.length > 0)
      sessions.forEach((session) => {
        if (!result[`${session.session_date}`])
          result[`${session.session_date}`] = [session];
        else result[`${session.session_date}`].push(session);
      });

    return result;
  }

  getListCourse(teacherId: number, search?: string) {
    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndMapOne(
        'course.subject',
        SubjectEntity,
        'subject',
        'subject.id = course.m_subject_id',
      )
      .loadRelationCountAndMap(
        'course.countStudents',
        'course.courseParticipation',
      )
      .where('course.t_teacher_id = :teacherId', { teacherId });

    if (search)
      query.andWhere(
        new Brackets((qb) =>
          qb
            .where('subject.subject_name LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('subject.subject_code LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('course.course_code LIKE :search', {
              search: `%${search}%`,
            }),
        ),
      );

    return query.getMany();
  }

  getTodaySchedule(teacherId: number, today: string, dayOfWeek: DayOfWeek) {
    return this.courseScheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndMapOne(
        'schedule.course',
        CourseEntity,
        'course',
        'schedule.t_course_id = course.id',
      )
      .leftJoinAndMapOne(
        'course.subject',
        SubjectEntity,
        'subject',
        'subject.id = course.m_subject_id',
      )
      .loadRelationCountAndMap(
        'course.countStudents',
        'course.courseParticipation',
      )
      .where('course.t_teacher_id = :teacherId', { teacherId })
      .andWhere('course.start_date <= :startDate', { startDate: today })
      .andWhere('course.end_date >= :endDate', { endDate: today })
      .andWhere('schedule.day_of_week = :dayOfWeek', { dayOfWeek })
      .orderBy('schedule.start_hour', 'ASC')
      .addOrderBy('schedule.start_min', 'ASC')
      .getMany();
  }

  async getCourseData(teacherId: number, courseId: number) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, t_teacher_id: teacherId },
    });

    if (!course) throw new NotFoundException('Course does not exist.');

    const sessions = await this.attendanceSessionRepository.find({
      where: { t_course_id: course.id },
      order: { created_at: 'DESC' },
    });

    return { course, attendanceSessions: sessions };
  }

  async addAttendanceSession(
    teacherId: number,
    courseId: number,
    createAttendanceSessionDto: CreateAttendanceSessionDto,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, t_teacher_id: teacherId },
    });

    if (!course) throw new NotFoundException('Course does not exist.');

    const {
      session_date,
      start_hour,
      start_min,
      end_hour,
      end_min,
      description,
    } = createAttendanceSessionDto;

    const date = new Date(session_date);
    if (!(date instanceof Date && !isNaN(date.getTime())))
      throw new BadRequestException('Session date is incorrect.');

    if (compareAsc(new Date(session_date), new Date(course.start_date)) === -1)
      throw new BadRequestException(
        "Session date must be equal or after course's start date.",
      );

    if (
      course.end_date &&
      compareAsc(new Date(session_date), new Date(course.end_date)) === 1
    )
      throw new BadRequestException(
        "Session date must be equal or before course's end date.",
      );

    if (start_hour > end_hour)
      throw new BadRequestException('Start time must be less than end time.');

    if (start_hour === end_hour && start_min > end_min)
      throw new BadRequestException('Start time must be less than end time.');

    return await this.attendanceSessionRepository.save(
      this.attendanceSessionRepository.create({
        t_course_id: course.id,
        // password,
        session_date,
        start_hour,
        start_min,
        end_hour,
        end_min,
        description: description || 'Regular class session',
      }),
    );
  }

  async getAttendanceSessionData(
    teacherId: number,
    courseId: number,
    sessionId: number,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, t_teacher_id: teacherId },
    });

    if (!course) throw new NotFoundException('Course does not exist.');

    const session = await this.attendanceSessionRepository.findOne({
      where: { id: sessionId, t_course_id: course.id },
    });

    if (!session) throw new NotFoundException('Session does not exist.');

    return session;
  }

  async deleteAttendanceSession(
    teacherId: number,
    courseId: number,
    sessionId: number,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, t_teacher_id: teacherId },
    });

    if (!course) throw new NotFoundException('Course does not exist.');

    const session = await this.attendanceSessionRepository.findOne({
      where: { id: sessionId, t_course_id: course.id },
    });

    if (!session) throw new NotFoundException('Session does not exist.');

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(AttendanceResultEntity, {
        t_attendance_session_id: session.id,
      });

      await manager.delete(AttendanceSessionEntity, { id: session.id });
    });
  }

  async getAttendanceSessionResult(
    teacherId: number,
    courseId: number,
    sessionId: number,
  ) {
    const session = await this.getAttendanceSessionData(
      teacherId,
      courseId,
      sessionId,
    );

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoin(
        CourseParticipationEntity,
        'course_participation',
        'course_participation.t_student_id = student.id',
      )
      .leftJoinAndMapOne(
        'student.sessionResult',
        AttendanceResultEntity,
        'session_result',
        'session_result.t_student_id = student.id AND session_result.t_attendance_session_id = :sessionId',
        { sessionId: session.id },
      )
      .where('course_participation.t_course_id = :courseId', { courseId })
      .getMany();

    return {
      session,
      students,
    };
  }
}
