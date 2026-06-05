import { SiteHeader } from "@/components/site-header";
import { Studio } from "@/components/studio";

export default function Home() {
  return (
    <div className="grain relative flex min-h-screen flex-col bg-background">
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 h-[60vh] bg-grid" />

      <div className="relative z-[2] flex flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Studio />
        </main>
        <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 text-center text-xs text-muted-foreground/60">
          Built with Next.js · pdf.js · Tesseract.js — everything runs locally in your browser.
        </footer>
      </div>
    </div>
  );
}
