export class CreateTeacherDto {
  m_department_id: number;

  email: string;

  password?: string;

  last_name: string;

  first_name: string;

  phone_number?: string;

  description?: string;
}
