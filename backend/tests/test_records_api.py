from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def create_completed_job():
    response = client.post(
        "/api/jobs",
        json={
            "ticket_ids": ["tkt_0001"],
        },
    )

    assert response.status_code == 202

    job_id = response.json()["id"]

    response = client.get(
        f"/api/jobs/{job_id}/results"
    )

    results = response.json()

    assert len(results) == 1

    return results[0]


def test_update_record():
    result = create_completed_job()

    response = client.patch(
        f"/api/records/{result['id']}",
        json={
            "severity": "high",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["record"]["severity"] == "high"
    assert data["human_edited"] is True


def test_invalid_record_update():
    result = create_completed_job()

    response = client.patch(
        f"/api/records/{result['id']}",
        json={
            "severity": "banana",
        },
    )

    assert response.status_code == 422


def test_unknown_record():
    response = client.patch(
        "/api/records/does-not-exist",
        json={
            "severity": "high",
        },
    )

    assert response.status_code == 404