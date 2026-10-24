import type {
  AuthTokens,
  CreateShiftRequest,
  Shift,
  User,
  WeeklySummary,
} from "@/types";

const SESSION_KEY = "shiftr.session";

type StoredSession = {
  access: string;
  refresh: string;
  user: User;
};

let refreshInFlight: Promise<boolean> | null = null;

function getSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session: unknown = JSON.parse(raw);
    return isSession(session) ? session : null;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function setSession(session: StoredSession) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("shiftr:session-change"));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("shiftr:session-change"));
}

export function getCurrentUser(): User | null {
  return getSession()?.user ?? null;
}

function isSession(value: unknown): value is StoredSession {
  return isRecord(value)
    && typeof value.access === "string"
    && typeof value.refresh === "string"
    && isUser(value.user);
}

function isUser(value: unknown): value is User {
  return isRecord(value)
    && typeof value.id === "number"
    && typeof value.email === "string"
    && typeof value.display_name === "string";
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

function apiUrl(path: string): string {
  return `/backend-api${path.replace(/\/+$/, "")}`;
}

async function readError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return `Request failed (${response.status})`;
  }

  const body: unknown = await response.json();
  if (isRecord(body)) {
    const detail = body.detail;
    if (typeof detail === "string") return detail;
    const messages = Object.values(body).flatMap((value) =>
      Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
    );
    if (messages.length) return messages.join(" ");
  }
  return `Request failed (${response.status})`;
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const session = getSession();
    if (!session) return false;
    try {
      const response = await fetch(apiUrl("/auth/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: session.refresh }),
      });
      if (!response.ok) {
        clearSession();
        return false;
      }
      const body: unknown = await response.json();
      if (!isRecord(body) || typeof body.access !== "string") {
        clearSession();
        return false;
      }
      setSession({
        ...session,
        access: body.access,
        refresh: typeof body.refresh === "string" ? body.refresh : session.refresh,
      });
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const makeRequest = () => {
    const session = authenticated ? getSession() : null;
    const headers = new Headers(options.headers);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (session) headers.set("Authorization", `Bearer ${session.access}`);
    return fetch(apiUrl(path), { ...options, headers });
  };

  let response = await makeRequest();
  if (response.status === 401 && authenticated && await refreshSession()) {
    response = await makeRequest();
  }
  if (!response.ok) {
    const message = await readError(response);
    if (response.status === 401 && authenticated) {
      clearSession();
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const result = await request<unknown>(
    "/auth/login/",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  if (!isAuthTokens(result)) throw new Error("The backend returned an invalid sign-in response.");
  setSession(result);
  return result;
}

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthTokens> {
  const result = await request<unknown>(
    "/auth/register/",
    {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    },
    false,
  );
  if (!isAuthTokens(result)) throw new Error("The backend returned an invalid registration response.");
  setSession(result);
  return result;
}

export async function logout() {
  const session = getSession();
  if (session) {
    try {
      await request<void>("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh: session.refresh }),
      });
    } finally {
      clearSession();
    }
  } else {
    clearSession();
  }
}

export function getProfile() {
  return request<User>("/profile/");
}

export function updateProfile(displayName: string) {
  return request<User>("/profile/", {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export function getWeeklySummary(weekStart: string, signal?: AbortSignal) {
  return request<WeeklySummary>(`/weeks/${weekStart}/summary/`, { signal });
}

export function createShift(payload: CreateShiftRequest) {
  return request<Shift>("/shifts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setWeeklyTarget(weekStart: string, targetMinutes: number) {
  return request<{ week_start: string; target_minutes: number }>(
    `/weekly-targets/${weekStart}/`,
    {
      method: "PUT",
      body: JSON.stringify({ target_minutes: targetMinutes }),
    },
  );
}

function isAuthTokens(value: unknown): value is AuthTokens {
  return isRecord(value)
    && typeof value.access === "string"
    && typeof value.refresh === "string"
    && isUser(value.user);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
