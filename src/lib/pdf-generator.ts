import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface ItemHistory {
    id: number;
    itemId: number | null;
    version: number;
    changeType: string;
    itemFullId: string;
    itemTitle: string;
    submittedBy: { username: string };
    reviewedBy: { username: string } | null;
    createdAt: Date;
    projectId: number;
    project: { title: string };
    snapshot: string; // JSON string
    diff: string | null; // JSON string
}

interface Item {
    fullId: string;
    title: string;
}

export const generateQCDocument = async (
    history: ItemHistory,
    item: Item | null
): Promise<string> => {
    console.log('[generateQCDocument] Starting PDF generation for history:', history.id);

    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Register fontkit for custom fonts
        pdfDoc.registerFontkit(fontkit);

        // Try to load Chinese font
        let font;
        const fontPath = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';

        if (fs.existsSync(fontPath)) {
            console.log('[generateQCDocument] Loading Chinese font:', fontPath);
            const fontBytes = fs.readFileSync(fontPath);
            font = await pdfDoc.embedFont(fontBytes);
        } else {
            console.warn('[generateQCDocument] Chinese font not found, using Helvetica');
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }

        // Add a page
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        const { width, height } = page.getSize();
        const margin = 50;

        // Colors
        const black = rgb(0, 0, 0);
        const gray = rgb(0.5, 0.5, 0.5);

        // Parse snapshot
        let snapshot: any = {};
        try {
            snapshot = JSON.parse(history.snapshot);
        } catch (e) {
            console.error('[generateQCDocument] Failed to parse snapshot');
        }

        // Draw content
        let y = height - margin;

        // Header
        const title = '專案變更管理紀錄單';
        const titleWidth = font.widthOfTextAtSize(title, 20);
        page.drawText(title, {
            x: (width - titleWidth) / 2,
            y: y - 20,
            size: 20,
            font,
            color: black,
        });

        y -= 60;

        // Document info table
        const drawRow = (label: string, value: string, yPos: number) => {
            page.drawText(label, { x: margin, y: yPos, size: 10, font, color: gray });
            page.drawText(value, { x: margin + 100, y: yPos, size: 10, font, color: black });
        };

        // QC Number
        const qcNumber = `QC-${String(history.id).padStart(4, '0')}`;
        drawRow('文件編號:', qcNumber, y);
        y -= 20;

        // Project
        drawRow('專案名稱:', history.project.title, y);
        y -= 20;

        // Item
        drawRow('項目編號:', history.itemFullId, y);
        y -= 20;

        // Title
        drawRow('項目名稱:', history.itemTitle, y);
        y -= 20;

        // Version
        drawRow('版本號碼:', `v${history.version}`, y);
        y -= 20;

        // Change Type
        const changeTypeMap: { [key: string]: string } = {
            'CREATE': '新增',
            'UPDATE': '修改',
            'DELETE': '刪除',
            'RESTORE': '還原'
        };
        drawRow('變更類型:', changeTypeMap[history.changeType] || history.changeType, y);
        y -= 20;

        // Date
        const dateStr = new Date(history.createdAt).toLocaleDateString('zh-TW');
        drawRow('變更日期:', dateStr, y);
        y -= 20;

        // Submitter
        drawRow('提交者:', history.submittedBy?.username || 'N/A', y);
        y -= 20;

        // Approver
        drawRow('核准者:', history.reviewedBy?.username || 'N/A', y);
        y -= 40;

        // Divider line
        page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 1,
            color: gray,
        });
        y -= 20;

        // Content section
        page.drawText('變更內容:', { x: margin, y, size: 12, font, color: black });
        y -= 10;

        // Render HTML content as image
        let contentImage;
        const contentHtml = snapshot.content || '<p>(無內容)</p>';

        try {
            // Dynamically import to avoid issues with SSR
            const { renderHtmlToImage } = await import('./html-renderer');
            const imageBuffer = await renderHtmlToImage(contentHtml, 495); // A4 width minus margins
            contentImage = await pdfDoc.embedPng(imageBuffer);
            console.log('[generateQCDocument] Content image embedded, size:', contentImage.width, 'x', contentImage.height);
        } catch (renderError) {
            console.error('[generateQCDocument] Failed to render HTML, falling back to text:', renderError);
            // Fallback to text-based content
            const content = stripHtml(contentHtml);
            const lines = wrapText(content, font, 10, width - 2 * margin);

            y -= 10;
            for (const line of lines.slice(0, 15)) {
                if (y < 150) break;
                page.drawText(line, { x: margin, y, size: 10, font, color: black });
                y -= 15;
            }
            contentImage = null;
        }

        if (contentImage) {
            // Scale image to fit within available space
            const maxImageWidth = width - 2 * margin;
            const maxImageHeight = y - 150; // Leave room for signature block
            const scale = Math.min(
                maxImageWidth / contentImage.width,
                maxImageHeight / contentImage.height,
                1 // Don't scale up
            );

            const scaledWidth = contentImage.width * scale;
            const scaledHeight = contentImage.height * scale;

            // Draw the content image
            page.drawImage(contentImage, {
                x: margin,
                y: y - scaledHeight,
                width: scaledWidth,
                height: scaledHeight,
            });

            y = y - scaledHeight - 10;
        }

        // Signature block at bottom
        const sigY = 100;

        // QC Signature box
        page.drawRectangle({
            x: margin,
            y: sigY - 50,
            width: 150,
            height: 70,
            borderColor: gray,
            borderWidth: 1,
        });
        page.drawText('品質管制審核', { x: margin + 30, y: sigY + 25, size: 10, font, color: black });

        // PM Signature box
        page.drawRectangle({
            x: width - margin - 150,
            y: sigY - 50,
            width: 150,
            height: 70,
            borderColor: gray,
            borderWidth: 1,
        });
        page.drawText('專案經理核定', { x: width - margin - 120, y: sigY + 25, size: 10, font, color: black });

        // Ensure output directory exists
        const outDir = path.join(process.cwd(), 'public', 'iso_doc');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        // Save the PDF
        const fileName = `qc_${history.id}_${Date.now()}.pdf`;
        const filePath = path.join(outDir, fileName);

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(filePath, pdfBytes);

        console.log('[generateQCDocument] PDF saved successfully:', filePath);
        return `/iso_doc/${fileName}`;

    } catch (error) {
        console.error('[generateQCDocument] Error:', error);
        throw error;
    }
};

function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}
