import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from 'src/db/entities/student.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
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

  // async createNewTeacher(createTeacherDto: CreateTeacherDto) {
  //   const existsAccount = await this.studentRepository.findOne({
  //     where: { email: createTeacherDto.email },
  //   });
  //   if (existsAccount) throw new BadRequestException('Email already exists.');

  //   const currentNewestTeacher = await this.studentRepository
  //     .createQueryBuilder('teacher')
  //     .select('MAX(teacher.teacher_code) as maxTeacherCode')
  //     .getRawOne();

  //   const genPassword = createTeacherDto.password || this.genRandomPassword();
  //   const hashPassword = await bcrypt.hash(genPassword, 12);

  //   const newTeacher = await this.studentRepository.save(
  //     this.studentRepository.create({
  //       m_department_id: createTeacherDto.m_department_id,
  //       teacher_code:
  //         !currentNewestTeacher || !currentNewestTeacher.maxTeacherCode
  //           ? '20230001'
  //           : parseInt(currentNewestTeacher.maxTeacherCode) + 1 + '',
  //       email: createTeacherDto.email,
  //       password: hashPassword,
  //       last_name: createTeacherDto.last_name,
  //       first_name: createTeacherDto.first_name,
  //       phone_number: createTeacherDto.phone_number,
  //       description: createTeacherDto.description,
  //     }),
  //   );

  //   // send mail:

  //   return newTeacher;
  // }
}
