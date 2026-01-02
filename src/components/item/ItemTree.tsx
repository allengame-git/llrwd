'use client';

import { ItemNode } from '@/lib/tree-utils';
import Link from 'next/link';
import { useState } from 'react';
import CreateItemForm from './CreateItemForm';

interface ItemTreeProps {
    nodes: ItemNode[];
    level?: number;
    canEdit?: boolean;
    projectId?: number;
    currentItemId?: number;
}

export default function ItemTree({ nodes, level = 0, canEdit = false, projectId, currentItemId }: ItemTreeProps) {
    if (!nodes || nodes.length === 0) return null;

    return (
        <div style={{ paddingLeft: level > 0 ? '1.5rem' : '0', borderLeft: level > 0 ? '1px solid var(--color-border)' : 'none' }}>
            {nodes.map(node => (
                <ItemTreeNode key={node.id} node={node} level={level} canEdit={canEdit} projectId={projectId} currentItemId={currentItemId} />
            ))}
        </div>
    );
}

interface ItemTreeNodeProps {
    node: ItemNode;
    level: number;
    canEdit: boolean;
    projectId?: number;
    currentItemId?: number;
}

function ItemTreeNode({ node, level, canEdit, projectId, currentItemId }: ItemTreeNodeProps) {
    const hasChildren = node.children && node.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(true);
    const isCurrentItem = currentItemId === node.id;

    return (
        <div style={{ marginBottom: '0.5rem', position: 'relative' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                backgroundColor: isCurrentItem ? 'var(--color-primary-soft)' : 'transparent',
                borderLeft: isCurrentItem ? '3px solid var(--color-primary)' : '3px solid transparent',
            }}
                className="item-tree-node"
            >
                {/* Collapse/Expand Toggle */}
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                            transition: 'transform 0.2s',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}
                        title={isExpanded ? '折疊' : '展開'}
                    >
                        ▶
                    </button>
                ) : (
                    <span style={{ width: '16px', display: 'inline-block' }}></span>
                )}

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link
                        href={`/items/${node.id}`}
                        style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'baseline'
                        }}
                    >
                        <span style={{
                            fontFamily: 'var(--font-geist-mono)',
                            fontWeight: 'bold',
                            color: 'var(--color-primary)',
                            fontSize: '0.9rem'
                        }}>
                            {node.fullId}
                        </span>
                        <span style={{ fontWeight: 500 }}>{node.title}</span>
                    </Link>

                    {/* Add Child Button */}
                    {canEdit && projectId && (
                        <CreateItemForm
                            projectId={projectId}
                            parentId={node.id}
                            modal={true}
                            trigger={
                                <button
                                    title="Add Child Item"
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        border: '1px solid var(--color-border)',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--color-text-muted)',
                                        fontSize: '12px',
                                        lineHeight: 1
                                    }}
                                    className="add-child-btn"
                                >
                                    +
                                </button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Recursion - Only render if expanded */}
            {hasChildren && isExpanded && (
                <ItemTree nodes={node.children} level={level + 1} canEdit={canEdit} projectId={projectId} currentItemId={currentItemId} />
            )}

            <style jsx>{`
                .item-tree-node:hover {
                    background-color: rgba(0,0,0,0.03);
                }
                .add-child-btn:hover {
                    background-color: var(--color-primary);
                    color: white !important;
                    border-color: var(--color-primary) !important;
                }
            `}</style>
        </div>
    );
}
