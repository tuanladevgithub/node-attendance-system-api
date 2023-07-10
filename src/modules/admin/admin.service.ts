import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/db/entities/admin.entity';
import { DepartmentEntity } from 'src/db/entities/department.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { Brackets, Repository } from 'typeorm';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import * as bcrypt from 'bcrypt';
import { isEmail, isPhoneNumber } from 'class-validator';
import { StudentEntity } from 'src/db/entities/student.entity';
import { DayOfWeek, UserGender } from 'src/types/common.type';
import { UpdateTeacherInfoDto } from './dto/update-teacher-info.dto';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { CreateTeacherDto } from '../teacher/dto/create-teacher.dto';
import { TeacherService } from '../teacher/teacher.service';
import { CreateStudentDto } from '../student/dto/create-student.dto';
import { StudentService } from '../student/student.service';
import { CreateCourseDto } from '../course/dto/create-course.dto';
import { CourseService } from '../course/course.service';
import { CourseScheduleEntity } from 'src/db/entities/course-schedule.entity';
import { CourseParticipationEntity } from 'src/db/entities/course-participation.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly teacherService: TeacherService,

    private readonly studentService: StudentService,

    private readonly courseService: CourseService,

    @InjectRepository(AdminEntity)
    private readonly adminRepository: Repository<AdminEntity>,

    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,

    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,

    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,

    @InjectRepository(SubjectEntity)
    private readonly subjectRepository: Repository<SubjectEntity>,

    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,

    @InjectRepository(CourseScheduleEntity)
    private readonly courseScheduleRepository: Repository<CourseScheduleEntity>,

    @InjectRepository(CourseParticipationEntity)
    private readonly courseParticipationRepository: Repository<CourseParticipationEntity>,
  ) {}

  getOneById(id: number): Promise<AdminEntity> {
    return this.adminRepository.findOneOrFail({ where: { id } });
  }

  getOneByUsername(username: string): Promise<AdminEntity | null> {
    return this.adminRepository.findOne({ where: { username } });
  }

  getListOfTeachers(departmentId?: number, searchText?: string) {
    const query = this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndMapOne(
        'teacher.department',
        DepartmentEntity,
        'department',
        'department.id = teacher.m_department_id',
      );
    if (departmentId)
      query.andWhere('teacher.m_department_id = :departmentId', {
        departmentId,
      });
    if (searchText) {
      searchText = searchText.trim();
      query.andWhere(
        new Brackets((qb) =>
          qb
            .where('teacher.teacher_code LIKE :teacherCode', {
              teacherCode: `%${searchText}%`,
            })
            .orWhere('teacher.email LIKE :email', {
              email: `%${searchText}%`,
            })
            .orWhere('teacher.first_name LIKE :firstName', {
              firstName: `%${searchText}%`,
            })
            .orWhere('teacher.last_name LIKE :lastName', {
              lastName: `%${searchText}%`,
            })
            .orWhere('teacher.phone_number LIKE :phoneNumber', {
              phoneNumber: `%${searchText}%`,
            }),
        ),
      );
    }

    return query.getMany();
  }

  async importTeachersFromCsv(file: Express.Multer.File) {
    console.log(file);
    const departmentIds = (
      await this.departmentRepository.find({
        select: ['id'],
      })
    ).map((department) => department.id);
    const teachers = await this.teacherRepository.find({
      select: ['teacher_code', 'email'],
    });
    if (!file) throw new BadRequestException('File is required.');
    const { buffer } = file;
    const fileStream = Readable.from(buffer);
    const parseCsv = fileStream.pipe(
      parse({
        bom: true,
        columns: true,
        trim: true,
        quote: '"',
        skip_empty_lines: true,
      }),
    );
    const records: TeacherEntity[] = [];
    const errors: string[] = [];

    let lineNumber = 2;
    for await (const _record of parseCsv) {
      const recordErrors: string[] = [];

      // check m_department_id:
      const m_department_id = _record['m_department_id'];
      if (!m_department_id) recordErrors.push('m_department_id is missing');
      if (
        m_department_id &&
        (isNaN(parseInt(m_department_id)) ||
          !departmentIds.includes(parseInt(m_department_id)))
      )
        recordErrors.push(
          `m_department_id must be a number and belong to [${departmentIds.join(
            ', ',
          )}]`,
        );

      // check teacher_code:
      const teacher_code = _record['teacher_code'];
      if (!teacher_code) recordErrors.push('teacher_code is missing');
      if (
        teacher_code &&
        records.findIndex((record) => record.teacher_code === teacher_code) !==
          -1
      )
        recordErrors.push(`duplicate teacher_code in file`);
      if (
        teacher_code &&
        teachers.findIndex(
          (teacher) => teacher.teacher_code === teacher_code,
        ) !== -1
      )
        recordErrors.push(`teacher_code "${teacher_code}" is exist`);

      // check email:
      const email = _record['email'];
      if (!email) recordErrors.push('email is missing');
      if (email && records.findIndex((record) => record.email === email) !== -1)
        recordErrors.push(`duplicate email in file`);
      if (email && !isEmail(email)) recordErrors.push(`invalid email`);
      if (
        email &&
        teachers.findIndex((teacher) => teacher.email === email) !== -1
      )
        recordErrors.push(`email "${email}" is exist`);

      // check last_name:
      const last_name = _record['last_name'];
      if (!last_name) recordErrors.push('last_name is missing');

      // check first_name:
      const first_name = _record['first_name'];
      if (!first_name) recordErrors.push('first_name is missing');

      // check phone_number:
      const phone_number = _record['phone_number'];
      if (phone_number && !isPhoneNumber(phone_number, 'VN'))
        recordErrors.push(`invalid phone_number`);

      // check description:
      const description = _record['description'];

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0)
        records.push(
          this.teacherRepository.create({
            m_department_id: parseInt(m_department_id),
            teacher_code,
            email,
            password: await bcrypt.hash(teacher_code, 12),
            last_name,
            first_name,
            phone_number: !phone_number ? undefined : phone_number,
            description,
          }),
        );

      lineNumber++;
    }

    if (errors.length > 0) {
      return { isSuccess: false, errors };
    } else {
      await this.teacherRepository.insert(records);
      return { isSuccess: true, errors: [] };
    }
  }

  createNewTeacher(createTeacherDto: CreateTeacherDto) {
    return this.teacherService.createNewTeacher(createTeacherDto);
  }

  getTeacherInfo(teacherId: number) {
    return this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndMapOne(
        'teacher.department',
        DepartmentEntity,
        'department',
        'department.id = teacher.m_department_id',
      )
      .where('teacher.id = :teacherId', { teacherId })
      .getOneOrFail();
  }

  async updateTeacherInfo(
    teacherId: number,
    updateTeacherInfoDto: UpdateTeacherInfoDto,
  ) {
    const teacher = await this.teacherRepository.findOneOrFail({
      where: { id: teacherId },
    });

    if (updateTeacherInfoDto.m_department_id)
      await this.departmentRepository.findOneOrFail({
        where: { id: updateTeacherInfoDto.m_department_id },
      });

    await this.teacherRepository.update(
      { id: teacher.id },
      updateTeacherInfoDto,
    );
  }

  getTeacherCourse(teacherId: number) {
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

    return query.getMany();
  }

  getListOfStudents(gender?: UserGender, searchText?: string) {
    const query = this.studentRepository.createQueryBuilder('student');

    if (gender) query.andWhere('student.gender = :gender', { gender });

    if (searchText) {
      searchText = searchText.trim();
      query.andWhere(
        new Brackets((qb) =>
          qb
            .where('student.student_code LIKE :studentCode', {
              studentCode: `%${searchText}%`,
            })
            .orWhere('student.email LIKE :email', {
              email: `%${searchText}%`,
            })
            .orWhere('student.first_name LIKE :firstName', {
              firstName: `%${searchText}%`,
            })
            .orWhere('student.last_name LIKE :lastName', {
              lastName: `%${searchText}%`,
            })
            .orWhere('student.phone_number LIKE :phoneNumber', {
              phoneNumber: `%${searchText}%`,
            }),
        ),
      );
    }

    return query.getMany();
  }

  async importStudentsFromCsv(file: Express.Multer.File) {
    console.log(file);

    const students = await this.studentRepository.find({
      select: ['student_code', 'email'],
    });
    if (!file) throw new BadRequestException('File is required.');
    const { buffer } = file;
    const fileStream = Readable.from(buffer);
    const parseCsv = fileStream.pipe(
      parse({
        bom: true,
        columns: true,
        trim: true,
        quote: '"',
        skip_empty_lines: true,
      }),
    );
    const records: StudentEntity[] = [];
    const errors: string[] = [];

    let lineNumber = 2;
    for await (const _record of parseCsv) {
      const recordErrors: string[] = [];

      // check student_code:
      const student_code = _record['student_code'];
      if (!student_code) recordErrors.push('student_code is missing');
      if (
        student_code &&
        records.findIndex((record) => record.student_code === student_code) !==
          -1
      )
        recordErrors.push(`duplicate student_code in file`);
      if (
        student_code &&
        students.findIndex(
          (student) => student.student_code === student_code,
        ) !== -1
      )
        recordErrors.push(`student_code "${student_code}" is exist`);

      // check email:
      const email = _record['email'];
      if (!email) recordErrors.push('email is missing');
      if (email && records.findIndex((record) => record.email === email) !== -1)
        recordErrors.push(`duplicate email in file`);
      if (email && !isEmail(email)) recordErrors.push(`invalid email`);
      if (
        email &&
        students.findIndex((student) => student.email === email) !== -1
      )
        recordErrors.push(`email "${email}" is exist`);

      // check last_name:
      const last_name = _record['last_name'];
      if (!last_name) recordErrors.push('last_name is missing');

      // check first_name:
      const first_name = _record['first_name'];
      if (!first_name) recordErrors.push('first_name is missing');

      // check gender:
      const gender = _record['gender'];
      if (!gender) recordErrors.push('gender is missing');
      if (
        gender &&
        !['MALE', 'FEMALE'].includes((gender as string).toUpperCase())
      )
        recordErrors.push('gender must belong to [male, female]');

      // check phone_number:
      const phone_number = _record['phone_number'];
      if (phone_number && !isPhoneNumber(phone_number, 'VN'))
        recordErrors.push(`invalid phone_number`);

      // check AGE:
      const age = _record['age'];
      if (age && isNaN(parseInt(age)) && parseInt(age) < 1)
        recordErrors.push(`age must be a positive integer`);

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0)
        records.push(
          this.studentRepository.create({
            student_code,
            email,
            password: await bcrypt.hash(student_code, 12),
            last_name,
            first_name,
            gender:
              (gender as string).toUpperCase() === 'MALE'
                ? UserGender.MALE
                : UserGender.FEMALE,
            phone_number: !phone_number ? undefined : phone_number,
            age: !age ? undefined : parseInt(age),
          }),
        );

      lineNumber++;
    }

    if (errors.length > 0) {
      return { isSuccess: false, errors };
    } else {
      await this.studentRepository.insert(records);
      return { isSuccess: true, errors: [] };
    }
  }

  createNewStudent(createStudentDto: CreateStudentDto) {
    return this.studentService.createNewStudent(createStudentDto);
  }

  getListOfCourses(subjectId?: number, searchText?: string) {
    const query = this.courseRepository
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
      .loadRelationCountAndMap(
        'course.countStudents',
        'course.courseParticipation',
      );

    if (subjectId)
      query.andWhere('course.m_subject_id = :subjectId', { subjectId });

    if (searchText)
      query.andWhere(
        new Brackets((qb) =>
          qb
            .where('subject.subject_name LIKE :subjectName', {
              subjectName: `%${searchText}%`,
            })
            .orWhere('subject.subject_code LIKE :subjectCode', {
              subjectCode: `%${searchText}%`,
            })
            .orWhere('course.course_code LIKE :courseCode', {
              courseCode: `%${searchText}%`,
            }),
        ),
      );

    return query.getMany();
  }

  async importSubjectsFromCsv(file: Express.Multer.File) {
    const subjectCodes = (
      await this.subjectRepository.find({
        select: ['subject_code'],
      })
    ).map((subject) => subject.subject_code);
    if (!file) throw new BadRequestException('File is required.');
    const { buffer } = file;
    const fileStream = Readable.from(buffer);
    const parseCsv = fileStream.pipe(
      parse({
        bom: true,
        columns: true,
        trim: true,
        quote: '"',
        skip_empty_lines: true,
      }),
    );
    const records: SubjectEntity[] = [];
    const errors: string[] = [];

    let lineNumber = 2;
    for await (const _record of parseCsv) {
      const recordErrors: string[] = [];

      // check subject_code:
      const subject_code = _record['subject_code'];
      if (!subject_code) recordErrors.push('subject_code is missing');
      if (
        subject_code &&
        records.findIndex((record) => record.subject_code === subject_code) !==
          -1
      )
        recordErrors.push(`duplicate subject_code in file`);
      if (
        subject_code &&
        subjectCodes.findIndex(
          (subjectCode) => subjectCode === subject_code,
        ) !== -1
      )
        recordErrors.push(`subject_code "${subject_code}" is exist`);

      // check subject_name:
      const subject_name = _record['subject_name'];

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0)
        records.push(
          this.subjectRepository.create({
            subject_code,
            subject_name,
          }),
        );

      lineNumber++;
    }

    if (errors.length > 0) {
      return { isSuccess: false, errors };
    } else {
      await this.subjectRepository.insert(records);
      return { isSuccess: true, errors: [] };
    }
  }

  async importCoursesFromCsv(file: Express.Multer.File) {
    const subjectIds = (
      await this.subjectRepository.find({ select: ['id'] })
    ).map((subject) => subject.id);
    const teacherIds = (
      await this.teacherRepository.find({ select: ['id'] })
    ).map((teacher) => teacher.id);
    const courseCodes = (
      await this.courseRepository.find({
        select: ['course_code'],
      })
    ).map((course) => course.course_code);
    if (!file) throw new BadRequestException('File is required.');
    const { buffer } = file;
    const fileStream = Readable.from(buffer);
    const parseCsv = fileStream.pipe(
      parse({
        bom: true,
        columns: true,
        trim: true,
        quote: '"',
        skip_empty_lines: true,
      }),
    );
    const records: CourseEntity[] = [];
    const errors: string[] = [];

    let lineNumber = 2;
    for await (const _record of parseCsv) {
      const recordErrors: string[] = [];

      // check m_subject_id:
      const m_subject_id = _record['m_subject_id'];
      if (!m_subject_id) recordErrors.push('m_subject_id is missing');
      if (m_subject_id && isNaN(parseInt(m_subject_id)))
        recordErrors.push(`m_subject_id must be a positive integer`);
      if (m_subject_id && !subjectIds.includes(parseInt(m_subject_id)))
        recordErrors.push(`m_subject_id is not exist`);

      // check t_teacher_id:
      const t_teacher_id = _record['t_teacher_id'];
      if (!t_teacher_id) recordErrors.push('t_teacher_id is missing');
      if (t_teacher_id && isNaN(parseInt(t_teacher_id)))
        recordErrors.push(`t_teacher_id must be a positive integer`);
      if (t_teacher_id && !teacherIds.includes(parseInt(t_teacher_id)))
        recordErrors.push(`t_teacher_id is not exist`);

      // check course_code:
      const course_code = _record['course_code'];
      if (!course_code) recordErrors.push('course_code is missing');
      if (
        course_code &&
        records.findIndex((record) => record.course_code === course_code) !== -1
      )
        recordErrors.push(`duplicate course_code in file`);
      if (
        course_code &&
        courseCodes.findIndex((courseCode) => courseCode === course_code) !== -1
      )
        recordErrors.push(`course_code "${course_code}" is exist`);

      // check description:
      const description = _record['description'];

      // check start_date:
      const start_date = _record['start_date'];
      if (!start_date) recordErrors.push('start_date is missing');

      // check end_date:
      const end_date = _record['end_date'];
      if (!end_date) recordErrors.push('end_date is missing');

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0)
        records.push(
          this.courseRepository.create({
            m_subject_id: parseInt(m_subject_id),
            t_teacher_id: parseInt(t_teacher_id),
            course_code,
            description,
            start_date,
            end_date,
          }),
        );

      lineNumber++;
    }

    if (errors.length > 0) {
      return { isSuccess: false, errors };
    } else {
      await this.courseRepository.insert(records);
      return { isSuccess: true, errors: [] };
    }
  }

  async importCourseSchedulesFromCsv(file: Express.Multer.File) {
    const courses = await this.courseRepository.find({
      select: ['id', 'teacher'],
      relations: { teacher: true },
    });
    const schedules = await this.courseScheduleRepository.find();
    if (!file) throw new BadRequestException('File is required.');
    const { buffer } = file;
    const fileStream = Readable.from(buffer);
    const parseCsv = fileStream.pipe(
      parse({
        bom: true,
        columns: true,
        trim: true,
        quote: '"',
        skip_empty_lines: true,
      }),
    );
    const records: { line: number; schedule: CourseScheduleEntity }[] = [];
    const errors: string[] = [];

    let lineNumber = 2;
    for await (const _record of parseCsv) {
      const recordErrors: string[] = [];

      // check t_course_id:
      const t_course_id = _record['t_course_id'];
      if (!t_course_id) recordErrors.push('t_course_id is missing');
      else {
        if (isNaN(parseInt(t_course_id)))
          recordErrors.push(`t_course_id must be a positive integer`);
        else if (!courses.find((course) => course.id === parseInt(t_course_id)))
          recordErrors.push(`t_course_id is not exist`);
      }

      // check day_of_week:
      const day_of_week = _record['day_of_week'];
      if (!day_of_week) recordErrors.push('day_of_week is missing');
      else {
        if (!Object.values(DayOfWeek).includes(parseInt(day_of_week)))
          recordErrors.push(
            `day_of_week must be of 0, 1, 2, 3, 4, 5 or 6 (0 corresponds to Sunday, 6 corresponds to Saturday)`,
          );
      }

      // check start_hour:
      let isValidStartTime = true;
      const start_hour = _record['start_hour'];
      if (!start_hour) {
        recordErrors.push('start_hour is missing');
        isValidStartTime = false;
      } else {
        if (
          isNaN(parseInt(start_hour)) ||
          parseInt(start_hour) < 0 ||
          parseInt(start_hour) > 23
        ) {
          recordErrors.push(`start_hour must be an integer between 0 and 23`);
          isValidStartTime = false;
        }
      }

      // check start_min:
      const start_min = _record['start_min'];
      if (!start_min) {
        recordErrors.push('start_min is missing');
        isValidStartTime = false;
      } else {
        if (
          isNaN(parseInt(start_min)) ||
          parseInt(start_min) < 0 ||
          parseInt(start_min) > 59
        ) {
          recordErrors.push(`start_min must be an integer between 0 and 59`);
          isValidStartTime = false;
        }
      }

      // check end_hour:
      let isValidEndTime = true;
      const end_hour = _record['end_hour'];
      if (!end_hour) {
        recordErrors.push('end_hour is missing');
        isValidEndTime = false;
      } else {
        if (
          isNaN(parseInt(end_hour)) ||
          parseInt(end_hour) < 0 ||
          parseInt(end_hour) > 23
        ) {
          recordErrors.push(`end_hour must be an integer between 0 and 23`);
          isValidEndTime = false;
        }
      }

      // check end_min:
      const end_min = _record['end_min'];
      if (!end_min) {
        recordErrors.push('end_min is missing');
        isValidEndTime = false;
      } else {
        if (
          isNaN(parseInt(end_min)) ||
          parseInt(end_min) < 0 ||
          parseInt(end_min) > 59
        ) {
          recordErrors.push(`end_min must be an integer between 0 and 59`);
          isValidEndTime = false;
        }
      }

      // check conflict time:
      if (isValidStartTime && isValidEndTime) {
        if (
          parseInt(start_hour) * 60 + parseInt(start_min) >=
          parseInt(end_hour) * 60 + parseInt(end_min)
        )
          recordErrors.push(`the start time must be earlier than the end time`);
        else {
          const tmpStart = parseInt(start_hour) * 60 + parseInt(start_min);
          const tmpEnd = parseInt(end_hour) * 60 + parseInt(end_min);
          const tmp = records.find((record) => {
            if (
              record.schedule.t_course_id === parseInt(t_course_id) &&
              record.schedule.day_of_week === parseInt(day_of_week)
            ) {
              const recordStart =
                record.schedule.start_hour * 60 + record.schedule.start_min;
              const recordEnd =
                record.schedule.end_hour * 60 + record.schedule.end_min;
              if (
                (recordStart <= tmpStart && recordEnd > tmpStart) ||
                (recordStart < tmpEnd && recordEnd >= tmpEnd)
              )
                return true;
              else return false;
            } else return false;
          });

          if (tmp)
            recordErrors.push(`conflict time with line number ${tmp.line}`);
          else {
            const existSchedule = schedules.find((schedule) => {
              if (
                schedule.t_course_id === parseInt(t_course_id) &&
                schedule.day_of_week === parseInt(day_of_week)
              ) {
                const scheduleStart =
                  schedule.start_hour * 60 + schedule.start_min;
                const scheduleEnd = schedule.end_hour * 60 + schedule.end_min;
                if (
                  (scheduleStart <= tmpStart && scheduleEnd > tmpStart) ||
                  (scheduleStart < tmpEnd && scheduleEnd >= tmpEnd)
                )
                  return true;
                else return false;
              } else return false;
            });

            if (existSchedule)
              recordErrors.push(
                `conflict time with exist schedule id ${existSchedule.id}`,
              );
          }
        }
      }

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0)
        records.push({
          line: lineNumber,
          schedule: this.courseScheduleRepository.create({
            t_course_id: parseInt(t_course_id),
            day_of_week: parseInt(day_of_week),
            start_hour: parseInt(start_hour),
            start_min: parseInt(start_min),
            end_hour: parseInt(end_hour),
            end_min: parseInt(end_min),
          }),
        });

      lineNumber++;
    }

    if (errors.length > 0) {
      return { isSuccess: false, errors };
    } else {
      await this.courseScheduleRepository.insert(
        records.map((record) => record.schedule),
      );
      return { isSuccess: true, errors: [] };
    }
  }

  async importCourseParticipationFromCsv(file: Express.Multer.File) {
    const courseIds = (
      await this.courseRepository.find({ select: ['id'] })
    ).map((course) => course.id);
    const studentIds = (
      await this.studentRepository.find({ select: ['id'] })
    ).map((student) => student.id);

    if (!file) throw new BadRequestException('File is required.');
    const { buffer } = file;
    const fileStream = Readable.from(buffer);
    const parseCsv = fileStream.pipe(
      parse({
        bom: true,
        columns: true,
        trim: true,
        quote: '"',
        skip_empty_lines: true,
      }),
    );
    const records: CourseParticipationEntity[] = [];
    const errors: string[] = [];

    let lineNumber = 2;
    for await (const _record of parseCsv) {
      const recordErrors: string[] = [];

      // check t_course_id:
      const t_course_id = _record['t_course_id'];
      if (!t_course_id) recordErrors.push('t_course_id is missing');
      else {
        if (t_course_id && isNaN(parseInt(t_course_id)))
          recordErrors.push(`t_course_id must be a positive integer`);
        else if (t_course_id && !courseIds.includes(parseInt(t_course_id)))
          recordErrors.push(`t_course_id is not exist`);
      }

      // check t_student_id:
      const t_student_id = _record['t_student_id'];
      if (!t_student_id) recordErrors.push('t_student_id is missing');
      else {
        if (t_student_id && isNaN(parseInt(t_student_id)))
          recordErrors.push(`t_student_id must be a positive integer`);
        else if (t_student_id && !studentIds.includes(parseInt(t_student_id)))
          recordErrors.push(`t_student_id is not exist`);
      }

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0)
        records.push(
          this.courseParticipationRepository.create({
            t_course_id: parseInt(t_course_id),
            t_student_id: parseInt(t_student_id),
          }),
        );

      lineNumber++;
    }

    if (errors.length > 0) {
      return { isSuccess: false, errors };
    } else {
      await this.courseParticipationRepository
        .createQueryBuilder()
        .insert()
        .orIgnore(true)
        .into(CourseParticipationEntity)
        .values(records)
        .execute();
      return { isSuccess: true, errors: [] };
    }
  }

  createNewCourse(createCourseDto: CreateCourseDto) {
    return this.courseService.createNewCourse(createCourseDto);
  }
}
