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
  const [jobError, setJobError] = useState<string | null>(
    null,
  );

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

  const progress =
    job && job.total > 0
      ? Math.round((job.processed / job.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="loading-state">
        Loading tickets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-state">
        {error}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">EW</div>

          <div>
            <div className="brand-title">
              Extraction Workbench
            </div>

            <div className="brand-subtitle">
              AI-assisted ticket processing
            </div>
          </div>
        </div>
      </header>

      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">
              Support Ticket Workbench
            </h1>

            <p className="page-description">
              Select tickets, extract structured data, and
              review uncertain results before export.
            </p>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              Total tickets
            </div>

            <div className="stat-value">
              {tickets.length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Selected
            </div>

            <div className="stat-value">
              {selectedIds.length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Processed
            </div>

            <div className="stat-value">
              {job?.processed ?? 0}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Needs review
            </div>

            <div className="stat-value">
              {job?.needs_review ?? 0}
            </div>
          </div>
        </div>

        <section className="toolbar">
          <div className="toolbar-row">
            <div className="search-wrapper">
              <input
                className="search-input"
                type="text"
                placeholder="Search by ticket ID, subject, or content..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              className="filter-select"
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value)
              }
            >
              <option value="all">All channels</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="chat">Chat</option>
            </select>
          </div>

          <div className="toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={selectAllVisible}
            >
              Select visible
            </button>

            <button
              className="btn btn-secondary"
              onClick={clearSelection}
            >
              Clear selection
            </button>

            <button
              className="btn btn-primary"
              disabled={
                selectedIds.length === 0 || processing
              }
              onClick={processSelected}
            >
              {processing
                ? "Starting..."
                : `Process selected${
                    selectedIds.length
                      ? ` (${selectedIds.length})`
                      : ""
                  }`}
            </button>
          </div>
        </section>

        {jobError && (
          <p className="error-message">
            {jobError}
          </p>
        )}

        {job && (
          <section className="job-card">
            <div className="job-header">
              <div>
                <h2 className="job-title">
                  Extraction job
                </h2>

                <div className="job-id">
                  {job.id}
                </div>
              </div>

              <span className="job-status">
                {job.status}
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-bar"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="job-footer">
              <span>
                {job.processed} / {job.total} processed
              </span>

              <span>
                {job.completed} completed ·{" "}
                {job.needs_review} needs review
              </span>
            </div>
          </section>
        )}

        {job?.status === "completed" && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  Extraction Results
                </h2>

                <div className="section-description">
                  Click a result to review or edit it.
                </div>
              </div>

              <button
                className="btn btn-success"
                onClick={handleExport}
              >
                Export CSV
              </button>
            </div>

            <ResultsTable
              results={results}
              onSelect={setSelectedResult}
            />
          </section>
        )}

        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                Tickets
              </h2>

              <div className="section-description">
                Showing {filteredTickets.length} of{" "}
                {tickets.length} tickets
              </div>
            </div>
          </div>

          <TicketList
            tickets={filteredTickets}
            selectedIds={selectedIds}
            onToggle={toggleTicket}
          />
        </section>
      </main>

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
    </div>
  );
}