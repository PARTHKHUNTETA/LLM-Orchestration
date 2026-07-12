import http from "node:http";
import "./src/utils/loadEnv.js";
import { runAsk } from "./src/api/runAsk.js";

const PORT = Number(process.env.PORT || 3001);

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

async function handleAsk(req, res) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let prompt;
  try {
    prompt = JSON.parse(body).prompt?.trim();
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  if (!prompt) {
    sendJson(res, 400, { error: "prompt is required" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });

  if (typeof res.flushHeaders === "function") res.flushHeaders();
  res.socket?.setNoDelay?.(true);

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  await runAsk(prompt, send);
  res.end();
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/ask") {
    handleAsk(req, res);
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`SelfAssistant API → http://localhost:${PORT}`);
});
