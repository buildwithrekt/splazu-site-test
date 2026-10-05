import { project } from "./project";

/** The small "Built with splazu" credit in the footer. */
export const brand = {
  name: "splazu",
  url: project.builtWith || "https://splazu.com",
} as const;
