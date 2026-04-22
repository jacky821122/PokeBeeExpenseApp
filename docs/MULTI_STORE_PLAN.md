# PokeBee Expense — 展店擴展計畫

> 最後更新：2026-04-22
> Branch：`feature/multi-store-prep`

---

## 目錄

1. [現況架構總覽](#1-現況架構總覽)
2. [為什麼現在不容易直接展店](#2-為什麼現在不容易直接展店)
3. [已完成的預備工作](#3-已完成的預備工作)
4. [展店啟用步驟（階段一：2-5 家店）](#4-展店啟用步驟階段一2-5-家店)
5. [中期改造方向（階段二：5-20 家店）](#5-中期改造方向階段二5-20-家店)
6. [長期展望（階段三：20+ 家店）](#6-長期展望階段三20-家店)
7. [風險與限制](#7-風險與限制)
8. [檔案對照表](#8-檔案對照表)

---

## 1. 現況架構總覽

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  手機/電腦   │────▶│  Next.js App     │────▶│  Google Sheets  │
│  (瀏覽器)    │◀────│  (Vercel 部署)    │◀────│  (單一試算表)    │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

| 層級       | 目前技術                        | 展店影響       |
| ---------- | ------------------------------- | -------------- |
| 前端 UI    | Next.js + React + Tailwind CSS  | ✅ 容易擴展     |
| API 層     | Next.js API Routes              | ⚠️ 需加入店鋪識別 |
| 資料儲存   | Google Sheets（一個試算表）       | ❌ 最大瓶頸     |
| 認證       | 單一 API Key + STATS_SECRET     | ⚠️ 無分店權限   |
| 品項/類別   | 硬編碼在 `constants.ts`         | ⚠️ 各店無法客製  |

### 資料流

1. 使用者在手機上填寫表單送出
2. 前端呼叫 `/api/expenses`（POST）
3. API Route 驗證 API Key → 寫入 Google Sheet 的 `Sheet1`
4. 品項清單從 Google Sheet 的 `Items` 工作表讀取
5. 統計報表從 `Sheet1` 全部資料計算

---

## 2. 為什麼現在不容易直接展店

### 2.1 Google Sheets 是單點瓶頸

- 環境變數 `SHEET_ID` 只指向一張試算表，所有資料混在一起
- Google Sheets API 有 **每分鐘 60 次** 的讀寫限制
- 如果兩家店同時在記帳，很容易撞到 rate limit

### 2.2 沒有「這筆帳是哪家店的」概念

- `ExpenseInput`（記帳資料結構）原本沒有 `store_id` 欄位
- API 不知道要寫到哪家店的試算表
- 查詢和統計也沒辦法按店篩選

### 2.3 品項和類別是全域共用的

- `constants.ts` 裡的 `CATEGORIES`、`UNITS`、`ITEMS_BY_CATEGORY` 是寫死的
- 如果分店 A 賣牛肉飯、分店 B 賣甜點，它們不能有各自的品項清單

### 2.4 認證太簡單

- 只有一組 API Key，不能區分「誰是哪家店的人」
- `/admin` 只有一組 `STATS_SECRET`，看到的是全部資料

---

## 3. 已完成的預備工作

> ✅ 這些改動已經合進 `feature/multi-store-prep` branch，而且 **完全不影響現有功能**。
> 目前沒設定 `STORES` 環境變數的情況下，行為和改動前 100% 一樣。

### 3.1 新增 `src/lib/store.ts` — 店鋪設定管理

這個檔案提供三個核心功能：

```typescript
// 取得所有店鋪設定
getStoreConfigs(): Record<string, StoreConfig>

// 用 storeId 找到對應的 Sheet 設定（找不到會報錯）
resolveStore(storeId?: string | null): StoreConfig

// 檢查是否開啟多店模式
isMultiStoreEnabled(): boolean
```

**StoreConfig 結構：**

```typescript
interface StoreConfig {
  id: string;       // 店鋪代號，例如 "main", "branch1"
  sheetId: string;   // 該店對應的 Google Sheet ID
  sheetGid: number;  // 工作表的 GID（通常是 0）
  label: string;     // 顯示名稱，例如 "台北本店"
}
```

**運作邏輯：**
- 如果有設定 `STORES` 環境變數（JSON 格式）→ 解析成多店設定
- 如果沒設定 → 自動用現有的 `SHEET_ID` 和 `SHEET_GID` 建立一個叫 `"main"` 的預設店

### 3.2 `src/types/expense.ts` — 資料結構加入 store_id

```typescript
export interface ExpenseInput {
  date: string;
  category: string;
  item: string;
  quantity: number;
  unit: string;
  total_price: number;
  supplier?: string;
  purchaser?: string;
  note?: string;
  store_id?: string;  // ← 新增，可選，預設為 "main"
}
```

因為是 `optional`（`?`），所以現有的前端和 API 不傳這個欄位也完全沒問題。

### 3.3 `src/lib/sheets.ts` — 快取改為按店鋪分開

原本快取是一個單一變數：
```typescript
// 改動前
let expensesCache = { data: [...], expiresAt: ... };
```

現在改成 Map，用 storeId 當 key：
```typescript
// 改動後
const expensesCacheMap = new Map<string, { data: Expense[]; expiresAt: number }>();
```

預設 key 是 `"main"`，所以單店模式下行為完全一樣。未來多店時，每家店的快取獨立，不會互相覆蓋。

---

## 4. 展店啟用步驟（階段一：2-5 家店）

> 適用情境：開第二家、第三家店，還是用 Google Sheets 記帳
> 預估工作量：**2-3 個工作天**

### 步驟 1：為新店建立 Google Sheet

1. 複製現有的 Google Sheet（包含 `Sheet1` 和 `Items` 兩個工作表）
2. 把新 Sheet 共用給 Service Account（同一個 `GOOGLE_SERVICE_ACCOUNT_EMAIL`）
3. 記下新 Sheet 的 ID（網址中 `/d/` 和 `/edit` 之間那段）

### 步驟 2：設定 STORES 環境變數

在 Vercel（或你的部署環境）加上 `STORES` 環境變數：

```json
{
  "main": {
    "sheetId": "1AbCdEf_現有的SheetID",
    "sheetGid": 0,
    "label": "台北本店"
  },
  "xinyi": {
    "sheetId": "1XyZ_新店的SheetID",
    "sheetGid": 0,
    "label": "信義店"
  }
}
```

> ⚠️ 設定 `STORES` 之後，原本的 `SHEET_ID` 就不會被使用了（但建議保留以防 fallback）。

### 步驟 3：API Routes 加入 store_id 支援

需要改的檔案：
- `src/app/api/expenses/route.ts` — POST/GET 接受 `store_id` 參數
- `src/app/api/items/route.ts` — 品項按店讀取
- `src/app/api/purchasers/route.ts` — 採購人按店讀取

改法概念（以 expenses 為例）：
```typescript
// POST /api/expenses
const { store_id, ...expenseData } = body;
const store = resolveStore(store_id); // 如果沒傳，用 "main"
// 用 store.sheetId 去讀寫對應的 Sheet
```

### 步驟 4：sheets.ts 函數傳入 storeId

目前 `sheets.ts` 裡的 `appendExpense()`、`getAllExpenses()` 等函數都直接讀 `process.env.SHEET_ID`。
需要改成接受 `storeId` 參數，用 `resolveStore(storeId).sheetId` 取得對應的 Sheet ID。

### 步驟 5：前端加入店鋪選擇器

兩種做法（擇一）：

**方案 A — URL 路由分店**
```
pokebee-expense.vercel.app/main    → 本店
pokebee-expense.vercel.app/xinyi   → 信義店
```
優點：可以做成不同的手機捷徑
缺點：需要調整 Next.js 路由

**方案 B — 頁面內選擇器**
- 在頁面頂部加一個下拉選單切換店鋪
- 選擇的值存在 localStorage
- 每次送出表單時帶入 `store_id`

建議用 **方案 A**，因為每家店的員工通常固定在同一家店記帳，建成捷徑比較方便。

### 步驟 6：統計報表支援分店

- `/admin` 頁面加入店鋪篩選
- 可以看單店統計，也可以看「全部店合計」

---

## 5. 中期改造方向（階段二：5-20 家店）

> 當 Google Sheets 的 rate limit 開始成為問題時

### 5.1 換資料庫

| 選項         | 特點                                  | 費用      |
| ------------ | ------------------------------------- | --------- |
| **Supabase** | PostgreSQL，有 REST API，免費方案夠用  | 免費起     |
| **PlanetScale** | MySQL，serverless，自動擴展          | 免費起     |
| **Neon**     | PostgreSQL，serverless                | 免費起     |

推薦 **Supabase**，因為：
- 提供現成的 Auth（可以做分店帳號）
- 有 Dashboard 可以直接看資料（取代看 Google Sheet 的習慣）
- 和 Vercel 整合好

### 5.2 資料表設計

```sql
-- 店鋪
CREATE TABLE stores (
  id          TEXT PRIMARY KEY,  -- 'main', 'xinyi'
  label       TEXT NOT NULL,     -- '台北本店', '信義店'
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 品項（per-store）
CREATE TABLE items (
  id          SERIAL PRIMARY KEY,
  store_id    TEXT REFERENCES stores(id),
  category    TEXT NOT NULL,
  name        TEXT NOT NULL
);

-- 支出
CREATE TABLE expenses (
  id          SERIAL PRIMARY KEY,
  store_id    TEXT REFERENCES stores(id),
  date        DATE NOT NULL,
  category    TEXT NOT NULL,
  item        TEXT NOT NULL,
  quantity    NUMERIC NOT NULL,
  unit        TEXT NOT NULL,
  unit_price  NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  supplier    TEXT,
  purchaser   TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 使用者（未來）
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,  -- 'admin', 'manager', 'staff'
  store_id    TEXT REFERENCES stores(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 5.3 認證升級

- 用 NextAuth.js 或 Supabase Auth
- 每個使用者綁定所屬店鋪
- 角色：`admin`（看全部）、`manager`（看自己店）、`staff`（只能記帳）

---

## 6. 長期展望（階段三：20+ 家店）

- **總部 Dashboard**：跨店彙總報表、月結比較、異常警報
- **中央採購管理**：統一下單、分店分配
- **供應商系統**：供應商資料庫、價格歷史追蹤
- **行動 App**：如果 PWA 不夠用，考慮 React Native
- **多語系**：如果展到海外

---

## 7. 風險與限制

| 風險                                | 影響程度 | 緩解方式                       |
| ----------------------------------- | -------- | ------------------------------ |
| Google Sheets API rate limit        | 🔴 高    | 階段一控制在 5 店內；階段二換 DB |
| 多店同時寫入造成資料衝突            | 🟡 中    | 每店獨立 Sheet，不會衝突        |
| 品項/類別硬編碼在 constants.ts      | 🟡 中    | 階段一各店用各自的 Items 工作表  |
| 單一 API Key 無法區分店鋪           | 🟡 中    | 階段一靠 store_id 參數；階段二做認證 |
| Google Sheet 單表資料量上限（1000 萬格）| 🟢 低 | 每店獨立 Sheet，短期不會碰到    |

---

## 8. 檔案對照表

以下是展店相關的所有檔案，方便未來修改時快速定位：

| 檔案路徑                        | 用途                     | 展店時需改動 |
| ------------------------------- | ------------------------ | ------------ |
| `src/lib/store.ts`              | 店鋪設定解析（已完成）    | 通常不用改    |
| `src/types/expense.ts`          | 資料結構（store_id 已加） | 通常不用改    |
| `src/lib/sheets.ts`             | Google Sheets 讀寫       | ✅ 需改，加入 storeId 參數 |
| `src/app/api/expenses/route.ts` | 記帳 API                 | ✅ 需改，接受 store_id |
| `src/app/api/items/route.ts`    | 品項 API                 | ✅ 需改，按店讀取 |
| `src/app/api/purchasers/route.ts`| 採購人 API              | ✅ 需改，按店讀取 |
| `src/components/ExpenseForm.tsx` | 記帳表單                 | ✅ 需改，傳入 store_id |
| `src/components/StatsView.tsx`   | 統計報表                 | ✅ 需改，按店篩選 |
| `src/lib/constants.ts`          | 品項/類別常數             | ⚠️ 階段二移除硬編碼 |
| `src/lib/auth.ts`               | 認證                     | ⚠️ 階段二升級 |
| `CLAUDE.md`                     | 開發手冊                 | 已更新        |

---

> 💡 **總結**：目前預備工作已完成，現有功能完全不受影響。當確定要展店時，照「階段一」的 6 個步驟走，預估 2-3 天可以完成。
