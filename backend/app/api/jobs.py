from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel

from app.models.job import Job
from app.models.job_result import JobResult
from app.services.job_service import JobService


router = APIRouter(prefix="/api/jobs", tags=["jobs"])

job_service: JobService | None = None


class CreateJobRequest(BaseModel):
    ticket_ids: list[str]


def set_job_service(service: JobService) -> None:
    global job_service
    job_service = service


@router.post(
    "",
    response_model=Job,
    status_code=status.HTTP_202_ACCEPTED,
)
def create_job(
    request: CreateJobRequest,
    background_tasks: BackgroundTasks,
):
    if job_service is None:
        raise HTTPException(
            status_code=500,
            detail="Job service is not initialized",
        )

    if not request.ticket_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one ticket must be selected",
        )

    job = job_service.create_job(request.ticket_ids)

    background_tasks.add_task(
        job_service.run_job,
        job.id,
    )

    return job

@router.get("/{job_id}", response_model=Job)
def get_job(job_id: str):
    if job_service is None:
        raise HTTPException(
            status_code=500,
            detail="Job service is not initialized",
        )

    job = job_service.get_job(job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    return job


@router.get("/{job_id}/results", response_model=list[JobResult])
def get_job_results(job_id: str):
    if job_service is None:
        raise HTTPException(
            status_code=500,
            detail="Job service is not initialized",
        )

    job = job_service.get_job(job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    return job_service.get_results(job_id)