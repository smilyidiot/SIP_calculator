"""SIP & Investment Calculator API (FastAPI).

Exposes the investment-projection calculation as a REST endpoint so the React
frontend (or any client) can request a projection for a monthly SIP or a
one-time lump-sum investment.
"""
from typing import List, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="SIP Calculator API", version="1.0.0")

# Open CORS for local development / demo (lock this down for production).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- schemas ----------
class ProjectionRequest(BaseModel):
    mode: Literal["sip", "lump"] = "sip"
    amount: float = Field(gt=0, le=100_000_000, description="Monthly SIP amount or lump-sum principal")
    annual_return: float = Field(gt=0, le=50, description="Expected annual return, %")
    years: int = Field(ge=1, le=50, description="Investment horizon in years")


class YearPoint(BaseModel):
    year: int
    invested: float
    value: float


class ProjectionResponse(BaseModel):
    invested: float
    total: float
    returns: float
    series: List[YearPoint]


# ---------- finance math ----------
def sip_future_value(monthly: float, annual_return: float, years: float) -> float:
    """Future value of a monthly SIP, contributions at the start of each month
    (annuity due):  FV = P * (((1+i)^n - 1) / i) * (1+i)."""
    i = annual_return / 100 / 12
    n = round(years * 12)
    if i == 0:
        return monthly * n
    return monthly * (((1 + i) ** n - 1) / i) * (1 + i)


def lump_future_value(principal: float, annual_return: float, years: float) -> float:
    """Future value of a one-time investment: FV = P * (1+r)^t."""
    return principal * (1 + annual_return / 100) ** years


def invested_amount(mode: str, amount: float, years: float) -> float:
    return amount * round(years * 12) if mode == "sip" else amount


def future_value(mode: str, amount: float, annual_return: float, years: float) -> float:
    if mode == "sip":
        return sip_future_value(amount, annual_return, years)
    return lump_future_value(amount, annual_return, years)


# ---------- routes ----------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/projection", response_model=ProjectionResponse)
def projection(req: ProjectionRequest) -> ProjectionResponse:
    series = [
        YearPoint(
            year=y,
            invested=round(invested_amount(req.mode, req.amount, y), 2),
            value=round(future_value(req.mode, req.amount, req.annual_return, y), 2),
        )
        for y in range(0, req.years + 1)
    ]
    invested = round(invested_amount(req.mode, req.amount, req.years), 2)
    total = round(future_value(req.mode, req.amount, req.annual_return, req.years), 2)
    return ProjectionResponse(
        invested=invested,
        total=total,
        returns=round(total - invested, 2),
        series=series,
    )
