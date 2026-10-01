import { ImageResponse } from "next/og";

export const alt = "Safar Zaika — Hot food, delivered to your train seat.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const cocoa = "#2a1407";
const cream = "#fffaf2";
const copper = "#b86e24";
const gold = "#e3b461";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: cocoa,
          color: cream,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700, color: gold }}>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: copper }} />
          Safar Zaika
        </div>

        <div style={{ display: "flex", maxWidth: 940, fontSize: 64, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }}>Hot food on your train, handed over at your seat.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", position: "relative", alignItems: "center", justifyContent: "space-between", width: "100%", height: 24 }}>
            <div style={{ display: "flex", position: "absolute", left: 12, right: 12, top: 10, height: 4, borderRadius: 999, background: copper }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", width: 24, height: 24, borderRadius: 999, background: cream }} />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: gold }}>Safar Zaika · Your journey. Our zaika.</div>
        </div>
      </div>
    ),
    size,
  );
}
