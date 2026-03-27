"use client";

import { useState } from "react";
import StatsView from "@/components/StatsView";
import type { Expense } from "@/types/expense";

// ─── Shared mock data ────────────────────────────────────────────

function MockForm({ inputClass, btnClass }: { inputClass: string; btnClass: string }) {
  return (
    <div className="space-y-3 opacity-70">
      <input className={inputClass} value="2026-03-27" readOnly />
      <input className={inputClass} value="菜" readOnly />
      <input className={inputClass} value="花椰菜" readOnly />
      <div className="grid grid-cols-2 gap-3">
        <input className={inputClass} value="2" readOnly />
        <input className={inputClass} value="斤" readOnly />
      </div>
      <input className={inputClass} value="120" readOnly />
      <button className={btnClass} disabled>送出</button>
    </div>
  );
}

function RecentTable({ expenses, rowEvenClass }: { expenses: Expense[]; rowEvenClass?: string }) {
  const recent = expenses.slice(0, 10);
  return recent.length === 0 ? (
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
            <th className="pb-2 text-right">總價</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((e, i) => (
            <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? rowEvenClass ?? "" : ""}`}>
              <td className="py-2 pr-3 whitespace-nowrap">{e.date}</td>
              <td className="py-2 pr-3">{e.category}</td>
              <td className="py-2 pr-3">{e.item}</td>
              <td className="py-2 pr-3 text-right">{e.quantity}</td>
              <td className="py-2 text-right">{e.total_price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Theme A: Warm & Friendly ────────────────────────────────────

export function WarmPreview({ expenses }: { expenses: Expense[] }) {
  const [tab, setTab] = useState<"record" | "stats">("record");

  const inputClass =
    "w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-base text-gray-500";
  const btnClass =
    "w-full rounded-xl bg-amber-500 py-4 text-lg font-semibold text-white";

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden">
      <p className="bg-gray-100 py-1 text-center text-xs text-gray-400">Warm & Friendly 預覽</p>

      {/* Header */}
      <div className="bg-amber-500 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🐝</span>
        <div>
          <h1 className="text-lg font-bold text-white">pokebee 支出記錄</h1>
        </div>
      </div>

      <div className="bg-stone-50 px-4 py-4">
        {/* Tab switcher */}
        <div className="mb-5 flex gap-1 rounded-xl bg-amber-100/60 p-1">
          {(["record", "stats"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-amber-600/60 hover:text-amber-700"
              }`}
            >
              {t === "record" ? "記錄" : "統計"}
            </button>
          ))}
        </div>

        {tab === "record" ? (
          <div className="space-y-5">
            {/* Form card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">記錄支出</h2>
              <MockForm inputClass={inputClass} btnClass={btnClass} />
            </div>

            {/* Recent entries card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">最近記錄</h2>
              <RecentTable expenses={expenses} rowEvenClass="bg-amber-50/40" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <StatsView expenses={expenses} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Theme B: Clean & Modern ─────────────────────────────────────

export function CleanPreview({ expenses }: { expenses: Expense[] }) {
  const [tab, setTab] = useState<"record" | "stats">("record");

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-500";
  const btnClass =
    "w-full rounded-lg bg-blue-600 py-4 text-lg font-semibold text-white";

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
      <p className="bg-gray-100 py-1 text-center text-xs text-gray-400">Clean & Modern 預覽</p>

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-blue-600">pokebee <span className="font-normal text-gray-400">支出記錄</span></h1>
        <div className="h-2 w-2 rounded-full bg-green-400" title="connected" />
      </div>

      <div className="bg-gray-50 px-4 py-4">
        {/* Tab switcher */}
        <div className="mb-5 flex gap-1 rounded-lg bg-gray-100 p-1">
          {(["record", "stats"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "record" ? "記錄" : "統計"}
            </button>
          ))}
        </div>

        {tab === "record" ? (
          <div className="space-y-4">
            {/* Form card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">記錄支出</h2>
              <MockForm inputClass={inputClass} btnClass={btnClass} />
            </div>

            {/* Recent entries card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">最近記錄</h2>
              <RecentTable expenses={expenses} rowEvenClass="bg-gray-50/60" />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <StatsView expenses={expenses} />
          </div>
        )}
      </div>
    </div>
  );
}
