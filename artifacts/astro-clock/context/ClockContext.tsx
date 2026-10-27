import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import {
  calculateSolarNoon,
  getCrossRotation,
  getDatePartsInTimeZone,
  getLocationTimeZone,
  getMoonHandAngle,
  getMoonPhaseEvents,
  getSunAngle,
  getZodiacIndex,
  getZodiacRotation,
  type MoonPhaseEvent,
  type MoonPhaseEvents,
} from '@/utils/astronomy';

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

export interface ClockValues {
  now: Date;
  previewDate: Date | null;
  setPreviewDate: (d: Date | null) => void;
  previewHour: number;
  setPreviewHour: (h: number) => void;
  location: Location;
  locationTimeZone: string;
  moonPhaseEvents: MoonPhaseEvents;
  usingGPS: boolean;
  /** true once the user has explicitly saved any location (persists across restarts) */
  locationConfirmed: boolean;
  /** Clears locationConfirmed and resets to default — triggers the blink reminder again */
  resetLocation: () => void;
  solarNoon: Date | null;
  solarNoonHour: number;
  layer2RotationDeg: number;
  layer3RotationDeg: number;
  sunAngleDeg: number;
  moonHandAngleDeg: number;
  crossRotationDeg: number;
  zodiacCurrentIndex: number;
  zodiacPrevIndex: number;
  fullMoonDay: number | null;
  firstQuarterDay: number | null;
  newMoonDay: number | null;
  lastQuarterDay: number | null;
  setLocation: (loc: Location) => void;
  setUsingGPS: (v: boolean) => void;
  refreshGPS: () => void;
}

const DEFAULT_LOCATION: Location = { latitude: 48.2, longitude: 16.37, name: 'Vienna' };

const ClockContext = createContext<ClockValues | null>(null);

function computeLayer2Rotation(date: Date): number {
  let h = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  if (h === 0) h = 24;
  return ((h - 1) * 15) % 360;
}

function buildEffective(previewDate: Date, previewHour: number): Date {
  const d = new Date(previewDate);
  const h = Math.floor(previewHour);
  const m = Math.floor((previewHour - h) * 60);
  const s = Math.floor(((previewHour - h) * 60 - m) * 60);
  d.setHours(h, m, s, 0);
  return d;
}

