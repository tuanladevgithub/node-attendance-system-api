import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,

    @InjectRepository(SubjectEntity)
    private readonly subjectRepository: Repository<SubjectEntity>,

    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,
  ) {}

  async createNewCourse(createCourseDto: CreateCourseDto) {
    const subject = await this.subjectRepository.findOneOrFail({
      where: { id: createCourseDto.m_subject_id },
    });

    const teacher = await this.teacherRepository.findOneOrFail({
      where: [
        { teacher_code: createCourseDto.teacher_code_or_email },
        { email: createCourseDto.teacher_code_or_email },
      ],
    });

    const currentNewestCourse = await this.courseRepository
      .createQueryBuilder('course')
      .select('MAX(course.course_code) as maxCourseCode')
      .getRawOne();

    const newCourse = await this.courseRepository.save(
      this.courseRepository.create({
        m_subject_id: subject.id,
        t_teacher_id: teacher.id,
        course_code:
          !currentNewestCourse || !currentNewestCourse.maxCourseCode
            ? '100001'
            : parseInt(currentNewestCourse.maxCourseCode) + 1 + '',
        start_date: createCourseDto.start_date,
        end_date: createCourseDto.end_date,
        description: createCourseDto.description,
      }),
    );

    // send mail:

    return newCourse;
  }
}
