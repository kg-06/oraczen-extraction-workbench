from dataclasses import dataclass

from pydantic import ValidationError

from app.models.extraction import ExtractedRecord
from app.models.ticket import Ticket
from app.providers.base import ExtractionProvider


@dataclass
class ExtractionResult:
    status: str
    record: ExtractedRecord | None
    attempts: int
    validation_errors: list[str]


class ExtractionService:

    def __init__(self, provider: ExtractionProvider):
        self.provider = provider

    async def process(self, ticket: Ticket) -> ExtractionResult:
        validation_errors = []

        # First attempt
        raw_result = await self.provider.extract(ticket)

        try:
            record = ExtractedRecord.model_validate(raw_result)

            return ExtractionResult(
                status="completed",
                record=record,
                attempts=1,
                validation_errors=[],
            )

        except ValidationError as error:
            validation_errors.append(str(error))

        # Retry once
        raw_result = await self.provider.extract(
            ticket,
            validation_error=validation_errors[-1],
        )

        try:
            record = ExtractedRecord.model_validate(raw_result)

            return ExtractionResult(
                status="completed",
                record=record,
                attempts=2,
                validation_errors=validation_errors,
            )

        except ValidationError as error:
            validation_errors.append(str(error))

            return ExtractionResult(
                status="needs_review",
                record=None,
                attempts=2,
                validation_errors=validation_errors,
            )