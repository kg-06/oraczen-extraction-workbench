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
async def test_export_contains_extracted_record():
    tickets = [make_ticket("ticket_1")]

    provider = MockExtractionProvider(delay_ms=0)
    extraction_service = ExtractionService(provider)
    job_service = JobService(extraction_service, tickets)

    job = job_service.create_job(["ticket_1"])

    await job_service.run_job(job.id)

    csv_content = job_service.export_csv(job.id)

    assert csv_content is not None
    assert "ticket_id" in csv_content
    assert "ticket_1" in csv_content
    assert "Zen Studio" in csv_content
    
@pytest.mark.asyncio
async def test_export_contains_human_edit():
    tickets = [make_ticket("ticket_1")]

    provider = MockExtractionProvider(delay_ms=0)
    extraction_service = ExtractionService(provider)
    job_service = JobService(extraction_service, tickets)

    job = job_service.create_job(["ticket_1"])

    await job_service.run_job(job.id)

    results = job_service.get_results(job.id)

    result = results[0]

    job_service.update_result(
        result.id,
        {"severity": "critical"},
    )

    csv_content = job_service.export_csv(job.id)

    assert "critical" in csv_content
    assert ",True,completed" in csv_content
    
def test_export_unknown_job():
    provider = MockExtractionProvider(delay_ms=0)
    extraction_service = ExtractionService(provider)
    job_service = JobService(
        extraction_service,
        [],
    )

    assert job_service.export_csv("does-not-exist") is None