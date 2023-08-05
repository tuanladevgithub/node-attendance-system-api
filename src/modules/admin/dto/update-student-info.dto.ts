import { UserGender } from 'src/types/common.type';

export class UpdateStudentInfoDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  gender?: UserGender;
  age?: number;
}
