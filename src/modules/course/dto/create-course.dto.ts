export class CreateCourseDto {
  m_subject_id: number;

  teacherCodeOrEmail: string;

  start_date: string;

  end_date: string;

  description?: string;
}
