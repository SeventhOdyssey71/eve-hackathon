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
          backgroundColor: "#08080d",
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
            backgroundColor: "#101018",
            border: "2px solid #232336",
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
                color: "#d4600a",
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
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#d4600a" }}>
                6 Move Modules
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                Corridors, Tolls, Depots, Treasury, AMM, DeepBook
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#d4600a" }}>117 Tests</div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                Comprehensive Move test coverage
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#d4600a" }}>
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
              { label: "toll", color: "#d4600a", isDash: true },
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
                    backgroundColor: "#181824",
                    border: "1px solid #232336",
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
