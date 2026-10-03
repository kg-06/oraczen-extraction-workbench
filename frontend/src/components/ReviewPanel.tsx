"use client";

import { useState } from "react";
import { updateRecord } from "@/lib/api";
import { JobResult } from "@/types/extraction";
import { Ticket } from "@/types/ticket";

interface ReviewPanelProps {
  result: JobResult;
  ticket: Ticket;
  onClose: () => void;
  onUpdated: (result: JobResult) => void;
}

export default function ReviewPanel({
  result,
  ticket,
  onClose,
  onUpdated,
}: ReviewPanelProps) {
  const record = result.record;

  const [company, setCompany] = useState(
    record?.company ?? "",
  );

  const [product, setProduct] = useState(
    record?.product ?? "",
  );

  const [category, setCategory] = useState(
    record?.category ?? "",
  );

  const [severity, setSeverity] = useState(
    record?.severity ?? "",
  );

  const [requestedAction, setRequestedAction] = useState(
    record?.requested_action ?? "",
  );

  const [refundAmount, setRefundAmount] = useState(
    record?.refund_amount?.toString() ?? "",
  );

  const [deadline, setDeadline] = useState(
    record?.deadline ?? "",
  );

  const [escalated, setEscalated] = useState(
    record?.escalated ?? false,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function saveChanges() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updatedResult = await updateRecord(result.id, {
            company,
            product,
            category,
            severity,
            requested_action: requestedAction,
            refund_amount:
              refundAmount === ""
                ? null
                : Number(refundAmount),
            deadline:
              deadline === "" ? null : deadline,
            escalated,
          });
      onUpdated(updatedResult);
      setSaved(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save changes",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <button onClick={onClose}>Close</button>

      <h2>Review Ticket {ticket.id}</h2>

      <div>
        <h3>Original Ticket</h3>

        <p>
          <strong>Subject:</strong> {ticket.subject}
        </p>

        <p>
          <strong>Channel:</strong> {ticket.channel}
        </p>

        <pre>{ticket.body}</pre>
      </div>

      <div>
        <h3>Extracted Data</h3>

        {!record && (
          <p>
            No valid extraction was produced. Enter the
            missing information manually.
          </p>
        )}

        <label>
          Company
          <input
            value={company}
            onChange={(event) =>
              setCompany(event.target.value)
            }
          />
        </label>

        <label>
          Product
          <select
            value={product}
            onChange={(event) =>
              setProduct(event.target.value)
            }
          >
            <option value="">Select product</option>
            <option value="Zen Orchestrator">
              Zen Orchestrator
            </option>
            <option value="Zen Studio">
              Zen Studio
            </option>
            <option value="Zen Connect">
              Zen Connect
            </option>
            <option value="Zen Insights">
              Zen Insights
            </option>
            <option value="Zen Vault">
              Zen Vault
            </option>
          </select>
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            <option value="">Select category</option>
            <option value="outage">Outage</option>
            <option value="billing">Billing</option>
            <option value="bug">Bug</option>
            <option value="feature_request">
              Feature Request
            </option>
            <option value="how_to">How To</option>
            <option value="churn_risk">
              Churn Risk
            </option>
          </select>
        </label>

        <label>
          Severity
          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
          >
            <option value="">Select severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label>
          Requested Action
          <select
            value={requestedAction}
            onChange={(event) =>
              setRequestedAction(event.target.value)
            }
          >
            <option value="">Select action</option>
            <option value="refund">Refund</option>
            <option value="credit">Credit</option>
            <option value="fix">Fix</option>
            <option value="callback">Callback</option>
            <option value="information">
              Information
            </option>
            <option value="none">None</option>
          </select>
        </label>

        <label>
          Refund Amount
          <input
            type="number"
            value={refundAmount}
            onChange={(event) =>
              setRefundAmount(event.target.value)
            }
          />
        </label>

        <label>
          Deadline
          <input
            type="date"
            value={deadline}
            onChange={(event) =>
              setDeadline(event.target.value)
            }
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={escalated}
            onChange={(event) =>
              setEscalated(event.target.checked)
            }
          />

          Escalated
        </label>

        {result.status === "needs_review" &&
          result.validation_errors.length > 0 && (
            <div>
              <h3>Validation Errors</h3>

              {result.validation_errors.map(
                (validationError, index) => (
                  <pre key={index}>
                    {validationError}
                  </pre>
                ),
              )}
            </div>
          )}

        {error && <p>{error}</p>}

        {saved && <p>Changes saved.</p>}

        <button
          onClick={saveChanges}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </section>
  );
}