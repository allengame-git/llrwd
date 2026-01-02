"use server";

import { prisma } from "@/lib/prisma";
import { Item, Prisma } from "@prisma/client";

// Define Snapshot structure
export interface ItemSnapshot {
    title: string;
    content: string | null;
    attachments: string | null;
    relatedItems: { id: number; fullId: string }[];
}

/**
 * Computes difference between two snapshots.
 */
function computeDiff(oldData: ItemSnapshot, newData: ItemSnapshot) {
    const diff: Record<string, { old: any; new: any }> = {};

    // Compare basic fields
    for (const key of ['title', 'content', 'attachments'] as const) {
        const oldVal = oldData[key];
        const newVal = newData[key];

        if (oldVal !== newVal) {
            diff[key] = { old: oldVal, new: newVal };
        }
    }

    // Compare relatedItems (arrays)
    // We sort by id to ensure consistent comparison
    const oldRelations = [...oldData.relatedItems].sort((a, b) => a.id - b.id);
    const newRelations = [...newData.relatedItems].sort((a, b) => a.id - b.id);

    if (JSON.stringify(oldRelations) !== JSON.stringify(newRelations)) {
        diff['relatedItems'] = { old: oldRelations, new: newRelations };
    }

    return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * Creates a history record for an item.
 * Automatically increments item version.
 */
export async function createHistoryRecord(
    item: Item,
    snapshotData: ItemSnapshot,
    changeRequest: { id: number; submittedById: string },
    changeType: "CREATE" | "UPDATE" | "DELETE" | "RESTORE",
    reviewerId: string,
    oldSnapshot?: ItemSnapshot
) {
    const diff = (changeType === "UPDATE" && oldSnapshot)
        ? computeDiff(oldSnapshot, snapshotData)
        : null;

    // Logic: UPDATE/DELETE increments version counter
    let newVersion = item.currentVersion;

    if (changeType === "UPDATE" || changeType === "DELETE") {
        newVersion = item.currentVersion + 1;
    }

    // Create History Record
    await prisma.itemHistory.create({
        data: {
            itemId: item.id, // Support soft delete linking
            version: newVersion,
            changeType,
            snapshot: JSON.stringify(snapshotData),
            diff: diff ? JSON.stringify(diff) : null,

            submittedById: changeRequest.submittedById,
            reviewedById: reviewerId,
            reviewStatus: "APPROVED",
            changeRequestId: changeRequest.id,

            // Redundant fields
            itemFullId: item.fullId,
            itemTitle: item.title,
            projectId: item.projectId,
        }
    });

    // Increment Item Version (Only if not DELETE - conceptually. Practically, if soft delete, we might want to update version too? 
    // If we update version on soft delete, next time we recreate/restore, we know where we left off?
    // Our system doesn't restore easily yet.
    // But updating version on the item row is fine for soft delete.)
    // Actually, let's update it so currentVersion reflects the 'Deleted' state version.

    if (changeType !== "DELETE") {
        await prisma.item.update({
            where: { id: item.id },
            data: { currentVersion: newVersion }
        });
    } else {
        // For DELETE (Soft), we also update version to match history?
        // Yes, let's do it to keep consistency.
        await prisma.item.update({
            where: { id: item.id },
            data: { currentVersion: newVersion }
        });
    }
}

/**
 * Get history for a specific item
 */
export async function getItemHistory(itemId: number) {
    const history = await prisma.itemHistory.findMany({
        where: { itemId },
        include: {
            submittedBy: { select: { username: true } },
            reviewedBy: { select: { username: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return history;
}

/**
 * Get detailed history record
 */
export async function getHistoryDetail(historyId: number) {
    return await prisma.itemHistory.findUnique({
        where: { id: historyId },
        include: {
            submittedBy: { select: { username: true } },
            reviewedBy: { select: { username: true } },
            item: { select: { fullId: true, title: true } }
        }
    });
}

/**
 * Get global history (Dashboard)
 */
export async function getGlobalHistory(filters?: {
    projectId?: number;
    changeType?: string;
    dateFrom?: Date;
    dateTo?: Date;
}) {
    const where: Prisma.ItemHistoryWhereInput = {};

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.changeType && filters.changeType !== "ALL") where.changeType = filters.changeType;
    if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const history = await prisma.itemHistory.findMany({
        where,
        include: {
            project: { select: { title: true, codePrefix: true } },
            submittedBy: { select: { username: true } },
            reviewedBy: { select: { username: true } },
            // Include item to check if deleted (if item is null, it's deleted - relying on SetNull if hard deleted, or check isDeleted if soft)
            item: { select: { id: true, isDeleted: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return history;
}

/**
 * Get project stats for history dashboard
 */
export async function getProjectHistoryStats() {
    return await prisma.project.findMany({
        include: {
            _count: { select: { items: true } },
            itemHistories: {
                select: { id: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });
}

/**
 * Get all items (active and deleted) for a project
 */
export async function getProjectItems(projectId: number) {
    // 1. Get stats
    const grouped = await prisma.itemHistory.groupBy({
        by: ['itemFullId'],
        where: { projectId },
        _count: { id: true },
    });

    // 2. Get latest info for each
    const latestInfo = await prisma.itemHistory.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        distinct: ['itemFullId'],
        select: {
            itemFullId: true,
            itemTitle: true,
            changeType: true,
            itemId: true
        }
    });

    // Combine
    return latestInfo.map((info) => {
        const count = grouped.find((g) => g.itemFullId === info.itemFullId)?._count.id || 0;
        const isDeleted = info.itemId === null; // Hard delete check. For soft delete, we'd check item.isDeleted if we fetched it.
        // If we assume history correctly tracked DELETE event, then info.changeType === 'DELETE' means it was deleted at that point.
        // BUT subsequent changes might not happen.
        // However, if we soft delete, the Item row exists.
        // If we want to know current status, checking changeType of latest history is a good proxy IF history is strictly recorded.
        // OR we should join with Item table.

        // Let's rely on changeType === 'DELETE' OR itemId === null as deleted.
        // Actually, if soft delete is used, changeType will be 'DELETE'.

        return {
            fullId: info.itemFullId,
            title: info.itemTitle,
            isDeleted: isDeleted || info.changeType === 'DELETE',
            historyCount: count
        };
    }).sort((a, b: { fullId: string }) => {
        // Sort naturally by fullId
        return a.fullId.localeCompare(b.fullId, undefined, { numeric: true });
    });
}

/**
 * Get item history by full ID (for Global Dashboard, handling deleted items)
 */
export async function getItemHistoryByFullId(projectId: number, itemFullId: string) {
    const history = await prisma.itemHistory.findMany({
        where: {
            projectId,
            itemFullId
        },
        include: {
            submittedBy: { select: { username: true } },
            reviewedBy: { select: { username: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    return history;
}
