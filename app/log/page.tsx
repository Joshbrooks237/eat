import ShiftForm from "@/components/ShiftForm";

export default function LogPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-mono uppercase">
            Shift Entry
          </span>
        </div>
        <h1
          className="text-3xl font-bold text-zinc-100 tracking-wide"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          LOG A SHIFT
        </h1>
        <p className="text-zinc-600 font-mono text-xs mt-1">
          Miles auto-estimated via OSRM from home → zone → home. Override if needed.
        </p>
      </div>

      <div className="bg-[#1f1f23] border border-zinc-700/50 rounded-lg p-6">
        <ShiftForm />
      </div>
    </div>
  );
}
