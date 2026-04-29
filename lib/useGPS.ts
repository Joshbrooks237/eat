import { useState, useEffect, useCallback, useRef } from "react";
import { detectZone, nearestZone } from "./zones";

export type GPSStatus = "idle" | "requesting" | "active" | "denied" | "unavailable";

export interface GPSState {
  status: GPSStatus;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  detectedZone: string | null;
  error: string | null;
}

export function useGPS(onPing?: (lat: number, lng: number, accuracy: number | null) => void) {
  const [state, setState] = useState<GPSState>({
    status: "idle",
    lat: null,
    lng: null,
    accuracy: null,
    detectedZone: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const onPingRef = useRef(onPing);
  onPingRef.current = onPing;

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, status: "unavailable", error: "Geolocation not supported on this device." }));
      return;
    }

    setState((s) => ({ ...s, status: "requesting", error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const detected = detectZone(lat, lng) ?? nearestZone(lat, lng);
        setState({
          status: "active",
          lat,
          lng,
          accuracy: Math.round(accuracy),
          detectedZone: detected,
          error: null,
        });
        onPingRef.current?.(lat, lng, Math.round(accuracy));
      },
      (err) => {
        if (err.code === 1) {
          setState((s) => ({ ...s, status: "denied", error: "Location access denied. Select zone manually." }));
        } else {
          setState((s) => ({ ...s, status: "unavailable", error: `GPS error: ${err.message}` }));
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000,
      }
    );
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((s) => ({ ...s, status: "idle" }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, start, stop };
}
