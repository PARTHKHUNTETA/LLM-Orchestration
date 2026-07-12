import { normalizeWinner } from "../utils/formatAnswers.js";

const MODEL_KEYS = ["openai", "gemini", "mistral"];

function emptyPanels() {
  return {
    openai: { text: "", status: "idle", ok: false },
    gemini: { text: "", status: "idle", ok: false },
    mistral: { text: "", status: "idle", ok: false },
  };
}

function emptyVerdict() {
  return {
    visible: false,
    status: "idle",
    winner: "—",
    reasons: { OpenAI: "", Gemini: "", Mistral: "" },
    reason: "",
    bestAnswer: "",
  };
}

export async function streamCompare(prompt, { onPanels, onVerdict, onHint }) {
  const panels = emptyPanels();
  let verdict = emptyVerdict();

  const publishPanels = () => onPanels({ ...panels });
  const publishVerdict = () => onVerdict({ ...verdict });

  for (const key of MODEL_KEYS) {
    panels[key] = { text: "", status: "streaming", ok: false };
  }
  publishPanels();
  onHint("Streaming all models…");

  const res = await fetch("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gotVerdict = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop();

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;

      const msg = JSON.parse(line.slice(6));
      if (msg.error && !msg.source) throw new Error(msg.error);

      if (msg.source === "verdict") {
        if (msg.status === "judging") {
          verdict = {
            visible: true,
            status: "judging",
            winner: "—",
            reasons: { OpenAI: "", Gemini: "", Mistral: "" },
            reason: "Comparing answers…",
            bestAnswer: "",
          };
          publishVerdict();
          onHint("Models finished — synthesizing the final answer…");
        } else if (msg.error) {
          verdict = {
            visible: true,
            status: "error",
            winner: "—",
            reasons: { OpenAI: "", Gemini: "", Mistral: "" },
            reason: msg.error,
            bestAnswer: "",
          };
          publishVerdict();
        } else {
          const winner = normalizeWinner(msg.winner) || "—";
          verdict = {
            visible: true,
            status: "done",
            winner,
            reasons: msg.reasons || { OpenAI: "", Gemini: "", Mistral: "" },
            reason: msg.reason || msg.reasons?.[winner] || "",
            bestAnswer: msg.bestAnswer || "",
          };
          gotVerdict = true;
          publishVerdict();
        }
        continue;
      }

      if (!MODEL_KEYS.includes(msg.source)) continue;

      if (msg.error) {
        panels[msg.source] = {
          text: msg.error,
          status: "error",
          ok: false,
        };
        publishPanels();
      } else if (typeof msg.text === "string" && msg.text.length) {
        const prev = panels[msg.source];
        panels[msg.source] = {
          text: prev.text + msg.text,
          status: "streaming",
          ok: true,
        };
        publishPanels();
      }
    }
  }

  let anyOk = false;
  for (const key of MODEL_KEYS) {
    if (panels[key].ok) {
      panels[key] = { ...panels[key], status: "done" };
      anyOk = true;
    } else if (panels[key].status === "streaming") {
      panels[key] = { ...panels[key], status: "empty" };
    }
  }
  publishPanels();

  if (gotVerdict) onHint("Final verdict ready.");
  else if (anyOk) onHint("Stream finished (no verdict).");
  else onHint("No tokens received — check the terminal for API errors.");

  return { panels, verdict };
}

export { emptyPanels, emptyVerdict, MODEL_KEYS };
