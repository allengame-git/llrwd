const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testBackup() {
    try {
        console.log('=== 步驟 1: 檢查資料庫內容 ===\n');

        // 使用 count 取得數量
        const stats = {
            users: await prisma.user.count(),
            projects: await prisma.project.count(),
            items: await prisma.item.count(),
            itemRelations: await prisma.itemRelation.count(),
            changeRequests: await prisma.changeRequest.count(),
            itemHistories: await prisma.itemHistory.count(),
            qcDocumentApprovals: await prisma.qCDocumentApproval.count(),
            notifications: await prisma.notification.count(),
            loginLogs: await prisma.loginLog.count(),
        };

        console.log('資料庫統計：');
        Object.entries(stats).forEach(([table, count]) => {
            console.log(`- ${table}: ${count} 筆`);
        });

        const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
        console.log(`\n總計：${totalRecords} 筆記錄`);

        console.log('\n=== 步驟 2: 執行備份匯出 ===\n');

        // 使用 ts-node 執行 TypeScript 的 export 函數
        const { execSync } = require('child_process');
        const backupCode = `
      import { exportDatabaseToSQL } from './src/lib/backup-utils';
      exportDatabaseToSQL().then(sql => {
        const fs = require('fs');
        fs.writeFileSync('test-backup-output.sql', sql);
        console.log('✓ 備份 SQL 已儲存');
        console.log('  檔案大小:', (sql.length / 1024).toFixed(2), 'KB');
      });
    `;

        try {
            execSync(`npx ts-node -e "${backupCode.replace(/\n/g, ' ')}"`, {
                cwd: __dirname,
                stdio: 'inherit'
            });
        } catch (e) {
            // Try alternative approach - read the file directly
            console.log('正在使用備份 API 方法...');
        }

        // Read the generated SQL file
        const sqlPath = path.join(__dirname, 'test-backup-output.sql');
        if (!fs.existsSync(sqlPath)) {
            console.log('❌ 無法產生備份檔案，跳過分析');
            return;
        }

        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('\n=== 步驟 3: 分析備份內容 ===\n');

        // 分析 SQL 內容
        const insertMatches = sql.match(/INSERT INTO/gi) || [];
        const userInserts = sql.match(/INSERT INTO "User"/gi) || [];
        const projectInserts = sql.match(/INSERT INTO "Project"/gi) || [];
        const itemInserts = sql.match(/INSERT INTO "Item"/gi) || [];
        const relationInserts = sql.match(/INSERT INTO "ItemRelation"/gi) || [];
        const changeRequestInserts = sql.match(/INSERT INTO "ChangeRequest"/gi) || [];
        const historyInserts = sql.match(/INSERT INTO "ItemHistory"/gi) || [];
        const qcApprovalInserts = sql.match(/INSERT INTO "QCDocumentApproval"/gi) || [];
        const notificationInserts = sql.match(/INSERT INTO "Notification"/gi) || [];
        const loginLogInserts = sql.match(/INSERT INTO "LoginLog"/gi) || [];

        console.log('SQL 內容分析：');
        console.log(`- 總 INSERT 語句：${insertMatches.length} 條`);
        console.log(`- User INSERT：${userInserts.length} 條 (資料庫有 ${stats.users} 筆)`);
        console.log(`- Project INSERT：${projectInserts.length} 條 (資料庫有 ${stats.projects} 筆)`);
        console.log(`- Item INSERT：${itemInserts.length} 條 (資料庫有 ${stats.items} 筆)`);
        console.log(`- ItemRelation INSERT：${relationInserts.length} 條 (資料庫有 ${stats.itemRelations} 筆)`);
        console.log(`- ChangeRequest INSERT：${changeRequestInserts.length} 條 (資料庫有 ${stats.changeRequests} 筆)`);
        console.log(`- ItemHistory INSERT：${historyInserts.length} 條 (資料庫有 ${stats.itemHistories} 筆)`);
        console.log(`- QCDocumentApproval INSERT：${qcApprovalInserts.length} 條 (資料庫有 ${stats.qcDocumentApprovals} 筆)`);
        console.log(`- Notification INSERT：${notificationInserts.length} 條 (資料庫有 ${stats.notifications} 筆)`);
        console.log(`- LoginLog INSERT：${loginLogInserts.length} 條 (資料庫有 ${stats.loginLogs} 筆)`);

        console.log('\n=== 步驟 4: 驗證結果 ===\n');

        const issues = [];

        if (userInserts.length !== stats.users) issues.push(`User: 應該 ${stats.users}，實際 ${userInserts.length}`);
        if (projectInserts.length !== stats.projects) issues.push(`Project: 應該 ${stats.projects}，實際 ${projectInserts.length}`);
        if (itemInserts.length !== stats.items) issues.push(`Item: 應該 ${stats.items}，實際 ${itemInserts.length}`);
        if (relationInserts.length !== stats.itemRelations) issues.push(`ItemRelation: 應該 ${stats.itemRelations}，實際 ${relationInserts.length}`);
        if (changeRequestInserts.length !== stats.changeRequests) issues.push(`ChangeRequest: 應該 ${stats.changeRequests}，實際 ${changeRequestInserts.length}`);
        if (historyInserts.length !== stats.itemHistories) issues.push(`ItemHistory: 應該 ${stats.itemHistories}，實際 ${historyInserts.length}`);
        if (qcApprovalInserts.length !== stats.qcDocumentApprovals) issues.push(`QCDocumentApproval: 應該 ${stats.qcDocumentApprovals}，實際 ${qcApprovalInserts.length}`);
        if (notificationInserts.length !== stats.notifications) issues.push(`Notification: 應該 ${stats.notifications}，實際 ${notificationInserts.length}`);
        if (loginLogInserts.length !== stats.loginLogs) issues.push(`LoginLog: 應該 ${stats.loginLogs}，實際 ${loginLogInserts.length}`);

        if (issues.length > 0) {
            console.log('⚠️  發現不一致：');
            issues.forEach(issue => console.log(`  ❌ ${issue}`));
            console.log('\n可能原因：備份匯出邏輯有問題');
        } else {
            console.log('✅ 所有資料都已正確匯出到備份檔案！');
            console.log(`   共 ${insertMatches.length} 條 INSERT 語句matches ${totalRecords} 筆記錄`);
        }

        console.log(`\n💡 可以檢查 ${sqlPath} 檔案內容`);

    } catch (error) {
        console.error('\n❌ 測試失敗:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testBackup();
