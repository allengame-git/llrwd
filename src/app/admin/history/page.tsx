import { getProjectHistoryStats, getRecentUpdates } from "@/actions/history";
import RecentUpdatesTable from "@/components/history/RecentUpdatesTable";
import ProjectCard from "@/components/history/ProjectCard";

export const dynamic = 'force-dynamic';

export default async function GlobalHistoryDashboard() {
    const projects = await getProjectHistoryStats();
    const recentUpdates = await getRecentUpdates(100);

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    color: 'var(--color-text-main)'
                }}>
                    全域變更歷史
                </h1>
                <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-text-muted)',
                    margin: 0
                }}>
                    選擇專案查看其變更歷史，包含已刪除的項目
                </p>
            </div>

            {/* Project Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem'
            }}>
                {projects.map(p => (
                    <ProjectCard
                        key={p.id}
                        id={p.id}
                        title={p.title}
                        codePrefix={p.codePrefix}
                        itemCount={p._count.items}
                        lastUpdate={p.itemHistories.length > 0 ? p.itemHistories[0].createdAt : null}
                    />
                ))}
            </div>

            {/* Recent Updates Section with Filter */}
            <RecentUpdatesTable updates={recentUpdates} />
        </div>
    )
}
