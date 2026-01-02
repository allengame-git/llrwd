"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type HistoryItem = {
    fullId: string;
    title: string;
    isDeleted: boolean;
    historyCount: number;
};

export default function HistorySidebar({ items, projectId }: { items: HistoryItem[], projectId: number }) {
    const [search, setSearch] = useState('');
    const pathname = usePathname();

    const filtered = items.filter(i =>
        i.fullId.toLowerCase().includes(search.toLowerCase()) ||
        i.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafafa', borderRight: '1px solid var(--color-border)', width: '300px' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: '#fff' }}>
                <Link href="/admin/history" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'block', textDecoration: 'none' }}>
                    &larr; Back to Projects
                </Link>
                <div style={{ marginBottom: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search items..."
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {filtered.length} items found
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {filtered.map(item => {
                    const isActive = pathname.includes(`/item/${item.fullId}`);
                    return (
                        <Link
                            key={item.fullId}
                            href={`/admin/history/${projectId}/item/${item.fullId}`}
                            style={{
                                display: 'block',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '0.25rem',
                                textDecoration: 'none',
                                color: 'inherit',
                                background: isActive ? 'rgba(0,0,0,0.05)' : 'transparent',
                                border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                <span style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 'bold', fontSize: '0.9rem', color: item.isDeleted ? 'var(--color-text-muted)' : 'var(--color-primary)', textDecoration: item.isDeleted ? 'line-through' : 'none' }}>
                                    {item.fullId}
                                </span>
                                {item.isDeleted && <span style={{ fontSize: '0.7rem', background: 'rgba(255,0,0,0.1)', color: 'red', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Deleted</span>}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: item.isDeleted ? 'var(--color-text-muted)' : 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                {item.historyCount} changes
                            </div>
                        </Link>
                    )
                })}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No items found</div>
                )}
            </div>
        </div>
    )
}
