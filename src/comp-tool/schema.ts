import type {
  CompConfidence,
  CompEvaluationDeliverable,
  CompKeyComp,
  CompLeadStageClassification,
  CompOfferPrices,
  CompValueAddMarketValue,
  CompValueAddOfferPrice,
} from "@/comp-tool/types";

export const COMP_EVALUATION_SCHEMA_NAME = "dewclaw_comp_evaluation";

export const COMP_EVALUATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "executiveSummary",
    "marketValue",
    "pricePerAcre",
    "marketValueReasoning",
    "confidence",
    "offerPrices",
    "valueAddMarketValue",
    "valueAddOfferPrice",
    "negotiationStrategies",
    "extraNotes",
    "recommendedListPrice",
    "recommendedListPriceReasoning",
    "keyComps",
    "questionsToAskSeller",
    "leadStageClassification",
    "dataGaps",
    "fullDeliverableMarkdown",
  ],
  properties: {
    executiveSummary: {
      type: "string",
      description: "Two to four sentence operating summary of value, risks, and next move.",
    },
    marketValue: {
      type: "string",
      description: "Specific market value estimate in dollars.",
    },
    pricePerAcre: {
      type: "string",
      description: "Specific price per acre estimate.",
    },
    marketValueReasoning: {
      type: "string",
      description: "Short explanation of why the market value estimate was chosen.",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
      description: "Confidence in the valuation based on the available data.",
    },
    offerPrices: {
      type: "object",
      additionalProperties: false,
      required: [
        "fiftyPercent",
        "sixtyPercent",
        "seventyPercent",
        "landlockedPrice",
        "reasoning",
      ],
      properties: {
        fiftyPercent: { type: "string" },
        sixtyPercent: { type: "string" },
        seventyPercent: { type: "string" },
        landlockedPrice: {
          type: "string",
          description: "Use N/A when not relevant.",
        },
        reasoning: { type: "string" },
      },
    },
    valueAddMarketValue: {
      type: "object",
      additionalProperties: false,
      required: [
        "status",
        "marketValue",
        "summary",
        "lotCount",
        "lotSize",
        "estimatedCosts",
      ],
      properties: {
        status: {
          type: "string",
          enum: ["available", "not_applicable", "needs_verification"],
        },
        marketValue: { type: "string" },
        summary: { type: "string" },
        lotCount: { type: "string" },
        lotSize: { type: "string" },
        estimatedCosts: { type: "string" },
      },
    },
    valueAddOfferPrice: {
      type: "object",
      additionalProperties: false,
      required: [
        "status",
        "fiftyPercent",
        "sixtyPercent",
        "seventyPercent",
        "reasoning",
      ],
      properties: {
        status: {
          type: "string",
          enum: ["available", "not_applicable", "needs_verification"],
        },
        fiftyPercent: { type: "string" },
        sixtyPercent: { type: "string" },
        seventyPercent: { type: "string" },
        reasoning: { type: "string" },
      },
    },
    negotiationStrategies: {
      type: "array",
      items: { type: "string" },
    },
    extraNotes: {
      type: "array",
      items: { type: "string" },
    },
    recommendedListPrice: {
      type: "string",
    },
    recommendedListPriceReasoning: {
      type: "string",
    },
    keyComps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["acreage", "salePrice", "pricePerAcre", "status", "notes"],
        properties: {
          acreage: { type: "string" },
          salePrice: { type: "string" },
          pricePerAcre: { type: "string" },
          status: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
    questionsToAskSeller: {
      type: "array",
      items: { type: "string" },
    },
    leadStageClassification: {
      type: "object",
      additionalProperties: false,
      required: [
        "sellerAskingPrice",
        "marketValue",
        "differenceDollar",
        "differencePercentOfMarketValue",
        "stage",
        "reasoning",
      ],
      properties: {
        sellerAskingPrice: { type: "string" },
        marketValue: { type: "string" },
        differenceDollar: { type: "string" },
        differencePercentOfMarketValue: { type: "string" },
        stage: { type: "string" },
        reasoning: { type: "string" },
      },
    },
    dataGaps: {
      type: "array",
      items: { type: "string" },
    },
    fullDeliverableMarkdown: {
      type: "string",
      description: "The final DewClaw deliverable in readable markdown.",
    },
  },
} as const;

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asConfidence(value: unknown): CompConfidence {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => asString(item))
        .filter(Boolean)
    : [];
}

