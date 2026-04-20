import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RM Copilot",
  description: "AI copilot for Relationship Managers — pre-call briefs & real-time assist",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased selection:bg-primary/30">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(263_70%_15%/0.4),transparent_60%)]" />
        {children}
      </body>
    </html>
  );
}
