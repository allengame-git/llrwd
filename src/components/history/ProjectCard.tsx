'use client';

import Link from 'next/link';

type ProjectCardProps = {
    id: number;
    title: string;
    codePrefix: string;
    itemCount: number;
    lastUpdate: Date | null;
};

export default function ProjectCard({ id, title, codePrefix, itemCount, lastUpdate }: ProjectCardProps) {
    return (
        <Link href={`/admin/history/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
                className="glass"
                style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--color-border)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            marginBottom: '0.4rem',
                            color: 'var(--color-text-main)'
                        }}>
                            {title}
                        </h2>
                        <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-geist-mono)'
                        }}>
                            {codePrefix}
                        </div>
                    </div>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-primary-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                </div>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)'
                }}>
                    <div>
                        <span style={{
                            fontWeight: 600,
                            color: 'var(--color-primary)'
                        }}>
                            {itemCount}
                        </span>
                        <span> 個項目</span>
                    </div>
                    <div>
                        {lastUpdate ? (
                            `更新於 ${new Date(lastUpdate).toLocaleDateString('zh-TW')}`
                        ) : '尚無歷史'}
                    </div>
                </div>
            </div>
        </Link>
    );
}
