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

    return (
        <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.2rem", color: "var(--color-text-secondary)", margin: 0 }}>
                    📄 品質文件審核 ({approvals.length})
                </h2>
                {loading && <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>更新中...</span>}
            </div>
            <QCDocumentApprovalList
                approvals={approvals}
                userQualifications={userQualifications}
                onRefresh={refresh}
            />
        </div>
    );
}
