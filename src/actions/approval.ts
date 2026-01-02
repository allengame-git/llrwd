"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateNextItemId } from "@/lib/item-utils";
import { createHistoryRecord, ItemSnapshot } from "./history";

export type ApprovalState = {
    message?: string;
    error?: string;
};

// --- Submit Request ---

export async function submitCreateItemRequest(
    prevState: ApprovalState,
    formData: FormData
): Promise<ApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EDITOR" && session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    const projectId = parseInt(formData.get("projectId") as string);
    const parentIdStr = formData.get("parentId") as string;
    const parentId = parentIdStr ? parseInt(parentIdStr) : null;

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const attachmentsStr = formData.get("attachments") as string;
    const attachments = attachmentsStr ? JSON.parse(attachmentsStr) : [];

    const relatedItemsStr = formData.get("relatedItems") as string;
    const relatedItems = relatedItemsStr ? JSON.parse(relatedItemsStr) : [];

    if (!title || !projectId) {
        return { error: "Missing required fields" };
    }

    const data = JSON.stringify({ title, content, attachments, relatedItems });

    try {
        await prisma.changeRequest.create({
            data: {
                type: "CREATE",
                status: "PENDING",
                data,
                targetProjectId: projectId,
                targetParentId: parentId,
                submittedById: session.user.id,
            },
        });

        revalidatePath(`/projects/${projectId}`);
        return { message: "Request submitted successfully! Waiting for approval." };
    } catch (e) {
        console.error(e);
        return { error: "Failed to submit request" };
    }
}

// --- Submit Update Request ---
export async function submitUpdateItemRequest(
    prevState: ApprovalState,
    formData: FormData
): Promise<ApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EDITOR" && session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    const itemId = parseInt(formData.get("itemId") as string);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const attachmentsStr = formData.get("attachments") as string;
    const attachments = attachmentsStr ? JSON.parse(attachmentsStr) : null;
    const relatedItemsStr = formData.get("relatedItems") as string;
    const relatedItems = relatedItemsStr ? JSON.parse(relatedItemsStr) : null;

    if (!itemId || !title) {
        return { error: "Missing required fields" };
    }

    // Check if item exists
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return { error: "Item not found" };

    const data = JSON.stringify({ title, content, attachments, relatedItems });

    try {
        await prisma.changeRequest.create({
            data: {
                type: "UPDATE",
                status: "PENDING",
                data,
                itemId: itemId,
                targetProjectId: item.projectId, // Useful for filtering
                submittedById: session.user.id,
            },
        });

        revalidatePath(`/items/${itemId}`);
        return { message: "Update request submitted successfully! Waiting for approval." };
    } catch (e) {
        console.error(e);
        return { error: "Failed to submit request" };
    }
}

// --- Submit Delete Request ---
export async function submitDeleteItemRequest(itemId: number): Promise<ApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EDITOR" && session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    // Check children (Defense)
    const childCount = await prisma.item.count({
        where: { parentId: itemId, isDeleted: false }
    });

    if (childCount > 0) {
        return { error: "Cannot delete item with existing children. Please delete children first." };
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return { error: "Item not found" };

    try {
        await prisma.changeRequest.create({
            data: {
                type: "DELETE",
                status: "PENDING",
                data: "{}", // No specific data needed for delete
                itemId: itemId,
                targetProjectId: item.projectId,
                submittedById: session.user.id,
            },
        });

        revalidatePath(`/items/${itemId}`);
        return { message: "Delete request submitted successfully! Waiting for approval." };
    } catch (e) {
        console.error(e);
        return { error: "Failed to submit request" };
    }
}

// --- Submit Project Update Request ---
export async function submitUpdateProjectRequest(
    prevState: ApprovalState,
    formData: FormData
): Promise<ApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EDITOR" && session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    const projectId = parseInt(formData.get("projectId") as string);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!projectId || !title) {
        return { error: "Missing required fields" };
    }

    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "Project not found" };

    const data = JSON.stringify({ title, description });

    try {
        await prisma.changeRequest.create({
            data: {
                type: "PROJECT_UPDATE",
                status: "PENDING",
                data,
                targetProjectId: projectId,
                submittedById: session.user.id,
            },
        });

        revalidatePath(`/projects`);
        revalidatePath(`/projects/${projectId}`);
        return { message: "Project update request submitted successfully! Waiting for approval." };
    } catch (e) {
        console.error(e);
        return { error: "Failed to submit request" };
    }
}

