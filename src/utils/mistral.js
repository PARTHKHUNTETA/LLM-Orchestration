import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Mistral } from "@mistralai/mistralai";
import { MODEL_TEMPERATURE } from "./config.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const MODEL_NAME = "mistral-large-latest";

async function callMistral(messages, { temperature = MODEL_TEMPERATURE } = {}) {
  try {
    const response = await client.chat.complete({
      model: MODEL_NAME,
      messages,
      temperature,
    });
    const content = response.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (error) {
    console.error("Error calling Mistral:", error);
    return null;
  }
}

async function callMistralWithStream(messages, onChunk, { temperature = MODEL_TEMPERATURE } = {}) {
  try {
    const stream = await client.chat.stream({
      model: MODEL_NAME,
      messages,
      temperature,
    });

    let fullText = "";
    for await (const event of stream) {
      const content = event.data?.choices?.[0]?.delta?.content;
      if (typeof content === "string" && content.length) {
        fullText += content;
        onChunk?.(content);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error calling Mistral:", error);
    return null;
  }
}

export { callMistral, callMistralWithStream };
