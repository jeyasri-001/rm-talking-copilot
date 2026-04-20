/**
 * Local embeddings via @xenova/transformers (ONNX runtime in Node).
 * Model: Xenova/all-MiniLM-L6-v2 — 384-dim, same architecture as the HF
 * hosted version. First call downloads ~25MB of model files to ./node_modules/@xenova/transformers/.cache.
 */

export const EMBEDDING_DIM = 384;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _extractorPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getExtractor(): Promise<any> {
  if (!_extractorPromise) {
    _extractorPromise = (async () => {
      const mod = await import("@xenova/transformers");
      return await mod.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    })();
  }
  return _extractorPromise;
}

export async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const out = await extractor(text.slice(0, 8000), { pooling: "mean", normalize: true });
  const vec = Array.from(out.data as Float32Array) as number[];
  if (vec.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected embedding dim: ${vec.length}`);
  }
  return vec;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) out.push(await embed(t));
  return out;
}
