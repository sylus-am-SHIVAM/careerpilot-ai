"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, ScoreRing, Spinner, Tag } from "@/components/ui";
import {
  api,
  type Assessment,
  type AssessmentResult,
  type ChatMessage,
  type Recommendation,
  type ResumeData,
  type Roadmap,
  type SkillGapReport,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORY_STYLE } from "@/lib/career";

type Summary = {
  result: AssessmentResult | null;
  recommendation: Recommendation | null;
  resume: ResumeData | null;
  roadmaps: Roadmap[];
  skillGaps: SkillGapReport[];
  chats: ChatMessage[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    async function load() {
      const assessments = await api<Assessment[]>("/assessments/").catch(() => []);
      const assessment = assessments[0] ?? null;
      const [result, recommendation, resume, roadmaps, skillGaps, chats] = await Promise.all([
        assessment ? api<AssessmentResult>(`/assessments/${assessment.id}/result`).catch(() => null) : null,
        assessment ? api<Recommendation>(`/assessments/${assessment.id}/recommendation`).catch(() => null) : null,
        api<ResumeData>("/resume").catch(() => null),
        api<Roadmap[]>("/roadmap").catch(() => []),
        api<SkillGapReport[]>("/skill-gap").catch(() => []),
        api<ChatMessage[]>("/chat/history").catch(() => []),
      ]);
      setData({ result, recommendation, resume, roadmaps, skillGaps, chats });
    }
    load();
  }, []);

  if (!data) return <Spinner />;

  const assessmentDone = !!data.result && data.result.answered_questions === data.result.total_questions;
  const steps = [
    { done: assessmentDone, label: "Take the career assessment", href: "/assessment", icon: "🎯" },
    { done: !!data.resume, label: "Upload your resume", href: "/resume", icon: "📄" },
    { done: data.skillGaps.length > 0, label: "Check your skill gap", href: "/skill-gap", icon: "📈" },
    { done: data.roadmaps.length > 0, label: "Generate a learning roadmap", href: "/roadmap", icon: "🛣️" },
    { done: data.chats.length > 0, label: "Ask the AI mentor a question", href: "/mentor", icon: "🤖" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);
  const top = data.recommendation?.top_categories[0];
  const topStyle = top ? CATEGORY_STYLE[top.key] : null;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-indigo-200 animate-fade-up md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-white/80">Welcome back 👋</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Hi, {user?.full_name.split(" ")[0]}!</h1>
            <p className="mt-2 max-w-md text-white/85">
              {nextStep
                ? `Your next step: ${nextStep.label.toLowerCase()}.`
                : "You have completed every step. Keep following your roadmap! 🎉"}
            </p>
            {nextStep && (
              <Link
                href={nextStep.href}
                className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"
              >
                {nextStep.icon} Continue →
              </Link>
            )}
          </div>
          <div className="rounded-2xl bg-white/15 p-4 md:w-72">
            <div className="flex justify-between text-sm">
              <span>Career journey</span>
              <span className="font-semibold">{doneCount}/{steps.length}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white animate-grow" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className={`flex items-center gap-2 ${s.done ? "text-white/70 line-through" : "text-white"}`}>
                    <span>{s.done ? "✅" : "⬜"}</span>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-fade-up">
          <CardTitle icon="🎯" title="Career match" href="/assessment" />
          {top && topStyle ? (
            <div className="mt-4">
              <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${topStyle.gradient} p-4 text-white`}>
                <span className="text-3xl">{topStyle.icon}</span>
                <div>
                  <p className="text-xs text-white/80">Best fit</p>
                  <p className="font-semibold">{top.name}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.recommendation?.career_matches.slice(0, 3).map((m) => (
                  <Tag key={m.name} tone="indigo">{m.name}</Tag>
                ))}
              </div>
              {!assessmentDone && data.result && (
                <p className="mt-3 text-xs text-amber-600">
                  {data.result.answered_questions}/{data.result.total_questions} answered – finish for an accurate result.
                </p>
              )}
            </div>
          ) : (
            <Empty text="Answer 20 quick questions to discover your best-fit careers." />
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle icon="📄" title="Resume score" href="/resume" />
          {data.resume ? (
            <div className="mt-4 flex items-center gap-5">
              <ScoreRing value={data.resume.analysis.overall_score} label="score" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{data.resume.filename}</p>
                <p className="mt-1 text-sm text-slate-500 line-clamp-3">{data.resume.analysis.summary}</p>
              </div>
            </div>
          ) : (
            <Empty text="Upload your PDF resume for an instant AI review." />
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle icon="📈" title="Skill readiness" href="/skill-gap" />
          {data.skillGaps[0] ? (
            <div className="mt-4 flex items-center gap-5">
              <ScoreRing value={data.skillGaps[0].content.readiness_score} label="ready" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{data.skillGaps[0].target_role}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {data.skillGaps[0].content.missing_skills.length} skills to learn next
                </p>
              </div>
            </div>
          ) : (
            <Empty text="See how ready you are for your dream role." />
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle icon="🛣️" title="Learning roadmaps" href="/roadmap" />
          {data.roadmaps.length ? (
            <ul className="mt-4 space-y-2">
              {data.roadmaps.slice(0, 3).map((r) => (
                <li key={r.id} className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{r.content.title}</p>
                  <p className="text-xs text-slate-500">{r.content.phases.length} phases</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="Get a week-by-week plan for any goal." />
          )}
        </Card>
      </div>

      <Card className="flex flex-col items-start justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white sm:flex-row sm:items-center animate-fade-up">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">🤖</span>
          <div>
            <h2 className="font-semibold">Confused about your next step?</h2>
            <p className="text-sm text-white/70">Your AI mentor knows your assessment and resume. Ask anything.</p>
          </div>
        </div>
        <Link href="/mentor" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
          Chat with mentor →
        </Link>
      </Card>
    </div>
  );
}

function CardTitle({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">{icon}</span>
        {title}
      </h2>
      <Link href={href} className="text-sm font-medium text-indigo-600 hover:underline">Open →</Link>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
