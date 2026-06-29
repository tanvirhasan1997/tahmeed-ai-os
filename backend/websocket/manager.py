"""WebSocket Manager"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
router = APIRouter()

class ConnectionManager:
    def __init__(self): self.connections = {}
    async def connect(self, ws, user_id): await ws.accept(); self.connections.setdefault(user_id, set()).add(ws)
    def disconnect(self, ws, user_id): self.connections.get(user_id, set()).discard(ws)
    async def send_to_user(self, user_id, data):
        for ws in self.connections.get(user_id, set()):
            try: await ws.send_json(data)
            except: pass

manager = ConnectionManager()

@router.websocket("")
async def ws_endpoint(websocket: WebSocket, token: str = ""):
    await manager.connect(websocket, "anonymous")
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("event") == "ping":
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, "anonymous")
