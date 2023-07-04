import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('department')
  getListOfDepartments() {
    return this.appService.getListOfDepartments();
  }

  @Get('subject')
  getListOfSubjects() {
    return this.appService.getListOfSubjects();
  }

  @Get('attendance-status')
  getListOfAttendanceStatus() {
    return this.appService.getListOfAttendanceStatus();
  }
}
