import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Master Architect Prompt
 *
 * The model is instructed to act as an elite Technical SEO analyst, extract the
 * key metrics / scores / critical issues from the screenshot, build a 5-month
 * roadmap, and return ONLY raw HTML with inline CSS in a glassmorphism dark
 * cinematic theme. The footer must explicitly read:
 *   "Report Architected & Prepared by Injaazh".
 */
const SYSTEM_PROMPT = `
You are an ELITE Technical SEO analyst and report architect for the agency "Injaazh".

You will receive a single screenshot of an SEO / technical audit (e.g. Lighthouse, PageSpeed, Ahrefs, Semrush, Screaming Frog, GA4, Search Console, etc.).

Your job:
1. Carefully read every visible value in the screenshot (scores, metrics, issues, charts, tables, labels).
2. Extract: overall scores, Core Web Vitals (LCP, INP/FID, CLS), critical issues, warnings, opportunities, and any contextual signals (industry, URL, keywords if visible).
3. Synthesize a high-end enterprise-grade audit report.
4. Build a phased 5-MONTH STRATEGIC ROADMAP (Month 1 → Month 5) with concrete milestones aligned to the issues found.
5. If a value is not visible or unclear, infer a sensible placeholder labeled "Detected: —" rather than fabricating numbers.

OUTPUT REQUIREMENTS — READ CAREFULLY:
- Return ONLY raw HTML. No markdown, no code fences, no commentary, no \`\`\`html.
- The HTML must be a single self-contained block starting with a <style> tag and followed by the report markup.
- Use INLINE CSS inside a single <style> tag scoped via a wrapper class ".injaazh-report" so it does not leak globally.
- Visual language: GLASSMORPHISM, cinematic dark theme.
  - Background tones: deep black / ink (#070709, #0b0b10), with subtle radial gradients (gold #d4af37 hint top-left, soft cyan #7ff4ff hint bottom-right).
  - Panels: translucent bg rgba(255,255,255,0.05) or rgba(0,0,0,0.4) with backdrop-filter: blur(18px), 1px borders rgba(255,255,255,0.10), border-radius 18px, soft inner highlights and deep drop shadows.
  - IMPORTANT — backdrop-filter is unreliable in print/PDF. Always pair it with a solid-ish fallback color so the panel is visible WITHOUT blur (e.g. background: rgba(15,15,22,0.7); backdrop-filter: blur(18px);). Never rely on blur alone for legibility.
  - Brand accent: cinematic gold #d4af37 (use for headings, score rings, dividers, key numbers).
  - Typography: 'Playfair Display', serif for headings; 'Outfit', 'Inter', system-ui for body. Generous letter-spacing on eyebrow labels (uppercase, 0.25em).
  - Tasteful gold hairline dividers using linear-gradient.
  - Use real CSS for score rings (conic-gradient) or stylized score chips when visualizing scores.
  - Severity tags: Critical (red glow), High (amber), Medium (cyan), Low (white/40).

REQUIRED SECTIONS (in this order, each as a glass panel):
  1. Cover / Executive Summary — brand line "INJAAZH · MASTER AUDIT", report title, date (use {{REPORT_DATE}} placeholder you will literally output as today's date in "Month DD, YYYY" format), and a 2–3 sentence executive synopsis.
  2. Key Metrics Grid — 4 to 6 metric cards (Performance, Accessibility, Best Practices, SEO, Core Web Vitals composite, etc.) with score rings or bold gold numerals.
  3. Critical Issues — ranked table or list with severity tag, issue, impact, and recommended fix.
  4. Opportunities & Quick Wins — 3 to 5 cards.
  5. 5-Month Strategic Roadmap — visual timeline with Month 1 → Month 5, each month containing 2–4 milestones.
  6. Closing / KPI Targets — projected uplift table (e.g., +X% organic traffic, -Y ms LCP).
  7. Footer — must contain EXACTLY this line, prominently styled in gold:
        Report Architected & Prepared by Injaazh

CONSTRAINTS:
- Do NOT use external images, external fonts, external scripts, or external stylesheets.
- Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags. The output is embedded inside an existing document.
- Wrap the entire report in <div class="injaazh-report"> ... </div>.
- Set a sensible content width on .injaazh-report (max-width around 1080–1100px, margin: 0 auto).
- Keep the markup print-friendly: avoid position:fixed / position:sticky, avoid 100vh / 100vw on critical layout, avoid CSS that requires JavaScript.
- Every panel must remain readable WITHOUT backdrop-filter (always include a solid-ish fallback background color).
- Aim for ~900–1500 lines of polished, production-quality HTML+CSS. Be visually rich.
`.trim();

