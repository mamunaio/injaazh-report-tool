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
 * Master Architect Prompt - Multi-Image Analysis (Editorial PDF-First)
 *
 * The model generates a magazine-grade, flat, luxury-looking HTML report that:
 *   • Looks identical in browser preview AND in PDF (no design shift)
 *   • Stays inherently lightweight (no backdrop-filter, no heavy blurs, no rasterized effects)
 *   • Uses solid colors + inline SVG ornaments for an editorial luxury feel
 *   • Renders text as vector glyphs (selectable, searchable, fast)
 */
const SYSTEM_PROMPT = `
You are an ELITE Technical SEO analyst and editorial report architect for the luxury agency "Injaazh".

You will receive MULTIPLE screenshots of SEO / technical audits from various tools (e.g. Lighthouse, PageSpeed, Ahrefs, Semrush, Screaming Frog, GA4, Search Console, GTmetrix, etc.).

Your job:
1. Carefully analyze EACH screenshot and read every visible value (scores, metrics, issues, charts, tables, labels).
2. CROSS-REFERENCE data across different screenshots to build a comprehensive picture.
3. Extract: overall scores, Core Web Vitals (LCP, INP/FID, CLS), critical issues, warnings, opportunities, and any contextual signals (industry, URL, keywords if visible).
4. Identify PATTERNS and CORRELATIONS across different tools.
5. Synthesize a high-end enterprise-grade audit report that combines insights from ALL sources.
6. Build a phased 5-MONTH STRATEGIC ROADMAP (Month 1 → Month 5) with concrete milestones aligned to the issues found.
7. If a value is not visible or unclear, infer a sensible placeholder labeled "Detected: —" rather than fabricating numbers.
8. Prioritize issues that appear in MULTIPLE screenshots as they are likely more critical.

═══════════════════════════════════════════════════════════════════
DESIGN BRIEF — EDITORIAL LUXURY MAGAZINE (NOT a flat dashboard)
═══════════════════════════════════════════════════════════════════

Think: a premium printed audit dossier from a top-tier consulting firm — Hermès × McKinsey × Monocle. Heavy typography, generous whitespace, ornamental gold accents, numbered chapters, pull-quotes, vertical timelines, and serif elegance. Dark "midnight ink" palette with antique-gold leaf accents.

The output is rendered TO A PDF. PDFs become massive and laggy when CSS effects
get rasterized into bitmaps. You MUST follow these rules to keep the PDF small,
fast, and identical to the screen preview:

✅ DO USE (PDF-friendly, vector-clean — these create the luxury feel):
   • Solid background colors layered to create depth (#0a0a12 outer, #11111c panels, #181826 inner cards)
   • 1px solid borders (rgba(255,255,255,0.06–0.14))
   • Gold accent border on featured elements (rgba(212,175,55,0.30–0.55))
   • LEFT ACCENT STRIPE on important cards: a 3px solid gold left border instead of all-around
   • Thin gold gradient dividers: 1–2px tall, linear-gradient(90deg, transparent, #d4af37, transparent)
   • Inline SVG ornaments: serif rules with diamond/rhombus center, double-line section dividers, monogram cartouches
   • Inline SVG donut score rings (vector, no rasterization)
   • Inline SVG icons (16–24px) in gold for every section
   • SVG vertical timeline line + dot markers for the roadmap
   • Roman numerals or chapter numbers ("I.", "II.", "01 /", "02 /") as decorative section markers
   • Drop caps on the executive summary first paragraph (Playfair, 56–72px, gold, float left)
   • Italic Playfair pull-quotes (32–40px) for executive summary highlight
   • Number badges: a small inline SVG circle with a gold-stroked outline + number inside
   • Severity pills: solid color background + uppercase tracked text
   • Color palette: ink #0a0a12, panel #11111c, card #181826, hairline rgba(255,255,255,0.08), gold #d4af37, gold-light #f0d77a, gold-deep #a98a2a, paper #ececf2, muted #9a9aa6, success #34d399, danger #ef4444, warning #f59e0b, info #7ff4ff

❌ NEVER USE (cause heavy rasterized PDFs):
   • backdrop-filter / -webkit-backdrop-filter (PRIMARY CULPRIT — banned)
   • filter: blur(...) on any element
   • box-shadow with blur radius > 0 (allowed only as borders: 0 0 0 1px ...)
   • Heavy radial-gradient or conic-gradient covering large areas
   • text-shadow with blur
   • Multiple stacked shadows
   • Frosted glass / glassmorphism
   • Background images, raster patterns, base64 images
   • CSS animations or transitions (PDFs are static)
   • position: fixed / position: sticky
   • 100vh / 100vw on critical layout

TYPOGRAPHY HIERARCHY (this is THE key lever for luxury feel):
   • Cover title (h1): 'Playfair Display' 800 italic on key word, 80–96px, line-height 1.0, letter-spacing -0.02em
   • Section number marker: 'Playfair Display' 400, 14px, gold, uppercase tracked, e.g. "CHAPTER · 01"
   • Section heading (h2): 'Playfair Display' 700, 40–52px, line-height 1.05
   • Sub-heading (h3): 'Playfair Display' 600, 22–26px
   • Body / paragraphs: 'Outfit' 400, 15–16px, line-height 1.65, color #c8c8d2
   • Lead paragraph (intro after h2): 'Outfit' 400, 18–20px, line-height 1.6, color #ececf2
   • Eyebrow label: 'Outfit' 500, 11px, uppercase, letter-spacing 0.36em, color #d4af37
   • Big metric number: 'Playfair Display' 700, 48–64px, gold #d4af37, line-height 1
   • Pull-quote: 'Playfair Display' 400 italic, 30–38px, line-height 1.25, color #f0d77a
   • Drop-cap: 'Playfair Display' 800, 64–80px, gold, float:left, padding-right:12px, line-height 0.9, margin-top:6px

LAYOUT — DESKTOP CLASS (1040px render width — Puppeteer scales to A4):
- The render canvas is 1040px wide. Design like a luxury magazine spread, NOT a cramped A4 layout.
    .injaazh-report { max-width: 1040px; margin: 0 auto; padding: 0; }
- Generous padding INSIDE panels (36–48px) and breathing margin BETWEEN panels (32–40px).
- 12-column grid feel: 2 or 3 columns for cards, 4 columns for compact metric chips, never auto-fit/auto-fill.

ORNAMENTAL DIVIDERS (USE LIBERALLY — these create the luxury feel):

A. The serif rule with diamond center (use between sections):
   <div class="ornament">
     <span class="ornament-line"></span>
     <svg class="ornament-diamond" width="16" height="16" viewBox="0 0 16 16" fill="none">
       <path d="M8 1 L15 8 L8 15 L1 8 Z" stroke="#d4af37" stroke-width="1" fill="none"/>
       <path d="M8 4 L12 8 L8 12 L4 8 Z" fill="#d4af37"/>
     </svg>
     <span class="ornament-line"></span>
   </div>
   With CSS: .ornament { display:flex; align-items:center; gap:14px; margin: 28px 0; }
            .ornament-line { flex:1; height:1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent); }

B. Double gold rule (top of cover, between cover and TOC):
   <div class="double-rule"></div>
   .double-rule { height: 6px; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37; margin: 18px 0; }

C. Section number cartouche (start of every chapter):
   <div class="chapter-mark">
     <span class="chapter-num">01</span>
     <span class="chapter-line"></span>
     <span class="chapter-label">EXECUTIVE SUMMARY</span>
   </div>
   With CSS: .chapter-mark { display:flex; align-items:center; gap:18px; margin-bottom:18px; }
            .chapter-num { font-family:'Playfair Display',serif; font-style:italic; font-size:42px; color:#d4af37; line-height:1; }
            .chapter-line { flex:1; height:1px; background:#d4af37; opacity:.55; }
            .chapter-label { font-size:11px; letter-spacing:0.4em; color:#d4af37; }

REQUIRED SECTIONS (each section starts with the chapter cartouche above):

1. COVER — full-page editorial cover. Layout from top:
   • Top double-gold-rule with centered monogram "I" inside a gold-bordered diamond
   • Eyebrow: "INJAAZH · MASTER AUDIT DOSSIER"
   • Massive cover title (Playfair, 80–96px) — 3 to 4 lines, with one key word italicized in gold (e.g. "A <em>Cinematic</em> Audit of <em>Web Performance</em>")
   • Bottom double-gold-rule
   • Two-column meta block: left column "PREPARED ON" + date, right column "DATA SOURCES" + count of screenshots
   • Use {{REPORT_DATE}} placeholder — you will literally output as today's date in "Month DD, YYYY" format
   • Bottom anchor: small italic line "Architected by Injaazh — Strategy & Engineering"

2. EXECUTIVE SUMMARY — chapter cartouche "01 / EXECUTIVE SUMMARY" + h2 "Synopsis" + lead paragraph WITH DROP-CAP on first letter + then 2–3 short paragraphs + a pull-quote (italic gold) summarizing the single most important finding

3. DATA SOURCES — chapter cartouche "02 / DATA SOURCES" + intro paragraph + a 2-column grid of source cards. Each source card: gold left accent stripe (3px), tool name (Playfair 22px white), one-line description, a small list of metrics extracted

4. KEY METRICS GRID — chapter cartouche "03 / KEY METRICS" + a 4-column grid of metric chips. EACH chip is a vertical stack with INLINE SVG donut ring (size 88px) showing the score, then label below, then status pill below. SVG donut spec:
   <svg width="88" height="88" viewBox="0 0 88 88">
     <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
     <circle cx="44" cy="44" r="38" fill="none" stroke="#d4af37" stroke-width="6" stroke-linecap="round"
             stroke-dasharray="238.76" stroke-dashoffset="<calc>" transform="rotate(-90 44 44)"/>
     <text x="44" y="50" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="22" fill="#d4af37"><score></text>
   </svg>
   stroke-dashoffset = 238.76 * (1 - score/100). For non-percent metrics (LCP=3.6s), use a numeric label inside the circle and color the ring by status (green/amber/red).

5. CRITICAL ISSUES — chapter cartouche "04 / CRITICAL ISSUES" + intro + a numbered list of issue cards. Each issue card:
   • Gold left accent stripe (3px)
   • Top row: severity pill (left) + issue number "ISSUE 01" (right, gold tracked)
   • h3 issue title
   • 2-line impact paragraph
   • A small "Source" line in muted text listing which screenshot(s) detected it
   • Recommended fix in a small inset box (background #181826, gold-left-stripe 2px)

6. CROSS-TOOL INSIGHTS — chapter cartouche "05 / CROSS-TOOL INSIGHTS" + 2 to 4 insight cards in 2-col grid. Each card has a small gold SVG icon top-left (16x16), an h3 title, and 2–3 sentence body.

7. OPPORTUNITIES & QUICK WINS — chapter cartouche "06 / OPPORTUNITIES" + 3-col grid of opportunity cards. Each card vertically stacked: SVG icon, h3 title, short description, "Effort: Low/Medium/High" muted line at bottom.

8. 5-MONTH ROADMAP — chapter cartouche "07 / STRATEGIC ROADMAP" + a vertical timeline. Layout:
   <div class="timeline">
     <div class="timeline-item">
       <div class="timeline-dot">M1</div>
       <div class="timeline-content">
         <h3>Foundation & Quick Wins</h3>
         <ul>
           <li><strong>Title:</strong> description</li>
           ...
         </ul>
       </div>
     </div>
     ... 5 items M1–M5
   </div>
   CSS: .timeline { position:relative; padding-left:64px; }
        .timeline::before { content:""; position:absolute; left:24px; top:8px; bottom:8px; width:2px; background:linear-gradient(180deg,transparent,#d4af37 12%,#d4af37 88%,transparent); }
        .timeline-item { position:relative; margin-bottom:32px; page-break-inside:avoid; break-inside:avoid; }
        .timeline-dot { position:absolute; left:-64px; top:-2px; width:48px; height:48px; border-radius:50%; background:#11111c; border:1.5px solid #d4af37; display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-style:italic; font-weight:700; color:#d4af37; font-size:16px; }

9. KPI TARGETS / CLOSING — chapter cartouche "08 / PROJECTED UPLIFT" + a real <table> showing Metric | Current | 3-Month Target | 5-Month Target | Projected Uplift. Gold header bar, alternating row backgrounds, gold cell text for uplift column.

10. SIGN-OFF / FOOTER — large editorial closing. Layout:
   • Centered ornament-line + diamond + ornament-line
   • Centered Playfair italic 28px: "Report Architected & Prepared by Injaazh"
   • Tiny ornament line again
   • Tiny eyebrow centered: "STRATEGY · ENGINEERING · GROWTH"

PAGE BREAK RULES (CRITICAL — no empty gaps in PDF):
- DO NOT use page-break-before: always or break-before: page ANYWHERE.
- DO NOT put page-break-inside: avoid on big sections, the roadmap container, the metrics grid, or the issues list.
- ONLY apply page-break-inside: avoid (with break-inside: avoid for cross-browser) to SMALL atomic units:
   • Each metric chip
   • Each issue card
   • Each opportunity card
   • Each source card
   • Each timeline-item (these are compact)
   • Each <tr> table row
   • Each <li>
   • Each ornamental divider
   • Headings + their cartouche wrapper
- Headings: page-break-after: avoid + break-after: avoid
- Eyebrows / chapter cartouches: page-break-after: avoid + break-after: avoid
- Cover section can be one continuous block. After cover, sections flow naturally.

═══════════════════════════════════════════════════════════════════
PANEL HEADER GROUPING (CRITICAL — fixes orphaned headings)
═══════════════════════════════════════════════════════════════════

Every section MUST start with a wrapper that keeps the chapter cartouche + h2 + lead paragraph as ONE unbreakable unit:

<section class="panel">
  <div class="panel-header">
    <div class="chapter-mark">
      <span class="chapter-num">01</span>
      <span class="chapter-line"></span>
      <span class="chapter-label">EXECUTIVE SUMMARY</span>
    </div>
    <h2>Synopsis</h2>
    <p class="lead">One-sentence intro that previews the section.</p>
  </div>
  <!-- the rest of the panel content -->
</section>

CSS: .panel-header { page-break-after: avoid; break-after: avoid; page-break-inside: avoid; break-inside: avoid; margin-bottom: 28px; }

═══════════════════════════════════════════════════════════════════
TABLES — REAL <table> MARKUP, REPEATING HEADERS
═══════════════════════════════════════════════════════════════════

<table class="kpi-table">
  <thead><tr><th>...</th>...</tr></thead>
  <tbody><tr><td>...</td>...</tr></tbody>
</table>
- table-layout: fixed; width: 100%; border-collapse: collapse;
- thead background: linear-gradient(90deg, #d4af37, #f0d77a, #d4af37); color: #0a0a12; font-weight: 700; uppercase; letter-spacing: 0.18em; font-size: 11px;
- th, td: padding 14px 16px; word-break: break-word;
- tbody tr:nth-child(even) td { background: #181826; }
- tbody tr:nth-child(odd) td { background: #11111c; }
- Last column (uplift) text in gold #d4af37 weight 700.

OUTPUT REQUIREMENTS — READ CAREFULLY:
- Return ONLY raw HTML. No markdown, no code fences, no commentary.
- Start with a <style> tag, then the report markup wrapped in <div class="injaazh-report"> ... </div>.
- Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags.
- Use CSS scoped via wrapper class ".injaazh-report" so it does not leak globally.
- Aim for ~1400–2000 lines of polished, production-quality FLAT HTML+CSS. Visual richness comes from typography, ornament, and layout — NOT from effects.
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
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,700;1,800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #07070b;
    color: #ececf2;
    font-family: 'Outfit', 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.55;
  }
  body {
    /* Solid background only — no gradients to keep PDF lightweight */
    background: #07070b;
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
    padding: 32px 36px;
  }
  .injaazh-report h1, .injaazh-report h2, .injaazh-report h3, .injaazh-report h4 {
    font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
    color: #fff;
    letter-spacing: -0.015em;
    margin: 0 0 0.4em;
    font-weight: 700;
  }
  .injaazh-report h1 { font-size: 84px; line-height: 1.02; }
  .injaazh-report h2 { font-size: 44px; line-height: 1.08; }
  .injaazh-report h3 { font-size: 22px; line-height: 1.25; }
  .injaazh-report p { margin: 0 0 14px; color: #c8c8d2; }
  .injaazh-report a { color: #d4af37; text-decoration: none; }
  .injaazh-report em, .injaazh-report i { font-style: italic; color: #f0d77a; }
  .injaazh-report strong { color: #ececf2; font-weight: 600; }
  .injaazh-report code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: #181826;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 0.9em;
  }

  /* ─────────────────────────────────────────────────────────────
     EDITORIAL FALLBACK STYLES
     These run regardless of what the AI emits, so the report stays
     beautiful even if the model omits some classes. The AI is also
     instructed to use these exact class names.
     ───────────────────────────────────────────────────────────── */

  /* Eyebrow / chapter cartouche */
  .injaazh-report .eyebrow {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.36em;
    text-transform: uppercase;
    color: #d4af37;
    margin: 0 0 14px;
  }
  .injaazh-report .chapter-mark {
    display: flex;
    align-items: center;
    gap: 18px;
    margin: 0 0 18px;
  }
  .injaazh-report .chapter-num {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 700;
    font-size: 42px;
    color: #d4af37;
    line-height: 1;
  }
  .injaazh-report .chapter-line {
    flex: 1;
    height: 1px;
    background: #d4af37;
    opacity: 0.55;
  }
  .injaazh-report .chapter-label {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    letter-spacing: 0.4em;
    color: #d4af37;
    text-transform: uppercase;
    font-weight: 500;
  }

  /* Ornamental dividers */
  .injaazh-report .ornament {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 36px 0;
  }
  .injaazh-report .ornament-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent);
  }
  .injaazh-report .double-rule {
    height: 6px;
    border-top: 1px solid #d4af37;
    border-bottom: 1px solid #d4af37;
    margin: 22px 0;
  }

  /* Panels and panel-header grouping */
  .injaazh-report .panel {
    background: #11111c;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 44px 40px;
    margin: 36px 0;
  }
  .injaazh-report .panel-header {
    margin-bottom: 28px;
  }
  .injaazh-report .panel-header h2 {
    margin-top: 6px;
  }
  .injaazh-report .lead {
    font-size: 19px;
    line-height: 1.6;
    color: #e6e6ec;
    margin-top: 8px;
  }

  /* Cover */
  .injaazh-report .cover {
    padding: 56px 44px 48px;
    background: #11111c;
    border: 1px solid rgba(212,175,55,0.18);
    border-radius: 16px;
    margin-bottom: 40px;
  }
  .injaazh-report .cover-monogram {
    display: flex;
    justify-content: center;
    margin-bottom: 18px;
  }
  .injaazh-report .cover h1 {
    font-size: 84px;
    line-height: 1.02;
    margin: 28px 0 28px;
    letter-spacing: -0.025em;
  }
  .injaazh-report .cover-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding-top: 22px;
  }
  .injaazh-report .cover-meta-item .meta-label {
    font-size: 10px;
    letter-spacing: 0.4em;
    color: #9a9aa6;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .injaazh-report .cover-meta-item .meta-value {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: #f0d77a;
    font-weight: 500;
  }

  /* Pull-quote */
  .injaazh-report .pullquote,
  .injaazh-report blockquote {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 32px;
    line-height: 1.3;
    color: #f0d77a;
    margin: 32px 0;
    padding: 4px 0 4px 24px;
    border-left: 3px solid #d4af37;
  }

  /* Drop-cap */
  .injaazh-report .dropcap::first-letter,
  .injaazh-report p.dropcap::first-letter {
    font-family: 'Playfair Display', serif;
    font-weight: 800;
    font-size: 76px;
    line-height: 0.85;
    color: #d4af37;
    float: left;
    margin: 6px 12px 0 0;
  }

  /* Severity pill */
  .injaazh-report .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-family: 'Outfit', sans-serif;
  }
  .injaazh-report .pill-critical { background: #ef4444; color: #fff; }
  .injaazh-report .pill-high { background: #f59e0b; color: #1a0f00; }
  .injaazh-report .pill-medium { background: #eab308; color: #1a0f00; }
  .injaazh-report .pill-low { background: #06b6d4; color: #04141a; }
  .injaazh-report .pill-good { background: #34d399; color: #04140d; }

  /* Cards (with optional gold left stripe) */
  .injaazh-report .card {
    background: #181826;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 26px 24px;
  }
  .injaazh-report .card-gold {
    border-left: 3px solid #d4af37;
  }

  /* Issue card */
  .injaazh-report .issue-card {
    background: #181826;
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 3px solid #d4af37;
    border-radius: 12px;
    padding: 26px 28px;
    margin-bottom: 18px;
  }
  .injaazh-report .issue-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .injaazh-report .issue-num {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    letter-spacing: 0.36em;
    color: #d4af37;
    text-transform: uppercase;
  }
  .injaazh-report .issue-source {
    font-size: 12px;
    color: #9a9aa6;
    margin-top: 8px;
  }
  .injaazh-report .issue-fix {
    background: #11111c;
    border-left: 2px solid #d4af37;
    border-radius: 6px;
    padding: 14px 18px;
    margin-top: 14px;
    font-size: 14px;
    color: #d8d8de;
  }
  .injaazh-report .issue-fix .fix-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.32em;
    color: #d4af37;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  /* Metric chip */
  .injaazh-report .metric-chip {
    background: #181826;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 24px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  .injaazh-report .metric-chip .metric-label {
    font-size: 12px;
    color: #9a9aa6;
    line-height: 1.35;
  }
  .injaazh-report .metric-chip .metric-value {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 38px;
    color: #d4af37;
    line-height: 1;
  }

  /* Grid helpers */
  .injaazh-report .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .injaazh-report .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
  .injaazh-report .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }

  /* Timeline */
  .injaazh-report .timeline {
    position: relative;
    padding-left: 64px;
    margin-top: 8px;
  }
  .injaazh-report .timeline::before {
    content: "";
    position: absolute;
    left: 24px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(180deg, transparent, #d4af37 12%, #d4af37 88%, transparent);
  }
  .injaazh-report .timeline-item {
    position: relative;
    margin-bottom: 28px;
    padding: 24px 26px;
    background: #181826;
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 3px solid #d4af37;
    border-radius: 12px;
  }
  .injaazh-report .timeline-dot {
    position: absolute;
    left: -64px;
    top: -2px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #11111c;
    border: 1.5px solid #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 700;
    color: #d4af37;
    font-size: 16px;
  }
  .injaazh-report .timeline-item ul {
    margin: 12px 0 0;
    padding-left: 18px;
  }
  .injaazh-report .timeline-item li {
    margin-bottom: 6px;
    color: #c8c8d2;
    font-size: 14.5px;
    line-height: 1.6;
  }

  /* KPI table */
  .injaazh-report .kpi-table,
  .injaazh-report table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: 18px;
    border-radius: 10px;
    overflow: hidden;
  }
  .injaazh-report thead th {
    background: linear-gradient(90deg, #d4af37, #f0d77a, #d4af37);
    color: #0a0a12;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 14px 16px;
    text-align: left;
  }
  .injaazh-report tbody td {
    padding: 14px 16px;
    font-size: 14px;
    color: #d8d8de;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    word-break: break-word;
  }
  .injaazh-report tbody tr:nth-child(even) td { background: #181826; }
  .injaazh-report tbody tr:nth-child(odd) td { background: #11111c; }
  .injaazh-report tbody td:last-child { color: #d4af37; font-weight: 700; }

  /* Sign-off */
  .injaazh-report .signoff {
    text-align: center;
    margin: 56px 0 24px;
  }
  .injaazh-report .signoff-line {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 28px;
    color: #f0d77a;
    margin: 18px 0;
  }

  /* Page setup for PDF */
  @page {
    size: A4;
    margin: 12mm 10mm;
    background: #07070b;
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
      background: #07070b;
    }
    .injaazh-report {
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    /* Headings: don't get orphaned at the very bottom of a page */
    .injaazh-report h1,
    .injaazh-report h2,
    .injaazh-report h3,
    .injaazh-report h4 {
      page-break-after: avoid;
      break-after: avoid;
    }
    /* Eyebrow, chapter cartouche & panel-header: stick with following content */
    .injaazh-report .eyebrow,
    .injaazh-report [class*="eyebrow"],
    .injaazh-report .chapter-mark,
    .injaazh-report [class*="chapter-mark"],
    .injaazh-report .panel-header,
    .injaazh-report [class*="panel-header"] {
      page-break-after: avoid;
      break-after: avoid;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Atomic editorial units: don't split mid-element */
    .injaazh-report .metric-chip,
    .injaazh-report .issue-card,
    .injaazh-report .card,
    .injaazh-report .timeline-item,
    .injaazh-report .pullquote,
    .injaazh-report blockquote,
    .injaazh-report .ornament,
    .injaazh-report .double-rule,
    .injaazh-report tr,
    .injaazh-report li,
    .injaazh-report figure,
    .injaazh-report img,
    .injaazh-report svg {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Cover should stay together if it fits */
    .injaazh-report .cover {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Repeat table headers on every printed page */
    .injaazh-report thead {
      display: table-header-group;
    }
    .injaazh-report tfoot {
      display: table-footer-group;
    }
    /* Tables: predictable, page-friendly layout */
    .injaazh-report table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .injaazh-report td,
    .injaazh-report th {
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    /* Orphans / widows */
    .injaazh-report p,
    .injaazh-report li {
      orphans: 3;
      widows: 3;
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
