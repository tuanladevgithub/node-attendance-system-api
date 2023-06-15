import { UserGender } from 'src/types/common.type';

export class CreateStudentDto {
  email: string;

  password?: string;

  last_name: string;

  first_name: string;

  gender: UserGender;

  phone_number?: string;

  age?: number;
}
