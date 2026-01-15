const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllData() {
    try {
        const stats = {
            users: await prisma.user.count(),
            projects: await prisma.project.count(),
            items: await prisma.item.count(),
            itemRelations: await prisma.itemRelation.count(),
            itemReferences: await prisma.itemReference.count(),
            changeRequests: await prisma.changeRequest.count(),
            itemHistories: await prisma.itemHistory.count(),
            qcDocumentApprovals: await prisma.qCDocumentApproval.count(),
            qcDocumentRevisions: await prisma.qCDocumentRevision.count(),
            dataFiles: await prisma.dataFile.count(),
            dataFileChangeRequests: await prisma.dataFileChangeRequest.count(),
            dataFileHistories: await prisma.dataFileHistory.count(),
            notifications: await prisma.notification.count(),
            loginLogs: await prisma.loginLog.count(),
        };

        console.log('=== 資料庫表格統計 ===');
        console.log(JSON.stringify(stats, null, 2));

        let total = 0;
        Object.values(stats).forEach(count => total += count);
        console.log(`\n總記錄數: ${total}`);
    } catch (error) {
        console.error('錯誤:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllData();
