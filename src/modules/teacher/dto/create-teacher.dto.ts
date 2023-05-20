import { UserGender } from 'src/types/common.type';

export class CreateTeacherDto {
  email: string;

  password?: string;

  last_name: string;

  first_name: string;

  gender?: UserGender;

  phone_number?: string;

  description?: string;
}
