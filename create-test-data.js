const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
    try {
        console.log('開始建立測試資料...\n');

        // 1. 建立測試專案
        const project = await prisma.project.create({
            data: {
                codePrefix: 'TEST',
                title: '測試專案',
                description: '用於測試備份復原功能的專案',
            }
        });
        console.log('✓ 已建立測試專案:', project.title);

        // 2. 建立測試項目
        const item1 = await prisma.item.create({
            data: {
                projectId: project.id,
                itemCode: 'ITEM-001',
                name: '測試項目 1',
                description: '這是第一個測試項目',
                type: 'MATERIAL',
                status: 'ACTIVE',
            }
        });
        console.log('✓ 已建立測試項目 1:', item1.name);

        const item2 = await prisma.item.create({
            data: {
                projectId: project.id,
                itemCode: 'ITEM-002',
                name: '測試項目 2',
                description: '這是第二個測試項目',
                type: 'COMPONENT',
                status: 'ACTIVE',
            }
        });
        console.log('✓ 已建立測試項目 2:', item2.name);

        // 3. 建立項目關聯
        const relation = await prisma.itemRelation.create({
            data: {
                parentId: item1.id,
                childId: item2.id,
                relationType: 'COMPOSITION',
            }
        });
        console.log('✓ 已建立項目關聯');

        // 4. 建立數據檔案記錄
        const dataFile = await prisma.dataFile.create({
            data: {
                filename: 'test-document.pdf',
                originalName: '測試文件.pdf',
                mimeType: 'application/pdf',
                size: 1024,
                filePath: '/uploads/test-document.pdf',
                fileType: 'ISO_DOC',
            }
        });
        console.log('✓ 已建立數據檔案記錄');

        // 5. 顯示最終統計
        const stats = {
            projects: await prisma.project.count(),
            items: await prisma.item.count(),
            itemRelations: await prisma.itemRelation.count(),
            dataFiles: await prisma.dataFile.count(),
        };

        console.log('\n=== 測試資料建立完成 ===');
        console.log('專案數:', stats.projects);
        console.log('項目數:', stats.items);
        console.log('關聯數:', stats.itemRelations);
        console.log('檔案數:', stats.dataFiles);

    } catch (error) {
        console.error('❌ 建立測試資料失敗:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestData();
