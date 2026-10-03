from fastapi import APIRouter, HTTPException

from app.models.ticket import Ticket
from app.services.ticket_service import TicketService


router = APIRouter(prefix="/api/tickets", tags=["tickets"])

ticket_service: TicketService | None = None


def set_ticket_service(service: TicketService) -> None:
    global ticket_service
    ticket_service = service


@router.get("", response_model=list[Ticket])
def get_tickets():
    return ticket_service.get_all()


@router.get("/{ticket_id}", response_model=Ticket)
def get_ticket(ticket_id: str):
    ticket = ticket_service.get_by_id(ticket_id)

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket