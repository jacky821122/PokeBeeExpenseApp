"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import StatsView from "@/components/StatsView";
import type { Expense } from "@/types/expense";

// ─── Items Tab ───────────────────────────────────────────────────

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

const TAB_LABELS: Record<string, string> = {
  stats: "統計",
  items: "品項管理",
};

type TabKey = keyof typeof TAB_LABELS;

export default function AdminTabs({ secretKey, expenses, initialItems }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("stats");

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
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
        <StatsView expenses={expenses} />
      ) : (
        <ItemsTab secretKey={secretKey} initialItems={initialItems} />
      )}
    </div>
  );
}
