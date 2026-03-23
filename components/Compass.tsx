import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Line, Rect, Text as SvgText, Polygon } from "react-native-svg";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { CompassPosition, ConcordanceEntry } from "@/lib/types";

const SIZE = 280;
const PADDING = 28;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - PADDING * 2) / 2;

interface Props {
  userPosition: CompassPosition;
  parties: ConcordanceEntry[];
  partyPositions?: Record<string, CompassPosition>;
  challengerPosition?: CompassPosition;
}

function toPixel(value: number, axis: "x" | "y"): number {
  if (axis === "x") return CENTER + value * RADIUS;
  return CENTER - value * RADIUS;
}

function starPoints(cx: number, cy: number, outerR: number): string {
  const innerR = outerR * 0.38;
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pts.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
    const innerAngle = outerAngle + Math.PI / 5;
    pts.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return pts.join(" ");
}

const FALLBACK_COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#d946ef",
];

export function Compass({ userPosition, parties, partyPositions, challengerPosition }: Props) {
  const partyDots = partyPositions
    ? parties
        .map((party, i) => {
          const pos = partyPositions[party.id];
          if (!pos) return null;
          const color = party.partyColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          return { ...party, pos, color };
        })
        .filter(Boolean) as Array<ConcordanceEntry & { pos: CompassPosition; color: string }>
    : [];

  const userX = toPixel(userPosition.x, "x");
  const userY = toPixel(userPosition.y, "y");
  const showUser = userPosition.xValid && userPosition.yValid;

  const starScale = useSharedValue(0);
  useEffect(() => {
    if (showUser) {
      starScale.value = withDelay(
        400,
        withSequence(
          withTiming(1.25, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0.9, { duration: 150 }),
          withTiming(1.1, { duration: 150 }),
          withTiming(1, { duration: 150 })
        )
      );
    }
  }, [showUser]);

  const starAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="items-center w-full"
      accessible
      accessibilityLabel={`Boussole politique. Votre position : économie ${userPosition.x.toFixed(1)}, société ${userPosition.y.toFixed(1)}`}
    >
      {/* Explicit centering wrapper for the SVG */}
      <View style={{ width: SIZE, alignSelf: "center" }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Quadrant zones */}
          <Rect x={PADDING} y={PADDING} width={RADIUS} height={RADIUS} fill="#dbeafe" opacity={0.3} />
          <Rect x={CENTER} y={PADDING} width={RADIUS} height={RADIUS} fill="#ede9fe" opacity={0.3} />
          <Rect x={PADDING} y={CENTER} width={RADIUS} height={RADIUS} fill="#fef3c7" opacity={0.3} />
          <Rect x={CENTER} y={CENTER} width={RADIUS} height={RADIUS} fill="#fce7f3" opacity={0.3} />

          {/* Grid lines */}
          <Line x1={PADDING} y1={CENTER} x2={SIZE - PADDING} y2={CENTER} stroke="#e2e8f0" strokeWidth={1} />
          <Line x1={CENTER} y1={PADDING} x2={CENTER} y2={SIZE - PADDING} stroke="#e2e8f0" strokeWidth={1} />

          {/* Axis labels */}
          <SvgText x={CENTER} y={14} textAnchor="middle" fontSize={11} fontWeight="600" fill="#64748b">
            Progressiste
          </SvgText>
          <SvgText x={CENTER} y={SIZE - 6} textAnchor="middle" fontSize={11} fontWeight="600" fill="#64748b">
            Conservateur
          </SvgText>
          <SvgText x={PADDING + 4} y={CENTER + 14} textAnchor="start" fontSize={10} fontWeight="600" fill="#64748b">
            {"État"}
          </SvgText>
          <SvgText x={SIZE - PADDING - 4} y={CENTER + 14} textAnchor="end" fontSize={10} fontWeight="600" fill="#64748b">
            {"Libéralisme"}
          </SvgText>

          {/* Party dots */}
          {partyDots.map((party) => (
            <Circle
              key={party.id}
              cx={toPixel(party.pos.x, "x")}
              cy={toPixel(party.pos.y, "y")}
              r={8}
              fill={party.color}
              opacity={0.7}
              stroke={party.color}
              strokeWidth={2}
              strokeOpacity={0.3}
            />
          ))}

          {/* Challenger position (challenge mode) */}
          {challengerPosition && challengerPosition.xValid && challengerPosition.yValid && (
            <Circle
              cx={toPixel(challengerPosition.x, "x")}
              cy={toPixel(challengerPosition.y, "y")}
              r={10}
              fill="#6366f1"
              stroke="white"
              strokeWidth={2}
              opacity={0.9}
            />
          )}

        </Svg>

        {/* Animated user star (overlay so we can use View transforms) */}
        {showUser && (
          <Animated.View
            style={[
              {
                position: "absolute",
                left: userX - 14,
                top: userY - 14,
                width: 28,
                height: 28,
              },
              starAnimStyle,
            ]}
          >
            <Svg width={28} height={28} viewBox="0 0 28 28">
              <Polygon
                points={starPoints(14, 14, 12)}
                fill="#f59e0b"
                stroke="white"
                strokeWidth={2}
              />
            </Svg>
          </Animated.View>
        )}
      </View>

      {/* Legend */}
      {(partyDots.length > 0 || challengerPosition) && (
        <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2 px-4">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs" style={{ color: "#f59e0b" }}>{"★"}</Text>
            <Text className="text-xs font-bold" style={{ color: "#d1d5db" }}>Vous</Text>
          </View>
          {challengerPosition && (
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />
              <Text className="text-xs font-bold" style={{ color: "#d1d5db" }}>Challenger</Text>
            </View>
          )}
          {partyDots.map((party) => (
            <View key={party.id} className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: party.color }} />
              <Text className="text-xs text-gray-500">{party.partyShortName || party.name}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}
