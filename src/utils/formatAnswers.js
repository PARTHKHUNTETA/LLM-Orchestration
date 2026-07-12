const PROVIDERS = [
  { key: "openai", label: "OpenAI" },
  { key: "gemini", label: "Gemini" },
  { key: "mistral", label: "Mistral" },
];

const WINNER_LABELS = {
  A: "OpenAI",
  B: "Gemini",
  C: "Mistral",
  OpenAI: "OpenAI",
  Gemini: "Gemini",
  Mistral: "Mistral",
};

function stripMarkdown(text) {
  return text
    .replace(/```(?:\w*\n)?([\s\S]*?)```/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!^\s)\*(?!\s)(.+?)(?<!\s)\*(?!\s)/gm, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<!^\w)_(?!_)(.+?)(?<!_)_(?!\w)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*_]{3,}\s*$/gm, "");
}

function normalizeAnswer(text) {
  if (typeof text !== "string") return null;
  const cleaned = text.trim().replace(/\n{3,}/g, "\n\n");
  return cleaned.length ? cleaned : null;
}

function plainTextForJudge(text) {
  if (typeof text !== "string") return null;
  const cleaned = stripMarkdown(text).trim().replace(/\n{3,}/g, "\n\n");
  return cleaned.length ? cleaned : null;
}

function formatAnswersForJudge({ openai, gemini, mistral }) {
  const answers = {
    openai: normalizeAnswer(openai),
    gemini: normalizeAnswer(gemini),
    mistral: normalizeAnswer(mistral),
  };

  const available = PROVIDERS
    .map(({ key, label }) => ({
      provider: label,
      answer: answers[key],
    }))
    .filter((item) => item.answer);

  return { answers, available };
}

function normalizeWinner(winner) {
  if (!winner) return "Unknown";
  const trimmed = String(winner).trim();
  return WINNER_LABELS[trimmed] || trimmed;
}

export {
  formatAnswersForJudge,
  normalizeAnswer,
  normalizeWinner,
  plainTextForJudge,
  PROVIDERS,
  WINNER_LABELS,
};
