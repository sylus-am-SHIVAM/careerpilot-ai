"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, PageHeader, ProgressBar, Spinner, Tag } from "@/components/ui";
import {
  api,
  type Assessment,
  type AssessmentResult,
  type Recommendation,
  type ResumeData,
  type Roadmap,
  type SkillGapReport,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Summary = {
  assessment: Assessment | null;
  result: AssessmentResult | null;
  recommendation: Recommendation | null;
  resume: ResumeData | null;
  roadmaps: Roadmap[];
  skillGaps: SkillGapReport[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    async function load() {
      const assessments = await api<Assessment[]>("/assessments/").catch(() => []);
      const assessment = assessments[0] ?? null;
      const [result, recommendation, resume, roadmaps, skillGaps] = await Promise.all([
        assessment ? api<AssessmentResult>(`/assessments/${assessment.id}/result`).catch(() => null) : null,
        assessment ? api<Recommendation>(`/assessments/${assessment.id}/recommendation`).catch(() => null) : null,
        api<ResumeData>("/resume").catch(() => null),
        api<Roadmap[]>("/roadmap").catch(() => []),
        api<SkillGapReport[]>("/skill-gap").catch(() => []),
      ]);
      setData({ assessment, result, recommendation, resume, roadmaps, skillGaps });
    }
    load();
  }, []);

  if (!data) return <Spinner />;

  const top = data.recommendation?.top_categories[0];

  return (
    <>
      <PageHeader title={`Hi, ${user?.full_name.split(" ")[0]} 👋`} subtitle="Here is your career progress at a glance." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Career assessment</h2>
            <Link href="/assessment" className="text-sm text-indigo-600">Open →</Link>
          </div>
          {data.result ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-slate-600">
                {data.result.answered_questions} of {data.result.total_questions} questions answered
              </p>
              <ProgressBar value={data.result.completion_percentage} />
              {top && (
                <p className="pt-2 text-sm">
                  Best fit: <Tag tone="indigo">{top.name}</Tag>
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Take the assessment to discover your best-fit careers.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Resume</h2>
            <Link href="/resume" className="text-sm text-indigo-600">Open →</Link>
          </div>
          {data.resume ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-slate-600">{data.resume.filename}</p>
              <p className="text-3xl font-bold text-slate-900">
                {data.resume.analysis.overall_score}
                <span className="text-base font-normal text-slate-400">/100</span>
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Upload your resume for an AI review.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Learning roadmaps</h2>
            <Link href="/roadmap" className="text-sm text-indigo-600">Open →</Link>
          </div>
          {data.roadmaps.length ? (
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {data.roadmaps.slice(0, 3).map((r) => (
                <li key={r.id}>• {r.content.title}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Generate a personalised roadmap for your goal.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Skill gap</h2>
            <Link href="/skill-gap" className="text-sm text-indigo-600">Open →</Link>
          </div>
          {data.skillGaps[0] ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-slate-600">{data.skillGaps[0].target_role}</p>
              <ProgressBar value={data.skillGaps[0].content.readiness_score} />
              <p className="text-sm text-slate-500">{data.skillGaps[0].content.readiness_score}% ready</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Check how ready you are for a target role.</p>
          )}
        </Card>
      </div>

      <Card className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-slate-900">Have a question about your career?</h2>
          <p className="text-sm text-slate-500">Your AI mentor knows your assessment and resume.</p>
        </div>
        <Link href="/mentor" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Ask the AI mentor
        </Link>
      </Card>
    </>
  );
}
