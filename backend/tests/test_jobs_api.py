import asyncio

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_create_job():
    response = client.post(
        "/api/jobs",
        json={
            "ticket_ids": [
                "tkt_0001",
                "tkt_0002",
            ]
        },
    )

    assert response.status_code == 202

    data = response.json()

    assert "id" in data
    assert data["ticket_ids"] == [
        "tkt_0001",
        "tkt_0002",
    ]
    assert data["total"] == 2


def test_create_job_requires_tickets():
    response = client.post(
        "/api/jobs",
        json={
            "ticket_ids": []
        },
    )

    assert response.status_code == 400


def test_get_nonexistent_job():
    response = client.get(
        "/api/jobs/does-not-exist"
    )

    assert response.status_code == 404