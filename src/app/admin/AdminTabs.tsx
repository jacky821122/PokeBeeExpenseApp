"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CATEGORIES } from "@/lib/constants";
import type { Expense } from "@/types/expense";

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6b7280",
];

// ─── Stats helpers ───────────────────────────────────────────────

function formatMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

function getMonthKey(date: string) {
  return date.slice(0, 7); // "YYYY-MM"
}

function buildMonthlyStats(expenses: Expense[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    const k = getMonthKey(e.date);
    map[k] = (map[k] ?? 0) + e.total_price;
  }
  return Object.entries(map)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6);
}

function buildCategoryStats(expenses: Expense[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] ?? 0) + e.total_price;
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? (amt / total) * 100 : 0 }));
}

function buildItemStats(expenses: Expense[]) {
  const map: Record<string, { category: string; total: number }> = {};
  for (const e of expenses) {
    if (!map[e.item]) map[e.item] = { category: e.category, total: 0 };
    map[e.item].total += e.total_price;
  }
  return Object.entries(map)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([item, { category, total }]) => ({ item, category, total }));
}

function buildSupplierStats(expenses: Expense[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    if (e.supplier) map[e.supplier] = (map[e.supplier] ?? 0) + e.total_price;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

// ─── Sub-components ──────────────────────────────────────────────

function StatsTab({ expenses }: { expenses: Expense[] }) {
  const monthly = buildMonthlyStats(expenses);
  const byCategory = buildCategoryStats(expenses);
  const byItem = buildItemStats(expenses);
  const bySupplier = buildSupplierStats(expenses);
  return (
    <div className="space-y-8">
      {/* Monthly */}
      <section>
        <h3 className="mb-3 font-semibold text-gray-700">月支出（近 6 個月）</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-1 pr-4">月份</th>
              <th className="pb-1 text-right">合計</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map(([month, amt]) => (
              <tr key={month} className="border-b border-gray-100">
                <td className="py-1.5 pr-4">{month}</td>
                <td className="py-1.5 text-right font-medium">{formatMoney(amt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Category breakdown */}
      <section>
        <h3 className="mb-3 font-semibold text-gray-700">類別分佈</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={byCategory.map(({ cat, amt }) => ({ name: cat, value: amt }))}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
            >
              {byCategory.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const { name, value } = payload[0];
                const total = byCategory.reduce((s, c) => s + c.amt, 0);
                const pct = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : "0";
                return (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-sm">
                    <p className="font-medium text-gray-800">{name}</p>
                    <p className="text-gray-600">{formatMoney(Number(value))} ({pct}%)</p>
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Top items */}
      <section>
        <h3 className="mb-3 font-semibold text-gray-700">支出前 10 品項</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-1 pr-4">品項</th>
              <th className="pb-1 pr-4">類別</th>
              <th className="pb-1 text-right">合計</th>
            </tr>
          </thead>
          <tbody>
            {byItem.map(({ item, category, total }) => (
              <tr key={item} className="border-b border-gray-100">
                <td className="py-1.5 pr-4">{item}</td>
                <td className="py-1.5 pr-4 text-gray-500">{category}</td>
                <td className="py-1.5 text-right">{formatMoney(total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Top suppliers */}
      {bySupplier.length > 0 && (
        <section>
          <h3 className="mb-3 font-semibold text-gray-700">主要來源</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-1 pr-4">來源</th>
                <th className="pb-1 text-right">合計</th>
              </tr>
            </thead>
            <tbody>
              {bySupplier.map(([supplier, amt]) => (
                <tr key={supplier} className="border-b border-gray-100">
                  <td className="py-1.5 pr-4">{supplier}</td>
                  <td className="py-1.5 text-right">{formatMoney(amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function ItemsTab({
  secretKey,
  initialItems,
}: {
  secretKey: string;
  initialItems: Record<string, string[]>;
}) {
  const [items, setItems] = useState<Record<string, string[]>>(initialItems);
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(category: string) {
    const name = (newItem[category] ?? "").trim();
    if (!name) return;
    setLoading(`add-${category}`);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify({ category, item: name }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "新增失敗");
      }
      setItems((prev) => ({
        ...prev,
        [category]: [...(prev[category] ?? []), name],
      }));
      setNewItem((prev) => ({ ...prev, [category]: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove(category: string, item: string) {
    setLoading(`remove-${category}-${item}`);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify({ category, item }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "刪除失敗");
      }
      setItems((prev) => ({
        ...prev,
        [category]: (prev[category] ?? []).filter((i) => i !== item),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {CATEGORIES.map((cat) => (
        <div key={cat} className="rounded-lg border border-gray-200 p-4">
          <h3 className="mb-3 font-semibold text-gray-700">{cat}</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {(items[cat] ?? []).map((item) => (
              <span
                key={item}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
              >
                {item}
                <button
                  onClick={() => handleRemove(cat, item)}
                  disabled={loading === `remove-${cat}-${item}`}
                  className="ml-0.5 text-gray-400 hover:text-red-500 disabled:opacity-40"
                  aria-label={`刪除 ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
            {(items[cat] ?? []).length === 0 && (
              <span className="text-sm text-gray-400">（無品項）</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem[cat] ?? ""}
              onChange={(e) => setNewItem((prev) => ({ ...prev, [cat]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAdd(cat)}
              placeholder="新品項名稱"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              onClick={() => handleAdd(cat)}
              disabled={loading === `add-${cat}` || !(newItem[cat] ?? "").trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-gray-300"
            >
              {loading === `add-${cat}` ? "..." : "新增"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main AdminTabs ───────────────────────────────────────────────

interface AdminTabsProps {
  secretKey: string;
  expenses: Expense[];
  initialItems: Record<string, string[]>;
}

function MockRecordTab({ expenses }: { expenses: Expense[] }) {
  const recent = expenses.slice(0, 15);
  const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-400 bg-gray-50";

  return (
    <div className="space-y-6">
      {/* Mock form */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold">記錄支出</h2>
          <span className="text-xs text-gray-400">(preview)</span>
        </div>
        <div className="space-y-3 opacity-60">
          <input className={inputClass} value="2026-03-26" readOnly />
          <input className={inputClass} value="菜" readOnly />
          <input className={inputClass} value="花椰菜" readOnly />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} value="2" readOnly />
            <input className={inputClass} value="斤" readOnly />
          </div>
          <input className={inputClass} value="120" readOnly />
          <button className="w-full rounded-lg bg-gray-400 py-4 text-lg font-semibold text-white" disabled>
            送出
          </button>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Real recent entries (read-only) */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">最近記錄</h2>
        {recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">尚無記錄</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-3">日期</th>
                  <th className="pb-2 pr-3">類別</th>
                  <th className="pb-2 pr-3">品項</th>
                  <th className="pb-2 pr-3 text-right">數量</th>
                  <th className="pb-2 pr-3">單位</th>
                  <th className="pb-2 text-right">總價</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-3 whitespace-nowrap">{e.date}</td>
                    <td className="py-2 pr-3">{e.category}</td>
                    <td className="py-2 pr-3">{e.item}</td>
                    <td className="py-2 pr-3 text-right">{e.quantity}</td>
                    <td className="py-2 pr-3">{e.unit}</td>
                    <td className="py-2 text-right">{e.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmbedPreview({ expenses }: { expenses: Expense[] }) {
  const [previewTab, setPreviewTab] = useState<"record" | "stats">("record");

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border-2 border-dashed border-gray-300 bg-white p-4">
      <p className="mb-4 text-center text-xs text-gray-400">── 主頁嵌入預覽 (max-w-lg) ──</p>

      {/* Page-level tab switcher */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["record", "stats"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setPreviewTab(tab)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              previewTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "record" ? "記錄" : "統計"}
          </button>
        ))}
      </div>

      {previewTab === "record" ? (
        <MockRecordTab expenses={expenses} />
      ) : (
        <StatsTab expenses={expenses} />
      )}
    </div>
  );
}

const TAB_LABELS: Record<string, string> = {
  stats: "統計",
  items: "品項管理",
  preview: "嵌入預覽",
};

export default function AdminTabs({ secretKey, expenses, initialItems }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "items" | "preview">("stats");

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["stats", "items", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "stats" ? (
        <StatsTab expenses={expenses} />
      ) : activeTab === "items" ? (
        <ItemsTab secretKey={secretKey} initialItems={initialItems} />
      ) : (
        <EmbedPreview expenses={expenses} />
      )}
    </div>
  );
}
