import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownOutput({ text, emptyMessage = "Waiting for tokens…" }) {
  if (!text) {
    return <div className="output markdown-output is-empty" data-empty={emptyMessage} />;
  }

  return (
    <div className="output markdown-output">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
