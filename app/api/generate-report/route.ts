import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

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

/**
 * Master Architect Prompt - Multi-Image Analysis (Lightweight PDF-First)
 *
 * The model generates a clean, flat, premium-looking HTML report that:
 *   • Looks identical in browser preview AND in PDF (no design shift)
 *   • Stays inherently lightweight (no backdrop-filter, no heavy blurs, no rasterized effects)
 *   • Uses solid colors + subtle borders for the dark cinematic feel
 *   • Renders text as vector glyphs (selectable, searchable, fast)
 */
const SYSTEM_PROMPT = `
You are an ELITE Technical SEO analyst and report architect for the agency "Injaazh".

You will receive MULTIPLE screenshots of SEO / technical audits from various tools (e.g. Lighthouse, PageSpeed, Ahrefs, Semrush, Screaming Frog, GA4, Search Console, GTmetrix, etc.).

Your job:
1. Carefully analyze EACH screenshot and read every visible value (scores, metrics, issues, charts, tables, labels).
2. CROSS-REFERENCE data across different screenshots to build a comprehensive picture.
3. Extract: overall scores, Core Web Vitals (LCP, INP/FID, CLS), critical issues, warnings, opportunities, and any contextual signals (industry, URL, keywords if visible).
4. Identify PATTERNS and CORRELATIONS across different tools (e.g., if PageSpeed shows slow LCP and GTmetrix shows large images, connect these insights).
5. Synthesize a high-end enterprise-grade audit report that combines insights from ALL sources.
6. Build a phased 5-MONTH STRATEGIC ROADMAP (Month 1 → Month 5) with concrete milestones aligned to the issues found.
7. If a value is not visible or unclear, infer a sensible placeholder labeled "Detected: —" rather than fabricating numbers.
8. Prioritize issues that appear in MULTIPLE screenshots as they are likely more critical.

═══════════════════════════════════════════════════════════════════
CRITICAL: PDF-FIRST LIGHTWEIGHT DESIGN PHILOSOPHY
═══════════════════════════════════════════════════════════════════

The output is rendered TO A PDF. PDFs become massive and laggy when CSS effects
get rasterized into bitmaps. You MUST follow these rules to keep the PDF small,
fast, and identical to the screen preview:

✅ DO USE (PDF-friendly, vector-clean):
   • Solid background colors (e.g. #0e0e15, #131320, #1a1a24)
   • 1px solid borders with subtle colors (e.g. rgba(255,255,255,0.08-0.14))
   • Flat color fills for accents and highlights
   • Simple linear-gradient ONLY for thin gold dividers (1-2px tall)
   • Text colors: #ececf2, #fff, #d4af37 (gold), #7ff4ff (cyan accent)
   • border-radius for rounded corners (12-18px)
   • CSS Grid / Flexbox for layout
   • Simple SVG icons (inline, small)
   • Text decoration via color, weight, size, letter-spacing

❌ NEVER USE (cause heavy rasterized PDFs):
   • backdrop-filter / -webkit-backdrop-filter (PRIMARY CULPRIT — bans entirely)
   • filter: blur(...) on any element
   • box-shadow with large blur radius (use NONE or max 0 0 0 1px ... for borders)
   • Heavy radial-gradient or conic-gradient backgrounds covering large areas
   • text-shadow with blur
   • Multiple stacked shadows
   • Frosted glass / glassmorphism / blur effects of any kind
   • Background-image: url(...) (no images, no SVG patterns as backgrounds)
   • CSS animations or transitions (PDFs are static)
   • position: fixed / position: sticky
   • 100vh / 100vw on critical layout

DESIGN LANGUAGE (Premium dark cinematic — achieved with FLAT design):
   • Background: solid #070709 on body, panels on #0e0e15 / #131320
   • Borders: 1px solid rgba(255,255,255,0.08) for subtle separation
   • Accent border on featured cards: 1px solid rgba(212,175,55,0.30) (gold)
   • Headings: 'Playfair Display', serif. Body: 'Outfit', 'Inter', system-ui.
   • Eyebrow labels: uppercase, letter-spacing 0.3em, color #d4af37, font-size 11px
   • Gold dividers: a 1-2px tall element with linear-gradient(90deg, transparent, #d4af37, transparent)
   • Score chips: solid colored circles or rounded rects with bold gold numerals
   • Severity tags: solid colored pill (red #ef4444, amber #f59e0b, cyan #06b6d4, gray for low)
   • Use whitespace, typography hierarchy, and color contrast — NOT effects — to create premium feel

OUTPUT REQUIREMENTS — READ CAREFULLY:
- Return ONLY raw HTML. No markdown, no code fences, no commentary.
- The HTML must start with a <style> tag and be followed by the report markup.
- Use CSS scoped via wrapper class ".injaazh-report" so it does not leak globally.
- Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags. Output is embedded.
- Wrap everything in <div class="injaazh-report"> ... </div>.

DESIGN AT DESKTOP CLASS (1040px render width — Puppeteer scales it to A4 in PDF):
- The render canvas is 1040px wide. Design like a desktop magazine spread, NOT a cramped A4 layout. Set:
    .injaazh-report { max-width: 1040px; margin: 0 auto; padding: 32px 28px; }
- Cover title font-size: 56-72px (big, cinematic, breathing room — Playfair Display 700/800).
- Section headings (h2): 32-40px. Sub-headings (h3): 20-24px. Body: 15-16px with line-height 1.6.
- Eyebrow labels: 11-12px, uppercase, letter-spacing 0.32em, color gold.
- Generous padding INSIDE panels (28-40px) and breathing margin BETWEEN panels (24-32px).
- Multi-column grids feel native at 1040px: 2-3 cols for cards, 4 cols for small metric chips.
- Roadmap timeline: visual timeline (vertical or horizontal), rich and editorial.
- Use whitespace boldly. Premium feel comes from breathing room, typography hierarchy, and color contrast.

REQUIRED SECTIONS (in this order, each as a flat panel with solid bg + 1px border):
  1. Cover / Executive Summary — brand line "INJAAZH · MASTER AUDIT", report title, date (use {{REPORT_DATE}} placeholder you will literally output as today's date in "Month DD, YYYY" format), number of data sources analyzed, and a 2–3 sentence executive synopsis.
  2. Data Sources — list of tools/screenshots analyzed with brief description of what each provided.
  3. Key Metrics Grid — 4 to 8 metric cards with score chips or bold gold numerals. Show data from multiple sources.
  4. Critical Issues — ranked list with severity tag, issue, impact, data source(s), and recommended fix.
  5. Cross-Tool Insights — patterns, correlations, and validated findings across data sources.
  6. Opportunities & Quick Wins — 3 to 7 cards with actionable recommendations.
  7. 5-Month Strategic Roadmap — visual timeline with Month 1 → Month 5, each containing 2–4 milestones.
  8. Closing / KPI Targets — projected uplift table.
  9. Footer — must contain EXACTLY this line, prominently styled in gold:
        Report Architected & Prepared by Injaazh

PAGE BREAK HINTS (CRITICAL — keep PDF flowing without empty gaps):
- DO NOT use  page-break-before: always  or  break-before: page  ANYWHERE. Sections must flow naturally one after another with NO forced page breaks. Forcing breaks creates large empty gaps in the PDF.
- DO NOT put  page-break-inside: avoid  on large containers (sections, big cards, the roadmap container). It pushes huge blocks to the next page leaving empty space. Let large containers break naturally across pages.
- ONLY apply  page-break-inside: avoid  to SMALL atomic units that look bad when split:
    • Individual table rows
    • Single list items
    • A small metric chip with its label
    • A single roadmap month card (only if it's compact, ~3-4 lines)
    • Heading + its first paragraph (use heading + paragraph wrapper)
- Headings should have  page-break-after: avoid  so they don't get orphaned at the bottom of a page.
- The whole report should read like a continuous magazine layout, not a slideshow with one section per page.

CONSTRAINTS:
- No external images, fonts (the host document loads Playfair + Outfit), scripts, or stylesheets.
- Aim for ~1000–1600 lines of polished, production-quality FLAT HTML+CSS. Visual richness comes from typography, color, and layout — NOT from effects.
- Every panel must look premium WITHOUT any blur or shadow effects.
`.trim();

