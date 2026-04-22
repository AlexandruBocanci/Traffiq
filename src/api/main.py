from fastapi import FastAPI
from src.api.routes.health import router as health_router
from src.api.routes.streets import router as streets_router
from src.api.routes.traffic import router as traffic_router
from src.api.routes.weather import router as weather_router

app = FastAPI(
    title="Traffiq API",
    description="Backend API for Traffiq v2.",
    version="2.0.0",
)

app.include_router(health_router)
app.include_router(traffic_router)
app.include_router(streets_router)
app.include_router(weather_router)
