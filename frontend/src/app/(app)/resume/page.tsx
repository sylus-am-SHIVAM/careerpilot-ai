"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorBox, Input, Label, List, PageHeader, Spinner, Tag } from "@/components/ui";
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
      <PageHeader title="Resume Review" subtitle="Upload your resume (PDF) to get an AI review and suggestions." />

      <Card>
        <form onSubmit={upload} className="space-y-4">
          <div>
            <Label>Resume PDF (max 5 MB)</Label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700"
            />
          </div>
          <div>
            <Label>Target role (optional)</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer Intern" />
          </div>
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Analysing (can take ~30s)..." : resume ? "Upload new version" : "Upload & analyse"}
            </Button>
            {resume && <Button type="button" variant="danger" onClick={remove}>Delete</Button>}
          </div>
        </form>
      </Card>

      {loading && <div className="mt-6"><Spinner /></div>}

      {resume && a && (
        <div className="mt-6 space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{resume.filename}{resume.target_role ? ` · for ${resume.target_role}` : ""}</p>
                <p className="mt-1"><Tag tone="indigo">{a.experience_level}</Tag></p>
              </div>
              <p className="text-4xl font-bold text-slate-900">
                {a.overall_score}<span className="text-base font-normal text-slate-400">/100</span>
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-600">{a.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {a.extracted_skills.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-2 font-semibold text-green-700">Strengths</h3>
              <List items={a.strengths} />
            </Card>
            <Card>
              <h3 className="mb-2 font-semibold text-amber-700">Improvements</h3>
              <List items={a.improvements} />
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 font-semibold text-slate-900">Section feedback</h3>
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
              <h3 className="mb-2 font-semibold text-slate-900">ATS tips</h3>
              <List items={a.ats_tips} />
            </Card>
            <Card>
              <h3 className="mb-2 font-semibold text-slate-900">Suggested roles</h3>
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
