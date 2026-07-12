import MarkdownOutput from "./MarkdownOutput.jsx";

const REASON_ORDER = ["OpenAI", "Gemini", "Mistral"];

export default function VerdictPanel({ verdict }) {
  if (!verdict.visible) return null;

  const statusClass =
    verdict.status === "judging"
      ? "live"
      : verdict.status === "done"
        ? "done"
        : "";

  const reasons = verdict.reasons || {};
  const hasReasons = REASON_ORDER.some((name) => reasons[name]);

  return (
    <section className="panel verdict visible">
      <div className="panel-head">
        <span>Synthesized answer</span>
        <span className={`status ${statusClass}`}>{verdict.status}</span>
      </div>
      <div className="verdict-meta">
        <div>
          Primary influence: <strong>{verdict.winner}</strong>
        </div>
      </div>

      {hasReasons ? (
        <ul className="verdict-reasons">
          {REASON_ORDER.map((name) =>
            reasons[name] ? (
              <li key={name} className={verdict.winner === name ? "is-winner" : ""}>
                <strong>{name}:</strong> {reasons[name]}
              </li>
            ) : null,
          )}
        </ul>
      ) : verdict.reason ? (
        <p className="verdict-reason">{verdict.reason}</p>
      ) : null}

      <MarkdownOutput
        text={verdict.bestAnswer}
        emptyMessage="Synthesizing the final answer…"
      />
    </section>
  );
}
