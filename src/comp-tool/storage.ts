import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  CompEvaluateResponse,
  CompFeedbackPayload,
  CompFeedbackRecord,
} from "@/comp-tool/types";

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

export async function saveCompFeedbackArtifact(payload: CompFeedbackPayload) {
  const timestamp = new Date().toISOString();
  const feedbackDir = path.join(process.cwd(), "data", "feedback");
  const id = timestamp.replace(/[:.]/g, "-");
  const record: CompFeedbackRecord = {
    id,
    createdAt: timestamp,
    ...payload,
  };

  await mkdir(feedbackDir, { recursive: true });

  const filename = `${id}-${sanitizeFileSegment(payload.rating)}.json`;
  const absolutePath = path.join(feedbackDir, filename);
  const relativePath = path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");

  await writeFile(absolutePath, JSON.stringify(record, null, 2), "utf-8");

  return {
    record,
    artifactPath: relativePath,
  };
}
