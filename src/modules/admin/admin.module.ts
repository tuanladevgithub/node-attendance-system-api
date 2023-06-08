import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from 'src/db/entities/admin.entity';
import { DepartmentEntity } from 'src/db/entities/department.entity';
import { TeacherEntity } from 'src/db/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity, DepartmentEntity, TeacherEntity]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
