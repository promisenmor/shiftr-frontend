import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "log-shift";
};

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂", key: "dashboard" },
  { href: "/log-shift", label: "Log Shift", icon: "⊕", key: "log-shift" },
];

const plannedLinks = [
  { label: "Calendar", icon: "▦" },
  { label: "History", icon: "◷" },
  { label: "Profile", icon: "◎" },
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
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav className="nav-list" aria-label="Main navigation">
          {primaryLinks.map((link) => (
            <NavigationItem
              key={link.key}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={active === link.key}
            />
          ))}
          {plannedLinks.map((link) => (
            <span className="nav-link" key={link.label} aria-disabled="true" title="Coming soon">
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              {link.label}
            </span>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="nav-link" aria-disabled="true" title="Coming soon">
            <span className="nav-icon" aria-hidden="true">⚙</span>
            Settings
          </span>
          <span className="nav-link" aria-disabled="true" title="Sign-in will be available soon">
            <span className="nav-icon" aria-hidden="true">↪</span>
            Log out
          </span>
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
        <Link href="/dashboard" aria-label="More navigation">
          <span className="nav-icon" aria-hidden="true">☰</span>
          More
        </Link>
      </nav>
    </div>
  );
}
