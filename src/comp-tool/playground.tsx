"use client";

import { useState, useTransition } from "react";

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

function GenerationSummary({ evaluation }: { evaluation: CompEvaluationDeliverable }) {
  return (
    <div className="stats-grid comp-summary-grid">
      <article className="stat-card decision-card">
        <span>Decision</span>
        <strong>{RECOMMENDATION_LABELS[evaluation.decisionSummary.recommendation]}</strong>
        <p>{evaluation.decisionSummary.nextAction || "--"}</p>
      </article>

      <article className="stat-card">
        <span>Market value</span>
        <strong>{evaluation.marketValue || "--"}</strong>
        <p>PPA: {evaluation.pricePerAcre || "--"}</p>
      </article>

      <article className="stat-card">
        <span>Opening offer</span>
        <strong>{evaluation.offerStrategy.openingOffer || evaluation.offerPrices.fiftyPercent || "--"}</strong>
        <p>
          Target: {evaluation.offerStrategy.targetOffer || "--"} | Max:{" "}
          {evaluation.offerStrategy.maxOffer || "--"}
        </p>
      </article>

      <article className="stat-card">
        <span>Data quality</span>
        <strong>{evaluation.dataQuality.grade || "--"}</strong>
        <p>{evaluation.dataQuality.score || evaluation.confidence}</p>
      </article>
    </div>
  );
}

