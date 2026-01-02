# 專案內搜尋功能規劃 (search_fnc.md)

> 最後更新: 2026-01-02

## 功能概述

在專案詳情頁面提供全文搜尋功能，搜尋範圍包含項目的標題 (title) 與內容 (content)，結果依照 Item 編號排序，並高亮顯示符合的內容片段。

### 核心需求

1. **搜尋範圍**：專案內所有未刪除的 Item (title + content)
2. **結果排序**：依照 `fullId` 自然排序 (WQ-1, WQ-1-1, WQ-2...)
3. **結果顯示**：
   - Item 編號 (fullId)
   - Item 標題 (title)
   - 符合內容的片段 (snippet) + 高亮關鍵字
4. **高亮標注**：搜尋關鍵字在片段中特別標示

---

## 技術設計

### 1. 搜尋邏輯

**資料查詢**:

```typescript
// Server Action: searchProjectItems
async function searchProjectItems(projectId: number, query: string) {
  const items = await prisma.item.findMany({
    where: {
      projectId,
      isDeleted: false,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      fullId: true,
      title: true,
      content: true
    }
  });
  
  // 排序 (自然排序 fullId)
  const sorted = naturalSort(items, 'fullId');
  
  // 生成摘要片段
  return sorted.map(item => ({
    ...item,
    snippets: generateSnippets(item.title, item.content, query)
  }));
}
```

**自然排序實作**:

```typescript
function naturalSort(items: Item[], key: string): Item[] {
  return items.sort((a, b) => {
    const aParts = a[key].split('-').map(s => parseInt(s) || s);
    const bParts = b[key].split('-').map(s => parseInt(s) || s);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if (aParts[i] === undefined) return -1;
      if (bParts[i] === undefined) return 1;
      if (aParts[i] !== bParts[i]) {
        return typeof aParts[i] === 'number' && typeof bParts[i] === 'number'
          ? aParts[i] - bParts[i]
          : String(aParts[i]).localeCompare(String(bParts[i]));
      }
    }
    return 0;
  });
}
```

### 2. 片段生成邏輯

**摘要策略**:

- 找到關鍵字第一次出現的位置
- 提取前後各 60 字元作為上下文
- 如果開頭/結尾被截斷，加上 `...`
- 支援多個匹配位置（最多顯示 3 個片段）

```typescript
function generateSnippets(title: string, content: string, query: string): Snippet[] {
  const snippets: Snippet[] = [];
  const searchText = `${title}\n\n${content || ''}`;
  const lowerQuery = query.toLowerCase();
  const lowerText = searchText.toLowerCase();
  
  let startPos = 0;
  let matchCount = 0;
  const maxSnippets = 3;
  const contextLength = 60;
  
  while (matchCount < maxSnippets) {
    const matchIndex = lowerText.indexOf(lowerQuery, startPos);
    if (matchIndex === -1) break;
    
    const snippetStart = Math.max(0, matchIndex - contextLength);
    const snippetEnd = Math.min(searchText.length, matchIndex + query.length + contextLength);
    
    let snippet = searchText.substring(snippetStart, snippetEnd);
    
    // 加上省略符號
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetEnd < searchText.length) snippet = snippet + '...';
    
    snippets.push({
      text: snippet,
      matchStart: matchIndex - snippetStart + (snippetStart > 0 ? 3 : 0),
      matchLength: query.length,
      source: matchIndex < title.length ? 'title' : 'content'
    });
    
    startPos = matchIndex + query.length;
    matchCount++;
  }
  
  return snippets;
}
```

### 3. 高亮顯示

**前端實作**:

```typescript
function HighlightedSnippet({ snippet, query }: { snippet: Snippet; query: string }) {
  const { text, matchStart, matchLength } = snippet;
  
  const before = text.substring(0, matchStart);
  const match = text.substring(matchStart, matchStart + matchLength);
  const after = text.substring(matchStart + matchLength);
  
  return (
    <div className="snippet">
      {before}
      <mark style={{ background: 'var(--color-warning-soft)', fontWeight: 'bold' }}>
        {match}
      </mark>
      {after}
    </div>
  );
}
```

---

## UI 設計

### 搜尋框位置

在 **Project Detail 頁面**頂部（專案標題下方），顯示搜尋輸入框。

```
┌──────────────────────────────────────────────┐
│  專案: 需求管理專案 (WQ)                      │
├──────────────────────────────────────────────┤
│                                              │
│  🔍 [搜尋專案內容...........................] │
│                                              │
└──────────────────────────────────────────────┘
```

### 搜尋結果顯示

