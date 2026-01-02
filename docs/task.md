# 專案項目資訊管理系統 - 開發進度 (task.md)

>> 最後更新: 2026-01-02

## 進度總覽

| Phase | 說明 | 狀態 |
|-------|------|------|
| Phase 1 | 專案初始化與基礎建設 | ✅ 完成 |
| Phase 2 | 核心功能開發 | ✅ 完成 |
| Phase 3 | 進階內容功能 | ✅ 完成 |
| Phase 4 | UI 優化與測試 | 🔄 進行中 |

---

## Phase 1: 專案初始化與基礎建設

- [x] 建立專案結構 (Next.js 14 + TypeScript)
- [x] 設計資料庫 Schema (Prisma + SQLite)
  - User, Project, Item, ChangeRequest 模型
- [x] 設定基礎 UI Design System (CSS Variables)
- [x] 實作身份驗證系統 (NextAuth.js)
- [x] 實作權限系統 (Admin/Editor/Viewer)
- [x] **[檢核]** DB Schema 與 Auth 功能正常 ✅

## Phase 2: 核心功能開發 - 資料結構與管理

- [x] 實作專案 (Project) CRUD
- [x] 實作項目 (Item) 自動編號邏輯
- [x] 實作審核流程 (Change Request Workflow)
  - 提交申請 → 待審核 → 核准/退回
- [x] 實作項目展示頁面 (Viewer View)
- [x] **[檢核]** 專案建立、自動編號、審核流程正常 ✅

## Phase 3: 進階內容功能

- [x] 整合 Rich Text Editor (Tiptap)
  - 支援 Bold, Italic, Heading, Table
- [x] 實作檔案上傳功能 (PDF, Word, Images)
- [x] 實作標籤連結功能 (跨專案 Item 連結)
- [x] 實作關聯項目 (Related Items) 功能
- [x] 實作階層式項目結構 (Tree View)
- [x] **[檢核]** 富文本、檔案上傳、標籤連結功能正常 ✅

## Phase 4: UI 優化與測試

### Phase 4.0: 主題與基礎優化 ✅

- [x] 實作主題切換功能 (Light/Dark Mode)
- [x] 優化 CSS 變數系統

### Phase 4.1: 使用者權限管理系統 ✅

- [x] 設計四層權限分級 (Viewer/Editor/Inspector/Admin)
- [x] 實作使用者管理 Server Actions (CRUD)
- [x] 實作使用者管理 UI (Admin Dashboard)
- [x] Admin 編輯使用者功能 (Username/Role/Password Reset)
- [x] 密碼欄位顯示切換功能
- [x] 更新審核權限邏輯 (Inspector 可審核)
- [x] **[檢核]** 各角色權限行為正確 ✅

### Phase 4.2: 項目編輯與刪除審核流程 ✅

- [x] 擴充 Change Request 類型 (CREATE/UPDATE/DELETE)
- [x] 實作 `submitUpdateItemRequest` Server Action
- [x] 實作 `submitDeleteItemRequest` (含子項目檢查)
- [x] 實作前端 Edit 按鈕與 Modal
- [x] 實作前端 Delete 按鈕與防呆邏輯
- [x] **[檢核]** 編輯/刪除申請流程正常 ✅

### Phase 4.3: Rich Text Editor 圖片功能增強 ✅

- [x] 修正 Link/Image URL 按鈕閃退問題
  - 改用 React Dialog 取代 window.prompt()
- [x] 實作圖片直接上傳功能 (📷 上傳圖片按鈕)
- [x] 實作圖片貼上功能 (Ctrl+V / Cmd+V)
- [x] 實作圖片拖放功能 (Drag & Drop)
- [x] 實作自定義表格大小功能 (Table Size Dialog)
- [x] 優化 Link 插入流程 (Link Dialog: 支援同時輸入文字與 URL)
- [x] 實作導覽選單摺疊功能 (Collapsible Tree Nodes)
- [x] 實作當前項目高亮標示 (Current Item Highlighting)
- [x] **[檢核]** 圖片、表格、連結優化、選單摺疊與高亮功能正常 ✅

