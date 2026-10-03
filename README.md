# Extraction Workbench

An AI-assisted human-in-the-loop workbench for extracting structured information from support tickets.

The application allows users to select support tickets, process them through an extraction provider, validate the extracted data against a Pydantic schema, retry invalid extraction once, manually review failed or uncertain records, and export the final structured results as CSV.

## Features

- Browse 150 support tickets
- Search tickets by ID, subject, or content
- Filter tickets by channel
- Select multiple tickets for processing
- Non-blocking background extraction jobs
- Bounded concurrent ticket processing
- Job progress tracking through polling
- Deterministic mock extraction provider
- Pydantic-based extraction validation
- One automatic retry when extraction validation fails
- `needs_review` state for records that remain invalid
- Human-in-the-loop record editing
- Human-edited record tracking
- CSV export of validated records
- Responsive internal-tool UI
- No external API key required for the default setup

---

## Architecture

```text
Next.js Frontend
  ├── Ticket selection
  ├── Search / filtering
  ├── Job progress
  ├── Results table
  ├── Human review / editing
  └── CSV export
          │
          │ REST API
          ▼
FastAPI Backend
  ├── Ticket API
  ├── Job API
  ├── Extraction service
  ├── Pydantic validation
  ├── Retry handling
  ├── Human edits
  └── CSV generation
          │
          ▼
Mock Extraction Provider
  ├── Deterministic extraction
  └── No API key required
```

The application intentionally does not require a database, Redis, Celery, Kafka, or other infrastructure. State is kept in memory because persistent storage is not required for this assignment.

## Project Structure

```text
oraczen-extraction-workbench/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── jobs.py
│   │   │   ├── records.py
│   │   │   └── tickets.py
│   │   ├── models/
│   │   │   ├── extraction.py
│   │   │   ├── job.py
│   │   │   ├── job_result.py
│   │   │   ├── record_update.py
│   │   │   └── ticket.py
│   │   ├── providers/
│   │   │   ├── base.py
│   │   │   └── mock.py
│   │   ├── services/
│   │   │   ├── extraction_service.py
│   │   │   ├── job_service.py
│   │   │   └── ticket_service.py
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ReviewPanel.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   └── TicketList.tsx
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── types/
│   │       ├── extraction.ts
│   │       └── ticket.ts
│   └── package.json
├── data/
│   └── tickets.jsonl
├── DECISIONS.md
├── .env.example
└── README.md
```

## Tech Stack

### Backend

- Python
- FastAPI
- Pydantic
- Pytest
- asyncio

### Frontend

- Next.js
- React
- TypeScript
- CSS

### Data

- JSONL ticket dataset
- In-memory job and result state
- CSV export

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

API:

```text
http://localhost:8000
```

Interactive API docs:

```text
http://localhost:8000/docs
```

### Frontend

In another terminal:

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## Running the Application

Start the backend:

```bash
cd backend
uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Then open `http://localhost:3000`.

## Extraction Workflow

```text
Select tickets
      ↓
POST /api/jobs
      ↓
Job created with 202 Accepted
      ↓
Background processing
      ↓
Extraction provider
      ↓
Pydantic validation
      ↓
Valid?
 ┌────┴────┐
Yes        No
 │          │
 │       Retry once
 │          │
 │       Valid?
 │      ┌───┴───┐
 │     Yes      No
 │      │        │
 ▼      ▼        ▼
completed      needs_review
      ↓
Human review/edit
      ↓
Validated record
      ↓
CSV export
```

The extraction provider's output is treated as untrusted input. Validation is performed by the backend using the Pydantic `ExtractedRecord` schema.

## Extraction Schema

Each successfully extracted ticket contains:

```text
company
product
category
severity
requested_action
refund_amount
deadline
escalated
```

### Products

```text
Zen Orchestrator
Zen Studio
Zen Connect
Zen Insights
Zen Vault
```

### Categories

```text
outage
billing
bug
feature_request
how_to
churn_risk
```

### Severity

```text
low
medium
high
critical
```

### Requested Actions

```text
refund
credit
fix
callback
information
none
```

## Validation and Retry

Extraction results are validated using Pydantic.

If validation fails:

1. The validation error is recorded.
2. The provider is called one more time.
3. The validation error is supplied to the provider on the retry.
4. The second result is validated again.

If the second attempt succeeds:

```text
status = completed
attempts = 2
```

If the second attempt fails:

```text
status = needs_review
attempts = 2
```

The application does not silently accept invalid model output.

## Mock Extraction Provider

The default provider is deterministic and requires no API key.

It:

