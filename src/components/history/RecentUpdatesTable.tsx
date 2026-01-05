'use client';

import { useState } from 'react';

type UpdateRecord = {
    id: string;
    type: 'ITEM' | 'FILE';
    changeType: string;
    identifier: string;
    name: string;
    projectTitle: string;
    submittedBy: string;
    createdAt: Date;
};

// 相對時間格式化
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    return new Date(date).toLocaleDateString('zh-TW');
}

// 操作類型標籤
function getChangeTypeLabel(changeType: string): { label: string; color: string } {
    switch (changeType) {
        case 'CREATE': return { label: '新增', color: 'var(--color-success)' };
        case 'UPDATE': return { label: '編輯', color: 'var(--color-warning)' };
        case 'DELETE': return { label: '刪除', color: 'var(--color-danger)' };
        case 'RESTORE': return { label: '還原', color: 'var(--color-info, #3b82f6)' };
        default: return { label: changeType, color: 'var(--color-text-muted)' };
    }
}

export default function RecentUpdatesTable({ updates }: { updates: UpdateRecord[] }) {
    const [filter, setFilter] = useState<'ALL' | 'ITEM' | 'FILE'>('ALL');

    // 篩選資料
    const filteredUpdates = filter === 'ALL'
        ? updates
        : updates.filter(u => u.type === filter);

    return (
        <div className="glass" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            marginTop: '2rem'
        }}>
            {/* Header with filter */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h2 style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    📋 最近更新紀錄
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 'normal',
                        color: 'var(--color-text-muted)',
                        marginLeft: '0.5rem'
                    }}>
                        ({filteredUpdates.length} 筆)
                    </span>
                </h2>

                {/* Filter Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    backgroundColor: 'var(--color-bg-elevated)',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <button
                        onClick={() => setFilter('ALL')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: filter === 'ALL' ? 600 : 400,
                            backgroundColor: filter === 'ALL' ? 'var(--color-primary)' : 'transparent',
                            color: filter === 'ALL' ? 'white' : 'var(--color-text)',
                            transition: 'all 0.2s'
                        }}
                    >
                        全部
                    </button>
                    <button
                        onClick={() => setFilter('ITEM')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: filter === 'ITEM' ? 600 : 400,
                            backgroundColor: filter === 'ITEM' ? 'var(--color-primary)' : 'transparent',
                            color: filter === 'ITEM' ? 'white' : 'var(--color-text)',
                            transition: 'all 0.2s'
                        }}
                    >
                        📄 項目
                    </button>
                    <button
                        onClick={() => setFilter('FILE')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: filter === 'FILE' ? 600 : 400,
                            backgroundColor: filter === 'FILE' ? 'var(--color-primary)' : 'transparent',
                            color: filter === 'FILE' ? 'white' : 'var(--color-text)',
                            transition: 'all 0.2s'
                        }}
                    >
                        📁 檔案
                    </button>
                </div>
            </div>

            {filteredUpdates.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                    {filter === 'ALL' ? '尚無更新紀錄' : `尚無${filter === 'ITEM' ? '項目' : '檔案'}更新紀錄`}
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
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>類型</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>操作</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>編號/名稱</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>專案/年度</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>提交者</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>時間</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUpdates.map((update) => {
                                const changeInfo = getChangeTypeLabel(update.changeType);
                                return (
                                    <tr
                                        key={update.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                {update.type === 'ITEM' ? '📄' : '📁'}
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    {update.type === 'ITEM' ? '項目' : '檔案'}
                                                </span>
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                backgroundColor: `${changeInfo.color}20`,
                                                color: changeInfo.color,
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}>
                                                {changeInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div>
                                                <span style={{
                                                    fontFamily: 'var(--font-geist-mono)',
                                                    color: 'var(--color-primary)',
                                                    fontWeight: 600
                                                }}>
                                                    {update.identifier}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--color-text-muted)',
                                                marginTop: '0.15rem',
                                                maxWidth: '200px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {update.name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>
                                            {update.projectTitle}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {update.submittedBy}
                                        </td>
                                        <td style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'right',
                                            color: 'var(--color-text-muted)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {formatRelativeTime(update.createdAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
