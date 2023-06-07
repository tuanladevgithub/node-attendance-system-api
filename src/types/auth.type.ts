export type JwtAdminPayload = {
  id: number;
  username: string;
  sub: number;
};

export type JwtTeacherPayload = {
  id: number;
  email: string;
  sub: number;
};

export type JwtStudentPayload = {
  id: number;
  email: string;
  sub: number;
};
