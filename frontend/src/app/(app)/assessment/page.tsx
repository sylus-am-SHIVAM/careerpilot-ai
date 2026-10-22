"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AiLoader, Button, Card, ErrorBox, ProgressBar, Spinner, Tag } from "@/components/ui";
import { api, type Assessment, type Question, type Recommendation, type UserAnswer } from "@/lib/api";
import { CATEGORY_STYLE, SECTION_ICONS } from "@/lib/career";

const STRENGTH_TEXT = {
  strong: { label: "Strong match", text: "Your answers point clearly in one direction.", tone: "green" as const },
  moderate: { label: "Good match", text: "One area leads, with a close second you can combine with it.", tone: "indigo" as const },
  mixed: { label: "Multi-talented profile", text: "You have several strong areas. Talk to the AI mentor to narrow down.", tone: "amber" as const },
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

type View = "intro" | "quiz" | "result";

export default function AssessmentPage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [view, setView] = useState<View>("intro");
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendation = useCallback(async (assessmentId: number) => {
    const rec = await api<Recommendation>(`/assessments/${assessmentId}/recommendation`).catch(() => null);
    setRecommendation(rec);
    return rec;
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const list = await api<Assessment[]>("/assessments/");
        const latest = list[0];
        if (!latest) return;
        setAssessment(latest);
        const [qs, mine] = await Promise.all([
          api<Question[]>(`/assessments/${latest.id}/questions`),
          api<UserAnswer[]>(`/assessments/${latest.id}/answers`),
        ]);
        const saved = Object.fromEntries(mine.map((a) => [a.question_id, a.option_id]));
        setQuestions(qs);
        setAnswers(saved);
        if (qs.length > 0 && qs.every((q) => saved[q.id])) {
          await loadRecommendation(latest.id);
          setView("result");
        } else if (mine.length > 0) {
          setCurrent(Math.max(0, qs.findIndex((q) => !saved[q.id])));
          setView("quiz");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load the assessment");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadRecommendation]);

  const finish = useCallback(async () => {
    if (!assessment) return;
    setCalculating(true);
    setError(null);
    const rec = await loadRecommendation(assessment.id);
    setCalculating(false);
    if (rec) {
      setView("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError("Could not calculate your result. Please try again.");
    }
  }, [assessment, loadRecommendation]);

  const choose = useCallback(
    async (question: Question, optionId: number) => {
      if (saving) return;
      setError(null);
      setSaving(true);
      try {
        await api<UserAnswer>("/assessments/answers", {
          method: "POST",
          body: JSON.stringify({ question_id: question.id, option_id: optionId }),
        });
        setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
        setTimeout(() => setCurrent((i) => Math.min(i + 1, questions.length - 1)), 350);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save your answer");
      } finally {
        setSaving(false);
      }
    },
    [saving, questions.length]
  );

  useEffect(() => {
    if (view !== "quiz") return;
    function onKey(event: KeyboardEvent) {
      const question = questions[current];
      if (!question) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < question.options.length) choose(question, question.options[index].id);
      if (event.key === "ArrowLeft") setCurrent((i) => Math.max(0, i - 1));
      if (event.key === "ArrowRight" && answers[question.id]) setCurrent((i) => Math.min(questions.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, questions, current, answers, choose]);

  const retake = useCallback(async () => {
    if (!assessment) return;
    setError(null);
    try {
      await api(`/assessments/${assessment.id}/answers`, { method: "DELETE" });
      setAnswers({});
      setRecommendation(null);
      setCurrent(0);
      setView("intro");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your answers");
    }
  }, [assessment]);

  if (loading) return <Spinner />;
  if (!assessment) return <ErrorBox message={error ?? "No assessment is available yet."} />;

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const sections = [...new Set(questions.map((q) => q.section ?? "Questions"))];

  if (view === "intro") {
    return (
      <div className="animate-fade-up">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl shadow-indigo-200 md:p-10">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">⏱️ About 5 minutes · {questions.length} questions</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{assessment.title}</h1>
          <p className="mt-3 max-w-2xl text-white/85">{assessment.description}</p>
          <Button onClick={() => setView("quiz")} variant="secondary" className="mt-6 border-0 !bg-white !text-indigo-700 hover:!bg-indigo-50">
            Start the assessment →
          </Button>
        </div>
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">What we measure</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sections.map((section, i) => (
            <Card key={section} className="animate-fade-up" >
              <span className="text-2xl">{SECTION_ICONS[section] ?? "📝"}</span>
              <p className="mt-2 text-sm font-semibold text-slate-800">{section}</p>
              <p className="text-xs text-slate-500">{questions.filter((q) => (q.section ?? "Questions") === section).length} questions · step {i + 1}</p>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          💡 There are no right or wrong answers. Pick what feels most like you, not what sounds impressive.
        </p>
      </div>
    );
  }

  if (view === "result" && recommendation) {
    return (
      <>
        <ErrorBox message={error} />
        <ResultView
          recommendation={recommendation}
          onEdit={() => {
            setCurrent(0);
            setView("quiz");
          }}
          onRetake={retake}
        />
      </>
    );
  }

  const question = questions[current];
  const sectionName = question.section ?? "Questions";
  const sectionIndex = sections.indexOf(sectionName);

  return (
    <div>
      <div className="mb-6 animate-fade-up">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium text-slate-600">
            Question {current + 1} <span className="text-slate-400">of {questions.length}</span>
          </span>
          <span className="text-slate-500">{answeredCount} answered</span>
        </div>
        <ProgressBar value={(answeredCount / questions.length) * 100} />
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {sections.map((section, i) => (
            <button
              key={section}
              onClick={() => setCurrent(questions.findIndex((q) => (q.section ?? "Questions") === section))}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                i === sectionIndex
                  ? "bg-indigo-600 text-white"
                  : questions.filter((q) => (q.section ?? "Questions") === section).every((q) => answers[q.id])
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {SECTION_ICONS[section] ?? "📝"} {section}
            </button>
          ))}
        </div>
      </div>

      <Card key={question.id} className="p-6 animate-fade-up md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {SECTION_ICONS[sectionName] ?? "📝"} {sectionName}
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">{question.question_text}</h2>
        <div className="mt-6 grid gap-3">
          {question.options.map((o, i) => {
            const selected = answers[question.id] === o.id;
            return (
              <button
                key={o.id}
                onClick={() => choose(question, o.id)}
                disabled={saving}
                className={`group flex items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition ${
                  selected
                    ? "animate-pop border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                    selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                  }`}
                >
                  {selected ? "✓" : LETTERS[i]}
                </span>
                <span className={`text-sm font-medium md:text-base ${selected ? "text-indigo-900" : "text-slate-700"}`}>
                  {o.option_text}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 hidden text-xs text-slate-400 md:block">Tip: press keys 1–{question.options.length} to answer, ← → to move.</p>
      </Card>

      <div className="mt-4">
        <ErrorBox message={error} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setCurrent((i) => Math.max(0, i - 1))} disabled={current === 0}>
          ← Back
        </Button>
        {allAnswered ? (
          <Button onClick={finish} disabled={calculating}>
            {calculating ? "Calculating..." : "See my results 🎉"}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}
            disabled={current === questions.length - 1 || !answers[question.id]}
          >
            Next →
          </Button>
        )}
      </div>
      {calculating && <div className="mt-4"><AiLoader title="Calculating your career profile" /></div>}
    </div>
  );
}

function ResultView({
  recommendation,
  onEdit,
  onRetake,
}: {
  recommendation: Recommendation;
  onEdit: () => void;
  onRetake: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const top = recommendation.top_categories[0];
  const style = CATEGORY_STYLE[top.key] ?? CATEGORY_STYLE.technology;
  const strength = STRENGTH_TEXT[recommendation.match_strength];
  const keyByName = Object.fromEntries(recommendation.scores.map((s) => [s.name, s.key]));

  return (
    <div className="space-y-6">
      <div className={`overflow-hidden rounded-3xl bg-gradient-to-br ${style.gradient} p-8 text-white shadow-xl animate-fade-up md:p-10`}>
        <p className="text-sm font-medium text-white/80">🎉 Your best-fit career area</p>
        <div className="mt-3 flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl">{style.icon}</span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {recommendation.top_categories.map((c) => c.name).join(" + ")}
            </h1>
            <p className="mt-1 text-white/85">{top.description}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm">
            <strong>{strength.label}</strong> · {strength.text}
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 shadow hover:bg-slate-100"
            >
              🔄 Retake test
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-800 shadow animate-fade-up">
              <span>Clear all 20 answers and start again?</span>
              <button
                disabled={resetting}
                onClick={async () => {
                  setResetting(true);
                  await onRetake();
                  setResetting(false);
                  setConfirming(false);
                }}
                className="rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {resetting ? "Clearing..." : "Yes, retake"}
              </button>
              <button onClick={() => setConfirming(false)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 animate-fade-up">
          <h2 className="font-semibold text-slate-900">🏆 Your top career matches</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recommendation.career_matches.map((m, i) => (
              <div key={m.name} className="rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}
                    {m.name}
                  </p>
                  <span className="text-sm font-bold text-indigo-600">{m.fit}%</span>
                </div>
                <p className="mb-2 text-xs text-slate-500">{m.category}</p>
                <ProgressBar value={m.fit} color={CATEGORY_STYLE[keyByName[m.category]]?.bar} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Match % is relative to your strongest area.</p>
        </Card>

        <Card className="lg:col-span-2 animate-fade-up">
          <h2 className="font-semibold text-slate-900">📊 Your interest profile</h2>
          <div className="mt-4 space-y-4">
            {recommendation.scores.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-700">{CATEGORY_STYLE[s.key]?.icon} {s.name}</span>
                  <span className="font-semibold text-slate-900">{s.percentage}%</span>
                </div>
                <ProgressBar value={s.percentage} color={CATEGORY_STYLE[s.key]?.bar} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {recommendation.sections.length > 0 && (
        <Card className="animate-fade-up">
          <h2 className="font-semibold text-slate-900">🔍 What each parameter says about you</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {recommendation.sections.map((s) => (
              <div key={s.key} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xl">{SECTION_ICONS[s.name] ?? "📝"}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{s.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {s.top_category ? `${CATEGORY_STYLE[keyByName[s.top_category]]?.icon ?? ""} ${s.top_category}` : "—"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="animate-fade-up">
        <h2 className="font-semibold text-slate-900">🚀 What next?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/mentor" className="rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
            <p className="text-2xl">🤖</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Discuss with AI mentor</p>
            <p className="text-xs text-slate-500">It already knows your result.</p>
          </Link>
          <Link href="/roadmap" className="rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
            <p className="text-2xl">🛣️</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Build a roadmap</p>
            <p className="text-xs text-slate-500">e.g. &quot;{recommendation.career_matches[0]?.name}&quot;</p>
          </Link>
          <Link href="/skill-gap" className="rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
            <p className="text-2xl">📈</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Check your skill gap</p>
            <p className="text-xs text-slate-500">See what to learn first.</p>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {top.careers.map((c) => (
            <Tag key={c} tone="indigo">{c}</Tag>
          ))}
          <button onClick={onEdit} className="ml-auto text-sm font-medium text-slate-500 hover:text-indigo-600">
            ✏️ Change a few answers
          </button>
        </div>
      </Card>
    </div>
  );
}
