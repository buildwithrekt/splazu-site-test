/** The brand kit this site renders (kit.json). Same shape as the splazu kit. */
export type Kit = {
  name: string;
  ticker: string;
  tagline: string;
  /** Also the on-chain token description. */
  description: string;
  vibe: string;
  palette: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
  };
  fonts: { display: string; body: string };
  logoSvg: string;
  site: {
    hero: { eyebrow: string; headline: string; subheadline: string; cta: string };
    features: { title: string; body: string }[];
    steps: { title: string; body: string }[];
    faq: { q: string; a: string }[];
    closing: { headline: string; body: string };
  };
};

/** Token and links for this site (project.json). */
export type ProjectInfo = {
  name: string;
  ticker: string;
  /** Token address on Robinhood Chain, or null before launch. */
  token: string | null;
  /** pons bonding curve address, or null before launch. */
  curve: string | null;
  links: { twitter?: string; telegram?: string; website?: string };
  creatorTaxBps: number;
  /** Where the "Built with" credit links to. */
  builtWith?: string;
};
