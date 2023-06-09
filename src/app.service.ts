import { Injectable } from '@nestjs/common';
import { DepartmentEntity } from './db/entities/department.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  getListOfDepartments() {
    return this.departmentRepository.find();
  }
}
