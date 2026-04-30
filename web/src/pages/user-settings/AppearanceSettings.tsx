import { useThemeStore } from "@/store/theme";
import { Sun, Moon, Monitor } from "lucide-react";
import { SectionTitle } from "../space-settings/GeneralSettings";

const opts = [
  { v: "light", label: "Light", icon: Sun },
  { v: "dark", label: "Dark", icon: Moon },
  { v: "system", label: "System", icon: Monitor },
] as const;

export default function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore();
  return (
    <div className="space-y-4 max-w-xl">
      <SectionTitle title="Theme" subtitle="Choose how VaultDocs looks." />
      <div className="grid grid-cols-3 gap-3">
        {opts.map((o) => (
          <button
            key={o.v}
            onClick={() => setTheme(o.v)}
            className={`p-4 rounded-lg border text-center transition-colors ${theme === o.v ? "border-primary bg-primary-soft" : "border-border hover:border-foreground/20"}`}
          >
            <o.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{o.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
