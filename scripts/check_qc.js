const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    // Check QC Document Approvals
    const approvals = await prisma.qCDocumentApproval.findMany({
        include: { itemHistory: true }
    });
    console.log('QC Document Approvals:', approvals.length);
    console.log(JSON.stringify(approvals, null, 2));

    // Check users with QC qualification
    const qcUsers = await prisma.user.findMany({
        where: { isQC: true },
        select: { id: true, username: true, role: true, isQC: true, isPM: true }
    });
    console.log('\nUsers with QC qualification:', JSON.stringify(qcUsers, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
