import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt =
  "Distill — squeeze any document into AI-ready text, free and in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(900px 500px at 15% -10%, rgba(190,240,0,0.18), transparent 60%), radial-gradient(700px 400px at 100% 0%, rgba(220,180,80,0.10), transparent 60%), #14160f",
          color: "#f2f4ea",
          fontFamily: "sans-serif",
        }}
      >
        {/* top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#bef000",
              color: "#171c0a",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            D
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>
            distill
          </div>
        </div>

        {/* middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
            }}
          >
            <span style={{ display: "flex" }}>Stop feeding AI</span>
            <span style={{ display: "flex", color: "#bef000" }}>expensive pixels.</span>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#aab09a", maxWidth: 900 }}>
            Any PDF or image → clean, copy-paste-ready Markdown that costs a fraction of the
            tokens. Runs 100% in your browser.
          </div>
        </div>

        {/* bottom: tags + author */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {["FREE", "NO API KEYS", "PRIVATE · IN-BROWSER"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(190,240,0,0.35)",
                  color: "#bef000",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#8b9079" }}>mohamedgado.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
