import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/db/entities/admin.entity';
import { DepartmentEntity } from 'src/db/entities/department.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { Brackets, Repository } from 'typeorm';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepository: Repository<AdminEntity>,

    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,
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

    const records: {
      m_department_id: number;
      teacher_code?: string;
      email: string;
      last_name: string;
      first_name: string;
      phone_number?: string;
    }[] = [];

    for await (const _record of parseCsv) {
      const record = _record as {
        m_department_id: number;
        teacher_code?: string;
        email: string;
        last_name: string;
        first_name: string;
        phone_number?: string;
      };
      records.push(record);
    }

    await this.teacherRepository.insert(
      records.map((record) => ({ ...record, password: 'TODO' })),
    );

    return true;
  }
}
