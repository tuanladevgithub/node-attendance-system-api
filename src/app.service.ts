import { Injectable } from '@nestjs/common';
import { DepartmentEntity } from './db/entities/department.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SubjectEntity } from './db/entities/subject.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,

    @InjectRepository(SubjectEntity)
    private readonly subjectRepository: Repository<SubjectEntity>,
  ) {}

  getListOfDepartments() {
    return this.departmentRepository.find();
  }

  getListOfSubjects() {
    return this.subjectRepository.find();
  }
}
