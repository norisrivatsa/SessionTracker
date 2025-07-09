from fastapi import FastAPI ,Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router
import uvicorn
import os

app = FastAPI()

# Serve static files (JS, CSS, etc.)
app.mount("/functionality", StaticFiles(directory=os.path.join("templates", "functionality")), name="functionality")

# CORS (optional, for frontend dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
