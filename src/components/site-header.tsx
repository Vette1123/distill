import { Code2, ShieldCheck } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2.5">
        <div className="relative flex size-8 items-center justify-center rounded-lg bg-lime text-[oklch(0.2_0.05_130)]">
          <span className="font-display text-lg font-extrabold leading-none">D</span>
          <span className="absolute -inset-1 rounded-lg bg-lime/30 blur-md" aria-hidden />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">distill</span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
          <ShieldCheck className="size-4 text-lime" />
          Runs 100% in your browser
        </span>
        <a
          href="https://github.com/Vette1123/distill"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Code2 className="size-4" />
          <span className="hidden sm:inline">Source</span>
        </a>
      </div>
    </header>
  );
}
