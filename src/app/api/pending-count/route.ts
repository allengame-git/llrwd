import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    // Only ADMIN and INSPECTOR can see pending counts
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "INSPECTOR")) {
        return NextResponse.json({ count: 0 });
    }

    try {
        // Count pending ChangeRequests
        const changeRequestCount = await prisma.changeRequest.count({
            where: { status: "PENDING" }
        });

        // Count pending DataFileChangeRequests
        const dataFileRequestCount = await prisma.dataFileChangeRequest.count({
            where: { status: "PENDING" }
        });

        const totalCount = changeRequestCount + dataFileRequestCount;

        return NextResponse.json({ count: totalCount });
    } catch (error) {
        console.error("Error fetching pending count:", error);
        return NextResponse.json({ count: 0 });
    }
}
