const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        // 檢查是否已有管理員
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (existingAdmin) {
            console.log('✓ 管理員帳號已存在:', existingAdmin.username);
            return;
        }

        // 創建新管理員
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
            }
        });

        console.log('✓ 緊急管理員帳號已創建！');
        console.log('  帳號: admin');
        console.log('  密碼: admin123');
        console.log('  角色: ADMIN');
        console.log('\n⚠️  請立即登入並修改密碼！');
    } catch (error) {
        console.error('❌ 創建管理員失敗:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
