"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWeeklySummary, setWeeklyTarget } from "@/lib/api";
import {
  addDays,
  currentWeekStart,
  formatDate,
  formatWeekRange,
  londonDateKey,
  londonTime,
} from "@/lib/dates";
import { useAuth } from "@/components/auth/auth-provider";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { DurationDisplay } from "@/components/ui/duration-display";
import type { Shift, WeeklySummary } from "@/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function WeeklyDashboard({ initialWeekStart }: { initialWeekStart?: string }) {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(
    () => initialWeekStart ?? currentWeekStart(),
  );
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetHours, setTargetHours] = useState("19");
  const [targetMinutes, setTargetMinutes] = useState("0");
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

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
    const grouped = new Map<string, { shift: Shift; minutes: number }[]>();
    for (const shift of summary?.shifts ?? []) {
      const allocation = shift.weekly_allocations.find((item) => item.week_start === weekStart);
      if (!allocation) continue;
      const shiftDate = shift.entry_mode === "timed" && shift.start_at
        ? londonDateKey(new Date(shift.start_at))
        : shift.shift_date ?? weekStart;
      const date = shiftDate < weekStart || shiftDate > addDays(weekStart, 6)
        ? weekStart
        : shiftDate;
      grouped.set(date, [...(grouped.get(date) ?? []), { shift, minutes: allocation.minutes }]);
    }
    return grouped;
  }, [summary, weekStart]);

  const progress = summary?.progress_percent ?? 0;
  const todayWeekStart = currentWeekStart();
  const selectWeek = (nextWeekStart: string) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setWeekStart(nextWeekStart);
  };

  async function saveTarget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(targetHours) * 60 + Number(targetMinutes);
    if (!Number.isSafeInteger(minutes) || minutes < 0) {
      setTargetError("Enter a valid weekly target.");
      return;
    }
    setSavingTarget(true);
    setTargetError(null);
    try {
      await setWeeklyTarget(weekStart, minutes);
      setEditingTarget(false);
      setLoading(true);
      setRetry((current) => current + 1);
    } catch (caught) {
      setTargetError(getErrorMessage(caught));
    } finally {
      setSavingTarget(false);
    }
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Good morning, {user?.display_name || user?.email.split("@")[0] || "there"} 👋</h1>
          <p>Here&apos;s your shift overview for this week.</p>
        </div>
        <div className="user-chip">
          <span className="avatar" aria-hidden="true">
            {(user?.display_name || user?.email || "S").slice(0, 1).toUpperCase()}
          </span>
          <span>{user?.display_name || user?.email}</span>
          <span aria-hidden="true">⌄</span>
        </div>
      </header>

      <section className="summary-grid" aria-label="Weekly summary">
        <SummaryCard
          className="target"
          icon="◎"
          label="Weekly target"
          value={summary?.target_minutes === null || !summary
            ? "Not set"
            : <DurationDisplay minutes={summary.target_minutes} />}
        />
        <SummaryCard
          className="worked"
          icon="✓"
          label="Hours worked"
          value={summary ? <DurationDisplay minutes={summary.worked_minutes} /> : "—"}
        />
        <SummaryCard
          className="remaining"
          icon="◷"
          label={summary?.overtime_minutes ? "Overtime" : "Remaining"}
          value={summary
            ? <DurationDisplay minutes={summary.overtime_minutes || summary.remaining_minutes} />
            : "—"}
        />
      </section>

      {summary && (
        <div className="target-actions">
          {!editingTarget ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                const target = summary.target_minutes ?? summary.suggested_target_minutes ?? 1140;
                setTargetHours(String(Math.floor(target / 60)));
                setTargetMinutes(String(target % 60));
                setEditingTarget(true);
                setTargetError(null);
              }}
            >
              {summary.target_is_set ? "Edit target" : "Set weekly target"}
            </button>
          ) : (
            <form className="target-form" onSubmit={saveTarget}>
              <label htmlFor="target-hours">Weekly target</label>
              <input
                id="target-hours"
                type="number"
                min="0"
                max="168"
                required
                value={targetHours}
                onChange={(event) => setTargetHours(event.target.value)}
              />
              <span>hours</span>
              <select
                aria-label="Target minutes"
                value={targetMinutes}
                onChange={(event) => setTargetMinutes(event.target.value)}
              >
                <option value="0">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
              <span>minutes</span>
              <button className="primary-button" type="submit" disabled={savingTarget}>
                {savingTarget ? "Saving…" : "Save target"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setEditingTarget(false)}
              >
                Cancel
              </button>
              {targetError && <ValidationFeedback type="error" message={targetError} />}
            </form>
          )}
        </div>
      )}

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
                ? summary.overtime_minutes
                  ? <><DurationDisplay minutes={summary.overtime_minutes} /> overtime</>
                  : summary.target_minutes === null
                    ? "Set a weekly target to track your progress"
                    : <><DurationDisplay minutes={summary.remaining_minutes} /> remaining</>
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
                  <tr key={shift.shift.id}>
                    <td>{formatDate(date, { weekday: "short", day: "numeric" })}</td>
                    <td className="shift-time">
                      {shift.shift.start_at && shift.shift.end_at
                        ? `${londonTime(new Date(shift.shift.start_at))} - ${londonTime(new Date(shift.shift.end_at))}`
                        : "Duration entry"}
                    </td>
                    <td><DurationDisplay minutes={shift.minutes} /></td>
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
  value: import("react").ReactNode;
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
