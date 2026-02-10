const STORAGE_KEY = "portfolio_unlocks";

export type UnlockId = "glitch_theme" | "editor" | "channels";

export function getUnlocks(): Set<UnlockId> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return new Set();
    return new Set(JSON.parse(saved) as UnlockId[]);
  } catch {
    return new Set();
  }
}

export function hasUnlock(id: UnlockId): boolean {
  return getUnlocks().has(id);
}

export function grantUnlock(id: UnlockId): void {
  if (typeof window === "undefined") return;
  const unlocks = getUnlocks();
  unlocks.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(unlocks)));
}

export function clearUnlocks(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
