import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtStudentPayload } from 'src/types/auth.type';
import { StudentAuthGuard } from '../auth/student-auth.guard';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('get-info')
  @UseGuards(StudentAuthGuard)
  async getStudentInfo(@Req() req: any) {
    const { id }: JwtStudentPayload = req['student-payload'];
    const { password, ...result } = await this.studentService.getOneById(id);
    return result;
  }
}
