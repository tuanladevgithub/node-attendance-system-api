export class CreateAttendanceSessionDto {
  session_date: string;

  start_hour: number;

  start_min: number;

  end_hour: number;

  end_min: number;

  overtime_minutes_for_late?: number;

  password?: string;

  description?: string;
}
