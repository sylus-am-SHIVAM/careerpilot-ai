"use client";

import { useEffect, useState } from "react";
import { AiLoader, Button, Card, EmptyState, ErrorBox, Input, Label, List, PageHeader, Spinner, Tag } from "@/components/ui";
import { api, type Roadmap } from "@/lib/api";

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selected, setSelected] = useState<Roadmap | null>(null);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [weeks, setWeeks] = useState(12);
  const [hours, setHours] = useState(10);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Roadmap[]>("/roadmap")
      .then((list) => {
        setRoadmaps(list);
        setSelected(list[0] ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const roadmap = await api<Roadmap>("/roadmap/generate", {
        method: "POST",
        body: JSON.stringify({ goal, current_level: level, duration_weeks: weeks, hours_per_week: hours }),
      });
      setRoadmaps((prev) => [roadmap, ...prev]);
      setSelected(roadmap);
      setGoal("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate roadmap");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <PageHeader icon="🛣️" title="Learning Roadmap" subtitle="Generate a week-by-week plan for any career goal." />

      <Card>
        <form onSubmit={generate} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Goal</Label>
            <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Become a Data Scientist" required minLength={2} />
          </div>
          <div>
            <Label>Current level</Label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Weeks</Label>
              <Input type="number" min={2} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
            </div>
            <div>
              <Label>Hours / week</Label>
              <Input type="number" min={1} max={60} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <ErrorBox message={error} />
            <Button type="submit" disabled={generating} className="mt-2">
              {generating ? "Generating..." : "✨ Generate roadmap"}
            </Button>
          </div>
        </form>
      </Card>

      {generating && <div className="mt-6"><AiLoader title="Building your personalised roadmap" /></div>}
      {loading && <div className="mt-6"><Spinner /></div>}
      {!loading && !generating && roadmaps.length === 0 && (
        <div className="mt-6">
          <EmptyState icon="🗺️" title="No roadmap yet" text="Enter a goal like “Become a Data Scientist” and get a week-by-week plan." />
        </div>
      )}

      {roadmaps.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {roadmaps.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selected?.id === r.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              }`}
            >
              {r.goal}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg shadow-indigo-200 animate-fade-up">
            <p className="text-sm text-white/80">🗺️ Your roadmap · {selected.content.phases.length} phases</p>
            <h2 className="mt-1 text-2xl font-bold">{selected.content.title}</h2>
            <p className="mt-2 text-sm text-white/85">{selected.content.summary}</p>
          </div>
          <div className="relative space-y-4 border-l-2 border-dashed border-indigo-200 pl-6 md:ml-4">
          {selected.content.phases.map((phase, i) => (
            <Card key={i} className="relative animate-fade-up">
              <span className="absolute -left-[42px] top-5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow ring-4 ring-white">
                {i + 1}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="indigo">{phase.weeks}</Tag>
                <h3 className="font-semibold text-slate-900">{phase.title}</h3>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Goals</p>
                  <List items={phase.goals} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Resources</p>
                  <List items={phase.resources} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {phase.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
                <span className="font-semibold">🛠️ Project: </span>
                {phase.project}
              </div>
            </Card>
          ))}
          </div>
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">🏁 Final outcome: </span>
              {selected.content.final_outcome}
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
