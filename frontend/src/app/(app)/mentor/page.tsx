"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AiLoader, Button, ErrorBox, PageHeader, Spinner, Tag } from "@/components/ui";
import { api, type ChatMessage } from "@/lib/api";

const SUGGESTIONS = [
  "Based on my assessment, which career suits me?",
  "What should I learn first to become a software engineer?",
  "How do I prepare for internships in my 2nd year?",
  "Which entrance exams are needed for UI/UX design?",
];

export default function MentorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<ChatMessage[]>("/chat/history")
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setError(null);
    setPending(message);
    setInput("");
    try {
      const reply = await api<ChatMessage>("/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The mentor could not reply");
      setInput(message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <PageHeader icon="🤖" title="AI Mentor" subtitle="Personalised guidance using your assessment, resume and the CareerPilot knowledge base." />

      <div className="flex-1 space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm md:p-6">
        {loading && <Spinner />}
        {!loading && messages.length === 0 && !pending && (
          <div className="flex flex-col items-center py-8 text-center animate-fade-up">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-3xl shadow-lg shadow-indigo-200">🤖</span>
            <p className="mt-4 text-lg font-semibold text-slate-900">Hi! I&apos;m your career mentor.</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">I know your assessment result and resume. Ask anything about careers, skills or your next steps. Try:</p>
            <div className="mt-5 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="space-y-3 animate-fade-up">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm text-white shadow-sm">{m.message}</div>
            </div>
            <div className="flex gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm">🤖</span>
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-2.5 text-sm text-slate-800 ring-1 ring-slate-200">
              <div className="markdown">
                <ReactMarkdown>{m.response}</ReactMarkdown>
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-200 pt-2">
                  <span className="text-xs text-slate-500">📚 Sources:</span>
                  {m.sources.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        ))}

        {pending && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm text-white">{pending}</div>
            </div>
            <AiLoader title="Mentor is thinking" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3">
        <ErrorBox message={error} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          placeholder="Ask your career question..."
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />
        <Button type="submit" disabled={!input.trim() || !!pending}>Send ➤</Button>
      </form>
    </div>
  );
}
