"use client";

import { useState, useCallback } from "react";
import { getQCDocumentApprovals } from "@/actions/qc-approval";
import QCDocumentApprovalList from "@/components/approval/QCDocumentApprovalList";

interface Props {
    initialApprovals: any[];
    userQualifications: {
        isQC: boolean;
        isPM: boolean;
    };
}

export default function QCDocumentApprovalSection({ initialApprovals, userQualifications }: Props) {
    const [approvals, setApprovals] = useState(initialApprovals);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getQCDocumentApprovals();
            setApprovals(data);
        } catch (err) {
            console.error("Failed to refresh QC approvals:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    if (approvals.length === 0) {
        return null;
    }

    return (
        <div style={{ marginBottom: "2.5rem" }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem"
            }}>
                <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9 15l2 2 4-4" />
                    </svg>
                </div>
                <h2 style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "var(--color-text-main)",
                    margin: 0
                }}>
                    品質文件審核
                </h2>
                <span style={{
                    padding: "0.2rem 0.6rem",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600
                }}>
                    {approvals.length}
                </span>
                {loading && (
                    <span style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem"
                    }}>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ animation: "spin 1s linear infinite" }}
                        >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        更新中
                    </span>
                )}
            </div>
            <QCDocumentApprovalList
                approvals={approvals}
                userQualifications={userQualifications}
                onRefresh={refresh}
            />
            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
