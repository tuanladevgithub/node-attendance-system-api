import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherEntity } from 'src/db/entities/teacher.entity';
import { SubjectEntity } from 'src/db/entities/subject.entity';
import { CourseEntity } from 'src/db/entities/course.entity';
import { CourseParticipationEntity } from 'src/db/entities/course-participation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherEntity,
      SubjectEntity,
      CourseEntity,
      CourseParticipationEntity,
    ]),
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
