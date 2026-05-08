import uvicorn

from src.pipeline.seed_demo_data import seed_demo_data


def start_server():
    seed_result = seed_demo_data()

    if seed_result.get("status") != "success":
        raise RuntimeError(f"Demo data seeding failed: {seed_result}")

    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=8000,
    )


if __name__ == "__main__":
    start_server()
