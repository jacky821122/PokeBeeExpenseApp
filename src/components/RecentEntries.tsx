"use client";

import { useEffect, useState } from "react";
import type { Expense } from "@/types/expense";
import type { UndoableEntry } from "@/app/page";

interface RecentEntriesProps {
  refreshKey: number;
  undoable: UndoableEntry[];
  onUndo: (row_index: number) => Promise<void>;
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

export default function RecentEntries({ refreshKey, undoable, onUndo }: RecentEntriesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [undoing, setUndoing] = useState<string | null>(null);

  const monthFilters = getMonthFilters();

  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      try {
        const res = await fetch("/api/expenses");
        if (res.ok) {
          const data = await res.json();
          setExpenses(data);
        }
      } catch {
        // Silently fail — display table is auxiliary
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, [refreshKey]);

  const filtered =
    activeFilter === "all"
      ? expenses
      : expenses.filter((e) => e.date.startsWith(activeFilter));

  const monthTotal = activeFilter !== "all"
    ? filtered.reduce((sum, e) => sum + e.total_price, 0)
    : null;

  const undoableSet = new Set(undoable.map((u) => u.created_at));

  async function handleUndo(e: Expense) {
    const entry = undoable.find((u) => u.created_at === e.created_at);
    if (!entry || undoing) return;
    setUndoing(e.created_at);
    await onUndo(entry.row_index);
    setUndoing(null);
  }

  return (
    <div>
      {/* Month filter tabs */}
      <div className="mb-3 flex gap-2">
        {monthFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? "bg-amber-500 text-white"
                : "bg-amber-100/60 text-amber-700 active:bg-amber-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Monthly summary */}
      {monthTotal !== null && !loading && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-amber-50/40 px-4 py-2 text-sm text-gray-600">
          <span>共 {filtered.length} 筆</span>
          <span className="text-gray-300">|</span>
          <span className="font-medium text-gray-800">
            合計 ${monthTotal.toLocaleString()}
          </span>
        </div>
      )}

      {loading ? (
        <p className="py-4 text-center text-sm text-gray-400">載入中...</p>
      ) : filtered.length === 0 ? (
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
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const canUndo = undoableSet.has(e.created_at);
                return (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-amber-50/40" : ""}`}>
                    <td className="py-2 pr-3 whitespace-nowrap">{e.date}</td>
                    <td className="py-2 pr-3">{e.category}</td>
                    <td className="py-2 pr-3">{e.item}</td>
                    <td className="py-2 pr-3 text-right">{e.quantity}</td>
                    <td className="py-2 pr-3">{e.unit}</td>
                    <td className="py-2 text-right">{e.total_price}</td>
                    <td className="py-2 pl-2">
                      {canUndo && (
                        <button
                          onClick={() => handleUndo(e)}
                          disabled={undoing === e.created_at}
                          className="rounded px-2 py-0.5 text-xs text-red-500 border border-red-200 active:bg-red-50 disabled:opacity-50 whitespace-nowrap"
                        >
                          {undoing === e.created_at ? "..." : "撤回"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
