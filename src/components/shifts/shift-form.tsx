"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createShift } from "@/lib/api";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import {
  londonDateTimeCandidates,
  startOfWeekForDateKey,
  todayInUK,
} from "@/lib/dates";

type EntryMode = "start-end" | "duration";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function ShiftForm({ initialDate }: { initialDate?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<EntryMode>("start-end");
  const [date, setDate] = useState(initialDate ?? todayInUK());
  const [endDate, setEndDate] = useState(initialDate ?? todayInUK());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [durationHours, setDurationHours] = useState("8");
  const [durationRemainder, setDurationRemainder] = useState("0");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [paidBreak, setPaidBreak] = useState(false);
  const [breakStart, setBreakStart] = useState("");
  const [startOccurrence, setStartOccurrence] = useState(0);
  const [endOccurrence, setEndOccurrence] = useState(0);
  const [breakOccurrence, setBreakOccurrence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setLoading(true);
      if (mode === "start-end") {
        const starts = londonDateTimeCandidates(date, startTime);
        const ends = londonDateTimeCandidates(endDate, endTime);
        const startAt = starts[startOccurrence];
        const endAt = ends[endOccurrence];
        if (!startAt || !endAt) {
          throw new Error("This local time does not exist because of a UK clock change.");
        }
        if (new Date(endAt) <= new Date(startAt)) {
          throw new Error("The end must be after the start. For an overnight shift, choose the following end date.");
        }
        const breaks = breakMinutes > 0
          ? [{
              duration_minutes: breakMinutes,
              is_paid: paidBreak,
              ...(breakStart ? {
                start_at: getSelectedDateTime(breakStart, breakOccurrence),
                end_at: new Date(
                  new Date(getSelectedDateTime(breakStart, breakOccurrence)).getTime()
                    + breakMinutes * 60_000,
                ).toISOString(),
              } : {}),
            }]
          : [];
        await createShift({ entry_mode: "timed", start_at: startAt, end_at: endAt, breaks });
      } else {
        const durationMinutes = Number(durationHours) * 60 + Number(durationRemainder);
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
          throw new Error("Enter a shift duration greater than zero.");
        }
        const breaks = breakMinutes > 0
          ? [{ duration_minutes: breakMinutes, is_paid: paidBreak }]
          : [];
        await createShift({
          entry_mode: "duration",
          shift_date: date,
          duration_minutes: durationMinutes,
          breaks,
        });
      }
      const weekToShow = mode === "start-end" ? endDate : date;
      router.replace(`/dashboard?weekStart=${startOfWeekForDateKey(weekToShow)}`);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  const startCandidates = londonDateTimeCandidates(date, startTime);
  const endCandidates = londonDateTimeCandidates(endDate, endTime);
  const breakCandidates = breakStart
    ? londonDateTimeCandidates(breakStart.slice(0, 10), breakStart.slice(11, 16))
    : [];

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-tabs" role="tablist" aria-label="Shift entry method">
        <button
          className={`form-tab${mode === "start-end" ? " active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "start-end"}
          onClick={() => setMode("start-end")}
        >
          Start &amp; end time
        </button>
        <button
          className={`form-tab${mode === "duration" ? " active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "duration"}
          onClick={() => setMode("duration")}
        >
          Total duration
        </button>
      </div>

      <div className="form-fields">
        <div className="field">
          <label htmlFor="shift-date">Date</label>
          <input
            id="shift-date"
            type="date"
            required
            value={date}
            onChange={(event) => {
              const nextDate = event.target.value;
              if (endDate === date || endDate < nextDate) setEndDate(nextDate);
              setDate(nextDate);
              setStartOccurrence(0);
            }}
          />
        </div>

        {mode === "start-end" ? (
          <>
            <div className="field-row">
              <div className="field">
                <label htmlFor="shift-start">Start time</label>
                <input
                  id="shift-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setStartOccurrence(0);
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="shift-end">End time</label>
                <input
                  id="shift-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setEndOccurrence(0);
                  }}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="shift-end-date">End date</label>
              <input
                id="shift-end-date"
                type="date"
                required
                min={date}
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setEndOccurrence(0);
                }}
              />
            </div>
            {startCandidates.length === 0 && (
              <ValidationFeedback
                type="error"
                message="This start time does not exist because the UK clocks move forward."
              />
            )}
            {startCandidates.length > 1 && (
              <div className="field">
                <label htmlFor="start-occurrence">Start time occurs twice</label>
                <select
                  id="start-occurrence"
                  value={startOccurrence}
                  onChange={(event) => setStartOccurrence(Number(event.target.value))}
                >
                  <option value={0}>First occurrence (before clocks change)</option>
                  <option value={1}>Second occurrence (after clocks change)</option>
                </select>
              </div>
            )}
            {endCandidates.length === 0 && (
              <ValidationFeedback
                type="error"
                message="This end time does not exist because the UK clocks move forward."
              />
            )}
            {endCandidates.length > 1 && (
              <div className="field">
                <label htmlFor="end-occurrence">End time occurs twice</label>
                <select
                  id="end-occurrence"
                  value={endOccurrence}
                  onChange={(event) => setEndOccurrence(Number(event.target.value))}
                >
                  <option value={0}>First occurrence (before clocks change)</option>
                  <option value={1}>Second occurrence (after clocks change)</option>
                </select>
              </div>
            )}
          </>
        ) : (
          <div className="field">
            <span className="field-label">Shift duration</span>
            <div className="field-row">
              <div className="field">
                <label htmlFor="duration-hours">Hours</label>
                <input
                  id="duration-hours"
                  type="number"
                  min="0"
                  max="168"
                  required
                  value={durationHours}
                  onChange={(event) => setDurationHours(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="duration-minutes">Minutes</label>
                <select
                  id="duration-minutes"
                  value={durationRemainder}
                  onChange={(event) => setDurationRemainder(event.target.value)}
                >
                  <option value="0">00 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="break-duration">Break</label>
          <div className="break-options">
            <select
              id="break-duration"
              value={breakMinutes}
              onChange={(event) => setBreakMinutes(Number(event.target.value))}
            >
              <option value={0}>No break</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            {breakMinutes > 0 && (
              <div className="paid-break-option">
                <input
                  id="paid-break"
                  type="checkbox"
                  checked={paidBreak}
                  onChange={(event) => setPaidBreak(event.target.checked)}
                />
                <label htmlFor="paid-break">Paid break</label>
              </div>
            )}
          </div>
          {breakMinutes > 0 && mode === "start-end" && (
            <div className="field" style={{ marginTop: 12 }}>
              <label htmlFor="break-start">Break start (needed when it crosses weeks)</label>
              <input
                id="break-start"
                type="datetime-local"
                value={breakStart}
                min={`${date}T00:00`}
                max={`${endDate}T23:59`}
                onChange={(event) => {
                  setBreakStart(event.target.value);
                  setBreakOccurrence(0);
                }}
              />
              {breakStart && breakCandidates.length === 0 && (
                <ValidationFeedback
                  type="error"
                  message="This break time does not exist because the UK clocks move forward."
                />
              )}
              {breakCandidates.length > 1 && (
                <select
                  aria-label="Choose which occurrence of the break time"
                  value={breakOccurrence}
                  onChange={(event) => setBreakOccurrence(Number(event.target.value))}
                >
                  <option value={0}>First occurrence (before clocks change)</option>
                  <option value={1}>Second occurrence (after clocks change)</option>
                </select>
              )}
            </div>
          )}
        </div>

        <div className="duration-preview">
          <strong>Duration is calculated by Shiftr</strong>
          Based on your shift times and break rules.
        </div>
      </div>

      <div className="form-footer">
        {error && <ValidationFeedback type="error" message={error} />}
        <button className="primary-button full-width" type="submit" disabled={loading}>
          {loading ? "Saving shift…" : "Add shift"}
        </button>
        <p>
          Shiftr calculates elapsed time using UK time-zone rules and updates the weekly
          summary from your saved shifts.
        </p>
      </div>
    </form>
  );
}

function getSelectedDateTime(value: string, occurrence: number): string {
  const candidates = londonDateTimeCandidates(value.slice(0, 10), value.slice(11, 16));
  const selected = candidates[occurrence];
  if (!selected) {
    throw new Error("Choose a valid break time in the Europe/London time zone.");
  }
  return selected;
}
