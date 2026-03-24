# PokeBee Expense - 內部支出記錄工具

極簡、低摩擦的內部支出記錄介面。使用者透過手機在 10 秒內完成一筆支出記錄，資料寫入 Google Sheet。

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes → Google Sheets API (Service Account)
- **Deployment**: Vercel (free tier)

## 本地預覽（不需要 Google Sheet）

即使還沒接好 Google Sheet，也可以先看介面：

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000 即可看到表單介面。

> **注意**：在未設定 Google Sheet 之前，按「送出」會回傳錯誤（這是正常的，API 無法連到 Sheet）。
> 介面本身可以正常瀏覽和操作。
>
> 手機預覽：確保手機和電腦在同一個區域網路，然後在手機瀏覽器開啟 `http://<你的電腦IP>:3000`。

## 專案結構

```
src/
├── app/
│   ├── layout.tsx                 # 根 layout（PWA meta、viewport）
│   ├── page.tsx                   # 主頁面：表單 + 最近記錄
│   ├── globals.css                # Tailwind
│   └── api/expenses/route.ts      # POST 新增 / GET 最近 30 筆
├── components/
│   ├── ExpenseForm.tsx            # 核心輸入表單
│   └── RecentEntries.tsx          # 最近記錄表格
├── lib/
│   ├── sheets.ts                  # Google Sheets API 封裝
│   ├── constants.ts               # 類別 / 單位 enum
│   └── autocomplete.ts            # localStorage autocomplete cache
└── types/
    └── expense.ts                 # TypeScript 型別
```

## Google Sheet 設定（部署前必做）

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案（或使用現有的）
3. 到「API 和服務」→「程式庫」→ 搜尋並啟用 **Google Sheets API**

### 2. 建立 Service Account

1. 到「API 和服務」→「憑證」→「建立憑證」→「服務帳戶」
2. 填寫名稱（例如 `pokebee-expense`），建立
3. 不需要授予任何角色，直接完成
4. 點進剛建立的服務帳戶 →「金鑰」分頁 →「新增金鑰」→「JSON」
5. 下載的 JSON 檔中，你需要：
   - `client_email` → 填入 `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → 填入 `GOOGLE_PRIVATE_KEY`

### 3. 建立 Google Sheet

1. 建立一個新的 Google Sheet
2. 在第一列（Row 1）填入以下 header：

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| date | category | item | quantity | unit | unit_price | total_price | supplier | purchaser | note | created_at |

3. 將 Sheet 共享給 Service Account 的 email（`xxx@xxx.iam.gserviceaccount.com`），權限選「編輯者」
4. 從 Sheet URL 取得 Sheet ID（`https://docs.google.com/spreadsheets/d/`**SHEET_ID**`/edit`）

### 4. 設定環境變數

複製 `.env.example` 為 `.env.local`，填入：

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SHEET_ID=你的Sheet_ID
```

> **注意**：`GOOGLE_PRIVATE_KEY` 的值要用雙引號包起來，且 `\n` 需保持原樣（不要換成真正的換行）。

## 部署到 Vercel

1. Push 到 GitHub（已連結到 `jacky821122/PokeBeeExpenseApp`）
2. 到 [Vercel](https://vercel.com/) → Import Git Repository → 選這個 repo
3. **Root Directory** 維持預設（repo 根目錄就是 Next.js 專案）
4. 在 Vercel 的 **Environment Variables** 設定頁面，加入和 `.env.local` 相同的三個變數
5. Deploy → 取得 `*.vercel.app` URL
6. （選用）在手機瀏覽器開啟該 URL →「加到主畫面」當作 App 使用

## 資料欄位說明

### 必填

| 欄位 | 型別 | 說明 |
|------|------|------|
| date | date | 支出日期（預設今天） |
| category | enum | 類別：肉及蛋白質 / 海鮮 / 菜 / 水果 / 醬料 / 調味粉 / 外帶耗材 / 耗材 |
| item | string | 品項名稱（依類別顯示對應建議選單） |
| quantity | number | 數量（預設 1） |
| unit | enum | 單位：個 / 份 / 顆 / 斤 / 公克 / 包 / 組 |
| total_price | number | 總價（使用者輸入） |

### 選填

| 欄位 | 型別 | 說明 |
|------|------|------|
| supplier | string | 來源（例：全聯、Costco） |
| purchaser | string | 購買人 |
| note | string | 備註 |

### 系統自動產生

| 欄位 | 型別 | 說明 |
|------|------|------|
| unit_price | number | total_price ÷ quantity（系統計算） |
| created_at | datetime | 記錄建立時間 |

## 使用方式

- **一般使用者**：打開網頁 → 填表 → 送出 → 完成
- **管理者**：直接在 Google Sheet 中編輯 / 刪除 / 整理資料

> 前端不提供編輯和刪除功能，這是刻意的設計。

## TODO

- [ ] PWA icon 替換成正式的 192x192 / 512x512 PNG
- [ ] 簡單統計摘要（今日 / 本週花費）
- [ ] Offline 支援（離線時暫存，上線後自動送出）
- [ ] 寫入佇列（應對更高併發場景）
