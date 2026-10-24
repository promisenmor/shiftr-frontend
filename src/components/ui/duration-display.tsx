import { formatMinutes } from "@/lib/dates";

export function DurationDisplay({ minutes }: { minutes: number }) {
  return <>{formatMinutes(minutes)}</>;
}
