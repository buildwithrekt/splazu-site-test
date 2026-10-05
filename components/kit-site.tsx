// Synced from the splazu platform renderer. Edit freely: this file is yours now.
import type { CSSProperties } from "react";
import { brand } from "@/lib/brand";
import { ponsTokenUrl } from "@/lib/pons";
import type { Kit } from "@/lib/types";
import { svgDataUrl } from "@/lib/svg";
import type { TokenStats } from "@/lib/token-stats";
import { TokenWidget } from "./token-widget";

/**
 * Customer landing page, rendered entirely from a Kit. Server-renderable, and also safe
 * to import from client components (no server-only imports) so pickers can preview it.
 */
export type KitSiteProps = {
  kit: Kit;
  links: { twitter?: string | null; telegram?: string | null };
  token?: { address: string; curve: string | null } | null;
  /** Shows a thin "Preview · not launched yet" bar above the nav. */
  preview?: boolean;
  stats?: TokenStats | null;
  /** Renders with no motion at all (thumbnails). */
  still?: boolean;
};

/** Weights each font actually ships on Google Fonts (requesting a missing one fails the whole request). */
const WEIGHTS: Record<string, string | null> = { "Instrument Serif": null };

export function googleFontsHref(fonts: Kit["fonts"]) {
  const families = [...new Set([fonts.display, fonts.body])].map((f) => {
    const w = f in WEIGHTS ? WEIGHTS[f] : "400;600;700";
    return `family=${f.replace(/ /g, "+")}${w ? `:wght@${w}` : ""}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

const MONO = new Set(["JetBrains Mono", "IBM Plex Mono"]);
const SERIF = new Set(["Fraunces", "Instrument Serif"]);
const stack = (f: string) => `"${f}", ${MONO.has(f) ? "ui-monospace, monospace" : SERIF.has(f) ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif"}`;

/** Same output as svgDataUrl, but also works in the browser (no Buffer). */
function logoSrc(svg: string) {
  if (typeof Buffer !== "undefined") return svgDataUrl(svg);
  let bin = "";
  for (const b of new TextEncoder().encode(svg)) bin += String.fromCharCode(b);
  return `data:image/svg+xml;base64,${btoa(bin)}`;
}

/** Only http(s) links; accepts bare handles. */
function social(kind: "x" | "telegram", v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
    } catch {
      return null;
    }
  }
  const h = s.replace(/^@/, "").replace(/[^A-Za-z0-9_+-]/g, "");
  if (!h) return null;
  return kind === "x" ? `https://x.com/${h}` : `https://t.me/${h}`;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.94 4.3 18.7 19.6c-.24 1.08-.88 1.35-1.79.84l-4.94-3.64-2.38 2.3c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.62-.2L6.17 13.2l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57l19-7.32c.88-.33 1.65.2 1.41 1.51z" />
    </svg>
  );
}
const Arrow = () => (
  <svg aria-hidden className="ks-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * Motion for customer sites. CSS only (no client JS on customer domains), scoped to `.ks`.
 * - Load: hero entrance keyframes, masked word rise on the headline.
 * - Scroll: `animation-timeline: view()/scroll()` inside @supports, so browsers without it
 *   simply show static content (nothing is hidden outside the @supports blocks).
 * - Everything that moves on its own lives in `prefers-reduced-motion: no-preference`.
 * - `[data-still]` (thumbnails) switches every animation and transition off.
 * Elements that reveal on scroll never carry hover transforms themselves (an animation with
 * fill would override them); hover lives on an inner element.
 */
const SITE_CSS = `
.ks{--ks-out:cubic-bezier(.16,1,.3,1);--ks-quart:cubic-bezier(.25,1,.5,1);interpolate-size:allow-keywords}
.ks-grain{position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.ks-blob{position:absolute;border-radius:9999px;pointer-events:none;will-change:transform}
.ks-header::before{content:"";position:absolute;inset:0;z-index:-1;background:color-mix(in oklab,var(--bg) 80%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);border-bottom:1px solid var(--line)}
.ks-progress{display:none;position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--accent);transform-origin:0 50%}
.ks-word{display:inline-block;max-width:100%;overflow:hidden;vertical-align:top;padding:0 .04em .12em;margin:0 -.04em -.12em}
.ks-word>span{display:inline-block}
.ks-btn{position:relative;overflow:hidden;isolation:isolate;transition:transform .55s var(--ks-out),box-shadow .55s var(--ks-out),background-color .35s,border-color .35s}
.ks-btn::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 30%,color-mix(in oklab,var(--sheen,#fff) 30%,transparent) 50%,transparent 70%);transform:translateX(-120%);transition:transform 1s var(--ks-out)}
.ks-btn:hover{transform:translateY(-2px)}
.ks-btn:hover::after{transform:translateX(120%)}
.ks-btn:active{transform:translateY(0) scale(.98);transition-duration:.12s}
.ks-arrow{transition:transform .55s var(--ks-out)}
.ks-btn:hover .ks-arrow{transform:translateX(4px)}
.ks-btn:hover .ks-arrow-ne{transform:translate(2px,-2px)}
.ks-link{position:relative;transition:color .35s}
.ks-link::after{content:"";position:absolute;left:0;right:0;bottom:-5px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .55s var(--ks-out)}
.ks-link:hover::after{transform:scaleX(1);transform-origin:0 50%}
.ks-card{position:relative;isolation:isolate;height:100%;transition:transform .7s var(--ks-out),border-color .45s,box-shadow .7s var(--ks-out)}
.ks-card::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:radial-gradient(120% 90% at 0% 0%,var(--glow),transparent 60%);opacity:0;transition:opacity .7s var(--ks-out)}
.ks-card:hover{transform:translateY(-5px);border-color:var(--line-strong);box-shadow:0 30px 60px -40px var(--glow)}
.ks-card:hover::before{opacity:1}
.ks-chip{transition:background-color .45s,color .45s,transform .7s var(--ks-out)}
.ks-card:hover .ks-chip{background:var(--accent);color:var(--accent-text);transform:rotate(-8deg) scale(1.08)}
.ks-stat{transition:border-color .45s,transform .6s var(--ks-out)}
.ks-stat:hover{border-color:var(--line-strong);transform:translateY(-2px)}
.ks-faq .ks-plus{transition:transform .7s var(--ks-out),background-color .45s,color .45s,border-color .45s}
.ks-faq summary:hover .ks-plus{border-color:var(--text)}
.ks-faq[open] .ks-plus{transform:rotate(135deg);background:var(--accent);color:var(--accent-text);border-color:transparent}
.ks-faq .ks-q{transition:transform .6s var(--ks-out),color .35s}
.ks-faq summary:hover .ks-q{transform:translateX(6px)}
.ks-faq[open] .ks-q{color:var(--accent-ink)}
@supports selector(::details-content){
.ks-faq::details-content{block-size:0;overflow:clip;transition:block-size .8s var(--ks-out),content-visibility .8s allow-discrete}
.ks-faq[open]::details-content{block-size:auto}
}
.ks-marquee{-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.ks-wordmark{background:linear-gradient(180deg,color-mix(in oklab,var(--text) 80%,transparent) 0%,color-mix(in oklab,var(--text) 0%,transparent) 88%);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes ks-rise{from{opacity:0;transform:translate3d(0,36px,0)}}
@keyframes ks-pop{from{opacity:0;transform:translate3d(0,28px,0) scale(.92)}}
@keyframes ks-word{from{transform:translate3d(0,108%,0)}}
@keyframes ks-fade{from{opacity:0}}
@keyframes ks-float{from{transform:translate3d(0,7px,0)}to{transform:translate3d(0,-9px,0)}}
@keyframes ks-spin{to{transform:rotate(1turn)}}
@keyframes ks-drift-a{to{transform:translate3d(-12%,10%,0) scale(1.18)}}
@keyframes ks-drift-b{to{transform:translate3d(14%,-10%,0) scale(.88)}}
@keyframes ks-marquee{to{transform:translate3d(-50%,0,0)}}
@keyframes ks-draw{from{transform:scaleX(0)}}
@keyframes ks-big{from{opacity:0;transform:translate3d(0,45%,0)}}
@keyframes ks-exit{to{opacity:.2;transform:translate3d(0,-70px,0)}}
@keyframes ks-band{from{opacity:.4;transform:scale(.92)}}
@keyframes ks-ping{0%{transform:scale(1);opacity:.7}70%,100%{transform:scale(2.8);opacity:0}}
@media (prefers-reduced-motion:no-preference){
.ks-in{animation:ks-rise 1.1s var(--ks-out) both;animation-delay:calc(var(--d,0) * 1s)}
.ks-pop{animation:ks-pop 1.4s var(--ks-out) both;animation-delay:calc(var(--d,0) * 1s)}
.ks-word>span{animation:ks-word 1.2s var(--ks-out) both;animation-delay:calc(.15s + var(--i,0) * .065s)}
.ks-float{animation:ks-float 6s ease-in-out infinite alternate}
.ks-spin{animation:ks-spin 48s linear infinite}
.ks-spin-rev{animation:ks-spin 80s linear infinite reverse}
.ks-blob-a{animation:ks-drift-a 18s ease-in-out infinite alternate}
.ks-blob-b{animation:ks-drift-b 23s ease-in-out infinite alternate}
.ks-marquee-track{animation:ks-marquee 45s linear infinite}
.ks-marquee:hover .ks-marquee-track{animation-play-state:paused}
.ks-ping{animation:ks-ping 2.4s var(--ks-out) infinite}
.ks-faq[open] .ks-answer{animation:ks-rise .9s var(--ks-out) both}
@supports (animation-timeline:view()){
.ks-reveal{animation:ks-rise linear both;animation-timeline:view();animation-range:entry calc(var(--i,0) * 6%) entry calc(50% + var(--i,0) * 6%)}
.ks-draw{transform-origin:0 50%;animation:ks-draw linear both;animation-timeline:view();animation-range:entry 30% cover 45%}
.ks-big{animation:ks-big linear both;animation-timeline:view();animation-range:entry 0% cover 40%}
.ks-band{animation:ks-band linear both;animation-timeline:view();animation-range:entry 0% cover 35%}
.ks-hero-exit{animation:ks-exit linear both;animation-timeline:view();animation-range:exit 10% exit 100%}
}
@supports (animation-timeline:scroll()){
.ks-header::before{animation:ks-fade linear both;animation-timeline:scroll(root);animation-range:0 120px}
.ks-progress{display:block;animation:ks-draw linear both;animation-timeline:scroll(root)}
}
}
@media (prefers-reduced-motion:reduce){
.ks *,.ks *::before,.ks *::after{transition-duration:.01ms!important}
}
.ks[data-still] *,.ks[data-still] *::before,.ks[data-still] *::after{animation:none!important;transition:none!important}
`;

const btnPrimary =
  "ks-btn inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 py-4 font-semibold text-[var(--accent-text)] shadow-[0_10px_34px_-12px_var(--accent)] hover:shadow-[0_18px_44px_-14px_var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const btnGhost =
  "ks-btn inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] px-7 py-4 font-semibold [--sheen:var(--text)] hover:border-[var(--text)] hover:bg-[var(--line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
/**
 * Safe average advance (em per character) of each display face at the
 * wordmark weight, padded above the measured value so the name never outgrows
 * its box. Unknown faces get the wide default.
 */
const WORDMARK_EM: Partial<Record<string, number>> = {
  Unbounded: 0.86,
  Syne: 0.8,
  "JetBrains Mono": 0.64,
  "IBM Plex Mono": 0.64,
  Fraunces: 0.72,
  "Instrument Serif": 0.56,
  Inter: 0.7,
  "Space Grotesk": 0.7,
  Sora: 0.72,
  Manrope: 0.7,
  "DM Sans": 0.68,
  Outfit: 0.66,
  "Plus Jakarta Sans": 0.72,
  "Bricolage Grotesque": 0.68,
  Archivo: 0.68,
};

/** Footer wordmark size: fills the container width (cqi) by character count, capped at 15rem. */
function wordmarkSize(name: string, font: string): string {
  const em = WORDMARK_EM[font] ?? 0.86;
  const n = Math.max(name.length, 4);
  return `min(15rem, calc(100cqi / ${(n * em).toFixed(2)}))`;
}

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const eyebrow = "inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]";

/** 3 or 6 → 3 columns, 4 → 2x2, 5 → 2 wide + 3 narrow (on a 6-col grid). */
const featureCols = (n: number) => (n === 4 ? "" : n === 5 ? "lg:grid-cols-6" : "lg:grid-cols-3");
const featureSpan = (n: number, i: number) => (n === 5 ? (i < 2 ? "lg:col-span-3" : "lg:col-span-2") : "");
/** Position of a feature inside its desktop row, for the reveal stagger. */
const featureCol = (n: number, i: number) => (n === 4 ? i % 2 : n === 5 ? (i < 2 ? i : i - 2) : i % 3);

const vi = (i: number, d?: number) => ({ "--i": i, ...(d != null ? { "--d": d } : {}) }) as CSSProperties;

function SectionHead({ kicker, title, displayStyle, id, index }: { kicker: string; title: string; displayStyle: CSSProperties; id: string; index: string }) {
  return (
    <div className="max-w-2xl">
      <p className={`${eyebrow} ks-reveal`}>
        <span className="font-mono text-xs tracking-normal text-[var(--muted)]">{index}</span>
        <span aria-hidden className="h-px w-8 bg-[var(--line-strong)]" />
        {kicker}
      </p>
      <h2 id={id} className="ks-reveal mt-4 text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-[3.4rem]" style={{ ...displayStyle, ...vi(1) }}>
        {title}
      </h2>
    </div>
  );
}

export function KitSite({ kit, links, token, preview, stats, still }: KitSiteProps) {
  const p = kit.palette;
  const x = social("x", links.twitter);
  const tg = social("telegram", links.telegram);
  const logo = logoSrc(kit.logoSvg);
  const serifDisplay = SERIF.has(kit.fonts.display);
  const displayStyle: CSSProperties = {
    fontFamily: stack(kit.fonts.display),
    fontWeight: kit.fonts.display === "Instrument Serif" ? 400 : kit.fonts.display === "Fraunces" ? 600 : 700,
    letterSpacing: serifDisplay ? "-0.01em" : "-0.035em",
  };
  const buyUrl = token?.address ? ponsTokenUrl(token.address) : null;
  const year = new Date().getUTCFullYear();
  const words = kit.site.hero.headline.split(/\s+/).filter(Boolean);
  const titles = kit.site.features.map((f) => f.title);

  const vars = {
    "--bg": p.background,
    "--surface": p.surface,
    "--text": p.text,
    "--muted": p.muted,
    "--accent": p.accent,
    "--accent-text": p.accentText,
    // Accent as text: nudged toward the text color so it stays legible on any background.
    "--accent-ink": `color-mix(in oklab, ${p.accent} 78%, ${p.text})`,
    "--line": `color-mix(in oklab, ${p.text} 11%, transparent)`,
    "--line-strong": `color-mix(in oklab, ${p.text} 22%, transparent)`,
    "--glow": `color-mix(in oklab, ${p.accent} 22%, transparent)`,
    fontFamily: stack(kit.fonts.body),
  } as CSSProperties;

  const nav = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#token", label: "Token" },
    { href: "#faq", label: "FAQ" },
  ];

  const marqueeRow = (copy: number) =>
    titles.map((t, i) => (
      <li key={`${copy}-${i}`} className="flex shrink-0 items-center gap-10 pr-10">
        <span className="whitespace-nowrap text-2xl sm:text-3xl" style={displayStyle}>
          {t}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain opacity-80" />
      </li>
    ));

  return (
    <div style={vars} data-still={still ? "" : undefined} className="ks relative isolate flex min-h-screen w-full flex-1 flex-col bg-[var(--bg)] text-[var(--text)] antialiased">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={googleFontsHref(kit.fonts)} precedence="default" />
      <style href="ks-site-motion" precedence="default">
        {SITE_CSS}
      </style>

      {preview ? (
        <div className="bg-[var(--text)] px-4 py-1.5 text-center text-xs font-medium text-[var(--bg)]">Preview · not launched yet</div>
      ) : null}

      <header className="ks-header sticky top-0 z-30 isolate">
        <nav aria-label="Main" className={`${container} flex h-16 items-center justify-between gap-4`}>
          <a href="#top" className="ks-in flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg object-contain" />
            <span className="truncate text-lg font-semibold tracking-tight" style={{ fontFamily: stack(kit.fonts.display) }}>
              {kit.name}
            </span>
          </a>
          <ul className="hidden shrink-0 items-center gap-6 whitespace-nowrap text-sm font-medium text-[var(--muted)] lg:flex xl:gap-8">
            {nav.map((n, i) => (
              <li key={n.href} className="ks-in" style={vi(i, 0.1 + i * 0.06)}>
                <a href={n.href} className="ks-link hover:text-[var(--text)]">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="ks-in shrink-0" style={vi(0, 0.35)}>
            <a
              href="#token"
              className="ks-btn inline-flex items-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {buyUrl ? `Buy $${kit.ticker}` : `$${kit.ticker}`}
            </a>
          </div>
        </nav>
        <span aria-hidden className="ks-progress" />
      </header>

      <main id="top" className="flex-1">
        {/* Hero */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div
              className="ks-blob ks-blob-a"
              style={{ width: "62vw", height: "62vw", maxWidth: 900, maxHeight: 900, right: "-14vw", top: "-22vw", background: "radial-gradient(closest-side, var(--glow), transparent)" }}
            />
            <div
              className="ks-blob ks-blob-b"
              style={{ width: "48vw", height: "48vw", maxWidth: 700, maxHeight: 700, left: "-16vw", bottom: "-22vw", background: `radial-gradient(closest-side, color-mix(in oklab, ${p.accent} 14%, transparent), transparent)` }}
            />
            <div
              className="absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
              style={{
                backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
              }}
            />
            <div className="ks-grain" />
          </div>
          <div className={`${container} ks-hero-exit grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:gap-16 lg:py-32`}>
            <div className="min-w-0">
              <p
                className="ks-in inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)] sm:text-sm"
                style={vi(0, 0.05)}
              >
                <span className="relative flex size-1.5 shrink-0" aria-hidden>
                  <span className="ks-ping absolute inset-0 rounded-full bg-[var(--accent)]" />
                  <span className="relative size-1.5 rounded-full bg-[var(--accent)]" />
                </span>
                <span className="truncate">{kit.site.hero.eyebrow}</span>
              </p>
              <h1 id="hero-title" className="mt-7 text-[clamp(2.5rem,7vw,5.25rem)] leading-[1.02] [overflow-wrap:anywhere] sm:[overflow-wrap:normal]" style={displayStyle}>
                {words.map((w, i) => (
                  <span key={i}>
                    <span className="ks-word">
                      <span style={vi(i)}>{w}</span>
                    </span>
                    {i < words.length - 1 ? " " : null}
                  </span>
                ))}
              </h1>
              <p className="ks-in mt-7 max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl" style={vi(0, 0.2 + words.length * 0.065)}>
                {kit.site.hero.subheadline}
              </p>
              <div className="ks-in mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={vi(0, 0.32 + words.length * 0.065)}>
                <a href="#token" className={btnPrimary}>
                  {kit.site.hero.cta}
                  <Arrow />
                </a>
                {x ? (
                  <a href={x} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                    <XIcon className="size-4" />
                    Follow on X
                  </a>
                ) : null}
              </div>
            </div>

            <div className="ks-pop relative mx-auto w-full max-w-sm lg:max-w-none" style={vi(0, 0.3)}>
              <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_40px_120px_-40px_var(--glow)] sm:p-10">
                <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 42%, var(--glow), transparent 62%)" }} />
                <svg aria-hidden viewBox="0 0 200 200" className="ks-spin absolute inset-[9%] size-[82%] text-[var(--line-strong)]">
                  <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="1.5 5" />
                  <circle cx="100" cy="4" r="2.6" fill="var(--accent)" />
                </svg>
                <svg aria-hidden viewBox="0 0 200 200" className="ks-spin-rev absolute inset-[19%] size-[62%] text-[var(--line)]">
                  <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="197" cy="100" r="2.4" fill="var(--text)" opacity=".5" />
                </svg>
                <div className="ks-grain" aria-hidden />
                <div className="relative flex h-full flex-col items-center justify-center gap-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt={`${kit.name} logo`} width={200} height={200} className="ks-float size-[48%] object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.22)]" />
                  <div className="text-center">
                    <p className="text-2xl" style={displayStyle}>
                      {kit.name}
                    </p>
                    <p className="mt-1 font-mono text-sm text-[var(--muted)]">${kit.ticker}</p>
                  </div>
                </div>
              </div>
              <span
                className="ks-in absolute -left-3 top-8 hidden items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--bg)] px-3.5 py-2 font-mono text-xs shadow-[0_16px_40px_-20px_rgba(0,0,0,.5)] sm:inline-flex lg:-left-8"
                style={vi(0, 0.95)}
              >
                <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden />${kit.ticker}
              </span>
              <span
                className="ks-in absolute -right-3 bottom-10 hidden items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--bg)] px-3.5 py-2 text-xs font-medium shadow-[0_16px_40px_-20px_rgba(0,0,0,.5)] sm:inline-flex lg:-right-6"
                style={vi(0, 1.1)}
              >
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="ks-ping absolute inset-0 rounded-full bg-[var(--accent)]" />
                  <span className="relative size-1.5 rounded-full bg-[var(--accent)]" />
                </span>
                {buyUrl ? "Live on pons" : "Launching soon"}
              </span>
            </div>
          </div>
        </section>

        {/* Marquee of feature titles (decorative; the same text is in the features list). */}
        <div aria-hidden className="ks-marquee overflow-hidden border-y border-[var(--line)] py-6 text-[var(--muted)]">
          <ul className="ks-marquee-track flex w-max">
            {marqueeRow(0)}
            {marqueeRow(1)}
            {marqueeRow(2)}
            {marqueeRow(3)}
          </ul>
        </div>

        {/* Features */}
        <section aria-labelledby="features-title" id="features" className="scroll-mt-20 py-24 sm:py-32">
          <div className={container}>
            <SectionHead id="features-title" index="01" kicker="Features" title={kit.tagline} displayStyle={displayStyle} />
            <ul className={`mt-14 grid gap-4 sm:grid-cols-2 ${featureCols(kit.site.features.length)}`}>
              {kit.site.features.map((f, i) => (
                <li key={i} className={`ks-reveal ${featureSpan(kit.site.features.length, i)}`} style={vi(featureCol(kit.site.features.length, i))}>
                  <div className="ks-card rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
                    <span className="ks-chip inline-flex size-11 items-center justify-center rounded-xl bg-[var(--glow)] font-mono text-sm font-semibold text-[var(--accent-ink)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-6 text-xl font-semibold tracking-tight">{f.title}</h3>
                    <p className="mt-2.5 leading-relaxed text-[var(--muted)]">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-title" id="how" className="relative scroll-mt-20 overflow-hidden border-t border-[var(--line)] bg-[var(--surface)] py-24 sm:py-32">
          <div className={container}>
            <SectionHead id="how-title" index="02" kicker="How it works" title={`Get started with ${kit.name}`} displayStyle={displayStyle} />
            <ol className={`mt-14 grid gap-10 sm:grid-cols-2 ${kit.site.steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {kit.site.steps.map((s, i) => (
                <li key={i} className="ks-reveal relative" style={vi(i)}>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-base font-bold text-[var(--accent-text)] shadow-[0_10px_30px_-12px_var(--accent)]">{i + 1}</span>
                    {i < kit.site.steps.length - 1 && (
                      // Connector only where a next step sits on the same row: 2 columns at sm, all in one row at lg.
                      <span aria-hidden className={`ks-draw hidden h-px flex-1 bg-[var(--line-strong)] ${i % 2 === 0 ? "sm:block" : "lg:block"}`} />
                    )}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-[var(--muted)]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Token */}
        <section aria-labelledby="token-title" id="token" className="scroll-mt-20 border-t border-[var(--line)] py-24 sm:py-32">
          <div className={`${container} grid items-start gap-12 lg:grid-cols-2 lg:gap-16`}>
            <div className="min-w-0">
              <SectionHead id="token-title" index="03" kicker="Token" title={`$${kit.ticker}`} displayStyle={displayStyle} />
              <p className="ks-reveal mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]" style={vi(2)}>
                {kit.description}
              </p>
              <ul className="mt-8 space-y-3 text-[var(--muted)]">
                {["Fixed supply of 1,000,000,000 tokens", "Launched on pons, Robinhood Chain", "Graduates to a DEX pool at 4.2 ETH raised"].map((t, i) => (
                  <li key={t} className="ks-reveal flex items-start gap-3" style={vi(i + 2)}>
                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--glow)]">
                      <svg aria-hidden className="size-3 text-[var(--accent-ink)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ks-reveal" style={vi(1)}>
              <TokenWidget ticker={kit.ticker} token={token?.address ?? null} buyUrl={buyUrl} stats={stats ?? null} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" id="faq" className="scroll-mt-20 border-t border-[var(--line)] py-24 sm:py-32">
          <div className={`${container} grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16`}>
            <SectionHead id="faq-title" index="04" kicker="FAQ" title="Questions, answered" displayStyle={displayStyle} />
            <div className="border-t border-[var(--line)]">
              {kit.site.faq.map((f, i) => (
                <details key={i} className="ks-faq ks-reveal border-b border-[var(--line)]" name="faq" style={vi(i)}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-6 text-left text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:text-xl [&::-webkit-details-marker]:hidden">
                    <span className="ks-q">{f.q}</span>
                    <span aria-hidden className="ks-plus inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <p className="ks-answer pb-7 pr-12 leading-relaxed text-[var(--muted)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing */}
        <section aria-labelledby="closing-title" className="pb-20 sm:pb-28">
          <div className={container}>
            <div className="ks-band relative isolate overflow-hidden rounded-[2.25rem] bg-[var(--accent)] px-6 py-16 text-center text-[var(--accent-text)] sm:px-12 sm:py-24">
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div
                  className="ks-blob ks-blob-a"
                  style={{ width: "70%", aspectRatio: "1", left: "15%", top: "-55%", background: `radial-gradient(closest-side, color-mix(in oklab, ${p.accentText} 24%, transparent), transparent)` }}
                />
                <div
                  className="ks-blob ks-blob-b"
                  style={{ width: "50%", aspectRatio: "1", right: "-15%", bottom: "-50%", background: `radial-gradient(closest-side, color-mix(in oklab, ${p.background} 30%, transparent), transparent)` }}
                />
                <svg viewBox="0 0 200 200" className="ks-spin absolute -left-24 -bottom-24 size-72 opacity-25 sm:size-96" style={{ color: p.accentText }}>
                  <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth=".7" strokeDasharray="1.5 5" />
                </svg>
                <div className="ks-grain" />
              </div>
              <div className="relative mx-auto max-w-2xl">
                <span className="ks-float mx-auto mb-8 flex size-16 items-center justify-center rounded-2xl bg-[var(--bg)] shadow-[0_20px_40px_-20px_rgba(0,0,0,.45)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="" width={40} height={40} className="size-10 object-contain" />
                </span>
                <h2 id="closing-title" className="text-3xl leading-[1.05] sm:text-5xl md:text-6xl" style={displayStyle}>
                  {kit.site.closing.headline}
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed opacity-85">{kit.site.closing.body}</p>
                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href={buyUrl ?? "#token"}
                    {...(buyUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="ks-btn inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-text)] px-7 py-4 font-semibold text-[var(--accent)] [--sheen:var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
                  >
                    {buyUrl ? `Buy $${kit.ticker}` : kit.site.hero.cta}
                    <Arrow />
                  </a>
                  {tg ? (
                    <a
                      href={tg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ks-btn inline-flex items-center justify-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--accent-text)_35%,transparent)] px-7 py-4 font-semibold [--sheen:var(--accent-text)] hover:bg-[color-mix(in_oklab,var(--accent-text)_10%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
                    >
                      <TelegramIcon className="size-4" />
                      Join Telegram
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="overflow-hidden border-t border-[var(--line)]">
        <div className={`${container} flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={28} height={28} className="size-7 rounded-md object-contain" />
            <span className="font-semibold" style={{ fontFamily: stack(kit.fonts.display) }}>
              {kit.name}
            </span>
            <span className="font-mono text-sm text-[var(--muted)]">${kit.ticker}</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="ks-link hover:text-[var(--text)]">
                {n.label}
              </a>
            ))}
            {x ? (
              <a href={x} target="_blank" rel="noopener noreferrer" aria-label={`${kit.name} on X`} className="transition-colors hover:text-[var(--text)]">
                <XIcon className="size-4" />
              </a>
            ) : null}
            {tg ? (
              <a href={tg} target="_blank" rel="noopener noreferrer" aria-label={`${kit.name} on Telegram`} className="transition-colors hover:text-[var(--text)]">
                <TelegramIcon className="size-4" />
              </a>
            ) : null}
          </nav>
        </div>
        <div aria-hidden className="select-none overflow-hidden px-4 [container-type:inline-size] sm:px-6">
          <p
            className="ks-big ks-wordmark text-center leading-[0.8] [overflow-wrap:anywhere] [text-wrap:balance]"
            style={{ ...displayStyle, fontSize: wordmarkSize(kit.name, kit.fonts.display), paddingTop: "0.05em", paddingBottom: "0.2em" }}
          >
            {kit.name}
          </p>
        </div>
        <div className={`${container} flex flex-col gap-2 border-t border-[var(--line)] py-6 text-xs text-[var(--muted)] sm:flex-row sm:justify-between`}>
          <p>Tokens are volatile and can lose all value. Nothing here is financial advice.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              © {year} {kit.name}
            </span>
            <a href={brand.url} target="_blank" rel="noopener" className="ks-link opacity-80 hover:text-[var(--text)] hover:opacity-100">
              Built with {brand.name}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default KitSite;
