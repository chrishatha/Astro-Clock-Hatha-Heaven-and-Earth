import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  calculateSolarNoon,
  getCrossRotation,
  getMoonHandAngle,
  getMoonPhaseDays,
  getSunAngle,
  getZodiacIndex,
  getZodiacRotation,
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
  previewHour: number;           // 0–24, fractional minutes
  setPreviewHour: (h: number) => void;
  location: Location;
  usingGPS: boolean;
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

/** Build a Date that has previewDate's calendar day but previewHour's time */
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

  // When a preview date is chosen, seed the hour from current live time
  const setPreviewDate = useCallback((d: Date | null) => {
    setPreviewDateState(d);
    if (d !== null) {
      const live = new Date();
      setPreviewHour(live.getHours() + live.getMinutes() / 60 + live.getSeconds() / 3600);
    }
  }, []);

  // The date used for all clock computations
  const effective = previewDate ? buildEffective(previewDate, previewHour) : now;

  // Restore saved location
  useEffect(() => {
    AsyncStorage.getItem('clockLocation').then(val => {
      if (val) {
        try {
          const saved = JSON.parse(val) as { loc: Location; gps: boolean };
          setLocationState(saved.loc);
          setUsingGPSState(saved.gps);
        } catch {}
      }
      setLocationLoaded(true);
    });
  }, []);

  // Persist location changes
  useEffect(() => {
    if (!locationLoaded) return;
    AsyncStorage.setItem('clockLocation', JSON.stringify({ loc: location, gps: usingGPS }));
  }, [location, usingGPS, locationLoaded]);

  const setLocation = useCallback((loc: Location) => setLocationState(loc), []);

  const setUsingGPS = useCallback((v: boolean) => {
    setUsingGPSState(v);
    if (v) refreshGPS();
  }, []);

  const refreshGPS = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => setLocationState({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, name: 'GPS' }),
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
        }
      } catch {}
    }
  }, []);

  // Tick every second — only drives live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto GPS on mount if opted in
  useEffect(() => {
    if (locationLoaded && usingGPS) refreshGPS();
  }, [locationLoaded]);

  const solarNoon = calculateSolarNoon(effective, location.latitude, location.longitude);
  const solarNoonHour = solarNoon.getHours() + solarNoon.getMinutes() / 60;

  const layer2RotationDeg = computeLayer2Rotation(effective);

  const baseZodiacRotation = getZodiacRotation(effective);
  const currentHour = effective.getHours() + effective.getMinutes() / 60 + effective.getSeconds() / 3600;
  const hoursFromNoon = currentHour - solarNoonHour;
  const layer3RotationDeg = ((baseZodiacRotation + hoursFromNoon * 15) % 360 + 360) % 360;

  const sunAngleDeg = getSunAngle(effective);
  const moonHandAngleDeg = getMoonHandAngle(effective);
  const crossRotationDeg = getCrossRotation(effective.getFullYear(), effective.getMonth());
  const zodiacCurrentIndex = getZodiacIndex(effective);
  const zodiacPrevIndex = (zodiacCurrentIndex - 1 + 12) % 12;

  const {
    fullMoon: fullMoonDay,
    firstQuarter: firstQuarterDay,
    newMoon: newMoonDay,
    lastQuarter: lastQuarterDay,
  } = getMoonPhaseDays(effective.getFullYear(), effective.getMonth());

  return (
    <ClockContext.Provider value={{
      now: effective,
      previewDate,
      setPreviewDate,
      previewHour,
      setPreviewHour,
      location, usingGPS, solarNoon, solarNoonHour,
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
