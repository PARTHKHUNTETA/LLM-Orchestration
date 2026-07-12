import MarkdownOutput from "./MarkdownOutput.jsx";

export default function ModelPanel({ name, variant, text, status }) {
  return (
    <section className={`panel ${variant}`}>
      <div className="panel-head">
        <span>{name}</span>
        <span className={`status ${status === "streaming" || status === "judging" ? "live" : ""} ${status === "done" ? "done" : ""}`}>
          {status}
        </span>
      </div>
      <MarkdownOutput text={text} />
    </section>
  );
}
