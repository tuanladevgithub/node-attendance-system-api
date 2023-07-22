import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class CronjobService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private readonly mailerService: MailerService,
  ) {}

  testCron() {
    const timeout = setTimeout(() => {
      console.log('test timeout job');
    }, 1000 * 60 * 5);
    this.schedulerRegistry.addTimeout('test-timeout-job', timeout);

    // this.schedulerRegistry.getTimeout('test-timeout-job');
  }

  addCronjob(jobName: string) {
    const job = new CronJob(new Date('2023-07-22 09:35:00'), async () => {
      console.log('run on: ', new Date());
      await this.mailerService.testSendMail();
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
  }
}
