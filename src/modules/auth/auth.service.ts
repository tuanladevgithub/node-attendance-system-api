import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TeacherService } from '../teacher/teacher.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { JwtStudentPayload, JwtTeacherPayload } from 'src/types/auth.type';
import { StudentService } from '../student/student.service';
import * as crypto from 'crypto';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,

    private mailerService: MailerService,

    private readonly adminService: AdminService,

    private readonly teacherService: TeacherService,

    private readonly studentService: StudentService,
  ) {}

  async loginStudent(email: string, pass: string) {
    const student = await this.studentService.getOneByEmail(email);

    if (!student) throw new BadRequestException('Account not found.');

    if (!(await bcrypt.compare(pass, student.password)))
      throw new BadRequestException('Wrong password.');

    const accessToken = await this.jwtService.signAsync({
      id: student.id,
      email: student.email,
      sub: student.id,
    } as JwtStudentPayload);

    return { accessToken };
  }

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

  async sendResetCodeTeacher(email: string) {
    const teacher = await this.teacherService.getOneByEmail(email);

    if (teacher) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      try {
        await this.teacherService.updatePasswordResetCode(
          teacher.id,
          passwordResetToken,
          new Date(Date.now() + 3 * 60 * 1000),
        );

        await this.mailerService.sendMail(
          email,
          'Reset password request',
          `Hi ${teacher.first_name},\nPlease follow the link bellow to reset your password:\n${process.env.TEACHER_SITE_DOMAIN}/reset-password/${passwordResetToken}\nIf you didn't forget your password. please ignore this email.\n Thank you!`,
        );
      } catch (error) {
        await this.teacherService.updatePasswordResetCode(
          teacher.id,
          null,
          null,
        );

        throw new InternalServerErrorException(
          'There was an error sending email.',
        );
      }
    }
  }

  resetPasswordTeacher(resetCode: string, newPassword: string) {
    return this.teacherService.resetPassword(resetCode, newPassword);
  }

  async sendResetCodeStudent(email: string) {
    const student = await this.studentService.getOneByEmail(email);

    if (student) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      try {
        await this.studentService.updatePasswordResetCode(
          student.id,
          passwordResetToken,
          new Date(Date.now() + 3 * 60 * 1000),
        );

        await this.mailerService.sendMail(
          email,
          'Reset password request',
          `Hi ${student.first_name},\nPlease follow the link bellow to reset your password:\n${process.env.STUDENT_SITE_DOMAIN}/reset-password/${passwordResetToken}\nIf you didn't forget your password. please ignore this email.\n Thank you!`,
        );
      } catch (error) {
        await this.studentService.updatePasswordResetCode(
          student.id,
          null,
          null,
        );

        throw new InternalServerErrorException(
          'There was an error sending email.',
        );
      }
    }
  }

  resetPasswordStudent(resetCode: string, newPassword: string) {
    return this.studentService.resetPassword(resetCode, newPassword);
  }
}
