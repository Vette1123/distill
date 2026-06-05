/**
 * Single source of truth for site-wide metadata / SEO.
 * `url` resolves automatically:
 *   1. NEXT_PUBLIC_SITE_URL if you set it (recommended for a custom domain)
 *   2. the Vercel production domain when deployed there
 *   3. localhost in development
 */
function resolveUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Distill",
  title: "Distill — squeeze any document into AI-ready text",
  description:
    "Drop in any PDF or image and get clean, copy-paste-ready Markdown that costs a fraction of the tokens. Runs entirely in your browser — free, private, no API keys.",
  url: resolveUrl(),
  author: {
    name: "Mohamed Gado",
    url: "https://mohamedgado.com",
  },
  keywords: [
    "PDF to Markdown",
    "image to text",
    "OCR in browser",
    "reduce AI token usage",
    "AI document converter",
    "PDF to text for ChatGPT",
    "PDF to text for Claude",
    "token saver",
    "free OCR",
    "copy paste to AI",
  ],
} as const;
