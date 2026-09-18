import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect, Text as SvgText,
} from 'react-native-svg';


// ─── Layout constants (internal SVG coordinate space) ─────────────────────────
const SVG_W = 380;
const SVG_H = 72;   // compact — leaves maximum room for the clock below

// Shallow upward-bowing quadratic bezier arc
const ARC_X1 = 372;  // right end → West (90°)
const ARC_X2 = 8;    // left  end → East (270°)
const ARC_Y0 = 50;   // y at both endpoints
const ARC_CX = 190;  // bezier control x (centre)
const ARC_CY = 32;   // bezier control y (above → upward bow, sag ≈ 18 px)

// 16 tick labels, right (West 90°) → left (East 270°)
const DEGREE_LABELS = [90, 78, 66, 54, 42, 30, 18, 6, 354, 342, 330, 318, 306, 294, 282, 270];

const BASE_FULL_MOON = new Date(2026, 6, 29);
const MS_PER_DAY = 86400000;

// ─── Fixed symmetric 15-day cycle ─────────────────────────────────────────────
//
// The arc uses a strict 30-day mathematical cycle, not the irregular length of
// an astronomical synodic month:
//   29 Jul 2026: full moon, waxing slot 15
//   30 Jul–13 Aug: waning slots 1–15, new moon on 13 Aug
//   14 Aug–28 Aug: waxing slots 1–15, full moon on 28 Aug
//
// This sequence continues indefinitely in both directions. Calendar data can
// therefore never cause a phase to be skipped.
//
function calendarDayNumber(date: Date): number {
  const dateAtUtcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const baseAtUtcMidnight = Date.UTC(
    BASE_FULL_MOON.getFullYear(),
    BASE_FULL_MOON.getMonth(),
    BASE_FULL_MOON.getDate(),
  );
  return Math.round((dateAtUtcMidnight - baseAtUtcMidnight) / MS_PER_DAY);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function getMoonSlot(date: Date): { isWaning: boolean; slot: number } {
  const daysSinceBase = calendarDayNumber(date);

  // The visual activation is intentionally two calendar days ahead of the
  // original reference alignment: the former slot 7 is shown as slot 8 today.
  // The underlying 15-day halves remain unchanged.
  const position = positiveModulo(daysSinceBase + 1, 30);
  const isWaning = position < 15;
  const slot = isWaning ? position + 1 : position - 14;

  return { isWaning, slot };
}

function formatHourOffset(solarNoonHour: number | null, offsetHours: number): string {
  if (solarNoonHour == null || !Number.isFinite(solarNoonHour)) return '--:--';
  const totalMinutes = (
    Math.round(solarNoonHour * 60) + offsetHours * 60 + 1440
  ) % 1440;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

// ─── Bezier helper ─────────────────────────────────────────────────────────────
function bezierPt(t: number): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * ARC_X1 + 2 * u * t * ARC_CX + t * t * ARC_X2,
    y: u * u * ARC_Y0 + 2 * u * t * ARC_CY + t * t * ARC_Y0,
  };
}

// ─── Moon phase icon ───────────────────────────────────────────────────────────
//
//  Strategy: dark background circle, then inside a circle clip:
//    • a rect covering the lit half
//    • for gibbous (fraction > 0.5): an extra lit ellipse widens coverage
//    • for crescent (fraction < 0.5): a dark ellipse narrows coverage
//
//  Waxing  (zunehmend)  → right side lit  (isRightLit = true)
//  Waning  (abnehmend)  → left  side lit  (isRightLit = false)
//
interface MoonIconProps {
  cx: number; cy: number; r: number;
  fraction: number;    // 0 = new moon, 1 = full moon
  isRightLit: boolean; // true = waxing (right lit); false = waning (left lit)
  litColor: string;
  darkColor: string;
  ringColor: string;
  idx: number;         // unique id for the clipPath
}