```
搜尋結果: 找到 5 個符合 "使用者" 的項目

┌────────────────────────────────────────────┐
│  WQ-1  需求管理項目一                       │
├────────────────────────────────────────────┤
│  ...登入功能需支援【使用者】名稱與密碼...    │
│  ...【使用者】權限分為四層: Viewer, Editor... │
│                                  [查看詳情] │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  WQ-1-1  使用者認證子系統                   │
├────────────────────────────────────────────┤
│  標題包含關鍵字                             │
│  ...【使用者】可透過 NextAuth.js 進行...     │
│                                  [查看詳情] │
└────────────────────────────────────────────┘
```

**UI 元件**:

- `ProjectSearchBar.tsx`: 搜尋輸入框 (含 debounce)
- `SearchResultList.tsx`: 結果列表
- `SearchResultCard.tsx`: 單一結果卡片 (含高亮片段)

---

## API 設計

### Server Action: `searchProjectItems`

```typescript
async function searchProjectItems(
  projectId: number,
  query: string
): Promise<SearchResult[]>

interface SearchResult {
  id: number;
  fullId: string;
  title: string;
  snippets: Snippet[];
}

interface Snippet {
  text: string;        // 片段文字
  matchStart: number;  // 關鍵字起始位置
  matchLength: number; // 關鍵字長度
  source: 'title' | 'content';
}
```

---

## 效能優化

### 1. 前端防抖 (Debounce)

避免每次輸入都觸發查詢，延遲 300ms 後才執行搜尋。

```typescript
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery.length >= 2) {
    searchProjectItems(projectId, debouncedQuery);
  }
}, [debouncedQuery]);
```

### 2. 資料庫索引

為 `title` 和 `content` 欄位建立索引（若使用 PostgreSQL）。

SQLite 的 `LIKE` 查詢效能可接受，若未來資料量大，可考慮：

- 遷移至 PostgreSQL + Full-Text Search
- 整合 Elasticsearch

### 3. 結果限制

限制最多顯示 50 個結果，避免 UI 過載。

```typescript
const items = await prisma.item.findMany({
  // ...
  take: 50
});
```

---

## 權限設計

所有登入使用者 (VIEWER 以上) 皆可使用搜尋功能。

---

## 實作步驟

### Phase 1: 後端 API (約 2 小時)

1. 實作 `searchProjectItems` Server Action
2. 實作 `naturalSort` 排序函數
3. 實作 `generateSnippets` 片段生成邏輯
4. 單元測試: 排序、片段生成

### Phase 2: 前端 UI (約 3 小時)

1. 建立 `ProjectSearchBar.tsx` (含 debounce)
2. 建立 `SearchResultList.tsx`
3. 建立 `SearchResultCard.tsx` (含高亮)
4. 整合至 Project Detail 頁面

### Phase 3: 驗證與優化 (約 1 小時)

1. 測試邊界情況 (無結果、特殊字元、HTML 標籤)
2. 優化樣式與響應式設計
3. 效能測試 (大量 Item)

---

## 預估工時

| 階段 | 工時 |
|------|------|
| 後端 API | 2h |
| 前端 UI | 3h |
| 驗證優化 | 1h |
| **總計** | **6h** |

---

## 測試清單

### 功能測試

- [ ] 搜尋標題關鍵字
- [ ] 搜尋內容關鍵字
- [ ] 同時匹配標題與內容
- [ ] 大小寫不敏感
- [ ] 結果正確排序 (WQ-1 < WQ-1-1 < WQ-2)

### 片段顯示

- [ ] 高亮關鍵字正確
- [ ] 片段截斷顯示省略符號
- [ ] 多個匹配位置正確顯示

### 邊界情況

- [ ] 無搜尋結果時顯示提示
- [ ] 短關鍵字 (1 字元) 不觸發搜尋
- [ ] 特殊字元查詢 (如 `[`, `*`)
- [ ] HTML 標籤不影響顯示 (需 escape)

### 效能

- [ ] Debounce 正常運作
- [ ] 大量結果 (50+) 不卡頓
- [ ] 已刪除 Item 不出現

---

## 未來擴充方向

1. **進階搜尋**:
   - 支援 AND/OR 邏輯
   - 日期範圍篩選
   - 作者篩選

2. **全域搜尋**:
   - 跨專案搜尋
   - 搜尋 Attachments 檔案名稱

3. **搜尋歷史**:
   - 儲存使用者搜尋記錄
   - 熱門搜尋關鍵字

4. **智能排序**:
   - 依相關性排序 (TF-IDF)
   - 優先顯示精確匹配
