import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function getStats() {
  const [projectCount, itemCount, fileCount, pendingChangeRequests, pendingFileRequests] = await Promise.all([
    prisma.project.count(),
    prisma.item.count({ where: { isDeleted: false } }),
    prisma.dataFile.count(),
    prisma.changeRequest.count({ where: { status: "PENDING" } }),
    prisma.dataFileChangeRequest.count({ where: { status: "PENDING" } })
  ]);

  return {
    projectCount,
    itemCount,
    fileCount,
    pendingCount: pendingChangeRequests + pendingFileRequests
  };
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <main className="flex-col gap-md">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ marginBottom: '0.75rem', fontSize: '2rem' }}>
            低放射性類廢棄物處置管理系統
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
            Radioactive Waste Management System
          </p>

          {session?.user ? (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontSize: '1.1rem' }}>
                歡迎回來，<strong style={{ color: 'var(--color-primary)' }}>{session.user.username}</strong>
              </span>
              <span style={{
                marginLeft: '0.75rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                borderRadius: '1rem'
              }}>
                {session.user.role}
              </span>
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem' }}>
              <Link href="/auth/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                登入系統
              </Link>
            </div>
          )}
        </div>

        {/* Stats Dashboard */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {/* Projects */}
          <div className="glass" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))',
            borderLeft: '4px solid var(--color-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📁</span>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>專案管理</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              {stats.projectCount}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              個管理專案
            </div>
          </div>

          {/* Items */}
          <div className="glass" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))',
            borderLeft: '4px solid var(--color-success)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📄</span>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>需求項目</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
              {stats.itemCount}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              筆需求紀錄
            </div>
          </div>

          {/* Files */}
          <div className="glass" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))',
            borderLeft: '4px solid var(--color-warning)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>資料檔案</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
              {stats.fileCount}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              份上傳檔案
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
