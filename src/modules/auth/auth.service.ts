import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TeacherService } from '../teacher/teacher.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly teacherService: TeacherService,
  ) {}

  async loginTeacher(email: string, pass: string) {
    const teacher = await this.teacherService.getOneByEmail(email);

    if (!teacher) throw new BadRequestException('Account not found.');

    if (teacher.password !== pass) throw new UnauthorizedException();

    const accessToken = await this.jwtService.signAsync({
      id: teacher.id,
      email: teacher.email,
      sub: teacher.id,
    });

    return { accessToken };
  }
}
