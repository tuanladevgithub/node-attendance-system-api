import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from 'src/db/entities/student.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dto/create-student.dto';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { CourseParticipationEntity } from 'src/db/entities/course-participation.entity';
import { CourseScheduleEntity } from 'src/db/entities/course-schedule.entity';

@Injectable()
export class StudentService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,

    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,

    @InjectRepository(CourseScheduleEntity)
    private readonly courseScheduleRepository: Repository<CourseScheduleEntity>,
  ) {}

  getOneById(id: number): Promise<StudentEntity> {
    return this.studentRepository.findOneOrFail({ where: { id } });
  }

  getOneByEmail(email: string): Promise<StudentEntity | null> {
    return this.studentRepository.findOne({ where: { email } });
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

    const genPassword = createStudentDto.password || this.genRandomPassword();
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
}
