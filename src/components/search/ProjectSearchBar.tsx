'use client';

import { useState, useEffect } from 'react';
import type { SearchResult } from '@/actions/search';

interface ProjectSearchBarProps {
    projectId: number;
    onSearch: (query: string) => void;
    onResultsChange: (results: SearchResult[], loading: boolean) => void;
}

export default function ProjectSearchBar({ projectId, onSearch, onResultsChange }: ProjectSearchBarProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Execute search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            onSearch(debouncedQuery);
        } else if (debouncedQuery.length === 0) {
            onResultsChange([], false);
        }
    }, [debouncedQuery, onSearch, onResultsChange]);

    const handleClear = () => {
        setQuery('');
        onResultsChange([], false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            handleClear();
        }
    };

    return (
        <div style={{
            position: 'relative',
            marginBottom: '2rem',
            maxWidth: '800px'
        }}>
            <div style={{ position: 'relative' }}>
                <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    opacity: 0.5
                }}>
                    🔍
                </span>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="搜尋專案內容 (標題、內容)..."
                    style={{
                        width: '100%',
                        padding: '0.75rem 3rem 0.75rem 3rem',
                        fontSize: '1rem',
                        border: '2px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-surface)',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-primary)';
                        e.target.style.boxShadow = '0 0 0 3px var(--color-primary-soft)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)';
                        e.target.style.boxShadow = 'none';
                    }}
                />

                {query && (
                    <button
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            opacity: 0.5,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        title="清除搜尋"
                    >
                        ✕
                    </button>
                )}
            </div>

            {query.length > 0 && query.length < 2 && (
                <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)'
                }}>
                    請輸入至少 2 個字元進行搜尋
                </div>
            )}
        </div>
    );
}
