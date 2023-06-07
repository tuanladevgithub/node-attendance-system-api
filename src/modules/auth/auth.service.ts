import { BadRequestException, Injectable } from '@nestjs/common';
import { TeacherService } from '../teacher/teacher.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { JwtTeacherPayload } from 'src/types/auth.type';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly teacherService: TeacherService,
    private readonly adminService: AdminService,
  ) {}

  async loginTeacher(email: string, pass: string) {
    const teacher = await this.teacherService.getOneByEmail(email);

    if (!teacher) throw new BadRequestException('Account not found.');

    if (!(await bcrypt.compare(pass, teacher.password)))
      throw new BadRequestException('Wrong password.');

    const accessToken = await this.jwtService.signAsync({
      id: teacher.id,
      email: teacher.email,
      sub: teacher.id,
    } as JwtTeacherPayload);

    return { accessToken };
  }

  async loginAdmin(username: string, pass: string) {
    const admin = await this.adminService.getOneByUsername(username);

    if (!admin) throw new BadRequestException('Account not found.');

    if (!(await bcrypt.compare(pass, admin.password)))
      throw new BadRequestException('Wrong password.');

    const accessToken = await this.jwtService.signAsync({
      id: admin.id,
      username: admin.username,
      sub: admin.id,
    });

    return { accessToken };
  }
}
