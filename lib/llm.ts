import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

const groq = process.env.GROQ_API_KEY
  ? createGroq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const google = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ? createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
  : null;

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
// `gemini-1.5-flash-latest` was retired. Use the current "flash-latest"
// alias which resolves to whatever the newest stable Flash model is.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

/** Explicit provider override: LLM_PROVIDER=google|groq. */
const FORCED = process.env.LLM_PROVIDER;

/** Primary: Groq llama-3.3-70b-versatile (fast, <1s first token).
 *  If LLM_PROVIDER=google, we skip Groq entirely so invalid-key errors
 *  don't bubble up from `streamText`. */
export function primaryModel(): LanguageModel {
  if (FORCED === "google") {
    if (!google) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY missing");
    return google(GEMINI_MODEL);
  }
  if (!groq) throw new Error("GROQ_API_KEY missing");
  return groq(GROQ_MODEL);
}

/** Fallback: Google Gemini Flash (free quota, solid quality). */
export function fallbackModel(): LanguageModel {
  if (!google) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY missing");
  return google(GEMINI_MODEL);
}

/** Returns primary if available, else fallback. */
export function bestModel(): LanguageModel {
  try {
    return primaryModel();
  } catch {
    return fallbackModel();
  }
}