interface GenerateBody {
  images?: string[];
  mimeTypes?: string[];
  // Legacy support for single image
  image?: string;
  mimeType?: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as GenerateBody;
    
    // Support both single and multiple images
    let images: string[] = [];
    let mimeTypes: string[] = [];
    
    if (body.images && Array.isArray(body.images)) {
      images = body.images;
      mimeTypes = body.mimeTypes || [];
    } else if (body.image) {
      // Legacy single image support
      images = [body.image];
      mimeTypes = [body.mimeType || "image/png"];
    }

    if (!images.length || images.some(img => typeof img !== "string")) {
      return NextResponse.json(
        { error: "Missing or invalid image payload." },
        { status: 400 }
      );
    }

    // Validate all mime types
    const allowedMime = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const safeMimeTypes = mimeTypes.map((mime, i) => {
      const safeMime = (mime ?? "image/png").toLowerCase();
      if (!allowedMime.includes(safeMime)) {
        throw new Error(`Unsupported image type at index ${i}: ${safeMime}`);
      }
      return safeMime === "image/jpg" ? "image/jpeg" : safeMime;
    });

    const genAI = new GoogleGenerativeAI(apiKey);

    // Models are tried in order. The first one accessible to the caller's key
    // wins. Order is: free-tier-friendly Flash first, then Pro for users on a
    // paid plan, then a stable older Flash as a last resort.
    const MODEL_CANDIDATES = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
    ];

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const prompt = SYSTEM_PROMPT.replace("{{REPORT_DATE}}", today);

    // Build array of inline images
    const inlineImages = images.map((img, i) => ({
      inlineData: {
        mimeType: safeMimeTypes[i] || "image/png",
        data: img,
      },
    }));

    let raw = "";
    let usedModel = "";
    let lastError: unknown = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const modelConfig: Record<string, unknown> = {
          model: modelName,
          generationConfig: {
            temperature: 0.55,
            topP: 0.95,
            // Generous budget for multi-image comprehensive reports
            maxOutputTokens: 32768,
            responseMimeType: "text/plain",
            thinkingConfig: { thinkingBudget: 0 },
          },
        };

        const model = genAI.getGenerativeModel(
          modelConfig as unknown as Parameters<
            typeof genAI.getGenerativeModel
          >[0]
        );

        // Send prompt + all images
        const content = [
          { text: prompt },
          ...inlineImages,
        ];

        const result = await model.generateContent(content);

        raw = result.response.text() ?? "";
        if (!raw || raw.trim().length < 200) {
          console.warn(
            `[generate-report] "${modelName}" returned ${raw.length} chars — trying next candidate`
          );
          continue;
        }
        usedModel = modelName;
        break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isModelMissing =
          /404/.test(msg) ||
          /not found/i.test(msg) ||
          /not supported/i.test(msg) ||
          /unsupported/i.test(msg);
        const isQuotaExhausted =
          /429/.test(msg) ||
          /quota/i.test(msg) ||
          /rate limit/i.test(msg) ||
          /exceeded/i.test(msg);
        if (!isModelMissing && !isQuotaExhausted) throw err;
        console.warn(
          `[generate-report] model "${modelName}" unavailable (${
            isQuotaExhausted ? "quota" : "missing"
          }), trying next…`
        );
      }
    }

    if (!usedModel) {
      const message =
        lastError instanceof Error
          ? lastError.message
          : "No supported Gemini model is available for this API key.";
      const isQuota = /429|quota|rate limit|exceeded/i.test(message);
      return NextResponse.json(
        {
          error: isQuota
            ? "Daily quota exhausted on all available Gemini models. Please wait a few minutes or upgrade your API plan."
            : message,
        },
        { status: isQuota ? 429 : 502 }
      );
    }

    const html = sanitizeHtml(raw);

    if (!html || html.length < 200) {
      return NextResponse.json(
        {
          error:
            "The model returned an empty or invalid report. Please try again with clearer screenshots.",
        },
        { status: 502 }
      );
    }

    const document = buildDocument(html);

    return NextResponse.json({ 
      html: document, 
      fragment: html, 
      model: usedModel,
      imagesAnalyzed: images.length 
    });
  } catch (err) {
    console.error("[generate-report] error:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Strip any accidental markdown fences or chatter the model might emit
 * around the HTML payload.
 */
function sanitizeHtml(input: string): string {
  let s = input.trim();

  // Remove ```html ... ``` or ``` ... ``` wrappers if present.
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:html)?\s*/i, "").replace(/```$/i, "").trim();
  }

  // If the model added a leading explanation, slice from the first <style> or <div>.
  const firstTag = s.search(/<\s*(style|div|section)\b/i);
  if (firstTag > 0) {
    s = s.slice(firstTag);
  }

  // Trim trailing fences/text after the last closing tag.
  const lastClose = s.lastIndexOf("</");
  if (lastClose !== -1) {
    const closeEnd = s.indexOf(">", lastClose);
    if (closeEnd !== -1) {
      s = s.slice(0, closeEnd + 1);
    }
  }

  return s.trim();
}

/**
 * Build a fully self-contained HTML document around the AI fragment.
 *
 * Philosophy: Since the AI now generates inherently lightweight, flat HTML
 * (no backdrop-filter, no heavy blurs, no rasterization-prone effects), we
 * keep the host document MINIMAL. The screen preview and the PDF render
 * IDENTICALLY — no "design shift" between preview and download.
 *
 * The host document only provides:
 *   • A solid dark page background
 *   • Embedded Playfair Display + Outfit fonts
 *   • Color preservation hints for printing
 *   • Page-break safety as a fallback (the AI also marks them inline)
 */
function buildDocument(fragment: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Injaazh — Master Audit Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #070709;
    color: #ececf2;
    font-family: 'Outfit', 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.55;
  }
  body {
    /* Solid background only — no gradients to keep PDF lightweight */
    background: #070709;
    min-height: 100vh;
    padding: 24px;
  }

  /* Force color preservation in PDF/print across browsers */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }

  /* AI-generated content base styles. Render width is 1040px — same as the
     browser preview. Puppeteer will scale this down proportionally to fit
     A4 in the PDF, so screen and PDF look IDENTICAL — just print-sized. */
  .injaazh-report {
    max-width: 1040px;
    margin: 0 auto;
    color: #ececf2;
  }
  .injaazh-report h1, .injaazh-report h2, .injaazh-report h3, .injaazh-report h4 {
    font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
    color: #fff;
    letter-spacing: -0.01em;
    margin: 0 0 0.4em;
  }
  .injaazh-report a { color: #d4af37; text-decoration: none; }
  .injaazh-report code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: #131320;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 2px 6px;
  }

  /* Page setup for PDF */
  @page {
    size: A4;
    margin: 12mm 10mm;
    background: #070709;
  }

  /*
    Page-break safety net — KEEP IT MINIMAL.

    Rule of thumb: only protect small atomic units from being split.
    Forcing  break-inside: avoid  on big containers (sections, large cards,
    the roadmap, the whole metrics grid) creates HUGE empty gaps because
    Chrome pushes the entire block to the next page when it can't fit.

    We let big containers flow naturally and only protect:
      • Individual table rows
      • Single list items
      • Headings (so they don't dangle at page bottom)
      • Images / SVG (so they don't split mid-figure)
  */
  @media print {
    body {
      padding: 0;
    }
    .injaazh-report {
      max-width: 100%;
      margin: 0;
    }
    /* Headings: don't get orphaned at the very bottom of a page */
    .injaazh-report h1,
    .injaazh-report h2,
    .injaazh-report h3,
    .injaazh-report h4 {
      page-break-after: avoid;
      break-after: avoid;
    }
    /* Small atomic units: don't split mid-element */
    .injaazh-report tr,
    .injaazh-report li,
    .injaazh-report figure,
    .injaazh-report img,
    .injaazh-report svg {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .injaazh-report img,
    .injaazh-report svg {
      max-width: 100%;
      height: auto;
    }
  }
</style>
</head>
<body>
${fragment}
</body>
</html>`;
}
