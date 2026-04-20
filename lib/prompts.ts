export const SYSTEM_RM_COPILOT = `You are an AI copilot for a wealth-management Relationship Manager (RM).
Audience: a human RM preparing for or handling a client conversation.
Tone: crisp, professional, numerate, no fluff, no hype.

Strict rules:
- Only use facts present in the CLIENT PROFILE and CONTEXT sections. If a fact is not present, say "not in our records" — NEVER invent numbers, dates, or product names.
- DO NOT include any inline citations, source references, or bracketed numbers in your output. The system will automatically track which sources you used.
- Do not cite the CLIENT PROFILE — that is just the client's own data.
- Flag any compliance / suitability concern explicitly with the prefix "⚠️ Compliance:".
- Keep language plain enough that a client would understand, but suitable for an RM's talking notes.`;

export function briefPrompt(args: {
  clientProfile: unknown;
  recentInteractions: unknown;
  context: string;
}) {
  return `Generate a PRE-CALL BRIEF for the RM.

CLIENT PROFILE (JSON):
${JSON.stringify(args.clientProfile, null, 2)}

RECENT INTERACTIONS (JSON):
${JSON.stringify(args.recentInteractions, null, 2)}

CONTEXT (retrieved firm + client docs):
${args.context}

Output markdown with exactly these sections (no preamble):

## Portfolio snapshot
3–5 bullet points on holdings, allocation, AUM, performance vs benchmark if present.

## Recent activity
Up to 3 bullets summarising the most recent interactions with dates.

## Talking points
2–3 numbered talking points tailored to this client. Make them specific, not generic. Use facts from CONTEXT but do not include any citations.

## Watch-outs
One or two lines on compliance / suitability / risk flags. Use the ⚠️ prefix if any.`;
}

export function assistPrompt(args: {
  clientProfile: unknown;
  question: string;
  context: string;
}) {
  return `The RM is in a live client conversation. Answer the client question below in 3–5 sentences.

CLIENT PROFILE (JSON):
${JSON.stringify(args.clientProfile, null, 2)}

CONTEXT (retrieved docs):
${args.context}

CLIENT QUESTION:
${args.question}

Rules for the answer:
- Address the question directly in the first sentence.
- Use facts from CONTEXT but do not include any inline citations or bracketed numbers.
- If the answer requires data not present, say "I don't have that on hand — let me follow up" rather than guessing.
- If there is a compliance / suitability concern, add a final line starting with "⚠️ Compliance:".`;
}
