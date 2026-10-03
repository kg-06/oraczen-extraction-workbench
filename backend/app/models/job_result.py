from uuid import uuid4

from pydantic import BaseModel

from app.models.extraction import ExtractedRecord


class JobResult(BaseModel):
    id: str
    ticket_id: str
    status: str
    record: ExtractedRecord | None = None
    attempts: int
    validation_errors: list[str] = []
    human_edited: bool = False