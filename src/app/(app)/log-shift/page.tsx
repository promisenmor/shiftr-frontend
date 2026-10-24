import { AppShell } from "@/components/app-shell";
import { ShiftForm } from "@/components/shifts/shift-form";
import { isDateKey } from "@/lib/dates";

type LogShiftPageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

export default async function LogShiftPage({ searchParams }: LogShiftPageProps) {
  const params = await searchParams;
  const date = typeof params.date === "string" && isDateKey(params.date)
    ? params.date
    : undefined;

  return (
    <AppShell active="log-shift">
      <header className="page-heading">
        <div>
          <h1>Log shift</h1>
          <p>Enter your shift details to update your weekly total.</p>
        </div>
      </header>
      <div className="form-wrap">
        <ShiftForm initialDate={date} />
      </div>
    </AppShell>
  );
}
