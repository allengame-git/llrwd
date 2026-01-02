'use client';

interface HighlightedSnippetProps {
    snippet: {
        text: string;
        matchStart: number;
        matchLength: number;
    };
}

export default function HighlightedSnippet({ snippet }: HighlightedSnippetProps) {
    const { text, matchStart, matchLength } = snippet;

    const before = text.substring(0, matchStart);
    const match = text.substring(matchStart, matchStart + matchLength);
    const after = text.substring(matchStart + matchLength);

    return (
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            {before}
            <mark style={{
                background: '#ffd700',
                color: '#000',
                fontWeight: '700',
                padding: '0.15rem 0.3rem',
                borderRadius: '3px',
                boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.3)'
            }}>
                {match}
            </mark>
            {after}
        </div>
    );
}
