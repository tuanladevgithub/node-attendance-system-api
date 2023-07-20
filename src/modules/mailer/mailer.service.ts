import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport(
      {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        auth: {
          user: process.env.SMTP_AUTH_USER,
          pass: process.env.SMTP_AUTH_PASS,
        },
        secure: false,
      },
      {
        from: {
          name: 'HUST Attendance',
          address: process.env.SENDER_EMAIL ?? 'noreply@test.com',
        },
      },
    );
  }

  private checkTransporter() {
    return this.transporter.verify();
  }

  testSendMail() {
    return this.transporter.sendMail({
      to: 'hust.cn201@gmail.com',
      subject: 'test subject',
      text: 'test mail',
    });
  }

  async sendMail(emails: string | string[], subject: string, content: string) {
    if (await this.checkTransporter()) {
      return await this.transporter.sendMail({
        to: emails,
        subject,
        text: content,
      });
    }
  }
}
