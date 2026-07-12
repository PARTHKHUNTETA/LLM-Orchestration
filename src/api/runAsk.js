import { callOpenAIWithStream } from "../utils/openai.js";
import { callGeminiWithStream } from "../utils/Gemini.js";
import { callMistralWithStream } from "../utils/mistral.js";
import { judgeBestAnswer } from "../utils/judge.js";
import { MODEL_TEMPERATURE } from "../utils/config.js";
import { formatAnswersForJudge } from "../utils/formatAnswers.js";

export async function runAsk(prompt, send) {
  const messages = [{ role: "user", content: prompt }];

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
}
