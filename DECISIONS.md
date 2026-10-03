# Design Decisions

## 1. Missing Severity

Severity is a required field in the extraction schema.

The extraction provider output is treated as untrusted and is validated using Pydantic.

If validation fails, the system retries the extraction once and provides the validation error to the provider.

If the second attempt is still invalid, the ticket is marked as `needs_review`.

This avoids silently inventing a severity value and allows a human to make the final decision.

---

## 2. EUR vs USD

The current extraction schema contains a `refund_amount` field but does not contain a currency field.

For example, `tkt_0058` contains a refund amount of 4,820 EUR.

The system does not silently convert EUR to USD because there is no currency field in the current schema and no exchange-rate source is part of the application.

Such cases should be reviewed by a human before the extracted amount is treated as a final value.

A future improvement would be adding a `refund_currency` field to the schema.

---

## 3. Multi-Issue Tickets

Some tickets contain multiple issues.

For example, `tkt_0089` contains an export issue, a billing discrepancy, an SSO concern, and escalation/renewal language.

The current schema has a single `category` field, so the extraction represents the primary customer-impacting issue.

The system does not silently create multiple categories in a field that is designed to contain one value.

A future schema could represent multiple issues explicitly.

---

## 4. Garbage or Insufficient Tickets

Some tickets do not contain enough useful information for reliable extraction.

The system does not assume missing information is known.

Provider output is validated against the Pydantic schema. Invalid output is retried once.

If the second attempt is still invalid, the ticket is marked as `needs_review`.

This keeps uncertain AI output visible to the human reviewer instead of presenting it as reliable structured data.

---

## 5. Polling vs Streaming

The frontend polls the job status once per second after creating a job.

Polling was chosen because the assignment has a relatively small workflow and does not require a persistent streaming connection.

The flow remains simple:

Frontend -> REST API -> Background job

A streaming mechanism such as Server-Sent Events or WebSockets could be considered for a larger production workload, but it would add unnecessary complexity for the current assignment.