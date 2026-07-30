import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, {
  Circle,
  Line,
  Rect,
  Text as SvgText,
  Polygon,
} from "react-native-svg";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { CompassPosition, ConcordanceEntry } from "@/lib/types";

const SIZE = 296;
const PADDING = 30;
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
  const innerR = outerR * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pts.push(
      `${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`,
    );
    const innerAngle = outerAngle + Math.PI / 5;
    pts.push(
      `${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`,
    );
  }
  return pts.join(" ");
}

const FALLBACK_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#d946ef",
];

export function Compass({
  userPosition,
  parties,
  partyPositions,
  challengerPosition,
}: Props) {
  const partyDots = partyPositions
    ? (parties
        .map((party, i) => {
          const pos = partyPositions[party.id];
          if (!pos) return null;
          const color =
            party.partyColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const code = party.partyShortName || party.name;
          return { ...party, pos, color, code };
        })
        .filter(Boolean) as Array<
        ConcordanceEntry & { pos: CompassPosition; color: string; code: string }
      >)
    : [];

  const userX = toPixel(userPosition.x, "x");
  const userY = toPixel(userPosition.y, "y");
  const showUser = userPosition.xValid && userPosition.yValid;

  const reducedMotion = useReducedMotion();
  const starScale = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!showUser) return;
    if (reducedMotion) {
      starScale.value = 1;
      return;
    }
    starScale.value = withDelay(
      400,
      withSequence(
        withTiming(1.25, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0.9, { duration: 150 }),
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      ),
    );
  }, [showUser, reducedMotion]);

  const starAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="items-center w-full"
      accessible
      accessibilityLabel={`Boussole politique. Ta position : économie ${userPosition.x.toFixed(1)}, société ${userPosition.y.toFixed(1)}`}
    >
      <View style={{ width: SIZE, alignSelf: "center" }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Quadrant zones */}
          <Rect
            x={PADDING}
            y={PADDING}
            width={RADIUS}
            height={RADIUS}
            fill="#dbeafe"
            opacity={0.35}
          />
          <Rect
            x={CENTER}
            y={PADDING}
            width={RADIUS}
            height={RADIUS}
            fill="#ede9fe"
            opacity={0.35}
          />
          <Rect
            x={PADDING}
            y={CENTER}
            width={RADIUS}
            height={RADIUS}
            fill="#fef3c7"
            opacity={0.35}
          />
          <Rect
            x={CENTER}
            y={CENTER}
            width={RADIUS}
            height={RADIUS}
            fill="#fce7f3"
            opacity={0.35}
          />

          {/* Concentric rings */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * 0.5}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={1}
          />

          {/* Grid cross */}
          <Line
            x1={PADDING}
            y1={CENTER}
            x2={SIZE - PADDING}
            y2={CENTER}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <Line
            x1={CENTER}
            y1={PADDING}
            x2={CENTER}
            y2={SIZE - PADDING}
            stroke="#e2e8f0"
            strokeWidth={1}
          />

          {/* Axis labels */}
          <SvgText
            x={CENTER}
            y={16}
            textAnchor="middle"
            fontSize={11}
            fontWeight="700"
            fill="#8a90a2"
          >
            Progressiste
          </SvgText>
          <SvgText
            x={CENTER}
            y={SIZE - 8}
            textAnchor="middle"
            fontSize={11}
            fontWeight="700"
            fill="#8a90a2"
          >
            Conservateur
          </SvgText>
          <SvgText
            x={PADDING - 4}
            y={CENTER - 8}
            textAnchor="start"
            fontSize={11}
            fontWeight="700"
            fill="#8a90a2"
          >
            {"État"}
          </SvgText>
          <SvgText
            x={SIZE - PADDING + 4}
            y={CENTER - 8}
            textAnchor="end"
            fontSize={11}
            fontWeight="700"
            fill="#8a90a2"
          >
            {"Libéralisme"}
          </SvgText>

          {/* Party dots + party code label (white, on the dot) */}
          {partyDots.map((party) => {
            const cx = toPixel(party.pos.x, "x");
            const cy = toPixel(party.pos.y, "y");
            return (
              <React.Fragment key={party.id}>
                <Circle
                  cx={cx}
                  cy={cy}
                  r={9}
                  fill={party.color}
                  opacity={0.78}
                />
                <SvgText
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight="700"
                  fill="#ffffff"
                >
                  {party.code}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Challenger position (challenge mode) */}
          {challengerPosition &&
            challengerPosition.xValid &&
            challengerPosition.yValid && (
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
          <>
            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: userX - 15,
                  top: userY - 15,
                  width: 30,
                  height: 30,
                },
                starAnimStyle,
              ]}
              pointerEvents="none"
            >
              <Svg width={30} height={30} viewBox="0 0 30 30">
                <Polygon
                  points={starPoints(15, 15, 13)}
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth={2.5}
                />
              </Svg>
            </Animated.View>

            {/* "Toi" chip anchored above the star */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: userX - 22,
                top: userY - 46,
                width: 44,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#1f2430",
                  paddingVertical: 3,
                  paddingHorizontal: 9,
                  borderRadius: 999,
                }}
              >
                <Text
                  className="font-body-700"
                  style={{ color: "#fff", fontSize: 11 }}
                >
                  Toi
                </Text>
              </View>
              {/* Downward pointer */}
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 5,
                  borderRightWidth: 5,
                  borderTopWidth: 5,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: "#1f2430",
                }}
              />
            </View>
          </>
        )}
      </View>

      {/* Legend */}
      {(partyDots.length > 0 || challengerPosition) && (
        <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2 px-4">
          <View className="flex-row items-center gap-1.5">
            <Text style={{ color: "#f59e0b", fontSize: 12 }}>{"★"}</Text>
            <Text
              className="font-body-700"
              style={{ color: "#6b7280", fontSize: 12 }}
            >
              Toi
            </Text>
          </View>
          {challengerPosition && (
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#6366f1" }}
              />
              <Text
                className="font-body-700"
                style={{ color: "#6b7280", fontSize: 12 }}
              >
                Challenger
              </Text>
            </View>
          )}
          {partyDots.map((party) => (
            <View key={party.id} className="flex-row items-center gap-1.5">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: party.color }}
              />
              <Text
                className="font-body"
                style={{ color: "#6b7280", fontSize: 12 }}
              >
                {party.code}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}
