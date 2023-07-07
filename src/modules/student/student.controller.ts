import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtStudentPayload } from 'src/types/auth.type';
import { StudentAuthGuard } from '../auth/student-auth.guard';
import { Request } from 'express';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Get('get-info')
  @UseGuards(StudentAuthGuard)
  async getStudentInfo(@Req() req: any) {
    const { id }: JwtStudentPayload = req['student-payload'];
    const { password, ...result } = await this.studentService.getOneById(id);
    return result;
  }

  @Get('course')
  @UseGuards(StudentAuthGuard)
  getListCourse(@Req() req: any) {
    const { id }: JwtStudentPayload = req['student-payload'];
    return this.studentService.getListCourse(id);
  }

  @Get('course/:courseId')
  @UseGuards(StudentAuthGuard)
  getCourseData(@Req() req: any, @Param('courseId') courseId: string) {
    const { id }: JwtStudentPayload = req['student-payload'];
    return this.studentService.getCourseData(id, parseInt(courseId));
  }

  @Get('schedule')
  @UseGuards(StudentAuthGuard)
  getListSchedule(@Req() req: any) {
    const { id }: JwtStudentPayload = req['student-payload'];
    return this.studentService.getListSchedule(id);
  }

  @Get('course/:courseId/session')
  @UseGuards(StudentAuthGuard)
  getListOfCourseAttendanceSession(
    @Req() req: any,
    @Param('courseId') courseId: string,
  ) {
    const { id }: JwtStudentPayload = req['student-payload'];
    return this.studentService.getListOfCourseAttendanceSession(
      id,
      parseInt(courseId),
    );
  }

  @Get('course/:courseId/session/:sessionId')
  @UseGuards(StudentAuthGuard)
  getAttendanceSessionData(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const { id }: JwtStudentPayload = req['student-payload'];
    return this.studentService.getAttendanceSessionData(
      id,
      parseInt(courseId),
      parseInt(sessionId),
    );
  }

  @Get('course/:courseId/session/:sessionId/result')
  @UseGuards(StudentAuthGuard)
  getSessionResultForStudent(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const { id }: JwtStudentPayload = req['student-payload'];
    return this.studentService.getSessionResultForStudent(
      id,
      parseInt(courseId),
      parseInt(sessionId),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('record-attendance-session')
  @UseGuards(StudentAuthGuard)
  async recordAttendanceSession(
    @Req() req: Request & { 'student-payload': JwtStudentPayload },
  ) {
    const { id }: JwtStudentPayload = req['student-payload'];
    const qrToken = req.headers['qr-token'] as string;

    const result = await this.studentService.recordAttendanceSession(
      id,
      qrToken,
      req.ip,
    );

    if (result) this.realtimeGateway.pushNotificationStudentTakeRecord(result);

    return result;
  }
}