// --- Submit Project Delete Request ---
export async function submitDeleteProjectRequest(projectId: number): Promise<ApprovalState> {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return { error: "Unauthorized: Only Admins can request project deletion." };
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { _count: { select: { items: true } } }
    });
    if (!project) return { error: "Project not found" };

    // Check if project has items
    if (project._count.items > 0) {
        return { error: `Cannot delete project with ${project._count.items} existing items. Please delete all items first.` };
    }

    // Store project info in data for display in approval dashboard
    const data = JSON.stringify({ title: project.title, codePrefix: project.codePrefix });

    try {
        await prisma.changeRequest.create({
            data: {
                type: "PROJECT_DELETE",
                status: "PENDING",
                data,
                targetProjectId: projectId,
                submittedById: session.user.id,
            },
        });

        revalidatePath(`/projects`);
        return { message: "Project delete request submitted successfully! Waiting for approval." };
    } catch (e) {
        console.error(e);
        return { error: "Failed to submit request" };
    }
}

// --- Admin Actions ---

export async function getPendingRequests() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "INSPECTOR")) return [];

    return await prisma.changeRequest.findMany({
        where: { status: "PENDING" },
        include: {
            submittedBy: { select: { username: true } },
            targetProject: { select: { title: true, codePrefix: true } },
            targetParent: { select: { fullId: true } },
            item: {
                select: {
                    fullId: true,
                    title: true,
                    content: true,
                    attachments: true,
                    relatedItems: {
                        select: { id: true, fullId: true, title: true }
                    }
                }
            }
        },
        orderBy: { createdAt: "asc" }
    });
}

