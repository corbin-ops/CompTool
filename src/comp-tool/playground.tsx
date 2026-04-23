"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import {
  COMMON_COUNTY_OPTIONS_BY_STATE,
  US_STATE_OPTIONS,
} from "@/comp-tool/location-data";
import {
  COMP_MODE_DESCRIPTIONS,
  COMP_MODE_LABELS,
  COMP_MODES,
  type CompEvaluateResponse,
  type CompEvaluationDeliverable,
  type CompMode,
} from "@/comp-tool/types";

type FormState = {
  mode: CompMode;
  parcelLink: string;
  county: string;
  state: string;
  acreage: string;
  sellerAskingPrice: string;
  question: string;
  knownFacts: string;
  topK: string;
};

type ParseParcelResponse = Pick<
  CompEvaluateResponse,
  "request" | "parcelEnrichment" | "warnings"
>;

const DEFAULT_FORM: FormState = {
  mode: "general",
  parcelLink: "",
  county: "",
  state: "",
  acreage: "",
  sellerAskingPrice: "",
  question: "",
  knownFacts: "",
  topK: "8",
};

const RECOMMENDATION_LABELS: Record<
  CompEvaluationDeliverable["decisionSummary"]["recommendation"],
  string
> = {
  hot_lead: "Hot lead",
  warm_lead: "Warm lead",
  nurture: "Nurture",
  verify_first: "Verify first",
  pass: "Pass",
};

function mergeText(current: string, incoming: string) {
  const parts = [current, incoming]
    .map((part) => part.trim())
    .filter(Boolean);
  const unique = [...new Set(parts.map((part) => part.toLowerCase()))];

  if (unique.length === 1 && parts.length > 1) {
    return parts[0];
  }

  return parts.join("\n");
}

