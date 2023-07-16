import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import * as DeviceDetector from 'node-device-detector';
import * as ClientHints from 'node-device-detector/client-hints';

@Controller()
export class AppController {
  private deviceDetector;

  constructor(private readonly appService: AppService) {
    //@ts-ignore
    this.deviceDetector = new DeviceDetector({
      clientIndexes: true,
      deviceIndexes: true,
      deviceAliasCode: false,
    });
  }

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

  @Get('device')
  getClientDeviceInfo(@Req() req: Request) {
    //@ts-ignore
    const clientHints = new ClientHints();
    const clientHintData = clientHints.parse(req.headers);

    return {
      noHint: this.deviceDetector.detect(req.headers['user-agent'] ?? ''),

      withHint: this.deviceDetector.detect(
        req.headers['user-agent'] ?? '',
        clientHintData,
      ),
    };
  }
}
