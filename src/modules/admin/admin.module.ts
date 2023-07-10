import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from 'src/db/entities/admin.entity';
import { DepartmentEntity } from 'src/db/entities/department.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { StudentEntity } from 'src/db/entities/student.entity';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { TeacherModule } from '../teacher/teacher.module';
import { StudentModule } from '../student/student.module';
import { CourseModule } from '../course/course.module';
import { CourseScheduleEntity } from 'src/db/entities/course-schedule.entity';
import { CourseParticipationEntity } from 'src/db/entities/course-participation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminEntity,
      DepartmentEntity,
      TeacherEntity,
      StudentEntity,
      SubjectEntity,
      CourseEntity,
      CourseScheduleEntity,
      CourseParticipationEntity,
    ]),
    TeacherModule,
    StudentModule,
    CourseModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
