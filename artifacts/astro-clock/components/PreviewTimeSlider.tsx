import Slider from '@react-native-community/slider';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface Props {
  hour: number;           // 0–24 fractional
  onChange: (h: number) => void;
}

function pad(n: number) { return String(Math.floor(n)).padStart(2, '0'); }

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${pad(hh)}:${pad(mm)}`;
}

// Hour labels shown below the track
const LABELS = ['0', '6', '12', '18', '24'];
const LABEL_PCTS = [0, 0.25, 0.5, 0.75, 1];

// ─── Web version (native range input) ─────────────────────────────────────────
function WebSlider({ hour, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>{formatHour(hour)}</Text>
        <Text style={styles.timeSuffix}> h</Text>
      </View>
      <View style={styles.trackWrap}>
        {/* @ts-ignore */}
        <input
          type="range"
          min={0}
          max={24}
          step={1 / 60}
          value={hour}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#c9a227',
            height: 4,
            cursor: 'pointer',
            background: `linear-gradient(to right, #c9a227 ${(hour / 24) * 100}%, #1e2d42 ${(hour / 24) * 100}%)`,
          }}
        />
        <View style={styles.labelRow}>
          {LABELS.map((l, i) => (
            <Text key={l} style={[styles.tickLabel, i === 0 && { textAlign: 'left' }, i === LABELS.length - 1 && { textAlign: 'right' }]}>
              {l}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Native version ────────────────────────────────────────────────────────────
function NativeSlider({ hour, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>{formatHour(hour)}</Text>
        <Text style={styles.timeSuffix}> h</Text>
      </View>
      <View style={styles.trackWrap}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={24}
          step={1 / 60}
          value={hour}
          onValueChange={onChange}
          minimumTrackTintColor="#c9a227"
          maximumTrackTintColor="#1e2d42"
          thumbTintColor="#c9a227"
        />
        <View style={styles.labelRow}>
          {LABELS.map((l, i) => (
            <Text key={l} style={[styles.tickLabel, i === 0 && { textAlign: 'left' }, i === LABELS.length - 1 && { textAlign: 'right' }]}>
              {l}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function PreviewTimeSlider(props: Props) {
  if (Platform.OS === 'web') return <WebSlider {...props} />;
  return <NativeSlider {...props} />;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 22,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 3,
  },
  timeSuffix: {
    fontSize: 13,
    color: '#7a8a9a',
    fontFamily: 'Inter_400Regular',
  },
  trackWrap: {
    gap: 2,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  tickLabel: {
    fontSize: 9,
    color: '#3a5a6a',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    flex: 1,
  },
});
