import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', true);
  app.enableCors({
    origin: [
      'https://sysadmin.aeit.club',
      'https://teacher.aeit.club',
      'https://student.aeit.club',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
  });
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  await app.listen(parseInt(configService.get('APP_PORT') ?? '3000'));
}
bootstrap();
