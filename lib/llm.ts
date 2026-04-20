import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

const groq = process.env.GROQ_API_KEY
  ? createGroq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const google = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ? createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
  : null;

/** Primary: Groq llama-3.3-70b-versatile (fast, <1s first token). */
export function primaryModel(): LanguageModel {
  if (!groq) throw new Error("GROQ_API_KEY missing");
  return groq("llama-3.3-70b-versatile");
}

/** Fallback: Gemini 1.5 Flash (free quota, solid quality). */
export function fallbackModel(): LanguageModel {
  if (!google) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY missing");
  return google("gemini-1.5-flash-latest");
}

/** Returns primary if available, else fallback. */
export function bestModel(): LanguageModel {
  try {
    return primaryModel();
  } catch {
    return fallbackModel();
  }
}
