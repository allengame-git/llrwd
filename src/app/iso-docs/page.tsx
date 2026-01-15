import { getIsoDocsGroupedByProject, getRecentIsoDocUpdates } from '@/actions/history';
import Link from 'next/link';
import { formatDate } from '@/lib/date-utils';
import IsoDocSearch from '@/components/iso-docs/IsoDocSearch';
import IsoDocProjectCard from '@/components/iso-docs/IsoDocProjectCard';

export const dynamic = 'force-dynamic';

type IsoDocProject = {
    id: number;
    title: string;
    codePrefix: string;
    isoDocCount: number;
    lastUpdated: Date | null;
};

type RecentIsoDoc = {
    id: number;
    itemFullId: string;
    itemTitle: string;
    version: number;
    changeType: string;
    createdAt: Date;
    isoDocPath: string | null;
    project: { title: string; codePrefix: string } | null;
    item: { fullId: string; title: string } | null;
    submittedBy: { username: string } | null;
    reviewedBy: { username: string } | null;
    qcApproval: { status: string; revisionCount?: number } | null;
};

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 狀態標籤配置
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    'REVISION_REQUIRED': { label: '待修訂', color: '#d97706', bgColor: 'rgba(249, 168, 37, 0.15)' },
    'REJECTED': { label: '已退回', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
    'COMPLETED': { label: '已完成', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
    'PENDING_QC': { label: '待 QC 簽核', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)' },
    'PENDING_PM': { label: '待 PM 簽核', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
    'APPROVED': { label: '已核准', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' }
};

export default async function IsoDocsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const query = typeof params.q === 'string' ? params.q : undefined;

    const projects = await getIsoDocsGroupedByProject(query) as IsoDocProject[];
    const recentDocs = await getRecentIsoDocUpdates(50, query) as RecentIsoDoc[];

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--color-border)',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-main)'
                    }}>
                        ISO 品質文件
                    </h1>
                    <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-text-muted)',
                        margin: 0
                    }}>
                        選擇專案查看其品質文件，或瀏覽下方的最近更新紀錄
                    </p>
                </div>
                <IsoDocSearch />
            </div>

            {/* Project Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem'
            }}>
                {projects.length > 0 ? (
                    projects.map(p => (
                        <IsoDocProjectCard
                            key={p.id}
                            id={p.id}
                            title={p.title}
                            codePrefix={p.codePrefix}
                            isoDocCount={p.isoDocCount}
                            lastUpdated={p.lastUpdated}
                        />
                    ))
                ) : (
                    <div style={{
                        gridColumn: '1 / -1',
                        color: 'var(--color-text-muted)',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--color-border)'
                    }}>
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            style={{ marginBottom: '0.75rem', opacity: 0.4 }}
                        >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            {query ? '沒有符合搜尋條件的專案' : '尚無專案資料'}
                        </p>
                    </div>
                )}
            </div>

            {/* Recent Updates Section */}
            <div className="glass" style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: '0.25rem',
                            color: 'var(--color-text-main)'
                        }}>
                            最近更新紀錄
                        </h2>
                        <span style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)'
                        }}>
                            共 {recentDocs.length} 筆紀錄
                        </span>
                    </div>
                </div>

                {recentDocs.length === 0 ? (
                    <div style={{
                        color: 'var(--color-text-muted)',
                        textAlign: 'center',
                        padding: '3rem 2rem',
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed var(--color-border)'
                    }}>
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            style={{ marginBottom: '0.75rem', opacity: 0.4 }}
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            {query ? '沒有符合搜尋條件的文件紀錄' : '尚無品質文件紀錄'}
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.85rem'
                        }}>
                            <thead>
                                <tr style={{
                                    borderBottom: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-elevated)',
                                    textAlign: 'left'
                                }}>
                                    <th style={thStyle}>項目編號</th>
                                    <th style={thStyle}>標題</th>
                                    <th style={thStyle}>專案</th>
                                    <th style={thStyle}>提交者</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>狀態</th>
                                    <th style={thStyle}>時間</th>
                                    <th style={thStyle}>下載</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDocs.map((doc) => {
                                    const status = doc.qcApproval?.status;
                                    const statusInfo = status ? statusConfig[status] : null;

                                    return (
                                        <tr
                                            key={doc.id}
                                            style={{
                                                borderBottom: '1px solid var(--color-border)',
                                                transition: 'background-color 0.15s'
                                            }}
                                        >
                                            <td style={tdStyle}>
                                                <Link
                                                    href={`/admin/history/detail/${doc.id}`}
                                                    style={{
                                                        fontFamily: 'var(--font-geist-mono)',
                                                        color: 'var(--color-primary)',
                                                        fontWeight: 600,
                                                        textDecoration: 'none',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    {doc.item?.fullId || doc.itemFullId}
                                                </Link>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{
                                                    maxWidth: '250px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {doc.item?.title || doc.itemTitle}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                {doc.project?.title || '—'}
                                            </td>
                                            <td style={tdStyle}>
                                                {doc.submittedBy?.username || '—'}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                {statusInfo ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: statusInfo.bgColor,
                                                            color: statusInfo.color,
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600
                                                        }}>
                                                            {statusInfo.label}
                                                        </span>
                                                        {status === 'REVISION_REQUIRED' && (doc.qcApproval?.revisionCount || 0) > 0 && (
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                                                                修訂 {doc.qcApproval?.revisionCount} 次
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{
                                                ...tdStyle,
                                                color: 'var(--color-text-muted)',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8rem'
                                            }}>
                                                {formatDate(doc.createdAt)}
                                            </td>
                                            <td style={tdStyle}>
                                                {doc.isoDocPath ? (
                                                    <a
                                                        href={doc.isoDocPath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline"
                                                        style={{
                                                            padding: '0.3rem 0.75rem',
                                                            fontSize: '0.75rem',
                                                            textDecoration: 'none',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem'
                                                        }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="7 10 12 15 17 10" />
                                                            <line x1="12" y1="15" x2="12" y2="3" />
                                                        </svg>
                                                        下載
                                                    </a>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    fontWeight: 600,
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
};

const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    verticalAlign: 'middle'
};
