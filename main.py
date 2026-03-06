"""
PathAI – AI Learning Path Navigator
FastAPI Backend Entry Point
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import uvicorn

from routes import router
from database import init_db

# ─── App Setup ────────────────────────────────────────────────────
app = FastAPI(
    title="PathAI – AI Learning Path Navigator",
    description="Backend API for generating personalized AI-driven learning paths",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS (allow frontend JS to call the API) ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Init database on startup ─────────────────────────────────────
@app.on_event("startup")
async def startup():
    init_db()

# ─── Mount API routes ─────────────────────────────────────────────
app.include_router(router, prefix="/api")

# ─── Serve frontend static files ──────────────────────────────────
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# ─── Root redirect ────────────────────────────────────────────────
@app.get("/api")
def api_root():
    return {"message": "PathAI API is running 🚀", "docs": "/api/docs"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
