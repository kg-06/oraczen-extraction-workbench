from datetime import date

from pydantic import BaseModel


class RecordUpdate(BaseModel):
    company: str | None = None
    product: str | None = None
    category: str | None = None
    severity: str | None = None
    requested_action: str | None = None
    refund_amount: float | None = None
    deadline: date | None = None
    escalated: bool | None = None