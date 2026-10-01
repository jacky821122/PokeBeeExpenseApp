export const CATEGORIES = [
  "肉及蛋白質",
  "海鮮",
  "菜",
  "水果",
  "醬料",
  "調味粉",
  "外帶耗材",
  "耗材",
  "主食",
  "勞健保",
  "電信費",
  "水電費",
  "雜項",
] as const;

export const UNITS = ["個", "顆", "斤", "公斤", "包", "組"] as const;

export const ITEMS_BY_CATEGORY: Record<string, readonly string[]> = {
  肉及蛋白質: ["梅花豬(斤)", "牛腱", "雞胸肉(斤)", "豆腐(組)", "雞蛋(斤)"],
  海鮮: ["蝦子(個)", "嚴選生鮭魚(公斤)", "生鮪魚(公斤)", "蝦卵(個)"],
  菜: ["花椰菜(組)", "玉米粒(組)", "紅蘿蔔(斤)", "杏鮑菇(包)", "毛豆仁(組)", "小黃瓜(斤)", "泡菜(斤)", "海帶絲(包)", "玉米筍(包)", "櫛瓜(斤)", "生菜(顆)", "黑豆(組)"],
  水果: ["蘋果(個)", "蕃茄(斤)"],
  醬料: ["是拉差", "美乃滋", "鰹魚醬油", "柴魚醬油", "和風芥末", "蜂蜜芥末", "胡麻醬", "泰式酸辣醬", "壽喜燒醬", "蜂蜜", "味琳", "米酒", "柚子醋"],
  調味粉: ["青花椒麻粉", "味島香鬆（素）", "味島香鬆", "七味粉", "蒜酥"],
  外帶耗材: ["紙碗", "塑膠蓋", "湯叉"],
  耗材: ["耐熱袋", "保鮮膜"],
  主食: ["米", "糙米"],
  勞健保: ["勞健保"],
  電信費: ["電信費"],
  水電費: ["水電費"],
};

export type Category = (typeof CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];

export function parseItemLabel(value: string): { name: string; unit: Unit | undefined } {
  const label = value.trim();
  const unit = UNITS.find((u) => label.endsWith(`(${u})`) || label.endsWith(`（${u}）`));
  return { name: unit ? label.slice(0, -unit.length - 2).trim() : label, unit };
}

const ITEM_ALIASES: Record<string, string> = {
  鮭魚: "嚴選生鮭魚",
  鮪魚: "生鮪魚",
  節瓜: "櫛瓜",
  番茄: "蕃茄",
};

// Reuse fallback labels as unit hints for names loaded from the Items sheet.
export function formatItemLabel(category: string, value: string): string {
  const { name, unit } = parseItemLabel(value);
  const fallback = ITEMS_BY_CATEGORY[category]?.find((item) => {
    const candidate = parseItemLabel(item).name;
    return candidate === name || candidate === ITEM_ALIASES[name];
  });
  const hint = unit ?? parseItemLabel(fallback ?? "").unit;
  return hint ? `${name}(${hint})` : name;
}
