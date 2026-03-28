import { ImageResponse } from "@vercel/og";
import { getShareResult } from "@/lib/kv";

export const runtime = "edge";

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;

function toPixel(value: number, axis: "x" | "y"): number {
  if (axis === "x") return CENTER + value * RADIUS;
  return CENTER - value * RADIUS;
}

function getQuadrantLabel(x: number, y: number): string {
  const threshold = 0.15;
  const xCenter = Math.abs(x) < threshold;
  const yCenter = Math.abs(y) < threshold;

  if (xCenter && yCenter) return "Au centre";

  const xLabel = xCenter ? null : x > 0 ? "Libéralisme économique" : "Intervention de l'État";
  const yLabel = yCenter ? null : y > 0 ? "Progressiste" : "Conservateur";

  if (xLabel && yLabel) return `${yLabel}, ${xLabel.toLowerCase()}`;
  return xLabel ?? yLabel!;
}

export async function GET(request: Request, { id }: Record<string, string>) {
  if (!id) {
    return Response.json({ error: "Missing ID" }, { status: 400 });
  }

  const result = await getShareResult(id);
  if (!result) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { position, topParties } = result;
  const userX = toPixel(position.x, "x");
  const userY = toPixel(position.y, "y");
  const quadrant = (position.xValid && position.yValid)
    ? getQuadrantLabel(position.x, position.y)
    : null;
  const topParty = topParties[0] ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "1200px",
          height: "630px",
          background: "linear-gradient(180deg, #1e1b4b 0%, #0f0a2e 60%, #000000 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          {/* Mini hemicycle dots */}
          {["#ef4444", "#f472b6", "#c084fc", "#a78bfa", "#818cf8", "#60a5fa", "#2563eb"].map((c) => (
            <div key={c} style={{ display: "flex", width: 8, height: 8, borderRadius: 4, background: c, marginRight: 3, opacity: 0.9 }} />
          ))}
          <div style={{ display: "flex", fontSize: 18, color: "#818cf8", fontWeight: 600, marginLeft: 6 }}>
            Ma Boussole Parlementaire
          </div>
        </div>

        {/* Compass grid */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: `${SIZE}px`,
            height: `${SIZE}px`,
          }}
        >
          {/* Quadrant backgrounds */}
          <div style={{ display: "flex", position: "absolute", left: 10, top: 10, width: RADIUS, height: RADIUS, background: "rgba(219,234,254,0.15)", borderRadius: 4 }} />
          <div style={{ display: "flex", position: "absolute", left: CENTER, top: 10, width: RADIUS, height: RADIUS, background: "rgba(237,233,254,0.15)", borderRadius: 4 }} />
          <div style={{ display: "flex", position: "absolute", left: 10, top: CENTER, width: RADIUS, height: RADIUS, background: "rgba(254,243,199,0.15)", borderRadius: 4 }} />
          <div style={{ display: "flex", position: "absolute", left: CENTER, top: CENTER, width: RADIUS, height: RADIUS, background: "rgba(252,231,243,0.15)", borderRadius: 4 }} />

          {/* Crosshairs */}
          <div style={{ display: "flex", position: "absolute", left: 10, top: CENTER - 0.5, width: SIZE - 20, height: 1, background: "rgba(226,232,240,0.3)" }} />
          <div style={{ display: "flex", position: "absolute", left: CENTER - 0.5, top: 10, width: 1, height: SIZE - 20, background: "rgba(226,232,240,0.3)" }} />

          {/* User star */}
          {position.xValid && position.yValid && (
            <div
              style={{
                display: "flex",
                position: "absolute",
                left: userX - 10,
                top: userY - 10,
                width: 20,
                height: 20,
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              {"★"}
            </div>
          )}
        </div>

        {/* Axis labels */}
        <div style={{ display: "flex", gap: 40, marginTop: 8 }}>
          <div style={{ display: "flex", fontSize: 11, color: "#94a3b8" }}>{"← État"}</div>
          <div style={{ display: "flex", fontSize: 11, color: "#94a3b8" }}>{"Libéralisme →"}</div>
        </div>

        {/* Quadrant label */}
        {quadrant && (
          <div style={{ display: "flex", fontSize: 28, color: "#ffffff", fontWeight: 800, marginTop: 20 }}>
            {quadrant}
          </div>
        )}

        {/* Top party */}
        {topParty && (
          <div style={{ display: "flex", fontSize: 16, color: "#a5b4fc", marginTop: 12 }}>
            {topParty.name} ({topParty.score}%)
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", fontSize: 22, color: "#c7d2fe", fontWeight: 700, marginTop: 28 }}>
          Et toi, tu es où ?
        </div>
        <div style={{ display: "flex", fontSize: 13, color: "#6366f1", marginTop: 6 }}>
          boussole.poligraph.fr
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
