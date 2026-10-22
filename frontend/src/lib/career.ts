export const SECTION_ICONS: Record<string, string> = {
  Interests: "💡",
  "Strengths & Aptitude": "💪",
  "Work Style & Personality": "🧩",
  "Values & Motivation": "❤️",
  "Academics & Experience": "🎓",
};

export const CATEGORY_STYLE: Record<string, { icon: string; gradient: string; bar: string }> = {
  technology: { icon: "💻", gradient: "from-indigo-500 to-blue-500", bar: "from-indigo-500 to-blue-500" },
  research: { icon: "🔬", gradient: "from-cyan-500 to-teal-500", bar: "from-cyan-500 to-teal-500" },
  social: { icon: "🤝", gradient: "from-rose-500 to-pink-500", bar: "from-rose-500 to-pink-500" },
  creative: { icon: "🎨", gradient: "from-fuchsia-500 to-purple-500", bar: "from-fuchsia-500 to-purple-500" },
  business: { icon: "📊", gradient: "from-amber-500 to-orange-500", bar: "from-amber-500 to-orange-500" },
};
