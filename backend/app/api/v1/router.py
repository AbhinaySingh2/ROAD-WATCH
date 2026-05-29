from fastapi import APIRouter
from app.api.v1 import reports
from app.api.v1 import ledger
from app.api.v1 import auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(reports.router, prefix="/issues", tags=["issues"])
api_router.include_router(ledger.router, prefix="/ledger", tags=["ledger"])
