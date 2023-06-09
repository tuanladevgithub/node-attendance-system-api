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

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepository: Repository<AdminEntity>,

    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,

    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
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
        teachers.findIndex((teacher) => teacher.teacher_code === teacher_code)
      )
        recordErrors.push(`teacher_code "${teacher_code}" is exist`);

      // check email:
      const email = _record['email'];
      if (!email) recordErrors.push('email is missing');
      if (email && records.findIndex((record) => record.email === email) !== -1)
        recordErrors.push(`duplicate email in file`);
      if (email && !isEmail(email)) recordErrors.push(`invalid email`);
      if (email && teachers.findIndex((teacher) => teacher.email === email))
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
}
