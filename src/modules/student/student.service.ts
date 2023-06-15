import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from 'src/db/entities/student.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class StudentService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(StudentEntity)
    private readonly teacherRepository: Repository<StudentEntity>,
  ) {}
}
