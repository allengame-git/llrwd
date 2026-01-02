'use client';

import type { SearchResult } from '@/actions/search';
import SearchResultCard from './SearchResultCard';

interface SearchResultListProps {
    results: SearchResult[];
    query: string;
    loading: boolean;
}

export default function SearchResultList({ results, query, loading }: SearchResultListProps) {
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                搜尋中...
            </div>
        );
    }

    if (!query || query.length < 2) {
        return null;
    }

    if (results.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--color-border)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🔍</div>
                <div style={{ fontSize: '1.1rem' }}>未找到包含 "{query}" 的項目</div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>請嘗試其他關鍵字</div>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{
                marginBottom: '1rem',
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                fontWeight: '500'
            }}>
                搜尋結果: 找到 <strong style={{ color: 'var(--color-primary)' }}>{results.length}</strong> 個符合 "{query}" 的項目
            </div>

            {results.map(result => (
                <SearchResultCard key={result.id} result={result} />
            ))}
        </div>
    );
}
