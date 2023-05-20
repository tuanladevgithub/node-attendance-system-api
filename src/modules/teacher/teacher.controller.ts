import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtPayload } from 'src/types/auth.type';
import { TeacherAuthGuard } from '../auth/teacherAuth.guard';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('get-info')
  @UseGuards(TeacherAuthGuard)
  async getTeacherInfo(@Req() req: any) {
    const { id }: JwtPayload = req['teacher-payload'];
    const { password, ...result } = await this.teacherService.getOneById(id);
    return result;
  }

  @Post('create-new')
  createNewTeacher(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.createNewTeacher(createTeacherDto);
  }
}
