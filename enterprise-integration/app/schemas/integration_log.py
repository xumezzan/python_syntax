from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IntegrationLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    system_name: str
    direction: str
    request_payload: str | None = None
    response_payload: str | None = None
    status_code: int | None = None
    error_message: str | None = None
    created_at: datetime
