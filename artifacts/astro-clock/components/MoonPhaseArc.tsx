import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { getLunarPhase } from '@/utils/astronomy';

// ─── Layout constants (internal SVG coordinate space) ─────────────────────────
const SVG_W = 380;
const SVG_H = 148;

// Quadratic bezier arc: right endpoint (West), left endpoint (East), control pt
const ARC_X1 = 372;  // right end = West = 90°
const ARC_X2 = 8;    // left end  = East = 270°
const ARC_Y0 = 100;  // y at both endpoints (same height)
const ARC_CX = 190;  // bezier control x (centre)
const ARC_CY = 70;   // bezier control y (above → upward bow, sag ≈ 30 px)

// 16 tick marks from right (West 90°) to left (East 270°)
const DEGREE_LABELS = [90, 78, 66, 54, 42, 30, 18, 6, 354, 342, 330, 318, 306, 294, 282, 270];

const SYNODIC_MONTH = 29.53058867;
const SYNODIC_HALF  = SYNODIC_MONTH / 2; // ≈14.77 days per half-cycle

// ─── Bezier helper ─────────────────────────────────────────────────────────────
function bezierPt(t: number): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * ARC_X1 + 2 * u * t * ARC_CX + t * t * ARC_X2,
    y: u * u * ARC_Y0 + 2 * u * t * ARC_CY + t * t * ARC_Y0,
  };
}

// ─── Moon crescent SVG path ────────────────────────────────────────────────────
// fraction : 0 = new moon (completely dark) → 1 = full moon (completely lit)
// isWaxing : true = lit side on right;  false = lit side on left
function moonCrescentPath(
  cx: number, cy: number, r: number,
  fraction: number, isWaxing: boolean,
): string {
  const topY = cy - r;
  const botY = cy + r;

  // Horizontal radius of the elliptical terminator
  const termRx = r * Math.abs(Math.cos(fraction * Math.PI));

  // Waxing: right semicircle (clockwise, sweep=1)
  // Waning: left  semicircle (counter-clockwise, sweep=0)
  const litSweep  = isWaxing ? 1 : 0;
  const termSweep = isWaxing
    ? (fraction < 0.5 ? 1 : 0)
    : (fraction < 0.5 ? 0 : 1);

  return (
    `M ${cx} ${topY}` +
    ` A ${r} ${r} 0 0 ${litSweep} ${cx} ${botY}` +
    ` A ${termRx} ${r} 0 0 ${termSweep} ${cx} ${topY} Z`
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  date: Date;
  containerWidth: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function MoonPhaseArc({ date, containerWidth }: Props) {
  // Lunar phase: 0 = new moon, ~0.5 = full moon
  const lunarPhase = getLunarPhase(date);
  const isWaning   = lunarPhase >= 0.5;

  // How many days into the current half-cycle?
  const dayInHalf = isWaning
    ? (lunarPhase - 0.5) * SYNODIC_MONTH   // days since full moon
    : lunarPhase * SYNODIC_MONTH;           // days since new moon

  // Which of the 15 slots is active now? (1-indexed)
  const slotDuration = SYNODIC_HALF / 15;
  const currentSlot  = Math.max(1, Math.min(15, Math.ceil(dayInHalf / slotDuration)));

  const moonR = 12;

  // Arc path
  const arcPath = `M ${ARC_X1} ${ARC_Y0} Q ${ARC_CX} ${ARC_CY} ${ARC_X2} ${ARC_Y0}`;

  // 16 tick positions
  const ticks = Array.from({ length: 16 }, (_, k) => {
    const pt = bezierPt(k / 15);
    return { ...pt, label: DEGREE_LABELS[k] };
  });

  // 15 moon slots (midpoints between ticks)
  const moonSlots = Array.from({ length: 15 }, (_, s) => {
    const slotNum = s + 1;
    const pt      = bezierPt((s + 0.5) / 15);
    const isActive = slotNum === currentSlot;

    // Illuminated fraction:
    //   Waning  slot 1 (just after full) → 14/15, slot 15 (new moon) → 0/15
    //   Waxing  slot 1 (just after new)  →  1/15, slot 15 (full moon) → 15/15
    const fraction = isWaning
      ? (15 - slotNum) / 15
      : slotNum / 15;

    const moonCx = pt.x;
    const moonCy = pt.y - moonR - 7;   // above the arc

    const litColor   = isActive ? '#c9a227' : '#50606e';
    const darkColor  = '#06080f';
    const ringColor  = isActive ? '#c9a227' : '#38485a';

    const isFullMoon = fraction >= 0.97;
    const isNewMoon  = fraction <= 0.03;

    return { moonCx, moonCy, fraction, litColor, darkColor, ringColor, isFullMoon, isNewMoon, isActive };
  });

  // Label colour + text depends on phase direction
  const labelColor = isWaning ? '#cc3333' : '#4488cc';
  const labelText  = isWaning
    ? 'Morgenhimmel abnehmender Mond'
    : 'Abendhimmel zunehmender Mond';

  // Scale SVG to container width
  const svgHeight = Math.round(containerWidth * SVG_H / SVG_W);

  return (
    <View style={[styles.wrap, { width: containerWidth }]}>
      <Svg
        width={containerWidth}
        height={svgHeight}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        {/* ── Arc ──────────────────────────────────────────────────────────── */}
        <Path d={arcPath} fill="none" stroke="#1e3048" strokeWidth={1.6} />

        {/* ── 16 tick marks + degree labels ────────────────────────────────── */}
        {ticks.map(({ x, y, label }, k) => (
          <G key={k}>
            <Line
              x1={x} y1={y} x2={x} y2={y + 10}
              stroke="#2e4a62" strokeWidth={1.2}
            />
            <SvgText
              x={x} y={y + 22}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={8.5} fill="#445a6e"
            >
              {label}°
            </SvgText>
          </G>
        ))}

        {/* ── 15 moon phase icons ───────────────────────────────────────────── */}
        {moonSlots.map(({
          moonCx, moonCy, fraction, litColor, darkColor, ringColor,
          isFullMoon, isNewMoon,
        }, i) => (
          <G key={i}>
            {/* Background (shadow side) */}
            <Circle
              cx={moonCx} cy={moonCy} r={moonR}
              fill={isFullMoon ? litColor : darkColor}
            />
            {/* Lit crescent / gibbous / full */}
            {!isNewMoon && !isFullMoon && (
              <Path
                d={moonCrescentPath(moonCx, moonCy, moonR, fraction, !isWaning)}
                fill={litColor}
              />
            )}
            {/* Ring outline */}
            <Circle
              cx={moonCx} cy={moonCy} r={moonR}
              fill="none" stroke={ringColor} strokeWidth={0.9}
            />
          </G>
        ))}

        {/* ── Section label ─────────────────────────────────────────────────── */}
        <SvgText
          x={SVG_W / 2} y={SVG_H - 6}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={10.5} fill={labelColor}
          fontWeight="600"
        >
          {labelText}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
});