function MoonIcon({
  cx, cy, r, fraction, isRightLit, litColor, darkColor, ringColor, idx,
}: MoonIconProps) {
  const clipId  = `mp-${idx}`;
  const termRx  = r * Math.abs(Math.cos(fraction * Math.PI));
  const isNew   = fraction <= 0.02;
  const isFull  = fraction >= 0.98;
  const isCres  = !isNew && !isFull && fraction <  0.5;
  const isGibb  = !isNew && !isFull && fraction >= 0.5;

  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={cx} cy={cy} r={r} />
        </ClipPath>
      </Defs>

      {/* Dark background (also the final colour for new moon) */}
      <Circle cx={cx} cy={cy} r={r} fill={isFull ? litColor : darkColor} />

      {/* Lit region, clipped to the moon circle */}
      {!isNew && !isFull && (
        <G clipPath={`url(#${clipId})`}>
          {/* Base lit half: right for waxing, left for waning */}
          {isRightLit
            ? <Rect x={cx}         y={cy - r - 1} width={r + 2} height={r * 2 + 2} fill={litColor} />
            : <Rect x={cx - r - 2} y={cy - r - 1} width={r + 2} height={r * 2 + 2} fill={litColor} />
          }

          {/* Gibbous: extend lit coverage to the other side via terminator ellipse */}
          {isGibb && (
            <Ellipse cx={cx} cy={cy} rx={termRx} ry={r} fill={litColor} />
          )}

          {/* Crescent: shadow ellipse narrows the lit half back to a sliver */}
          {isCres && (
            <Ellipse cx={cx} cy={cy} rx={termRx} ry={r} fill={darkColor} />
          )}
        </G>
      )}

      {/* Ring outline */}
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth={0.8} />
    </G>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface Props {
  date: Date;
  containerWidth: number;
  solarNoonHour: number;
}

export default function MoonPhaseArc({ date, containerWidth, solarNoonHour }: Props) {
  const { isWaning, slot: currentSlot } = getMoonSlot(date);

  const moonR   = 7;
  const arcPath = `M ${ARC_X1} ${ARC_Y0} Q ${ARC_CX} ${ARC_CY} ${ARC_X2} ${ARC_Y0}`;

  // 16 tick positions
  const ticks = Array.from({ length: 16 }, (_, k) => ({
    ...bezierPt(k / 15),
    label: DEGREE_LABELS[k],
  }));

  // 15 moon slots (midpoint between consecutive ticks)
  const moonSlots = Array.from({ length: 15 }, (_, s) => {
    const slotNum  = s + 1;
    const pt       = bezierPt((s + 0.5) / 15);
    const isActive = slotNum === currentSlot;

    // Illuminated fraction:
    //   Waning  slot 1 (1st day after full moon) = 14/15 lit
    //           slot 15 (new moon)               =  0/15 lit
    //   Waxing  slot 1 (1st day after new moon)  =  1/15 lit
    //           slot 15 (full moon)              = 15/15 lit
    const fraction = isWaning ? (15 - slotNum) / 15 : slotNum / 15;

    const moonCy    = pt.y - moonR - 5;
    const litColor  = isActive ? '#c9a227' : '#4a5e6e';
    const darkColor = '#06080f';
    const ringColor = isActive ? '#c9a227' : '#263848';

    // Waning: left side lit  → isRightLit = false
    // Waxing: right side lit → isRightLit = true
    return { moonCx: pt.x, moonCy, fraction, litColor, darkColor, ringColor, isRightLit: !isWaning };
  });

  const labelColor = isWaning ? '#cc3333' : '#4488cc';
  const labelText  = isWaning
    ? `morning heaven waning moon ${formatHourOffset(solarNoonHour, -6)}`
    : `evening heaven waxing moon ${formatHourOffset(solarNoonHour, 6)}`;

  const svgHeight = Math.round(containerWidth * SVG_H / SVG_W);

  return (
    <View style={[styles.wrap, { width: containerWidth }]}>
      <Svg width={containerWidth} height={svgHeight} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>

        {/* Arc */}
        <Path d={arcPath} fill="none" stroke="#1e3048" strokeWidth={1.4} />

        {/* 16 tick marks + degree labels */}
        {ticks.map(({ x, y, label }, k) => (
          <G key={k}>
            <Line x1={x} y1={y} x2={x} y2={y + 6} stroke="#263c52" strokeWidth={1} />
            <SvgText
              x={x} y={y + 14}
              textAnchor="middle"
              fontSize={6.5} fill="#344c60"
            >
              {label}°
            </SvgText>
          </G>
        ))}

        {/* 15 moon phase icons */}
        {moonSlots.map(({ moonCx, moonCy, fraction, litColor, darkColor, ringColor, isRightLit }, i) => (
          <MoonIcon
            key={i} idx={i}
            cx={moonCx} cy={moonCy} r={moonR}
            fraction={fraction}
            isRightLit={isRightLit}
            litColor={litColor}
            darkColor={darkColor}
            ringColor={ringColor}
          />
        ))}

        {/* Section label */}
        <SvgText
          x={SVG_W / 2} y={SVG_H - 3}
          textAnchor="middle"
          fontSize={8.5} fill={labelColor} fontWeight="600"
        >
          {labelText}
        </SvgText>

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
});
