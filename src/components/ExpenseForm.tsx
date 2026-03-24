"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, UNITS } from "@/lib/constants";
import { getCachedValues, addCachedValue } from "@/lib/autocomplete";

const PRESET_ITEMS = ["雞胸肉", "花椰菜", "垃圾袋"];

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
  const [totalPrice, setTotalPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [itemOptions, setItemOptions] = useState<string[]>(PRESET_ITEMS);
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);
  const [purchaserOptions, setPurchaserOptions] = useState<string[]>([]);

  useEffect(() => {
    const cachedItems = getCachedValues("item");
    const merged = [...PRESET_ITEMS, ...cachedItems.filter((v) => !PRESET_ITEMS.includes(v))];
    setItemOptions(merged);
    setSupplierOptions(getCachedValues("supplier"));
    setPurchaserOptions(getCachedValues("purchaser"));
  }, []);

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
          total_price: Number(totalPrice),
          supplier: supplier.trim(),
          purchaser: purchaser.trim(),
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "儲存失敗");
      }

      // Save to autocomplete cache
      if (item.trim()) {
        addCachedValue("item", item.trim());
        const cachedItems = getCachedValues("item");
        setItemOptions([...PRESET_ITEMS, ...cachedItems.filter((v) => !PRESET_ITEMS.includes(v))]);
      }
      if (supplier.trim()) {
        addCachedValue("supplier", supplier.trim());
        setSupplierOptions(getCachedValues("supplier"));
      }
      if (purchaser.trim()) {
        addCachedValue("purchaser", purchaser.trim());
        setPurchaserOptions(getCachedValues("purchaser"));
      }

      // Reset form but keep category, purchaser, date
      setItem("");
      setQuantity("1");
      setUnit(UNITS[0]);
      setTotalPrice("");
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

      {/* Item — combobox with datalist */}
      <div>
        <label className={labelClass}>品項</label>
        <input
          type="text"
          list="item-options"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="例：雞胸肉"
          className={inputClass}
          required
        />
        <datalist id="item-options">
          {itemOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
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

      {/* Total Price */}
      <div>
        <label className={labelClass}>總價</label>
        <input
          type="number"
          inputMode="decimal"
          value={totalPrice}
          onChange={(e) => setTotalPrice(e.target.value)}
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
          list="supplier-options"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="例：全聯、Costco"
          className={inputClass}
        />
        <datalist id="supplier-options">
          {supplierOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>

      <div>
        <label className={labelClass}>
          購買人 <span className="text-gray-400">(選填)</span>
        </label>
        <input
          type="text"
          list="purchaser-options"
          value={purchaser}
          onChange={(e) => setPurchaser(e.target.value)}
          placeholder="例：小明"
          className={inputClass}
        />
        <datalist id="purchaser-options">
          {purchaserOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
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
