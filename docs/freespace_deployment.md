# 免費空間部署建議方案

## 專案分析

- **框架**: Next.js (App Router)
- **資料庫**: PostgreSQL (Prisma ORM)
- **驗證**: NextAuth.js
- **特殊依賴**: Puppeteer (需注意 Serverless 環境限制)

## 推薦方案：Vercel + Neon

實測最穩定且免費額度最足夠的組合。

### 1. 服務介紹

- **Vercel (Frontend/API)**: Next.js 原生支援，自動化 CI/CD。
- **Neon (Database)**: Serverless PostgreSQL，提供 0.5GB 免費空間，支援 Vercel 整合。

### 2. 部署步驟

#### 階段一：資料庫設定 (Neon)

1. 註冊 [Neon Console](https://console.neon.tech/)。
2. 建立新專案 (Region 建議選新加坡或日本，速度較快)。
3. 複製 **Connection String** (選 POOLED 連線模式，字串會包含 `?sslmode=require`)。

#### 階段二：環境變數準備

在 Vercel 專案設定的 `Environment Variables` 中需加入：

- `DATABASE_URL`: 填入 Neon 的 Connection String。
- `NEXTAUTH_SECRET`: 生成一組隨機字串 (可用 `openssl rand -base64 32`)。
- `NEXTAUTH_URL`: Vercel 部署後的網址 (如 `https://xxx.vercel.app`)。

#### 階段三：Vercel 部署設定

1. 在 Vercel Dashboard 匯入 GitHub Repository。
2. **Build Settings**:
   - 如果 Prisma Client 沒更新，可將 Build Command 修改為：

     ```bash
     npx prisma generate && npx prisma db push && next build
     ```

     *(注意：`db push` 適合測試環境快速同步 Schema)*

### 3. 先天限制與解決方案 (Critical)

#### Puppeteer 問題

**問題**: Vercel Serverless Function 有 50MB 大小限制，直接安裝 `puppeteer` 通常會導致部署失敗。
**解決方案**:

1. **方案 A (簡單/建議)**: 若 PDF 生成非核心功能，建議在部署版本中暫時停用相關功能。
2. **方案 B (進階)**: 改用 `puppeteer-core` + `@sparticuz/chromium` (專為 Lambda 優化)。
3. **方案 C (替代平台)**: 放棄 Vercel，改用 **Render** 或 **Railway** 的 Docker 部署模式 (無 Serverless 體積限制，但 Render 免費版會休眠)。

## 替代方案：Render (Docker)

如果必須保留完整的 Puppeteer 功能：

1. 編寫 `Dockerfile`。
2. 在 Render 建立 Web Service 連結 GitHub。
3. 免費版缺點：閒置 15 分鐘後會休眠，下次喚醒需等待約 50 秒。

---
**結論**: 建議優先嘗試 **Vercel + Neon** 以獲得最佳效能與體驗。若遇 Puppeteer 報錯，再考慮遷移至 Render。
