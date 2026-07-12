import { z } from "zod";

const VerdictSchema = z.object({
  winner: z.enum(["OpenAI", "Gemini", "Mistral", "None"]),
  reasons: z.object({
    OpenAI: z.string().describe("Why OpenAI did or did not win"),
    Gemini: z.string().describe("Why Gemini did or did not win"),
    Mistral: z.string().describe("Why Mistral did or did not win"),
  }),
  bestAnswer: z
    .string()
    .describe(
      "A new synthesized answer that combines the strongest accurate points from all model responses. Do not copy any single model verbatim.",
    ),
});

export { VerdictSchema };
