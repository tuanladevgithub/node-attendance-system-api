import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { JwtAdminPayload } from 'src/types/auth.type';

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
}
