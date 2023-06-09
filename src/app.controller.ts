import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// import * as QRCode from 'qrcode';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get('get-qrcode')
  // async getQRCode() {
  //   const qrString = await QRCode.toString('test');
  //   console.log(qrString);
  //   const qrURI = await QRCode.toDataURL(
  //     'http://link-to-attendance.vn/aaa-bbb-ccc',
  //   );

  //   return `<image src= " ` + qrURI + `" />`;
  // }

  @Get('department')
  getListOfDepartments() {
    return this.appService.getListOfDepartments();
  }
}
