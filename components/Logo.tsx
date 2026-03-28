import React from "react";
import Svg, { Circle, Line, Polygon } from "react-native-svg";

const VB = 200;
const CX = 100;
const CY = 100;

function arcPositions(radius: number, count: number) {
  const pad = 0.15;
  const arc = Math.PI - 2 * pad;
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const angle = Math.PI - pad - t * arc; // left → right, curving up
    return {
      x: CX + radius * Math.cos(angle),
      y: CY - radius * Math.sin(angle),
    };
  });
}

// French political spectrum: left (red/rose) → center (purple) → right (blue)
const SPECTRUM = [
  "#dc2626", "#ef4444", "#f87171", "#fb7185",
  "#e879f9", "#c084fc", "#a78bfa",
  "#818cf8", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8",
];

function seatColor(i: number, total: number): string {
  const t = total <= 1 ? 0.5 : i / (total - 1);
  return SPECTRUM[Math.round(t * (SPECTRUM.length - 1))];
}

const ROWS = [
  { r: 36, n: 7, dotR: 5 },
  { r: 52, n: 9, dotR: 4.5 },
  { r: 68, n: 11, dotR: 4 },
];

interface Props {
  size?: number;
  /** Skip the dark circle background (for use on dark pages) */
  transparent?: boolean;
}

export function Logo({ size = 100, transparent = false }: Props) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
      {/* Background */}
      {!transparent && <Circle cx={CX} cy={CY} r={97} fill="#0c0820" />}

      {/* Compass outer ring */}
      <Circle cx={CX} cy={CY} r={89} fill="none" stroke="#312e81" strokeWidth={1.5} />

      {/* Crosshairs */}
      <Line x1={14} y1={CY} x2={186} y2={CY} stroke="#312e81" strokeWidth={0.7} />
      <Line x1={CX} y1={14} x2={CX} y2={186} stroke="#312e81" strokeWidth={0.7} />

      {/* Cardinal ticks (E, S, W — north is the hemicycle) */}
      <Line x1={11} y1={CY} x2={20} y2={CY} stroke="#4338ca" strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={189} y1={CY} x2={180} y2={CY} stroke="#4338ca" strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={CX} y1={189} x2={CX} y2={180} stroke="#4338ca" strokeWidth={2.5} strokeLinecap="round" />

      {/* Hemicycle seats (upper semicircle) */}
      {ROWS.map(({ r, n, dotR }, ri) =>
        arcPositions(r, n).map((pos, di) => (
          <Circle
            key={`${ri}-${di}`}
            cx={pos.x}
            cy={pos.y}
            r={dotR}
            fill={seatColor(di, n)}
            opacity={0.85}
          />
        ))
      )}

      {/* Compass needle — south (dim indigo) */}
      <Polygon
        points={`${CX},${CY + 72} ${CX - 7},${CY + 4} ${CX + 7},${CY + 4}`}
        fill="#6366f1"
        opacity={0.3}
      />

      {/* Compass needle — north (amber) */}
      <Polygon
        points={`${CX},${CY - 28} ${CX - 7},${CY - 4} ${CX + 7},${CY - 4}`}
        fill="#f59e0b"
      />

      {/* Center pivot */}
      <Circle cx={CX} cy={CY} r={3.5} fill="white" opacity={0.9} />
    </Svg>
  );
}
