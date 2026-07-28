from fastapi import FastAPI

app = FastAPI(
    title="CareerPilot AI",
    version="0.1.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to CareerPilot AI 🚀"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }