import pytest

from app.models.ticket import Ticket
from app.providers.mock import MockExtractionProvider


@pytest.mark.asyncio
async def test_mock_provider_returns_extraction():
    ticket = Ticket(
        id="test_1",
        subject="Zen Vault billing issue",
        body="Please refund $4,820.",
        channel="email",
        received_at="2026-08-28T10:00:00Z",
    )

    provider = MockExtractionProvider(delay_ms=0)

    result = await provider.extract(ticket)

    assert result["product"] == "Zen Vault"
    assert result["category"] == "billing"
    assert result["requested_action"] == "refund"
    assert result["refund_amount"] == 4820
    
@pytest.mark.asyncio
async def test_mock_provider_can_produce_invalid_output():
    ticket = Ticket(
        id="tkt_0004",
        subject="please advise",
        body="please advise",
        channel="email",
        received_at="2026-08-28T10:00:00Z",
    )

    provider = MockExtractionProvider(delay_ms=0)

    result = await provider.extract(ticket)

    assert result["category"] == "not_a_real_category"
    
@pytest.mark.asyncio
async def test_mock_provider_is_deterministic():
    ticket = Ticket(
        id="test_2",
        subject="Zen Studio is broken",
        body="The dashboard is unavailable.",
        channel="email",
        received_at="2026-08-28T10:00:00Z",
    )

    provider = MockExtractionProvider(delay_ms=0)

    first = await provider.extract(ticket)
    second = await provider.extract(ticket)

    assert first == second