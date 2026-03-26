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
import type { Expense } from "@/types/expense";

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6b7280",
];

function formatMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

function getMonthFilters(): { label: string; value: string }[] {
  const now = new Date();
  const filters: { label: string; value: string }[] = [{ label: "全部", value: "all" }];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    filters.push({ label: `${d.getMonth() + 1}月`, value });
  }
  return filters;
}

function buildMonthlyStats(expenses: Expense[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    const k = e.date.slice(0, 7);
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

export default function StatsView({ expenses }: { expenses: Expense[] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const monthFilters = getMonthFilters();

  const monthly = buildMonthlyStats(expenses);

  // Filter expenses for category/items/suppliers sections
  const filtered = activeFilter === "all"
    ? expenses
    : expenses.filter((e) => e.date.startsWith(activeFilter));

  const byCategory = buildCategoryStats(filtered);
  const byItem = buildItemStats(filtered);
  const bySupplier = buildSupplierStats(filtered);

  if (expenses.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">尚無資料</p>;
  }

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

      {/* Month filter for sections below */}
      <div className="flex gap-2">
        {monthFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 active:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category breakdown */}
      <section>
        <h3 className="mb-3 font-semibold text-gray-700">類別分佈</h3>
        {byCategory.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">無資料</p>
        ) : (
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
        )}
      </section>

      {/* Top items */}
      <section>
        <h3 className="mb-3 font-semibold text-gray-700">支出前 10 品項</h3>
        {byItem.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">無資料</p>
        ) : (
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
        )}
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