function DecisionPanel({ evaluation }: { evaluation: CompEvaluationDeliverable }) {
  return (
    <div className="callout-card decision-panel">
      <strong>{evaluation.decisionSummary.oneLineDecision || "Decision needs review"}</strong>
      <p>{evaluation.decisionSummary.decisionReason || evaluation.executiveSummary}</p>

      {evaluation.decisionSummary.topRisks.length ? (
        <>
          <span className="section-label">Top risks</span>
          <ul className="flat-list">
            {evaluation.decisionSummary.topRisks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function OfferStrategyPanel({ evaluation }: { evaluation: CompEvaluationDeliverable }) {
  return (
    <div className="callout-card">
      <strong>Offer strategy</strong>
      <div className="mini-grid">
        <div>
          <span>Opening</span>
          <b>{evaluation.offerStrategy.openingOffer || "--"}</b>
        </div>
        <div>
          <span>Target</span>
          <b>{evaluation.offerStrategy.targetOffer || "--"}</b>
        </div>
        <div>
          <span>Max</span>
          <b>{evaluation.offerStrategy.maxOffer || "--"}</b>
        </div>
        <div>
          <span>Walk away</span>
          <b>{evaluation.offerStrategy.walkAwayPrice || "--"}</b>
        </div>
      </div>
      <p>{evaluation.offerStrategy.reasoning || evaluation.offerPrices.reasoning}</p>
      {evaluation.offerStrategy.scriptAngle ? (
        <p>
          <strong>Script angle:</strong> {evaluation.offerStrategy.scriptAngle}
        </p>
      ) : null}
    </div>
  );
}

function PasteReadyPanel({ evaluation }: { evaluation: CompEvaluationDeliverable }) {
  return (
    <div className="callout-card">
      <strong>Paste-ready outputs</strong>
      <div className="copy-stack">
        <div>
          <span className="section-label">Follow Up Boss note</span>
          <pre className="compact-pre">{evaluation.pasteReadyOutputs.followUpBossNote || "--"}</pre>
        </div>
        <div>
          <span className="section-label">Call prep brief</span>
          <pre className="compact-pre">{evaluation.pasteReadyOutputs.callPrepBrief || "--"}</pre>
        </div>
      </div>
    </div>
  );
}

function VerificationPanel({ evaluation }: { evaluation: CompEvaluationDeliverable }) {
  return (
    <div className="callout-card">
      <strong>Verification checklist</strong>
      <p>
        Data quality: {evaluation.dataQuality.grade || "--"} ({evaluation.dataQuality.score || "--"})
        . {evaluation.dataQuality.reasoning}
      </p>
      <ul className="flat-list">
        {[
          ...evaluation.pasteReadyOutputs.analystChecklist,
          ...evaluation.dataQuality.criticalMissingItems,
        ]
          .filter(Boolean)
          .slice(0, 10)
          .map((item) => (
            <li key={item}>{item}</li>
          ))}
      </ul>
    </div>
  );
}

export function CompToolPlayground() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<CompEvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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
          <span className={`filters-status${isPending ? " is-pending" : ""}`}>
            {isPending ? "Generating..." : "Ready"}
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

          <div className="input-pair">
            <label className="field">
              <span>County</span>
              <input
                type="text"
                placeholder="Example County"
                value={form.county}
                onChange={(event) => updateField("county", event.target.value)}
              />
            </label>

            <label className="field">
              <span>State</span>
              <input
                type="text"
                placeholder="TX"
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
              />
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
              <span>Seller asking price</span>
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
              rows={4}
              placeholder="What should this property be worth and is there any subdivision upside?"
              value={form.question}
              onChange={(event) => updateField("question", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Known facts / notes</span>
            <textarea
              rows={8}
              placeholder="Road frontage, wooded vs pasture, nearby comps, access issues, wetlands, structures, seller notes..."
              value={form.knownFacts}
              onChange={(event) => updateField("knownFacts", event.target.value)}
            />
          </label>

          <label className="field field-inline">
            <span>Top chunks</span>
            <input
              type="number"
              min={3}
              max={12}
              value={form.topK}
              onChange={(event) => updateField("topK", event.target.value)}
            />
          </label>

          <div className="hero-actions comp-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={runEvaluation}
              disabled={isPending}
            >
              {isPending ? "Generating..." : "Generate comp deliverable"}
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
          <span className="table-helper">Retrieval runs always. Generation runs when a model key is configured.</span>
        </div>

        {!result ? (
          <p className="auth-note">
            Submit a property question and the tool will assemble the DewClaw source packet, build
            the prompt, and generate the deliverable when a model key is available.
          </p>
        ) : (
          <div className="comp-output">
            {result.warnings.length ? (
              <div className="callout-card">
                <strong>Warnings</strong>
                <ul className="flat-list">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="callout-card">
              <strong>Model status</strong>
              <p>
                {result.generation.status === "completed"
                  ? `Completed with ${result.generation.provider} (${result.generation.model}).`
                  : result.generation.status === "not_configured"
                    ? "No model key is configured yet. Retrieval and prompt assembly still completed."
                    : `Generation failed with ${result.generation.provider} (${result.generation.model}).`}
              </p>
              {result.generation.error ? <p>{result.generation.error}</p> : null}
              {result.generation.artifactPath ? (
                <p>
                  Artifact: <code>{result.generation.artifactPath}</code>
                </p>
              ) : null}
              {result.generation.usage ? (
                <p>
                  Tokens in/out: {result.generation.usage.inputTokens ?? "--"} /{" "}
                  {result.generation.usage.outputTokens ?? "--"}
                </p>
              ) : null}
            </div>

            {result.parcelEnrichment ? (
              <div className="callout-card">
                <strong>Parcel link ingestion</strong>
                <ul className="flat-list">
                  <li>Status: {result.parcelEnrichment.status}</li>
                  <li>Fetch mode: {result.parcelEnrichment.fetchMode}</li>
                  <li>
                    Final URL: {result.parcelEnrichment.finalUrl || result.request.parcelLink || "--"}
                  </li>
                  <li>Page title: {result.parcelEnrichment.pageTitle || "--"}</li>
                  <li>Extracted county: {result.parcelEnrichment.extractedFields.county || "--"}</li>
                  <li>Extracted state: {result.parcelEnrichment.extractedFields.state || "--"}</li>
                  <li>
                    Extracted acreage: {result.parcelEnrichment.extractedFields.acreage || "--"}
                  </li>
                  <li>
                    Extracted known facts:{" "}
                    {result.parcelEnrichment.extractedFields.knownFacts || "--"}
                  </li>
                  <li>
                    Diagnostics: {result.parcelEnrichment.diagnostics.join(" | ") || "--"}
                  </li>
                </ul>
              </div>
            ) : null}

            <div className="callout-card">
              <strong>Resolved request</strong>
              <ul className="flat-list">
                <li>County: {result.request.county || "--"}</li>
                <li>State: {result.request.state || "--"}</li>
                <li>Acreage: {result.request.acreage || "--"}</li>
                <li>Seller asking price: {result.request.sellerAskingPrice || "--"}</li>
                <li>Primary question: {result.request.question || "--"}</li>
                <li>Known facts: {result.request.knownFacts || "--"}</li>
              </ul>
            </div>

            {result.generation.evaluation ? (
              <>
                <GenerationSummary evaluation={result.generation.evaluation} />

                <DecisionPanel evaluation={result.generation.evaluation} />

                <OfferStrategyPanel evaluation={result.generation.evaluation} />

                <PasteReadyPanel evaluation={result.generation.evaluation} />

                <VerificationPanel evaluation={result.generation.evaluation} />

                <div className="callout-card">
                  <strong>Executive summary</strong>
                  <p>{result.generation.evaluation.executiveSummary}</p>
                </div>

                <div className="prompt-block">
                  <div className="prompt-block-head">
                    <strong>Generated deliverable</strong>
                  </div>
                  <pre>{result.generation.evaluation.fullDeliverableMarkdown}</pre>
                </div>

                <div className="callout-card">
                  <strong>Model notes</strong>
                  <ul className="flat-list">
                    <li>Confidence: {result.generation.evaluation.confidence}</li>
                    <li>Lead stage: {result.generation.evaluation.leadStageClassification.stage || "--"}</li>
                    <li>
                      Recommended list price:{" "}
                      {result.generation.evaluation.recommendedListPrice || "--"}
                    </li>
                    <li>
                      Data gaps: {result.generation.evaluation.dataGaps.join(" | ") || "--"}
                    </li>
                  </ul>
                </div>
              </>
            ) : null}

            <div className="callout-card">
              <strong>Retrieval query</strong>
              <p>{result.promptPackage.retrievalQuery}</p>
            </div>

            <div className="callout-card">
              <strong>Recommended sources</strong>
              <ul className="flat-list">
                {result.retrieval.recommendedSources.map((source) => (
                  <li key={source.docId}>
                    <code>{source.docId}</code> - {source.useFor}
                  </li>
                ))}
              </ul>
            </div>

            <div className="prompt-block">
              <div className="prompt-block-head">
                <strong>System prompt</strong>
              </div>
              <pre>{result.promptPackage.systemPrompt}</pre>
            </div>

            <div className="prompt-block">
              <div className="prompt-block-head">
                <strong>User prompt</strong>
              </div>
              <pre>{result.promptPackage.userPrompt}</pre>
            </div>

            <div className="prompt-block">
              <div className="prompt-block-head">
                <strong>Paste-ready prompt</strong>
              </div>
              <pre>{result.promptPackage.combinedPrompt}</pre>
            </div>

            {result.generation.rawText ? (
              <div className="prompt-block">
                <div className="prompt-block-head">
                  <strong>Raw model output</strong>
                </div>
                <pre>{result.generation.rawText}</pre>
              </div>
            ) : null}

            <div className="prompt-block">
              <div className="prompt-block-head">
                <strong>Retrieved chunks</strong>
              </div>
              <div className="chunk-list">
                {result.retrieval.chunks.map((chunk) => (
                  <article key={chunk.chunkId} className="chunk-card">
                    <div className="chunk-meta">
                      <span>{chunk.docId}</span>
                      <span>p.{chunk.pageNumber}</span>
                      <span>score {chunk.score}</span>
                    </div>
                    {chunk.matchedTerms.length ? (
                      <p className="chunk-match">Matched: {chunk.matchedTerms.join(", ")}</p>
                    ) : null}
                    <p>{chunk.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
