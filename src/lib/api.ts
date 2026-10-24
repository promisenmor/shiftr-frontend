import type { CreateShiftRequest, Shift, WeeklySummary } from "@/types";
import { addDays, isDateKey } from "@/lib/dates";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (response.headers.get("content-type")?.includes("application/json")) {
      const body: unknown = await response.json();
      if (
        typeof body === "object"
        && body !== null
        && "message" in body
        && typeof body.message === "string"
      ) {
        message = body.message;
      }
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getWeeklySummary(weekStart: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ weekStart, timeZone: "Europe/London" });
  return request<unknown>(`/api/weekly-summary?${query}`, { signal }).then((body) => {
    if (!isWeeklySummary(body) || body.weekStart !== weekStart) {
      throw new Error("The backend returned an invalid weekly summary.");
    }
    return body;
  });
}

export function createShift(payload: CreateShiftRequest) {
  return request<unknown>("/api/shifts", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((body) => {
    if (!isRecord(body) || !isShift(body.shift)) {
      throw new Error("The backend returned an invalid saved shift.");
    }
    return { shift: body.shift };
  });
}

function isWeeklySummary(value: unknown): value is WeeklySummary {
  if (!isRecord(value)) return false;
  if (typeof value.weekStart !== "string" || !isDateKey(value.weekStart)) return false;

  const weekStart = value.weekStart;
  if (!isNonnegativeInteger(value.targetMinutes)
    || !isNonnegativeInteger(value.workedMinutes)
    || !isNonnegativeInteger(value.remainingMinutes)
    || !isNonnegativeInteger(value.overtimeMinutes)
    || !Array.isArray(value.shifts)) {
    return false;
  }
  const weekEnd = addDays(weekStart, 6);
  return value.shifts.every((shift) => isShift(shift)
    && shift.date >= weekStart
    && shift.date <= weekEnd);
}

function isShift(value: unknown): value is Shift {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.date === "string"
    && isDateKey(value.date)
    && (typeof value.startTime === "string" || value.startTime === null)
    && (typeof value.endTime === "string" || value.endTime === null)
    && isNonnegativeInteger(value.netMinutes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
