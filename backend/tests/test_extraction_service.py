import pytest

from app.models.ticket import Ticket
from app.providers.mock import MockExtractionProvider
from app.services.extraction_service import ExtractionService


def make_ticket(ticket_id: str) -> Ticket:
    return Ticket(
        id=ticket_id,
        subject="Zen Studio issue",
        body="The dashboard is broken.",
        channel="email",
        received_at="2026-08-28T10:00:00Z",
    )


@pytest.mark.asyncio
async def test_valid_extraction_completes_on_first_attempt():
    provider = MockExtractionProvider(delay_ms=0)
    service = ExtractionService(provider)

    result = await service.process(make_ticket("test_1"))

    assert result.status == "completed"
    assert result.attempts == 1
    assert result.record is not None
    assert result.validation_errors == []


@pytest.mark.asyncio
async def test_invalid_first_attempt_succeeds_on_retry():
    provider = MockExtractionProvider(delay_ms=0)
    service = ExtractionService(provider)

    result = await service.process(make_ticket("tkt_0004"))

    assert result.status == "completed"
    assert result.attempts == 2
    assert result.record is not None
    assert len(result.validation_errors) == 1


@pytest.mark.asyncio
async def test_invalid_output_after_retry_needs_review():
    provider = MockExtractionProvider(delay_ms=0)
    service = ExtractionService(provider)

    result = await service.process(make_ticket("tkt_0020"))

    assert result.status == "needs_review"
    assert result.attempts == 2
    assert result.record is None
    assert len(result.validation_errors) == 2