import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './db/typeorm-config';
import { TeacherModule } from './modules/teacher/teacher.module';
import { AuthModule } from './modules/auth/auth.module';
import { CourseModule } from './modules/course/course.module';
import { AdminModule } from './modules/admin/admin.module';
import { DepartmentEntity } from './db/entities/department.entity';
import { SubjectEntity } from './db/entities/subject.entity';
import { StudentModule } from './modules/student/student.module';
import { AttendanceStatusEntity } from './db/entities/attendance-status.entity';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { RedisCacheModule } from './modules/redis_cache/redis_cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions,
    }),
    TypeOrmModule.forFeature([
      DepartmentEntity,
      SubjectEntity,
      AttendanceStatusEntity,
    ]),
    AuthModule,
    TeacherModule,
    CourseModule,
    AdminModule,
    StudentModule,
    RealtimeModule,
    MailerModule,
    RedisCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
