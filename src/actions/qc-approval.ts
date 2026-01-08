"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateQCDocument } from "@/lib/pdf-generator";

// ============================================
// QC Document Approval Actions
// ============================================

export type QCApprovalState = {
    message?: string;
    error?: string;
};

/**
 * Get pending QC approvals for QC users
 */
export async function getPendingQCApprovals() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Get user's qualifications
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQC: true, isPM: true }
    });

    if (!user?.isQC) throw new Error("Unauthorized - QC qualification required");

    return await prisma.qCDocumentApproval.findMany({
        where: { status: "PENDING_QC" },
        include: {
            itemHistory: {
                include: {
                    project: true,
                    submittedBy: { select: { id: true, username: true } },
                    reviewedBy: { select: { id: true, username: true } },
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Get pending PM approvals for PM users
 */
export async function getPendingPMApprovals() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Get user's qualifications
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQC: true, isPM: true }
    });

    if (!user?.isPM) throw new Error("Unauthorized - PM qualification required");

    return await prisma.qCDocumentApproval.findMany({
        where: { status: "PENDING_PM" },
        include: {
            itemHistory: {
                include: {
                    project: true,
                    submittedBy: { select: { id: true, username: true } },
                    reviewedBy: { select: { id: true, username: true } },
                }
            },
            qcApprovedBy: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Get all QC document approvals for the current user based on their qualifications
 */
export async function getQCDocumentApprovals() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Get user's qualifications
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQC: true, isPM: true }
    });

    if (!user?.isQC && !user?.isPM) {
        return [];
    }

    // Build where clause based on user's qualifications
    const whereConditions: string[] = [];
    if (user.isQC) whereConditions.push("PENDING_QC");
    if (user.isPM) whereConditions.push("PENDING_PM");

    return await prisma.qCDocumentApproval.findMany({
        where: {
            status: { in: whereConditions }
        },
        include: {
            itemHistory: {
                include: {
                    project: true,
                    submittedBy: { select: { id: true, username: true } },
                    reviewedBy: { select: { id: true, username: true } },
                }
            },
            qcApprovedBy: { select: { id: true, username: true } },
            pmApprovedBy: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Approve as QC - Embed QC signature (by regenerating PDF) and advance to PM stage
 */
export async function approveAsQC(
    approvalId: number,
    note?: string
): Promise<QCApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    // Verify QC qualification
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQC: true, username: true }
    });

    if (!user?.isQC) return { error: "Unauthorized - QC qualification required" };

    // Get the approval record
    const approval = await prisma.qCDocumentApproval.findUnique({
        where: { id: approvalId },
        include: {
            itemHistory: true
        }
    });

    if (!approval) return { error: "Approval record not found" };
    if (approval.status !== "PENDING_QC") return { error: "Document is not pending QC approval" };

    // Link ChangeRequest to get submission date
    let submissionDate: Date | undefined;
    if (approval.itemHistory.changeRequestId) {
        const req = await prisma.changeRequest.findUnique({ where: { id: approval.itemHistory.changeRequestId } });
        if (req?.createdAt) {
            submissionDate = req.createdAt;
        }
    }

    // Regenerate PDF to include QC data
    try {
        const fullHistory = await prisma.itemHistory.findUnique({
            where: { id: approval.itemHistoryId },
            include: {
                project: true,
                submittedBy: { select: { username: true } },
                reviewedBy: { select: { username: true } }
            }
        });

        if (fullHistory) {
            const pdfPath = await generateQCDocument({
                // @ts-ignore - Prisma types vs Local Interface
                ...fullHistory,
                submissionDate: submissionDate,
                qcNote: note || "同意",
                qcDate: new Date(),
                qcUser: user.username, // Passed from session user
                pmNote: null,
                pmDate: null,
                pmUser: null
            }, null);

            // Update history with new path
            await prisma.itemHistory.update({
                where: { id: approval.itemHistoryId },
                data: { isoDocPath: pdfPath }
            });
        }
    } catch (err) {
        console.error("Failed to regenerate PDF during QC approval:", err);
    }

    // Update approval status
    await prisma.qCDocumentApproval.update({
        where: { id: approvalId },
        data: {
            status: "PENDING_PM",
            qcApprovedById: session.user.id,
            qcApprovedAt: new Date(),
            qcNote: note || "同意",
        }
    });

    revalidatePath("/admin/approvals");
    revalidatePath("/iso-docs");
    return { message: "QC approval completed" };
}

/**
 * Approve as PM - Embed PM signature (by regenerating PDF) and complete the workflow
 */
export async function approveAsPM(
    approvalId: number,
    note?: string
): Promise<QCApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    // Verify PM qualification
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isPM: true, username: true }
    });

    if (!user?.isPM) return { error: "Unauthorized - PM qualification required" };

    // Get the approval record
    const approval = await prisma.qCDocumentApproval.findUnique({
        where: { id: approvalId },
        include: {
            itemHistory: true,
            qcApprovedBy: { select: { username: true } } // Fetch QC approver name
        }
    });

    if (!approval) return { error: "Approval record not found" };
    if (approval.status !== "PENDING_PM") return { error: "Document is not pending PM approval" };

    // Link ChangeRequest to get submission date
    let submissionDate: Date | undefined;
    if (approval.itemHistory.changeRequestId) {
        const req = await prisma.changeRequest.findUnique({ where: { id: approval.itemHistory.changeRequestId } });
        if (req?.createdAt) {
            submissionDate = req.createdAt;
        }
    }

    // Regenerate PDF to include PM data (and keep QC data)
    try {
        const fullHistory = await prisma.itemHistory.findUnique({
            where: { id: approval.itemHistoryId },
            include: {
                project: true,
                submittedBy: { select: { username: true } },
                reviewedBy: { select: { username: true } }
            }
        });

        if (fullHistory) {
            const pdfPath = await generateQCDocument({
                // @ts-ignore
                ...fullHistory,
                submissionDate: submissionDate,
                qcNote: approval.qcNote,
                qcDate: approval.qcApprovedAt,
                qcUser: approval.qcApprovedBy?.username, // Existing QC approver
                pmNote: note || "同意",
                pmDate: new Date(),
                pmUser: user.username // Current PM approver
            }, null);

            await prisma.itemHistory.update({
                where: { id: approval.itemHistoryId },
                data: { isoDocPath: pdfPath }
            });
        }
    } catch (err) {
        console.error("Failed to regenerate PDF during PM approval:", err);
    }

    // Update approval status
    await prisma.qCDocumentApproval.update({
        where: { id: approvalId },
        data: {
            status: "COMPLETED",
            pmApprovedById: session.user.id,
            pmApprovedAt: new Date(),
            pmNote: note || "同意",
        }
    });

    revalidatePath("/admin/approvals");
    revalidatePath("/iso-docs");
    return { message: "PM approval completed - Document finalized" };
}

