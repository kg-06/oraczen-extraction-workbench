from fastapi import APIRouter, HTTPException

from app.models.job_result import JobResult
from app.models.record_update import RecordUpdate
from app.services.job_service import JobService


router = APIRouter(
    prefix="/api/records",
    tags=["records"],
)

job_service: JobService | None = None


def set_job_service(service: JobService) -> None:
    global job_service
    job_service = service


@router.patch(
    "/{record_id}",
    response_model=JobResult,
)
def update_record(
    record_id: str,
    updates: RecordUpdate,
):
    if job_service is None:
        raise HTTPException(
            status_code=500,
            detail="Job service is not initialized",
        )

    try:
        result = job_service.update_result(
            record_id,
            updates.model_dump(exclude_unset=True),
        )

    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid record update",
        )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Record not found",
        )

    return result