from fastapi import APIRouter, Depends

from src.api.auth import require_current_user


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def get_authenticated_user(current_user: dict = Depends(require_current_user)):
    return {
        "authenticated": True,
        "user": current_user,
    }
