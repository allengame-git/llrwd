import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Get rejected change requests for the current user
 * This is a data fetching function, NOT a server action.
 */
export async function getRejectedRequests() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    return await prisma.changeRequest.findMany({
        where: {
            submittedById: session.user.id,
            status: "REJECTED"
        },
        include: {
            item: { select: { id: true, fullId: true, title: true, content: true, attachments: true } },
            targetProject: { select: { id: true, title: true, codePrefix: true } },
            reviewedBy: { select: { username: true } },
        },
        orderBy: { updatedAt: "desc" }
    });
}

/**
 * Get a single rejected request by ID (for detail view)
 * This is a data fetching function, NOT a server action.
 */
export async function getRejectedRequestDetail(requestId: number) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const request = await prisma.changeRequest.findUnique({
        where: { id: requestId },
        include: {
            item: {
                select: {
                    id: true,
                    fullId: true,
                    title: true,
                    content: true,
                    attachments: true,
                    relationsFrom: {
                        include: {
                            target: { select: { id: true, fullId: true, title: true, projectId: true } }
                        }
                    }
                }
            },
            targetProject: { select: { id: true, title: true, codePrefix: true } },
            submittedBy: { select: { username: true } },
            reviewedBy: { select: { username: true } },
        }
    });

    if (!request) return null;

    // Verify ownership
    if (request.submittedById !== session.user.id && session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return request;
}
