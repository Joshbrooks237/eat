"use client";

import { useState, useCallback } from "react";
import ShiftTracker from "./ShiftTracker";
import ZoneMap from "./ZoneMap";
import EventsPanel from "./EventsPanel";
import type { LocalEvent } from "@/app/api/events/route";

interface ZoneStat {
  zone: string;
  total_gross: number;
  shift_count: number;
}

interface Props {
  zoneStats: ZoneStat[];
  events: LocalEvent[];
}

export default function LiveDashboard({ zoneStats, events }: Props) {
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);

  const handlePositionUpdate = useCallback((lat: number, lng: number) => {
    setDriverLat(lat);
    setDriverLng(lng);
  }, []);

  return (
    <div className="space-y-4">
      {/* Shift tracker bar */}
      <ShiftTracker onPositionUpdate={handlePositionUpdate} />

      {/* Map + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ZoneMap
            zoneStats={zoneStats}
            events={events}
            driverLat={driverLat}
            driverLng={driverLng}
          />
        </div>
        <div>
          <EventsPanel events={events} />
        </div>
      </div>
    </div>
  );
}
