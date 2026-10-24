"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { DurationDisplay } from "@/components/ui/duration-display";
import { getWeeklySummary } from "@/lib/api";
import {
  addDays,
  currentWeekStart,
  formatDate,
  formatWeekRange,
  londonDateKey,
  londonTime,
  todayInUK,
} from "@/lib/dates";
import type { Shift, WeeklySummary } from "@/types";

function shiftStartDate(shift: Shift): string {
  return shift.entry_mode === "timed" && shift.start_at
    ? londonDateKey(new Date(shift.start_at))
    : shift.shift_date ?? "";
}

export function WeeklyCalendar({ initialWeekStart }: { initialWeekStart?: string }) {
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
          setError(caught instanceof Error ? caught.message : "Unable to load this week.");
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
    const grouped = new Map<string, Shift[]>();
    for (const shift of summary?.shifts ?? []) {
      const allocation = shift.weekly_allocations.find(
        (item) => item.week_start === weekStart,
      );
      if (!allocation) continue;
      const shiftDate = shiftStartDate(shift);
      const date = shiftDate < weekStart
        ? weekStart
        : shiftDate > addDays(weekStart, 6)
          ? addDays(weekStart, 6)
          : shiftDate;
      grouped.set(date, [...(grouped.get(date) ?? []), shift]);
    }
    return grouped;
  }, [summary, weekStart]);

  const selectWeek = (nextWeek: string) => {
    setError(null);
    setSummary(null);
    setLoading(true);
    setWeekStart(nextWeek);
  };

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{formatWeekRange(weekStart)}</h2>
            <p>Monday to Sunday · UK time</p>
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
              onClick={() => selectWeek(currentWeekStart())}
            >
              This week
            </button>
          </div>
        </div>
      </section>

      {loading && (
        <div className="calendar-loading">
          <ValidationFeedback type="info" message="Loading your weekly calendar…" />
        </div>
      )}
      {error && (
        <div className="history-error">
          <ValidationFeedback
            type="error"
            message={`Couldn't load this week's shifts. ${error}`}
          />
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setLoading(true);
              setRetry((current) => current + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}

      <section className="calendar-week-grid" aria-label="Shifts by day">
        {days.map((date) => {
          const shifts = shiftsByDate.get(date) ?? [];
          const isToday = date === todayInUK();
          return (
            <article
              className={`calendar-day-panel${isToday ? " today" : ""}`}
              key={date}
            >
              <header className="calendar-day-heading">
                <strong>{formatDate(date, { weekday: "short" })}</strong>
                <span>{formatDate(date, { day: "numeric", month: "short" })}</span>
              </header>
              <div className="calendar-day-shifts">
                {shifts.map((shift) => (
                  <div className="calendar-shift" key={shift.id}>
                    <div className="calendar-shift-time">
                      {shift.start_at && shift.end_at
                        ? `${londonTime(new Date(shift.start_at))} - ${londonTime(new Date(shift.end_at))}`
                        : "Duration entry"}
                    </div>
                    <div className="calendar-shift-duration">
                      <DurationDisplay minutes={shift.net_minutes} /> worked
                    </div>
                  </div>
                ))}
                {shifts.length === 0 && (
                  <div className="calendar-no-shift">
                    {loading ? " " : "No shift"}
                  </div>
                )}
                <Link
                  className="day-add"
                  href={`/log-shift?date=${date}`}
                  aria-label={`Add shift on ${date}`}
                >
                  +
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {summary && (
        <section className="calendar-summary" aria-label="Weekly total">
          <div>
            <strong>Total this week</strong>
            <p>
              {summary.target_minutes === null
                ? "Set a weekly target on your dashboard."
                : `${summary.progress_percent}% of ${Math.floor(summary.target_minutes / 60)}h ${String(summary.target_minutes % 60).padStart(2, "0")}m target`}
            </p>
          </div>
          <div className="calendar-summary-value">
            <DurationDisplay minutes={summary.worked_minutes} />
          </div>
        </section>
      )}

      {!loading && !error && summary?.shifts.length === 0 && (
        <div className="empty-state">
          <strong>No shifts logged this week</strong>
          Add a shift from any day in the calendar.
        </div>
      )}
    </>
  );
}
