#!/usr/bin/env python
"""Minimal FastAPI server for testing - no routers"""
import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Minimal Test")

@app.get("/")
def root():
    return {"message": "Minimal server running"}

@app.on_event("startup")
def startup():
    print("[TEST] Startup event fired")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
