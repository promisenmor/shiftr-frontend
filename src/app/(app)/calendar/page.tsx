import { AppShell } from "@/components/app-shell";
import { WeeklyCalendar } from "@/components/shifts/weekly-calendar";
import { isWeekStartDate } from "@/lib/dates";

type CalendarPageProps = {
  searchParams: Promise<{ weekStart?: string | string[] }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const initialWeekStart = typeof params.weekStart === "string"
    && isWeekStartDate(params.weekStart)
    ? params.weekStart
    : undefined;

  return (
    <AppShell active="calendar">
      <header className="page-heading">
        <div>
          <h1>Weekly calendar</h1>
          <p>View your shifts for the selected week.</p>
        </div>
      </header>
      <WeeklyCalendar initialWeekStart={initialWeekStart} />
    </AppShell>
  );
}
