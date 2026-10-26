"""Tests for the SIP Calculator API."""
from fastapi.testclient import TestClient

from main import app, sip_future_value, lump_future_value

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_sip_known_value():
    # ₹10,000/month at 12% p.a. for 10 years is ~₹23.23 lakh (standard figure).
    fv = sip_future_value(10000, 12, 10)
    assert 2_320_000 < fv < 2_326_000


def test_lump_known_value():
    # ₹1,00,000 at 10% for 5 years = 100000 * 1.1^5 = 161051.
    assert round(lump_future_value(100000, 10, 5)) == 161051


def test_projection_endpoint():
    r = client.post(
        "/api/projection",
        json={"mode": "sip", "amount": 10000, "annual_return": 12, "years": 10},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["invested"] == 1_200_000
    assert data["total"] > data["invested"]
    assert data["returns"] == round(data["total"] - data["invested"], 2)
    assert len(data["series"]) == 11
    assert data["series"][0] == {"year": 0, "invested": 0, "value": 0}


def test_validation_rejects_bad_input():
    r = client.post(
        "/api/projection",
        json={"mode": "sip", "amount": -5, "annual_return": 12, "years": 10},
    )
    assert r.status_code == 422
