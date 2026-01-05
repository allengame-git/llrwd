import { getProjectHistoryStats, getRecentUpdates } from "@/actions/history";
import Link from "next/link";
import RecentUpdatesTable from "@/components/history/RecentUpdatesTable";

export const dynamic = 'force-dynamic';

export default async function GlobalHistoryDashboard() {
    const projects = await getProjectHistoryStats();
    const recentUpdates = await getRecentUpdates(100);

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>全域變更歷史</h1>
            <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>選擇專案查看其變更歷史，包含已刪除的項目。</p>

            {/* Project Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {projects.map(p => (
                    <Link href={`/admin/history/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass" style={{
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{p.title}</h2>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-geist-mono)' }}>{p.codePrefix}</div>
                                </div>
                                <div style={{ fontSize: '1.5rem' }}>📁</div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>{p._count.items}</span> 個項目
                                </div>
                                <div style={{ color: 'var(--color-text-muted)' }}>
                                    {p.itemHistories.length > 0 ? (
                                        `最後更新: ${new Date(p.itemHistories[0].createdAt).toLocaleDateString('zh-TW')}`
                                    ) : '尚無歷史'}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Updates Section with Filter */}
            <RecentUpdatesTable updates={recentUpdates} />
        </div>
    )
}
