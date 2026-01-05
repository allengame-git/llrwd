"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    approveAsQC,
    approveAsPM,
    rejectQCDocument,
} from "@/actions/qc-approval";

interface QCDocumentApproval {
    id: number;
    status: string;
    createdAt: string;
    qcApprovedAt?: string;
    qcNote?: string;
    pmApprovedAt?: string;
    pmNote?: string;
    itemHistory: {
        id: number;
        version: number;
        changeType: string;
        itemFullId: string;
        itemTitle: string;
        isoDocPath?: string;
        createdAt: string;
        project: {
            title: string;
        };
        submittedBy: {
            username: string;
        };
        reviewedBy?: {
            username: string;
        };
    };
    qcApprovedBy?: {
        username: string;
    };
    pmApprovedBy?: {
        username: string;
    };
}

interface Props {
    approvals: QCDocumentApproval[];
    userQualifications: {
        isQC: boolean;
        isPM: boolean;
    };
    onRefresh: () => void;
}

export default function QCDocumentApprovalList({
    approvals,
    userQualifications,
    onRefresh,
}: Props) {
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectNote, setRejectNote] = useState("");

    const handleApprove = async (approval: QCDocumentApproval) => {
        setProcessingId(approval.id);
        try {
            let result;
            if (approval.status === "PENDING_QC" && userQualifications.isQC) {
                result = await approveAsQC(approval.id);
            } else if (approval.status === "PENDING_PM" && userQualifications.isPM) {
                result = await approveAsPM(approval.id);
            }

            if (result?.error) {
                alert(result.error);
            } else {
                onRefresh();
            }
        } catch (err) {
            console.error("Approval failed:", err);
            alert("核准失敗");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (approvalId: number) => {
        if (!rejectNote.trim()) {
            alert("請填寫駁回原因");
            return;
        }

        setProcessingId(approvalId);
        try {
            const result = await rejectQCDocument(approvalId, rejectNote);
            if (result?.error) {
                alert(result.error);
            } else {
                setRejectingId(null);
                setRejectNote("");
                onRefresh();
            }
        } catch (err) {
            console.error("Rejection failed:", err);
            alert("駁回失敗");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING_QC":
                return { text: "待 QC 審核", color: "#3b82f6" };
            case "PENDING_PM":
                return { text: "待 PM 核定", color: "#f59e0b" };
            case "COMPLETED":
                return { text: "已完成", color: "#10b981" };
            case "REJECTED":
                return { text: "已駁回", color: "#ef4444" };
            default:
                return { text: status, color: "#6b7280" };
        }
    };

    const canApprove = (approval: QCDocumentApproval) => {
        if (approval.status === "PENDING_QC" && userQualifications.isQC) return true;
        if (approval.status === "PENDING_PM" && userQualifications.isPM) return true;
        return false;
    };

    if (approvals.length === 0) {
        return (
            <div
                style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                }}
            >
                <p>目前沒有待審核的品質文件</p>
            </div>
        );
    }

    return (
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr
                        style={{
                            borderBottom: "1px solid var(--color-border)",
                            backgroundColor: "rgba(0,0,0,0.02)",
                        }}
                    >
                        <th style={{ padding: "1rem", textAlign: "left" }}>QC 編號</th>
                        <th style={{ padding: "1rem", textAlign: "left" }}>項目</th>
                        <th style={{ padding: "1rem", textAlign: "left" }}>版本</th>
                        <th style={{ padding: "1rem", textAlign: "left" }}>提交者 / 核准者</th>
                        <th style={{ padding: "1rem", textAlign: "center" }}>狀態</th>
                        <th style={{ padding: "1rem", textAlign: "center" }}>文件</th>
                        <th style={{ padding: "1rem", textAlign: "right" }}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {approvals.map((approval) => {
                        const status = getStatusLabel(approval.status);
                        const history = approval.itemHistory;

                        return (
                            <tr
                                key={approval.id}
                                style={{ borderBottom: "1px solid var(--color-border)" }}
                            >
                                <td style={{ padding: "1rem", fontWeight: "bold" }}>
                                    QC-{String(history.id).padStart(4, "0")}
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <div style={{ fontWeight: "500" }}>{history.itemFullId}</div>
                                    <div
                                        style={{
                                            fontSize: "0.85rem",
                                            color: "var(--color-text-muted)",
                                        }}
                                    >
                                        {history.itemTitle}
                                    </div>
                                </td>
                                <td style={{ padding: "1rem" }}>v{history.version}</td>
                                <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                                    <div>提交: {history.submittedBy.username}</div>
                                    <div style={{ color: "var(--color-text-muted)" }}>
                                        核准: {history.reviewedBy?.username || "-"}
                                    </div>
                                    {approval.qcApprovedBy && (
                                        <div style={{ color: "#3b82f6", fontSize: "0.85rem" }}>
                                            QC: {approval.qcApprovedBy.username}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                    <span
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "0.85rem",
                                            fontWeight: "500",
                                            backgroundColor: `${status.color}15`,
                                            color: status.color,
                                            border: `1px solid ${status.color}30`,
                                        }}
                                    >
                                        {status.text}
                                    </span>
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                    {history.isoDocPath ? (
                                        <a
                                            href={history.isoDocPath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: "var(--color-primary)",
                                                textDecoration: "none",
                                            }}
                                        >
                                            📄 檢視
                                        </a>
                                    ) : (
                                        <span style={{ color: "var(--color-text-muted)" }}>-</span>
                                    )}
                                </td>
                                <td style={{ padding: "1rem", textAlign: "right" }}>
                                    {rejectingId === approval.id ? (
                                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "flex-end" }}>
                                            <input
                                                type="text"
                                                placeholder="駁回原因"
                                                value={rejectNote}
                                                onChange={(e) => setRejectNote(e.target.value)}
                                                style={{
                                                    padding: "0.25rem 0.5rem",
                                                    borderRadius: "4px",
                                                    border: "1px solid var(--color-border)",
                                                    width: "150px",
                                                }}
                                            />
                                            <button
                                                onClick={() => handleReject(approval.id)}
                                                disabled={processingId === approval.id}
                                                style={{
                                                    padding: "0.25rem 0.75rem",
                                                    backgroundColor: "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                確認
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRejectingId(null);
                                                    setRejectNote("");
                                                }}
                                                style={{
                                                    padding: "0.25rem 0.75rem",
                                                    backgroundColor: "transparent",
                                                    color: "var(--color-text-muted)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                取消
                                            </button>
                                        </div>
                                    ) : canApprove(approval) ? (
                                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                            <button
                                                onClick={() => handleApprove(approval)}
                                                disabled={processingId === approval.id}
                                                className="btn btn-primary"
                                                style={{ padding: "0.25rem 1rem", fontSize: "0.9rem" }}
                                            >
                                                {processingId === approval.id ? "處理中..." : "核准"}
                                            </button>
                                            <button
                                                onClick={() => setRejectingId(approval.id)}
                                                className="btn btn-outline"
                                                style={{
                                                    padding: "0.25rem 1rem",
                                                    fontSize: "0.9rem",
                                                    color: "#ef4444",
                                                    borderColor: "#ef4444",
                                                }}
                                            >
                                                駁回
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                                            等待其他審核者
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
