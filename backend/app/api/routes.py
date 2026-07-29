from fastapi import APIRouter

# router = APIRouter()
router = APIRouter(prefix="/api/v1", tags=["CareerPilot API"])

@router.get("/")
def root():
    return {
        "message": "Welcome to CareerPilot AI 🚀"
    }

@router.get("/health")
def health():
    return {
        "status": "healthy"
    }