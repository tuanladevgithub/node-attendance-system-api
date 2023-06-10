import {
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
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

  @Get('search-student')
  @UseGuards(AdminAuthGuard)
  getListOfStudents(
    @Query('gender') gender?: UserGender,
    @Query('searchText') searchText?: string,
  ) {
    return this.adminService.getListOfStudents(gender, searchText);
  }
}
