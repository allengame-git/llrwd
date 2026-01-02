'use server';

import { prisma } from '@/lib/prisma';
import { naturalSort, generateSnippets, stripHtmlTags, type Snippet } from '@/lib/search-utils';

export interface SearchResult {
    id: number;
    fullId: string;
    title: string;
    snippets: Snippet[];
}

/**
 * Search items within a project
 */
export async function searchProjectItems(
    projectId: number,
    query: string
): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const trimmedQuery = query.trim();

    // Query database - may over-match (including HTML tags)
    const items = await prisma.item.findMany({
        where: {
            projectId,
            isDeleted: false,
            OR: [
                { title: { contains: trimmedQuery } },
                { content: { contains: trimmedQuery } }
            ]
        },
        select: {
            id: true,
            fullId: true,
            title: true,
            content: true
        },
        take: 50
    });

    // Filter: only keep items where query exists in plain text (not just HTML)
    const filteredItems = items.filter(item => {
        const plainContent = stripHtmlTags(item.content);
        const searchableText = `${item.title}\n\n${plainContent}`.toLowerCase();
        return searchableText.includes(trimmedQuery.toLowerCase());
    });

    // Sort by fullId (natural sort)
    const sorted = naturalSort(filteredItems, 'fullId');

    // Generate snippets
    return sorted.map(item => ({
        id: item.id,
        fullId: item.fullId,
        title: item.title,
        snippets: generateSnippets(item.title, item.content, trimmedQuery)
    }));
}
