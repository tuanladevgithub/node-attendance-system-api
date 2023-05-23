import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtPayload } from 'src/types/auth.type';
import { TeacherAuthGuard } from '../auth/teacher-auth.guard';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { ReturnDocument } from 'typeorm';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';

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

  @Get('course')
  @UseGuards(TeacherAuthGuard)
  getListCourse(@Req() req: any, @Query('search') search?: string) {
    const { id }: JwtPayload = req['teacher-payload'];
    return this.teacherService.getListCourse(id, search);
  }

  @Get('course/:courseId')
  @UseGuards(TeacherAuthGuard)
  getCourseData(@Req() req: any, @Param('courseId') courseId: string) {
    const { id }: JwtPayload = req['teacher-payload'];
    return this.teacherService.getCourseData(id, parseInt(courseId));
  }

  @Post('course/:courseId/add-session')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  addAttendanceSession(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() createAttendanceSessionDto: CreateAttendanceSessionDto,
  ) {
    const { id }: JwtPayload = req['teacher-payload'];
    return this.teacherService.addAttendanceSession(
      id,
      parseInt(courseId),
      createAttendanceSessionDto,
    );
  }
}
