-- CreateTable
CREATE TABLE "ItemHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER,
    "version" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "snapshot" TEXT NOT NULL,
    "diff" TEXT,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewStatus" TEXT NOT NULL,
    "reviewNote" TEXT,
    "changeRequestId" INTEGER,
    "itemFullId" TEXT NOT NULL,
    "itemTitle" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ItemHistory_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemHistory_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ItemHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "attachments" TEXT,
    "publishedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" INTEGER,
    "projectId" INTEGER NOT NULL,
    CONSTRAINT "Item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Item_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("attachments", "content", "createdAt", "fullId", "id", "isDeleted", "parentId", "projectId", "publishedAt", "title", "updatedAt") SELECT "attachments", "content", "createdAt", "fullId", "id", "isDeleted", "parentId", "projectId", "publishedAt", "title", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_fullId_key" ON "Item"("fullId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ItemHistory_itemId_version_idx" ON "ItemHistory"("itemId", "version");

-- CreateIndex
CREATE INDEX "ItemHistory_itemId_createdAt_idx" ON "ItemHistory"("itemId", "createdAt");
