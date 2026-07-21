# Deadline Desk - Project Architecture Plan

## 1. Project Summary

Deadline Desk is a web app that helps users avoid missing return, warranty, renewal, cancellation, and service deadlines hidden inside receipts, invoices, warranty cards, subscription notices, and purchase documents.

The proof of concept lets a user upload a receipt or invoice, extracts key purchase and deadline information with an AI model, asks the user to verify uncertain fields, saves the verified record, and displays upcoming deadlines in a dashboard.

For OpenAI Build Week, the strongest version is a focused, polished MVP rather than a broad integration-heavy product.

## 2. Build Week Positioning

Track: Apps for Your Life

Problem:
People lose money because return windows, warranties, trial renewals, and service deadlines are buried in messy purchase documents.

Solution:
Deadline Desk turns uploaded purchase documents into verified deadline reminders.

Important framing:
- The app should not claim perfect AI accuracy.
- The product should clearly show confidence, uncertainty, and missing information.
- The user should always verify extracted data before saving.

Recommended submission story:
Deadline Desk combines AI document understanding with a human verification workflow, so users get useful deadline tracking without blindly trusting imperfect extraction.

## 3. Current Constraint

The available $100 credits are Codex-only credits, not OpenAI API credits.

Because of that, the runtime app should not depend on GPT-5.6 API calls unless we choose to pay separately.

Practical plan:
- Use Codex/GPT-5.6 for development, architecture, prompt design, schema design, validation strategy, UI implementation, debugging, and README/demo preparation.
- Use Cerebras Gemma 4 31B as the runtime extraction model.
- Keep the model layer provider-agnostic so GPT-5.6 can be added later as an optional verifier or primary model.

Hackathon risk:
The Build Week rules emphasize Codex and GPT-5.6. Using GPT-5.6 through Codex for building is useful, but a runtime GPT-5.6 path would make the submission story stronger. If budget allows, add an optional "GPT-5.6 verification pass" behind a disabled-by-default provider adapter.

## 4. MVP Scope

### Must Have

- Upload PDF, JPG, or PNG purchase document.
- Extract purchase details:
  - merchant
  - item or product name
  - purchase date
  - total amount
  - currency
  - order number if present
  - return deadline if present or inferable
  - warranty deadline if present or inferable
  - renewal/subscription date if present
  - confidence per field
  - evidence text per field
  - warnings and missing fields
- Review screen where user can edit extracted fields.
- User explicitly saves verified record.
- Dashboard of saved purchases/deadlines.
- Deadline urgency groups:
  - overdue
  - due in 7 days
  - due in 30 days
  - later
  - missing deadline
- Sample documents for demo/testing.
- README with setup, environment variables, sample workflow, and Build Week notes.

### Should Have

- Reminder dates generated from saved deadlines.
- Basic email reminders through Resend or a simulated reminder log.
- Search/filter dashboard by merchant, item, status, deadline type.
- Delete document/record action.
- Local demo mode without authentication.

### Nice To Have

- Optional GPT-5.6 verifier adapter.
- Calendar export as `.ics`.
- Manual "add purchase" form.
- Confidence badges and evidence popover.
- Retailer policy note field.

### Explicitly Out Of Scope For MVP

- Gmail/email import.
- Browser extension.
- Mobile app.
- Shared household accounts.
- Google Calendar OAuth.
- Retailer policy web scraping.
- Full authentication system.
- Multi-tenant production security.
- Complex LangChain-style agent orchestration.

## 5. Recommended Tech Stack

### App Framework

Next.js with App Router and TypeScript.

Reason:
Next.js is enough for the full proof of concept: UI, API routes, server actions, deployment, file upload endpoints, and dashboard pages.

### Styling/UI

- Tailwind CSS
- shadcn/ui
- lucide-react icons

Reason:
Fast to build, polished enough for a hackathon demo, and easy to keep consistent.

### AI Runtime

Primary:
- Cerebras OpenAI-compatible API
- Gemma 4 31B

Optional:
- OpenAI GPT-5.6 adapter for verification if API budget is available.

