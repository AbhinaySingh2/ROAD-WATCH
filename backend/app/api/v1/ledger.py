from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_db
from app.models.report import Report, Authority, ReportStatus

router = APIRouter()

@router.get("/stats")
async def get_ledger_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns statistics on report statuses across different authorities.
    """
    # Group by authority and status
    result = await db.execute(
        select(Report.assigned_authority, Report.status, func.count(Report.id))
        .group_by(Report.assigned_authority, Report.status)
    )
    
    rows = result.all()
    
    stats = {}
    for authority, status, count in rows:
        auth_name = authority.value if hasattr(authority, 'value') else str(authority)
        status_name = status.value if hasattr(status, 'value') else str(status)
        
        if auth_name not in stats:
            stats[auth_name] = {}
        
        stats[auth_name][status_name] = count
        
    return {"data": stats}
