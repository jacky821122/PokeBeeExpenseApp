"use client";

import { useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import RecentEntries from "@/components/RecentEntries";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">記錄支出</h1>

      <ExpenseForm onSuccess={() => setRefreshKey((k) => k + 1)} />

      <hr className="my-8 border-gray-200" />

      <h2 className="mb-4 text-lg font-semibold">最近記錄</h2>
      <RecentEntries refreshKey={refreshKey} />
    </main>
  );
}
