# 檔案上傳與管理功能 (File Management)

> 最後更新: 2026-01-02

## 需求概述

建立一個獨立的檔案上傳與管理系統，使用者可以上傳任意檔案並填寫元資料，所有操作需經審核流程。

### 核心功能

- 📤 檔案上傳（任意類型）
- 📝 元資料管理（5項必填欄位）
- 📁 依年份分類儲存
- 🔍 搜尋與瀏覽
- ✏️ 編輯與刪除
- ✅ 審核流程整合

### 權限矩陣

| 功能 | VIEWER | EDITOR | INSPECTOR | ADMIN |
|------|:------:|:------:|:---------:|:-----:|
| 瀏覽檔案 | ✅ | ✅ | ✅ | ✅ |
| 上傳檔案 | ❌ | ✅ | ✅ | ✅ |
| 編輯資料 | ❌ | ✅ | ✅ | ✅ |
| 刪除檔案 | ❌ | ✅ | ✅ | ✅ |
| 審核申請 | ❌ | ❌ | ✅ | ✅ |

> ⚠️ **注意**：EDITOR/INSPECTOR 的上傳、編輯、刪除操作皆需經過審核才能生效。

---

## 元資料欄位

| 欄位 | 英文名稱 | 類型 | 必填 | 說明 |
|------|----------|------|:----:|------|
| 資料年份 | dataYear | Int | ✅ | 用於分類檔案 |
| 資料名稱 | dataName | String | ✅ | 檔案顯示名稱 |
| 資料編碼 | dataCode | String | ✅ | 唯一識別碼 |
| 作者 | author | String | ✅ | 資料作者 |
| 內容簡介 | description | String | ✅ | 內容摘要 |

---

## 資料庫設計

### 新增 Model: `DataFile`

```prisma
model DataFile {
  id          Int      @id @default(autoincrement())
  
  // 元資料
  dataYear    Int                    // 資料年份
  dataName    String                 // 資料名稱
  dataCode    String   @unique       // 資料編碼 (唯一)
  author      String                 // 作者
  description String                 // 內容簡介
  
  // 檔案資訊
  fileName    String                 // 原始檔名
  filePath    String                 // 儲存路徑
  fileSize    Int                    // 檔案大小 (bytes)
  mimeType    String                 // MIME 類型
  
  // 狀態
  isDeleted   Boolean  @default(false)
  
  // 時間戳記
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 關聯
  changeRequests DataFileChangeRequest[]
  history        DataFileHistory[]
  
  @@index([dataYear])
  @@index([dataCode])
}

model DataFileChangeRequest {
  id          Int      @id @default(autoincrement())
  type        String   // FILE_CREATE, FILE_UPDATE, FILE_DELETE
  status      String   @default("PENDING")
  data        String   // JSON content
  
  fileId      Int?
  file        DataFile? @relation(fields: [fileId], references: [id])
  
  submittedById String
  submittedBy   User   @relation("FileSubmittedBy", fields: [submittedById], references: [id])
  
  reviewedById  String?
  reviewedBy    User?  @relation("FileReviewedBy", fields: [reviewedById], references: [id])
  
  reviewNote    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model DataFileHistory {
  id          Int      @id @default(autoincrement())
  
  fileId      Int?
  file        DataFile? @relation(fields: [fileId], references: [id], onDelete: SetNull)
  
  version     Int
  changeType  String   // CREATE, UPDATE, DELETE
  snapshot    String   // JSON
  diff        String?  // JSON
  
  submittedById String
  submittedBy   User   @relation("FileHistorySubmitter", fields: [submittedById], references: [id])
  
  reviewedById  String?
  reviewedBy    User?  @relation("FileHistoryReviewer", fields: [reviewedById], references: [id])
  
  createdAt     DateTime @default(now())
  
  // Redundant fields
  dataCode      String
  dataName      String
  dataYear      Int
  
  @@index([fileId, version])
}
```

---

## 檔案儲存結構

```
public/
└── uploads/
    └── datafiles/
        ├── 2024/
        │   ├── file1.pdf
        │   └── file2.docx
        ├── 2025/
        │   └── file3.xlsx
        └── 2026/
            └── file4.png
```

---

## 實作計畫

### Phase 1: 資料庫設計 (Schema)

- [ ] 新增 `DataFile` model
- [ ] 新增 `DataFileChangeRequest` model
- [ ] 新增 `DataFileHistory` model
- [ ] 更新 `User` model 新增關聯
- [ ] 執行 `npx prisma db push`

### Phase 2: 後端 API (Server Actions)

