/**
 * Generates assets/logo.svg — a standalone SVG of the app logo.
 * Use this file as source for app icon PNGs (e.g. via Figma, CloudConvert, etc.)
 *
 * Run: npx tsx scripts/generate-logo-svg.ts
 */

import { writeFileSync } from "fs";

const SIZE = 200;
const CX = 100;
const CY = 100;

function arcPositions(radius: number, count: number) {
  const pad = 0.15;
  const arc = Math.PI - 2 * pad;
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const angle = Math.PI - pad - t * arc;
    return {
      x: CX + radius * Math.cos(angle),
      y: CY - radius * Math.sin(angle),
    };
  });
}

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

const lines: string[] = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="1024" height="1024">`,
  `  <circle cx="${CX}" cy="${CY}" r="97" fill="#0c0820" />`,
  `  <circle cx="${CX}" cy="${CY}" r="89" fill="none" stroke="#312e81" stroke-width="1.5" />`,
  // Crosshairs
  `  <line x1="14" y1="${CY}" x2="186" y2="${CY}" stroke="#312e81" stroke-width="0.7" />`,
  `  <line x1="${CX}" y1="14" x2="${CX}" y2="186" stroke="#312e81" stroke-width="0.7" />`,
  // Cardinal ticks
  `  <line x1="11" y1="${CY}" x2="20" y2="${CY}" stroke="#4338ca" stroke-width="2.5" stroke-linecap="round" />`,
  `  <line x1="189" y1="${CY}" x2="180" y2="${CY}" stroke="#4338ca" stroke-width="2.5" stroke-linecap="round" />`,
  `  <line x1="${CX}" y1="189" x2="${CX}" y2="180" stroke="#4338ca" stroke-width="2.5" stroke-linecap="round" />`,
];

// Hemicycle seats
for (const { r, n, dotR } of ROWS) {
  for (const [i, pos] of arcPositions(r, n).entries()) {
    lines.push(
      `  <circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${dotR}" fill="${seatColor(i, n)}" opacity="0.85" />`
    );
  }
}

// Compass needle — south
lines.push(
  `  <polygon points="${CX},${CY + 72} ${CX - 7},${CY + 4} ${CX + 7},${CY + 4}" fill="#6366f1" opacity="0.3" />`
);
// Compass needle — north
lines.push(
  `  <polygon points="${CX},${CY - 28} ${CX - 7},${CY - 4} ${CX + 7},${CY - 4}" fill="#f59e0b" />`
);
// Center pivot
lines.push(`  <circle cx="${CX}" cy="${CY}" r="3.5" fill="white" opacity="0.9" />`);
lines.push(`</svg>`);

const svg = lines.join("\n");
writeFileSync("assets/logo.svg", svg);
console.log("Generated assets/logo.svg (1024x1024)");
