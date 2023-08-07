import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { JwtAdminPayload } from 'src/types/auth.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserGender } from 'src/types/common.type';
import { UpdateTeacherInfoDto } from './dto/update-teacher-info.dto';
import { CreateTeacherDto } from '../teacher/dto/create-teacher.dto';
import { CreateStudentDto } from '../student/dto/create-student.dto';
import { CreateCourseDto } from '../course/dto/create-course.dto';
import { UpdateStudentInfoDto } from './dto/update-student-info.dto';
import { Response } from 'express';
import * as path from 'path';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('get-info')
  @UseGuards(AdminAuthGuard)
  async getAdminInfo(@Req() req: any) {
    const { id }: JwtAdminPayload = req['admin-payload'];
    const { password, ...result } = await this.adminService.getOneById(id);
    return result;
  }

  @Get('search-teacher')
  @UseGuards(AdminAuthGuard)
  getListOfTeachers(
    @Query('departmentId') departmentId?: number,
    @Query('searchText') searchText?: string,
  ) {
    return this.adminService.getListOfTeachers(departmentId, searchText);
  }

  @HttpCode(HttpStatus.OK)
  @Post('upload-teacher-csv')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  importTeachersFromCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.adminService.importTeachersFromCsv(file);
  }

  @HttpCode(HttpStatus.OK)
  @Get('teacher-data-csv-sample')
  getTeacherDataCsvSample(@Res() res: Response) {
    res.sendFile(
      path.join(__dirname, '../../../src/files_test/teacher-data-sample.csv'),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('create-teacher')
  @UseGuards(AdminAuthGuard)
  createNewTeacher(@Body() createTeacherDto: CreateTeacherDto) {
    return this.adminService.createNewTeacher(createTeacherDto);
  }

  @Get('get-teacher-info/:teacherId')
  @UseGuards(AdminAuthGuard)
  getTeacherInfo(@Param('teacherId') teacherId: number) {
    return this.adminService.getTeacherInfo(teacherId);
  }

  @Patch('update-teacher-info/:teacherId')
  @UseGuards(AdminAuthGuard)
  updateTeacherInfo(
    @Param('teacherId') teacherId: number,
    @Body() updateTeacherInfoDto: UpdateTeacherInfoDto,
  ) {
    return this.adminService.updateTeacherInfo(teacherId, updateTeacherInfoDto);
  }

  @Get('get-teacher-course/:teacherId')
  @UseGuards(AdminAuthGuard)
  getTeacherCourse(@Param('teacherId') teacherId: number) {
    return this.adminService.getTeacherCourse(teacherId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password-teacher/:teacherId')
  @UseGuards(AdminAuthGuard)
  changeTeacherPassword(
    @Param('teacherId') teacherId: number,
    @Body('newPass') newPass: string,
  ) {
    return this.adminService.changeTeacherPassword(teacherId, newPass);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('delete-teacher/:teacherId')
  @UseGuards(AdminAuthGuard)
  deleteTeacher(@Param('teacherId') teacherId: number) {
    return this.adminService.deleteTeacher(teacherId);
  }

  @Get('search-student')
  @UseGuards(AdminAuthGuard)
  getListOfStudents(
    @Query('gender') gender?: UserGender,
    @Query('searchText') searchText?: string,
  ) {
    return this.adminService.getListOfStudents(gender, searchText);
  }

  @HttpCode(HttpStatus.OK)
  @Post('upload-student-csv')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  importStudentsFromCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.adminService.importStudentsFromCsv(file);
  }

  @HttpCode(HttpStatus.OK)
  @Get('student-data-csv-sample')
  getStudentDataCsvSample(@Res() res: Response) {
    res.sendFile(
      path.join(__dirname, '../../../src/files_test/student-data-sample.csv'),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('create-student')
  @UseGuards(AdminAuthGuard)
  createNewStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.adminService.createNewStudent(createStudentDto);
  }

  @Get('get-student-info/:studentId')
  @UseGuards(AdminAuthGuard)
  getStudentInfo(@Param('studentId') studentId: number) {
    return this.adminService.getStudentInfo(studentId);
  }

  @Patch('update-student-info/:studentId')
  @UseGuards(AdminAuthGuard)
  updateStudentInfo(
    @Param('studentId') studentId: number,
    @Body() updateStudentInfoDto: UpdateStudentInfoDto,
  ) {
    return this.adminService.updateStudentInfo(studentId, updateStudentInfoDto);
  }

  @Get('get-student-course/:studentId')
  @UseGuards(AdminAuthGuard)
  getStudentCourse(@Param('studentId') studentId: number) {
    return this.adminService.getStudentCourse(studentId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password-student/:studentId')
  @UseGuards(AdminAuthGuard)
  changeStudentPassword(
    @Param('studentId') studentId: number,
    @Body('newPass') newPass: string,
  ) {
    return this.adminService.changeStudentPassword(studentId, newPass);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('delete-student/:studentId')
  @UseGuards(AdminAuthGuard)
  deleteStudent(@Param('studentId') studentId: number) {
    return this.adminService.deleteStudent(studentId);
  }

  @Get('search-course')
  @UseGuards(AdminAuthGuard)
  getListOfCourses(
    @Query('subjectId') subjectId?: number,
    @Query('searchText') searchText?: string,
  ) {
    return this.adminService.getListOfCourses(subjectId, searchText);
  }

  @Get('course/:courseId')
  @UseGuards(AdminAuthGuard)
  getCourseData(@Param('courseId') courseId: number) {
    return this.adminService.getCourseData(courseId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('course/:courseId')
  @UseGuards(AdminAuthGuard)
  updateCourseData(
    @Param('courseId') courseId: number,
    @Body()
    data: {
      m_subject_id: number;
      course_code: string;
      start_date: string;
      end_date: string;
      description?: string;
    },
  ) {
    return this.adminService.updateCourseData(courseId, data);
  }

  @HttpCode(HttpStatus.OK)
  @Post('course/:courseId/add-schedule')
  @UseGuards(AdminAuthGuard)
  addCourseSchedule(
    @Param('courseId') courseId: number,
    @Body()
    data: {
      day_of_week: number;
      start_hour: number;
      start_min: number;
      end_hour: number;
      end_min: number;
    },
  ) {
    return this.adminService.addCourseSchedule(courseId, data);
  }

  @HttpCode(HttpStatus.OK)
  @Post('course/:courseId/delete-schedule')
  @UseGuards(AdminAuthGuard)
  deleteSchedule(
    @Param('courseId') courseId: number,
    @Body()
    data: {
      scheduleId: number;
    },
  ) {
    return this.adminService.deleteSchedule(courseId, data);
  }

  @HttpCode(HttpStatus.OK)
  @Get('course/:courseId/student')
  @UseGuards(AdminAuthGuard)
  getListStudentOfCourse(
    @Param('courseId') courseId: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getListStudentOfCourse(courseId, search);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('course/:courseId/student/:studentId')
  @UseGuards(AdminAuthGuard)
  deleteStudentFromCourse(
    @Param('courseId') courseId: number,
    @Param('studentId') studentId: number,
  ) {
    return this.adminService.deleteStudentFromCourse(courseId, studentId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('course/:courseId/add-student')
  @UseGuards(AdminAuthGuard)
  addStudentToCourse(
    @Param('courseId') courseId: number,
    @Body('studentCodeOrEmail') studentCodeOrEmail: string,
  ) {
    return this.adminService.addStudentToCourse(courseId, studentCodeOrEmail);
  }

  @HttpCode(HttpStatus.OK)
  @Post('upload-subject-csv')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  importSubjectsFromCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.adminService.importSubjectsFromCsv(file);
  }

  @HttpCode(HttpStatus.OK)
  @Post('upload-course-csv')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  importCoursesFromCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.adminService.importCoursesFromCsv(file);
  }

  @HttpCode(HttpStatus.OK)
  @Post('upload-course-schedule-csv')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  importCourseSchedulesFromCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.adminService.importCourseSchedulesFromCsv(file);
  }

  @HttpCode(HttpStatus.OK)
  @Post('upload-course-participation-csv')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  importCourseParticipationFromCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.adminService.importCourseParticipationFromCsv(file);
  }

  @HttpCode(HttpStatus.OK)
  @Get('course-data-csv-sample')
  getCourseDataCsvSample(@Res() res: Response, @Query('type') type: string) {
    res.sendFile(
      path.join(__dirname, `../../../src/files_test/${type}-data-sample.csv`),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('create-course')
  @UseGuards(AdminAuthGuard)
  createNewCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.adminService.createNewCourse(createCourseDto);
  }
}
