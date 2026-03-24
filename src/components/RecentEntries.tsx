"use client";

import { useEffect, useState } from "react";
import type { Expense } from "@/types/expense";

interface RecentEntriesProps {
  refreshKey: number;
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

export default function RecentEntries({ refreshKey }: RecentEntriesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

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

  return (
    <div>
      {/* Month filter tabs */}
      <div className="mb-4 flex gap-2">
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
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
  );
}