/**
 * Reject QC Document at any stage
 */
export async function rejectQCDocument(
    approvalId: number,
    note: string
): Promise<QCApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    // Verify user has QC or PM qualification
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQC: true, isPM: true }
    });

    if (!user?.isQC && !user?.isPM) {
        return { error: "Unauthorized - QC or PM qualification required" };
    }

    // Get the approval record
    const approval = await prisma.qCDocumentApproval.findUnique({
        where: { id: approvalId }
    });

    if (!approval) return { error: "Approval record not found" };

    // Verify proper stage for rejection
    if (approval.status === "PENDING_QC" && !user.isQC) {
        return { error: "Only QC users can reject at QC stage" };
    }
    if (approval.status === "PENDING_PM" && !user.isPM) {
        return { error: "Only PM users can reject at PM stage" };
    }

    // Update status to rejected
    const updateData: any = {
        status: "REJECTED",
    };

    if (approval.status === "PENDING_QC") {
        updateData.qcApprovedById = session.user.id;
        updateData.qcApprovedAt = new Date();
        updateData.qcNote = note;
    } else {
        updateData.pmApprovedById = session.user.id;
        updateData.pmApprovedAt = new Date();
        updateData.pmNote = note;
    }

    await prisma.qCDocumentApproval.update({
        where: { id: approvalId },
        data: updateData
    });

    revalidatePath("/admin/approvals");
    revalidatePath("/iso-docs");
    return { message: "Document rejected" };
}

/**
 * Create a QC Document Approval record for a new ItemHistory
 * Called after PDF generation in history.ts
 */
export async function createQCDocumentApproval(itemHistoryId: number): Promise<void> {
    await prisma.qCDocumentApproval.create({
        data: {
            itemHistoryId,
            status: "PENDING_QC"
        }
    });
}

/**
 * Get count of pending QC/PM documents for badge display
 */
export async function getPendingQCDocumentCount(): Promise<number> {
    const session = await getServerSession(authOptions);
    if (!session) return 0;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQC: true, isPM: true }
    });

    if (!user?.isQC && !user?.isPM) return 0;

    const whereConditions: string[] = [];
    if (user.isQC) whereConditions.push("PENDING_QC");
    if (user.isPM) whereConditions.push("PENDING_PM");

    return await prisma.qCDocumentApproval.count({
        where: { status: { in: whereConditions } }
    });
}
