import type { Worker } from "tesseract.js";

// One reusable worker for the whole session — it downloads the English model
// once (from the jsDelivr CDN) and then recognises every page locally.
let workerPromise: Promise<Worker> | null = null;
let activeLogger: ((progress: number) => void) | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    const { createWorker } = await import("tesseract.js");
    workerPromise = createWorker("eng", 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text" && activeLogger) {
          activeLogger(m.progress);
        }
      },
    });
  }
  return workerPromise;
}

/** Warm up the worker (downloads the model) so the first real page is faster. */
export async function warmUpOcr(): Promise<void> {
  await getWorker();
}

export async function ocrImage(
  image: HTMLCanvasElement | File | Blob | string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const worker = await getWorker();
  activeLogger = onProgress ?? null;
  try {
    const { data } = await worker.recognize(image);
    return (data.text || "").trim();
  } finally {
    activeLogger = null;
  }
}

export async function terminateOcr(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
}
