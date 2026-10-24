"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { logout } from "@/lib/api";

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "log-shift" | "calendar" | "history" | "profile";
};

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂", key: "dashboard" },
  { href: "/log-shift", label: "Log Shift", icon: "⊕", key: "log-shift" },
  { href: "/calendar", label: "Calendar", icon: "▦", key: "calendar" },
  { href: "/history", label: "History", icon: "◷", key: "history" },
  { href: "/profile", label: "Profile", icon: "◎", key: "profile" },
];

function Brand() {
  return (
    <Link className="brand" href="/dashboard" aria-label="Shiftr home">
      <span className="brand-mark" aria-hidden="true">◐</span>
      <span>Shiftr</span>
    </Link>
  );
}

function NavigationItem({ href, label, icon, active = false }: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link className={`nav-link${active ? " active" : ""}`} href={href}>
      <span className="nav-icon" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}

export function AppShell({ children, active }: AppShellProps) {
  const router = useRouter();
  const { user, loading, setUser } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to confirm sign out.";
      router.replace(`/login?notice=${encodeURIComponent(message)}`);
    } finally {
      setUser(null);
      if (window.location.pathname !== "/login") router.replace("/login");
    }
  }

  if (loading || !user) {
    return <main className="auth-loading" aria-live="polite">Loading your Shiftr account…</main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav className="nav-list" aria-label="Main navigation">
          {primaryLinks.slice(0, 2).map((link) => (
            <NavigationItem
              key={link.key}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={active === link.key}
            />
          ))}
          {primaryLinks.slice(2).map((link) => (
            <NavigationItem
              key={link.key}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={active === link.key}
            />
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="nav-link" aria-disabled="true" title="Coming soon">
            <span className="nav-icon" aria-hidden="true">⚙</span>
            Settings
          </span>
          <button className="nav-link nav-button" type="button" onClick={handleLogout}>
            <span className="nav-icon" aria-hidden="true">↪</span>
            Log out
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {primaryLinks.map((link) => (
          <Link
            className={active === link.key ? "active" : ""}
            href={link.href}
            key={link.key}
          >
            <span className="nav-icon" aria-hidden="true">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
