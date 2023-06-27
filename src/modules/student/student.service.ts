import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from 'src/db/entities/student.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dto/create-student.dto';

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
}
