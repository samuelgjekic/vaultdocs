import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  apply: () => void;
}

const resolved = (t: Theme): "light" | "dark" => {
  if (t === "system") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return t;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (t) => {
        set({ theme: t });
        document.documentElement.setAttribute("data-theme", resolved(t));
      },
      apply: () => {
        document.documentElement.setAttribute("data-theme", resolved(get().theme));
      },
    }),
    { name: "vaultdocs-theme" }
  )
);