interface GenerateBody {
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
    const { image, mimeType } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing image payload." },
        { status: 400 }
      );
    }

    const safeMime = (mimeType ?? "image/png").toLowerCase();
    const allowedMime = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedMime.includes(safeMime)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${safeMime}` },
        { status: 415 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Models are tried in order. The first one accessible to the caller's key
    // wins. Order is: free-tier-friendly Flash first, then Pro for users on a
    // paid plan, then a stable older Flash as a last resort.
    //   • gemini-2.5-flash   → Free tier ✓, vision ✓, fast (~3–8s)
    //   • gemini-2.5-pro     → Paid only as of late 2025 (free quota = 0)
    //   • gemini-2.0-flash   → Free tier ✓, vision ✓ (legacy fallback)
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

    const inlineImage = {
      inlineData: {
        mimeType: safeMime === "image/jpg" ? "image/jpeg" : safeMime,
        data: image,
      },
    };

    let raw = "";
    let usedModel = "";
    let lastError: unknown = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        // Type-loose model config so we can pass `thinkingConfig` (newer
        // SDK feature) without the older types fighting us.
        const modelConfig: Record<string, unknown> = {
          model: modelName,
          generationConfig: {
            temperature: 0.55,
            topP: 0.95,
            // Generous budget: 2.5-flash supports up to 65k output tokens.
            // A rich glassmorphism HTML report easily blows past 8k.
            maxOutputTokens: 32768,
            responseMimeType: "text/plain",
            // Disable internal "thinking" tokens on 2.5 models so the entire
            // budget goes to actual HTML output instead of hidden reasoning.
            thinkingConfig: { thinkingBudget: 0 },
          },
        };

        const model = genAI.getGenerativeModel(
          modelConfig as unknown as Parameters<
            typeof genAI.getGenerativeModel
          >[0]
        );

        const result = await model.generateContent([
          { text: prompt },
          inlineImage,
        ]);

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
        // Fall through to the next candidate on:
        //   • model not found / not supported (404)
        //   • free-tier quota exhausted on this specific model (429 with limit 0)
        // Auth or true payload errors still bubble up immediately so we don't
        // mask real problems behind silent retries.
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
            "The model returned an empty or invalid report. Please try again with a clearer screenshot.",
        },
        { status: 502 }
      );
    }

    // Wrap the AI fragment in a full, self-contained HTML document so it
    // renders identically inside an isolated iframe AND prints perfectly to
    // PDF. This is the actual "PDF source" the browser will print.
    const document = buildDocument(html);

    return NextResponse.json({ html: document, fragment: html, model: usedModel });
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
 * The result is what the browser renders inside the iframe AND what gets
 * printed to PDF, so it must:
 *   • carry a cinematic dark base background on screen
 *   • flatten heavy effects in print (no backdrop-filter, no thick shadows)
 *     because those are rasterized → bloated, slow PDFs
 *   • embed Playfair Display + Outfit with safe system fallbacks
 *   • force backgrounds-on for print across browsers
 *   • declare A4 + margins and protect sections from being cut mid-card
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
  :root {
    --bg: #070709;
    --bg-soft: #0b0b10;
    --panel: rgba(15,15,22,0.72);     /* glass with solid floor */
    --panel-solid: #0e0e15;            /* used in print mode */
    --gold: #d4af37;
    --gold-soft: #e0c757;
    --gold-pale: #f5ecc4;
    --cyan: #7ff4ff;
    --hairline: rgba(255,255,255,0.10);
    --text: #ececf2;
    --muted: rgba(236,236,242,0.65);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--text);
    font-family: 'Outfit', 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.55;
  }
  body {
    background-color: #070709;
    background-image:
      radial-gradient(900px 500px at 15% -10%, rgba(212,175,55,0.10), transparent 60%),
      radial-gradient(700px 400px at 100% 100%, rgba(127,244,255,0.05), transparent 60%);
    background-attachment: fixed;
    min-height: 100vh;
    padding: 24px;
  }

  /* ---------- AI-generated content base ---------- */
  .injaazh-report {
    max-width: 1040px;
    margin: 0 auto;
    color: var(--text);
  }
  .injaazh-report h1, .injaazh-report h2, .injaazh-report h3, .injaazh-report h4 {
    font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
    color: #fff;
    letter-spacing: -0.01em;
    margin: 0 0 0.4em;
  }
  .injaazh-report a { color: var(--gold); text-decoration: none; }
  .injaazh-report code, .injaazh-report pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 2px 6px;
  }

  /* =====================================================
     PRINT — flatten effects so the PDF is small + fast
     ===================================================== */
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    @page {
      size: A4;
      margin: 12mm 10mm;
      background: #070709;
    }
    html, body {
      background: #070709 !important;
      color: #ececf2 !important;
    }
    body {
      padding: 0 !important;
      background-image: none !important; /* no radial gradients in print */
    }
    .injaazh-report {
      max-width: 100% !important;
      margin: 0 !important;
    }

    /* Kill the expensive blurs that rasterize huge bitmaps into the PDF */
    .injaazh-report *,
    .injaazh-report *::before,
    .injaazh-report *::after {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      text-shadow: none !important;
      /* Reduce shadows — flatten to a thin border instead */
      box-shadow: 0 0 0 1px rgba(255,255,255,0.08) !important;
    }

    /* Replace any translucent / blur panels with a clean solid dark surface */
    .injaazh-report [class*="panel"],
    .injaazh-report [class*="card"],
    .injaazh-report [class*="glass"],
    .injaazh-report [class*="section"],
    .injaazh-report section,
    .injaazh-report article,
    .injaazh-report [data-section] {
      background: #0e0e15 !important;
      border: 1px solid rgba(255,255,255,0.10) !important;
    }

    /* Page-break protection — never cut a card / table / row in half */
    .injaazh-report section,
    .injaazh-report article,
    .injaazh-report [data-section],
    .injaazh-report [class*="card"],
    .injaazh-report [class*="panel"],
    .injaazh-report table,
    .injaazh-report tr,
    .injaazh-report li,
    .injaazh-report figure,
    .injaazh-report .roadmap-item,
    .injaazh-report .metric,
    .injaazh-report .kpi {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Major sections each start on a new page (kept tasteful, not aggressive) */
    .injaazh-report [data-section="metrics"],
    .injaazh-report [data-section="issues"],
    .injaazh-report [data-section="opportunities"],
    .injaazh-report [data-section="roadmap"],
    .injaazh-report [data-section="kpi"] {
      page-break-before: always;
      break-before: page;
    }
    .injaazh-report [data-section="cover"],
    .injaazh-report [data-section="footer"] {
      page-break-before: avoid;
      break-before: avoid;
    }

    /* Headings shouldn't be left dangling at page bottom */
    .injaazh-report h1, .injaazh-report h2, .injaazh-report h3 {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Images / charts: keep them inside their card */
    .injaazh-report img, .injaazh-report svg, .injaazh-report canvas {
      max-width: 100% !important;
      height: auto !important;
    }
  }
</style>
</head>
<body>
${fragment}
</body>
</html>`;
}
