"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { apiFetch } from "@/lib/apiFetch";

interface ItemsManagerProps {
  secretKey: string;
  initialItems: Record<string, string[]>;
  onClose: () => void;
}

export default function ItemsManager({ secretKey, initialItems, onClose }: ItemsManagerProps) {
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
      const res = await apiFetch("/api/items", {
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
      const res = await apiFetch("/api/items", {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">🔧 品項管理</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-5 max-h-[70vh] overflow-y-auto">
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
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  onClick={() => handleAdd(cat)}
                  disabled={loading === `add-${cat}` || !(newItem[cat] ?? "").trim()}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:bg-gray-300"
                >
                  {loading === `add-${cat}` ? "..." : "新增"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
