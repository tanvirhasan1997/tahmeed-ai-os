"""Tahmeed AI OS - Main Application Entry Point"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database.connection import init_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(title=settings.APP_NAME, description="Multi-Agent AI Operating System", version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

API_PREFIX = f"/api/{settings.API_VERSION}"

from api.auth import router as auth_router
from api.workspaces import router as workspaces_router
from api.command import router as command_router
from api.tasks import router as tasks_router
from api.memory import router as memory_router
from api.vault import router as vault_router
from api.automations import router as automations_router
from api.integrations import router as integrations_router
from api.dashboard import router as dashboard_router
from api.notifications import router as notifications_router
from websocket.manager import router as ws_router

app.include_router(auth_router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(workspaces_router, prefix=f"{API_PREFIX}/workspaces", tags=["Workspaces"])
app.include_router(command_router, prefix=f"{API_PREFIX}/command", tags=["Command"])
app.include_router(tasks_router, prefix=f"{API_PREFIX}/tasks", tags=["Tasks"])
app.include_router(memory_router, prefix=f"{API_PREFIX}/memory", tags=["Memory"])
app.include_router(vault_router, prefix=f"{API_PREFIX}/vault", tags=["Vault"])
app.include_router(automations_router, prefix=f"{API_PREFIX}/automations", tags=["Automations"])
app.include_router(integrations_router, prefix=f"{API_PREFIX}/integrations", tags=["Integrations"])
app.include_router(dashboard_router, prefix=f"{API_PREFIX}/dashboard", tags=["Dashboard"])
app.include_router(notifications_router, prefix=f"{API_PREFIX}/notifications", tags=["Notifications"])
app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])

@app.get("/health")
async def health(): return {"status": "healthy", "app": settings.APP_NAME}

@app.get("/")
async def root(): return {"name": settings.APP_NAME, "tagline": "One Command. Your Entire AI Team.", "docs": "/docs"}
