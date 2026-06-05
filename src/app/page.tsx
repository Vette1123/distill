import { SiteHeader } from "@/components/site-header";
import { Studio } from "@/components/studio";
import { siteConfig } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript. Runs entirely client-side.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Convert PDF to Markdown",
    "Extract text from images with OCR",
    "Estimate and reduce AI token usage",
    "Runs 100% in the browser — no uploads",
  ],
  author: {
    "@type": "Person",
    name: siteConfig.author.name,
    url: siteConfig.author.url,
  },
};

export default function Home() {
  return (
    <div className="grain relative flex min-h-screen flex-col bg-background">
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <span className="mx-1.5">·</span>
          by{" "}
          <a
            href="https://mohamedgado.com"
            target="_blank"
            rel="author noreferrer"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-lime hover:underline"
          >
            Mohamed Gado
          </a>
        </footer>
      </div>
    </div>
  );
}