function BulletList({ items, empty = "N/A" }: { items: string[]; empty?: string }) {
  const filtered = items.filter(Boolean);

  if (!filtered.length) {
    return <p className="muted-copy">{empty}</p>;
  }

  return (
    <ul className="flat-list compact-list">
      {filtered.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function OutputSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="callout-card simple-output-section">
      <div className="simple-section-head">
        <strong>{title}</strong>
        <Link href={`/references#${id}`}>Reference</Link>
      </div>
      {children}
    </section>
  );
}

function RunStatus({ result }: { result: CompEvaluateResponse }) {
  return (
    <div className="run-status">
      <span>
        {result.generation.status === "completed"
          ? `Generated with ${result.generation.provider}`
          : result.generation.status === "not_configured"
            ? "Prompt built, model not configured"
            : "Generation failed"}
      </span>
      {result.generation.usage ? (
        <span>
          Tokens: {result.generation.usage.inputTokens ?? "--"} /{" "}
          {result.generation.usage.outputTokens ?? "--"}
        </span>
      ) : null}
    </div>
  );
}

function SimplifiedOutput({ result }: { result: CompEvaluateResponse }) {
  const evaluation = result.generation.evaluation;

  if (!evaluation) {
    return (
      <div className="comp-output">
        <RunStatus result={result} />
        {result.warnings.length ? (
          <OutputSection id="others" title="Warnings">
            <BulletList items={result.warnings} />
          </OutputSection>
        ) : null}
        <OutputSection id="others" title="Prompt packet">
          <p className="muted-copy">
            The model did not return a completed comp. Use the generated prompt or fix the model
            configuration.
          </p>
        </OutputSection>
      </div>
    );
  }

  return (
    <div className="comp-output compact-output">
      <RunStatus result={result} />

      {result.warnings.length ? (
        <OutputSection id="others" title="Warnings">
          <BulletList items={result.warnings} />
        </OutputSection>
      ) : null}

      <OutputSection id="decision" title="1. Decision">
        <BulletList
          items={[
            `Recommendation: ${RECOMMENDATION_LABELS[evaluation.decisionSummary.recommendation]}`,
            `Next action: ${evaluation.decisionSummary.nextAction || "Needs verification"}`,
            `Reason: ${evaluation.decisionSummary.decisionReason || evaluation.executiveSummary}`,
            ...evaluation.decisionSummary.topRisks.slice(0, 3).map((risk) => `Risk: ${risk}`),
          ]}
        />
      </OutputSection>

      <OutputSection id="market-value" title="2. Market Value">
        <BulletList
          items={[
            `Market value: ${evaluation.marketValue || "Needs verification"}`,
            `Price per acre: ${evaluation.pricePerAcre || "Needs verification"}`,
            `Confidence: ${evaluation.confidence}`,
            `Data quality: ${evaluation.dataQuality.grade || "--"} (${evaluation.dataQuality.score || "--"})`,
            `Reason: ${evaluation.marketValueReasoning || "N/A"}`,
          ]}
        />
      </OutputSection>

      <OutputSection id="offer" title="3. Offer">
        <BulletList
          items={[
            `Opening: ${evaluation.offerStrategy.openingOffer || evaluation.offerPrices.fiftyPercent || "N/A"}`,
            `Target: ${evaluation.offerStrategy.targetOffer || evaluation.offerPrices.sixtyPercent || "N/A"}`,
            `Max: ${evaluation.offerStrategy.maxOffer || evaluation.offerPrices.seventyPercent || "N/A"}`,
            `Walk away: ${evaluation.offerStrategy.walkAwayPrice || "N/A"}`,
            `List price: ${evaluation.recommendedListPrice || "N/A"}`,
            `Script angle: ${evaluation.offerStrategy.scriptAngle || "N/A"}`,
          ]}
        />
      </OutputSection>

      <OutputSection id="others" title="4. Others">
        <div className="copy-stack">
          <div>
            <span className="section-label">Follow Up Boss note</span>
            <pre className="compact-pre">
              {evaluation.pasteReadyOutputs.followUpBossNote || "N/A"}
            </pre>
          </div>

          <div>
            <span className="section-label">Call prep</span>
            <pre className="compact-pre">{evaluation.pasteReadyOutputs.callPrepBrief || "N/A"}</pre>
          </div>

          <div>
            <span className="section-label">Verify next</span>
            <BulletList
              items={[
                ...evaluation.pasteReadyOutputs.analystChecklist,
                ...evaluation.dataQuality.criticalMissingItems,
                ...evaluation.dataGaps,
              ].slice(0, 8)}
            />
          </div>
        </div>
      </OutputSection>

      <details className="details-card">
        <summary>Full deliverable</summary>
        <pre>{evaluation.fullDeliverableMarkdown}</pre>
      </details>

      <details className="details-card">
        <summary>Run details</summary>
        <BulletList
          items={[
            `State: ${result.request.state || "--"}`,
            `County: ${result.request.county || "--"}`,
            `Acreage: ${result.request.acreage || "--"}`,
            `Asking price: ${result.request.sellerAskingPrice || "--"}`,
            `Parcel ingestion: ${result.parcelEnrichment?.status || "not used"}`,
            `Artifact: ${result.generation.artifactPath || "--"}`,
          ]}
        />
      </details>
    </div>
  );
}

export function CompToolPlayground() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<CompEvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isParsing, startParseTransition] = useTransition();
  const countyOptions = COMMON_COUNTY_OPTIONS_BY_STATE[form.state] ?? [];

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "state" ? { county: "" } : {}),
    }));
  }

  function parseParcelLink() {
    setError(null);
    setParseStatus(null);

    if (!form.parcelLink.trim()) {
      setError("Add a parcel link before parsing.");
      return;
    }

    startParseTransition(async () => {
      try {
        const response = await fetch("/api/comp/parse-parcel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to parse the parcel link.");
        }

        const payload = (await response.json()) as ParseParcelResponse;

        setForm((current) => ({
          ...current,
          state: payload.request.state || current.state,
          county: payload.request.county || current.county,
          acreage: payload.request.acreage || current.acreage,
          question: current.question || payload.request.question,
          knownFacts: mergeText(current.knownFacts, payload.request.knownFacts),
        }));

        const status = payload.parcelEnrichment?.status ?? "not_used";
        const fetchMode = payload.parcelEnrichment?.fetchMode ?? "not_applicable";
        setParseStatus(`Parse status: ${status} (${fetchMode}).`);
      } catch (caughtError) {
        setParseStatus(null);
        setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      }
    });
  }

  function runEvaluation() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/comp/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to evaluate the comp request.");
        }

        const payload = (await response.json()) as CompEvaluateResponse;
        setResult(payload);
      } catch (caughtError) {
        setResult(null);
        setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="two-column-grid comp-tool-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Input</p>
            <h2>Comp request</h2>
          </div>
          <span className={`filters-status${isPending || isParsing ? " is-pending" : ""}`}>
            {isPending ? "Generating..." : isParsing ? "Parsing..." : "Ready"}
          </span>
        </div>

        <div className="comp-form">
          <label className="field">
            <span>Mode</span>
            <select
              value={form.mode}
              onChange={(event) => updateField("mode", event.target.value as CompMode)}
            >
              {COMP_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {COMP_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
            <small>{COMP_MODE_DESCRIPTIONS[form.mode]}</small>
          </label>

          <label className="field">
            <span>Parcel link</span>
            <input
              type="url"
              placeholder="https://..."
              value={form.parcelLink}
              onChange={(event) => updateField("parcelLink", event.target.value)}
            />
          </label>

          <button
            className="light-button"
            type="button"
            onClick={parseParcelLink}
            disabled={isParsing}
          >
            {isParsing ? "Parsing parcel link..." : "Parse parcel link"}
          </button>

          {parseStatus ? <p className="auth-note">{parseStatus}</p> : null}

          <div className="input-pair">
            <label className="field">
              <span>State</span>
              <select
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
              >
                <option value="">Select state</option>
                {US_STATE_OPTIONS.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>County</span>
              <input
                list="county-options"
                type="text"
                placeholder={form.state ? "Select or type county" : "Select state first"}
                value={form.county}
                onChange={(event) => updateField("county", event.target.value)}
              />
              <datalist id="county-options">
                {countyOptions.map((county) => (
                  <option key={county} value={county} />
                ))}
              </datalist>
              <small>Searchable county dropdown. Type manually if the county is not listed.</small>
            </label>
          </div>

          <div className="input-pair">
            <label className="field">
              <span>Acreage</span>
              <input
                type="text"
                placeholder="12.5"
                value={form.acreage}
                onChange={(event) => updateField("acreage", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Asking price</span>
              <input
                type="text"
                placeholder="$85,000"
                value={form.sellerAskingPrice}
                onChange={(event) => updateField("sellerAskingPrice", event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Primary question</span>
            <textarea
              rows={3}
              placeholder="What should this property be worth and what should we offer?"
              value={form.question}
              onChange={(event) => updateField("question", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Known facts / notes</span>
            <textarea
              rows={7}
              placeholder="Road frontage, wooded vs pasture, nearby comps, access issues, wetlands, structures, seller notes..."
              value={form.knownFacts}
              onChange={(event) => updateField("knownFacts", event.target.value)}
            />
          </label>

          <div className="hero-actions comp-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={runEvaluation}
              disabled={isPending}
            >
              {isPending ? "Generating..." : "Generate comp"}
            </button>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Output</p>
            <h2>Comp result</h2>
          </div>
          <Link className="reference-link" href="/references">
            References
          </Link>
        </div>

        {!result ? (
          <p className="auth-note">
            Output will stay short: decision, market value, offer, and other notes. Methodology
            lives on the references page.
          </p>
        ) : (
          <SimplifiedOutput result={result} />
        )}
      </section>
    </div>
  );
}
