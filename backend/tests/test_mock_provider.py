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
    
def test_extracts_company_from_pipe_signature():
    provider = MockExtractionProvider(delay_ms=0)

    ticket = Ticket(
        id="test_001",
        subject="Question",
        body=(
            "How does this work?\n\n"
            "Tom Beckett | Head of Operations | Castlerock Mining\n"
        ),
        channel="email",
        received_at="2026-08-01T10:00:00",
    )

    result = provider._extract(ticket, None)

    assert result["company"] == "Castlerock Mining"
    
def test_extracts_company_from_admin_signature():
    provider = MockExtractionProvider(delay_ms=0)

    ticket = Ticket(
        id="test_002",
        subject="Possible bug",
        body=(
            "Something is broken.\n\n"
            "Thanks,\n"
            "Grace Lindqvist\n"
            "Zen Vault admin, Nordvale Bank\n"
            "g.lindqvist@nordvale.com"
        ),
        channel="email",
        received_at="2026-08-01T10:00:00",
    )

    result = provider._extract(ticket, None)

    assert result["company"] == "Nordvale Bank"
    
def test_extracts_company_from_signature():
    provider = MockExtractionProvider(delay_ms=0)

    ticket = Ticket(
        id="test_003",
        subject="Question",
        body=(
            "How do I do this?\n\n"
            "Regards\n"
            "Yusuf Karim\n"
            "Meridian Logistics\n\n"
            "Sent from my iPhone"
        ),
        channel="email",
        received_at="2026-08-01T10:00:00",
    )

    result = provider._extract(ticket, None)

    assert result["company"] == "Meridian Logistics"
    
def test_extracts_company_from_call_transcript():
    provider = MockExtractionProvider(delay_ms=0)

    ticket = Ticket(
        id="test_004",
        subject="Billing issue",
        body=(
            "Transcript (inbound call)\n\n"
            "AGENT: Thanks for calling Oraczen support.\n"
            "CALLER: Hi, this is Dan from Castlerock Mining.\n"
            "AGENT: How can I help?"
        ),
        channel="call",
        received_at="2026-08-01T10:00:00",
    )

    result = provider._extract(ticket, None)

    assert result["company"] == "Castlerock Mining"
    
def test_returns_unknown_company_when_missing():
    provider = MockExtractionProvider(delay_ms=0)

    ticket = Ticket(
        id="test_005",
        subject="please advise",
        body="I need help with this issue.",
        channel="email",
        received_at="2026-08-01T10:00:00",
    )

    result = provider._extract(ticket, None)

    assert result["company"] == "Unknown Company"
    
def test_extracts_company_from_french_signature():
    provider = MockExtractionProvider(delay_ms=0)

    ticket = Ticket(
        id="test_006",
        subject="Échecs répétés + double prélèvement",
        body=(
            "Bonjour,\n\n"
            "Nous constatons depuis le 12 août des échecs répétés "
            "sur Zen Connect (erreur 504).\n\n"
            "Cordialement,\n"
            "Isabela Ortiz\n"
            "Orchid Hospitality"
        ),
        channel="email",
        received_at="2026-08-05T11:07:05Z",
    )

    result = provider._extract(ticket, None)

    assert result["company"] == "Orchid Hospitality"