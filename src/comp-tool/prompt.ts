import type {
  CompEvaluateRequest,
  CompPromptPackage,
  RetrievedCompChunk,
} from "@/comp-tool/types";

const DELIVERABLE_SECTIONS = [
  "0. Decision Summary",
  "1. Market Value",
  "2. Offer Price",
  "3. Value-Add Market Value (Optional)",
  "4. Value-Add Offer Price (Optional)",
  "5. Negotiation Strategies / Leverage",
  "6. Extra Notes",
  "7. Recommended List Price",
  "8. Key Comps Used",
  "9. Questions to Ask Seller",
  "10. Lead Stage Classification",
  "11. Follow-Up Boss Note",
  "12. Analyst Verification Checklist",
];

function buildPropertyBrief(input: CompEvaluateRequest) {
  const lines = [
    `Mode: ${input.mode}`,
    `Parcel link: ${input.parcelLink || "Not provided"}`,
    `County: ${input.county || "Not provided"}`,
    `State: ${input.state || "Not provided"}`,
    `Acreage: ${input.acreage || "Not provided"}`,
    `Seller asking price: ${input.sellerAskingPrice || "Not provided"}`,
    `Primary question: ${input.question || "Not provided"}`,
    `Known facts: ${input.knownFacts || "Not provided"}`,
  ];

  return lines.join("\n");
}

function formatChunks(chunks: RetrievedCompChunk[]) {
  return chunks
    .map(
      (chunk, index) =>
        `[Context ${index + 1}] ${chunk.docId} | page ${chunk.pageNumber} | score ${chunk.score}\n${chunk.text}`,
    )
    .join("\n\n---\n\n");
}

export function buildCompPromptPackage(
  input: CompEvaluateRequest,
  retrievalQuery: string,
  chunks: RetrievedCompChunk[],
): CompPromptPackage {
  const systemPrompt = [
    "You are DewClaw's internal land valuation analyst.",
    "Use the provided DewClaw training context as the primary authority.",
    "Do not invent property facts, comps, or legal conclusions that are not supported by the input or the retrieved context.",
    "If key data is missing, explicitly mark it as Needs verification.",
    "The output must help an acquisitions operator decide what to do next, not just summarize research.",
    "Follow the DewClaw Version 3 deliverable format and keep the tone operational, concise, and practical.",
    "When you make an estimate, briefly explain the logic behind it.",
    "Never hide low confidence behind precise-looking numbers. Label preliminary estimates as preliminary when comps or property facts are missing.",
    "Do not use decorative emojis in paste-ready notes or the structured deliverable.",
    "If subdivision or value-add does not exist, mark the value-add sections as N/A.",
    "For Lead Stage Classification, use the seller asking price versus market value table from the DewClaw deliverable instructions.",
  ].join(" ");

  const userPrompt = [
    "PROPERTY BRIEF",
    buildPropertyBrief(input),
    "",
    "RETRIEVAL QUERY",
    retrievalQuery,
    "",
    "RETRIEVED DEWCLAW CONTEXT",
    formatChunks(chunks),
    "",
    "REQUIRED OUTPUT",
    "Produce the final answer as a DewClaw property evaluation deliverable with these exact sections:",
    DELIVERABLE_SECTIONS.map((section) => `- ${section}`).join("\n"),
    "",
    "TOP-OF-OUTPUT DECISION RULES",
    "- Start with the decision, next action, offer strategy, and confidence/data quality before the long analysis.",
    "- Recommendation must be one of: hot_lead, warm_lead, nurture, verify_first, pass.",
    "- Use verify_first when market value is plausible but critical facts are missing.",
    "- Use pass when the seller ask is clearly too high, value is unsupported, or risks outweigh upside.",
    "- Data quality grade: A = strong verified comps and property facts; B = solid but minor gaps; C = usable with several gaps; D = weak/placeholder; F = not enough to price responsibly.",
    "",
    "OFFER STRATEGY RULES",
    "- Give openingOffer, targetOffer, maxOffer, and walkAwayPrice.",
    "- If seller asking price is missing, still provide a preliminary offer strategy but label it preliminary.",
    "- If the seller ask is known, compare it directly against market value and walk-away price.",
    "- The opening offer should be practical for the caller, not just a mechanical percentage.",
    "",
    "PASTE-READY OUTPUT RULES",
    "- followUpBossNote should be 6 to 10 short lines, plain text, and ready to paste into FUB.",
    "- callPrepBrief should tell the caller what to say first and what to verify.",
    "- analystChecklist should be specific, checkable tasks, not generic reminders.",
    "",
    "IMPORTANT RULES",
    "- Always provide a specific Market Value and estimated price per acre when there is enough evidence.",
    "- If there is not enough evidence, give a preliminary value only and state exactly what would change it.",
    "- Include 50%, 60%, and 70% offer prices.",
    "- Only include value-add pricing if the context supports subdivision or another real value-add path.",
    "- List 3 to 5 key comps in the DewClaw format when the information is available. If exact comp details are missing, state what still needs verification.",
    "- Add negotiation leverage and seller questions only when grounded in the provided facts or context.",
    "- In Extra Notes, call out hazards, structures, unusual access, zoning uncertainty, or data gaps.",
    "- If the seller asking price is missing, state that Section 10 cannot be finalized yet.",
  ].join("\n");

  return {
    retrievalQuery,
    systemPrompt,
    userPrompt,
    combinedPrompt: `${systemPrompt}\n\n${userPrompt}`,
  };
}
