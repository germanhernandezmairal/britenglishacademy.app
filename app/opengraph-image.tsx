import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Brit English School — Academia de Inglés Cambridge en Tarragona"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #012169 0%, #1A3A8C 60%, #012169 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        {/* Cambridge badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(212,160,23,0.2)",
            border: "1px solid rgba(212,160,23,0.4)",
            borderRadius: 40,
            padding: "8px 24px",
            color: "#F0C842",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 36,
          }}
        >
          Centro Preparador Cambridge Oficial · Tarragona
        </div>

        {/* School name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.05,
            marginBottom: 20,
          }}
        >
          Brit English School
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 34,
            color: "#F0C842",
            fontWeight: 600,
            marginBottom: 28,
          }}
        >
          Academia de Inglés en Tarragona
        </div>

        {/* Pills row */}
        <div style={{ display: "flex", gap: 16 }}>
          {["B1 · B2 · C1 · C2", "Grupos reducidos", "4.9/5 Google"].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  padding: "8px 18px",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 20,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
