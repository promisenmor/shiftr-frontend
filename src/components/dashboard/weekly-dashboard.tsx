"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWeeklySummary } from "@/lib/api";
import {
  addDays,
  currentWeekStart,
  formatDate,
  formatWeekRange,
} from "@/lib/dates";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { DurationDisplay } from "@/components/ui/duration-display";
import type { WeeklySummary } from "@/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function WeeklyDashboard({ initialWeekStart }: { initialWeekStart?: string }) {
  const [weekStart, setWeekStart] = useState(
    () => initialWeekStart ?? currentWeekStart(),
  );
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getWeeklySummary(weekStart, controller.signal)
      .then((result) => {
        setSummary(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setSummary(null);
          setError(getErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [weekStart, retry]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const shiftsByDate = useMemo(() => {
    const grouped = new Map<string, WeeklySummary["shifts"]>();
    for (const shift of summary?.shifts ?? []) {
      grouped.set(shift.date, [...(grouped.get(shift.date) ?? []), shift]);
    }
    return grouped;
  }, [summary]);

  const progress = summary && summary.targetMinutes > 0
    ? Math.min((summary.workedMinutes / summary.targetMinutes) * 100, 100)
    : 0;
  const todayWeekStart = currentWeekStart();
  const selectWeek = (nextWeekStart: string) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setWeekStart(nextWeekStart);
  };

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Good morning, Alex 👋</h1>
          <p>Here&apos;s your shift overview for this week.</p>
        </div>
        <div className="user-chip">
          <span className="avatar" aria-hidden="true">AJ</span>
          <span>Alex Johnson</span>
          <span aria-hidden="true">⌄</span>
        </div>
      </header>

      <section className="summary-grid" aria-label="Weekly summary">
        <SummaryCard
          className="target"
          icon="◎"
          label="Weekly target"
          value={summary ? <DurationDisplay minutes={summary.targetMinutes} /> : "—"}
        />
        <SummaryCard
          className="worked"
          icon="✓"
          label="Hours worked"
          value={summary ? <DurationDisplay minutes={summary.workedMinutes} /> : "—"}
        />
        <SummaryCard
          className="remaining"
          icon="◷"
          label={summary?.overtimeMinutes ? "Overtime" : "Remaining"}
          value={summary
            ? <DurationDisplay minutes={summary.overtimeMinutes || summary.remainingMinutes} />
            : "—"}
        />
      </section>

      <section className="progress-card" aria-label="Weekly target progress">
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Weekly target progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-caption">
          <strong>{summary ? `${progress.toFixed(1)}% complete` : "Weekly progress"}</strong>
          <span>
            {summary
              ? summary.overtimeMinutes
                ? <><DurationDisplay minutes={summary.overtimeMinutes} /> overtime</>
                : <><DurationDisplay minutes={summary.remainingMinutes} /> remaining</>
              : " "}
          </span>
        </div>
      </section>

      {error && (
        <div style={{ marginTop: 12 }}>
          <ValidationFeedback
            type="error"
            message={`We couldn't load this week's summary. ${error}`}
          />
          <button className="secondary-button" type="button" onClick={() => {
            setLoading(true);
            setRetry((current) => current + 1);
          }}>
            Try again
          </button>
        </div>
      )}
      {loading && (
        <div className="notice loading" role="status" style={{ marginTop: 12 }}>
          Loading weekly summary…
        </div>
      )}

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>This week</h2>
              <p>{formatWeekRange(weekStart)}</p>
            </div>
            <div className="week-controls">
              <button
                className="icon-button"
                type="button"
                aria-label="Previous week"
                onClick={() => selectWeek(addDays(weekStart, -7))}
              >
                ‹
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Next week"
                onClick={() => selectWeek(addDays(weekStart, 7))}
              >
                ›
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => selectWeek(todayWeekStart)}
              >
                This week
              </button>
            </div>
          </div>
          <table className="shift-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Shift time</th>
                <th>Duration</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {days.map((date) => {
                const shifts = shiftsByDate.get(date) ?? [];
                return shifts.length ? shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td>{formatDate(date, { weekday: "short", day: "numeric" })}</td>
                    <td className="shift-time">
                      {shift.startTime && shift.endTime
                        ? `${shift.startTime} - ${shift.endTime}`
                        : "Duration entry"}
                    </td>
                    <td><DurationDisplay minutes={shift.netMinutes} /></td>
                    <td><span className="status-pill">✓ Logged</span></td>
                    <td>
                      <Link
                        className="day-add"
                        href={`/log-shift?date=${date}`}
                        aria-label={`Add shift on ${date}`}
                      >
                        +
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr key={date}>
                    <td>{formatDate(date, { weekday: "short", day: "numeric" })}</td>
                    <td className="shift-time">—</td>
                    <td>No shift</td>
                    <td />
                    <td>
                      <Link
                        className="day-add"
                        href={`/log-shift?date=${date}`}
                        aria-label={`Add shift on ${date}`}
                      >
                        +
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && !error && summary?.shifts.length === 0 && (
            <div className="empty-state">
              <strong>No shifts logged yet</strong>
              Log a shift to start tracking your hours.
            </div>
          )}
        </section>

        <aside className="right-column">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{formatDate(weekStart, { month: "long", year: "numeric" })}</h2>
                <p>Selected week</p>
              </div>
            </div>
            <MiniCalendar weekStart={weekStart} days={days} />
          </section>
          <section className="tip-card">
            <div className="tip-title"><span aria-hidden="true">✦</span> Quick tip</div>
            <p>Log your shift as soon as you finish so your weekly total stays accurate.</p>
          </section>
        </aside>
      </div>
    </>
  );
}

function SummaryCard({ className, icon, label, value }: {
  className: string;
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className={`summary-card ${className}`}>
      <span className="summary-icon" aria-hidden="true">{icon}</span>
      <div>
        <div className="summary-label">{label}</div>
        <div className="summary-value">{value}</div>
      </div>
    </div>
  );
}

function MiniCalendar({ weekStart, days }: { weekStart: string; days: string[] }) {
  const [year, month] = weekStart.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const calendarStart = addDays(`${year}-${String(month).padStart(2, "0")}-01`, -offset);
  const selectedDays = new Set(days);
  const calendarDays = Array.from({ length: 35 }, (_, index) => addDays(calendarStart, index));
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="mini-calendar">
      <div className="calendar-weekdays">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-days">
        {calendarDays.map((date) => (
          <span
            className={[
              "calendar-day",
              date.startsWith(monthPrefix) ? "" : "outside",
              selectedDays.has(date) ? "selected" : "",
            ].filter(Boolean).join(" ")}
            key={date}
            aria-current={selectedDays.has(date) ? "date" : undefined}
          >
            {formatDate(date, { day: "numeric" })}
          </span>
        ))}
      </div>
    </div>
  );
}
