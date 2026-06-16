import { ImageResponse } from "next/og"

// TEMPORARY placeholder favicon — code-generated monogram for the project.
// Replaces the original school logo until a final brand mark is provided.
export const runtime = "edge"
export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#012169",
          borderRadius: 14,
          color: "#D4A017",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: -1,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        BEA
      </div>
    ),
    { ...size }
  )
}
