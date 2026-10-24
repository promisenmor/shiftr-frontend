"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { DurationDisplay } from "@/components/ui/duration-display";
import { getShifts } from "@/lib/api";
import { formatDate, londonDateKey, londonTime } from "@/lib/dates";
import type { Shift } from "@/types";

function getShiftDate(shift: Shift): string {
  return shift.entry_mode === "timed" && shift.start_at
    ? londonDateKey(new Date(shift.start_at))
    : shift.shift_date ?? "";
}

function shiftSortTime(shift: Shift): number {
  return shift.start_at ? new Date(shift.start_at).getTime() : 0;
}

export function ShiftHistory() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getShifts(appliedStart || undefined, appliedEnd || undefined, controller.signal)
      .then((result) => {
        setShifts(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setShifts([]);
          setError(caught instanceof Error ? caught.message : "Unable to load shift history.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [appliedStart, appliedEnd, reload]);

  const sortedShifts = useMemo(
    () => [...shifts].sort((first, second) =>
      getShiftDate(second).localeCompare(getShiftDate(first))
      || shiftSortTime(second) - shiftSortTime(first)),
    [shifts],
  );

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setAppliedStart("");
    setAppliedEnd("");
    setLoading(true);
    setError(null);
  }

  return (
    <>
      <form className="history-filters" onSubmit={applyFilters}>
        <div className="field">
          <label htmlFor="history-start">From</label>
          <input
            id="history-start"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="history-end">To</label>
          <input
            id="history-end"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <button className="primary-button" type="submit">Filter</button>
        <button className="secondary-button" type="button" onClick={clearFilters}>
          Clear
        </button>
      </form>

      {error && (
        <div className="history-error">
          <ValidationFeedback type="error" message={`Couldn't load your shifts. ${error}`} />
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setLoading(true);
              setReload((current) => current + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {loading && <ValidationFeedback type="info" message="Loading shift history…" />}
      {!loading && !error && sortedShifts.length === 0 && (
        <section className="panel empty-state history-empty">
          <strong>No shifts found</strong>
          Try another date range or log a shift to see it here.
        </section>
      )}
      {!error && sortedShifts.length > 0 && (
        <section className="panel history-panel" aria-label="Shift history">
          <div className="history-count">
            {sortedShifts.length} {sortedShifts.length === 1 ? "shift" : "shifts"}
          </div>
          <div className="history-table-wrap">
            <table className="shift-table history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift time</th>
                  <th>Gross</th>
                  <th>Breaks</th>
                  <th>Net worked</th>
                </tr>
              </thead>
              <tbody>
                {sortedShifts.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      {getShiftDate(shift)
                        ? formatDate(getShiftDate(shift), {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="shift-time">
                      {shift.start_at && shift.end_at
                        ? `${londonTime(new Date(shift.start_at))} - ${londonTime(new Date(shift.end_at))}`
                        : "Duration entry"}
                    </td>
                    <td><DurationDisplay minutes={shift.gross_minutes} /></td>
                    <td>
                      {shift.breaks.length === 0
                        ? "None"
                        : `${shift.breaks.reduce((sum, item) => sum + item.duration_minutes, 0)}m · ${
                            shift.unpaid_break_minutes
                              ? `${shift.unpaid_break_minutes}m unpaid`
                              : "paid"}`}
                    </td>
                    <td><strong><DurationDisplay minutes={shift.net_minutes} /></strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
