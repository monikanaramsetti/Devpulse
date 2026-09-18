from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_analyze_build_success():
    payload = {
        "commitHash": "8f42a1c",
        "branch": "main",
        "status": "failed",
        "logs": "[12:41:00] Error: Environment variable DATABASE_URL is not defined!\nat connect (src/config/database.ts:14)",
        "changedFiles": ["src/config/database.ts"]
    }
    response = client.post("/analyze-build", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "rootCause" in data
    assert "explanation" in data
    assert "affectedArea" in data
    assert "suggestedFix" in data
    assert "confidence" in data
    assert "DATABASE_URL" in data["rootCause"] or "DATABASE_URL" in data["explanation"]

def test_analyze_non_failed_build():
    payload = {
        "commitHash": "7c9a21b",
        "branch": "main",
        "status": "success",
        "logs": "Build succeeded.",
    }
    response = client.post("/analyze-build", json=payload)
    assert response.status_code == 400
