const { PrismaClient } = require('@prisma/client');

// Minimal reproduction of generateQCDocument
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testPdfGeneration() {
    // Get history record 26
    const history = await prisma.itemHistory.findUnique({
        where: { id: 26 },
        include: {
            submittedBy: { select: { username: true } },
            reviewedBy: { select: { username: true } },
            project: { select: { title: true } }
        }
    });

    if (!history) {
        console.log('History not found');
        return;
    }

    console.log('Testing PDF generation for history:', history.id);
    console.log('ItemFullId:', history.itemFullId);

    try {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `QC Record - ${history.itemFullId} v${history.version}`,
                Author: 'RMS System'
            }
        });

        const outDir = path.join(process.cwd(), 'public', 'iso_doc');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const fileName = `qc_${history.id}_test_${Date.now()}.pdf`;
        const filePath = path.join(outDir, fileName);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Font Setup
        const fontPath = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
        if (fs.existsSync(fontPath)) {
            doc.font(fontPath);
            console.log('Font loaded successfully');
        } else {
            console.log('Font not found!');
        }

        // Simple content
        doc.fontSize(20).text('專案變更管理紀錄單', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Item: ${history.itemFullId}`);
        doc.text(`Title: ${history.itemTitle}`);
        doc.text(`Version: ${history.version}`);
        doc.text(`Submitted by: ${history.submittedBy?.username || 'N/A'}`);

        doc.end();

        await new Promise((resolve, reject) => {
            stream.on('finish', () => {
                console.log('PDF created successfully at:', filePath);
                console.log('Relative path:', `/iso_doc/${fileName}`);
                resolve();
            });
            stream.on('error', (err) => {
                console.error('Stream error:', err);
                reject(err);
            });
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
    }
}

testPdfGeneration().catch(console.error).finally(() => prisma.$disconnect());
