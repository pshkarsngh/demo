from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/")
async def list_users(db: AsyncSession = Depends(get_db)) -> dict[str, list]:
    return {"items": [], "total": 0}