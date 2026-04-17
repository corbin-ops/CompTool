import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CompEvaluateResponse } from "@/comp-tool/types";

function sanitizeFileSegment(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function saveCompEvaluationArtifact(response: CompEvaluateResponse) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const provider = response.generation.provider ?? response.generation.status;
  const evaluationDir = path.join(process.cwd(), "data", "evaluations");

  await mkdir(evaluationDir, { recursive: true });

  const filename = `${timestamp}-${sanitizeFileSegment(provider)}.json`;
  const absolutePath = path.join(evaluationDir, filename);
  const relativePath = path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");

  await writeFile(absolutePath, JSON.stringify(response, null, 2), "utf-8");

  return relativePath;
}
