export default function ProjectHistoryPage() {
    return (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexDirection: 'column', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Select an item from the sidebar</h2>
            <p>View its complete change history, including deleted versions.</p>
        </div>
    )
}
