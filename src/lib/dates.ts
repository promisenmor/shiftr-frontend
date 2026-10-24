export const UK_TIME_ZONE = "Europe/London";

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
