"""FastAPI service (Section Q): thin HTTP wrappers over greenhome.service.

Errors use {"error": {"code", "message", "details"}}. Run: python run.py api  (or `make api`)."""
from __future__ import annotations

import uuid
from typing import Any, Optional

from fastapi import Depends, FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from greenhome.provenance import log_event
from greenhome.scenario import ScenarioError
from greenhome.schemas import (AssessmentResult, Explanation, MonthlyUsage, PortfolioSummary, PropertyProfile,
                               ScenarioRequest, ScenarioResult)
from greenhome.service import GreenHomeService, NotFoundError, get_service

app = FastAPI(title="Green Home Score and Retrofit Engine", version="1.0.0",
              description="Models calculate, the LLM explains. All savings are estimates; value impact is indicative.")


def svc() -> GreenHomeService:
    return get_service()


def _error(status: int, code: str, message: str, details: Any = None) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message, "details": details}})


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return _error(404, "NOT_FOUND", f"unknown id: {exc.args[0] if exc.args else ''}")


@app.exception_handler(ScenarioError)
async def scenario_error_handler(request: Request, exc: ScenarioError) -> JSONResponse:
    return _error(422, "INVALID_SCENARIO", str(exc))


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = [{"loc": [str(p) for p in e.get("loc", [])], "msg": e.get("msg"), "type": e.get("type")} for e in exc.errors()]
    return _error(422, "VALIDATION_ERROR", "request validation failed", details)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return _error(422, "VALIDATION_ERROR", str(exc))


@app.exception_handler(Exception)
async def unexpected_handler(request: Request, exc: Exception) -> JSONResponse:
    error_id = uuid.uuid4().hex[:12]
    log_event("api_error", error_id=error_id, path=request.url.path, error=type(exc).__name__, message=str(exc)[:300])
    return _error(500, "INTERNAL_ERROR", "unexpected error; quote the error id when reporting it", {"error_id": error_id})


class AssessRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    profile: PropertyProfile
    monthly_usage: Optional[list[MonthlyUsage]] = None


class ExplainRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    property_id: str
    scenario_id: Optional[str] = None
    question: Optional[str] = None


class WhatIfRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    property_id: str
    question: str


class MemoryEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: str
    payload: dict[str, Any] = {}


@app.get("/health")
def health(service: GreenHomeService = Depends(svc)) -> dict[str, Any]:
    return service.health()


@app.get("/properties")
def list_properties(classification: Optional[str] = None, flagged: Optional[bool] = None,
                    sort: str = Query("improvement_potential", pattern="^(improvement_potential|score)$"),
                    limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0),
                    service: GreenHomeService = Depends(svc)) -> list[dict[str, Any]]:
    rows = service.portfolio(classification=classification, flagged=flagged, sort=sort, limit=limit, offset=offset)
    keys = ("property_id", "score", "classification", "status", "improvement_potential_pct", "ip_status", "rank",
            "delta_elec_import_kwh", "delta_gas_kwh", "carbon_reduction_kg", "flagged")
    return [{**{k: r.get(k) for k in keys}, "top_issues": [c for c in str(r.get("top_issues") or "").split("|") if c]} for r in rows]


@app.get("/properties/{property_id}")
def get_property(property_id: str, service: GreenHomeService = Depends(svc)) -> dict[str, Any]:
    return service.get_property(property_id)


@app.get("/properties/{property_id}/assessment", response_model=AssessmentResult)
def assess_stored(property_id: str, service: GreenHomeService = Depends(svc)) -> AssessmentResult:
    return service.assess(property_id)


@app.post("/assess", response_model=AssessmentResult)
def assess(request: AssessRequest, service: GreenHomeService = Depends(svc)) -> AssessmentResult:
    return service.assess(profile=request.profile, monthly_usage=request.monthly_usage)


@app.post("/scenario", response_model=ScenarioResult)
def scenario(request: ScenarioRequest, service: GreenHomeService = Depends(svc)) -> ScenarioResult:
    return service.simulate(request)


@app.post("/explain", response_model=Explanation)
def explain(request: ExplainRequest, service: GreenHomeService = Depends(svc)) -> Explanation:
    if request.scenario_id is None and not service.store.exists(request.property_id):
        raise NotFoundError(request.property_id)
    return service.explain(request.property_id, request.scenario_id, request.question)


@app.post("/whatif")
def whatif(request: WhatIfRequest, service: GreenHomeService = Depends(svc)) -> dict[str, Any]:
    out = service.whatif(request.property_id, request.question)
    return {"scenario": out["scenario"].model_dump() if out["scenario"] is not None else None,
            "explanation": out["explanation"].model_dump(), "parsed_request": out["parsed_request"]}


@app.get("/portfolio/summary", response_model=PortfolioSummary)
def portfolio_summary(service: GreenHomeService = Depends(svc)) -> PortfolioSummary:
    return service.portfolio_summary()


@app.get("/config/assumptions")
def assumptions(service: GreenHomeService = Depends(svc)) -> dict[str, Any]:
    return service.assumptions()


@app.post("/customers/{customer_id}/memory")
def add_memory(customer_id: str, event: MemoryEvent, service: GreenHomeService = Depends(svc)) -> dict[str, Any]:
    """Optional extension (O01): record a completed retrofit, constraint, declined measure or preference."""
    if service.memory is None:
        return _error(404, "MEMORY_DISABLED", "customer memory is not enabled")  # type: ignore[return-value]
    if customer_id not in set(service.store.properties["customer_id"]):
        raise NotFoundError(customer_id)
    size = service.memory.add_event(customer_id, event.type, event.payload, service.cfg)
    service.invalidate()
    return {"ok": True, "memory_size": size}
