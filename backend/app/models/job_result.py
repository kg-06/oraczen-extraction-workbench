from pydantic import BaseModel

from app.models.extraction import ExtractedRecord


class JobResult(BaseModel):
    ticket_id: str
    status: str
    record: ExtractedRecord | None = None
    attempts: int
    validation_errors: list[str] = []