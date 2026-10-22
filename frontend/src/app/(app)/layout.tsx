"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assessment", label: "Assessment" },
  { href: "/mentor", label: "AI Mentor" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/skill-gap", label: "Skill Gap" },
  { href: "/resume", label: "Resume" },
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

  const nav = NAV.map((item) => {
    const active = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMenuOpen(false)}
        className={`rounded-lg px-3 py-2 text-sm font-medium ${
          active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-lg font-bold text-indigo-600">CareerPilot AI</Link>
          <button className="text-sm text-slate-600 md:hidden" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        <nav className={`${menuOpen ? "flex" : "hidden"} flex-col gap-1 px-3 pb-4 md:flex`}>
          {nav}
          <div className="mt-4 border-t border-slate-200 px-3 pt-4">
            <p className="truncate text-sm font-medium text-slate-900">{user.full_name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="mt-3 text-sm text-red-600 hover:underline"
            >
              Log out
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
