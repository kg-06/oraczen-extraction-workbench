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