Do not use LangChain for MVP.

Reason:
The workflow is linear and small:
upload -> extract -> validate -> review -> save.

LangChain would add complexity without solving a current problem.

### Validation

Zod.

Reason:
The app needs strict validation around AI output. The model output should be treated as untrusted until parsed and normalized.

### Database

Option A: Supabase free tier.

Use if we want quick hosted Postgres, storage, and easy future auth.

Option B: SQLite with Prisma or Drizzle.

Use if we want the simplest local-only judge setup.

Recommendation:
Use Supabase if deploying a live demo. Use SQLite only if deployment simplicity or avoiding another account matters more.

### File Storage

For deployed demo:
- Supabase Storage

For local-only/demo mode:
- Store sample files in repo.
- Avoid persisting arbitrary uploads permanently.

### Email/Reminders

MVP options:
- Simulated reminder log in the UI.
- Resend for actual email reminders.
- Vercel Cron for scheduled reminder checks.

Recommendation:
For Build Week, implement reminder records and a "Send test reminder" button first. Add real cron only if time permits.

### Deployment

- Vercel for app hosting.
- Supabase hosted free project if using Supabase.

## 6. High-Level Architecture

```txt
User
  |
  v
Next.js UI
  |
  | upload document
  v
Next.js API route /api/extract
  |
  | sends file/text/image to provider adapter
  v
AI Provider Adapter
  |
  | Cerebras Gemma 4 31B
  v
Raw AI JSON
  |
  | Zod validation + normalization
  v
Extraction Result
  |
  | user reviews/edits
  v
Save Purchase
  |
  v
Database
  |
  v
Dashboard + Reminders
```

## 7. Suggested Folder Structure

```txt
deadline-desk/
  app/
    page.tsx
    upload/
      page.tsx
    review/
      [extractionId]/
        page.tsx
    dashboard/
      page.tsx
    api/
      extract/
        route.ts
      purchases/
        route.ts
      reminders/
        route.ts

  components/
    upload-zone.tsx
    extraction-review-form.tsx
    deadline-dashboard.tsx
    purchase-card.tsx
    confidence-badge.tsx
    deadline-status-badge.tsx
    app-shell.tsx

  lib/
    ai/
      extractor.ts
      cerebras-provider.ts
      openai-provider.ts
      extraction-schema.ts
      prompts.ts
      normalize-extraction.ts
    db/
      client.ts
      queries.ts
      schema.ts
    dates/
      deadlines.ts
      reminders.ts
    files/
      validate-upload.ts
      parse-document.ts
    demo/
      sample-data.ts

  public/
    samples/
      sample-receipt-1.pdf
      sample-invoice-1.png
      sample-warranty-1.pdf

  docs/
    architecture.md
    demo-script.md
    judging-notes.md

  README.md
  .env.example
```

## 8. Provider Abstraction

Create a small internal interface instead of using LangChain.

Conceptual interface:

```ts
export type DocumentInput = {
  fileName: string
  mimeType: string
  data: Buffer | string
}

export type ExtractorProvider = {
  extractPurchaseDocument(input: DocumentInput): Promise<ExtractionResult>
}
```

Provider implementations:
- `cerebras-provider.ts`
- optional `openai-provider.ts`

This lets the app switch providers through an environment variable:

```txt
AI_PROVIDER=cerebras
CEREBRAS_API_KEY=...
CEREBRAS_MODEL=gemma-4-31b
```

Optional later:

```txt
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6
```

## 9. AI Extraction Design

The extraction prompt should ask for:
- strict JSON only
- no invented fields
- explicit null when missing
- confidence score per field
- evidence text copied/paraphrased from the document
- distinction between document-stated and inferred dates

Important rule:
The model must not make up return or warranty policy if the document does not state it.

Deadline source types:
- `document_stated`
- `inferred_from_purchase_date`
- `user_entered`
- `unknown`

Example extraction shape:

