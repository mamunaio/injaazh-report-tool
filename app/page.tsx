"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

type Stage = "idle" | "preview" | "analyzing" | "report" | "error";

/**
 * Five sequential analysis phases. Each phase has its own headline,
 * sublabel and the loader uses these to drive the timeline tracker.
 */
const ANALYSIS_PHASES = [
  {
    title: "Decoding visual telemetry",
    sub: "Vision pipeline · OCR · pixel-grade extraction",
  },
  {
    title: "Mapping crawl + indexation graph",
    sub: "Cross-referencing detected URLs and signals",
  },
  {
    title: "Analyzing architectural bottlenecks",
    sub: "Render path · render-blocking · server timing",
  },
  {
    title: "Quantifying Core Web Vitals impact",
    sub: "LCP · INP · CLS — projected uplift modeling",
  },
  {
    title: "Synthesizing 5-month strategic roadmap",
    sub: "Engraving glassmorphism layers · finalizing report",
  },
] as const;

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportHtml, setReportHtml] = useState<string>("");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const phraseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reportFrameRef = useRef<HTMLIFrameElement | null>(null);

  const onDrop = useCallback((accepted: File[], rejections: unknown[]) => {
    if (rejections && (rejections as { errors: { code: string }[] }[]).length) {
      toast.error("Please upload a valid image (PNG, JPG, or WebP, ≤ 10MB).");
      return;
    }
    const f = accepted[0];
    if (!f) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setStage("preview");
    toast.success("Screenshot loaded. Ready to architect your report.");
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setReportHtml("");
    setStage("idle");
  };

  const startPhraseRotation = () => {
    setPhaseIndex(0);
    phraseTimerRef.current = setInterval(() => {
      setPhaseIndex((i) => (i + 1) % ANALYSIS_PHASES.length);
    }, 3200);
  };

  const stopPhraseRotation = () => {
    if (phraseTimerRef.current) {
      clearInterval(phraseTimerRef.current);
      phraseTimerRef.current = null;
    }
  };

  const fileToBase64 = (f: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, data] = result.split(",");
        const mimeMatch = meta.match(/data:(.*);base64/);
        resolve({
          base64: data,
          mimeType: mimeMatch?.[1] ?? f.type ?? "image/png",
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const generate = async () => {
    if (!file) return;
    setStage("analyzing");
    startPhraseRotation();

    try {
      const { base64, mimeType } = await fileToBase64(file);

      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Generation failed.");
      }

      setReportHtml(data.html as string);
      setStage("report");
      toast.success("Master report architected.");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unexpected error.";
      toast.error(msg);
      setStage("preview");
    } finally {
      stopPhraseRotation();
    }
  };

  /**
   * One-click PDF download via headless Chrome on the server.
   * Produces a vector PDF — small, sharp, fast to open, instantly scrollable.
   */
  const handleDownloadPdf = async () => {
    if (!reportHtml || downloading) return;
    setDownloading(true);
    const toastId = toast.loading("Architecting PDF…");

    try {
      const stamp = new Date()
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const fileName = `Injaazh-Master-Report-${stamp}`;

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: reportHtml, fileName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Export failed (HTTP ${res.status}).`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Give Chrome a tick to start the download before we revoke
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      toast.success("PDF ready. Check your downloads.", { id: toastId });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to export PDF.";
      toast.error(msg, { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const dropzoneClasses = useMemo(
    () =>
      [
        "uploader-shell glass relative overflow-hidden",
        "p-10 md:p-14 transition-all duration-300",
        "border-dashed",
        isDragActive
          ? "border-gold-400/70 bg-gold-400/5 shadow-glow"
          : "border-white/10 hover:border-gold-400/40",
      ].join(" "),
    [isDragActive]
  );

  return (
    <main className="relative min-h-screen flex flex-col">
      <Header />

      <section className="flex-1 px-6 md:px-10 pb-24">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {/* ============ UPLOADER / PREVIEW ============ */}
            {stage !== "report" && (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="pt-10 md:pt-16"
              >
                <Hero />

                <div className="mt-10 md:mt-14">
                  {stage === "idle" && (
                    <div {...getRootProps({ className: dropzoneClasses })}>
                      <input {...getInputProps()} />
                      <DropzoneVisual onClick={open} isDragActive={isDragActive} />
                    </div>
                  )}

                  {(stage === "preview" || stage === "analyzing") && previewUrl && (
                    <PreviewPanel
                      previewUrl={previewUrl}
                      fileName={file?.name ?? "screenshot"}
                      analyzing={stage === "analyzing"}
                      onReset={reset}
                      onGenerate={generate}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* ============ REPORT VIEW ============ */}
            {stage === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="pt-8"
              >
                <ReportToolbar
                  onReset={reset}
                  onDownload={handleDownloadPdf}
                  downloading={downloading}
                />
                <ReportShell html={reportHtml} frameRef={reportFrameRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ============ ANALYZING OVERLAY ============ */}
      <AnimatePresence>
        {stage === "analyzing" && (
          <AnalyzingOverlay phaseIndex={phaseIndex} />
        )}
      </AnimatePresence>

      {/* ============ FLOATING DOWNLOAD ACTION ============ */}
      <AnimatePresence>
        {stage === "report" && (
          <motion.button
            key="download-fab"
            onClick={handleDownloadPdf}
            disabled={downloading}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="floating-actions no-print fixed bottom-7 right-7 z-40 btn-gold !pl-5 !pr-6 disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Download PDF"
          >
            {downloading ? (
              <>
                <Spinner />
                <span>Architecting PDF…</span>
              </>
            ) : (
              <>
                <DownloadIcon />
                <span>Download PDF</span>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
function Header() {
  return (
    <header className="app-header no-print sticky top-0 z-30">
      <div className="backdrop-blur-xl bg-ink-950/60 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="leading-tight">
              <p className="font-display text-lg md:text-xl tracking-wide">
                <span className="text-gradient-gold">Injaazh</span>
              </p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Report Architect · AI
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-white/55">
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-gold-pulse" />
              Gemini Vision · Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative w-9 h-9 rounded-xl border border-gold-400/40 bg-gradient-to-br from-gold-400/30 to-transparent flex items-center justify-center shadow-gold">
      <span className="font-display text-gold-300 text-lg leading-none">I</span>
      <span className="absolute -inset-px rounded-xl ring-1 ring-white/10 pointer-events-none" />
    </div>
  );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="text-[11px] md:text-xs uppercase tracking-[0.4em] text-gold-300/80"
      >
        AI · Vision · Architecture
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.7 }}
        className="font-display text-4xl md:text-6xl leading-[1.05] mt-4"
      >
        <span className="text-white/95">Architect a </span>
        <span className="text-gradient-gold">Master Report</span>
        <span className="text-white/95"> from a single screenshot.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.7 }}
        className="mt-6 text-white/65 text-base md:text-lg max-w-2xl mx-auto"
      >
        Drop an SEO or technical audit screenshot. Our cinematic AI engine extracts
        metrics, exposes critical issues, and engineers a 5-month strategic roadmap
        in glassmorphism style.
      </motion.p>
    </div>
  );
}

/* ============================================================
   DROPZONE VISUAL
   ============================================================ */
function DropzoneVisual({
  onClick,
  isDragActive,
}: {
  onClick: () => void;
  isDragActive: boolean;
}) {
  return (
    <div className="relative">
      {/* Ambient gold halo */}
      <div className="pointer-events-none absolute -inset-12 bg-radial-gold opacity-60" />
      <div className="pointer-events-none absolute -inset-12 bg-radial-cyan opacity-40" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          animate={{
            scale: isDragActive ? 1.06 : 1,
            rotate: isDragActive ? -2 : 0,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-7"
        >
          <div className="w-20 h-20 rounded-2xl border border-gold-400/40 bg-gradient-to-br from-gold-400/20 via-white/5 to-transparent flex items-center justify-center shadow-glass">
            <UploadIcon />
          </div>
          <div className="absolute -inset-2 rounded-2xl border border-gold-400/15 animate-gold-pulse" />
        </motion.div>

        <h3 className="font-display text-2xl md:text-3xl">
          {isDragActive ? (
            <span className="text-gradient-gold">Release to ingest</span>
          ) : (
            <>
              Drop your audit screenshot{" "}
              <span className="text-gradient-gold">or browse</span>
            </>
          )}
        </h3>
        <p className="mt-3 text-white/55 max-w-md">
          PNG · JPG · WebP — up to 10MB. The cleaner the screenshot, the more
          surgical the report.
        </p>

        <button
          type="button"
          onClick={onClick}
          className="btn-gold mt-8 group"
          aria-label="Browse files"
        >
          <FolderIcon />
          <span>Browse Files</span>
        </button>

        <p className="mt-5 text-[11px] uppercase tracking-[0.3em] text-white/35">
          Powered by Gemini Vision
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   PREVIEW PANEL
   ============================================================ */
function PreviewPanel({
  previewUrl,
  fileName,
  analyzing,
  onReset,
  onGenerate,
}: {
  previewUrl: string;
  fileName: string;
  analyzing: boolean;
  onReset: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="grid md:grid-cols-[1.2fr_1fr] gap-6">
      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gold-400/15 border border-gold-400/30 flex items-center justify-center">
              <ImageIcon />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white/85 truncate max-w-[260px]">
                {fileName}
              </p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                Source · Awaiting analysis
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-white/55 hover:text-white transition-colors"
          >
            Replace
          </button>
        </div>
        <div className="relative bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Audit screenshot preview"
            className="w-full max-h-[520px] object-contain"
          />
          {/* Subtle scan-line overlay while analyzing */}
          <AnimatePresence>
            {analyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-400/[0.04] to-transparent" />
                <motion.div
                  initial={{ y: "-10%" }}
                  animate={{ y: "110%" }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-300 to-transparent shadow-[0_0_24px_rgba(212,175,55,0.6)]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="glass p-7 flex flex-col">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-300/80">
          Step 02
        </p>
        <h3 className="font-display text-2xl md:text-3xl mt-3 leading-tight">
          Architect the <span className="text-gradient-gold">Master Report</span>
        </h3>
        <p className="mt-3 text-sm text-white/60">
          Our AI will extract scores, surface critical issues, and engineer a
          5-month strategic roadmap. The output is delivered as a fully styled,
          glassmorphism HTML report — ready for PDF.
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          <Bullet>Vision-grade metric extraction</Bullet>
          <Bullet>Severity-ranked critical issues</Bullet>
          <Bullet>Phased 5-month roadmap</Bullet>
          <Bullet>Print-ready cinematic styling</Bullet>
        </ul>

        <div className="mt-auto pt-7 flex flex-wrap items-center gap-3">
          <button
            onClick={onGenerate}
            disabled={analyzing}
            className="btn-gold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Spinner />
                <span>Architecting…</span>
              </>
            ) : (
              <>
                <SparkIcon />
                <span>Generate Master Report</span>
              </>
            )}
          </button>
          <button onClick={onReset} className="btn-ghost" disabled={analyzing}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_10px_rgba(212,175,55,0.7)]" />
      <span className="text-white/75">{children}</span>
    </li>
  );
}

/* ============================================================
   ANALYZING OVERLAY — Cinematic, multi-layered, premium
   ============================================================ */
function AnalyzingOverlay({ phaseIndex }: { phaseIndex: number }) {
  const phase = ANALYSIS_PHASES[phaseIndex];
  const total = ANALYSIS_PHASES.length;

  // Pre-computed positions for floating ambient particles
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.4,
        delay: Math.random() * 4,
        duration: 6 + Math.random() * 6,
      })),
    []
  );

  // Orbiting dots around the core
  const orbiters = useMemo(
    () =>
      [
        { r: 88, dur: 9, color: "#d4af37", size: 5, offset: 0 },
        { r: 88, dur: 9, color: "#d4af37", size: 3, offset: 180 },
        { r: 118, dur: 14, color: "#7ff4ff", size: 3, offset: 60 },
        { r: 118, dur: 14, color: "#7ff4ff", size: 2, offset: 240 },
        { r: 148, dur: 22, color: "#f5ecc4", size: 2, offset: 30 },
      ] as const,
    []
  );

  // Live elapsed timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* ---------- Backdrop layers ---------- */}
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-radial-gold opacity-70" />
      <div className="absolute inset-0 bg-radial-cyan opacity-50" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />

      {/* ---------- Floating ambient particles ---------- */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 0.9, 0], y: [12, -24, -48] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 12px rgba(212,175,55,0.85)",
          }}
          className="absolute rounded-full bg-gold-300"
        />
      ))}

      {/* ---------- Center stage ---------- */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[min(92vw,560px)]"
      >
        {/* Glass panel */}
        <div className="relative glass-dark px-8 py-12 md:px-12 md:py-14 overflow-hidden">
          {/* Corner accents */}
          <CornerAccent className="top-3 left-3" />
          <CornerAccent className="top-3 right-3 rotate-90" />
          <CornerAccent className="bottom-3 left-3 -rotate-90" />
          <CornerAccent className="bottom-3 right-3 rotate-180" />

          {/* Animated top hairline */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: "linear",
              }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold-300 to-transparent"
            />
          </div>

          {/* ---------- Eyebrow + timer ---------- */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-gold-400 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-gold-400" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-gold-300/85">
                Architecting · Live
              </span>
            </div>
            <span className="font-mono text-[11px] tracking-[0.2em] text-white/55 tabular-nums">
              {mm}:{ss}
            </span>
          </div>

          {/* ---------- Orbital core ---------- */}
          <div className="relative mx-auto w-[320px] h-[320px] flex items-center justify-center">
            {/* Outer slow ring with gradient stroke */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <RingSvg color="rgba(212,175,55,0.55)" dash="6 12" />
            </motion.div>

            {/* Mid counter-rotating ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-7"
            >
              <RingSvg color="rgba(127,244,255,0.45)" dash="2 10" />
            </motion.div>

            {/* Inner fast arc */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-14"
            >
              <ArcSvg color="rgba(245,236,196,0.95)" />
            </motion.div>

            {/* Orbiters */}
            {orbiters.map((o, i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{
                  duration: o.dur,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.05,
                }}
                style={{
                  width: o.r * 2,
                  height: o.r * 2,
                  transform: `rotate(${o.offset}deg)`,
                }}
                className="absolute"
              >
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: o.size,
                    height: o.size,
                    background: o.color,
                    boxShadow: `0 0 14px ${o.color}, 0 0 28px ${o.color}80`,
                  }}
                />
              </motion.div>
            ))}

            {/* Core glow disc */}
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                opacity: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, rgba(245,236,196,0.95), rgba(212,175,55,0.55) 45%, rgba(143,114,31,0.15) 70%, transparent 80%)",
                boxShadow:
                  "0 0 0 1px rgba(212,175,55,0.45), 0 0 40px rgba(212,175,55,0.55), inset 0 0 20px rgba(255,255,255,0.25)",
              }}
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="font-display text-3xl text-ink-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]"
              >
                I
              </motion.span>
            </motion.div>
          </div>

          {/* ---------- Phase headline ---------- */}
          <div className="mt-10 text-center min-h-[88px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseIndex}
                initial={{ y: 14, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -14, opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="font-display text-2xl md:text-3xl text-white/95 leading-tight">
                  {phase.title}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                    className="inline-block ml-1 text-gradient-gold"
                  >
                    …
                  </motion.span>
                </h3>
                <p className="mt-2 text-xs md:text-sm text-white/55 tracking-wide">
                  {phase.sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ---------- Phase tracker (5 dots) ---------- */}
          <div className="mt-7 flex items-center justify-center gap-2">
            {ANALYSIS_PHASES.map((_, i) => {
              const state =
                i < phaseIndex
                  ? "done"
                  : i === phaseIndex
                  ? "active"
                  : "idle";
              return (
                <span
                  key={i}
                  className={[
                    "block h-1.5 rounded-full transition-all duration-500",
                    state === "active"
                      ? "w-10 bg-gold-300 shadow-[0_0_12px_rgba(212,175,55,0.85)]"
                      : state === "done"
                      ? "w-5 bg-gold-500/80"
                      : "w-5 bg-white/15",
                  ].join(" ")}
                />
              );
            })}
          </div>

          {/* ---------- Progress bar ---------- */}
          <div className="mt-6">
            <div className="relative h-[3px] w-full rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    98,
                    ((phaseIndex + 1) / total) * 100
                  )}%`,
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500"
                style={{
                  boxShadow: "0 0 14px rgba(212,175,55,0.7)",
                }}
              />
              {/* Shimmer overlay */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-overlay"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
              <span className="text-white/40">
                Phase {phaseIndex + 1}
                <span className="text-white/25"> / {total}</span>
              </span>
              <span className="text-gold-300/80">Gemini Vision</span>
            </div>
          </div>
        </div>

        {/* Soft outer halo */}
        <div className="pointer-events-none absolute -inset-10 rounded-[40px] bg-gold-400/[0.04] blur-3xl" />
      </motion.div>
    </motion.div>
  );
}

/* ---------- Loader sub-components ---------- */

function CornerAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={`absolute text-gold-400/70 ${className}`}
    >
      <path
        d="M1 8V1H8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RingSvg({ color, dash }: { color: string; dash: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        strokeDasharray={dash}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArcSvg({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="arcGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="80 220"
      />
    </svg>
  );
}

/* ============================================================
   REPORT TOOLBAR
   ============================================================ */
function ReportToolbar({
  onReset,
  onDownload,
  downloading,
}: {
  onReset: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-300/80">
          Master Report
        </p>
        <h2 className="font-display text-2xl md:text-3xl mt-1">
          <span className="text-gradient-gold">Architected by Injaazh</span>
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onReset} className="btn-ghost" disabled={downloading}>
          <RefreshIcon />
          <span>New Report</span>
        </button>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="btn-gold disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <Spinner />
              <span>Architecting PDF…</span>
            </>
          ) : (
            <>
              <DownloadIcon />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   REPORT SHELL — renders Gemini-returned HTML
   ============================================================ */
/* ============================================================
   REPORT SHELL — renders the AI document in an isolated iframe
   ============================================================
   Why an iframe?
     • Total CSS isolation — AI styles can never break our app shell.
     • Full document control — we print *only* the report when the user
       hits "Save as PDF" (no Injaazh chrome leaking into the export).
     • Safer than dangerouslySetInnerHTML — sandbox flags can lock down
       behavior even though the source is our trusted server.
*/
function ReportShell({
  html,
  frameRef,
}: {
  html: string;
  frameRef: React.RefObject<HTMLIFrameElement | null>;
}) {
  const [height, setHeight] = useState<number>(900);

  // Auto-resize the iframe to its content so the host page scrolls naturally.
  const handleLoad = () => {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      // Use the larger of html / body scrollHeight to be safe.
      const next = Math.max(
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
        600
      );
      setHeight(next + 24);
    } catch (e) {
      // same-origin srcDoc shouldn't throw, but be defensive
      console.warn("Could not measure report iframe:", e);
    }
  };

  return (
    <div className="report-shell glass-dark overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between no-print">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="w-2 h-2 rounded-full bg-red-400/70" />
          <span className="w-2 h-2 rounded-full bg-yellow-400/70" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
          <span className="ml-3 uppercase tracking-[0.22em] text-[10px]">
            injaazh / report.html
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-300/80">
          Cinematic Edition
        </span>
      </div>
      <div className="report-content">
        <iframe
          ref={frameRef}
          title="Injaazh Master Report"
          srcDoc={html}
          onLoad={handleLoad}
          // allow-same-origin lets us measure scrollHeight + call print();
          // scripts are NOT allowed, so the AI markup stays inert.
          sandbox="allow-same-origin allow-modals"
          style={{
            width: "100%",
            height: `${height}px`,
            border: "0",
            background: "#070709",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  return (
    <footer className="no-print border-t border-white/5 mt-auto">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
        <p>
          © {new Date().getFullYear()} Injaazh · Report Architected & Prepared by Injaazh
        </p>
        <p className="uppercase tracking-[0.3em]">v1.0 · Cinematic Edition</p>
      </div>
    </footer>
  );
}

/* ============================================================
   ICONS (inline SVG — zero dependencies)
   ============================================================ */
function UploadIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className="text-gold-300"
    >
      <path d="M12 16V4" strokeLinecap="round" />
      <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.4L19 9.2l-5.2 1.8L12 16l-1.8-5L5 9.2l5.2-1.8L12 2z" />
      <path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" opacity="0.7" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 4v12" strokeLinecap="round" />
      <path d="M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" strokeLinecap="round" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" strokeLinecap="round" />
      <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" strokeLinecap="round" />
      <path d="M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-gold-300">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" strokeLinejoin="round" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
