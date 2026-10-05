"use client";
// Synced from the splazu platform renderer. Edit freely: this file is yours now.

import { useState } from "react";
import type { TokenStats } from "@/lib/token-stats";

/**
 * Live token box on customer sites. Read-only by design: no wallet, no transactions.
 * Buying happens on pons (external link). The only client behavior is the copy button.
 * Motion is CSS only, from the `ks-*` classes defined in kit-site.tsx.
 */
export type TokenWidgetProps = {
  ticker: string;
  /** Token address, or null when not launched yet. */
  token: string | null;
  /** Precomputed pons URL for the token (server side). */
  buyUrl: string | null;
  stats: TokenStats | null;
};

const usd = (n: number) => {
  if (n >= 1) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: n >= 100_000 ? "compact" : "standard", maximumFractionDigits: 2 }).format(n);
  return `$${n.toLocaleString("en-US", { maximumSignificantDigits: 4 })}`;
};
const eth = (n: number) =>
  `${n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 }) : n.toLocaleString("en-US", { maximumSignificantDigits: 4 })} ETH`;
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="ks-stat min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{label}</dt>
      <dd className="mt-1.5 truncate font-mono text-lg font-semibold tabular-nums tracking-tight sm:text-xl">{value}</dd>
      {sub ? <dd className="mt-0.5 truncate text-xs tabular-nums text-[var(--muted)]">{sub}</dd> : null}
    </div>
  );
}

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-medium transition-[background-color,transform] duration-300 hover:bg-[var(--line)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      aria-label={copied ? "Address copied" : "Copy contract address"}
    >
      <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function TokenWidget({ ticker, token, buyUrl, stats }: TokenWidgetProps) {
  if (!token) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <div aria-hidden className="ks-blob ks-blob-a -right-1/4 -top-1/2 aspect-square w-3/4" style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }} />
        <div className="relative flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="ks-ping absolute inline-flex size-full rounded-full bg-[var(--accent)]" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[var(--accent)]" />
          </span>
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">${ticker}</p>
        </div>
        <p className="relative mt-5 text-2xl font-semibold tracking-tight">Token launching soon</p>
        <p className="relative mt-2 leading-relaxed text-[var(--muted)]">The ${ticker} token isn&apos;t live yet. Check back shortly; this box will show live price and progress once it launches.</p>
      </div>
    );
  }

  const graduated = stats?.graduated ?? false;
  const progress = stats ? Math.round(stats.progress * 1000) / 10 : null;
  const price = stats?.priceUsd != null ? usd(stats.priceUsd) : stats?.priceEth != null ? eth(stats.priceEth) : graduated ? "On DEX" : "—";
  const priceSub = stats?.priceUsd != null && stats.priceEth != null ? eth(stats.priceEth) : undefined;
  const mcap = stats?.mcapUsd != null ? usd(stats.mcapUsd) : stats?.mcapEth != null ? eth(stats.mcapEth) : graduated ? "On DEX" : "—";
  const mcapSub = stats?.mcapUsd != null && stats.mcapEth != null ? eth(stats.mcapEth) : undefined;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_40px_100px_-50px_var(--glow)] sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold">${ticker}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
          <span className="relative flex size-1.5" aria-hidden>
            <span className="ks-ping absolute inset-0 rounded-full bg-[var(--accent)]" />
            <span className="relative size-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          {graduated ? "Graduated" : "Live on pons"}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Price" value={price} sub={priceSub} />
        <Stat label="Market cap" value={mcap} sub={mcapSub} />
      </dl>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Bonding curve</span>
          <span className="tabular-nums text-[var(--muted)]">{progress === null ? "—" : graduated ? "Complete" : `${progress}%`}</span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--line)]"
          role="progressbar"
          aria-label="Bonding curve progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress ?? undefined}
        >
          <div className="h-full overflow-hidden rounded-full" style={{ width: `${progress ?? 0}%` }}>
            <div className="ks-draw h-full rounded-full bg-[var(--accent)]" />
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {graduated ? "The curve filled and liquidity moved to a DEX pool." : stats?.raisedEth != null ? `${eth(stats.raisedEth)} of 4.2 ETH raised. At 100% the token graduates to a DEX pool.` : "At 100% the token graduates to a DEX pool."}
        </p>
      </div>

      {buyUrl ? (
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ks-btn mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-4 font-semibold text-[var(--accent-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Buy ${ticker} on pons
          <svg aria-hidden className="ks-arrow ks-arrow-ne" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </a>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">Contract</p>
          <p className="truncate font-mono text-sm" title={token}>
            <span className="sm:hidden">{short(token)}</span>
            <span className="hidden sm:inline">{token}</span>
          </p>
        </div>
        <CopyAddress address={token} />
      </div>
    </div>
  );
}
