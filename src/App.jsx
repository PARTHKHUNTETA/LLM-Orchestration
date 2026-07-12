import { useState } from "react";
import ModelPanel from "./components/ModelPanel.jsx";
import VerdictPanel from "./components/VerdictPanel.jsx";
import {
  emptyPanels,
  emptyVerdict,
  streamCompare,
} from "./lib/streamCompare.js";

export default function App() {
  const [prompt, setPrompt] = useState("What is the meaning of Life, the Universe, and Everything?");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const [panels, setPanels] = useState(emptyPanels);
  const [verdict, setVerdict] = useState(emptyVerdict);

  async function handleCompare() {
    const value = prompt.trim();
    if (!value) {
      setHint("Enter a prompt first.");
      return;
    }

    setLoading(true);
    setVerdict(emptyVerdict());
    setHint("Streaming all models…");

    try {
      await streamCompare(value, {
        onPanels: setPanels,
        onVerdict: setVerdict,
        onHint: setHint,
      });
    } catch (err) {
      setPanels((prev) => ({
        openai: { ...prev.openai, status: "error" },
        gemini: { ...prev.gemini, status: "error" },
        mistral: { ...prev.mistral, status: "error" },
      }));
      setVerdict((prev) => ({ ...prev, status: "error", visible: prev.visible }));
      setHint(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !loading) handleCompare();
  }

  return (
    <main>
      <header>
        <h1>LLM orchestration</h1>
        <p>
          Ask once — watch OpenAI, Gemini, and Mistral stream, then see a
          synthesized final answer built from the strongest parts of all three.
        </p>
      </header>

      <div className="ask-row">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="What is life, the universe, and everything?"
          disabled={loading}
        />
        <button type="button" onClick={handleCompare} disabled={loading}>
          {loading ? "Comparing…" : "Compare"}
        </button>
        <button type="button" onClick={() => setPrompt("")} disabled={loading}>Clear</button>
      </div>

      <div className="panels">
        <ModelPanel
          name="OpenAI"
          variant="openai"
          text={panels.openai.text}
          status={panels.openai.status}
        />
        <ModelPanel
          name="Gemini"
          variant="gemini"
          text={panels.gemini.text}
          status={panels.gemini.status}
        />
        <ModelPanel
          name="Mistral"
          variant="mistral"
          text={panels.mistral.text}
          status={panels.mistral.status}
        />
      </div>

      <VerdictPanel verdict={verdict} />
      {hint ? <p className="hint">{hint}</p> : null}
    </main>
  );
}
