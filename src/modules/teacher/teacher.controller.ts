import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtTeacherPayload } from 'src/types/auth.type';
import { TeacherAuthGuard } from '../auth/teacher-auth.guard';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { DayOfWeek } from 'src/types/common.type';
import { Response } from 'express';

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('get-info')
  @UseGuards(TeacherAuthGuard)
  async getTeacherInfo(@Req() req: any) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    const { password, ...result } = await this.teacherService.getOneById(id);
    return result;
  }

  @Patch('update-info')
  @UseGuards(TeacherAuthGuard)
  updateTeacherInfo(
    @Req() req: any,
    @Body('first_name') first_name?: string,
    @Body('last_name') last_name?: string,
    @Body('phone_number') phone_number?: string,
    @Body('description') description?: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.updateTeacherInfo(
      id,
      first_name,
      last_name,
      phone_number,
      description,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @UseGuards(TeacherAuthGuard)
  changePassword(
    @Req() req: any,
    @Body('curPass') curPass: string,
    @Body('newPass') newPass: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.changePassword(id, curPass, newPass);
  }

  @Post('create-new')
  createNewTeacher(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.createNewTeacher(createTeacherDto);
  }

  @Get('month-sessions')
  @UseGuards(TeacherAuthGuard)
  getMonthSession(@Req() req: any, @Query('yearMonth') yearMonth: string) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];

    return this.teacherService.getMonthSessions(id, yearMonth);
  }

  @Get('course')
  @UseGuards(TeacherAuthGuard)
  getListCourse(@Req() req: any, @Query('search') search?: string) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getListCourse(id, search);
  }

  @Get('course/:courseId')
  @UseGuards(TeacherAuthGuard)
  getCourseData(@Req() req: any, @Param('courseId') courseId: string) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getCourseData(id, parseInt(courseId));
  }

  @Patch('course/:courseId')
  @UseGuards(TeacherAuthGuard)
  updateCourse(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body('description') description?: string,
    @Body('rotate_qrcode_interval_seconds')
    rotate_qrcode_interval_seconds?: number,
    @Body('prevent_student_use_same_address')
    prevent_student_use_same_address?: number,
    @Body('attendance_rate') attendance_rate?: number,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.updateCourse(
      id,
      parseInt(courseId),
      description,
      rotate_qrcode_interval_seconds,
      prevent_student_use_same_address,
      attendance_rate,
    );
  }

  @Get('course/:courseId/student')
  @UseGuards(TeacherAuthGuard)
  getListOfCourseStudents(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Query('search') search?: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getListOfCourseStudents(
      id,
      parseInt(courseId),
      search,
    );
  }

  @Get('today-schedule')
  @UseGuards(TeacherAuthGuard)
  getTodayListCourse(
    @Req() req: any,
    @Query('today') today: string,
    @Query('dayOfWeek') dayOfWeek: DayOfWeek,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getTodaySchedule(id, today, dayOfWeek);
  }

  @Post('course/:courseId/add-session')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  addAttendanceSession(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() createAttendanceSessionDto: CreateAttendanceSessionDto,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.addAttendanceSession(
      id,
      parseInt(courseId),
      createAttendanceSessionDto,
    );
  }

  @Post('course/:courseId/add-multi-session')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  addMultiAttendanceSession(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body('listSessionToCreate')
    listSessionToCreate: CreateAttendanceSessionDto[],
    // @Body('officialTime') officialTime: number,
    // @Body('overtime') overtime: number,
    // @Body('description') description: number,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.addMultiAttendanceSession(
      id,
      parseInt(courseId),
      listSessionToCreate,
      // officialTime,
      // overtime,
      // description,
    );
  }

  @Get('course/:courseId/session')
  @UseGuards(TeacherAuthGuard)
  getListOfCourseAttendanceSession(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getListOfCourseAttendanceSession(
      id,
      parseInt(courseId),
      from,
      to,
    );
  }

  @Get('course/:courseId/attendance-history')
  @UseGuards(TeacherAuthGuard)
  getCourseAttendanceHistory(
    @Req() req: any,
    @Param('courseId') courseId: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getCourseAttendanceHistory(
      id,
      parseInt(courseId),
    );
  }

  @Get('course/:courseId/export-history')
  @UseGuards(TeacherAuthGuard)
  async exportCourseAttendanceHistory(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Param('courseId') courseId: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    const stringifier = await this.teacherService.exportCourseAttendanceHistory(
      id,
      parseInt(courseId),
    );
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sample.csv"',
    });
    return new StreamableFile(stringifier);
  }

  @Get('course/:courseId/session/:sessionId')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  getAttendanceSessionData(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
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
    const { id }: JwtTeacherPayload = req['teacher-payload'];
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
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getAttendanceSessionResult(
      id,
      parseInt(courseId),
      parseInt(sessionId),
    );
  }

  @Get('course/:courseId/session/:sessionId/qr-code')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  getAttendanceSessionQrCodeData(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.getAttendanceSessionQrCodeData(
      id,
      parseInt(courseId),
      parseInt(sessionId),
    );
  }

  @Put('course/:courseId/session/:sessionId/bulk-update-status')
  @UseGuards(TeacherAuthGuard)
  @HttpCode(HttpStatus.OK)
  bulkUpdateAttendanceSessionResult(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
    @Body('listToUpdate')
    listToUpdate: { studentId: number; statusId: number }[],
  ) {
    const { id }: JwtTeacherPayload = req['teacher-payload'];
    return this.teacherService.bulkUpdateAttendanceSessionResult(
      id,
      parseInt(courseId),
      parseInt(sessionId),
      listToUpdate,
    );
  }
}
