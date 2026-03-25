# PokeBee Expense App — Playbook

## Operational Playbooks

### 新增/刪除類別

1. `src/lib/constants.ts` — 在 `CATEGORIES` 陣列中新增/刪除（雜項建議保持在最後）
2. 如果有預設品項，在同檔案的 `ITEMS_BY_CATEGORY` 中加對應 key（僅作 fallback）
3. Google Sheet 的 `Items` tab 也要對應新增/刪除該類別的品項 rows
4. 需要 redeploy（類別是 hardcode 的，品項是動態的）

### 新增/刪除品項

- **不需要改 code**。直接在 `/admin?key=STATS_SECRET` 的「品項管理」tab 操作，或直接改 Google Sheet `Items` tab
- `constants.ts` 的 `ITEMS_BY_CATEGORY` 只是 API 掛掉時的 fallback，不影響正常運作

### 修改管理報表（/admin 統計 tab）

檔案：`src/app/admin/AdminTabs.tsx`

目前 sections（按順序）：
1. 月支出（近 6 個月）— table
2. 類別分佈 — recharts donut pie chart，hover 顯示金額 + %
3. 支出前 10 品項 — table（品項 | 合計）
4. 主要來源 — table（來源 | 合計）

統計邏輯在同檔案的 `build*` helper functions。新增 section = 加 helper + 在 `StatsTab` 裡加 `<section>`。

### 修改記帳表單

檔案：`src/components/ExpenseForm.tsx`

- 欄位順序：日期 → 類別 → 品項 → 數量+單位 → 數量快捷鍵 → 總價 → 來源 → 購買人 → 備註
- 品項 combobox 來源：mount 時 fetch `/api/items`，fallback `ITEMS_BY_CATEGORY`
- 購買人 autocomplete：mount 時 fetch `/api/purchasers` + merge localStorage
- 提交後保留：category, purchaser, date；清除：item, quantity(→1), unit(→第一個), totalPrice, supplier, note

### 修改最近記錄列表

檔案：`src/components/RecentEntries.tsx`

- 月份篩選 tab（全部 + 近 3 個月）
- 篩選時顯示合計（筆數 + 金額）
- 撤回按鈕：session-bound，15 分鐘內有效，比對 `created_at`

### 新增 API

- 路徑：`src/app/api/{name}/route.ts`
- Sheets I/O 邏輯放 `src/lib/sheets.ts`
- 需要 admin 權限的 route：檢查 `Authorization: Bearer $STATS_SECRET`

### 新增/修改單位

`src/lib/constants.ts` 的 `UNITS` 陣列，需要 redeploy。

## Constraints

- **單位異質性**：units 混合了重量（斤、公克）、數量（個、顆）、包裝（包、組、份），所以 unit_price 跨品項不可比較。不要做單價排名類的報表。
- **無使用者身份驗證**：主頁面任何人可用。只有 `/admin` 和 items write API 有 STATS_SECRET 保護。
- **Google Sheet 為唯一資料來源**：所有持久化資料在 Sheet，app 本身 stateless。
