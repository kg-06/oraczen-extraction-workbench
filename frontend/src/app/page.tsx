"use client";

import { useEffect, useState } from "react";

import { getTickets } from "@/lib/api";
import { Ticket } from "@/types/ticket";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTickets() {
      try {
        const data = await getTickets();
        setTickets(data);
      } catch {
        setError("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  if (loading) {
    return <main>Loading tickets...</main>;
  }

  if (error) {
    return <main>{error}</main>;
  }

  return (
    <main>
      <h1>Extraction Workbench</h1>

      <p>{tickets.length} tickets loaded</p>

      <div>
        {tickets.map((ticket) => (
          <article key={ticket.id}>
            <h2>{ticket.subject}</h2>

            <p>{ticket.body}</p>

            <small>
              {ticket.channel} · {ticket.id}
            </small>
          </article>
        ))}
      </div>
    </main>
  );
}