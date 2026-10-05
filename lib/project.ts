import kitJson from "../kit.json";
import projectJson from "../project.json";
import type { Kit, ProjectInfo } from "./types";

/** The site's content. Edit kit.json and project.json to change it. */
export const kit = kitJson as Kit;
export const project = projectJson as ProjectInfo;
