import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SpaceState {
  unlockedSpaces: string[];
  unlockSpace: (slug: string) => void;
  isUnlocked: (slug: string) => boolean;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set, get) => ({
      unlockedSpaces: [],
      unlockSpace: (slug) =>
        set((s) => ({ unlockedSpaces: Array.from(new Set([...s.unlockedSpaces, slug])) })),
      isUnlocked: (slug) => get().unlockedSpaces.includes(slug),
    }),
    { name: "vaultdocs-spaces" }
  )
);
