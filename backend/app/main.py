from pathlib import Path

from fastapi import FastAPI

from app.api.jobs import router as jobs_router
from app.api.jobs import set_job_service
from app.api.tickets import router as tickets_router
from app.api.tickets import set_ticket_service
from app.providers.mock import MockExtractionProvider
from app.services.extraction_service import ExtractionService
from app.services.job_service import JobService
from app.services.ticket_service import TicketService


app = FastAPI(title="Oraczen Extraction Workbench")


# Load tickets
data_path = Path(__file__).resolve().parents[2] / "data" / "tickets.jsonl"

ticket_service = TicketService(data_path)
set_ticket_service(ticket_service)


# Create extraction provider
provider = MockExtractionProvider(delay_ms=500)

extraction_service = ExtractionService(provider)


# Create job service
job_service = JobService(
    extraction_service=extraction_service,
    tickets=ticket_service.get_all(),
)

set_job_service(job_service)


# Register routes
app.include_router(tickets_router)
app.include_router(jobs_router)


@app.get("/health")
def health():
    return {"status": "ok"}