import { WeeklyDashboard } from "@/components/dashboard/weekly-dashboard";
import { AppShell } from "@/components/app-shell";
import { isWeekStartDate } from "@/lib/dates";

type DashboardPageProps = {
  searchParams: Promise<{ weekStart?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const initialWeekStart = typeof params.weekStart === "string"
    && isWeekStartDate(params.weekStart)
    ? params.weekStart
    : undefined;

  return (
    <AppShell active="dashboard">
      <WeeklyDashboard initialWeekStart={initialWeekStart} />
    </AppShell>
  );
}
