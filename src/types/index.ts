export type Shift = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  netMinutes: number;
};

export type WeeklySummary = {
  weekStart: string;
  targetMinutes: number;
  workedMinutes: number;
  remainingMinutes: number;
  overtimeMinutes: number;
  shifts: Shift[];
};

type BreakRecord = {
  durationMinutes: number;
  paid: boolean;
  startAt?: string;
};

export type CreateShiftRequest =
  | {
      mode: "start-end";
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      timeZone: "Europe/London";
      breaks: BreakRecord[];
    }
  | {
      mode: "duration";
      date: string;
      grossDurationMinutes: number;
      timeZone: "Europe/London";
      breaks: BreakRecord[];
    };
