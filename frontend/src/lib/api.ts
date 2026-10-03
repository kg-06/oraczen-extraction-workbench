import { Ticket } from "@/types/ticket";

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