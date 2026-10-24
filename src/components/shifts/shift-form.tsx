"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createShift } from "@/lib/api";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { startOfWeekForDateKey, todayInUK } from "@/lib/dates";

type EntryMode = "start-end" | "duration";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function ShiftForm({ initialDate }: { initialDate?: string }) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const breaks = breakMinutes > 0
      ? [{
          durationMinutes: breakMinutes,
          paid: paidBreak,
          ...(breakStart ? { startAt: breakStart } : {}),
        }]
      : [];

    try {
      setLoading(true);
      if (mode === "start-end") {
        await createShift({
          mode,
          startDate: date,
          endDate,
          startTime,
          endTime,
          timeZone: "Europe/London",
          breaks,
        });
      } else {
        const grossDurationMinutes = Number(durationHours) * 60 + Number(durationRemainder);
        if (!Number.isFinite(grossDurationMinutes) || grossDurationMinutes <= 0) {
          throw new Error("Enter a shift duration greater than zero.");
        }
        await createShift({
          mode,
          date,
          grossDurationMinutes,
          timeZone: "Europe/London",
          breaks,
        });
      }
      setSaved(true);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

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
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="shift-end">End time</label>
                <input
                  id="shift-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
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
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
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
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={paidBreak}
                  onChange={(event) => setPaidBreak(event.target.checked)}
                />
                Paid break
              </label>
            )}
          </div>
          {breakMinutes > 0 && (
            <div className="field" style={{ marginTop: 12 }}>
              <label htmlFor="break-start">Break start (if known)</label>
              <input
                id="break-start"
                type="datetime-local"
                value={breakStart}
                onChange={(event) => setBreakStart(event.target.value)}
              />
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
        {saved && <ValidationFeedback
          type="info"
          message="Shift saved. Your weekly summary will update when you return to the dashboard."
        />}
        <button className="primary-button full-width" type="submit" disabled={loading}>
          {loading ? "Saving shift…" : "Add shift"}
        </button>
        <p>
          Shiftr calculates elapsed time using UK time-zone rules and updates the weekly
          summary from your saved shifts.
        </p>
        {saved && (
          <p><Link href={`/dashboard?weekStart=${startOfWeekForDateKey(date)}`}>
            Back to dashboard
          </Link></p>
        )}
      </div>
    </form>
  );
}
