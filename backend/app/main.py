from pathlib import Path

from fastapi import FastAPI

from app.api.tickets import router as tickets_router
from app.api.tickets import set_ticket_service
from app.services.ticket_service import TicketService


app = FastAPI(title="Oraczen Extraction Workbench")


data_path = Path(__file__).resolve().parents[2] / "data" / "tickets.jsonl"

ticket_service = TicketService(data_path)
set_ticket_service(ticket_service)

app.include_router(tickets_router)


@app.get("/health")
def health():
    return {"status": "ok"}