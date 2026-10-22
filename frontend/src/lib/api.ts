export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

const TOKEN_KEY = "careerpilot_token";
export const SESSION_EXPIRED_EVENT = "careerpilot:session-expired";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d?.msg === "string" ? d.msg : JSON.stringify(d)))
      .join(", ");
  }
  return "Something went wrong";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (response.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(data?.detail));
  }
  return data as T;
}

export type User = { id: number; full_name: string; email: string };

export type Option = { id: number; option_text: string };
export type Question = {
  id: number;
  assessment_id: number;
  question_text: string;
  section: string | null;
  options: Option[];
};
export type Assessment = { id: number; title: string; description: string | null };
export type AssessmentResult = {
  assessment_id: number;
  user_id: number;
  total_questions: number;
  answered_questions: number;
  completion_percentage: number;
};
export type CareerCategory = { key: string; name: string; description: string; careers: string[] };
export type CategoryScore = { key: string; name: string; score: number; percentage: number };
export type SectionResult = { key: string; name: string; answered: number; top_category: string | null };
export type CareerMatch = { name: string; category: string; fit: number };
export type Recommendation = {
  assessment_id: number;
  answered_questions: number;
  total_questions: number;
  match_strength: "strong" | "moderate" | "mixed";
  top_categories: CareerCategory[];
  scores: CategoryScore[];
  sections: SectionResult[];
  career_matches: CareerMatch[];
};
export type UserAnswer = { id: number; question_id: number; option_id: number };

export type ChatMessage = {
  id: number;
  message: string;
  response: string;
  created_at: string;
  sources?: string[];
};

export type RoadmapPhase = {
  title: string;
  weeks: string;
  goals: string[];
  skills: string[];
  resources: string[];
  project: string;
};
export type Roadmap = {
  id: number;
  goal: string;
  created_at: string;
  content: { title: string; summary: string; phases: RoadmapPhase[]; final_outcome: string };
};

export type MissingSkill = {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
  how_to_learn: string;
};
export type SkillGapReport = {
  id: number;
  target_role: string;
  current_skills: string[];
  created_at: string;
  content: {
    readiness_score: number;
    summary: string;
    matching_skills: string[];
    missing_skills: MissingSkill[];
    next_steps: string[];
  };
};

export type ResumeData = {
  id: number;
  filename: string;
  target_role: string | null;
  uploaded_at: string;
  analysis: {
    overall_score: number;
    summary: string;
    experience_level: string;
    extracted_skills: string[];
    education: string[];
    strengths: string[];
    improvements: string[];
    section_feedback: { section: string; feedback: string }[];
    ats_tips: string[];
    suggested_roles: string[];
  };
};