export async function approveRequest(requestId: number) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "INSPECTOR")) throw new Error("Unauthorized");

    const request = await prisma.changeRequest.findUnique({
        where: { id: requestId },
        include: {
            submittedBy: { select: { id: true } }
        }
    });

    if (!request || request.status !== "PENDING") throw new Error("Invalid request");

    // Prevent self-approval (except for ADMIN)
    if (session.user.role !== "ADMIN" && request.submittedById === session.user.id) {
        throw new Error("You cannot approve your own change request");
    }

    const data = JSON.parse(request.data);

    // LOGIC: Apply Change
    try {
        if (request.type === "CREATE") {
            // Generate ID
            if (!request.targetProjectId) throw new Error("Missing target project");

            const fullId = await generateNextItemId(
                request.targetProjectId,
                request.targetParentId
            );

            // Capture the created item
            const newItem = await prisma.item.create({
                data: {
                    fullId,
                    title: data.title,
                    content: data.content,
                    attachments: data.attachments && data.attachments.length > 0
                        ? JSON.stringify(data.attachments)
                        : null,
                    projectId: request.targetProjectId,
                    parentId: request.targetParentId,
                    publishedAt: new Date(), // Publish immediately upon approval for now
                    relatedItems: data.relatedItems && data.relatedItems.length > 0 ? {
                        connect: data.relatedItems.map((item: { id: number }) => ({ id: item.id }))
                    } : undefined
                },
                include: { relatedItems: { select: { id: true, fullId: true } } }
            });

            // Bidirectional Relation Sync for new item
            if (data.relatedItems && data.relatedItems.length > 0) {
                for (const rItem of data.relatedItems) {
                    await prisma.item.update({
                        where: { id: rItem.id },
                        data: {
                            relatedItems: {
                                connect: { id: newItem.id }
                            }
                        }
                    });
                }
            }

            // HISTORY RECORD
            const snapshot: ItemSnapshot = {
                title: newItem.title,
                content: newItem.content,
                attachments: newItem.attachments,
                relatedItems: newItem.relatedItems
            };

            await createHistoryRecord(newItem, snapshot, { id: request.id, submittedById: request.submittedById }, "CREATE", session.user.id);
        }
        else if (request.type === "UPDATE") {
            if (!request.itemId) throw new Error("Missing target item ID");

            // Fetch original for history
            const originalItem = await prisma.item.findUnique({
                where: { id: request.itemId },
                include: { relatedItems: { select: { id: true, fullId: true } } }
            });
            if (!originalItem) throw new Error("Original item not found");

            const oldSnapshot: ItemSnapshot = {
                title: originalItem.title,
                content: originalItem.content,
                attachments: originalItem.attachments,
                relatedItems: originalItem.relatedItems
            };

            await prisma.item.update({
                where: { id: request.itemId },
                data: {
                    title: data.title,
                    content: data.content,
                    attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
                    updatedAt: new Date(),
                    // Handle related items: disconnect all, then connect new ones
                    relatedItems: data.relatedItems ? {
                        set: data.relatedItems.map((ri: { id: number }) => ({ id: ri.id }))
                    } : undefined
                }
            });

            // Handle symmetric relations if relatedItems changed
            if (data.relatedItems) {
                for (const rItem of data.relatedItems) {
                    await prisma.item.update({
                        where: { id: rItem.id },
                        data: {
                            relatedItems: {
                                connect: { id: request.itemId }
                            }
                        }
                    });
                }
            }

            // Get Updated Item
            const updatedItem = await prisma.item.findUnique({
                where: { id: request.itemId },
                include: { relatedItems: { select: { id: true, fullId: true } } }
            });
            if (updatedItem) {
                const newSnapshot: ItemSnapshot = {
                    title: updatedItem.title,
                    content: updatedItem.content,
                    attachments: updatedItem.attachments,
                    relatedItems: updatedItem.relatedItems
                };

                await createHistoryRecord(updatedItem, newSnapshot, { id: request.id, submittedById: request.submittedById }, "UPDATE", session.user.id, oldSnapshot);
            }
        }
        else if (request.type === "DELETE") {
            if (!request.itemId) throw new Error("Missing target item ID");

            // Double check children count
            const childCount = await prisma.item.count({ where: { parentId: request.itemId, isDeleted: false } });
            if (childCount > 0) throw new Error("Cannot delete item with children");

            // Fetch for history
            const item = await prisma.item.findUnique({
                where: { id: request.itemId },
                include: { relatedItems: { select: { id: true, fullId: true } } }
            });
            if (!item) throw new Error("Item not found");

            const lastSnapshot: ItemSnapshot = {
                title: item.title,
                content: item.content,
                attachments: item.attachments,
                relatedItems: item.relatedItems
            };

            await prisma.item.update({
                where: { id: request.itemId },
                data: { isDeleted: true }
            });

            await createHistoryRecord(item, lastSnapshot, { id: request.id, submittedById: request.submittedById }, "DELETE", session.user.id);
        }
        else if (request.type === "PROJECT_UPDATE") {
            if (!request.targetProjectId) throw new Error("Missing target project ID");

            await prisma.project.update({
                where: { id: request.targetProjectId },
                data: {
                    title: data.title,
                    description: data.description || null,
                    updatedAt: new Date()
                }
            });
        }
        else if (request.type === "PROJECT_DELETE") {
            if (!request.targetProjectId) throw new Error("Missing target project ID");

            // Double check that project has no items
            const itemCount = await prisma.item.count({ where: { projectId: request.targetProjectId } });
            if (itemCount > 0) throw new Error("Cannot delete project with existing items");

            await prisma.project.delete({
                where: { id: request.targetProjectId }
            });
        }

        // Update Request Status
        await prisma.changeRequest.update({
            where: { id: requestId },
            data: {
                status: "APPROVED",
                reviewedById: session.user.id,
                updatedAt: new Date()
            }
        });

        revalidatePath("/admin/approval");
        if (request.targetProjectId) revalidatePath(`/projects/${request.targetProjectId}`);
        if (request.itemId) revalidatePath(`/items/${request.itemId}`);

    } catch (e: any) {
        console.error("Failed to approve request", e);
        console.error("Request data:", request);
        console.error("Parsed data:", data);
        throw new Error(`Failed to apply change: ${e.message}`);
    }
}

export async function rejectRequest(requestId: number) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "INSPECTOR")) throw new Error("Unauthorized");

    await prisma.changeRequest.update({
        where: { id: requestId },
        data: {
            status: "REJECTED",
            reviewedById: session.user.id,
            updatedAt: new Date()
        }
    });

    revalidatePath("/admin/approval");
}
