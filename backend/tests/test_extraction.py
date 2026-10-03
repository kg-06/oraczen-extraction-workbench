from datetime import date

from app.models.extraction import (
    Category,
    ExtractedRecord,
    Product,
    RequestedAction,
    Severity,
)


def test_valid_extraction():
    record = ExtractedRecord(
        company="Nordvale Bank",
        product=Product.ZEN_VAULT,
        category=Category.BILLING,
        severity=Severity.HIGH,
        requested_action=RequestedAction.REFUND,
        refund_amount=4820,
        deadline=date(2026, 9, 15),
        escalated=False,
    )

    assert record.company == "Nordvale Bank"
    assert record.category == Category.BILLING
    assert record.refund_amount == 4820
    
import pytest

from pydantic import ValidationError


def test_invalid_category():
    with pytest.raises(ValidationError):
        ExtractedRecord(
            company="Nordvale Bank",
            product="Zen Vault",
            category="banana",
            severity="high",
            requested_action="refund",
            refund_amount=4820,
            deadline=None,
            escalated=False,
        )
        
def test_invalid_severity():
    with pytest.raises(ValidationError):
        ExtractedRecord(
            company="Nordvale Bank",
            product="Zen Vault",
            category="billing",
            severity="very_bad",
            requested_action="refund",
            refund_amount=4820,
            deadline=None,
            escalated=False,
        )
        
def test_optional_fields_can_be_none():
    record = ExtractedRecord(
        company="Acme",
        product="Zen Studio",
        category="bug",
        severity="medium",
        requested_action="fix",
        refund_amount=None,
        deadline=None,
        escalated=False,
    )

    assert record.refund_amount is None
    assert record.deadline is None