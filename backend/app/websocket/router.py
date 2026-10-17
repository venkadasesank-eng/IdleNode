import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError, jwt

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.entities import User, Computer, ComputeSession, CreditAccount

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

def authenticate_ws_token(token: str | None) -> dict | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

@router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket, token: str = Query(None)):
    payload = authenticate_ws_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    await manager.connect(websocket)

    try:
        # Send initial handshake acknowledging connection
        await websocket.send_text(json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Authenticated WebSocket connected to IdleNode campus grid telemetry"
        }))

        # Send initial status
        db = SessionLocal()
        try:
            total_nodes = db.query(Computer).count()
            active_nodes = db.query(Computer).filter(Computer.status.in_(["busy", "in_use", "reserved"])).count()
            queued = db.query(ComputeSession).filter(ComputeSession.status == "queued").count()
            
            await websocket.send_text(json.dumps({
                "type": "TELEMETRY_SNAPSHOT",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "total_nodes": total_nodes,
                    "active_nodes": active_nodes,
                    "queued_tasks": queued,
                    "grid_status": "ONLINE"
                }
            }))
        finally:
            db.close()

        # Keep connection alive with periodic telemetry updates
        while True:
            # Wait for client ping or periodic update
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=15.0)
                # Client sent a message/ping
                await websocket.send_text(json.dumps({
                    "type": "PONG",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }))
            except asyncio.TimeoutError:
                # Periodic telemetry heartbeat
                await websocket.send_text(json.dumps({
                    "type": "TELEMETRY_HEARTBEAT",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": "healthy"
                }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
