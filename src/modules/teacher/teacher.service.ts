import { BadRequestException, Injectable } from '@nestjs/common';
import { Brackets, DataSource, MoreThan, Repository } from 'typeorm';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import * as bcrypt from 'bcrypt';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { AttendanceSessionEntity } from 'src/db/entities/attendance-session.entity';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { add, compareAsc, format, isBefore } from 'date-fns';
import { AttendanceResultEntity } from 'src/db/entities/attendance-result.entity';
import { StudentEntity } from 'src/db/entities/student.entity';
import { CourseParticipationEntity } from 'src/db/entities/course-participation.entity';
import { CourseScheduleEntity } from 'src/db/entities/course-schedule.entity';
import { DayOfWeek } from 'src/types/common.type';
import { JwtService } from '@nestjs/jwt';
import { JwtQrCodePayload } from 'src/types/qr-code.type';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { MailerService } from '../mailer/mailer.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AttendanceStatusEntity } from 'src/db/entities/attendance-status.entity';
import { stringify } from 'csv-stringify';

@Injectable()
export class TeacherService {
  constructor(
    private dataSource: DataSource,

    private jwtService: JwtService,

    private readonly schedulerRegistry: SchedulerRegistry,

    private readonly mailerService: MailerService,

    private readonly realtimeGateway: RealtimeGateway,

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

    @InjectRepository(AttendanceResultEntity)
    private readonly attendanceResultRepository: Repository<AttendanceResultEntity>,

    @InjectRepository(AttendanceStatusEntity)
    private readonly attendanceStatusRepository: Repository<AttendanceStatusEntity>,
  ) {}

  getOneById(id: number): Promise<TeacherEntity> {
    return this.teacherRepository.findOneOrFail({ where: { id } });
  }

  getOneByEmail(email: string): Promise<TeacherEntity | null> {
    return this.teacherRepository.findOne({ where: { email } });
  }

  updatePasswordResetCode(
    teacherId: number,
    resetCode: string | null,
    resetCodeExpiredAt: Date | null,
  ) {
    return this.teacherRepository
      .createQueryBuilder()
      .update()
      .set({
        password_reset_code: resetCode,
        password_reset_expired_at: resetCodeExpiredAt,
      })
      .where('id = :teacherId', { teacherId })
      .execute();
  }

