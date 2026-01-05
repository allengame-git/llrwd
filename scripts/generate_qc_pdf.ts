
import { prisma } from "../src/lib/prisma";
import { generateQCDocument } from "../src/lib/pdf-generator";

async function main() {
    const historyId = 24;
    console.log(`Checking history ID: ${historyId}...`);

    const history = await prisma.itemHistory.findUnique({
        where: { id: historyId },
        include: {
            submittedBy: { select: { username: true } },
            reviewedBy: { select: { username: true } },
            project: { select: { title: true } }
            // item: { select: { fullId: true, title: true } } 
            // Note: generateQCDocument expects 'item' usually for current state, 
            // but the function actually uses history data for most fields except 'item' object type matching.
            // Let's check pdf-generator.ts signature.
        }
    });

    if (!history) {
        console.error("History record not found!");
        return;
    }

    console.log("Found history record:", history.id, history.itemFullId);

    if (history.isoDocPath) {
        console.log("Document already exists:", history.isoDocPath);
        // Force regenerate if needed?
        // return;
    }

    // Prepare helper object if needed. 
    // The generateQCDocument function signature is (history, item).
    // It uses history.itemFullId and history.itemTitle mostly.
    // It accepts item object to satisfy TS or if it needs current item details not in history (but history should have snapshots).

    // We can fetch the Item if it still exists
    let item = null;
    if (history.itemId) {
        item = await prisma.item.findUnique({
            where: { id: history.itemId },
            select: { fullId: true, title: true }
        });
    }

    // If item is deleted, we might pass null or a mock object from history data
    if (!item) {
        item = {
            fullId: history.itemFullId,
            title: history.itemTitle
        };
    }

    try {
        console.log("Generating PDF...");
        // @ts-ignore
        const path = await generateQCDocument(history, item);
        console.log("PDF generated at:", path);

        console.log("Updating database...");
        await prisma.itemHistory.update({
            where: { id: historyId },
            data: { isoDocPath: path }
        });
        console.log("Done!");
    } catch (e) {
        console.error("Error generating PDF:", e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