export function ClockProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(new Date());
  const [previewDate, setPreviewDateState] = useState<Date | null>(null);
  const [previewHour, setPreviewHour] = useState<number>(12);
  const [location, setLocationState] = useState<Location>(DEFAULT_LOCATION);
  const [usingGPS, setUsingGPSState] = useState(false);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [locationConfirmed, setLocationConfirmedState] = useState(false);
  const [confirmedLoaded, setConfirmedLoaded] = useState(false);

  // Seed previewHour from live clock when a preview date is chosen
  const setPreviewDate = useCallback((d: Date | null) => {
    setPreviewDateState(d);
    if (d !== null) {
      const live = new Date();
      setPreviewHour(live.getHours() + live.getMinutes() / 60 + live.getSeconds() / 3600);
    }
  }, []);

  const effective = previewDate ? buildEffective(previewDate, previewHour) : now;

  // ── Restore from storage ────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.multiGet(['clockLocation', 'locationConfirmed']).then(pairs => {
      const locVal = pairs[0][1];
      const confVal = pairs[1][1];

      if (locVal) {
        try {
          const saved = JSON.parse(locVal) as { loc: Location; gps: boolean };
          setLocationState(saved.loc);
          setUsingGPSState(saved.gps);
        } catch {}
      }
      if (confVal === 'true') {
        setLocationConfirmedState(true);
      }
      setLocationLoaded(true);
      setConfirmedLoaded(true);
    });
  }, []);

  // ── Persist location ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!locationLoaded) return;
    AsyncStorage.setItem('clockLocation', JSON.stringify({ loc: location, gps: usingGPS }));
  }, [location, usingGPS, locationLoaded]);

  // ── Persist locationConfirmed ───────────────────────────────────────────────
  useEffect(() => {
    if (!confirmedLoaded) return;
    AsyncStorage.setItem('locationConfirmed', locationConfirmed ? 'true' : 'false');
  }, [locationConfirmed, confirmedLoaded]);

  // ── Public setters ──────────────────────────────────────────────────────────
  const setLocation = useCallback((loc: Location) => {
    setLocationState(loc);
    setLocationConfirmedState(true);
  }, []);

  const resetLocation = useCallback(() => {
    setLocationState(DEFAULT_LOCATION);
    setUsingGPSState(false);
    setLocationConfirmedState(false);
  }, []);

  const setUsingGPS = useCallback((v: boolean) => {
    setUsingGPSState(v);
    if (v) {
      setLocationConfirmedState(true); // enabling GPS confirms location
      refreshGPS();
    }
  }, []);

  const refreshGPS = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            setLocationState({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, name: 'GPS' });
            setLocationConfirmedState(true);
          },
          () => {},
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }
    } else {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocationState({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, name: 'GPS' });
          setLocationConfirmedState(true);
        }
      } catch {}
    }
  }, []);

  // ── Live clock tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-GPS on mount if opted in
  useEffect(() => {
    if (locationLoaded && usingGPS) refreshGPS();
  }, [locationLoaded]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const solarNoon = calculateSolarNoon(effective, location.latitude, location.longitude);
  const solarNoonHour = solarNoon.getHours() + solarNoon.getMinutes() / 60;

  const layer2RotationDeg = computeLayer2Rotation(effective);

  const baseZodiacRotation = getZodiacRotation(effective);
  const currentHour = effective.getHours() + effective.getMinutes() / 60 + effective.getSeconds() / 3600;
  const hoursFromNoon = currentHour - solarNoonHour;
  const layer3RotationDeg = ((baseZodiacRotation + hoursFromNoon * 15) % 360 + 360) % 360;

  const sunAngleDeg = getSunAngle(effective);
  const moonHandAngleDeg = getMoonHandAngle(effective);
  const locationTimeZone = useMemo(
    () => getLocationTimeZone(location.latitude, location.longitude),
    [location.latitude, location.longitude],
  );
  const locationDate = getDatePartsInTimeZone(effective, locationTimeZone);
  const moonPhaseEvents = useMemo(
    () => getMoonPhaseEvents(locationDate.year, locationDate.month, locationTimeZone),
    [locationDate.year, locationDate.month, locationTimeZone],
  );
  const representativeDay = (events: MoonPhaseEvent[]): number | null => {
    const upcoming = events.find(event => event.instant.getTime() >= effective.getTime());
    const selected = upcoming ?? events[events.length - 1];
    return selected?.day ?? null;
  };
  const fullMoonDay = representativeDay(moonPhaseEvents.fullMoon);
  const firstQuarterDay = representativeDay(moonPhaseEvents.firstQuarter);
  const newMoonDay = representativeDay(moonPhaseEvents.newMoon);
  const lastQuarterDay = representativeDay(moonPhaseEvents.lastQuarter);
  const crossRotationDeg = getCrossRotation(fullMoonDay);
  const zodiacCurrentIndex = getZodiacIndex(effective);
  const zodiacPrevIndex = (zodiacCurrentIndex - 1 + 12) % 12;

  return (
    <ClockContext.Provider value={{
      now: effective,
      previewDate, setPreviewDate,
      previewHour, setPreviewHour,
      location, locationTimeZone, moonPhaseEvents,
      usingGPS, locationConfirmed, resetLocation,
      solarNoon, solarNoonHour,
      layer2RotationDeg, layer3RotationDeg, sunAngleDeg,
      moonHandAngleDeg, crossRotationDeg, zodiacCurrentIndex, zodiacPrevIndex,
      fullMoonDay, firstQuarterDay, newMoonDay, lastQuarterDay,
      setLocation, setUsingGPS, refreshGPS,
    }}>
      {children}
    </ClockContext.Provider>
  );
}

export function useClockContext(): ClockValues {
  const ctx = useContext(ClockContext);
  if (!ctx) throw new Error('useClockContext must be used within ClockProvider');
  return ctx;
}
