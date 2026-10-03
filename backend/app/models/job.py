from enum import Enum

from pydantic import BaseModel


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"


class Job(BaseModel):
    id: str
    ticket_ids: list[str]
    status: JobStatus
    total: int
    processed: int = 0
    completed: int = 0
    needs_review: int = 0