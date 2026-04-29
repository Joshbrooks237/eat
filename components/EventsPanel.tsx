"use client";

import type { LocalEvent } from "@/app/api/events/route";

const CATEGORY_ICON: Record<string, string> = {
  Music: "🎵",
  Sports: "🏟",
  Arts: "🎭",
  Film: "🎬",
  Family: "👨‍👩‍👧",
  Miscellaneous: "⚡",
};

function icon(cat: string) {
  return CATEGORY_ICON[cat] ?? "⚡";
}

export default function EventsPanel({ events }: { events: LocalEvent[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.date === today);
  const upcomingEvents = events.filter((e) => e.date > today).slice(0, 4);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[10px] tracking-widest text-zinc-500 font-mono uppercase">
          Local Events
        </span>
        {todayEvents.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded">
            {todayEvents.length} TODAY
          </span>
        )}
      </div>

      <div className="p-4">
        {events.length === 0 ? (
          <div className="text-zinc-700 font-mono text-sm text-center py-4">
            No events found — add TICKETMASTER_API_KEY to enable live events.
          </div>
        ) : (
          <div className="space-y-2">
            {[...todayEvents, ...upcomingEvents].map((evt) => (
              <a
                key={evt.id}
                href={evt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-2.5 rounded bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors group"
              >
                <span className="text-lg mt-0.5">{icon(evt.category)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-200 font-mono text-xs font-bold truncate group-hover:text-amber-400 transition-colors">
                    {evt.name}
                  </div>
                  <div className="text-zinc-500 font-mono text-[10px]">{evt.venue}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[10px] font-mono font-bold ${evt.date === today ? "text-amber-400" : "text-zinc-500"}`}>
                    {evt.date === today ? "TODAY" : evt.date.slice(5)}
                  </div>
                  {evt.time && (
                    <div className="text-[10px] font-mono text-zinc-600">
                      {evt.time.slice(0, 5)}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-zinc-700">{evt.zone.split(" ")[0]}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