- Adds an artificial delay
- Extracts fields using deterministic heuristics
- Produces predictable results for testing
- Includes deliberate invalid outputs for testing retry behavior

`tkt_0004` produces an invalid category on its first attempt and succeeds on retry.

`tkt_0020` produces an invalid severity on both attempts and therefore becomes `needs_review`.

This makes retry and human-review behavior reproducible without relying on an external LLM service.

## Background Processing

Job creation is non-blocking.

The API immediately creates a job and returns HTTP `202 Accepted`.

The actual ticket processing occurs as a FastAPI background task.

Ticket processing uses bounded concurrency with an `asyncio.Semaphore`. The current implementation limits concurrent extraction work to five tickets.

The frontend polls the job endpoint until processing is complete.

## API Endpoints

### Get Tickets

```http
GET /api/tickets
```

Returns all available support tickets.

### Get Ticket

```http
GET /api/tickets/{ticket_id}
```

Returns a single ticket.

### Create Job

```http
POST /api/jobs
```

Request:

```json
{
  "ticket_ids": [
    "tkt_0001",
    "tkt_0002"
  ]
}
```

Returns the newly created job with HTTP `202 Accepted`.

### Get Job

```http
GET /api/jobs/{job_id}
```

Returns job progress.

Example:

```json
{
  "id": "job-id",
  "ticket_ids": [
    "tkt_0001",
    "tkt_0002"
  ],
  "status": "running",
  "total": 2,
  "processed": 1,
  "completed": 1,
  "needs_review": 0
}
```

### Get Job Results

```http
GET /api/jobs/{job_id}/results
```

Returns extraction results for processed tickets.

### Update Record

```http
PATCH /api/records/{record_id}
```

Allows a human reviewer to correct an extracted record.

A successful human edit sets:

```text
human_edited = true
```

The updated record is validated against the same Pydantic schema before it is saved.

### Export CSV

```http
GET /api/jobs/{job_id}/export.csv
```

Exports validated extraction results as CSV.

The export includes:

```text
ticket_id
company
product
category
severity
requested_action
refund_amount
deadline
escalated
human_edited
status
```

## Human Review

Records that cannot be validated after the retry are marked as:

```text
needs_review
```

The UI allows a reviewer to:

- Read the original ticket
- Inspect validation errors
- Edit extracted fields
- Save the corrected record
- Validate the corrected record
- Mark the record as human-edited

This keeps the human as the final authority over extracted data.

## CSV Export

CSV export is available after a job completes.

Records with valid extracted data are included.

Records that remain unresolved with no valid record are not exported until a human review produces a valid record.

This prevents invalid structured data from being presented as final output.

## Testing

Backend tests:

```bash
cd backend
pytest
```

The test suite covers:

- Extraction schema validation
- Valid extraction
- Retry after validation failure
- Retry failure and `needs_review`
- Job creation
- Job processing
- Job progress
- Invalid ticket IDs
- Duplicate ticket IDs
- Human record updates
- Invalid human updates
- CSV export

Frontend production build:

```bash
cd frontend
npm run build
```

The production build checks TypeScript and frontend compilation.

## Design Decisions

Detailed decisions about ambiguous cases are documented in `DECISIONS.md`.

The document covers:

- Missing severity
- EUR vs USD
- Multi-issue tickets
- Garbage/insufficient tickets
- Polling vs streaming

## Limitations

### In-memory state

Jobs and extraction results are stored in memory. Restarting the backend clears current jobs and results.

A production system would use persistent storage.

### Mock extraction

The default provider is deterministic rather than a real LLM. This makes the assignment reproducible and runnable without credentials.

A real provider can be added behind the `ExtractionProvider` abstraction.

### Single category

The current schema supports one category per ticket. Multi-issue tickets therefore require selecting a primary issue.

### Currency

The current refund schema does not contain a currency field. Currency-sensitive refund cases therefore require human review.

### Polling

The frontend polls job status once per second. For a much larger production workload, a streaming or event-driven approach could reduce unnecessary requests.

## Future Improvements

Possible future improvements include:

- Add a real LLM extraction provider
- Add an explicit refund currency field
- Support multiple issues per ticket
- Persist jobs and results in a database
- Add authentication and role-based access
- Use Server-Sent Events for job progress
- Add richer extraction confidence information
- Add pagination for larger datasets
- Add audit history for human edits

These are intentionally outside the scope of the current implementation.

## Environment Variables

The frontend uses:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

See `.env.example` for the development configuration.

The default application does not require an external API key.

## License

This project was created as part of the Oraczen AI Extraction Workbench assignment.
