"use client";

import { useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import RecentEntries from "@/components/RecentEntries";

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          <h1 className="text-xl font-bold">記錄支出</h1>
          <ChevronIcon open={showForm} />
        </button>

        <button
          onClick={handleRefresh}
          title="重新整理"
          className={`rounded-full p-2 transition-colors ${
            refreshing
              ? "text-blue-500"
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

      {showForm && <ExpenseForm onSuccess={() => setRefreshKey((k) => k + 1)} />}

      <hr className="my-8 border-gray-200" />

      {/* Collapsible recent entries */}
      <button
        onClick={() => setShowRecent((v) => !v)}
        className="mb-4 flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold">最近記錄</h2>
        <ChevronIcon open={showRecent} />
      </button>

      {showRecent && <RecentEntries refreshKey={refreshKey} />}
    </main>
  );
}
