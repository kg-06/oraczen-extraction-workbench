"use client";

import { JobResult } from "@/types/extraction";

interface ResultsTableProps {
  results: JobResult[];
  onSelect: (result: JobResult) => void;
}

export default function ResultsTable({
  results,
  onSelect,
}: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="results-card">
        <div className="empty-state">
          No extraction results are available.
        </div>
      </div>
    );
  }

  return (
    <div className="results-card">
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>Company</th>
              <th>Product</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Review</th>
            </tr>
          </thead>

          <tbody>
            {results.map((result) => (
              <tr
                className="result-row"
                key={result.id}
                onClick={() => onSelect(result)}
              >
                <td>
                  <span className="ticket-id">
                    {result.ticket_id}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      result.status === "completed"
                        ? "badge badge-success"
                        : "badge badge-warning"
                    }
                  >
                    {result.status === "completed"
                      ? "Completed"
                      : "Needs review"}
                  </span>
                </td>

                <td>{result.record?.company ?? "—"}</td>

                <td>{result.record?.product ?? "—"}</td>

                <td>{result.record?.category ?? "—"}</td>

                <td>{result.record?.severity ?? "—"}</td>

                <td>
                  {result.human_edited ? (
                    <span className="badge badge-info">
                      Human edited
                    </span>
                  ) : result.status === "needs_review" ? (
                    <span className="badge badge-warning">
                      Review needed
                    </span>
                  ) : (
                    <span className="badge badge-neutral">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}