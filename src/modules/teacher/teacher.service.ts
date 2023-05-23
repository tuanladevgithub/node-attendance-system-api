import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import * as bcrypt from 'bcrypt';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { AttendanceSessionEntity } from 'src/db/entities/attendance-session.entity';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { compareAsc } from 'date-fns';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,

    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,

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

    const currentNewestTeacher = await this.teacherRepository.findOne({
      order: { teacher_code: 'DESC' },
    });

    const genPassword = createTeacherDto.password || this.genRandomPassword();
    const hashPassword = await bcrypt.hash(genPassword, 12);

    const newTeacher = await this.teacherRepository.save(
      this.teacherRepository.create({
        teacher_code: !currentNewestTeacher
          ? '20230001'
          : parseInt(currentNewestTeacher.teacher_code) + 1 + '',
        email: createTeacherDto.email,
        password: hashPassword,
        last_name: createTeacherDto.last_name,
        first_name: createTeacherDto.first_name,
        gender: createTeacherDto.gender,
        phone_number: createTeacherDto.phone_number,
        description: createTeacherDto.description,
      }),
    );

    // send mail:

    return newTeacher;
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
}