  async resetPassword(resetCode: string, newPassword: string) {
    const teacher = await this.teacherRepository.findOne({
      where: {
        password_reset_code: resetCode,
        password_reset_expired_at: MoreThan(new Date()),
      },
    });

    if (!teacher)
      throw new BadRequestException('Invalid token or token has expired.');

    const hashPassword = await bcrypt.hash(newPassword, 12);

    teacher.password = hashPassword;
    teacher.password_reset_code = null;
    teacher.password_reset_expired_at = null;
    await this.teacherRepository.save(teacher);
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

    const genPassword = createTeacherDto.password ?? this.genRandomPassword();
    const hashPassword = await bcrypt.hash(genPassword, 12);

    const newTeacher = await this.teacherRepository.save(
      this.teacherRepository.create({
        m_department_id: createTeacherDto.m_department_id,
        teacher_code: !currentNewestTeacher?.maxTeacherCode
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
      .andWhere('course.t_teacher_id = :teacherId', { teacherId })
      .orderBy('schedule.start_hour', 'ASC')
      .addOrderBy('schedule.start_min', 'ASC')
      .getOneOrFail();

    return course;
  }

  async updateCourse(
    teacherId: number,
    courseId: number,
    description?: string,
    rotate_qrcode_interval_seconds?: number,
    prevent_student_use_same_address?: number,
    attendance_rate?: number,
  ) {
    const course = await this.courseRepository.findOneOrFail({
      where: { id: courseId, t_teacher_id: teacherId },
      relations: {
        subject: true,
        teacher: true,
        courseSchedules: true,
      },
    });

    course.description = description;

    if (rotate_qrcode_interval_seconds !== undefined)
      course.rotate_qrcode_interval_seconds = rotate_qrcode_interval_seconds;

    if (prevent_student_use_same_address !== undefined)
      course.prevent_student_use_same_address =
        prevent_student_use_same_address;

    if (attendance_rate !== undefined) course.attendance_rate = attendance_rate;

    return await this.courseRepository.save(course);
  }

  async getListOfCourseStudents(
    teacherId: number,
    courseId: number,
    search?: string,
  ) {
    const course = await this.courseRepository.findOneOrFail({
      where: { t_teacher_id: teacherId, id: courseId },
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

  async addAttendanceSession(
    teacherId: number,
    courseId: number,
    createAttendanceSessionDto: CreateAttendanceSessionDto,
  ) {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect(
        'course.subject',
        'subject',
        'subject.id = course.m_subject_id',
      )
      .where('course.id = :courseId', { courseId })
      .andWhere('course.t_teacher_id = :teacherId', { teacherId })
      .getOne();
    if (!course) throw new BadRequestException('Course does not exist.');

    const {
      session_date,
      start_hour,
      start_min,
      end_hour,
      end_min,
      overtime_minutes_for_late,
      password,
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

    if (overtime_minutes_for_late && overtime_minutes_for_late < 1)
      throw new BadRequestException(
        'Overtime minutes for late must be greater than or equal to 1.',
      );

    const existSession = await this.attendanceSessionRepository
      .createQueryBuilder('session')
      .where('session.t_course_id = :courseId', { courseId: course.id })
      .andWhere('session.session_date = :sessionDate', {
        sessionDate: session_date,
      })
      .andWhere(
        new Brackets((qb) => {
          return qb
            .where(
              '(session.start_hour * 60 + session.start_min) <= :start AND (session.end_hour * 60 + session.end_min + IF(session.overtime_minutes_for_late IS NULL, 0, session.overtime_minutes_for_late)) > :start',
              { start: start_hour * 60 + start_min },
            )
            .orWhere(
              '(session.start_hour * 60 + session.start_min) < :end AND (session.end_hour * 60 + session.end_min + IF(session.overtime_minutes_for_late IS NULL, 0, session.overtime_minutes_for_late)) >= :end',
              {
                end: end_hour * 60 + end_min + (overtime_minutes_for_late ?? 0),
              },
            );
        }),
      )
      .getOne();
    if (existSession)
      throw new BadRequestException(
        'The session time is overlapped with another session.',
      );

    const result = await this.attendanceSessionRepository.save(
      this.attendanceSessionRepository.create({
        t_course_id: course.id,
        password: password ?? this.genRandomPassword(),
        session_date,
        start_hour,
        start_min,
        end_hour,
        end_min,
        overtime_minutes_for_late,
        description: description ?? 'Regular class session',
      }),
    );

    // add cronjob send mail to students when session start:
    const sessionStartTime = new Date(
      `${session_date}T${start_hour < 10 ? `0${start_hour}` : start_hour}:${
        start_min < 10 ? `0${start_min}` : start_min
      }:00`,
    );
    if (isBefore(new Date(), sessionStartTime)) {
      const jobAction = async () => {
        console.log(`session ${result.id} start on ${new Date()}`);
        const studentEmails = (
          await this.studentRepository
            .createQueryBuilder('student')
            .innerJoin(
              CourseParticipationEntity,
              'course_participation',
              'course_participation.t_student_id = student.id',
            )
            .where('course_participation.t_course_id = :courseId', { courseId })
            .getMany()
        ).map((student) => student.email);

        await this.mailerService.sendMail(
          studentEmails,
          'Attendance session notifications',
          `You have an attendance session to do right now. Please scan the QR code provided by your teacher to do that.\nCourse code: ${
            course.course_code
          }\nSubject: ${course.subject?.subject_code} - ${
            course.subject?.subject_name
          }\nTime: ${session_date} ${
            start_hour < 10 ? `0${start_hour}` : start_hour
          }:${start_min < 10 ? `0${start_min}` : start_min} ~ ${
            end_hour < 10 ? `0${end_hour}` : end_hour
          }:${
            end_min < 10 ? `0${end_min}` : end_min
          } (Asia/Ho_Chi_Minh)\nOvertime: ${
            overtime_minutes_for_late ?? 0
          } mins`,
        );
      };
      const noticeJob = new CronJob(sessionStartTime, jobAction);
      this.schedulerRegistry.addCronJob(
        `NOTICE_SESSION_START:${result.id}`,
        noticeJob,
      );
      noticeJob.start();
    }

    // add cronjob update result session and send mail to students when session ended:
    const sessionEndTime = add(
      new Date(
        `${session_date}T${end_hour < 10 ? `0${end_hour}` : end_hour}:${
          end_min < 10 ? `0${end_min}` : end_min
        }:00`,
      ),
      { minutes: overtime_minutes_for_late },
    );
    if (isBefore(new Date(), sessionEndTime)) {
      const jobAction = async () => {
        console.log(`session ${result.id} end on ${new Date()}`);
        const students = await this.studentRepository
          .createQueryBuilder('student')
          .innerJoin(
            CourseParticipationEntity,
            'course_participation',
            'course_participation.t_student_id = student.id',
          )
          .where('course_participation.t_course_id = :courseId', { courseId })
          .getMany();

        await this.attendanceResultRepository
          .createQueryBuilder()
          .insert()
          .orIgnore(true)
          .into(AttendanceResultEntity)
          .values(
            students.map((student) => ({
              t_attendance_session_id: result.id,
              t_student_id: student.id,
              m_attendance_status_id: 4,
              record_time: () => 'NOW()',
              record_by_teacher: 1,
            })),
          )
          .execute();

        const studentEmails = students.map((student) => student.email);
        await this.mailerService.sendMail(
          studentEmails,
          'Attendance session notifications',
          `Your attendance session has just ended. Visit url: ${
            process.env.STUDENT_SITE_DOMAIN
          }/course/${course.id}/session/${
            result.id
          } to see the results.\nCourse code: ${course.course_code}\nSubject: ${
            course.subject?.subject_code
          } - ${course.subject?.subject_name}\nTime: ${session_date} ${
            start_hour < 10 ? `0${start_hour}` : start_hour
          }:${start_min < 10 ? `0${start_min}` : start_min} ~ ${
            end_hour < 10 ? `0${end_hour}` : end_hour
          }:${
            end_min < 10 ? `0${end_min}` : end_min
          } (Asia/Ho_Chi_Minh)\nOvertime: ${
            overtime_minutes_for_late ?? 0
          } mins`,
        );

        this.realtimeGateway.pushNotificationSessionEnd(result);
      };
      const job = new CronJob(sessionEndTime, jobAction);
      this.schedulerRegistry.addCronJob(`NOTICE_SESSION_END:${result.id}`, job);
      job.start();
    }

    return result;
  }

  async addMultiAttendanceSession(
    teacherId: number,
    courseId: number,
    listSessionToCreate: CreateAttendanceSessionDto[],
    // officialTime: number,
    // overtime: number,
    // description: number,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, t_teacher_id: teacherId },
    });
    if (!course) throw new BadRequestException('Course does not exist.');

    await this.dataSource.transaction(async (manager) => {
      for (const item of listSessionToCreate) {
        const existSession = await manager
          .createQueryBuilder(AttendanceSessionEntity, 'session')
          .where('session.t_course_id = :courseId', { courseId: course.id })
          .andWhere('session.session_date = :sessionDate', {
            sessionDate: item.session_date,
          })
          .andWhere(
            new Brackets((qb) => {
              return qb
                .where(
                  '(session.start_hour * 60 + session.start_min) <= :start AND (session.end_hour * 60 + session.end_min + IF(session.overtime_minutes_for_late IS NULL, 0, session.overtime_minutes_for_late)) > :start',
                  { start: item.start_hour * 60 + item.start_min },
                )
                .orWhere(
                  '(session.start_hour * 60 + session.start_min) < :end AND (session.end_hour * 60 + session.end_min + IF(session.overtime_minutes_for_late IS NULL, 0, session.overtime_minutes_for_late)) >= :end',
                  { end: item.end_hour * 60 + item.end_min },
                );
            }),
          )
          .getOne();

        if (!existSession) {
          const result = await manager.save(
            AttendanceSessionEntity,
            manager.create(AttendanceSessionEntity, {
              ...item,
              t_course_id: course.id,
              password: item.password ?? this.genRandomPassword(),
              description: item.description ?? 'Regular class session',
            }),
          );

          // add cronjob send mail to students when session start:
          const sessionStartTime = new Date(
            `${item.session_date}T${
              item.start_hour < 10 ? `0${item.start_hour}` : item.start_hour
            }:${
              item.start_min < 10 ? `0${item.start_min}` : item.start_min
            }:00`,
          );
          if (isBefore(new Date(), sessionStartTime)) {
            const jobAction = async () => {
              console.log(`session ${result.id} start on ${new Date()}`);
              const studentEmails = (
                await this.studentRepository
                  .createQueryBuilder('student')
                  .innerJoin(
                    CourseParticipationEntity,
                    'course_participation',
                    'course_participation.t_student_id = student.id',
                  )
                  .where('course_participation.t_course_id = :courseId', {
                    courseId,
                  })
                  .getMany()
              ).map((student) => student.email);

              await this.mailerService.sendMail(
                studentEmails,
                'Attendance session notifications',
                `You have an attendance session to do right now. Please scan the QR code provided by your teacher to do that.\nCourse code: ${
                  course.course_code
                }\nSubject: ${course.subject?.subject_code} - ${
                  course.subject?.subject_name
                }\nTime: ${item.session_date} ${
                  item.start_hour < 10 ? `0${item.start_hour}` : item.start_hour
                }:${
                  item.start_min < 10 ? `0${item.start_min}` : item.start_min
                } ~ ${
                  item.end_hour < 10 ? `0${item.end_hour}` : item.end_hour
                }:${
                  item.end_min < 10 ? `0${item.end_min}` : item.end_min
                } (Asia/Ho_Chi_Minh)\nOvertime: ${
                  item.overtime_minutes_for_late ?? 0
                } mins`,
              );
            };
            const noticeJob = new CronJob(sessionStartTime, jobAction);
            this.schedulerRegistry.addCronJob(
              `NOTICE_SESSION_START:${result.id}`,
              noticeJob,
            );
            noticeJob.start();
          }

          // add cronjob update result session and send mail to students when session ended:
          const sessionEndTime = add(
            new Date(
              `${item.session_date}T${
                item.end_hour < 10 ? `0${item.end_hour}` : item.end_hour
              }:${item.end_min < 10 ? `0${item.end_min}` : item.end_min}:00`,
            ),
            { minutes: item.overtime_minutes_for_late },
          );
          if (isBefore(new Date(), sessionEndTime)) {
            const jobAction = async () => {
              console.log(`session ${result.id} end on ${new Date()}`);
              const students = await this.studentRepository
                .createQueryBuilder('student')
                .innerJoin(
                  CourseParticipationEntity,
                  'course_participation',
                  'course_participation.t_student_id = student.id',
                )
                .where('course_participation.t_course_id = :courseId', {
                  courseId,
                })
                .getMany();

              await this.attendanceResultRepository
                .createQueryBuilder()
                .insert()
                .orIgnore(true)
                .into(AttendanceResultEntity)
                .values(
                  students.map((student) => ({
                    t_attendance_session_id: result.id,
                    t_student_id: student.id,
                    m_attendance_status_id: 4,
                    record_time: () => 'NOW()',
                    record_by_teacher: 1,
                  })),
                )
                .execute();

              const studentEmails = students.map((student) => student.email);
              await this.mailerService.sendMail(
                studentEmails,
                'Attendance session notifications',
                `Your attendance session has just ended. Visit url: ${
                  process.env.STUDENT_SITE_DOMAIN
                }/course/${course.id}/session/${
                  result.id
                } to see the results.\nCourse code: ${
                  course.course_code
                }\nSubject: ${course.subject?.subject_code} - ${
                  course.subject?.subject_name
                }\nTime: ${item.session_date} ${
                  item.start_hour < 10 ? `0${item.start_hour}` : item.start_hour
                }:${
                  item.start_min < 10 ? `0${item.start_min}` : item.start_min
                } ~ ${
                  item.end_hour < 10 ? `0${item.end_hour}` : item.end_hour
                }:${
                  item.end_min < 10 ? `0${item.end_min}` : item.end_min
                } (Asia/Ho_Chi_Minh)\nOvertime: ${
                  item.overtime_minutes_for_late ?? 0
                } mins`,
              );

              this.realtimeGateway.pushNotificationSessionEnd(result);
            };
            const job = new CronJob(sessionEndTime, jobAction);
            this.schedulerRegistry.addCronJob(
              `NOTICE_SESSION_END:${result.id}`,
              job,
            );
            job.start();
          }
        }
      }
    });

    return true;
  }

  async getListOfCourseAttendanceSession(
    teacherId: number,
    courseId: number,
    from?: string,
    to?: string,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, t_teacher_id: teacherId },
    });

    if (!course) throw new BadRequestException('Course does not exist.');

    // const sessions = await this.attendanceSessionRepository.find({
    //   where: { t_course_id: course.id, session_date },
    //   order: { session_date: 'ASC', start_hour: 'ASC', start_min: 'ASC' },
    // });

    const query = this.attendanceSessionRepository
      .createQueryBuilder('session')
      .where('session.t_course_id = :courseId', { courseId: course.id });

    if (from) query.andWhere('session.session_date >= :from', { from });
    if (to) query.andWhere('session.session_date <= :to', { to });

    return {
      course,
      attendanceSessions: await query
        .orderBy('session.session_date', 'ASC')
        .addOrderBy('session.start_hour', 'ASC')
        .addOrderBy('session.start_min', 'ASC')
        .getMany(),
    };
  }

  async getCourseAttendanceHistory(teacherId: number, courseId: number) {
    const course = await this.getCourseData(teacherId, courseId);

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoin(
        CourseParticipationEntity,
        'course_participation',
        'course_participation.t_student_id = student.id',
      )
      // .leftJoinAndMapOne(
      //   'student.sessionResult',
      //   AttendanceResultEntity,
      //   'session_result',
      //   'session_result.t_student_id = student.id AND session_result.t_attendance_session_id = :sessionId',
      //   { sessionId: session.id },
      // )
      .where('course_participation.t_course_id = :courseId', {
        courseId: course.id,
      })
      .getMany();

    const sessions = await this.attendanceSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndMapMany(
        'session.attendanceResults',
        AttendanceResultEntity,
        'session_result',
        'session_result.t_attendance_session_id = session.id',
      )
      .leftJoinAndMapOne(
        'session_result.attendanceStatus',
        AttendanceStatusEntity,
        'attendance_status',
        'attendance_status.id = session_result.m_attendance_status_id',
      )
      .where('session.t_course_id = :courseId', { courseId: course.id })
      .orderBy('session.session_date', 'ASC')
      .addOrderBy('session.start_hour', 'ASC')
      .addOrderBy('session.start_min', 'ASC')
      .getMany();

    return {
      students,
      sessions,
    };
  }

  formatTimeDisplay24Hours(hour: number, min: number) {
    const hourDisplay = hour < 10 ? `0${hour}` : `${hour}`;

    const minDisplay = min < 10 ? `0${min}` : `${min}`;

    return `${hourDisplay}:${minDisplay}`;
  }

  async exportCourseAttendanceHistory(teacherId: number, courseId: number) {
    const { students, sessions } = await this.getCourseAttendanceHistory(
      teacherId,
      courseId,
    );

    const attendanceStatus = await this.attendanceStatusRepository.find();

    const data = students.map((student) => {
      const _record: { [prop: string]: string } = {
        'Student ID': student.student_code,
        Name: student.last_name + ' ' + student.first_name,
        Email: student.email,
      };

      const overviewStatus: string[] = [];
      attendanceStatus.forEach((status) => {
        const count = sessions.filter((session) =>
          session.attendanceResults?.find(
            (result) =>
              result.t_student_id === student.id &&
              result.m_attendance_status_id === status.id,
          ),
        ).length;

        overviewStatus.push(`${status.acronym}:${count}`);
      });
      _record['Overview'] = overviewStatus.join(' ');

      sessions.forEach((session) => {
        _record[
          `${format(
            new Date(session.session_date),
            'dd MMM yyyy',
          )} ${this.formatTimeDisplay24Hours(
            session.start_hour,
            session.start_min,
          )}~${this.formatTimeDisplay24Hours(
            session.end_hour,
            session.end_min,
          )}`
        ] =
          session.attendanceResults?.find(
            (result) => result.t_student_id === student.id,
          )?.attendanceStatus?.acronym ?? '...';
      });

      return _record;
    });

    return stringify(data, { header: true });
  }

  async getAttendanceSessionData(
    teacherId: number,
    courseId: number,
    sessionId: number,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, t_teacher_id: teacherId },
    });

