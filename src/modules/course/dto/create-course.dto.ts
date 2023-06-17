export class CreateCourseDto {
  m_subject_id: number;

  teacher_code_or_email: string;

  start_date: string;

  end_date: string;

  description?: string;
}
