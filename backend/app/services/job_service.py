import asyncio
import csv
import io
from uuid import uuid4
from pydantic import ValidationError
from app.models.job import Job, JobStatus
from app.models.job_result import JobResult
from app.models.ticket import Ticket
from app.services.extraction_service import ExtractionService
from app.models.extraction import ExtractedRecord



class JobService:

    def __init__(
        self,
        extraction_service: ExtractionService,
        tickets: list[Ticket],
    ):
        self.extraction_service = extraction_service
        self.tickets = tickets
        self.jobs: dict[str, Job] = {}
        self.results: dict[str, list[JobResult]] = {}

    def create_job(self, ticket_ids: list[str]) -> Job:
        job = Job(
            id=str(uuid4()),
            ticket_ids=ticket_ids,
            status=JobStatus.QUEUED,
            total=len(ticket_ids),
        )

        self.jobs[job.id] = job
        self.results[job.id] = []

        return job

    def get_job(self, job_id: str) -> Job | None:
        return self.jobs.get(job_id)

    def get_results(self, job_id: str) -> list[JobResult]:
        return self.results.get(job_id, [])

    async def run_job(self, job_id: str) -> None:
        job = self.jobs[job_id]
        job.status = JobStatus.RUNNING

        selected_tickets = [
            ticket
            for ticket in self.tickets
            if ticket.id in job.ticket_ids
        ]

        semaphore = asyncio.Semaphore(5)

        async def process_ticket(ticket: Ticket) -> None:
            async with semaphore:
                result = await self.extraction_service.process(ticket)

                self.results[job_id].append(
                    JobResult(
                        id=str(uuid4()),
                        ticket_id=ticket.id,
                        status=result.status,
                        record=result.record,
                        attempts=result.attempts,
                        validation_errors=result.validation_errors,
                    )
                )

                job.processed += 1

                if result.status == "completed":
                    job.completed += 1
                elif result.status == "needs_review":
                    job.needs_review += 1

        await asyncio.gather(
            *(process_ticket(ticket) for ticket in selected_tickets)
        )

        job.status = JobStatus.COMPLETED
        
    def update_result(self,result_id: str,updates: dict,) -> JobResult | None:
        for results in self.results.values():
            for result in results:
                if result.id != result_id:
                    continue

                current_data = (
                    result.record.model_dump()
                    if result.record is not None
                    else {
                        "company": "",
                        "product": "",
                        "category": "",
                        "severity": "",
                        "requested_action": "",
                        "refund_amount": None,
                        "deadline": None,
                        "escalated": False,
                    }
                )

                for key, value in updates.items():
                    if value is not None:
                        current_data[key] = value

                try:
                    updated_record = ExtractedRecord.model_validate(
                        current_data
                    )
                except ValidationError as error:
                    raise ValueError(str(error))

                result.record = updated_record
                result.status = "completed"
                result.human_edited = True

                return result

        return None
    
    def export_csv(self, job_id: str) -> str | None:
        if job_id not in self.jobs:
            return None

        output = io.StringIO()

        fieldnames = [
        "ticket_id",
        "company",
        "product",
        "category",
        "severity",
        "requested_action",
        "refund_amount",
        "deadline",
        "escalated",
        "human_edited",
        "status",
    ]

        writer = csv.DictWriter(
            output,
            fieldnames=fieldnames,
        )

        writer.writeheader()

        for result in self.results.get(job_id, []):
            if result.record is None:
                continue

            record = result.record

            writer.writerow(
                {
                "ticket_id": result.ticket_id,
                "company": record.company,
                "product": record.product.value,
                "category": record.category.value,
                "severity": record.severity.value,
                "requested_action": record.requested_action.value,
                "refund_amount": record.refund_amount,
                "deadline": record.deadline,
                "escalated": record.escalated,
                "human_edited": result.human_edited,
                "status": result.status,
            }
            )

        return output.getvalue()