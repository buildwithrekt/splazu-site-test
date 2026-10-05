import { KitSite } from "@/components/kit-site";
import { kit, project } from "@/lib/project";
import { getTokenStats } from "@/lib/token-stats";

/** Rebuilt in the background at most once a minute, so token stats stay fresh. */
export const revalidate = 60;

export default async function Home() {
  const stats = await getTokenStats(project.token, project.curve);
  return (
    <KitSite
      kit={kit}
      links={{ twitter: project.links.twitter, telegram: project.links.telegram }}
      token={project.token ? { address: project.token, curve: project.curve } : null}
      stats={stats}
    />
  );
}
