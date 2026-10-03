from abc import ABC, abstractmethod

from app.models.ticket import Ticket


class ExtractionProvider(ABC):

    @abstractmethod
    async def extract(self, ticket: Ticket) -> dict:
        pass