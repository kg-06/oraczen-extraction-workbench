import { Ticket } from "@/types/ticket";
import { JobResult } from "@/types/extraction";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(`${API_URL}/api/tickets`);

  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return response.json();
}

export interface Job {
  id: string;
  ticket_ids: string[];
  status: "queued" | "running" | "completed";
  total: number;
  processed: number;
  completed: number;
  needs_review: number;
}

export async function createJob(ticketIds: string[]): Promise<Job> {
  const response = await fetch(`${API_URL}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ticket_ids: ticketIds,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create extraction job");
  }

  return response.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch job");
  }

  return response.json();
}

export async function getJobResults(
  jobId: string,
): Promise<JobResult[]> {
  const response = await fetch(
    `${API_URL}/api/jobs/${jobId}/results`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch job results");
  }

  return response.json();
}

export async function updateRecord(
  recordId: string,
  updates: Partial<{
    company: string;
    product: string;
    category: string;
    severity: string;
    requested_action: string;
    refund_amount: number | null;
    deadline: string | null;
    escalated: boolean;
  }>,
): Promise<JobResult> {
  const response = await fetch(
    `${API_URL}/api/records/${recordId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.detail || "Failed to update record",
    );
  }

  return response.json();
}

export async function exportJob(jobId: string): Promise<Blob> {
  const response = await fetch(
    `${API_URL}/api/jobs/${jobId}/export.csv`,
  );

  if (!response.ok) {
    throw new Error("Failed to export results");
  }

  return response.blob();
}