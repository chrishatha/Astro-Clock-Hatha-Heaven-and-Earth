import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ClockFace from '@/components/ClockFace';
import PreviewDatePicker from '@/components/PreviewDatePicker';
import PreviewTimeSlider from '@/components/PreviewTimeSlider';
import { useClockContext } from '@/context/ClockContext';
import { getDaysSinceMar21 } from '@/utils/astronomy';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatSolarNoon(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function stepDay(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

export default function ClockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    now, previewDate, setPreviewDate, previewHour, setPreviewHour,
    solarNoon, location, locationConfirmed,
    layer2RotationDeg, layer3RotationDeg,
    sunAngleDeg, moonHandAngleDeg, crossRotationDeg,
    zodiacCurrentIndex, zodiacPrevIndex,
    fullMoonDay, firstQuarterDay, newMoonDay, lastQuarterDay,
  } = useClockContext();

  const isEpagomenal = getDaysSinceMar21(now) >= 360;
  const isPreview = previewDate !== null;

  // Blink until the user has explicitly confirmed a location at least once
  const noLocation = !locationConfirmed;

  // Continuous blink animation for the settings button
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const blinkLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (noLocation) {
      blinkLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.15, duration: 550, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1,    duration: 550, useNativeDriver: true }),
        ])
      );
      blinkLoop.current.start();
    } else {
      blinkLoop.current?.stop();
      blinkAnim.setValue(1);
    }
    return () => blinkLoop.current?.stop();
  }, [noLocation]);

  const { width } = Dimensions.get('window');
  const clockSize = Math.min(width - 16, 520);

  const topPad = insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad + 8, paddingBottom: botPad + 8 }]}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>

        {/* Row 1: time | title (centred) | [set location] gear */}
        <View style={styles.titleBar}>
          <Text style={styles.timeText}>{formatTime(now)}</Text>
          <Text style={styles.appTitle} numberOfLines={1}>Astro-Clock-HaTha</Text>

          {/* Settings area — blinks and shows label when no location set */}
          <View style={styles.settingsArea}>
            {noLocation && (
              <Text style={styles.setLocationText}>set location</Text>
            )}
            <Animated.View style={{ opacity: blinkAnim }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/settings')}
                style={[styles.settingsBtn, noLocation && styles.settingsBtnAlert]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="settings" size={22} color={noLocation ? '#ff6b35' : '#c9a227'} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Row 2: date badge | preview picker | step buttons */}
        <View style={styles.subBar}>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              {now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
            <View style={styles.sunDayBadge}>
              <Text style={styles.sunDayText}>☀ {Math.round(sunAngleDeg)}</Text>
            </View>
          </View>

          <View style={styles.previewRow}>
            {isPreview && (
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setPreviewDate(stepDay(previewDate!, -1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="chevron-left" size={14} color="#c9a227" />
              </TouchableOpacity>
            )}
            <PreviewDatePicker previewDate={previewDate} onSet={setPreviewDate} />
            {isPreview && (
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setPreviewDate(stepDay(previewDate!, +1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="chevron-right" size={14} color="#c9a227" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Time slider (preview mode only) ───────────────────────── */}
      {isPreview && (
        <View style={styles.sliderPanel}>
          <PreviewTimeSlider hour={previewHour} onChange={setPreviewHour} />
        </View>
      )}

      {/* ── Clock ──────────────────────────────────────────────────── */}
      <View style={styles.clockContainer}>
        <ClockFace
          size={clockSize}
          layer2RotationDeg={layer2RotationDeg}
          layer3RotationDeg={layer3RotationDeg}
          sunAngleDeg={sunAngleDeg}
          moonHandAngleDeg={moonHandAngleDeg}
          crossRotationDeg={crossRotationDeg}
          zodiacCurrentIndex={zodiacCurrentIndex}
          zodiacPrevIndex={zodiacPrevIndex}
          fullMoonDay={fullMoonDay}
          firstQuarterDay={firstQuarterDay}
          newMoonDay={newMoonDay}
          lastQuarterDay={lastQuarterDay}
          isEpagomenal={isEpagomenal}
        />
      </View>

      {/* ── Info bar ───────────────────────────────────────────────── */}
      <View style={styles.infoBar}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Solar Noon</Text>
            <Text style={styles.infoValue}>{formatSolarNoon(solarNoon)}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{location.name}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Lat / Lon</Text>
            <Text style={styles.infoValue}>
              {location.latitude.toFixed(2)}° / {location.longitude.toFixed(2)}°
            </Text>
          </View>
        </View>
        <View style={styles.infoSep} />
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🌕 Full Moon</Text>
            <Text style={styles.infoValue}>
              {fullMoonDay != null
                ? `${String(fullMoonDay).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.`
                : '--'}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🌑 New Moon</Text>
            <Text style={styles.infoValue}>
              {newMoonDay != null
                ? `${String(newMoonDay).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.`
                : '--'}
            </Text>
          </View>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06080f',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 2,
    gap: 4,
  },

  // Row 1: strict 3-column — time | title | settings area
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  timeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e8d5a3',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
  },
  appTitle: {
    flex: 1,
    fontSize: 11,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  settingsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  setLocationText: {
    fontSize: 10,
    color: '#ff6b35',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#0f1a28',
    borderWidth: 1,
    borderColor: '#1e2d42',
  },
  settingsBtnAlert: {
    borderColor: '#ff6b35',
    backgroundColor: '#1a0a00',
  },

  // Row 2: date | preview row
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#7a8a9a',
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
  },
  sunDayBadge: {
    backgroundColor: '#1a1400',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#4a3a00',
  },
  sunDayText: {
    fontSize: 11,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },

  // Preview pill + step buttons
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#0f1a28',
    borderWidth: 1,
    borderColor: '#c9a227',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Slider ────────────────────────────────────────────────────────
  sliderPanel: {
    width: '100%',
    backgroundColor: '#0a1220',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#c9a22733',
    paddingBottom: 4,
  },

  // ── Clock ─────────────────────────────────────────────────────────
  clockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },

  // ── Info bar ──────────────────────────────────────────────────────
  infoBar: {
    backgroundColor: '#0a1220',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1e2d42',
    width: '92%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 3,
  },
  infoSep: {
    height: 1,
    backgroundColor: '#1e2d42',
    marginHorizontal: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: '#5a6a7a',
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 11,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e2d42',
  },
});
