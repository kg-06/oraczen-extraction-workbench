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
    <div className="review-overlay">
      <aside className="review-panel">
        <header className="review-header">
          <div>
            <h2>Review {ticket.id}</h2>

            <p>
              Compare the source ticket with the extracted
              record.
            </p>
          </div>

          <button className="btn" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="review-body">
          <div className="review-grid">
            <section className="review-card">
              <h3>Original Ticket</h3>

              <div className="ticket-subject-large">
                {ticket.subject || "No subject"}
              </div>

              <div className="ticket-meta">
                <span>{ticket.channel}</span>
                <span>•</span>
                <span>{ticket.id}</span>
              </div>

              <hr />

              <pre className="ticket-body">
                {ticket.body || "No ticket body available."}
              </pre>
            </section>

            <section className="review-card">
              <h3>
                Extracted Data
                {result.human_edited && (
                  <span className="badge badge-info">
                    Human edited
                  </span>
                )}
              </h3>

              {!record && (
                <div className="validation-box">
                  <h4>Manual review required</h4>

                  <p className="validation-error">
                    The extraction did not produce a valid
                    record. Fill in the required fields
                    manually.
                  </p>
                </div>
              )}

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">
                    Company
                  </label>

                  <input
                    className="form-input"
                    value={company}
                    onChange={(event) =>
                      setCompany(event.target.value)
                    }
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Product
                  </label>

                  <select
                    className="form-select"
                    value={product}
                    onChange={(event) =>
                      setProduct(event.target.value)
                    }
                  >
                    <option value="">
                      Select product
                    </option>
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
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Category
                  </label>

                  <select
                    className="form-select"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                  >
                    <option value="">
                      Select category
                    </option>
                    <option value="outage">Outage</option>
                    <option value="billing">
                      Billing
                    </option>
                    <option value="bug">Bug</option>
                    <option value="feature_request">
                      Feature Request
                    </option>
                    <option value="how_to">How To</option>
                    <option value="churn_risk">
                      Churn Risk
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Severity
                  </label>

                  <select
                    className="form-select"
                    value={severity}
                    onChange={(event) =>
                      setSeverity(event.target.value)
                    }
                  >
                    <option value="">
                      Select severity
                    </option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">
                      Critical
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Requested Action
                  </label>

                  <select
                    className="form-select"
                    value={requestedAction}
                    onChange={(event) =>
                      setRequestedAction(event.target.value)
                    }
                  >
                    <option value="">
                      Select action
                    </option>
                    <option value="refund">
                      Refund
                    </option>
                    <option value="credit">
                      Credit
                    </option>
                    <option value="fix">Fix</option>
                    <option value="callback">
                      Callback
                    </option>
                    <option value="information">
                      Information
                    </option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Refund Amount
                  </label>

                  <input
                    className="form-input"
                    type="number"
                    value={refundAmount}
                    onChange={(event) =>
                      setRefundAmount(event.target.value)
                    }
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Deadline
                  </label>

                  <input
                    className="form-input"
                    type="date"
                    value={deadline}
                    onChange={(event) =>
                      setDeadline(event.target.value)
                    }
                  />
                </div>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={escalated}
                    onChange={(event) =>
                      setEscalated(event.target.checked)
                    }
                  />

                  Escalated
                </label>
              </div>

              {result.validation_errors.length > 0 && (
                <div className="validation-box">
                  <h4>Validation errors</h4>

                  {result.validation_errors.map(
                    (validationError, index) => (
                      <pre
                        className="validation-error"
                        key={index}
                      >
                        {validationError}
                      </pre>
                    ),
                  )}
                </div>
              )}

              <div className="review-actions">
                <div>
                  {error && (
                    <span className="error-message">
                      {error}
                    </span>
                  )}

                  {saved && (
                    <span className="success-message">
                      Changes saved successfully.
                    </span>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={saveChanges}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}