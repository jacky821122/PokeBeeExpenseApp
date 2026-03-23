"use client";

import { useState } from "react";
import { CATEGORIES, UNITS } from "@/lib/constants";

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface ExpenseFormProps {
  onSuccess: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [date, setDate] = useState(getTodayString());
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>(UNITS[0]);
  const [unitPrice, setUnitPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setToast(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          item: item.trim(),
          quantity: Number(quantity),
          unit,
          unit_price: Number(unitPrice),
          supplier: supplier.trim(),
          purchaser: purchaser.trim(),
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "儲存失敗");
      }

      // Reset form but keep category, purchaser, date
      setItem("");
      setQuantity("1");
      setUnit(UNITS[0]);
      setUnitPrice("");
      setSupplier("");
      setNote("");

      setToast("已儲存");
      setTimeout(() => setToast(null), 2000);
      onSuccess();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "儲存失敗");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "min-w-0 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div>
        <label className={labelClass}>日期</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>類別</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
          required
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Item */}
      <div>
        <label className={labelClass}>品項</label>
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="例：雞胸肉"
          className={inputClass}
          required
        />
      </div>

      {/* Quantity + Unit (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>數量</label>
          <input
            type="number"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0.01"
            step="any"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>單位</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={inputClass}
            required
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unit Price */}
      <div>
        <label className={labelClass}>單價</label>
        <input
          type="number"
          inputMode="decimal"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="0"
          min="0"
          step="any"
          className={inputClass}
          required
        />
      </div>

      {/* Optional fields */}
      <div>
        <label className={labelClass}>
          來源 <span className="text-gray-400">(選填)</span>
        </label>
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="例：全聯、Costco"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          購買人 <span className="text-gray-400">(選填)</span>
        </label>
        <input
          type="text"
          value={purchaser}
          onChange={(e) => setPurchaser(e.target.value)}
          placeholder="例：小明"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          備註 <span className="text-gray-400">(選填)</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 py-4 text-lg font-semibold text-white active:bg-blue-700 disabled:bg-gray-400"
      >
        {submitting ? "儲存中..." : "送出"}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-center text-sm font-medium ${
            toast === "已儲存"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast}
        </div>
      )}
    </form>
  );
}
