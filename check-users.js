const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        console.log('=== 資料庫使用者列表 ===');
        console.log(JSON.stringify(users, null, 2));
        console.log(`\n總共 ${users.length} 個使用者`);
    } catch (error) {
        console.error('錯誤:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
