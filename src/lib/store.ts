
/**
 * Multi-store infrastructure (preparation).
 *
 * Currently the app runs in single-store mode.
 * When multi-store is enabled in the future, set the STORES env var as a JSON
 * string mapping storeId → Google Sheet ID, e.g.:
 *
 *   STORES='{"main":"1abc...","branch1":"1xyz..."}'
 *
 * Until then, everything falls back to the existing SHEET_ID env var.
 */

export const DEFAULT_STORE_ID = "main";

export interface StoreConfig {
  id: string;
  sheetId: string;
  sheetGid: number;
  label: string; // Human-readable name, e.g. "台北本店"
}

/**
 * Parse the STORES env var (JSON) into a map.
 * Falls back to a single entry built from SHEET_ID / SHEET_GID.
 */
export function getStoreConfigs(): Record<string, StoreConfig> {
  const raw = process.env.STORES;

  if (raw) {
    try {
      const parsed: Record<string, { sheetId: string; sheetGid?: number; label?: string }> =
        JSON.parse(raw);
      const result: Record<string, StoreConfig> = {};
      for (const [id, cfg] of Object.entries(parsed)) {
        result[id] = {
          id,
          sheetId: cfg.sheetId,
          sheetGid: cfg.sheetGid ?? 0,
          label: cfg.label ?? id,
        };
      }
      return result;
    } catch {
      console.error("Failed to parse STORES env var, falling back to SHEET_ID");
    }
  }

  // Fallback: single-store mode using existing env vars
  return {
    [DEFAULT_STORE_ID]: {
      id: DEFAULT_STORE_ID,
      sheetId: process.env.SHEET_ID!,
      sheetGid: parseInt(process.env.SHEET_GID ?? "0", 10),
      label: "本店",
    },
  };
}

/**
 * Resolve a storeId to its Sheet config.
 * If storeId is undefined/null, returns the default store.
 */
export function resolveStore(storeId?: string | null): StoreConfig {
  const configs = getStoreConfigs();
  const id = storeId ?? DEFAULT_STORE_ID;
  const config = configs[id];
  if (!config) {
    throw new Error(`Unknown store: ${id}`);
  }
  return config;
}

/**
 * Check if multi-store mode is active.
 */
export function isMultiStoreEnabled(): boolean {
  return !!process.env.STORES;
}
