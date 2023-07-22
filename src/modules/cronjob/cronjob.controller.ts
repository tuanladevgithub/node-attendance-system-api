import { Controller, Get } from '@nestjs/common';
import { CronjobService } from './cronjob.service';

@Controller('cronjob')
export class CronjobController {
  constructor(private readonly cronjobService: CronjobService) {}

  @Get('test')
  testCron() {
    this.cronjobService.addCronjob('sdjfkadsj');
    return 'done';
  }
}