### Phase 4.5: Approval Dashboard 優化 ✅

- [x] UPDATE 請求顯示項目編號與提交人
- [x] 實作自我審核防呆機制 (非 ADMIN 不可審核自己的申請)
- [x] 重新設計 Dashboard UI (卡片式佈局、可展開詳情)
- [x] **Detail View Enhancement**: 顯示完整欄位 (Title, Content, Attachments, Related Items) 與變更標記
- [x] **[檢核]** Approval Dashboard 功能與 UI 正常 ✅

### Phase 4.6: Project Management Enhancements ✅

- [x] **Project Edit Flow** (UPDATE)
  - [x] 建立 `PROJECT_UPDATE` 審核類型
  - [x] 專案列表頁面新增編輯按鈕 (權限: EDITOR/INSPECTOR/ADMIN)
  - [x] 整合至 Approval Dashboard
- [x] **Project Delete Flow** (DELETE)
  - [x] 建立 `PROJECT_DELETE` 審核類型
  - [x] 專案列表頁面新增刪除按鈕 (權限: ADMIN Only)
  - [x] 實作刪除防呆 (已有 Items 的專案不可刪除)
- [x] **UI/UX Optimization**
  - [x] Item 詳情頁 Related Items 依專案分組與自然排序
  - [x] Project Delete 確認對話框優化

### Phase 4.7: Item History & Global Dashboard (v0.7.0) ✅

- [x] **Database Schema**
  - [x] Add `ItemHistory` model with snapshot and diff
  - [x] Add redundant fields (`itemFullId`, `itemTitle`, `projectId`) for deleted items
  - [x] Update `Item`, `User`, `Project` relations
- [x] **Backend Logic**
  - [x] Implement `createHistoryRecord` (Auto-create on approval)
  - [x] Implement query actions (`getItemHistory`, `getGlobalHistory`)
- [x] **UI Implementation**
  - [x] **Item Detail**: Inline specific history list at bottom
  - [x] **History Detail**: View snapshot and diff
  - [x] **Global Dashboard**: Admin page for all histories (Project -> Tree -> History)
- [x] **Verification**
  - [x] Verify history creation on CREATE/UPDATE/DELETE
  - [x] Verify global history access for deleted items

### Phase 4.8: Project Search Feature ✅

- [x] 實作專案內搜尋功能 (Project-specific search)
- [x] 實作搜尋 API (`searchProjectItems` Server Action)
- [x] HTML/JSON 語法過濾機制 (避免搜尋到標籤內容)
- [x] 關鍵字高亮顯示 (Highlight 功能)
- [x] 搜尋結果頁面與卡片 UI
- [x] **[檢核]** 搜尋功能正常，高亮顯示正確 ✅

### Phase 4.9: UI Dialog Improvements & Self-Approval Prevention ✅

- [x] **Dialog UI Optimization**
  - [x] 修復刪除對話框閃現問題 (DeleteItemButton)
  - [x] 修復 Approval Dashboard 對話框閃現問題
  - [x] 統一所有對話框採用 glass modal 設計
  - [x] 添加 backdrop blur 效果
- [x] **Self-Approval Visual Indicators**
  - [x] 自己提交的申請卡片標注 (⚠️ 您提交的申請)
  - [x] 卡片黃色警告邊框與淺黃背景
- [x] **Self-Approval Prevention Logic**
  - [x] 點擊 Approve/Reject 自己的申請時顯示錯誤對話框
  - [x] 錯誤對話框顯示「權限受限」警告
  - [x] 防止自我審核操作
- [x] **[檢核]** 對話框 UI 統一，自我審核防止機制正常 ✅

- [ ] 進行全系統整合測試
- [ ] 優化前端介面 (Rich Aesthetics)
- [ ] 撰寫完整使用說明 (Walkthrough)
- [ ] 最終技術文件整理
