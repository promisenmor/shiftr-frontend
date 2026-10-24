export type User = {
  id: number;
  email: string;
  display_name: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
  user: User;
};

export type BreakRecord = {
  duration_minutes: number;
  is_paid: boolean;
  start_at?: string;
  end_at?: string;
};

export type WeeklyAllocation = {
  week_start: string;
  minutes: number;
};

export type Shift = {
  id: number;
  entry_mode: "timed" | "duration";
  shift_date: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  breaks: BreakRecord[];
  gross_minutes: number;
  paid_break_minutes: number;
  unpaid_break_minutes: number;
  net_minutes: number;
  weekly_allocations: WeeklyAllocation[];
};

export type WeeklySummary = {
  week_start: string;
  week_end: string;
  target_minutes: number | null;
  suggested_target_minutes: number | null;
  target_is_set: boolean;
  worked_minutes: number;
  remaining_minutes: number;
  overtime_minutes: number;
  progress_percent: number;
  shifts: Shift[];
};

export type TimedShiftRequest = {
  entry_mode: "timed";
  start_at: string;
  end_at: string;
  breaks: BreakRecord[];
};

export type DurationShiftRequest = {
  entry_mode: "duration";
  shift_date: string;
  duration_minutes: number;
  breaks: BreakRecord[];
};

export type CreateShiftRequest = TimedShiftRequest | DurationShiftRequest;
