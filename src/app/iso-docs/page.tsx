import { getIsoDocsGroupedByProject, getRecentIsoDocUpdates } from '@/actions/history';
import Link from 'next/link';
import { formatDate } from '@/lib/date-utils';
import IsoDocSearch from '@/components/iso-docs/IsoDocSearch';

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

export default async function IsoDocsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const query = typeof params.q === 'string' ? params.q : undefined;

    const projects = await getIsoDocsGroupedByProject(query) as IsoDocProject[];
    const recentDocs = await getRecentIsoDocUpdates(50, query) as RecentIsoDoc[];


    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>
                    🗃️ ISO 品質文件
                </h1>
                <IsoDocSearch />
            </div>

            <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                選擇專案查看其品質文件，或瀏覽下方的最近更新紀錄。
            </p>

            {/* Project Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                {projects.length > 0 ? (
                    projects.map(p => (
                        <Link href={`/iso-docs/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                                    <div style={{ fontSize: '1.5rem' }}>📋</div>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold' }}>{p.isoDocCount}</span> 份文件
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)' }}>
                                        {p.lastUpdated ? `最後更新: ${formatDate(p.lastUpdated)}` : '尚無文件'}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div style={{ colSpan: 'full', color: 'var(--color-text-muted)', padding: '1rem 0' }}>
                        {query ? '沒有符合搜尋條件的專案' : '尚無專案資料'}
                    </div>
                )}
            </div>

            {/* Recent Updates Section */}
            <div className="glass" style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)'
            }}>
                <h2 style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    📋 最近更新紀錄
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 'normal',
                        color: 'var(--color-text-muted)',
                        marginLeft: '0.5rem'
                    }}>
                        ({recentDocs.length} 筆)
                    </span>
                </h2>

                {recentDocs.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                        {query ? '沒有符合搜尋條件的文件紀錄' : '尚無品質文件紀錄'}
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.9rem'
                        }}>
                            <thead>
                                <tr style={{
                                    borderBottom: '2px solid var(--color-border)',
                                    textAlign: 'left'
                                }}>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>項目編號</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>標題</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>專案</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>提交者</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>狀態</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>時間</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>下載</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDocs.map((doc) => {
                                    return (
                                        <tr
                                            key={doc.id}
                                            style={{
                                                borderBottom: '1px solid var(--color-border)',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <Link
                                                    href={`/admin/history/detail/${doc.id}`}
                                                    style={{
                                                        fontFamily: 'var(--font-geist-mono)',
                                                        color: 'var(--color-primary)',
                                                        fontWeight: 600,
                                                        textDecoration: 'none'
                                                    }}
                                                    className="hover:underline"
                                                >
                                                    {doc.item?.fullId || doc.itemFullId}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{
                                                    maxWidth: '300px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {doc.item?.title || doc.itemTitle}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>
                                                {doc.project?.title || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {doc.submittedBy?.username || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                {doc.qcApproval?.status === 'REVISION_REQUIRED' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            backgroundColor: 'rgba(249, 168, 37, 0.15)',
                                                            color: '#d97706',
                                                            borderRadius: '12px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            border: '1px solid rgba(249, 168, 37, 0.3)'
                                                        }}>
                                                            待修訂
                                                        </span>
                                                        {(doc.qcApproval.revisionCount || 0) > 0 && (
                                                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                                                (修訂 {doc.qcApproval.revisionCount} 次)
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : doc.qcApproval?.status === 'REJECTED' ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                                    }}>
                                                        已退回
                                                    </span>
                                                ) : doc.qcApproval?.status === 'COMPLETED' ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                                        color: '#10b981',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>
                                                        已完成
                                                    </span>
                                                ) : doc.qcApproval?.status === 'PENDING_QC' ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                                        color: 'var(--color-warning)',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>
                                                        待 QC 簽核
                                                    </span>
                                                ) : doc.qcApproval?.status === 'PENDING_PM' ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                                        color: 'var(--color-info)',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>
                                                        待 PM 簽核
                                                    </span>
                                                ) : doc.qcApproval?.status === 'APPROVED' ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                                        color: '#10b981',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>
                                                        已核准
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                textAlign: 'right',
                                                color: 'var(--color-text-muted)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {formatDate(doc.createdAt)}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {doc.isoDocPath ? (
                                                    <a
                                                        href={doc.isoDocPath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline"
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            fontSize: '0.85rem',
                                                            textDecoration: 'none',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}
                                                    >
                                                        📄 下載
                                                    </a>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>-</span>
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
