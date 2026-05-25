<div align="center">

# Injaazh — AI Report Architect

### Cinematic, vision-grade audit reports. From a single screenshot.

Drop a screenshot of any SEO / technical audit. Gemini Vision reads it,
extracts the metrics, and architects an enterprise-grade glassmorphism
report — ready for one-click PDF download.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5-D4AF37?style=flat-square&logo=google)](https://ai.google.dev)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-PDF-40B5A4?style=flat-square&logo=puppeteer)](https://pptr.dev)

</div>

---

## ✨ What this is

A web-based AI report generator built for the agency **Injaazh**. The product
takes a single audit screenshot — Lighthouse, PageSpeed, Ahrefs, Semrush, GSC,
GA4, Screaming Frog, anything visual — and turns it into a polished, branded,
print-ready strategic report in seconds.

Every report is uniquely composed by the AI for the data it sees. The output
is a fully styled HTML document in cinematic dark glassmorphism that exports
to a vector PDF on click.

## 🎯 Highlights

- **Vision-grade extraction.** Gemini reads scores, Core Web Vitals, issues, opportunities, and contextual signals straight from the image.
- **Strategic, not just descriptive.** Every report includes a phased **5-month roadmap** aligned to the issues found.
- **Cinematic UI.** Deep ink black with subtle gold + cyan radials. Playfair Display × Outfit. Real glassmorphism panels.
- **Premium loader.** Multi-orbit ring system, ambient particles, phase tracker, live timer — not a spinner.
- **One-click vector PDF.** Server-side headless Chrome via Puppeteer. Selectable text, sharp at any zoom, ~300–800 KB files.
- **Resilient model strategy.** Auto-fallback across `gemini-2.5-flash → 2.5-pro → 2.0-flash` based on access, quota, and availability.
- **Isolated rendering.** AI HTML is rendered in a sandboxed iframe — zero CSS leakage, safe by default.

## 🧰 Stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) + custom design tokens |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| AI | [Gemini 2.5](https://ai.google.dev) via [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai) |
| Upload | [react-dropzone](https://react-dropzone.js.org) |
| Toasts | [react-hot-toast](https://react-hot-toast.com) |
| PDF engine | [Puppeteer](https://pptr.dev) (headless Chrome) |
| Fonts | Playfair Display × Outfit (Google Fonts, with system fallbacks) |

## 🚀 Getting started

```bash
# 1 — clone
git clone https://github.com/mamunaio/injaazh-report-tool.git
cd injaazh-report-tool

# 2 — install
npm install

# 3 — set up your key
cp .env.example .env.local
# open .env.local and paste your GEMINI_API_KEY

# 4 — run
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

> **Get a free Gemini API key** → [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## 🧠 How it works

```
┌────────────┐    image    ┌────────────────────┐    Gemini     ┌──────────┐
│  Browser   │─────────────▶│  /api/generate-    │──────────────▶│  Vision  │
│  Dropzone  │   base64     │   report           │   (vision)    │  Model   │
└────────────┘              └────────────────────┘               └──────────┘
                                      │
                                      │  full HTML document
                                      ▼
                            ┌────────────────────┐
                            │  Sandboxed iframe  │   ←  zero CSS leakage
                            │  (live preview)    │
                            └────────┬───────────┘
                                     │  user clicks "Download PDF"
                                     ▼
                            ┌────────────────────┐
                            │  /api/export-pdf   │   ←  Puppeteer
                            │  (headless Chrome) │       vector PDF
                            └────────┬───────────┘       printBackground:true
                                     │
                                     ▼
                            📄 Injaazh-Master-Report-YYYY-MM-DD.pdf
```

## 🎬 Flow

1. **Drop.** A screenshot lands in the cinematic glassmorphism dropzone.
2. **Architect.** A multi-phase loader runs while the AI extracts, analyzes, and synthesizes — five tracked phases from "Decoding visual telemetry" through "Synthesizing 5-month roadmap".
3. **Preview.** The report renders inside an isolated iframe — pixel-perfect, fully interactive, zero style conflicts with the host shell.
4. **Download.** One click → headless Chrome on the server emits a vector PDF and streams it to the browser as a direct download.

## 📐 Report sections

Every generated report contains, in order:

1. **Cover / Executive Summary** — brand line, title, date, 2–3 sentence synopsis.
2. **Key Metrics Grid** — 4–6 cards (Performance, Accessibility, Best Practices, SEO, CWV).
3. **Critical Issues** — severity-ranked, with impact and recommended fix.
4. **Opportunities & Quick Wins** — 3–5 cards.
5. **5-Month Strategic Roadmap** — Month 1 → Month 5 timeline with 2–4 milestones each.
6. **Closing / KPI Targets** — projected uplift table.
7. **Footer** — locked to *"Report Architected & Prepared by Injaazh"*.

## 🗂️ Project structure

```
injaazh-report-tool/
├── app/
│   ├── api/
│   │   ├── generate-report/route.ts   # Gemini Vision + HTML synthesis
│   │   └── export-pdf/route.ts        # Puppeteer → vector PDF
│   ├── globals.css                    # Cinematic theme + print rules
│   ├── layout.tsx                     # Fonts + Toaster
│   └── page.tsx                       # Uploader · Loader · Report shell
├── public/
│   └── favicon.svg
├── tailwind.config.ts                 # Design tokens (ink, gold, cyan)
├── next.config.ts
├── tsconfig.json
└── README.md
```

## 🎨 Design system

| Token | Value | Use |
|---|---|---|
| `ink.950` | `#070709` | Page background |
| `ink.900` | `#0b0b10` | Subtle surface |
| `gold.400` | `#d4af37` | Brand accent · primary |
| `gold.300` | `#e0c757` | Brand accent · highlight |
| `gold.100` | `#f5ecc4` | Brand accent · pale |
| `cyan.glow` | `#7ff4ff` | Secondary accent |

Glassmorphism utilities: `.glass`, `.glass-dark`. Buttons: `.btn-gold`, `.btn-ghost`. Reusable text: `.text-gradient-gold`.

## 🔧 Configuration

| Env var | Required | Purpose |
|---|:-:|---|
| `GEMINI_API_KEY` | ✓ | Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) |

The `.env.example` file is kept as a template. Your real key lives in
`.env.local`, which is gitignored.

## 🛡️ Security & robustness

- **AI HTML rendered in sandboxed iframe** (`sandbox="allow-same-origin allow-modals"`) — scripts blocked.
- **`.env.local` gitignored** — keys never enter version control.
- **Server-side sanitizer** strips accidental markdown fences from model output.
- **MIME type allowlist** (`png`, `jpeg`, `webp`) on upload.
- **10 MB upload cap** in dropzone validation.
- **Model fallback chain** with discriminated error handling — distinguishes
  missing models (404), quota exhaustion (429), and real errors.

## 🗺️ Roadmap

- [ ] Multi-screenshot batch mode (combine 2–3 screenshots into one report)
- [ ] Theme variants (Cinematic Gold · Editorial White · Midnight Blue)
- [ ] Side-by-side comparison reports (before / after audits)
- [ ] Custom branding (logo upload, agency name override)
- [ ] Deploy template for Vercel using `puppeteer-core` + `@sparticuz/chromium`

## 📜 License

Proprietary — © Injaazh. All rights reserved.

---

<div align="center">

**Report Architected & Prepared by Injaazh**

</div>
