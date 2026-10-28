from fastapi import APIRouter, HTTPException, Query

from app.services.lab_history_service import clear_history, get_history_entry, list_history

router = APIRouter(prefix="/api/lab", tags=["lab"])


@router.get("/history")
def lab_history(limit: int = Query(20, ge=1, le=40)) -> dict:
    items = list_history(limit=limit)
    return {"items": items, "total": len(items)}


@router.get("/history/{entry_id}")
def lab_history_detail(entry_id: str) -> dict:
    item = get_history_entry(entry_id)
    if not item:
        raise HTTPException(status_code=404, detail="Lab history entry not found")
    return item


@router.delete("/history")
def lab_history_clear() -> dict:
    clear_history()
    return {"ok": True}
