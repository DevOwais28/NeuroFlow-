"""
Discord OAuth & Integration (Production Safe Version)
NeuroFlow Backend
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime
from config import settings

router = APIRouter(prefix="/discord", tags=["Discord Integration"])

# =========================
# CONFIG
# =========================

DISCORD_API_BASE = "https://discord.com/api/v10"
DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = f"{DISCORD_API_BASE}/oauth2/token"
DISCORD_USER_URL = f"{DISCORD_API_BASE}/users/@me"
DISCORD_GUILDS_URL = f"{DISCORD_API_BASE}/users/@me/guilds"

DISCORD_SCOPES = "identify email guilds"
BOT_PERMISSIONS = "66560"


# =========================
# HELPERS
# =========================

def get_db():
    from auth import db
    if db is None:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    return db


# =========================
# MODELS
# =========================

class DiscordLinkRequest(BaseModel):
    uid: str
    code: str


# =========================
# AUTH URL
# =========================

@router.get("/auth-url")
async def get_auth_url(uid: str):

    if not settings.DISCORD_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Discord client ID missing")

    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": DISCORD_SCOPES,
        "state": uid,
        "prompt": "consent"
    }

    query = "&".join([f"{k}={v}" for k, v in params.items()])

    return {
        "auth_url": f"{DISCORD_OAUTH_URL}?{query}"
    }


# =========================
# CALLBACK
# =========================

@router.post("/callback")
async def discord_callback(data: DiscordLinkRequest):

    if not settings.DISCORD_CLIENT_ID or not settings.DISCORD_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Discord OAuth not configured")

    try:
        async with httpx.AsyncClient() as client:

            # Exchange code for token
            token_res = await client.post(
                DISCORD_TOKEN_URL,
                data={
                    "client_id": settings.DISCORD_CLIENT_ID,
                    "client_secret": settings.DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": data.code,
                    "redirect_uri": settings.DISCORD_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            if token_res.status_code != 200:
                raise HTTPException(status_code=400, detail=token_res.text)

            tokens = token_res.json()

            # Get user info
            user_res = await client.get(
                DISCORD_USER_URL,
                headers={
                    "Authorization": f"Bearer {tokens['access_token']}"
                }
            )

            if user_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch Discord user")

            user = user_res.json()

            db = get_db()

            discord_data = {
                "discord_id": user["id"],
                "username": user["username"],
                "email": user.get("email"),
                "access_token": tokens["access_token"],
                "refresh_token": tokens.get("refresh_token"),
                "connected_at": datetime.utcnow().isoformat()
            }

            db.collection("users") \
                .document(data.uid) \
                .collection("connections") \
                .document("discord") \
                .set(discord_data)

            return {
                "success": True,
                "username": user["username"]
            }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# USER STATUS
# =========================

@router.get("/user/{uid}")
async def get_user(uid: str):

    db = get_db()

    doc = db.collection("users") \
        .document(uid) \
        .collection("connections") \
        .document("discord") \
        .get()

    if not doc.exists:
        return {"connected": False}

    data = doc.to_dict()

    return {
        "connected": True,
        "discord_username": data.get("username"),
        "discord_email": data.get("email")
    }


# =========================
# GUILDS
# =========================

@router.get("/guilds/{uid}")
async def get_guilds(uid: str):

    db = get_db()

    doc = db.collection("users") \
        .document(uid) \
        .collection("connections") \
        .document("discord") \
        .get()

    if not doc.exists:
        raise HTTPException(status_code=400, detail="Discord not connected")

    data = doc.to_dict()
    access_token = data.get("access_token")

    async with httpx.AsyncClient() as client:

        res = await client.get(
            DISCORD_GUILDS_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=res.text)

        guilds = res.json()

        return {
            "guilds": guilds,
            "count": len(guilds)
        }


# =========================
# DISCONNECT
# =========================

@router.post("/disconnect/{uid}")
async def disconnect(uid: str):

    db = get_db()

    db.collection("users") \
        .document(uid) \
        .collection("connections") \
        .document("discord") \
        .delete()

    return {"success": True}


# =========================
# BOT INVITE
# =========================

@router.get("/bot-invite")
async def bot_invite(guild_id: str = ""):

    if not settings.DISCORD_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Missing client ID")

    url = (
        f"{DISCORD_OAUTH_URL}"
        f"?client_id={settings.DISCORD_CLIENT_ID}"
        f"&permissions={BOT_PERMISSIONS}"
        f"&scope=bot"
    )

    if guild_id:
        url += f"&guild_id={guild_id}"

    return {
        "invite_url": url
    }
