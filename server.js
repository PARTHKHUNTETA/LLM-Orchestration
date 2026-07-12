import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { callOpenAIWithStream } from "./src/utils/openai.js";
import { callGeminiWithStream } from "./src/utils/Gemini.js";
import { callMistralWithStream } from "./src/utils/mistral.js";
import { judgeBestAnswer } from "./src/utils/judge.js";
import { MODEL_TEMPERATURE } from "./src/utils/config.js";
import { formatAnswersForJudge } from "./src/utils/formatAnswers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

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

  const messages = [{ role: "user", content: prompt }];

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

  send({ source: "system", text: "connected" });

  try {
    const [openaiText, geminiText, mistralText] = await Promise.all([
      callOpenAIWithStream(messages, (text) => {
        if (text) send({ source: "openai", text });
      }),
      callGeminiWithStream(messages, (text) => {
        if (text) send({ source: "gemini", text });
      }, { temperature: MODEL_TEMPERATURE }),
      callMistralWithStream(messages, (text) => {
        if (text) send({ source: "mistral", text });
      }, { temperature: MODEL_TEMPERATURE }),
    ]);

    if (!openaiText) {
      send({ source: "openai", error: "OpenAI returned no text. Check API key / network." });
    }
    if (!geminiText) {
      send({ source: "gemini", error: "Gemini returned no text. Check API key / network." });
    }
    if (!mistralText) {
      send({ source: "mistral", error: "Mistral returned no text. Check API key / network." });
    }

    const { answers, available } = formatAnswersForJudge({
      openai: openaiText,
      gemini: geminiText,
      mistral: mistralText,
    });

    if (available.length > 0) {
      send({ source: "verdict", status: "judging" });
      const verdict = await judgeBestAnswer(prompt, answers);
      if (verdict) {
        send({ source: "verdict", ...verdict });
      } else {
        send({ source: "verdict", error: "Judge returned no verdict. Check API key / network." });
      }
    }

    send({ done: true });
  } catch (error) {
    send({ error: error.message || "Request failed" });
  }

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
