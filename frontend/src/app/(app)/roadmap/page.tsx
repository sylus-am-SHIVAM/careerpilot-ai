"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorBox, Input, Label, List, PageHeader, Spinner, Tag } from "@/components/ui";
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
      <PageHeader title="Learning Roadmap" subtitle="Generate a week-by-week plan for any career goal." />

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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
              {generating ? "Generating (can take ~30s)..." : "Generate roadmap"}
            </Button>
          </div>
        </form>
      </Card>

      {loading && <div className="mt-6"><Spinner /></div>}

      {roadmaps.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {roadmaps.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selected?.id === r.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600"
              }`}
            >
              {r.goal}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">{selected.content.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{selected.content.summary}</p>
          </Card>
          {selected.content.phases.map((phase, i) => (
            <Card key={i}>
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
              <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                <span className="font-semibold">Project: </span>
                {phase.project}
              </div>
            </Card>
          ))}
          <Card>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Final outcome: </span>
              {selected.content.final_outcome}
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
