"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { login, register } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";

export function AuthForm({
  mode,
  notice,
}: {
  mode: "login" | "register";
  notice?: string;
}) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = isRegister
        ? await register(email, password, displayName)
        : await login(email, password);
      setUser(session.user);
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <Link className="brand auth-brand" href="/dashboard">
        <span className="brand-mark" aria-hidden="true">◐</span>
        <span>Shiftr</span>
      </Link>
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-description">
        {isRegister
          ? "Sign up to start tracking your shifts."
          : "Sign in to see your weekly shifts and hours."}
      </p>
      {notice && <ValidationFeedback type="info" message={notice} />}
      <form className="form-fields" onSubmit={submit}>
        {isRegister && (
          <div className="field">
            <label htmlFor="display-name">Name</label>
            <input
              autoComplete="name"
              id="display-name"
              maxLength={100}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            autoComplete="email"
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            id="password"
            type="password"
            minLength={isRegister ? 8 : undefined}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error && <ValidationFeedback type="error" message={error} />}
        <button className="primary-button full-width" type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to Shiftr?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
