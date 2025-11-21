import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # <--- 1. IMPORT THIS
from app.routers import auth, projects, categories, subcategories, items, reports
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, root_path="/api")

# 1. Configure CORS (Keep existing code)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://cost-estimator.vplanusa.com",
    "https://www.cost-estimator.vplanusa.com",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------
# 2. MOUNT STATIC FILES (THE FIX)
# ----------------------------------------------------------
# Ensure the directory exists so the server doesn't crash on startup
os.makedirs("static/uploads", exist_ok=True)

# This tells FastAPI: "If a request starts with /static, look in the 'static' folder"
app.mount("/static", StaticFiles(directory="static"), name="static")
# ----------------------------------------------------------

# Include Routers (Keep existing code)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(categories.router)
app.include_router(subcategories.router)
app.include_router(items.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"message": "Cost Estimator API is running"}