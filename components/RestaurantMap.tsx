"use client";

import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "@/app/api/restaurants/route";

const ZONES = [
  { name: "Thousand Oaks", lat: 34.1706, lng: -118.8376 },
  { name: "Simi Valley", lat: 34.2694, lng: -118.7815 },
  { name: "Moorpark", lat: 34.2856, lng: -118.882 },
  { name: "Westlake Village", lat: 34.1453, lng: -118.8192 },
  { name: "Camarillo", lat: 34.2164, lng: -119.0376 },
  { name: "Agoura Hills", lat: 34.1531, lng: -118.7617 },
];

export default function RestaurantMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then((d) => {
        setRestaurants(d.restaurants ?? []);
        setCount(d.count ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Fix default marker icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([34.21, -118.83], 11);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      // Zone circles
      for (const zone of ZONES) {
        L.circle([zone.lat, zone.lng], {
          radius: 3000,
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.05,
          weight: 1,
        })
          .addTo(map)
          .bindTooltip(zone.name, {
            permanent: true,
            direction: "center",
            className: "zone-label",
          });
      }

      // Restaurant dots
      const dotIcon = L.circleMarker([0, 0], {
        radius: 4,
        fillColor: "#ef4444",
        color: "#dc2626",
        weight: 1,
        fillOpacity: 0.7,
      });
      void dotIcon;

      for (const r of restaurants) {
        L.circleMarker([r.lat, r.lng], {
          radius: 4,
          fillColor: "#ef4444",
          color: "#dc2626",
          weight: 1,
          fillOpacity: 0.7,
        })
          .addTo(map)
          .bindPopup(`<strong>${r.name}</strong>${r.cuisine ? `<br/>${r.cuisine}` : ""}`);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, restaurants]);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-[10px] tracking-widest text-zinc-500 font-mono uppercase">
          Restaurant Signal Map
        </span>
        {!loading && (
          <span className="text-[10px] font-mono text-red-400">
            {count} food spots
          </span>
        )}
        {loading && (
          <span className="text-[10px] font-mono text-zinc-600 animate-pulse">
            Loading signals...
          </span>
        )}
      </div>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <style>{`
        .zone-label {
          background: transparent;
          border: none;
          box-shadow: none;
          color: #f59e0b;
          font-size: 10px;
          font-family: monospace;
          font-weight: bold;
          text-shadow: 0 0 4px #000;
        }
        .leaflet-container {
          background: #111;
        }
      `}</style>
      <div ref={mapRef} style={{ height: "420px", width: "100%" }} />
    </div>
  );
}
