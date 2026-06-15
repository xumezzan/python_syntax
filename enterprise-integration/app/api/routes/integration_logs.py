from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.repositories.integration_log_repository import IntegrationLogRepository
from app.schemas.integration_log import IntegrationLogOut
from app.security import get_current_user

router = APIRouter(prefix="/integration-logs", tags=["integration-logs"])


@router.get("", response_model=list[IntegrationLogOut])
def list_logs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return IntegrationLogRepository(db).list()


@router.get("/{log_id}", response_model=IntegrationLogOut)
def get_log(
    log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    log = IntegrationLogRepository(db).get(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Лог не найден")
    return log