```ts
type FieldExtraction<T> = {
  value: T | null
  confidence: number
  evidence: string | null
  source: "document_stated" | "inferred" | "user_entered" | "unknown"
}

type ExtractionResult = {
  merchant: FieldExtraction<string>
  itemName: FieldExtraction<string>
  purchaseDate: FieldExtraction<string>
  totalAmount: FieldExtraction<number>
  currency: FieldExtraction<string>
  orderNumber: FieldExtraction<string>
  returnDeadline: FieldExtraction<string>
  warrantyDeadline: FieldExtraction<string>
  renewalDate: FieldExtraction<string>
  warnings: string[]
  missingFields: string[]
  needsUserReview: boolean
}
```

## 10. Database Model

For proof of concept, use a simple `workspace_id` instead of full auth.

### purchases

- `id`
- `workspace_id`
- `merchant`
- `item_name`
- `purchase_date`
- `total_amount`
- `currency`
- `order_number`
- `document_name`
- `document_url`
- `created_at`
- `updated_at`

### deadlines

- `id`
- `purchase_id`
- `type`
  - `return`
  - `warranty`
  - `renewal`
  - `other`
- `deadline_date`
- `source`
  - `document_stated`
  - `inferred_from_purchase_date`
  - `user_entered`
  - `unknown`
- `confidence`
- `evidence`
- `status`
  - `active`
  - `completed`
  - `expired`
  - `unknown`
- `created_at`
- `updated_at`

### extraction_runs

- `id`
- `workspace_id`
- `document_name`
- `provider`
- `model`
- `raw_output`
- `validated_output`
- `warnings`
- `created_at`

### reminders

- `id`
- `deadline_id`
- `remind_at`
- `channel`
  - `email`
  - `in_app`
  - `demo`
- `sent_at`
- `status`
  - `pending`
  - `sent`
  - `failed`

## 11. Authentication Decision

Do not build full authentication for the proof of concept.

Use one of these:

### Demo Workspace

Use a single hardcoded `workspace_id = "demo"`.

Best for fastest Build Week demo.

### Anonymous Session

Create a random local workspace id and store it in browser local storage.

Best if we want each judge/browser to have separate data without sign-in.

### Future Auth

Because the database includes `workspace_id`, adding Supabase Auth later is straightforward:
- replace `workspace_id` with authenticated `user.id`
- add row-level security
- protect storage buckets

## 12. Upload and Privacy Strategy

Receipts can include personal information:
- name
- address
- phone number
- email
- order numbers
- card fragments

For a public demo:
- Prefer sample documents.
- Make real uploads temporary.
- Avoid storing raw uploaded documents unless needed.
- Provide a delete action.
- Add a note in README that sample docs should be used for judging.

For MVP:
- Store extracted structured data.
- Store uploaded file only if using Supabase Storage and user explicitly saves.
- Do not log file contents to console.
- Do not expose API keys client-side.

## 13. Reminder Logic

For each deadline, generate reminders:
- 7 days before
- 3 days before
- 1 day before
- day of deadline

Only generate reminders when `deadline_date` is known.

For demo:
- Show pending reminders in UI.
- Add "Send test reminder" to demonstrate the workflow.

For production-like behavior:
- Vercel Cron calls `/api/reminders/send`.
- Server checks pending reminders where `remind_at <= now`.
- Send via Resend.
- Mark `sent_at`.

## 14. UI Flow

### Screen 1: Upload

Main elements:
- Drag-and-drop upload area.
- Sample document buttons.
- Supported formats note.
- Extract button.

Expected behavior:
- User uploads or selects sample.
- App sends file to extraction endpoint.
- Loading state explains extraction is running.

### Screen 2: Review

Main elements:
- Extracted fields in editable form.
- Confidence badges.
- Evidence snippets.
- Warning banner for uncertain/missing fields.
- Save verified purchase button.

Important UX:
- Low-confidence fields should be visually obvious.
- Null/unknown fields should not look like errors; they should invite user completion.

### Screen 3: Dashboard

Main elements:
- Upcoming deadlines list.
- Urgency tabs or filters.
- Purchase cards.
- Deadline status badges.
- Search field.
- Manual add button.

### Screen 4: Purchase Detail

Optional for MVP.

