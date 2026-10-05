import { createPublicClient, defineChain, formatEther, http, isAddress, parseAbi, type Address } from "viem";

/**
 * Live token stats read from the pons bonding curve, over the PUBLIC Robinhood Chain RPC.
 * No API key and no secret: everything here is public, read-only data.
 * The page revalidates every 60s (see app/page.tsx), so the numbers refresh about once a minute.
 */
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";

const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

const client = createPublicClient({ chain: robinhood, transport: http(RPC_URL, { timeout: 10_000 }) });

/** Quote (ETH) a pons bonding curve must collect before it graduates. */
export const GRADUATION_ETH = 4.2;
/** Every pons token has a fixed 1B supply. */
const SUPPLY = 1_000_000_000;

const curveAbi = parseAbi([
  "function getReserves() view returns (uint256 quoteReserve, uint256 tokenReserve)",
  "function realQuoteReserve() view returns (uint256)",
  "function readyToGraduate() view returns (bool)",
]);

export type TokenStats = {
  /** Price of one token in ETH; null once graduated (price lives on the DEX pool). */
  priceEth: number | null;
  priceUsd: number | null;
  mcapEth: number | null;
  mcapUsd: number | null;
  /** ETH actually raised on the curve (excludes virtual reserve). */
  raisedEth: number | null;
  /** Bonding-curve progress, 0..1 (1 when graduated). */
  progress: number;
  graduated: boolean;
  ethUsd: number | null;
};

async function getEthUsd(): Promise<number | null> {
  try {
    const res = await fetch("https://coins.llama.fi/prices/current/coingecko:ethereum", { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { coins?: Record<string, { price?: number }> };
    const price = data.coins?.["coingecko:ethereum"]?.price;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function readCurve(curve: Address) {
  try {
    const [reserves, real, ready] = await client.multicall({
      allowFailure: true,
      contracts: [
        { address: curve, abi: curveAbi, functionName: "getReserves" },
        { address: curve, abi: curveAbi, functionName: "realQuoteReserve" },
        { address: curve, abi: curveAbi, functionName: "readyToGraduate" },
      ],
    });
    if (reserves.status !== "success") {
      // Graduated curves revert; a missing contract means bad data, not graduation.
      const code = await client.getCode({ address: curve });
      return code && code !== "0x" ? { graduated: true as const } : null;
    }
    const [quote, tokens] = reserves.result;
    const priceEth = tokens > 0n ? Number(formatEther(quote)) / Number(formatEther(tokens)) : null;
    const raisedEth = real.status === "success" ? Number(formatEther(real.result)) : null;
    const isReady = ready.status === "success" && ready.result;
    return { graduated: false as const, priceEth, raisedEth, ready: isReady };
  } catch {
    return null; // RPC down: unknown, not graduated
  }
}

/** Live stats for a pons token, read from its bonding curve. Never throws. */
export async function getTokenStats(token: string | null | undefined, curve: string | null | undefined): Promise<TokenStats | null> {
  if (!token || !curve || !isAddress(token) || !isAddress(curve)) return null;
  try {
    const [state, ethUsd] = await Promise.all([readCurve(curve), getEthUsd()]);
    if (!state) return null;
    if (state.graduated) {
      return { priceEth: null, priceUsd: null, mcapEth: null, mcapUsd: null, raisedEth: null, progress: 1, graduated: true, ethUsd };
    }
    const { priceEth, raisedEth, ready } = state;
    const mcapEth = priceEth !== null ? priceEth * SUPPLY : null;
    const progress = ready ? 1 : raisedEth !== null ? Math.min(1, Math.max(0, raisedEth / GRADUATION_ETH)) : 0;
    return {
      priceEth,
      priceUsd: priceEth !== null && ethUsd ? priceEth * ethUsd : null,
      mcapEth,
      mcapUsd: mcapEth !== null && ethUsd ? mcapEth * ethUsd : null,
      raisedEth,
      progress,
      graduated: false,
      ethUsd,
    };
  } catch {
    return null;
  }
}
