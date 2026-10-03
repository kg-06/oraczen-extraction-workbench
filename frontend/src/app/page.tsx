"use client";

import { useEffect, useMemo, useState } from "react";

import TicketList from "@/components/TicketList";
import { getTickets } from "@/lib/api";
import { Ticket } from "@/types/ticket";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");

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

  const filteredTickets = useMemo(() => {
    const query = search.toLowerCase().trim();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.body.toLowerCase().includes(query);

      const matchesChannel =
        channel === "all" || ticket.channel === channel;

      return matchesSearch && matchesChannel;
    });
  }, [tickets, search, channel]);

  function toggleTicket(ticketId: string) {
    setSelectedIds((current) =>
      current.includes(ticketId)
        ? current.filter((id) => id !== ticketId)
        : [...current, ticketId],
    );
  }

  function selectAllVisible() {
    const visibleIds = filteredTickets.map((ticket) => ticket.id);

    setSelectedIds((current) => [
      ...new Set([...current, ...visibleIds]),
    ]);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  if (loading) {
    return <main>Loading tickets...</main>;
  }

  if (error) {
    return <main>{error}</main>;
  }

  return (
    <main>
      <h1>Extraction Workbench</h1>

      <p>
        {tickets.length} tickets · {selectedIds.length} selected
      </p>

      <div>
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
        >
          <option value="all">All channels</option>
          <option value="email">Email</option>
          <option value="call">Call</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      <div>
        <button onClick={selectAllVisible}>
          Select Visible
        </button>

        <button onClick={clearSelection}>
          Clear Selection
        </button>

        <button disabled={selectedIds.length === 0}>
          Process Selected
        </button>
      </div>

      <p>
        Showing {filteredTickets.length} of {tickets.length} tickets
      </p>

      <TicketList
        tickets={filteredTickets}
        selectedIds={selectedIds}
        onToggle={toggleTicket}
      />
    </main>
  );
}