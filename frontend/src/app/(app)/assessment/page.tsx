"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, ErrorBox, PageHeader, ProgressBar, Spinner, Tag } from "@/components/ui";
import {
  api,
  type Assessment,
  type AssessmentResult,
  type Question,
  type Recommendation,
  type UserAnswer,
} from "@/lib/api";

export default function AssessmentPage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingQuestion, setSavingQuestion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshResults = useCallback(async (assessmentId: number) => {
    setResult(await api<AssessmentResult>(`/assessments/${assessmentId}/result`));
    setRecommendation(await api<Recommendation>(`/assessments/${assessmentId}/recommendation`).catch(() => null));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const list = await api<Assessment[]>("/assessments/");
        const first = list[0];
        if (!first) return;
        setAssessment(first);
        const [qs, mine] = await Promise.all([
          api<Question[]>(`/assessments/${first.id}/questions`),
          api<UserAnswer[]>(`/assessments/${first.id}/answers`),
        ]);
        setQuestions(qs);
        setAnswers(Object.fromEntries(mine.map((a) => [a.question_id, a.option_id])));
        await refreshResults(first.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load the assessment");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshResults]);

  async function choose(questionId: number, optionId: number) {
    if (!assessment) return;
    setError(null);
    setSavingQuestion(questionId);
    try {
      await api<UserAnswer>("/assessments/answers", {
        method: "POST",
        body: JSON.stringify({ question_id: questionId, option_id: optionId }),
      });
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
      await refreshResults(assessment.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answer");
    } finally {
      setSavingQuestion(null);
    }
  }

  if (loading) return <Spinner />;
  if (!assessment) return <PageHeader title="Assessment" subtitle="No assessment is available yet." />;

  return (
    <>
      <PageHeader title={assessment.title} subtitle={assessment.description ?? undefined} />
      <ErrorBox message={error} />

      {result && (
        <Card className="mb-4">
          <div className="mb-2 flex justify-between text-sm text-slate-600">
            <span>{result.answered_questions} of {result.total_questions} answered</span>
            <span>{Math.round(result.completion_percentage)}%</span>
          </div>
          <ProgressBar value={result.completion_percentage} />
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q, index) => (
          <Card key={q.id}>
            <p className="font-medium text-slate-900">
              {index + 1}. {q.question_text}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o) => {
                const selected = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => choose(q.id, o.id)}
                    disabled={savingQuestion === q.id}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {o.option_text}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {recommendation && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Your career recommendation</h2>
          {recommendation.top_categories.map((c) => (
            <div key={c.key} className="mt-4 rounded-lg bg-indigo-50 p-4">
              <p className="font-semibold text-indigo-800">{c.name}</p>
              <p className="mt-1 text-sm text-indigo-900/80">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.careers.map((career) => (
                  <Tag key={career} tone="indigo">{career}</Tag>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-5 space-y-3">
            {recommendation.scores.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex justify-between text-sm text-slate-600">
                  <span>{s.name}</span>
                  <span>{s.percentage}%</span>
                </div>
                <ProgressBar value={s.percentage} />
              </div>
            ))}
          </div>
          {result && result.answered_questions < result.total_questions && (
            <p className="mt-4 text-sm text-slate-500">Answer all questions for a more accurate recommendation.</p>
          )}
          <div className="mt-4">
            <Link href="/mentor" className="text-sm font-medium text-indigo-600 hover:underline">
              Discuss this with the AI mentor →
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}
