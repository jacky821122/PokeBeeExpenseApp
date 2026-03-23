export const CATEGORIES = ["食材", "包材", "設備", "雜項"] as const;

export const UNITS = ["個", "份", "顆", "斤", "公克", "包"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];
