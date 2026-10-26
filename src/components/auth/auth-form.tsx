"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { login, loginWithGoogle, register } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButton = useRef<HTMLDivElement>(null);
  const googleSignInInProgress = useRef(false);
  const isRegister = mode === "register";

  const handleGoogleCredential = useCallback(async (credential: string) => {
    if (googleSignInInProgress.current) return;
    googleSignInInProgress.current = true;
    setError(null);
    setSubmitting(true);
    try {
      const session = await loginWithGoogle(credential);
      setUser(session.user);
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in with Google.");
    } finally {
      googleSignInInProgress.current = false;
      setSubmitting(false);
    }
  }, [router, setUser]);

  useEffect(() => {
    const container = googleButton.current;
    const googleIdentity = window.google?.accounts.id;
    if (!googleLoaded || !googleClientId || !container || !googleIdentity) return;

    container.replaceChildren();
    googleIdentity.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (!response.credential) {
          setError("Google did not return a sign-in credential. Please try again.");
          return;
        }
        void handleGoogleCredential(response.credential);
      },
    });
    googleIdentity.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: isRegister ? "signup_with" : "signin_with",
      shape: "rectangular",
      width: Math.min(container.clientWidth || 350, 350),
    });
  }, [googleLoaded, handleGoogleCredential, isRegister]);

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
      {googleClientId && (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onReady={() => setGoogleLoaded(true)}
            onError={() => setError("Google sign-in could not be loaded. Please try again later.")}
          />
          <div className="google-sign-in">
            <div
              ref={googleButton}
              aria-disabled={submitting}
              style={{
                opacity: submitting ? 0.6 : 1,
                pointerEvents: submitting ? "none" : "auto",
              }}
            />
          </div>
          <div className="auth-divider"><span>or continue with email</span></div>
        </>
      )}
      {error && <ValidationFeedback type="error" message={error} />}
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
