import type { Metadata, Viewport } from "next";
import { kit, project } from "@/lib/project";
import "./globals.css";

const title = `${kit.name} · ${kit.tagline}`;

export const metadata: Metadata = {
  title,
  description: kit.description,
  icons: { icon: "/logo.svg" },
  openGraph: { title, description: kit.description, siteName: kit.name, url: project.links.website || undefined },
  twitter: { card: "summary" },
};

export const viewport: Viewport = { themeColor: kit.palette.background };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: kit.palette.background, color: kit.palette.text }}>{children}</body>
    </html>
  );
}
