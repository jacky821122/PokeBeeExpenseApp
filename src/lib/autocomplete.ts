const MAX_CACHE = 20;

export function getCachedValues(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`autocomplete:${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCachedValue(key: string, value: string): void {
  if (typeof window === "undefined" || !value.trim()) return;
  try {
    const existing = getCachedValues(key).filter((v) => v !== value);
    const updated = [value, ...existing].slice(0, MAX_CACHE);
    localStorage.setItem(`autocomplete:${key}`, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}
