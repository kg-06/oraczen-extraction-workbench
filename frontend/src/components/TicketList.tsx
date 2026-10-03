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
  if (tickets.length === 0) {
    return (
      <div className="empty-state">
        No tickets match your current filters.
      </div>
    );
  }

  return (
    <div className="ticket-grid">
      {tickets.map((ticket) => {
        const selected = selectedIds.includes(ticket.id);

        return (
          <article className="ticket-card" key={ticket.id}>
            <input
              className="ticket-checkbox"
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(ticket.id)}
            />

            <div className="ticket-content">
              <h3 className="ticket-subject">
                {ticket.subject}
              </h3>

              <p className="ticket-preview">
                {ticket.body.length > 180
                  ? `${ticket.body.slice(0, 180)}...`
                  : ticket.body}
              </p>

              <div className="ticket-meta">
                <span>{ticket.id}</span>
                <span>•</span>
                <span>{ticket.channel}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}