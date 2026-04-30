import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const tabs = [
  { to: "account", label: "Account" },
  { to: "appearance", label: "Appearance" },
];

export default function UserSettingsLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border h-14 flex items-center px-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
        <aside>
          <h1 className="text-lg font-semibold mb-4">Account</h1>
          <nav className="space-y-0.5">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={`/~/settings/${t.to}`}
                className={({ isActive }) =>
                  `block rounded-md px-2.5 py-1.5 text-sm ${isActive ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
