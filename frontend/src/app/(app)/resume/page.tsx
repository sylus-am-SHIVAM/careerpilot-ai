"use client";

import { useEffect, useState } from "react";
import { AiLoader, Button, Card, EmptyState, ErrorBox, Input, Label, List, PageHeader, ScoreRing, Spinner, Tag } from "@/components/ui";
import { ApiError, api, type ResumeData } from "@/lib/api";

export default function ResumePage() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ResumeData>("/resume")
      .then(setResume)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      if (role.trim()) body.append("target_role", role.trim());
      setResume(await api<ResumeData>("/resume/upload", { method: "POST", body }));
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    if (!confirm("Delete your resume and its analysis?")) return;
    try {
      await api("/resume", { method: "DELETE" });
      setResume(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const a = resume?.analysis;

  return (
    <>
      <PageHeader icon="📄" title="Resume Review" subtitle="Upload your resume (PDF) to get an AI review and suggestions." />

      <Card>
        <form onSubmit={upload} className="space-y-4">
          <div>
            <Label>Resume PDF (max 5 MB)</Label>
            <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
              <span className="text-3xl">{file ? "✅" : "📤"}</span>
              <span className="mt-2 text-sm font-semibold text-slate-800">{file ? file.name : "Click to choose your resume PDF"}</span>
              <span className="text-xs text-slate-500">{file ? `${(file.size / 1024).toFixed(0)} KB` : "Text-based PDF works best"}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>
          <div>
            <Label>Target role (optional)</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer Intern" />
          </div>
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Analysing..." : resume ? "⬆️ Upload new version" : "✨ Upload & analyse"}
            </Button>
            {resume && <Button type="button" variant="danger" onClick={remove}>Delete</Button>}
          </div>
        </form>
      </Card>

      {uploading && <div className="mt-6"><AiLoader title="Reading and reviewing your resume" /></div>}
      {loading && <div className="mt-6"><Spinner /></div>}
      {!loading && !uploading && !resume && (
        <div className="mt-6">
          <EmptyState icon="📝" title="No resume yet" text="Upload your resume to get a score, strengths, improvements and ATS tips." />
        </div>
      )}

      {resume && a && (
        <div className="mt-6 space-y-4">
          <Card className="animate-fade-up">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ScoreRing value={a.overall_score} size={112} label="/ 100" />
              <div>
                <p className="text-sm text-slate-500">{resume.filename}{resume.target_role ? ` · for ${resume.target_role}` : ""}</p>
                <p className="mt-1"><Tag tone="indigo">{a.experience_level}</Tag></p>
                <p className="mt-2 text-sm text-slate-600">{a.summary}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {a.extracted_skills.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-2 font-semibold text-emerald-700">💪 Strengths</h3>
              <List items={a.strengths} />
            </Card>
            <Card>
              <h3 className="mb-2 font-semibold text-amber-700">🛠️ Improvements</h3>
              <List items={a.improvements} />
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 font-semibold text-slate-900">🧾 Section feedback</h3>
            <div className="space-y-3">
              {a.section_feedback.map((s) => (
                <div key={s.section}>
                  <p className="text-sm font-medium text-slate-800">{s.section}</p>
                  <p className="text-sm text-slate-600">{s.feedback}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-2 font-semibold text-slate-900">🤖 ATS tips</h3>
              <List items={a.ats_tips} />
            </Card>
            <Card>
              <h3 className="mb-2 font-semibold text-slate-900">🎯 Suggested roles</h3>
              <div className="flex flex-wrap gap-2">
                {a.suggested_roles.map((r) => (
                  <Tag key={r} tone="indigo">{r}</Tag>
                ))}
              </div>
              {a.education.length > 0 && (
                <>
                  <h3 className="mb-2 mt-4 font-semibold text-slate-900">Education</h3>
                  <List items={a.education} />
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
