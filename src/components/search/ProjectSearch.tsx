'use client';

import { useState, useCallback } from 'react';
import ProjectSearchBar from './ProjectSearchBar';
import SearchResultList from './SearchResultList';
import { searchProjectItems, type SearchResult } from '@/actions/search';

interface ProjectSearchProps {
    projectId: number;
}

export default function ProjectSearch({ projectId }: ProjectSearchProps) {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentQuery, setCurrentQuery] = useState('');

    const handleSearch = useCallback(async (query: string) => {
        setCurrentQuery(query);
        setLoading(true);
        try {
            const searchResults = await searchProjectItems(projectId, query);
            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const handleResultsChange = useCallback((newResults: SearchResult[], isLoading: boolean) => {
        setResults(newResults);
        setLoading(isLoading);
        if (newResults.length === 0) {
            setCurrentQuery('');
        }
    }, []);

    return (
        <div style={{ marginBottom: '2rem' }}>
            <ProjectSearchBar
                projectId={projectId}
                onSearch={handleSearch}
                onResultsChange={handleResultsChange}
            />
            <SearchResultList
                results={results}
                query={currentQuery}
                loading={loading}
            />
        </div>
    );
}
