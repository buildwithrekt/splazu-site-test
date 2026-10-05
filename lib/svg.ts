// Synced from the splazu platform renderer. Edit freely: this file is yours now.
/**
 * Keeps only a small, inert SVG subset. Logos are also rendered through <img>, where
 * scripts never run; this is defense in depth and keeps stored markup clean.
 */
const ALLOWED_TAGS = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "defs", "lineargradient", "radialgradient", "stop", "title"]);
const ALLOWED_ATTRS = new Set([
  "xmlns", "viewbox", "width", "height", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "d", "cx", "cy", "r", "rx", "ry",
  "x", "y", "x1", "y1", "x2", "y2", "points", "transform", "opacity", "fill-opacity", "stroke-opacity", "id", "offset", "stop-color",
  "stop-opacity", "gradientunits", "gradienttransform", "fill-rule", "clip-rule",
]);

export function sanitizeSvg(input: string): string | null {
  const svg = input.trim();
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) return null;
  let ok = true;
  const out = svg.replace(/<\/?([a-zA-Z][\w:-]*)([^>]*)>/g, (tag, name: string, attrs: string) => {
    const lower = name.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) {
      ok = false;
      return "";
    }
    if (tag.startsWith("</")) return `</${name}>`;
    const kept: string[] = [];
    for (const m of attrs.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/g)) {
      const key = m[1].toLowerCase();
      const value = m[2].slice(1, -1);
      if (!ALLOWED_ATTRS.has(key)) continue;
      if (/javascript:|url\(|expression\(|data:/i.test(value)) continue;
      kept.push(`${m[1]}="${value.replace(/"/g, "&quot;")}"`);
    }
    const selfClosing = /\/\s*$/.test(attrs);
    return `<${name}${kept.length ? " " + kept.join(" ") : ""}${selfClosing ? "/" : ""}>`;
  });
  if (!ok || /<!|<\?|&#/.test(out)) return null;
  return out.replace(/<svg(?![^>]*xmlns=)/i, '<svg xmlns="http://www.w3.org/2000/svg"');
}

/** Works on the server and in the browser. */
export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
