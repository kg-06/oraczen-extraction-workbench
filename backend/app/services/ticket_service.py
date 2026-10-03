import json
from pathlib import Path

from app.models.ticket import Ticket


class TicketService:
    def __init__(self, data_path: Path):
        self.data_path = data_path
        self._tickets: list[Ticket] = []
        self._load_tickets()

    def _load_tickets(self) -> None:
        with self.data_path.open("r", encoding="utf-8") as file:
            for line in file:
                if not line.strip():
                    continue

                data = json.loads(line)
                self._tickets.append(Ticket.model_validate(data))

    def get_all(self) -> list[Ticket]:
        return self._tickets

    def get_by_id(self, ticket_id: str) -> Ticket | None:
        for ticket in self._tickets:
            if ticket.id == ticket_id:
                return ticket

        return None