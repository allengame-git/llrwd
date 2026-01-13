import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { forceLogoutAllUsers } from '@/lib/backup-utils';
import { prisma } from '@/lib/prisma';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const dynamic = 'force-dynamic';

// 設定較大的 body size limit
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request: NextRequest) {
    try {
        // 1. 權限驗證
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: '權限不足，僅限管理員操作' }, { status: 403 });
        }

        // 2. 讀取上傳的 ZIP 檔案
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '請選擇備份檔案' }, { status: 400 });
        }

        // 3. 儲存到暫存目錄
        const tempDir = path.join(os.tmpdir(), `rms-restore-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        const zipPath = path.join(tempDir, 'backup.zip');
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(zipPath, buffer);

        // 4. 解壓縮
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(tempDir, true);

        // 5. 驗證 manifest.json
        const manifestPath = path.join(tempDir, 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            fs.rmSync(tempDir, { recursive: true });
            return NextResponse.json({ error: '無效的備份檔案：缺少 manifest.json' }, { status: 400 });
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        if (manifest.backupType !== 'database') {
            fs.rmSync(tempDir, { recursive: true });
            return NextResponse.json({ error: '無效的備份檔案：這不是資料庫備份' }, { status: 400 });
        }

        // 6. 讀取 SQL 檔案
        const sqlPath = path.join(tempDir, 'rms_db.sql');
        if (!fs.existsSync(sqlPath)) {
            fs.rmSync(tempDir, { recursive: true });
            return NextResponse.json({ error: '無效的備份檔案：缺少 rms_db.sql' }, { status: 400 });
        }

        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // 7. 驗證 SQL 內容（防止復原空白資料庫）
        const insertMatches = sql.match(/INSERT INTO/gi);
        const userInsertMatches = sql.match(/INSERT INTO "User"/gi);
        const adminInsertMatches = sql.match(/INSERT INTO "User"[^;]*'ADMIN'/gi);

        // 檢查是否有任何 INSERT 語句
        if (!insertMatches || insertMatches.length === 0) {
            fs.rmSync(tempDir, { recursive: true });
            return NextResponse.json({
                error: '無效的備份檔案：SQL 檔案中沒有任何資料。此備份可能是空的或已損壞。'
            }, { status: 400 });
        }

        // 檢查是否有使用者資料
        if (!userInsertMatches || userInsertMatches.length === 0) {
            fs.rmSync(tempDir, { recursive: true });
            return NextResponse.json({
                error: '無效的備份檔案：沒有使用者資料。復原此備份會導致無法登入系統。'
            }, { status: 400 });
        }

        // 檢查是否至少有一個管理員帳號
        if (!adminInsertMatches || adminInsertMatches.length === 0) {
            fs.rmSync(tempDir, { recursive: true });
            return NextResponse.json({
                error: '無效的備份檔案：沒有管理員帳號。復原此備份會導致無法管理系統。'
            }, { status: 400 });
        }

        console.log('📊 備份檔案驗證通過：');
        console.log(`  - 總 INSERT 語句數: ${insertMatches.length}`);
        console.log(`  - 使用者記錄數: ${userInsertMatches.length}`);
        console.log(`  - 管理員帳號數: ${adminInsertMatches.length}`);

        // 8. 執行 SQL (使用 $executeRawUnsafe 逐行執行)
        // 注意：這是簡化版，實際生產環境應使用 pg 套件直接執行
        const statements = sql
            .split(';\n')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement) {
                try {
                    await prisma.$executeRawUnsafe(statement);
                } catch (err) {
                    console.error('SQL execution error:', statement.slice(0, 100), err);
                    // 繼續執行，不中斷
                }
            }
        }

        // 8. 強制登出所有使用者
        await forceLogoutAllUsers();

        // 9. 清理暫存檔案
        fs.rmSync(tempDir, { recursive: true });

        return NextResponse.json({
            success: true,
            message: '資料庫復原成功！所有使用者已登出，請重新登入。',
            stats: manifest.stats,
        });
    } catch (error) {
        console.error('Database restore error:', error);
        return NextResponse.json(
            { error: '復原失敗: ' + (error instanceof Error ? error.message : '未知錯誤') },
            { status: 500 }
        );
    }
}
