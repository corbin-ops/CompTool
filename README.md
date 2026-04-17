# Dew Claw Comp Tool

Standalone password-protected Next.js app for building DewClaw comp prompts from the PDF corpus.

## What this app does

- Accepts parcel details, seller ask, and analyst notes
- Retrieves relevant DewClaw handbook chunks from the local corpus
- Builds a system prompt, user prompt, and combined paste-ready prompt
- Calls OpenAI or Anthropic when a provider key is configured
- Saves each run to `data/evaluations` for QA and prompt tuning
- Supports separate modes for general comping, pricing, subdivision, rural, and deliverable-only work

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:

   ```bash
   APP_PASSWORD=your-shared-password
   AUTH_SECRET=a-long-random-secret
   COMP_CORPUS_DIR=data/comp-corpus
   LLM_PROVIDER=auto
   OPENAI_API_KEY=...
   OPENAI_MODEL=gpt-4o-mini
   ANTHROPIC_API_KEY=...
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:3000
   ```

## Corpus rebuild

To rebuild the DewClaw corpus from the source PDFs in `~/Downloads`:

```bash
npm run build:comp-corpus
```

## Provider notes

- If both keys are present and `LLM_PROVIDER=auto`, the app currently prefers Anthropic first, then OpenAI.
- If no provider key is present, the app still returns retrieval, prompts, and a `not_configured` generation state.
- Evaluation artifacts are written to `data/evaluations/*.json`.

## Deploy to Render

This repo includes [render.yaml](./render.yaml) for a Render web service deployment.

### Recommended setup

1. In Render, create a new Blueprint or Web Service from this GitHub repo.
2. If you use the included Blueprint, Render will prompt you for:
   - `APP_PASSWORD`
   - `ANTHROPIC_API_KEY`
3. Review the generated `AUTH_SECRET` and keep it as-is unless you need to rotate it.
4. Deploy the service and open the generated `onrender.com` URL.

### Current Render settings

- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/login`
- Model provider: Anthropic (`claude-sonnet-4-6`)
- Node version: `22.22.0`

### Important note about saved evaluations

The app writes QA artifacts to `data/evaluations`, but Render's filesystem is ephemeral by default. That means saved evaluations can be lost on restart or redeploy unless you either:

- attach a persistent disk and mount it under `/opt/render/project/src/data/evaluations`, or
- move evaluation storage to a durable service such as a database or object store.
