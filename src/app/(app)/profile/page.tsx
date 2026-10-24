import { AppShell } from "@/components/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <AppShell active="profile">
      <header className="page-heading">
        <div>
          <h1>Your profile</h1>
          <p>Manage the details associated with your Shiftr account.</p>
        </div>
      </header>
      <ProfileForm />
    </AppShell>
  );
}