Main elements:
- Purchase metadata.
- Associated deadlines.
- Evidence.
- Reminder schedule.
- Edit/delete actions.

## 15. Date Normalization Rules

Always normalize dates to ISO `YYYY-MM-DD`.

If the model returns a relative date like "30 days from purchase":
- Compute it only if purchase date is known.
- Mark source as `inferred_from_purchase_date`.
- Add evidence/warning explaining the inference.

If the document says "return within 30 days" but no purchase date exists:
- Leave deadline null.
- Add missing field warning for purchase date.

If the model cannot determine a warranty:
- Leave warranty deadline null.
- Add warning: "No warranty deadline found in document."

## 16. Testing Plan

### Manual Test Cases

Use sample files for:
- Clear receipt with 30-day return window.
- Invoice with no return policy.
- Warranty card with one-year warranty.
- Subscription receipt with renewal date.
- Blurry/partial receipt image.

### Unit Tests

Focus on:
- Zod schema validation.
- deadline grouping logic.
- reminder date generation.
- date normalization.
- provider error handling.

### Integration Tests

Focus on:
- upload -> extraction -> review payload.
- save purchase -> dashboard appears.
- invalid model output -> graceful error.

## 17. Failure Handling

The app should handle:
- unsupported file type
- file too large
- AI provider timeout
- invalid JSON from model
- missing fields
- low confidence extraction
- database save failure
- reminder send failure

User-facing error tone:
- direct and recoverable
- never expose internal stack traces
- suggest using sample docs if extraction fails

## 18. Environment Variables

Required for Cerebras:

```txt
AI_PROVIDER=cerebras
CEREBRAS_API_KEY=
CEREBRAS_MODEL=gemma-4-31b
```

If using Supabase:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

If using Resend:

```txt
RESEND_API_KEY=
REMINDER_FROM_EMAIL=
```

Optional OpenAI verifier:

```txt
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6
ENABLE_OPENAI_VERIFIER=false
```

## 19. Demo Script

Target length: under 3 minutes.

Suggested flow:

1. Explain the problem:
   Return and warranty deadlines are buried in receipts, so people miss them.

2. Upload sample receipt:
   Show drag-and-drop or sample file selection.

3. Extract:
   Show AI extraction result with confidence and evidence.

4. Verify:
   Edit one uncertain field to demonstrate human-in-the-loop design.

5. Save:
   Save verified purchase.

6. Dashboard:
   Show deadline grouped as upcoming/urgent.

7. Reminder:
   Show generated reminder schedule or send a test reminder.

8. Build Week note:
   Explain Codex/GPT-5.6 helped design and build the app, extraction schema, validation flow, and UI.

## 20. README Requirements For Submission

README should include:
- Project overview.
- What problem it solves.
- How to run locally.
- Environment variables.
- Sample documents.
- How to test without real personal data.
- Architecture summary.
- How Codex/GPT-5.6 was used.
- Runtime model note explaining Cerebras Gemma 4 31B.
- Known limitations.
- Future roadmap.

## 21. Known Limitations

- AI extraction may miss or misread deadline details.
- Some receipts do not include return or warranty terms.
- Retailer policies can change and may not be present in documents.
- OCR/document understanding quality depends on input quality.
- Without authentication, the MVP is not production-ready for personal receipt storage.
- Runtime model may differ from GPT-5.6 because available credits are Codex-only.

## 22. Future Roadmap

After MVP:
- Add Supabase Auth.
- Add real email reminders.
- Add calendar `.ics` export.
- Add Gmail/Outlook import.
- Add retailer policy lookup.
- Add shared household workspace.
- Add mobile camera upload.
- Add GPT-5.6 verifier when API budget exists.
- Add recurring subscription tracking.

## 23. Final Recommendation

Build the MVP with:
- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- direct Cerebras API calls
- Zod validation
- Supabase free tier if deploying
- no LangChain
- no full authentication

Keep the product small and credible:
- extract
- verify
- save
- track
- remind

The strongest part of the submission should be the human-in-the-loop verification design and clear uncertainty handling, not an overbuilt integration surface.