    if (!course) throw new BadRequestException('Course does not exist.');

    const session = await this.attendanceSessionRepository.findOne({
      where: { id: sessionId, t_course_id: course.id },
    });

    if (!session) throw new BadRequestException('Session does not exist.');

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
    if (!course) throw new BadRequestException('Course does not exist.');

    const session = await this.attendanceSessionRepository.findOne({
      where: { id: sessionId, t_course_id: course.id },
    });
    if (!session) throw new BadRequestException('Session does not exist.');

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(AttendanceResultEntity, {
        t_attendance_session_id: session.id,
      });

      await manager.delete(AttendanceSessionEntity, { id: session.id });

      if (
        this.schedulerRegistry.doesExist(
          'cron',
          `NOTICE_SESSION_START:${session.id}`,
        )
      )
        this.schedulerRegistry.deleteCronJob(
          `NOTICE_SESSION_START:${session.id}`,
        );

      if (
        this.schedulerRegistry.doesExist(
          'cron',
          `NOTICE_SESSION_END:${session.id}`,
        )
      )
        this.schedulerRegistry.deleteCronJob(
          `NOTICE_SESSION_END:${session.id}`,
        );
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

  async getAttendanceSessionQrCodeData(
    teacherId: number,
    courseId: number,
    sessionId: number,
  ) {
    const course = await this.getCourseData(teacherId, courseId);

    const session = await this.getAttendanceSessionData(
      teacherId,
      courseId,
      sessionId,
    );

    const token = await this.jwtService.signAsync(
      {
        courseId: session.t_course_id,
        sessionId: session.id,
        sub: teacherId,
      } as JwtQrCodePayload,
      {
        secret: 'QR_SECRET_KEY',
        expiresIn: `${course.rotate_qrcode_interval_seconds}s`,
      },
    );

    return token;
  }

