import assert from "node:assert/strict";
import { test } from "vitest";
import { ITEMS_BY_CATEGORY, formatItemLabel, parseItemLabel } from "../constants";

test("item hints work for Sheet names and fallback labels without changing stored names", () => {
  const expected = {
    肉及蛋白質: { 雞蛋: "斤", 梅花豬: "斤", 雞胸肉: "斤", 豆腐: "組" },
    海鮮: { 鮭魚: "公斤", 嚴選生鮭魚: "公斤", 鮪魚: "公斤", 生鮪魚: "公斤", 蝦子: "個", 蝦卵: "個" },
    菜: { 花椰菜: "組", 玉米粒: "組", 紅蘿蔔: "斤", 杏鮑菇: "包", 毛豆仁: "組", 小黃瓜: "斤", 泡菜: "斤", 海帶絲: "包", 玉米筍: "包", 節瓜: "斤", 櫛瓜: "斤", 生菜: "顆", 黑豆: "組" },
    水果: { 蘋果: "個", 番茄: "斤", 蕃茄: "斤" },
  };
  for (const [category, items] of Object.entries(expected)) {
    for (const [name, unit] of Object.entries(items)) {
      const label = formatItemLabel(category, name);
      assert.equal(label, `${name}(${unit})`);
      assert.equal(formatItemLabel(category, label), label);
      assert.deepEqual(parseItemLabel(label), { name, unit });
    }
  }
  assert(ITEMS_BY_CATEGORY.菜.includes("生菜(顆)"));
  assert(ITEMS_BY_CATEGORY.菜.includes("黑豆(組)"));
  assert(ITEMS_BY_CATEGORY.醬料.includes("柚子醋"));
  assert.equal(formatItemLabel("肉及蛋白質", "牛腱"), "牛腱");
  assert.equal(formatItemLabel("醬料", "柚子醋"), "柚子醋");
  assert.equal(formatItemLabel("雜項", "雞蛋"), "雞蛋");
  assert.equal(formatItemLabel("肉及蛋白質", "雞蛋（個）"), "雞蛋(個)");
  assert.deepEqual(parseItemLabel("  雞蛋 （斤）  "), { name: "雞蛋", unit: "斤" });
  for (const name of ["", "味島香鬆（素）", "新品項(公克)", "新品項(份)", "新品項(未知)"]) {
    assert.deepEqual(parseItemLabel(name), { name, unit: undefined });
  }
});
