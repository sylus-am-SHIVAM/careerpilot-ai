"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorBox, Input, Label, List, PageHeader, ProgressBar, Spinner, Tag } from "@/components/ui";
import { api, type SkillGapReport } from "@/lib/api";

const PRIORITY_TONE = { high: "red", medium: "amber", low: "slate" } as const;

export default function SkillGapPage() {
  const [reports, setReports] = useState<SkillGapReport[]>([]);
  const [selected, setSelected] = useState<SkillGapReport | null>(null);
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SkillGapReport[]>("/skill-gap")
      .then((list) => {
        setReports(list);
        setSelected(list[0] ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setAnalyzing(true);
    try {
      const report = await api<SkillGapReport>("/skill-gap", {
        method: "POST",
        body: JSON.stringify({
          target_role: role,
          current_skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      setReports((prev) => [report, ...prev]);
      setSelected(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse skill gap");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <PageHeader title="Skill Gap Analysis" subtitle="Compare your skills with what a target role needs." />

      <Card>
        <form onSubmit={analyze} className="space-y-4">
          <div>
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend Developer" required minLength={2} />
          </div>
          <div>
            <Label>Your current skills (comma separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, SQL, Git" />
            <p className="mt-1 text-xs text-slate-500">Leave empty to use the skills from your uploaded resume.</p>
          </div>
          <ErrorBox message={error} />
          <Button type="submit" disabled={analyzing}>
            {analyzing ? "Analysing (can take ~20s)..." : "Analyse skill gap"}
          </Button>
        </form>
      </Card>

      {loading && <div className="mt-6"><Spinner /></div>}

      {reports.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selected?.id === r.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600"
              }`}
            >
              {r.target_role}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{selected.target_role}</h2>
              <span className="text-2xl font-bold text-indigo-600">{selected.content.readiness_score}%</span>
            </div>
            <div className="mt-2"><ProgressBar value={selected.content.readiness_score} /></div>
            <p className="mt-3 text-sm text-slate-600">{selected.content.summary}</p>
            {selected.content.matching_skills.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Skills you already have</p>
                <div className="flex flex-wrap gap-2">
                  {selected.content.matching_skills.map((s) => (
                    <Tag key={s} tone="green">{s}</Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900">Skills to learn</h3>
            <div className="mt-3 divide-y divide-slate-100">
              {selected.content.missing_skills.map((m) => (
                <div key={m.skill} className="py-3">
                  <div className="flex items-center gap-2">
                    <Tag tone={PRIORITY_TONE[m.priority]}>{m.priority}</Tag>
                    <p className="font-medium text-slate-900">{m.skill}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{m.reason}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">How to learn: </span>
                    {m.how_to_learn}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 font-semibold text-slate-900">Next steps</h3>
            <List items={selected.content.next_steps} />
          </Card>
        </div>
      )}
    </>
  );
}
