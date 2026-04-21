/**
 * Embeddings.
 *
 * In production (Vercel / any serverless) we call the Hugging Face Inference
 * API for `sentence-transformers/all-MiniLM-L6-v2` — 384-dim, mean-pooled,
 * L2-normalized — the same vectors produced locally by
 * `Xenova/all-MiniLM-L6-v2`, so they are compatible with embeddings already
 * stored in Supabase.
 *
 * Locally (scripts/ingest, scripts/migrate, `next dev` when HF_TOKEN is not
 * set) we fall back to `@xenova/transformers`, which runs the ONNX model in
 * process. That fallback cannot run on Vercel because the serverless FS is
 * read-only and the ONNX native bindings aren't bundled.
 */

export const EMBEDDING_DIM = 384;

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
// Hugging Face's routed Inference API. The old
// `api-inference.huggingface.co/pipeline/...` host has been deprecated and
// now returns an HTML 404.
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;

function l2normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}

async function embedViaHF(texts: string[]): Promise<number[][]> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN missing");

  // Retry a couple of times while the HF model is warming up (503).
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: texts,
        options: { wait_for_model: true },
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as number[][] | number[];
      const rows: number[][] = Array.isArray((data as number[][])[0])
        ? (data as number[][])
        : [data as number[]];
      return rows.map((r) => {
        if (r.length !== EMBEDDING_DIM) {
          throw new Error(`Unexpected embedding dim from HF: ${r.length}`);
        }
        return l2normalize(r);
      });
    }
    lastErr = await res.text().catch(() => res.statusText);
    if (res.status !== 503 && res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error(`HF embeddings failed: ${String(lastErr)}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _extractorPromise: Promise<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLocalExtractor(): Promise<any> {
  if (!_extractorPromise) {
    _extractorPromise = (async () => {
      const mod = await import("@xenova/transformers");
      return await mod.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    })();
  }
  return _extractorPromise;
}

async function embedLocal(text: string): Promise<number[]> {
  const extractor = await getLocalExtractor();
  const out = await extractor(text.slice(0, 8000), {
    pooling: "mean",
    normalize: true,
  });
  const vec = Array.from(out.data as Float32Array) as number[];
  if (vec.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected embedding dim: ${vec.length}`);
  }
  return vec;
}

function useHF(): boolean {
  // Prefer HF on Vercel / any serverless; also use it whenever HF_TOKEN is set
  // unless the caller explicitly opts out via EMBEDDINGS_BACKEND=local.
  if (process.env.EMBEDDINGS_BACKEND === "local") return false;
  if (process.env.EMBEDDINGS_BACKEND === "hf") return true;
  if (process.env.VERCEL) return true;
  return !!process.env.HF_TOKEN;
}

export async function embed(text: string): Promise<number[]> {
  const input = text.slice(0, 8000);
  if (useHF()) {
    const [vec] = await embedViaHF([input]);
    return vec;
  }
  return embedLocal(input);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const inputs = texts.map((t) => t.slice(0, 8000));
  if (useHF()) {
    // HF API accepts batches; chunk to stay under payload limits.
    const out: number[][] = [];
    const size = 32;
    for (let i = 0; i < inputs.length; i += size) {
      const batch = inputs.slice(i, i + size);
      const vecs = await embedViaHF(batch);
      out.push(...vecs);
    }
    return out;
  }
  const out: number[][] = [];
  for (const t of inputs) out.push(await embedLocal(t));
  return out;
}
