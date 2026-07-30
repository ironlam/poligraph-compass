import React from "react";
import Svg, {
  Path,
  Circle,
  Line,
  Polygon,
  Rect,
  type SvgProps,
} from "react-native-svg";

// Minimal local icon set (lucide geometry, ISC) rendered with react-native-svg.
// Kept in-repo to avoid a runtime dependency and to guarantee identical output
// on web and native. Stroke style matches lucide: 24-grid, round caps/joins.

export interface IconProps {
  size?: number;
  color?: string;
  style?: SvgProps["style"];
}

function IconBase({
  size = 24,
  color = "#1f2430",
  children,
  style,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </Svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Circle cx={12} cy={12} r={10} />
      <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </IconBase>
  );
}

export function TimerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Line x1={10} x2={14} y1={2} y2={2} />
      <Line x1={12} x2={15} y1={14} y2={11} />
      <Circle cx={12} cy={14} r={8} />
    </IconBase>
  );
}

export function ListChecksIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="m3 17 2 2 4-4" />
      <Path d="m3 7 2 2 4-4" />
      <Path d="M13 6h8" />
      <Path d="M13 12h8" />
      <Path d="M13 18h8" />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Rect width={18} height={11} x={3} y={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IconBase>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275z" />
      <Path d="M5 3v4" />
      <Path d="M19 17v4" />
      <Path d="M3 5h4" />
      <Path d="M17 19h4" />
    </IconBase>
  );
}

export function Share2Icon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Circle cx={18} cy={5} r={3} />
      <Circle cx={6} cy={12} r={3} />
      <Circle cx={18} cy={19} r={3} />
      <Line x1={8.59} x2={15.42} y1={13.51} y2={17.49} />
      <Line x1={15.41} x2={8.59} y1={6.51} y2={10.49} />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M5 12h14" />
      <Path d="M12 5v14" />
    </IconBase>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <Path d="m9 11 3 3L22 4" />
    </IconBase>
  );
}
