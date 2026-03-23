"use client";

import { useEffect, useState } from "react";
import type { Expense } from "@/types/expense";

interface RecentEntriesProps {
  refreshKey: number;
}

export default function RecentEntries({ refreshKey }: RecentEntriesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="py-4 text-center text-sm text-gray-400">載入中...</p>;
  }

  if (expenses.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">尚無記錄</p>;
  }

  return (
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
          {expenses.map((e, i) => (
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
  );
}
