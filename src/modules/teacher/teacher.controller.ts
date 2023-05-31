import {
  Body,
  Controller,
  Delete,
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

  @Get('current-month-sessions')
  @UseGuards(TeacherAuthGuard)
  getCurrentMonthSession(
    @Req() req: any,
    @Query('currentYearMonth') currentYearMonth: string,
  ) {
    const { id }: JwtPayload = req['teacher-payload'];

    return this.teacherService.getCurrentMonthSessions(id, currentYearMonth);
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

  @Get('course/:courseId/session/:sessionId')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  getAttendanceSessionData(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const { id }: JwtPayload = req['teacher-payload'];
    return this.teacherService.getAttendanceSessionData(
      id,
      parseInt(courseId),
      parseInt(sessionId),
    );
  }

  @Delete('course/:courseId/session/:sessionId')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteAttendanceSession(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const { id }: JwtPayload = req['teacher-payload'];
    return this.teacherService.deleteAttendanceSession(
      id,
      parseInt(courseId),
      parseInt(sessionId),
    );
  }

  @Get('course/:courseId/session/:sessionId/result')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  getAttendanceSessionResult(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const { id }: JwtPayload = req['teacher-payload'];
    return this.teacherService.getAttendanceSessionResult(
      id,
      parseInt(courseId),
      parseInt(sessionId),
    );
  }
}
