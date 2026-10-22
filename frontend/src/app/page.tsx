"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  { icon: "🎯", title: "Career Assessment", text: "20 questions across 5 parameters match you to career areas and specific careers." },
  { icon: "🤖", title: "AI Mentor", text: "Chat with a Gemini-powered mentor grounded in a curated career knowledge base (RAG)." },
  { icon: "🛣️", title: "Learning Roadmaps", text: "A week-by-week plan with skills, resources and projects for any goal." },
  { icon: "📈", title: "Skill Gap Analysis", text: "See which skills you already have and what to learn next for a target role." },
  { icon: "📄", title: "Resume Review", text: "Upload your PDF resume for a score, strengths, improvements and ATS tips." },
  { icon: "📊", title: "Progress Dashboard", text: "Track your whole career journey in one place." },
];

const STEPS = [
  { title: "Discover", text: "Take the assessment and find careers that fit your interests and strengths." },
  { title: "Plan", text: "Check your skill gap and generate a personalised roadmap." },
  { title: "Grow", text: "Improve your resume and get guidance from your AI mentor anytime." },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <span className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-md shadow-indigo-200">🚀</span>
          CareerPilot <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">AI</span>
        </span>
        <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white">Log in</Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center md:pt-16">
        <span className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 animate-fade-up">
          ✨ AI-powered career guidance for students
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 animate-fade-up sm:text-6xl">
          Find the career that{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">fits you</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 animate-fade-up">
          Discover your strengths, plan the right skills and get personal guidance from an AI mentor – all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-3 animate-fade-up">
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5"
          >
            Get started – it&apos;s free
          </Link>
          <Link href="/login" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            I have an account
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 animate-fade-up">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">Everything you need to plan your career</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 text-2xl transition group-hover:scale-110">
                {f.icon}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
