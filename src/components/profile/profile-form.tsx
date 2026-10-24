"use client";

import { useState, type FormEvent } from "react";
import { ValidationFeedback } from "@/components/forms/validation-feedback";
import { useAuth } from "@/components/auth/auth-provider";
import { updateProfile } from "@/lib/api";

export function ProfileForm() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const updated = await updateProfile(displayName.trim());
      setDisplayName(updated.display_name);
      setUser(updated);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-card panel">
      <div className="profile-avatar" aria-hidden="true">
        {(user?.display_name || user?.email || "S").slice(0, 1).toUpperCase()}
      </div>
      <form className="form-fields profile-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="profile-name">Display name</label>
          <input
            id="profile-name"
            type="text"
            maxLength={100}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <span className="field-help">
            Used to personalize your dashboard. Leave blank to use the name from your email.
          </span>
        </div>
        <div className="field">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" type="email" value={user?.email ?? ""} readOnly />
          <span className="field-help">Your email address is used to sign in.</span>
        </div>
        {error && <ValidationFeedback type="error" message={error} />}
        {saved && <ValidationFeedback type="info" message="Your profile has been updated." />}
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}