function normalizeOfferPrices(value: unknown): CompOfferPrices {
  const record = asRecord(value);

  return {
    fiftyPercent: asString(record.fiftyPercent),
    sixtyPercent: asString(record.sixtyPercent),
    seventyPercent: asString(record.seventyPercent),
    landlockedPrice: asString(record.landlockedPrice),
    reasoning: asString(record.reasoning),
  };
}

function normalizeValueAddMarketValue(value: unknown): CompValueAddMarketValue {
  const record = asRecord(value);
  const status = asString(record.status);

  return {
    status:
      status === "available" || status === "not_applicable" || status === "needs_verification"
        ? status
        : "not_applicable",
    marketValue: asString(record.marketValue),
    summary: asString(record.summary),
    lotCount: asString(record.lotCount),
    lotSize: asString(record.lotSize),
    estimatedCosts: asString(record.estimatedCosts),
  };
}

function normalizeValueAddOfferPrice(value: unknown): CompValueAddOfferPrice {
  const record = asRecord(value);
  const status = asString(record.status);

  return {
    status:
      status === "available" || status === "not_applicable" || status === "needs_verification"
        ? status
        : "not_applicable",
    fiftyPercent: asString(record.fiftyPercent),
    sixtyPercent: asString(record.sixtyPercent),
    seventyPercent: asString(record.seventyPercent),
    reasoning: asString(record.reasoning),
  };
}

function normalizeKeyComp(value: unknown): CompKeyComp {
  const record = asRecord(value);

  return {
    acreage: asString(record.acreage),
    salePrice: asString(record.salePrice),
    pricePerAcre: asString(record.pricePerAcre),
    status: asString(record.status),
    notes: asString(record.notes),
  };
}

function normalizeLeadStageClassification(value: unknown): CompLeadStageClassification {
  const record = asRecord(value);

  return {
    sellerAskingPrice: asString(record.sellerAskingPrice),
    marketValue: asString(record.marketValue),
    differenceDollar: asString(record.differenceDollar),
    differencePercentOfMarketValue: asString(record.differencePercentOfMarketValue),
    stage: asString(record.stage),
    reasoning: asString(record.reasoning),
  };
}

export function normalizeCompEvaluationDeliverable(
  value: unknown,
): CompEvaluationDeliverable {
  const record = asRecord(value);

  return {
    executiveSummary: asString(record.executiveSummary),
    marketValue: asString(record.marketValue),
    pricePerAcre: asString(record.pricePerAcre),
    marketValueReasoning: asString(record.marketValueReasoning),
    confidence: asConfidence(record.confidence),
    offerPrices: normalizeOfferPrices(record.offerPrices),
    valueAddMarketValue: normalizeValueAddMarketValue(record.valueAddMarketValue),
    valueAddOfferPrice: normalizeValueAddOfferPrice(record.valueAddOfferPrice),
    negotiationStrategies: asStringArray(record.negotiationStrategies),
    extraNotes: asStringArray(record.extraNotes),
    recommendedListPrice: asString(record.recommendedListPrice),
    recommendedListPriceReasoning: asString(record.recommendedListPriceReasoning),
    keyComps: Array.isArray(record.keyComps)
      ? record.keyComps
          .map((item) => normalizeKeyComp(item))
          .filter((item) => Object.values(item).some(Boolean))
      : [],
    questionsToAskSeller: asStringArray(record.questionsToAskSeller),
    leadStageClassification: normalizeLeadStageClassification(record.leadStageClassification),
    dataGaps: asStringArray(record.dataGaps),
    fullDeliverableMarkdown: asString(record.fullDeliverableMarkdown),
  };
}
