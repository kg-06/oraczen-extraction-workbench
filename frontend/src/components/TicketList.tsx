"use client";

import { Ticket } from "@/types/ticket";

interface TicketListProps {
  tickets: Ticket[];
  selectedIds: string[];
  onToggle: (ticketId: string) => void;
}

export default function TicketList({
  tickets,
  selectedIds,
  onToggle,
}: TicketListProps) {
  return (
    <div>
      {tickets.map((ticket) => {
        const selected = selectedIds.includes(ticket.id);

        return (
          <article key={ticket.id}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(ticket.id)}
            />

            <div>
              <h3>{ticket.subject}</h3>

              <p>{ticket.body.slice(0, 180)}...</p>

              <small>
                {ticket.channel} · {ticket.id}
              </small>
            </div>
          </article>
        );
      })}
    </div>
  );
}