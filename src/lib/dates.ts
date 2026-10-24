export const UK_TIME_ZONE = "Europe/London";

const londonDateTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: UK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function londonDateTimeParts(value: Date): Record<string, string> {
  return Object.fromEntries(
    londonDateTime.formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function londonDateKey(value: Date): string {
  const parts = londonDateTimeParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function londonTime(value: Date): string {
  const parts = londonDateTimeParts(value);
  return `${parts.hour}:${parts.minute}`;
}

export function londonDateTimeCandidates(date: string, time: string): string[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(`${date}T${time}`);
  if (!match) return [];
  const [, year, month, day, hour, minute] = match;
  const wallClockAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  const offsets = new Set<number>();

  for (let deltaHours = -36; deltaHours <= 36; deltaHours += 6) {
    const probe = new Date(wallClockAsUtc + deltaHours * 60 * 60 * 1000);
    const name = new Intl.DateTimeFormat("en-GB", {
      timeZone: UK_TIME_ZONE,
      timeZoneName: "longOffset",
    }).formatToParts(probe).find((part) => part.type === "timeZoneName")?.value;
    if (name === "GMT") {
      offsets.add(0);
    } else {
      const offset = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name ?? "");
      if (offset) {
        const minutes = Number(offset[2]) * 60 + Number(offset[3]);
        offsets.add(offset[1] === "+" ? minutes : -minutes);
      }
    }
  }

  return [...offsets]
    .map((offset) => new Date(wallClockAsUtc - offset * 60_000))
    .filter((candidate) => {
      const parts = londonDateTimeParts(candidate);
      return parts.year === year
        && parts.month === month
        && parts.day === day
        && parts.hour === hour
        && parts.minute === minute;
    })
    .sort((first, second) => first.getTime() - second.getTime())
    .map((candidate) => candidate.toISOString());
}

export function todayInUK(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function startOfWeekForDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const weekday = (date.getUTCDay() + 6) % 7;
  return addDays(dateKey, -weekday);
}

export function currentWeekStart(): string {
  return startOfWeekForDateKey(todayInUK());
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isWeekStartDate(value: string): boolean {
  if (!isDateKey(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return date.getUTCDay() === 1;
}

export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatWeekRange(weekStart: string): string {
  const weekEnd = addDays(weekStart, 6);
  const start = formatDate(weekStart, { day: "numeric", month: "short" });
  const end = formatDate(weekEnd, { day: "numeric", month: "short", year: "numeric" });
  return `${start} - ${end}`;
}
