import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FEN — Frontier Exchange Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#000000",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            borderRadius: "24px",
            backgroundColor: "#0a0a0a",
            border: "2px solid #1a1a1a",
            padding: "60px",
          }}
        >
          {/* Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "14px",
                backgroundColor: "rgba(212, 96, 10, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: 700,
                color: "#e8622b",
              }}
            >
              F
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "48px", fontWeight: 700, color: "#f1f5f9" }}>FEN</div>
              <div style={{ fontSize: "18px", color: "#94a3b8", marginTop: "-4px" }}>
                Frontier Exchange Network
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: "24px", color: "#94a3b8", marginTop: "32px" }}>
            Player-owned trade corridors for EVE Frontier on Sui
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "60px", marginTop: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#e8622b" }}>
                6 Move Modules
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                Corridors, Tolls, Depots, Treasury, AMM, DeepBook
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#e8622b" }}>117 Tests</div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                Comprehensive Move test coverage
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#e8622b" }}>
                Deployed on Testnet
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                Live corridor with AMM pool
              </div>
            </div>
          </div>

          {/* Corridor diagram */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "40px",
            }}
          >
            {[
              { label: "Source Gate", color: "#f1f5f9" },
              { label: "toll", color: "#e8622b", isDash: true },
              { label: "Dest Gate", color: "#f1f5f9" },
              { label: "trade", color: "#34d399", isDash: true },
              { label: "AMM Pool", color: "#f1f5f9" },
            ].map((item, i) =>
              item.isDash ? (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    color: item.color,
                  }}
                >
                  {"- - - - -"}
                  <span>{item.label}</span>
                  {"- - - - -"}
                </div>
              ) : (
                <div
                  key={i}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    backgroundColor: "#111111",
                    border: "1px solid #1a1a1a",
                    fontSize: "14px",
                    color: item.color,
                  }}
                >
                  {item.label}
                </div>
              ),
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "auto",
              fontSize: "14px",
              fontWeight: 500,
              color: "#64748b",
            }}
          >
            EVE Frontier x Sui 2026 Hackathon
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
