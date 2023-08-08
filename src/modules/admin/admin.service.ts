import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/db/entities/admin.entity';
import { DepartmentEntity } from 'src/db/entities/department.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { Brackets, DataSource, In, Repository } from 'typeorm';
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
import { AttendanceSessionEntity } from 'src/db/entities/attendance-session.entity';
import { AttendanceResultEntity } from 'src/db/entities/attendance-result.entity';
import { UpdateStudentInfoDto } from './dto/update-student-info.dto';

@Injectable()
export class AdminService {
  constructor(
    private dataSource: DataSource,

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

  async changeTeacherPassword(teacherId: number, newPass: string) {
    const teacher = await this.teacherRepository.findOneOrFail({
      where: { id: teacherId },
    });

    await this.teacherRepository.update(
      { id: teacher.id },
      { password: await bcrypt.hash(newPass, 12) },
    );
  }

  async deleteTeacher(teacherId: number) {
    const teacher = await this.teacherRepository.findOneOrFail({
      where: { id: teacherId },
    });

    await this.dataSource.transaction(async (manager) => {
      const courses = await manager.find(CourseEntity, {
        where: { t_teacher_id: teacher.id },
      });
      const courseIds = courses.map((course) => course.id);

      const sessions = await manager.find(AttendanceSessionEntity, {
        where: { t_course_id: In(courseIds) },
      });
      const sessionIds = sessions.map((session) => session.id);

      await manager.delete(AttendanceResultEntity, {
        t_attendance_session_id: In(sessionIds),
      });

      await manager.delete(AttendanceSessionEntity, {
        t_course_id: In(courseIds),
      });

      await manager.delete(CourseScheduleEntity, {
        t_course_id: In(courseIds),
      });

      await manager.delete(CourseParticipationEntity, {
        t_course_id: In(courseIds),
      });

      await manager.delete(CourseEntity, { t_teacher_id: teacher.id });

      await manager.delete(TeacherEntity, { id: teacher.id });
    });
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

  getStudentInfo(studentId: number) {
    return this.studentRepository
      .createQueryBuilder('student')
      .where('student.id = :studentId', { studentId })
      .getOneOrFail();
  }

  async updateStudentInfo(
    studentId: number,
    updateStudentInfoDto: UpdateStudentInfoDto,
  ) {
    const student = await this.studentRepository.findOneOrFail({
      where: { id: studentId },
    });

    await this.studentRepository.update(
      { id: student.id },
      updateStudentInfoDto,
    );
  }

  getStudentCourse(studentId: number) {
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

  async changeStudentPassword(studentId: number, newPass: string) {
    const student = await this.studentRepository.findOneOrFail({
      where: { id: studentId },
    });

    await this.studentRepository.update(
      { id: student.id },
      { password: await bcrypt.hash(newPass, 12) },
    );
  }

  async deleteStudent(studentId: number) {
    const student = await this.studentRepository.findOneOrFail({
      where: { id: studentId },
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(AttendanceResultEntity, {
        t_student_id: student.id,
      });

      await manager.delete(CourseParticipationEntity, {
        t_student_id: student.id,
      });

      await manager.delete(StudentEntity, { id: student.id });
    });
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

  getCourseData(courseId: number) {
    return this.courseRepository
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
  }

  async updateCourseData(
    courseId: number,
    data: {
      m_subject_id: number;
      course_code: string;
      start_date: string;
      end_date: string;
      description?: string;
    },
  ) {
    const course = await this.courseRepository.findOneOrFail({
      where: { id: courseId },
    });

    course.m_subject_id = data.m_subject_id;
    course.course_code = data.course_code;
    course.start_date = data.start_date;
    course.end_date = data.end_date;
    course.description = data.description;

    return await this.courseRepository.save(course);
  }

  async addCourseSchedule(
    courseId: number,
    data: {
      day_of_week: number;
      start_hour: number;
      start_min: number;
      end_hour: number;
      end_min: number;
    },
  ) {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect(
        'course.courseParticipation',
        'class',
        'class.t_course_id = course.id',
      )
      .where('course.id = :courseId', { courseId })
      .getOneOrFail();

    const { day_of_week, start_hour, start_min, end_hour, end_min } = data;

    // check conflict with teacher schedule:
    const conflictTeacherSchedule = await this.courseScheduleRepository
      .createQueryBuilder('schedule')
      .leftJoin(CourseEntity, 'course', 'course.id = schedule.t_course_id')
      .leftJoin(TeacherEntity, 'teacher', 'teacher.id = course.t_teacher_id')
      .where('teacher.id = :teacherId', { teacherId: course.t_teacher_id })
      .andWhere('schedule.day_of_week = :dayOfWeek', {
        dayOfWeek: `${day_of_week}`,
      })
      .andWhere(
        new Brackets((qb) => {
          return qb
            .where(
              '(schedule.start_hour * 60 + schedule.start_min) <= :start AND (schedule.end_hour * 60 + schedule.end_min) > :start',
              { start: start_hour * 60 + start_min },
            )
            .orWhere(
              '(schedule.start_hour * 60 + schedule.start_min) < :end AND (schedule.end_hour * 60 + schedule.end_min) >= :end',
              { end: end_hour * 60 + end_min },
            );
        }),
      )
      .groupBy('schedule.id')
      .getOne();
    if (conflictTeacherSchedule)
      throw new BadRequestException(
        `Conflict with a schedule of teacher (${
          Object.keys(DayOfWeek)[
            Object.values(DayOfWeek).indexOf(
              conflictTeacherSchedule.day_of_week,
            )
          ]
        } from ${this.formatTimeDisplay24Hours(
          conflictTeacherSchedule.start_hour,
          conflictTeacherSchedule.start_min,
        )} to ${this.formatTimeDisplay24Hours(
          conflictTeacherSchedule.end_hour,
          conflictTeacherSchedule.end_min,
        )}).`,
      );

    // check conflict with students schedule:
    const studentIds = (course.courseParticipation ?? []).map(
      (item) => item.t_student_id,
    );
    if (studentIds.length > 0) {
      const conflictStudentSchedule = await this.courseScheduleRepository
        .createQueryBuilder('schedule')
        .leftJoin(CourseEntity, 'course', 'course.id = schedule.t_course_id')
        .leftJoin(
          CourseParticipationEntity,
          'class',
          'class.t_course_id = course.id',
        )
        .where('class.t_student_id IN (:...studentIds)', {
          studentIds,
        })
        .andWhere('schedule.day_of_week = :dayOfWeek', {
          dayOfWeek: `${day_of_week}`,
        })
        .andWhere(
          new Brackets((qb) => {
            return qb
              .where(
                '(schedule.start_hour * 60 + schedule.start_min) <= :start AND (schedule.end_hour * 60 + schedule.end_min) > :start',
                { start: start_hour * 60 + start_min },
              )
              .orWhere(
                '(schedule.start_hour * 60 + schedule.start_min) < :end AND (schedule.end_hour * 60 + schedule.end_min) >= :end',
                { end: end_hour * 60 + end_min },
              );
          }),
        )
        .groupBy('schedule.id')
        .getOne();
      if (conflictStudentSchedule)
        throw new BadRequestException(
          `Conflict with a schedule of student in this course (${
            Object.keys(DayOfWeek)[
              Object.values(DayOfWeek).indexOf(
                conflictStudentSchedule.day_of_week,
              )
            ]
          } from ${this.formatTimeDisplay24Hours(
            conflictStudentSchedule.start_hour,
            conflictStudentSchedule.start_min,
          )} to ${this.formatTimeDisplay24Hours(
            conflictStudentSchedule.end_hour,
            conflictStudentSchedule.end_min,
          )}).`,
        );
    }

    return await this.courseScheduleRepository.save(
      this.courseScheduleRepository.create({
        t_course_id: course.id,
        ...data,
      }),
    );
  }

  async deleteSchedule(courseId: number, data: { scheduleId: number }) {
    await this.courseRepository.findOneOrFail({
      where: { id: courseId },
    });

    await this.courseScheduleRepository.delete({ id: data.scheduleId });
  }

  async getListStudentOfCourse(courseId: number, search?: string) {
    const course = await this.courseRepository.findOneOrFail({
      where: { id: courseId },
    });

    const query = this.studentRepository
      .createQueryBuilder('student')
      .leftJoin(
        CourseParticipationEntity,
        'course_participation',
        'course_participation.t_student_id = student.id',
      )
      .where('course_participation.t_course_id = :courseId', {
        courseId: course.id,
      });

    if (search) {
      search = search.trim();
      query.andWhere(
        new Brackets((qb) =>
          qb
            .where('student.student_code LIKE :studentCode', {
              studentCode: `%${search}%`,
            })
            .orWhere('student.email LIKE :email', {
              email: `%${search}%`,
            })
            .orWhere('student.first_name LIKE :firstName', {
              firstName: `%${search}%`,
            })
            .orWhere('student.last_name LIKE :lastName', {
              lastName: `%${search}%`,
            })
            .orWhere('student.phone_number LIKE :phoneNumber', {
              phoneNumber: `%${search}%`,
            }),
        ),
      );
    }

    return await query.getMany();
  }

  async deleteStudentFromCourse(courseId: number, studentId: number) {
    const course = await this.courseRepository.findOneOrFail({
      where: { id: courseId },
    });

    const student = await this.studentRepository.findOneOrFail({
      where: { id: studentId },
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CourseParticipationEntity, {
        t_student_id: student.id,
        t_course_id: course.id,
      });

      const sessions = await manager.find(AttendanceSessionEntity, {
        where: { t_course_id: course.id },
      });

      await manager.delete(AttendanceResultEntity, {
        t_student_id: student.id,
        t_attendance_session_id: In(sessions.map((session) => session.id)),
      });
    });
  }

  async addStudentToCourse(courseId: number, studentCodeOrEmail: string) {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect(
        'course.courseSchedules',
        'schedule',
        'schedule.t_course_id = course.id',
      )
      .where('course.id = :courseId', { courseId })
      .getOne();
    if (!course) throw new BadRequestException(`Course isn't exist.`);

    const student = await this.studentRepository
      .createQueryBuilder('student')
      .where('student.student_code = :studentCode', {
        studentCode: studentCodeOrEmail,
      })
      .orWhere('student.email = :email', {
        email: studentCodeOrEmail,
      })
      .getOne();
    if (!student) throw new BadRequestException(`Student isn't exist.`);

    const checkExist = await this.courseParticipationRepository.findOne({
      where: { t_course_id: course.id, t_student_id: student.id },
    });
    if (checkExist)
      throw new BadRequestException('Student have joined this course.');

    // check schedule conflict:
    const currentStudentSchedules = await this.courseScheduleRepository
      .createQueryBuilder('schedule')
      .leftJoin(CourseEntity, 'course', 'course.id = schedule.t_course_id')
      .leftJoin(
        CourseParticipationEntity,
        'class',
        'class.t_course_id = course.id',
      )
      .where('class.t_student_id = :studentId', { studentId: student.id })
      .groupBy('schedule.id')
      .getMany();

    const conflictSchedule = currentStudentSchedules.find((studentSchedule) => {
      const studentScheduleStart =
        studentSchedule.start_hour * 60 + studentSchedule.start_min;
      const studentScheduleEnd =
        studentSchedule.end_hour * 60 + studentSchedule.end_min;

      const check = (course.courseSchedules ?? []).find((courseSchedule) => {
        const courseScheduleStart =
          courseSchedule.start_hour * 60 + courseSchedule.start_min;
        const courseScheduleEnd =
          courseSchedule.end_hour * 60 + courseSchedule.end_min;

        return (
          courseSchedule.day_of_week === studentSchedule.day_of_week &&
          ((courseScheduleStart <= studentScheduleStart &&
            courseScheduleEnd > studentScheduleStart) ||
            (courseScheduleStart < studentScheduleEnd &&
              courseScheduleEnd >= studentScheduleEnd))
        );
      });

      return !!check;
    });
    if (conflictSchedule)
      throw new BadRequestException(
        `The student has a schedule (${
          Object.keys(DayOfWeek)[
            Object.values(DayOfWeek).indexOf(conflictSchedule.day_of_week)
          ]
        } from ${this.formatTimeDisplay24Hours(
          conflictSchedule.start_hour,
          conflictSchedule.start_min,
        )} to ${this.formatTimeDisplay24Hours(
          conflictSchedule.end_hour,
          conflictSchedule.end_min,
        )}) that conflict with this course.`,
      );

    return await this.courseParticipationRepository.save(
      this.courseParticipationRepository.create({
        t_course_id: course.id,
        t_student_id: student.id,
      }),
    );
  }

  formatTimeDisplay24Hours(hour: number, min: number) {
    const hourDisplay = hour < 10 ? `0${hour}` : `${hour}`;

    const minDisplay = min < 10 ? `0${min}` : `${min}`;

    return `${hourDisplay}:${minDisplay}`;
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
    const subjects = await this.subjectRepository.find({
      select: ['id', 'subject_code'],
    });
    const subjectCodes = subjects.map((subject) => subject.subject_code);

    const teachers = await this.teacherRepository.find({
      select: ['id', 'teacher_code'],
    });
    const teacherCodes = teachers.map((teacher) => teacher.teacher_code);

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

      // check subject_code:
      const subject_code = _record['subject_code'];
      if (!subject_code) recordErrors.push('subject_code is missing');
      if (subject_code && !subjectCodes.includes(subject_code))
        recordErrors.push(`subject_code "${subject_code}" is not exist`);

      // check teacher_code:
      const teacher_code = _record['teacher_code'];
      if (!teacher_code) recordErrors.push('teacher_code is missing');
      if (teacher_code && !teacherCodes.includes(teacher_code))
        recordErrors.push(`teacher_code "${teacher_code}" is not exist`);

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

      if (recordErrors.length === 0) {
        const subjectId = subjects.find(
          (subject) => subject.subject_code == subject_code,
        )?.id;
        const teacherId = teachers.find(
          (teacher) => teacher.teacher_code == teacher_code,
        )?.id;

        if (subjectId && teacherId)
          records.push(
            this.courseRepository.create({
              m_subject_id: subjectId,
              t_teacher_id: teacherId,
              course_code,
              description,
              start_date,
              end_date,
            }),
          );
      }

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
      select: ['id', 'course_code', 't_teacher_id'],
    });
    const courseCodes = courses.map((course) => course.course_code);

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

      // check course_code:
      const course_code = _record['course_code'];
      if (!course_code) recordErrors.push('course_code is missing');
      else {
        if (!courseCodes.includes(course_code))
          recordErrors.push(`course_code "${course_code}" is not exist`);
      }
      const courseId = courses.find(
        (course) => course.course_code == course_code,
      )?.id;
      if (!courseId) continue;

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
      // if (isValidStartTime && isValidEndTime) {
      //   if (
      //     parseInt(start_hour) * 60 + parseInt(start_min) >=
      //     parseInt(end_hour) * 60 + parseInt(end_min)
      //   )
      //     recordErrors.push(`the start time must be earlier than the end time`);
      //   else {
      //     const tmpStart = parseInt(start_hour) * 60 + parseInt(start_min);
      //     const tmpEnd = parseInt(end_hour) * 60 + parseInt(end_min);
      //     const tmp = records.find((record) => {
      //       if (
      //         record.schedule.t_course_id === parseInt(t_course_id) &&
      //         record.schedule.day_of_week === parseInt(day_of_week)
      //       ) {
      //         const recordStart =
      //           record.schedule.start_hour * 60 + record.schedule.start_min;
      //         const recordEnd =
      //           record.schedule.end_hour * 60 + record.schedule.end_min;
      //         if (
      //           (recordStart <= tmpStart && recordEnd > tmpStart) ||
      //           (recordStart < tmpEnd && recordEnd >= tmpEnd)
      //         )
      //           return true;
      //         else return false;
      //       } else return false;
      //     });

      //     if (tmp)
      //       recordErrors.push(`conflict time with line number ${tmp.line}`);
      //     else {
      //       const existSchedule = schedules.find((schedule) => {
      //         if (
      //           schedule.t_course_id === parseInt(t_course_id) &&
      //           schedule.day_of_week === parseInt(day_of_week)
      //         ) {
      //           const scheduleStart =
      //             schedule.start_hour * 60 + schedule.start_min;
      //           const scheduleEnd = schedule.end_hour * 60 + schedule.end_min;
      //           if (
      //             (scheduleStart <= tmpStart && scheduleEnd > tmpStart) ||
      //             (scheduleStart < tmpEnd && scheduleEnd >= tmpEnd)
      //           )
      //             return true;
      //           else return false;
      //         } else return false;
      //       });

      //       if (existSchedule)
      //         recordErrors.push(
      //           `conflict time with exist schedule id ${existSchedule.id}`,
      //         );
      //     }
      //   }
      // }

      if (isValidStartTime && isValidEndTime) {
        const tmpStart = parseInt(start_hour) * 60 + parseInt(start_min);
        const tmpEnd = parseInt(end_hour) * 60 + parseInt(end_min);

        if (tmpStart >= tmpEnd) {
          recordErrors.push(`the start time must be earlier than the end time`);
        } else {
          // check conflict with teacher schedule in previous records:
          const tmpTeacherId = courses.find(
            (course) => course.id === courseId,
          )?.t_teacher_id;
          const abc = records.filter((record) => {
            return (
              courses.find(
                (course) => course.id === record.schedule.t_course_id,
              )?.t_teacher_id === tmpTeacherId
            );
          });
          const checkPrev = abc.find((record) => {
            const recordStart =
              record.schedule.start_hour * 60 + record.schedule.start_min;
            const recordEnd =
              record.schedule.end_hour * 60 + record.schedule.end_min;
            return (
              record.schedule.day_of_week === parseInt(day_of_week) &&
              ((recordStart <= tmpStart && recordEnd > tmpStart) ||
                (recordStart < tmpEnd && recordEnd >= tmpEnd))
            );
          });

          if (checkPrev) {
            recordErrors.push(
              `conflict with prev teacher schedule in line ${checkPrev.line}`,
            );
          } else {
            // check conflict with current teacher schedule:
            const curTeacherSchedules = schedules.filter((schedule) => {
              return (
                courses.find((course) => course.id === schedule.t_course_id)
                  ?.t_teacher_id === tmpTeacherId
              );
            });

            const checkConflict = curTeacherSchedules.find((schedule) => {
              const scheduleStart =
                schedule.start_hour * 60 + schedule.start_min;
              const scheduleEnd = schedule.end_hour * 60 + schedule.end_min;
              return (
                schedule.day_of_week === parseInt(day_of_week) &&
                ((scheduleStart <= tmpStart && scheduleEnd > tmpStart) ||
                  (scheduleStart < tmpEnd && scheduleEnd >= tmpEnd))
              );
            });

            if (checkConflict)
              recordErrors.push(
                `conflict with current teacher schedule (${
                  Object.keys(DayOfWeek)[
                    Object.values(DayOfWeek).indexOf(checkConflict.day_of_week)
                  ]
                } from ${this.formatTimeDisplay24Hours(
                  checkConflict.start_hour,
                  checkConflict.start_min,
                )} to ${this.formatTimeDisplay24Hours(
                  checkConflict.end_hour,
                  checkConflict.end_min,
                )})`,
              );
          }
        }
      }

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0) {
        records.push({
          line: lineNumber,
          schedule: this.courseScheduleRepository.create({
            t_course_id: courseId,
            day_of_week: parseInt(day_of_week),
            start_hour: parseInt(start_hour),
            start_min: parseInt(start_min),
            end_hour: parseInt(end_hour),
            end_min: parseInt(end_min),
          }),
        });
      }

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
    const courses = await this.courseRepository.find({
      select: ['id', 'course_code'],
    });
    const courseCodes = courses.map((course) => course.course_code);

    const students = await this.studentRepository.find({
      select: ['id', 'student_code'],
    });
    const studentCodes = students.map((student) => student.student_code);

    const schedules = await this.courseScheduleRepository.find();

    const classes = await this.courseParticipationRepository.find();

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
    const records: { line: number; inst: CourseParticipationEntity }[] = [];
    const errors: string[] = [];

    let lineNumber = 2;
    for await (const _record of parseCsv) {
      const recordErrors: string[] = [];

      // check course_code:
      const course_code = _record['course_code'];
      if (!course_code) recordErrors.push('course_code is missing');
      else {
        if (!courseCodes.includes(course_code))
          recordErrors.push(`course_code "${course_code}" is not exist`);
      }
      const courseId = courses.find(
        (course) => course.course_code == course_code,
      )?.id;
      if (!courseId) continue;

      // check student_code:
      const student_code = _record['student_code'];
      if (!student_code) recordErrors.push('student_code is missing');
      else {
        if (!studentCodes.includes(student_code))
          recordErrors.push(`student_code "${student_code}" is not exist`);
      }
      const studentId = students.find(
        (student) => student.student_code == student_code,
      )?.id;
      if (!studentId) continue;

      if (
        records.find(
          (record) =>
            record.inst.t_course_id === courseId &&
            record.inst.t_student_id === studentId,
        )
      )
        continue;

      if (
        classes.find(
          (c) => c.t_course_id === courseId && c.t_student_id === studentId,
        )
      )
        continue;

      //
      const curCourseSchedules = schedules.filter(
        (schedule) => schedule.t_course_id === courseId,
      );
      const curStudentSchedules = schedules.filter((schedule) =>
        classes
          .filter((c) => c.t_student_id === studentId)
          .map((c) => c.t_course_id)
          .includes(schedule.t_course_id),
      );
      const conflictSchedule = curStudentSchedules.find((studentSchedule) => {
        const studentScheduleStart =
          studentSchedule.start_hour * 60 + studentSchedule.start_min;
        const studentScheduleEnd =
          studentSchedule.end_hour * 60 + studentSchedule.end_min;

        const check = curCourseSchedules.find((courseSchedule) => {
          const courseScheduleStart =
            courseSchedule.start_hour * 60 + courseSchedule.start_min;
          const courseScheduleEnd =
            courseSchedule.end_hour * 60 + courseSchedule.end_min;

          return (
            courseSchedule.day_of_week === studentSchedule.day_of_week &&
            ((courseScheduleStart <= studentScheduleStart &&
              courseScheduleEnd > studentScheduleStart) ||
              (courseScheduleStart < studentScheduleEnd &&
                courseScheduleEnd >= studentScheduleEnd))
          );
        });

        return !!check;
      });
      if (conflictSchedule)
        recordErrors.push(`student and course conflict schedule time`);

      //
      const prev = schedules.filter((schedule) =>
        records
          .filter((record) => record.inst.t_student_id === studentId)
          .map((record) => record.inst.t_course_id)
          .includes(schedule.t_course_id),
      );
      const conflictPrevSchedule = prev.find((studentSchedule) => {
        const studentScheduleStart =
          studentSchedule.start_hour * 60 + studentSchedule.start_min;
        const studentScheduleEnd =
          studentSchedule.end_hour * 60 + studentSchedule.end_min;

        const check = curCourseSchedules.find((courseSchedule) => {
          const courseScheduleStart =
            courseSchedule.start_hour * 60 + courseSchedule.start_min;
          const courseScheduleEnd =
            courseSchedule.end_hour * 60 + courseSchedule.end_min;

          return (
            courseSchedule.day_of_week === studentSchedule.day_of_week &&
            ((courseScheduleStart <= studentScheduleStart &&
              courseScheduleEnd > studentScheduleStart) ||
              (courseScheduleStart < studentScheduleEnd &&
                courseScheduleEnd >= studentScheduleEnd))
          );
        });

        return !!check;
      });
      if (conflictPrevSchedule)
        recordErrors.push(
          `conflict course schedule with line ${
            records
              .filter((record) => record.inst.t_student_id === studentId)
              .find(
                (record) =>
                  record.inst.t_course_id === conflictPrevSchedule.t_course_id,
              )?.line
          }`,
        );

      if (recordErrors.length > 0)
        errors.push(`Line number ${lineNumber}: ${recordErrors.join(', ')}`);

      if (recordErrors.length === 0) {
        records.push({
          line: lineNumber,
          inst: this.courseParticipationRepository.create({
            t_course_id: courseId,
            t_student_id: studentId,
          }),
        });
      }

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
        .values(records.map((record) => record.inst))
        .execute();
      return { isSuccess: true, errors: [] };
    }
  }

  createNewCourse(createCourseDto: CreateCourseDto) {
    return this.courseService.createNewCourse(createCourseDto);
  }

  async deleteCourse(courseId: number) {
    const course = await this.courseRepository.findOneOrFail({
      where: { id: courseId },
    });

    await this.dataSource.transaction(async (manager) => {
      const sessions = await manager.find(AttendanceSessionEntity, {
        where: { t_course_id: course.id },
      });
      const sessionIds = sessions.map((session) => session.id);

      await manager.delete(AttendanceResultEntity, {
        t_attendance_session_id: In(sessionIds),
      });

      await manager.delete(AttendanceSessionEntity, {
        t_course_id: course.id,
      });

      await manager.delete(CourseScheduleEntity, {
        t_course_id: course.id,
      });

      await manager.delete(CourseParticipationEntity, {
        t_course_id: course.id,
      });

      await manager.delete(CourseEntity, { id: course.id });
    });
  }
}
