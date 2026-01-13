import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportDatabaseToSQL, generateDatabaseManifest } from '@/lib/backup-utils';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // 1. 權限驗證
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: '權限不足，僅限管理員操作' }, { status: 403 });
        }

        // 2. 生成時間戳
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const filename = `database-${dateStr}.zip`;

        // 3. 匯出資料庫
        const sqlDump = await exportDatabaseToSQL();
        const manifest = await generateDatabaseManifest();

        // 4. 建立 ZIP 檔案
        const archive = archiver('zip', { zlib: { level: 9 } });
        const passthrough = new PassThrough();

        archive.pipe(passthrough);

        // 加入 SQL 檔案
        archive.append(sqlDump, { name: 'rms_db.sql' });

        // 加入 manifest.json
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

        // 完成壓縮
        archive.finalize();

        // 5. 轉換為 Web Stream
        const readable = new ReadableStream({
            start(controller) {
                passthrough.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                passthrough.on('end', () => {
                    controller.close();
                });
                passthrough.on('error', (err) => {
                    controller.error(err);
                });
            },
        });

        // 6. 回傳下載
        const encodedFilename = encodeURIComponent(filename);
        return new Response(readable, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
            },
        });
    } catch (error) {
        console.error('Database backup error:', error);
        return NextResponse.json(
            { error: '備份失敗: ' + (error instanceof Error ? error.message : '未知錯誤') },
            { status: 500 }
        );
    }
}
