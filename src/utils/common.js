import { normalizeWinner ,normalizeAnswer} from "./formatAnswers.js";

const PROVIDER_KEYS = new Set(["openai", "gemini", "mistral"]);

function normalizeReasons(reasons) {
    if (!reasons || typeof reasons !== "object") {
      return { OpenAI: "", Gemini: "", Mistral: "" };
    }
    return {
      OpenAI: String(reasons.OpenAI || "").trim(),
      Gemini: String(reasons.Gemini || "").trim(),
      Mistral: String(reasons.Mistral || "").trim(),
    };
  }
  
  function parseVerdict(raw, answers) {
    const fallback = (reason) => ({
      winner: "Unknown",
      reasons: { OpenAI: "", Gemini: "", Mistral: "" },
      reason,
      bestAnswer: "",
    });
    if (!raw) return fallback("Empty judge response.");
  
    let parsed = raw;
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(extractJson(raw));
      } catch {
        return fallback("Could not parse judge JSON.");
      }
    }
  
    const winner = normalizeWinner(parsed.winner);
    const reasons = normalizeReasons(parsed.reasons);
  
    const synthesized = normalizeAnswer(parsed.bestAnswer) || "";

    if (winner === "None") {
      return {
        winner: "None",
        reasons,
        reason: reasons.OpenAI || reasons.Gemini || reasons.Mistral || "No answer met the bar.",
        bestAnswer: synthesized,
      };
    }

    const key = winner.toLowerCase();
    if (!PROVIDER_KEYS.has(key)) {
      return fallback(`Judge returned unknown winner: ${parsed.winner}`);
    }

    return {
      winner,
      reasons,
      reason: reasons[winner] || "",
      bestAnswer: synthesized || normalizeAnswer(answers[key]) || "",
    };
  }

  function extractJson(raw) {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? match[0] : raw.trim();
  }

  export { extractJson, normalizeReasons, parseVerdict };