import asyncio
from uuid import uuid4

from app.models.job import Job, JobStatus
from app.models.job_result import JobResult
from app.models.ticket import Ticket
from app.services.extraction_service import ExtractionService


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