import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DISPATCH — Uber Eats Intelligence",
  description: "Personal dispatch intelligence for Uber Eats drivers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Top nav */}
        <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span
                className="text-amber-400 font-bold tracking-[0.2em] text-sm uppercase"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                DISPATCH
              </span>
              <span className="text-zinc-700 text-xs font-mono hidden sm:block">
                / Conejo Valley Ops
              </span>
            </div>
            <div className="flex gap-1">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/log">Log Shift</NavLink>
              <NavLink href="/history">History</NavLink>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>

        <footer className="border-t border-zinc-900 text-center py-4 text-zinc-700 text-[10px] font-mono tracking-widest">
          DISPATCH v1.0 · CONEJO VALLEY · ACTIVE
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1 text-xs font-mono text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors tracking-wider uppercase"
    >
      {children}
    </Link>
  );
}
