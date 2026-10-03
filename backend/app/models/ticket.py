from datetime import datetime

from pydantic import BaseModel


class Ticket(BaseModel):
    id: str
    subject: str
    body: str
    channel: str
    received_at: datetime