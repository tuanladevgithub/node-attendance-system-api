export class CreateAttendanceSessionDto {
  session_date: string;

  start_hour: number;

  start_min: number;

  end_hour: number;

  end_min: number;

  description?: string;
}
