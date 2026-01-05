import { getIsoDocuments } from '@/actions/history';
import IsoDocList from '@/components/iso-docs/IsoDocList';

export const dynamic = 'force-dynamic';

export default async function IsoDocsPage() {
    const docs = await getIsoDocuments();

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🗃️ ISO 品質文件
                </h1>
            </div>

            <IsoDocList docs={docs} />
        </div>
    );
}
