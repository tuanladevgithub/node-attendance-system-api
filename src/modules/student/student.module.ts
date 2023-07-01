import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from 'src/db/entities/student.entity';
import { CourseEntity } from 'src/db/entities/course.entity';
import { CourseScheduleEntity } from 'src/db/entities/course-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentEntity,
      CourseEntity,
      CourseScheduleEntity,
    ]),
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
