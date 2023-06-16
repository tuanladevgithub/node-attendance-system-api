import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from 'src/db/entities/course.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEntity, SubjectEntity, TeacherEntity]),
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
