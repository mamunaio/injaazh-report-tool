import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";
import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Block search engines from indexing API responses
export async function GET() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      Allow: "POST",
    },
  });
}

interface ExportBody {
  html?: string;
  fileName?: string;
}

interface PDFMetrics {
  /** File size in bytes */
  fileSizeBytes: number;
  /** File size in megabytes (rounded to 2 decimals) */
  fileSizeMB: number;
  /** Time taken to generate PDF in milliseconds */
  generationTimeMs: number;
  /** Whether file size exceeds 2MB target */
  exceedsTarget: boolean;
  /** Target file size in MB (always 2) */
  targetMB: number;
}

/**
 * Measure PDF performance metrics
 */
function measurePDFMetrics(pdfBuffer: Uint8Array, startTime: number): PDFMetrics {
  const fileSizeBytes = pdfBuffer.byteLength;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  const generationTimeMs = Date.now() - startTime;
  const targetMB = 2;
  const exceedsTarget = fileSizeMB > targetMB;

  return {
    fileSizeBytes,
    fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
    generationTimeMs,
    exceedsTarget,
    targetMB,
  };
}

/**
 * Detect runtime: Vercel/AWS Lambda vs local development.
 * On serverless we use @sparticuz/chromium (a slim, Lambda-friendly Chromium
 * shipped as a layer). Locally we fall back to whatever Chrome the dev has
 * installed via Puppeteer's bundled binary path or a known system path.
 */
const IS_SERVERLESS =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NODE_ENV === "production";

/**
 * Resolve the Chromium executable path for local development.
 * Tries common system Chrome locations across Windows / macOS / Linux.
 */
function findLocalChrome(): string {
  // Allow explicit override via env var
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = [
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  // Only used in local dev (we early-return for serverless above).
  for (const path of candidates) {
    try {
      if (existsSync(path)) return path;
    } catch {
      /* ignore */
    }
  }
  throw new Error(
    "Local Chrome not found. Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH."
  );
}

/**
 * Launch a Puppeteer browser configured for the current environment.
 *   • Vercel / AWS Lambda → @sparticuz/chromium (slim Chromium binary)
 *   • Local dev → system-installed Google Chrome
 */
async function launchBrowser(): Promise<Browser> {
  if (IS_SERVERLESS) {
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  return puppeteer.launch({
    headless: true,
    executablePath: findLocalChrome(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=medium",
    ],
  });
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
    const startTime = Date.now(); // Capture start time for performance measurement
    
    const body = (await req.json()) as ExportBody;
    const html = (body.html ?? "").trim();
    const fileName = sanitizeFileName(body.fileName) || "Injaazh-Report";

    if (!html || html.length < 100) {
      return NextResponse.json(
        { error: "Missing or invalid HTML payload." },
        { status: 400 }
      );
    }

    browser = await launchBrowser();

    const page = await browser.newPage();

    // Render at desktop class width (1040px) — same as the browser preview.
    // This keeps the rich, premium typography (big titles, generous spacing)
    // exactly as the user sees it on screen. Chrome will scale this down
    // proportionally when emitting A4 pages via the `scale` option below,
    // so screen preview and PDF stay visually IDENTICAL — just sized down.
    await page.setViewport({
      width: 1040,
      height: 1400,
      deviceScaleFactor: 2,
    });

    // Use 'networkidle0' so Google Fonts have time to load before we snapshot.
    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"] as any,
      timeout: 45_000,
    });

    // Make sure custom fonts are flushed before the PDF is laid out.
    await page.evaluateHandle("document.fonts.ready");

    // Use "screen" media so PDF matches what user sees in preview.
    // The HTML itself is now generated as lightweight flat design,
    // so we don't need print-mode flattening anymore.
    await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      // Scale the 1040px desktop layout DOWN proportionally so it fits A4
      // without Chrome reflowing the layout. 0.78 = 794/1040 ≈ matches the
      // ratio of A4 width to our render viewport. The result is a perfect
      // visual snapshot of the screen preview at A4 size — same fonts, same
      // spacing, same proportions, just shrunk like a magazine print.
      scale: 0.78,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "16mm",
        left: "10mm",
      },
      displayHeaderFooter: true,
      // Editorial gold-rule footer: brand on left, page count on right
      footerTemplate: `
        <div style="width:100%; padding:0 12mm; font-family: 'Outfit','Inter',system-ui,sans-serif; font-size:8px; color:#9a9aa6; display:flex; justify-content:space-between; align-items:center; border-top:0.5px solid #d4af37;">
          <span style="letter-spacing:0.32em; text-transform:uppercase; padding-top:6px;">
            <span style="color:#d4af37;">Injaazh</span> &nbsp;·&nbsp; Master Audit Dossier
          </span>
          <span style="padding-top:6px; font-variant-numeric: tabular-nums;">
            <span class="pageNumber"></span> &nbsp;/&nbsp; <span class="totalPages"></span>
          </span>
        </div>`,
      headerTemplate: `<div></div>`,
    });

    await browser.close();
    browser = null;

    // Measure and log performance metrics
    const metrics = measurePDFMetrics(pdf, startTime);
    
    console.log(`[PDF Metrics] Size: ${metrics.fileSizeMB}MB, Time: ${metrics.generationTimeMs}ms`);
    
    if (metrics.exceedsTarget) {
      console.warn(
        `[PDF Warning] File size ${metrics.fileSizeMB}MB exceeds target of ${metrics.targetMB}MB`
      );
    }

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
