import {
  Body,
  Controller,
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
  @Post('create-student')
  @UseGuards(AdminAuthGuard)
  createNewStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.adminService.createNewStudent(createStudentDto);
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
  @Post('create-course')
  @UseGuards(AdminAuthGuard)
  createNewCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.adminService.createNewCourse(createCourseDto);
  }
}
