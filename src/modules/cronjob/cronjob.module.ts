import { Global, Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';
import { CronjobController } from './cronjob.controller';

@Global()
@Module({
  controllers: [CronjobController],
  providers: [CronjobService],
  exports: [CronjobService],
})
export class CronjobModule {}
