import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Render HTML content to a PNG image using Puppeteer
 * @param htmlContent - The HTML content to render
 * @param width - Width of the viewport
 * @returns Buffer containing the PNG image data
 */
export async function renderHtmlToImage(
    htmlContent: string,
    width: number = 500
): Promise<Buffer> {
    console.log('[renderHtmlToImage] Starting HTML to image conversion');

    // Launch headless browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({
            width: width,
            height: 800, // Initial height, will be adjusted based on content
            deviceScaleFactor: 2 // Higher resolution for better quality
        });

        // Create a full HTML document with proper styling
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 10px;
        }
        p {
            margin-bottom: 8px;
        }
        ul, ol {
            margin-left: 20px;
            margin-bottom: 8px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 8px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
        }
        h1, h2, h3 {
            margin-bottom: 8px;
        }
        strong, b {
            font-weight: 600;
        }
        code {
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
        }
        pre {
            background: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            margin-bottom: 8px;
        }
        blockquote {
            border-left: 3px solid #ddd;
            padding-left: 10px;
            margin-left: 0;
            color: #666;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        a {
            color: #0066cc;
        }
    </style>
</head>
<body>
    <div id="content">
        ${htmlContent || '<p>(無內容)</p>'}
    </div>
</body>
</html>
        `;

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        // Get the actual height of the content
        const contentHeight = await page.evaluate(() => {
            const content = document.getElementById('content');
            return content ? content.offsetHeight : 100;
        });

        // Resize viewport to match content
        await page.setViewport({
            width: width,
            height: Math.min(contentHeight + 20, 1000), // Cap at 1000px to avoid huge images
            deviceScaleFactor: 2
        });

        // Take screenshot
        const screenshot = await page.screenshot({
            type: 'png',
            omitBackground: false,
            clip: {
                x: 0,
                y: 0,
                width: width,
                height: Math.min(contentHeight + 20, 1000)
            }
        });

        console.log('[renderHtmlToImage] Screenshot captured, size:', (screenshot as Buffer).length, 'bytes');
        return screenshot as Buffer;

    } finally {
        await browser.close();
    }
}

/**
 * Render HTML content and save to a temporary file
 * @param htmlContent - The HTML content to render
 * @param outputPath - Path to save the image
 * @param width - Width of the viewport
 */
export async function renderHtmlToFile(
    htmlContent: string,
    outputPath: string,
    width: number = 500
): Promise<void> {
    const imageBuffer = await renderHtmlToImage(htmlContent, width);
    fs.writeFileSync(outputPath, imageBuffer);
    console.log('[renderHtmlToFile] Image saved to:', outputPath);
}
