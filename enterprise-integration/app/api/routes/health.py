from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    """Health check: мониторинг дёргает его, чтобы убедиться, что сервис жив."""
    return {"status": "ok"}
