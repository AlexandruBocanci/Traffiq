from fastapi import FastAPI

app = FastAPI(
  title="Traffiq API",
  description="Backend API for Traffiq v1.",
  version="1.0.0"
)

@app.get("/health")
def health_check():
  return {"status": "ok"}