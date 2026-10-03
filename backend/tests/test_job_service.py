import asyncio

import pytest

from app.models.ticket import Ticket
from app.providers.mock import MockExtractionProvider
from app.services.extraction_service import ExtractionService
from app.services.job_service import JobService


def make_ticket(ticket_id: str) -> Ticket:
    return Ticket(
        id=ticket_id,
        subject="Zen Studio issue",
        body="The dashboard is broken.",
        channel="email",
        received_at="2026-08-28T10:00:00Z",
    )


@pytest.mark.asyncio
async def test_job_processes_selected_tickets():
    tickets = [
        make_ticket("ticket_1"),
        make_ticket("ticket_2"),
        make_ticket("ticket_3"),
    ]

    provider = MockExtractionProvider(delay_ms=0)
    extraction_service = ExtractionService(provider)
    job_service = JobService(extraction_service, tickets)

    job = job_service.create_job(
        ["ticket_1", "ticket_2", "ticket_3"]
    )

    await asyncio.sleep(0.05)

    updated_job = job_service.get_job(job.id)

    assert updated_job is not None
    assert updated_job.status == "completed"
    assert updated_job.processed == 3
    assert updated_job.completed == 3
    assert updated_job.needs_review == 0


@pytest.mark.asyncio
async def test_job_tracks_needs_review():
    tickets = [
        make_ticket("tkt_0004"),
        make_ticket("tkt_0020"),
    ]

    provider = MockExtractionProvider(delay_ms=0)
    extraction_service = ExtractionService(provider)
    job_service = JobService(extraction_service, tickets)

    job = job_service.create_job(
        ["tkt_0004", "tkt_0020"]
    )

    await asyncio.sleep(0.05)

    updated_job = job_service.get_job(job.id)

    assert updated_job is not None
    assert updated_job.status == "completed"
    assert updated_job.processed == 2

    # tkt_0004 succeeds after retry.
    assert updated_job.completed == 1

    # tkt_0020 fails twice and requires review.
    assert updated_job.needs_review == 1