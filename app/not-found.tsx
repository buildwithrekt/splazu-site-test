import { kit } from "@/lib/project";

export default function NotFound() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", padding: 24, textAlign: "center" }}>
      <div>
        <p style={{ fontSize: 14, opacity: 0.6 }}>404</p>
        <h1 style={{ fontSize: 28, margin: "8px 0 16px" }}>This page does not exist.</h1>
        <a href="/" style={{ color: kit.palette.accent }}>
          Back to {kit.name}
        </a>
      </div>
    </main>
  );
}
