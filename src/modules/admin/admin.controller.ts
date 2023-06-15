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

  @Get('search-course')
  @UseGuards(AdminAuthGuard)
  getListOfCourses(
    @Query('subjectId') subjectId?: number,
    @Query('searchText') searchText?: string,
  ) {
    return this.adminService.getListOfCourses(subjectId, searchText);
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
}
