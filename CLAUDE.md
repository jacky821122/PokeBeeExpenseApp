# PokeBee Expense — Playbook

## Add/remove category

1. `src/lib/constants.ts` → `CATEGORIES` array (keep 雜項 last)
2. Optionally add fallback items in `ITEMS_BY_CATEGORY` (same file)
3. Remind user to add items in Google Sheet `Items` tab
4. Requires redeploy

## Add/remove items

No code change. Use `/admin` UI or edit Sheet `Items` tab directly.
`ITEMS_BY_CATEGORY` in constants.ts is fallback only.

## Add/remove units

`src/lib/constants.ts` → `UNITS` array. Requires redeploy.

## Modify stats report (/admin stats tab)

File: `src/app/admin/AdminTabs.tsx`

Current sections (in order):
1. Monthly spend (last 6 months) — table
2. Category breakdown — recharts donut PieChart, hover = amount + %
3. Top 10 items by total spend — table (item | category | total)
4. Top suppliers — table (supplier | total)

Stats logic: `build*()` helpers in same file. Add section = add helper + `<section>` in `StatsTab`.

## Modify expense form

File: `src/components/ExpenseForm.tsx`

Field order: date → category → item → qty+unit → qty buttons → total_price → supplier → purchaser → note.
Item combobox: fetches `/api/items` on mount, falls back to `ITEMS_BY_CATEGORY`.
Purchaser autocomplete: fetches `/api/purchasers` + merges localStorage.
After submit keeps: category, purchaser, date. Resets: item, qty→1, unit→first, totalPrice, supplier, note.

## Modify recent entries list

File: `src/components/RecentEntries.tsx`

Month filter tabs (all + last 3 months). Shows count + sum when filtered.
Undo button: session-bound, 15-min window, matched by `created_at`.

## Add new API route

Path: `src/app/api/{name}/route.ts`. Sheets I/O in `src/lib/sheets.ts`.
Admin-only routes: check `Authorization: Bearer $STATS_SECRET`.

## Constraints

- **Heterogeneous units**: mix of weight (斤/公克), count (個/顆), packaging (包/組/份). unit_price is NOT comparable across items. Do not build unit-price rankings.
- **No user auth**: main app is open. Only `/admin` page and items write API are protected by `STATS_SECRET`.
- **Google Sheet = sole data store**: app is stateless.
