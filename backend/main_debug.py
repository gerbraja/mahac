import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# INITIALIZE FASTAPI APPLICATION
app = FastAPI(
    title="TEI Backend API Debug",
    description="Debug version - minimal routers",
    version="1.0.0",
)

@app.on_event("startup")
def _log_startup():
    print("[DEBUG] FastAPI startup event fired")

@app.on_event("shutdown")
def _log_shutdown():
    print("[DEBUG] FastAPI shutdown event fired")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Debug server running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="debug")
