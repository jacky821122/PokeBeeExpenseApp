"use client";

import { useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import RecentEntries from "@/components/RecentEntries";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRecent, setShowRecent] = useState(true);

  function handleRefresh() {
    window.location.reload();
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      {/* Header with refresh button */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">記錄支出</h1>
        <button
          onClick={handleRefresh}
          title="重新整理"
          className="rounded-full p-2 text-gray-400 transition-colors active:bg-gray-100 active:text-gray-600"
        >
          {/* Refresh icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </div>

      <ExpenseForm onSuccess={() => setRefreshKey((k) => k + 1)} />

      <hr className="my-8 border-gray-200" />

      {/* Collapsible recent entries */}
      <button
        onClick={() => setShowRecent((v) => !v)}
        className="mb-4 flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold">最近記錄</h2>
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
          className={`text-gray-400 transition-transform duration-200 ${showRecent ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {showRecent && <RecentEntries refreshKey={refreshKey} />}
    </main>
  );
}
