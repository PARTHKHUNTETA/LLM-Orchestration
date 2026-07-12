import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

const client = new OpenAI();
const MODEL_NAME = "gpt-5.6";

async function callOpenAI(messages, { model = MODEL_NAME, ...otherConfigs } = {}) {
  try {
    const response = await client.responses.create({
      model: model,
      input: messages,
      reasoning: {
        effort: "high"
      },
      text: {
        verbosity: "high"
      },
      ...otherConfigs
    });
    return response.output_text;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}

async function callOpenAIWithStream(messages, onChunk, { model = MODEL_NAME, ...otherConfigs } = {}) {
  try {
    const stream = await client.responses.create({
      model,
      input: messages,
      stream: true,
      reasoning: {
        effort: "high",
      },
      text: {
        verbosity: "high",
      },
      ...otherConfigs,
    });

    let fullText = "";
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        fullText += event.delta;
        onChunk?.(event.delta);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}

async function callOpenAIParsed(messages, schema, name, { model = MODEL_NAME, ...otherConfigs } = {}) {
  try {
    const response = await client.responses.parse({
      model,
      input: messages,
      text: { format: zodTextFormat(schema, name) },
      reasoning: { effort: "low" },
      ...otherConfigs,
    });
    return response.output_parsed;
  } catch (error) {
    console.error("Error calling OpenAI (parsed):", error);
    return null;
  }
}
export { callOpenAI, callOpenAIWithStream, callOpenAIParsed };
