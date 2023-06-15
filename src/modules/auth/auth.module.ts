import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TeacherModule } from '../teacher/teacher.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminModule } from '../admin/admin.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    AdminModule,
    TeacherModule,
    StudentModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
