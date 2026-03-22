import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import Animated, { FadeIn, useSharedValue, useAnimatedProps, withSpring } from "react-native-reanimated";
import { AXIS_LABELS } from "@/lib/theme-labels";
import type { CompassPosition, ConcordanceEntry } from "@/lib/types";

const SIZE = 300;
const PADDING = 40;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - PADDING * 2) / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  userPosition: CompassPosition;
  parties: ConcordanceEntry[];
  partyPositions?: Record<string, CompassPosition>;
}

function toPixel(value: number, axis: "x" | "y"): number {
  if (axis === "x") return CENTER + value * RADIUS;
  return CENTER - value * RADIUS; // Y is inverted in SVG
}

export function Compass({ userPosition, parties, partyPositions }: Props) {
  // Spring animation for user dot
  const userCx = useSharedValue(CENTER);
  const userCy = useSharedValue(CENTER);
  const userR = useSharedValue(0);

  React.useEffect(() => {
    if (userPosition.xValid && userPosition.yValid) {
      userCx.value = withSpring(toPixel(userPosition.x, "x"), { damping: 12 });
      userCy.value = withSpring(toPixel(userPosition.y, "y"), { damping: 12 });
      userR.value = withSpring(10, { damping: 8 });
    }
  }, [userPosition]);

  const animatedUserDot = useAnimatedProps(() => ({
    cx: userCx.value,
    cy: userCy.value,
    r: userR.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="items-center"
      accessible
      accessibilityLabel={`Boussole politique. Votre position : économie ${userPosition.x.toFixed(1)}, société ${userPosition.y.toFixed(1)}`}
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Grid lines */}
        <Line x1={PADDING} y1={CENTER} x2={SIZE - PADDING} y2={CENTER} stroke="#e2e8f0" strokeWidth={1} />
        <Line x1={CENTER} y1={PADDING} x2={CENTER} y2={SIZE - PADDING} stroke="#e2e8f0" strokeWidth={1} />

        {/* Axis labels */}
        <SvgText x={CENTER} y={PADDING - 8} textAnchor="middle" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.society.positive}
        </SvgText>
        <SvgText x={CENTER} y={SIZE - PADDING + 16} textAnchor="middle" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.society.negative}
        </SvgText>
        <SvgText x={PADDING - 4} y={CENTER + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.economy.negative}
        </SvgText>
        <SvgText x={SIZE - PADDING + 4} y={CENTER + 4} textAnchor="start" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.economy.positive}
        </SvgText>

        {/* Party dots */}
        {partyPositions &&
          parties.map((party) => {
            const pos = partyPositions[party.id];
            if (!pos) return null;
            return (
              <Circle
                key={party.id}
                cx={toPixel(pos.x, "x")}
                cy={toPixel(pos.y, "y")}
                r={12}
                fill="#6366f1"
                opacity={0.2}
              />
            );
          })}

        {/* Party labels */}
        {partyPositions &&
          parties.slice(0, 8).map((party) => {
            const pos = partyPositions[party.id];
            if (!pos) return null;
            return (
              <SvgText
                key={`label-${party.id}`}
                x={toPixel(pos.x, "x")}
                y={toPixel(pos.y, "y") + 4}
                textAnchor="middle"
                fontSize={8}
                fill="#6366f1"
                opacity={0.6}
              >
                {party.partyShortName}
              </SvgText>
            );
          })}

        {/* User dot (spring animated) */}
        {userPosition.xValid && userPosition.yValid && (
          <AnimatedCircle
            animatedProps={animatedUserDot}
            fill="#6366f1"
            stroke="white"
            strokeWidth={3}
          />
        )}
      </Svg>
    </Animated.View>
  );
}
