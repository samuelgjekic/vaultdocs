import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const tabs = [
  { to: "users", label: "Users" },
  { to: "organizations", label: "Organizations" },
  { to: "settings", label: "Settings" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border h-14 flex items-center px-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <span className="ml-4 text-sm font-medium">Installation admin</span>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
        <aside>
          <nav className="space-y-0.5">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={`/~/admin/${t.to}`}
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
