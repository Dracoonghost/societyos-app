import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "#0b0f14",
          color: "#f8fafc",
          padding: 64,
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 15% 20%, rgba(242,169,59,0.24), transparent 35%), radial-gradient(circle at 85% 25%, rgba(88,184,216,0.18), transparent 30%), linear-gradient(135deg, #0b0f14 0%, #111826 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 28,
            padding: 48,
            background: "rgba(11,15,20,0.65)",
          }}
        >
          <div style={{ display: "flex", fontSize: 28, color: "#f2a93b", letterSpacing: 2 }}>
            SOCIETYOS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 780 }}>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
              AI decision intelligence for founders and operators.
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#cbd5e1", lineHeight: 1.35 }}>
              Expert panels, audience simulations, and decision-ready artifacts in one workspace.
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 24, color: "#94a3b8" }}>
            <span>societyos.ai</span>
            <span style={{ color: "#58b8d8" }}>AI Decision Lab</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
