from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.utils.websocket_manager import manager

router = APIRouter()


@router.websocket("/ws/notificaciones")
async def websocket_notifications(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and optionally read messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@router.post("/api/notificacion")
async def enviar_notificacion(payload: dict):
    """Endpoint to trigger a notification broadcast (for testing)."""
    await manager.broadcast(payload)
    return {"mensaje": "Notificación enviada"}