  async bulkUpdateAttendanceSessionResult(
    teacherId: number,
    courseId: number,
    sessionId: number,
    listToUpdate: { studentId: number; statusId: number }[],
  ) {
    const session = await this.getAttendanceSessionData(
      teacherId,
      courseId,
      sessionId,
    );

    if (listToUpdate.length > 0) {
      await this.dataSource.transaction(async (manager) => {
        for (const { studentId, statusId } of listToUpdate) {
          const existResult = await manager.findOne(AttendanceResultEntity, {
            where: {
              t_student_id: studentId,
              t_attendance_session_id: session.id,
            },
          });

          if (!existResult)
            await manager.insert(AttendanceResultEntity, {
              t_student_id: studentId,
              t_attendance_session_id: session.id,
              m_attendance_status_id: statusId,
              record_time: () => 'NOW()',
              record_by_teacher: 1,
            });
          else if (existResult.m_attendance_status_id !== statusId)
            await manager.update(
              AttendanceResultEntity,
              { t_student_id: studentId, t_attendance_session_id: session.id },
              {
                m_attendance_status_id: statusId,
                record_time: () => 'NOW()',
                record_by_teacher: 1,
                ip_address: () => 'NULL',
              },
            );
          else continue;
        }
      });
    }

    return true;
  }
}
