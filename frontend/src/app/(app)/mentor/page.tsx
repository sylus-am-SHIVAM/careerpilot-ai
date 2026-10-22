"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button, ErrorBox, PageHeader, Spinner, Tag } from "@/components/ui";
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
      <PageHeader title="AI Mentor" subtitle="Personalised guidance using your assessment, resume and the CareerPilot knowledge base." />

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {loading && <Spinner />}
        {!loading && messages.length === 0 && !pending && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Ask anything about careers, skills or your next steps. Try:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white">{m.message}</div>
            </div>
            <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-sm text-slate-800">
              <div className="markdown">
                <ReactMarkdown>{m.response}</ReactMarkdown>
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-200 pt-2">
                  <span className="text-xs text-slate-500">Sources:</span>
                  {m.sources.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white">{pending}</div>
            </div>
            <Spinner label="Mentor is thinking..." />
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
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <Button type="submit" disabled={!input.trim() || !!pending}>Send</Button>
      </form>
    </div>
  );
}
