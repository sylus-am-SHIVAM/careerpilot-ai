"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, ErrorBox, Input, Label } from "./ui";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<"login" | "register" | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuggest(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(fullName, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      if (err instanceof ApiError && mode === "login" && err.status === 404) setSuggest("register");
      if (err instanceof ApiError && mode === "register" && err.status === 400) setSuggest("login");
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm p-7 shadow-xl shadow-indigo-100 animate-fade-up">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500">🚀</span>
          CareerPilot AI
        </Link>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">{isLogin ? "Welcome back 👋" : "Start your journey ✨"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin ? "Log in to continue your career plan." : "Create a free account to discover your best-fit career."}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? 1 : 6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          <ErrorBox message={error} />
          {suggest && (
            <Link
              href={suggest === "register" ? "/register" : "/login"}
              className="block rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              {suggest === "register" ? "✨ Create a free account →" : "🔑 Go to log in →"}
            </Link>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link href={isLogin ? "/register" : "/login"} className="font-medium text-indigo-600">
            {isLogin ? "Create an account" : "Log in"}
          </Link>
        </p>
      </Card>
    </main>
  );
}
