import { getIsoDocumentsByProject } from '@/actions/history';
import { prisma } from '@/lib/prisma';
import IsoDocList from '@/components/iso-docs/IsoDocList';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Params = Promise<{ projectId: string }>;

export default async function ProjectIsoDocsPage({ params }: { params: Params }) {
    const { projectId } = await params;
    const projectIdNum = parseInt(projectId, 10);

    if (isNaN(projectIdNum)) {
        notFound();
    }

    // Get project info
    const project = await prisma.project.findUnique({
        where: { id: projectIdNum },
        select: { id: true, title: true, codePrefix: true }
    });

    if (!project) {
        notFound();
    }

    const docs = await getIsoDocumentsByProject(projectIdNum);

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <nav style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <Link href="/iso-docs" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    🗃️ ISO 品質文件
                </Link>
                <span style={{ color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>/</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{project.title}</span>
            </nav>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                    }}>
                        📋 {project.title}
                    </h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-geist-mono)' }}>
                        {project.codePrefix} • {docs.length} 份品質文件
                    </div>
                </div>
            </div>

            <IsoDocList docs={docs} />
        </div>
    );
}
