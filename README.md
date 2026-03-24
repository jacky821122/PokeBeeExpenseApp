# pokebee Expense Logger

內部支出快速記錄工具。目標：單筆輸入 ≤ 10 秒。

## Tech Stack

- **Next.js 16** (App Router)
- **Tailwind CSS v4**
- **Google Sheets API** — 唯一資料庫
- **Vercel** — 部署

## 資料流

使用者填表 → Next.js API Route → Google Sheets

無資料庫、無 auth、無編輯/刪除功能。管理者直接在 Sheet 端修改資料。

## 資料 Schema

Google Sheet 欄位順序（A–K）：

| 欄位 | 說明 |
|------|------|
| date | 支出日期 (YYYY-MM-DD) |
| category | 類別（enum，見下） |
| item | 品項名稱 |
| quantity | 數量 |
| unit | 單位（enum，見下） |
| unit_price | 單價（系統從總價÷數量自動計算） |
| total_price | 總價（使用者輸入） |
| supplier | 來源（選填） |
| purchaser | 購買人（選填） |
| note | 備註（選填） |
| created_at | 建立時間（ISO datetime，系統自動） |

> **注意**：`unit_price` 為系統自動計算（`total_price / quantity`），使用者只需輸入總價。

### 類別（Category）

`食材` / `包材` / `設備` / `雜項`

### 單位（Unit）

`個` / `份` / `顆` / `斤` / `公克` / `包` / `組`

## 功能

### 表單

- 日期預設今天、數量預設 1
- 品項支援下拉選單 + 自由輸入（combobox），選項來自預設清單及本機輸入快取
- 來源、購買人支援 autocomplete（從本機 localStorage 快取歷史輸入）
- 送出後重置品項、數量、單位、總價、來源、備註；保留日期、類別、購買人

### 最近記錄

- 顯示最近 30 筆（依 Sheet 順序，新的在上）
- 月份篩選：全部 / 當月 / 前兩個月（共三個月）

## 環境變數

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
SHEET_ID=...
```

## 本地開發

```bash
cd app
npm install
npm run dev
```
