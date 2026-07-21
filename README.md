# Deadline Desk

Deadline Desk is an OpenAI Build Week proof of concept that turns messy purchase documents into human-verified deadline reminders for returns, warranties, renewals, cancellations, service contracts, and other purchase obligations.

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
- Cerebras runtime adapter for Gemma 4 31B, using its OpenAI-compatible API
- Local demo workspace persistence in `data/demo-store.json`
- No LangChain and no full authentication for MVP

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Deploy to Railway

Deadline Desk can deploy directly from a GitHub repository; a Dockerfile is not required.

1. Create a Railway project and choose **Deploy from GitHub repo**.
2. Select this repository. Railway will run `npm run build` and `npm run start`.
3. In the service's **Variables** tab, add the required values below. Do not commit the API key to GitHub.
4. Generate a public domain from Railway's **Networking** settings and open it to test an extraction.

For a demo, the app can use Railway's ephemeral filesystem. To preserve saved purchases, reminders, and extraction history between deployments, attach a Railway Volume at `/app/data`.

## Environment Variables

Required runtime target:

```bash
AI_PROVIDER=cerebras
CEREBRAS_API_KEY=
CEREBRAS_MODEL=gemma-4-31b
```

`CEREBRAS_API_KEY` is required for every extraction, including built-in samples. The app fails clearly if it is missing; it does not substitute fixture output.

The deployed application does not make OpenAI API calls. Codex with GPT-5.6 was used to build the project, not as a runtime dependency.

## Manual Entries

When a document lacks deadline evidence, users can add a verified manual deadline from the dashboard. Manual entries support return, warranty, renewal, cancellation, service, and other deadline types.

## Sample Data

The app includes built-in document samples that each run through the live extraction adapter:

- Clear retail receipt with a 30-day return window and one-year warranty
- Invoice with no return or warranty terms
- Order confirmation with an explicit return-by date
- Warranty card with a stated coverage expiration date
- Final-sale receipt, where no return deadline is invented
- Subscription receipt with an annual renewal date

The samples are PNG files. Use them for judging to avoid personal receipt data. Selecting one sends it through the configured Cerebras adapter and requires the same review step as an upload.

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

The runtime extraction path is Cerebras. A missing Cerebras key is an explicit configuration error; the app does not return fixture output in its place. AI output is untrusted until it is validated and normalized before the user reviews it.

## Tests

```bash
npm test
```

Focused tests cover date normalization, deadline grouping, reminder generation, and preserving unknown deadlines.

## Build Week Notes

Runtime extraction uses Cerebras Gemma 4 31B through an OpenAI-compatible API adapter. Codex with GPT-5.6 helped build the app: it supported architecture, schema and prompt design, validation strategy, implementation, debugging, testing, and submission preparation. The app keeps AI output untrusted until it is validated and normalized with Zod.

## Known Limitations

- The local demo store is intended for a single-instance demo, not production authentication or storage. On Railway, attach a volume at `/app/data` if records must survive redeploys.
- Uploaded PDFs/images depend on the configured runtime provider's document understanding support.
- Many purchase documents do not contain deadline policy text.
- Unknown deadlines are shown as unknown and require user verification.
- Retailer policy lookup and real email delivery are future work; reminders are currently simulated in the app.
