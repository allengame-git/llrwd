// Search utility functions

/**
 * Natural sort for item fullIds (e.g., WQ-1, WQ-1-1, WQ-2, WQ-10)
 */
export function naturalSort<T>(items: T[], key: keyof T): T[] {
    return items.sort((a, b) => {
        const aValue = String(a[key]);
        const bValue = String(b[key]);

        const aParts = aValue.split('-').map(s => {
            const num = parseInt(s);
            return isNaN(num) ? s : num;
        });
        const bParts = bValue.split('-').map(s => {
            const num = parseInt(s);
            return isNaN(num) ? s : num;
        });

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            if (aParts[i] === undefined) return -1;
            if (bParts[i] === undefined) return 1;

            if (aParts[i] !== bParts[i]) {
                if (typeof aParts[i] === 'number' && typeof bParts[i] === 'number') {
                    return (aParts[i] as number) - (bParts[i] as number);
                }
                return String(aParts[i]).localeCompare(String(bParts[i]));
            }
        }
        return 0;
    });
}

export interface Snippet {
    text: string;
    matchStart: number;
    matchLength: number;
    source: 'title' | 'content';
}

/**
 * Strip HTML tags and decode entities for plain text search
 */
export function stripHtmlTags(html: string | null): string {
    if (!html) return '';

    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');

    // Decode common HTML entities
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

/**
 * Generate snippets with keyword highlighting context
 */
export function generateSnippets(
    title: string,
    content: string | null,
    query: string
): Snippet[] {
    const snippets: Snippet[] = [];

    // Strip HTML from content before searching
    const plainContent = stripHtmlTags(content);
    const searchText = `${title}\n\n${plainContent}`;

    const lowerQuery = query.toLowerCase();
    const lowerText = searchText.toLowerCase();

    let startPos = 0;
    let matchCount = 0;
    const maxSnippets = 3;
    const contextLength = 60;

    while (matchCount < maxSnippets) {
        const matchIndex = lowerText.indexOf(lowerQuery, startPos);
        if (matchIndex === -1) break;

        const snippetStart = Math.max(0, matchIndex - contextLength);
        const snippetEnd = Math.min(searchText.length, matchIndex + query.length + contextLength);

        let snippet = searchText.substring(snippetStart, snippetEnd);

        // Calculate match position in snippet
        let matchStartInSnippet = matchIndex - snippetStart;

        // Add ellipsis
        if (snippetStart > 0) {
            snippet = '...' + snippet;
            matchStartInSnippet += 3;
        }
        if (snippetEnd < searchText.length) {
            snippet = snippet + '...';
        }

        snippets.push({
            text: snippet,
            matchStart: matchStartInSnippet,
            matchLength: query.length,
            source: matchIndex < title.length ? 'title' : 'content'
        });

        startPos = matchIndex + query.length;
        matchCount++;
    }

    return snippets;
}
