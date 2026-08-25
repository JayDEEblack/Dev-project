import "server-only";
import "./pdf-polyfills";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFParse } from "pdf-parse";

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  )
).href;

export async function extractPdfText(input: ArrayBuffer | Uint8Array): Promise<string> {
  const data =
    input instanceof Uint8Array ? input : new Uint8Array(input);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new Error(
        "No text could be extracted from this PDF. It may be a scanned image PDF."
      );
    }
    return text;
  } finally {
    await parser.destroy();
  }
}