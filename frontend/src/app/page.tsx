"use client";

import { useEffect, useMemo, useState } from "react";

import TicketList from "@/components/TicketList";
import ResultsTable from "@/components/ResultsTable";
import ReviewPanel from "@/components/ReviewPanel";

import {
  createJob,
  exportJob,
  getJob,
  getJobResults,
  getTickets,
  Job,
} from "@/lib/api";

import { JobResult } from "@/types/extraction";
import { Ticket } from "@/types/ticket";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [processing, setProcessing] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const [results, setResults] = useState<JobResult[]>([]);
  const [selectedResult, setSelectedResult] =
    useState<JobResult | null>(null);

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
    const visibleIds = filteredTickets.map(
      (ticket) => ticket.id,
    );

    setSelectedIds((current) => [
      ...new Set([...current, ...visibleIds]),
    ]);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function processSelected() {
    if (selectedIds.length === 0 || processing) {
      return;
    }

    setProcessing(true);
    setJobError(null);
    setResults([]);
    setSelectedResult(null);

    try {
      const createdJob = await createJob(selectedIds);

      setJob(createdJob);
      setSelectedIds([]);
    } catch (error) {
      setJobError(
        error instanceof Error
          ? error.message
          : "Failed to start extraction",
      );
    } finally {
      setProcessing(false);
    }
  }

  useEffect(() => {
    if (!job || job.status === "completed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updatedJob = await getJob(job.id);

        setJob(updatedJob);

        if (updatedJob.status === "completed") {
          clearInterval(interval);
        }
      } catch (error) {
        setJobError(
          error instanceof Error
            ? error.message
            : "Failed to update job progress",
        );

        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [job]);

  useEffect(() => {
    if (!job || job.status !== "completed") {
      return;
    }

    const jobId = job.id;

    async function loadResults() {
      try {
        const data = await getJobResults(jobId);
        setResults(data);
      } catch (error) {
        setJobError(
          error instanceof Error
            ? error.message
            : "Failed to load results",
        );
      }
    }

    loadResults();
  }, [job]);

  async function handleExport() {
    if (!job) {
      return;
    }

    try {
      const blob = await exportJob(job.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `extraction-results-${job.id}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setJobError(
        error instanceof Error
          ? error.message
          : "Failed to export results",
      );
    }
  }

  const selectedTicket = selectedResult
    ? tickets.find(
        (ticket) => ticket.id === selectedResult.ticket_id,
      )
    : null;

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

        <button
          disabled={selectedIds.length === 0 || processing}
          onClick={processSelected}
        >
          {processing ? "Starting..." : "Process Selected"}
        </button>
      </div>

      {jobError && <p>{jobError}</p>}

      {job && (
        <section>
          <h2>Extraction Job</h2>

          <p>Job ID: {job.id}</p>

          <p>Status: {job.status}</p>

          <p>
            {job.processed} / {job.total} processed
          </p>

          <p>Completed: {job.completed}</p>

          <p>Needs review: {job.needs_review}</p>

          {job.status !== "completed" && (
            <p>Processing tickets...</p>
          )}

          {job.status === "completed" && (
            <p>Extraction completed.</p>
          )}
        </section>
      )}

      {job?.status === "completed" && (
        <section>
          <ResultsTable
            results={results}
            onSelect={setSelectedResult}
          />

          <button onClick={handleExport}>
            Export CSV
          </button>
        </section>
      )}

      {selectedResult && selectedTicket && (
        <ReviewPanel
          result={selectedResult}
          ticket={selectedTicket}
          onClose={() => setSelectedResult(null)}
          onUpdated={(updatedResult) => {
            setSelectedResult(updatedResult);

            setResults((current) =>
              current.map((result) =>
                result.id === updatedResult.id
                  ? updatedResult
                  : result,
              ),
            );
          }}
        />
      )}

      <p>
        Showing {filteredTickets.length} of{" "}
        {tickets.length} tickets
      </p>

      <TicketList
        tickets={filteredTickets}
        selectedIds={selectedIds}
        onToggle={toggleTicket}
      />
    </main>
  );
}