- [ ] `src/actions/data-files.ts`
  - [ ] `getDataFiles()` - 取得檔案列表
  - [ ] `getDataFile(id)` - 取得單一檔案
  - [ ] `searchDataFiles(query)` - 搜尋檔案
  - [ ] `submitCreateDataFile()` - 提交新增申請
  - [ ] `submitUpdateDataFile()` - 提交編輯申請
  - [ ] `submitDeleteDataFile()` - 提交刪除申請
  - [ ] `approveDataFileRequest()` - 審核通過
  - [ ] `rejectDataFileRequest()` - 審核拒絕
  - [ ] `getPendingDataFileRequests()` - 取得待審核申請

### Phase 3: 檔案上傳 API

- [ ] `src/app/api/datafiles/upload/route.ts`
  - [ ] 接收檔案與元資料
  - [ ] 依年份建立資料夾
  - [ ] 儲存檔案並返回路徑

### Phase 4: 前端頁面

- [ ] `src/app/datafiles/page.tsx` - 檔案列表頁
  - [ ] 年份分類導覽
  - [ ] 搜尋功能
  - [ ] 列表/卡片檢視
  - [ ] 上傳按鈕 (EDITOR+)
  
- [ ] `src/app/datafiles/[id]/page.tsx` - 檔案詳情頁
  - [ ] 顯示元資料
  - [ ] 下載連結
  - [ ] 編輯按鈕 (EDITOR+)
  - [ ] 刪除按鈕 (ADMIN)
  - [ ] 歷史紀錄

### Phase 5: 前端元件

- [ ] `src/components/datafile/DataFileList.tsx` - 檔案列表
- [ ] `src/components/datafile/DataFileCard.tsx` - 檔案卡片
- [ ] `src/components/datafile/UploadDataFileForm.tsx` - 上傳表單
- [ ] `src/components/datafile/EditDataFileButton.tsx` - 編輯按鈕
- [ ] `src/components/datafile/DeleteDataFileButton.tsx` - 刪除按鈕
- [ ] `src/components/datafile/DataFileSearch.tsx` - 搜尋元件

### Phase 6: 審核流程整合

- [ ] 更新 `ApprovalList.tsx` 支援 DataFile 請求
- [ ] 新增 DataFile 類型的審核卡片
- [ ] 實作 DataFile 審核邏輯

### Phase 7: 導覽整合

- [ ] 更新主選單新增「檔案管理」入口
- [ ] 新增導覽連結至檔案頁面

---

## API 路由規劃

| 路由 | 方法 | 說明 |
|------|------|------|
| `/datafiles` | GET | 檔案列表頁 |
| `/datafiles/[id]` | GET | 檔案詳情頁 |
| `/datafiles/search` | GET | 搜尋結果頁 |
| `/api/datafiles/upload` | POST | 上傳 API |

---

## UI 設計規劃

### 列表頁

```
┌─────────────────────────────────────────────┐
│ 📁 檔案管理                    [🔍 搜尋] [➕ 上傳] │
├─────────────────────────────────────────────┤
│ 年份篩選: [全部] [2026] [2025] [2024] ...       │
├─────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ File 1  │ │ File 2  │ │ File 3  │         │
│ │ 2026    │ │ 2025    │ │ 2024    │         │
│ │ Author  │ │ Author  │ │ Author  │         │
│ └─────────┘ └─────────┘ └─────────┘         │
└─────────────────────────────────────────────┘
```

### 上傳表單

```
┌─────────────────────────────────────────────┐
│ 📤 上傳新檔案                                 │
├─────────────────────────────────────────────┤
│ 資料年份: [____2026____]                     │
│ 資料名稱: [________________]                 │
│ 資料編碼: [________________]                 │
│ 作者:     [________________]                 │
│ 內容簡介: [                 ]                │
│           [                 ]                │
│ 檔案:     [選擇檔案] example.pdf             │
├─────────────────────────────────────────────┤
│                        [取消] [提交審核]      │
└─────────────────────────────────────────────┘
```

---

## ChangeRequest 類型擴充

新增 ChangeRequest 類型：

- `FILE_CREATE` - 新增檔案申請
- `FILE_UPDATE` - 編輯檔案申請
- `FILE_DELETE` - 刪除檔案申請

---

## 技術考量

### 檔案大小限制

- 預設上限: 100MB（單一檔案）
- 支援類型: 任意

### 檔案命名

- 格式: `{dataCode}_{timestamp}.{ext}`
- 避免重複與中文檔名問題

### 安全性

- 驗證檔案類型
- 權限檢查
- 路徑驗證

---

## 開發優先順序

1. **Phase 1**: 資料庫設計 ⬅️ 先完成
2. **Phase 2-3**: 後端 API
3. **Phase 4-5**: 前端頁面與元件
4. **Phase 6**: 審核整合
5. **Phase 7**: 導覽整合

---

## 驗證計畫

- [ ] 上傳功能測試
- [ ] 權限控管測試
- [ ] 審核流程測試
- [ ] 搜尋功能測試
- [ ] 編輯/刪除測試
- [ ] 年份分類測試
