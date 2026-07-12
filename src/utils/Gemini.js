import { GoogleGenAI } from "@google/genai";
import { MODEL_TEMPERATURE } from "./config.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = "gemini-3.1-flash-lite";

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/** Emit only new text from each Gemini chunk (chunk.text can be cumulative). */
function emitDelta(previous, current, onChunk) {
  if (!current) return previous;
  const delta = current.startsWith(previous) ? current.slice(previous.length) : current;
  if (delta) onChunk?.(delta);
  return current.startsWith(previous) ? current : previous + current;
}

async function callGemini(messages, { temperature = MODEL_TEMPERATURE } = {}) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: toGeminiContents(messages),
      config: {
        temperature,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return null;
  }
}

async function callGeminiWithStream(messages, onChunk, { temperature = MODEL_TEMPERATURE } = {}) {
  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: toGeminiContents(messages),
      config: {
        temperature,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.text ?? "";
      if (!text) continue;
      fullText = emitDelta(fullText, text, onChunk);
    }
    return fullText;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return null;
  }
}

export { callGemini, callGeminiWithStream };
