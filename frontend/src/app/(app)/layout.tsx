"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/assessment", label: "Assessment", icon: "🎯" },
  { href: "/mentor", label: "AI Mentor", icon: "🤖" },
  { href: "/roadmap", label: "Roadmap", icon: "🛣️" },
  { href: "/skill-gap", label: "Skill Gap", icon: "📈" },
  { href: "/resume", label: "Resume", icon: "📄" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const initials = user.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav = NAV.map((item) => {
    const active = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
            : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
        }`}
      >
        <span className="text-base">{item.icon}</span>
        {item.label}
      </Link>
    );
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white/80 backdrop-blur md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg shadow-md shadow-indigo-200">
              🚀
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CareerPilot <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
          <button className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? "✕ Close" : "☰ Menu"}
          </button>
        </div>
        <nav className={`${menuOpen ? "flex" : "hidden"} flex-col gap-1 px-3 pb-4 md:flex md:h-[calc(100vh-5rem)]`}>
          {nav}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:mt-auto">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-1.5 text-sm text-slate-600 hover:border-red-200 hover:text-red-600"
            >
              Log out
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
