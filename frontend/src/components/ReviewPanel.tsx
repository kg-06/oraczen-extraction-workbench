"use client";

import { JobResult } from "@/types/extraction";
import { Ticket } from "@/types/ticket";

interface ReviewPanelProps {
  result: JobResult;
  ticket: Ticket;
  onClose: () => void;
}

export default function ReviewPanel({
  result,
  ticket,
  onClose,
}: ReviewPanelProps) {
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

        {result.record ? (
          <div>
            <p>
              <strong>Company:</strong>{" "}
              {result.record.company}
            </p>

            <p>
              <strong>Product:</strong>{" "}
              {result.record.product}
            </p>

            <p>
              <strong>Category:</strong>{" "}
              {result.record.category}
            </p>

            <p>
              <strong>Severity:</strong>{" "}
              {result.record.severity}
            </p>

            <p>
              <strong>Requested Action:</strong>{" "}
              {result.record.requested_action}
            </p>

            <p>
              <strong>Refund Amount:</strong>{" "}
              {result.record.refund_amount ?? "-"}
            </p>

            <p>
              <strong>Deadline:</strong>{" "}
              {result.record.deadline ?? "-"}
            </p>

            <p>
              <strong>Escalated:</strong>{" "}
              {result.record.escalated ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <p>No valid extraction was produced.</p>
        )}

        {result.status === "needs_review" && (
          <div>
            <h3>Validation Errors</h3>

            {result.validation_errors.map((error, index) => (
              <pre key={index}>{error}</pre>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}