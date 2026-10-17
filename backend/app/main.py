from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, Base, engine
import backend.app.models # ensures all tables are registered in Base.metadata
from backend.app.core.seed import seed_database
from backend.app.api import auth, student, lab_assistant, hod, admin, worker
from backend.app.websocket import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Campus-powered computing platform linking approved students to laboratory computers",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(student.router, prefix=f"{settings.API_V1_STR}/student", tags=["Student Compute"])
app.include_router(lab_assistant.router, prefix=f"{settings.API_V1_STR}/lab-assistant", tags=["Lab Supervision"])
app.include_router(hod.router, prefix=f"{settings.API_V1_STR}/hod", tags=["Department Administration"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Institution Administration"])
app.include_router(worker.router, prefix=f"{settings.API_V1_STR}/worker", tags=["Worker Agent"])
app.include_router(ws_router.router, tags=["WebSockets"])

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "idlenode-controller",
        "version": settings.VERSION,
        "grid_status": "ONLINE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
