"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  { title: "Career Assessment", text: "Answer a short interest assessment and get matched to career categories." },
  { title: "AI Mentor", text: "Chat with a Gemini-powered mentor grounded in a curated career knowledge base (RAG)." },
  { title: "Learning Roadmaps", text: "Generate a week-by-week plan with skills, resources and projects for any goal." },
  { title: "Skill Gap Analysis", text: "See which skills you already have and what to learn next for a target role." },
  { title: "Resume Review", text: "Upload your PDF resume for a score, strengths, improvements and ATS tips." },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-16">
      <div className="text-center">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          AI-powered career guidance
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">CareerPilot AI</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Discover the right career path, learn the right skills and get personal guidance from an AI mentor.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            Get started
          </Link>
          <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Log in
          </Link>
        </div>
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
