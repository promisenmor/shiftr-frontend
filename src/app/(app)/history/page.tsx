import { AppShell } from "@/components/app-shell";
import { ShiftHistory } from "@/components/shifts/shift-history";

export default function HistoryPage() {
  return (
    <AppShell active="history">
      <header className="page-heading">
        <div>
          <h1>Shift history</h1>
          <p>Review your recorded shifts and working time.</p>
        </div>
      </header>
      <ShiftHistory />
    </AppShell>
  );
}
