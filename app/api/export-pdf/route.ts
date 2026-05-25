import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser } from "puppeteer";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface ExportBody {
  html?: string;
  fileName?: string;
}

/**
 * Headless Chrome PDF export.
 *
 * Why Puppeteer instead of letting the browser do window.print():
 *   • Vector-perfect PDF (text is selectable, file is small)
 *   • One-click download (no print dialog)
 *   • Identical output across user machines
 *   • Backgrounds + colors always on (no "Background graphics" toggle)
 *
 * The route receives the *full* self-contained document we built in
 * /api/generate-report and just turns it into PDF bytes.
 */
export async function POST(req: NextRequest) {
  let browser: Browser | null = null;

  try {
    const body = (await req.json()) as ExportBody;
    const html = (body.html ?? "").trim();
    const fileName = sanitizeFileName(body.fileName) || "Injaazh-Report";

    if (!html || html.length < 100) {
      return NextResponse.json(
        { error: "Missing or invalid HTML payload." },
        { status: 400 }
      );
    }

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=medium",
      ],
    });

    const page = await browser.newPage();

    // A4 @ 96dpi ≈ 794 × 1123 px. We render at this width so screen and PDF
    // layouts match, then ask Chrome to emit A4-sized pages.
    await page.setViewport({
      width: 1040,
      height: 1400,
      deviceScaleFactor: 2,
    });

    // Use 'networkidle0' so Google Fonts have time to load before we snapshot.
    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"],
      timeout: 45_000,
    });

    // Make sure custom fonts are flushed before the PDF is laid out.
    await page.evaluateHandle("document.fonts.ready");

    // Force "screen" media so our rich glassmorphism look is preserved instead
    // of falling back to print-mode flatten rules. Backgrounds will still be
    // included via printBackground:true.
    await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm",
      },
      displayHeaderFooter: true,
      // Subtle gold-ish footer line: page number + brand
      footerTemplate: `
        <div style="width:100%; padding:0 10mm; font-family: 'Outfit','Inter',system-ui,sans-serif; font-size:8px; color:#9a9aa6; display:flex; justify-content:space-between; align-items:center;">
          <span style="letter-spacing:0.2em; text-transform:uppercase;">Injaazh · Master Audit</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      headerTemplate: `<div></div>`,
    });

    await browser.close();
    browser = null;

    // Buffer → Blob-friendly response
    const safeName = `${fileName}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
        "Content-Length": String(pdf.byteLength),
      },
    });
  } catch (err) {
    console.error("[export-pdf] error:", err);
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
    const message =
      err instanceof Error ? err.message : "Unexpected PDF export error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeFileName(name?: string): string {
  if (!name) return "";
  // Strip path separators and dangerous chars, keep it human-readable
  return name
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\.pdf$/i, "")
    .trim()
    .slice(0, 80);
}
