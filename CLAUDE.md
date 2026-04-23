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

Stats logic: `build*()` helpers in `src/components/StatsView.tsx`. Add section = add helper + `<section>` in `StatsView`.

## Modify expense form

File: `src/components/ExpenseForm.tsx`

Field order: date → category → item → qty+unit → qty buttons → total_price (with calculator) → supplier → purchaser → note.
Item combobox: fetches `/api/items` on mount, falls back to `ITEMS_BY_CATEGORY`.
Purchaser autocomplete: fetches `/api/purchasers` + merges localStorage.
After submit keeps: category, purchaser, date. Resets: item, qty→1, unit→first, totalPrice, supplier, note.

### Total price calculator

Self-contained component: `src/components/CalculatorInput.tsx`. Expression evaluator: `src/lib/evaluate.ts`.

- **Evaluator**: `evaluateExpression()` — shunting-yard algorithm with `+-*/()` and unary minus. Shared by CalculatorInput (preview) and ExpenseForm (submit validation).
- **Mobile**: input is `readOnly`, system keyboard suppressed. Calculator auto-opens on focus, closes on `=`.
- **Desktop**: input is editable (direct typing). Calculator toggles via button. `Enter` key = `=`.
- **Replace-after-equals**: pressing `=` replaces expression with result and sets `replaceOnNextInput` — next digit starts a new expression. Operator keys continue from the result.
- **Keypad layout**: 4-col × 5-row grid with CSS grid-template-areas. `+` spans 2 rows, `=` spans 2 cols. Layout: `←C÷×` / `789-` / `456[+]` / `123[+]` / `.0[==]`.
- **Live preview**: fixed-height `= result` line below input. Persists last valid result (e.g. `60+` still shows `= 60`). Resets only when input is cleared.
- **Touch handling**: `onPointerDown` records position, `onPointerUp` fires action only if distance < 10px (prevents scroll-triggered input).

## Modify recent entries list

File: `src/components/RecentEntries.tsx`

Month filter tabs (all + last 3 months). Shows count + sum when filtered.
Undo button: session-bound, 15-min window, matched by `created_at`.

## Add new API route

Path: `src/app/api/{name}/route.ts`. Sheets I/O in `src/lib/sheets.ts`.
Admin-only routes: check `Authorization: Bearer $STATS_SECRET`.

## Building previews

When building UI previews (e.g. in admin), render every UI element from the real page. Functionality can be omitted (disabled/static), but the element must be visually present. User cannot distinguish "design removed this" from "preview skipped this" if it's absent. If visible but non-functional, user correctly infers preview limitation.

Include: collapsible chevrons, filter pills, refresh button, undo buttons, quantity quick-pick buttons, etc.

## Modify theme colors

Theme uses Tailwind's default `amber` palette. Primary accent is `amber-200` with `text-amber-800` for contrast.

Key files to update when changing accent color:
- `src/app/page.tsx` — header bg, refresh spinner color
- `src/components/ExpenseForm.tsx` — submit button
- `src/components/RecentEntries.tsx` — active filter pill
- `src/components/StatsView.tsx` — active filter pill + `PIE_COLORS` hex values (index 2 and 6)
- `public/manifest.json` → `theme_color`

Note: `amber-200` is light — pair with dark text (`amber-800`), not `text-white`.

## Constraints

- **Heterogeneous units**: mix of weight (斤/公克), count (個/顆), packaging (包/組/份). unit_price is NOT comparable across items. Do not build unit-price rankings.
- **No user auth**: main app is open. Only `/admin` page and items write API are protected by `STATS_SECRET`.
- **Google Sheet = sole data store**: app is stateless.

## Multi-store preparation

Infrastructure is in place but **not active**. Current behaviour is single-store.
See `docs/MULTI_STORE_PLAN.md` for full expansion plan.

Key files:
- `src/lib/store.ts` — `resolveStore()`, `getStoreConfigs()`, `isMultiStoreEnabled()`
- `src/types/expense.ts` — `store_id?: string` on `ExpenseInput`
- `src/lib/sheets.ts` — cache is keyed by storeId (defaults to `"main"`)

To enable multi-store in the future:
1. Set env `STORES='{"main":{"sheetId":"...","label":"本店"},"branch1":{"sheetId":"...","label":"分店1"}}'`
2. Update API routes to accept/resolve `store_id`
3. Add store selector UI in frontend
4. Move categories/items config into per-store Sheet or DB
