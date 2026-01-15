"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Mark a rejected request as resubmitted (changes status from REJECTED to RESUBMITTED)
 * This is called after creating a new change request based on the rejected one
 */
export async function markRejectedAsResubmitted(requestId: number) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const request = await prisma.changeRequest.findUnique({
        where: { id: requestId }
    });

    if (!request) throw new Error("Request not found");

    // Verify ownership
    if (request.submittedById !== session.user.id && session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Update status to indicate it was resubmitted
    // We'll use "RESUBMITTED" to hide it from the "Pending Revisions" list
    // but keep it in the database for history tracking
    await prisma.changeRequest.update({
        where: { id: requestId },
        data: { status: "RESUBMITTED" }
    });

    // Mark related notifications as read
    try {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                changeRequestId: requestId,
                isRead: false
            },
            data: { isRead: true }
        });
        revalidatePath("/notifications");
    } catch (e) {
        console.error("Failed to sync notifications:", e);
    }

    return { success: true };
}
