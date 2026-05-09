from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from auth import router as auth_router
from discord import router as discord_router
from google_api import router as google_router
from ai import router as ai_router
from linkedin import router as linkedin_router

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(discord_router)
app.include_router(google_router, prefix="/google", tags=["google"])
app.include_router(ai_router, prefix="/ai", tags=["ai"])
app.include_router(linkedin_router, prefix="/linkedin", tags=["linkedin"])

@app.get("/")
async def root():
    return {"message": "NeuroFlow API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
