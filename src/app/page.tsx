"use client";

import { useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import RecentEntries from "@/components/RecentEntries";
import StatsView from "@/components/StatsView";
import type { Expense } from "@/types/expense";

export type UndoableEntry = {
  row_index: number;
  created_at: string;
  item: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"record" | "stats">("record");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [undoable, setUndoable] = useState<UndoableEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Fetch expenses for stats tab
  useEffect(() => {
    if (activeTab !== "stats") return;
    fetch("/api/expenses")
      .then((r) => (r.ok ? r.json() : []))
      .then(setExpenses)
      .catch(() => {});
  }, [activeTab, refreshKey]);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => window.location.reload(), 600);
  }

  function handleSuccess(expense: Expense) {
    setRefreshKey((k) => k + 1);
    if (expense.row_index) {
      const entry: UndoableEntry = {
        row_index: expense.row_index,
        created_at: expense.created_at,
        item: expense.item,
      };
      setUndoable((prev) => [...prev, entry]);
      setTimeout(() => {
        setUndoable((prev) => prev.filter((e) => e.created_at !== entry.created_at));
      }, 15 * 60 * 1000);
    }
  }

  async function handleUndo(row_index: number) {
    const entry = undoable.find((e) => e.row_index === row_index);
    if (!entry) return;

    try {
      const res = await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row_index, created_at: entry.created_at }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "撤回失敗");
        return;
      }
      setUndoable((prev) => prev.filter((e) => e.row_index !== row_index));
      setRefreshKey((k) => k + 1);
    } catch {
      alert("撤回失敗，請稍後再試");
    }
  }

  return (
    <div className="min-h-dvh">
      {/* Amber header */}
      <div className="bg-amber-500 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🐝</span>
        <h1 className="text-lg font-bold text-white">pokebee 支出記錄</h1>
      </div>

      <main className="mx-auto w-full max-w-lg px-4 py-5">
        {/* Tab switcher */}
        <div className="mb-5 flex gap-1 rounded-xl bg-amber-100/60 p-1">
          {(["record", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-amber-600/60 hover:text-amber-700"
              }`}
            >
              {tab === "record" ? "記錄" : "統計"}
            </button>
          ))}
        </div>

        {activeTab === "record" ? (
          <div className="space-y-5">
            {/* Form card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="flex items-center gap-2 text-left"
                >
                  <h2 className="text-lg font-semibold text-gray-800">記錄支出</h2>
                  <ChevronIcon open={showForm} />
                </button>

                <button
                  onClick={handleRefresh}
                  title="重新整理"
                  className={`rounded-full p-2 transition-colors ${
                    refreshing
                      ? "text-amber-500"
                      : "text-gray-400 active:bg-gray-100 active:text-gray-600"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={refreshing ? "animate-spin" : ""}
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                </button>
              </div>

              {showForm && <ExpenseForm onSuccess={handleSuccess} />}
            </div>

            {/* Recent entries card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <button
                onClick={() => setShowRecent((v) => !v)}
                className="mb-4 flex w-full items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-gray-800">最近記錄</h2>
                <ChevronIcon open={showRecent} />
              </button>

              {showRecent && (
                <RecentEntries
                  refreshKey={refreshKey}
                  undoable={undoable}
                  onUndo={handleUndo}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <StatsView expenses={expenses} />
          </div>
        )}
      </main>
    </div>
  );
}
