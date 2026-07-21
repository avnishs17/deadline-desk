# Deadline Desk

Deadline Desk is a polished proof-of-concept for OpenAI Build Week. It turns messy purchase documents into human-verified deadline reminders for returns, warranties, renewals, cancellations, service contracts, and other purchase obligations.

## What It Solves

People do not miss deadlines because they refuse to use calendars. They miss them because the deadline is buried in a receipt, invoice, warranty card, renewal notice, service contract, or order page. Deadline Desk extracts what is present, clearly marks uncertainty, asks the user to verify, then saves the verified deadline record.

## Product Positioning

Deadline Desk is not a generic subscription tracker. The differentiator is document-to-deadline extraction:

- online order receipt with a stated return-by date
- retail receipt with a return policy window
- warranty PDF or product card with coverage terms
- SaaS invoice with a renewal date
- service or membership agreement with a cancellation deadline
- invoice with no policy text, shown as unknown instead of invented

## Current POC Features

- Live extraction for uploaded and built-in sample documents, with confidence, evidence, warnings, and missing fields
- Review and edit before saving
- Deadline-centric dashboard grouped by urgency
- Risk scoring for uncertain, inferred, missing, or urgent deadlines
- Manual deadline entry for cancellation, service, return, warranty, renewal, and other obligations
- Saved purchase edit/delete controls
- Reminder schedules and simulated reminder log
- Calendar `.ics` export for known deadlines
- Local workspace clear control
- Extraction history with provider/model and validation counts

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS with small shadcn-style local UI primitives
- Zod validation and normalization
- Cerebras OpenAI-compatible runtime adapter for Gemma 4 31B
- Local demo workspace persistence in `data/demo-store.json`
- No LangChain and no full authentication for MVP

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment Variables

Required runtime target:

```bash
AI_PROVIDER=cerebras
CEREBRAS_API_KEY=
CEREBRAS_MODEL=gemma-4-31b
```

Optional future verifier:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6
ENABLE_OPENAI_VERIFIER=false
```

`CEREBRAS_API_KEY` is required for every extraction, including built-in samples. The app fails clearly if it is missing; it does not substitute fixture output.

## Manual Entries

When a document lacks deadline evidence, users can add a verified manual deadline from the dashboard. Manual entries support return, warranty, renewal, cancellation, service, and other deadline types.

## Sample Data

The app includes built-in document samples that each run through the live extraction adapter:

- Clear retail receipt with a 30-day return window and one-year warranty
- Invoice with no return or warranty terms
- Subscription receipt with an annual renewal date

Use samples for judging to avoid personal receipt data. Selecting any sample sends that document through the configured Cerebras adapter, then requires the same review step as an upload.

## Architecture

Flow:

```txt
Upload or sample selection
  -> /api/extract
  -> AI provider adapter
  -> raw JSON
  -> Zod validation and date normalization
  -> review/edit form
  -> /api/purchases
  -> local demo store
  -> dashboard and simulated reminders
```

The provider layer is isolated in `lib/ai`. `cerebras-provider.ts` is the runtime path, `openai-provider.ts` is intentionally stubbed for a later GPT-5.6 verification pass, A missing Cerebras key is an explicit configuration error; no demo provider or fixture result is used at runtime.

## Tests

```bash
npm test
```

Focused tests cover date normalization, deadline grouping, reminder generation, and preserving unknown deadlines.

## Build Week Notes

Runtime extraction is designed for Cerebras Gemma 4 31B through an OpenAI-compatible API adapter. Codex/GPT-5.6 was used for app implementation, architecture interpretation, schema design, prompt design, validation strategy, debugging, and submission preparation. The app keeps AI output untrusted until validated and normalized with Zod.

## Known Limitations

- The local demo store is not production authentication or storage.
- Uploaded PDFs/images depend on the configured runtime provider's document understanding support.
- Many purchase documents do not contain deadline policy text.
- Unknown deadlines are shown as unknown and require user verification.
- Retailer policy lookup, calendar export, email sending, and GPT-5.6 verification are future work.
