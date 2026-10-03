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
  return (
    <div>
      <h2>Extraction Results</h2>

      {results.length === 0 ? (
        <p>No results yet.</p>
      ) : (
        <table>
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
                key={result.id}
                onClick={() => onSelect(result)}
                style={{ cursor: "pointer" }}
              >
                <td>{result.ticket_id}</td>

                <td>{result.status}</td>

                <td>
                  {result.record?.company ?? "-"}
                </td>

                <td>
                  {result.record?.product ?? "-"}
                </td>

                <td>
                  {result.record?.category ?? "-"}
                </td>

                <td>
                  {result.record?.severity ?? "-"}
                </td>

                <td>
                  {result.status === "needs_review"
                    ? "Needs review"
                    : result.human_edited
                      ? "Human edited"
                      : "OK"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}