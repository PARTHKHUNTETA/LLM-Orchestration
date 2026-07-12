// import { callOpenAIWithStream } from "./src/utils/openai.js";
// import { callGeminiWithStream } from "./src/utils/Gemini.js";
// import { callMistralWithStream } from "./src/utils/mistral.js";
// import { judgeBestAnswer } from "./src/utils/judge.js";
// import { MODEL_TEMPERATURE } from "./src/utils/config.js";

// async function main() {
//   const question = "What is the weather in Tokyo?";
//   const messages = [{ role: "user", content: question }];

//   const [openai, gemini, mistral] = await Promise.all([
//     callOpenAIWithStream(messages, (delta) => process.stdout.write(`[OpenAI] ${delta}`), { temperature: MODEL_TEMPERATURE }),
//     callGeminiWithStream(messages, (delta) => process.stdout.write(`[Gemini] ${delta}`), { temperature: MODEL_TEMPERATURE }),
//     callMistralWithStream(messages, (delta) => process.stdout.write(`[Mistral] ${delta}`), { temperature: MODEL_TEMPERATURE }),
//   ]);

//   console.log("\n\n--- Final ---");
//   console.log("OpenAI:", openai);
//   console.log("Gemini:", gemini);
//   console.log("Mistral:", mistral);

//   const verdict = await judgeBestAnswer(question, openai, gemini, mistral);
//   console.log("\n--- Best ---");
//   console.log(verdict);
// }

// main();
