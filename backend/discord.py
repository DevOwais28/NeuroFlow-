"""
Discord OAuth & Data Integration for NeuroFlow
CORRECTED + HACKATHON SAFE VERSION
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime, timedelta
from config import settings

router = APIRouter(prefix="/discord", tags=["Discord Integration"])
 
def get_db():
    from auth import db
    if db is None:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    return db

# =========================
# DISCORD CONFIG
# =========================

DISCORD_API_BASE = "https://discord.com/api/v10"
DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = f"{DISCORD_API_BASE}/oauth2/token"
DISCORD_USER_URL = f"{DISCORD_API_BASE}/users/@me"
DISCORD_GUILDS_URL = f"{DISCORD_API_BASE}/users/@me/guilds"

# FIXED SCOPES
DISCORD_SCOPES = "identify email guilds messages.read"

# Bot permissions: Read Messages + Read History = 66560
BOT_PERMISSIONS = "66560"

# =========================
# MODELS
# =========================

class DiscordLinkRequest(BaseModel):
    uid: str
    code: str
    redirect_uri: Optional[str] = None


# =========================
# AUTH URL
# =========================

@router.get("/auth-url")
async def get_discord_auth_url(uid: str):

    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": DISCORD_SCOPES,
        "state": uid,
        "prompt": "consent"
    }

    from urllib.parse import urlencode
    query = urlencode(params)

    return {
        "auth_url": f"{DISCORD_OAUTH_URL}?{query}"
    }


# =========================
# CALLBACK
# =========================

@router.post("/callback")
async def discord_callback(data: DiscordLinkRequest):

    try:

        async with httpx.AsyncClient() as client:

            # Use the redirect_uri from frontend if provided, otherwise fallback to settings
            redirect_uri = data.redirect_uri or settings.DISCORD_REDIRECT_URI
            print(f"🔵 Discord: Using redirect_uri: {redirect_uri}")

            token_response = await client.post(
                DISCORD_TOKEN_URL,
                data={
                    "client_id": settings.DISCORD_CLIENT_ID,
                    "client_secret": settings.DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": data.code,
                    "redirect_uri": redirect_uri,
                    "scope": DISCORD_SCOPES
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=token_response.text
                )

            tokens = token_response.json()

            # FETCH USER INFO
            user_response = await client.get(
                DISCORD_USER_URL,
                headers={
                    "Authorization": f"Bearer {tokens['access_token']}"
                }
            )

            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to fetch Discord user"
                )

            discord_user = user_response.json()

            db = get_db()

            discord_data = {
                "discord_id": discord_user["id"],
                "discord_username": discord_user["username"],
                "discord_email": discord_user.get("email"),
                "access_token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
                "connected_at": datetime.utcnow().isoformat()
            }

            db.collection("users") \
                .document(data.uid) \
                .collection("connections") \
                .document("discord") \
                .set(discord_data)

            return {
                "success": True,
                "discord_username": discord_user["username"]
            }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# USER INFO
# =========================

@router.get("/user/{uid}")
async def get_discord_user(uid: str):

    from auth import db

    discord_doc = db.collection("users") \
        .document(uid) \
        .collection("connections") \
        .document("discord") \
        .get()

    if not discord_doc.exists:
        return {
            "connected": False
        }

    data = discord_doc.to_dict()

    return {
        "connected": True,
        "discord_username": data.get("discord_username"),
        "discord_email": data.get("discord_email")
    }


# =========================
# GUILDS
# =========================

@router.get("/guilds/{uid}")
async def get_user_guilds(uid: str):

    try:

        from auth import db

        discord_doc = db.collection("users") \
            .document(uid) \
            .collection("connections") \
            .document("discord") \
            .get()

        if not discord_doc.exists:
            raise HTTPException(
                status_code=400,
                detail="Discord not connected"
            )

        data = discord_doc.to_dict()

        access_token = data.get("access_token")

        async with httpx.AsyncClient() as client:

            response = await client.get(
                DISCORD_GUILDS_URL,
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )

            print(f"🔵 Discord guilds API status: {response.status_code}")

            if response.status_code != 200:
                print(f"🔴 Discord guilds API failed: {response.text}")
                raise HTTPException(
                    status_code=400,
                    detail=response.text
                )

            guilds = response.json()
            print(f"🔵 Discord returned {len(guilds)} guilds: { [g.get('name') for g in guilds] }")

            return {
                "guilds": guilds,
                "count": len(guilds)
            }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# CHANNELS
# =========================

@router.get("/channels/{uid}")
async def get_guild_channels(uid: str, guild_id: str):

    try:

        bot_token = settings.DISCORD_BOT_TOKEN

        if not bot_token:
            return {
                "channels": [],
                "error": "Bot token missing"
            }

        async with httpx.AsyncClient() as client:

            response = await client.get(
                f"{DISCORD_API_BASE}/guilds/{guild_id}/channels",
                headers={
                    "Authorization": f"Bot {bot_token}"
                }
            )

            if response.status_code != 200:

                return {
                    "channels": [],
                    "error": response.text
                }

            channels = response.json()

            text_channels = [
                c for c in channels
                if c.get("type") == 0
            ]

            return {
                "channels": text_channels
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# MESSAGES
# =========================

@router.get("/messages/{uid}")
async def get_discord_messages(
    uid: str,
    channel_id: Optional[str] = None,
    guild_id: Optional[str] = None,
    limit: int = 50
):

    try:

        from auth import db

        discord_doc = db.collection("users") \
            .document(uid) \
            .collection("connections") \
            .document("discord") \
            .get()

        if not discord_doc.exists:
            raise HTTPException(status_code=400, detail="Discord not connected")

        data = discord_doc.to_dict()
        access_token = data.get("access_token")
        bot_token = settings.DISCORD_BOT_TOKEN

        print(f"🔵 Fetching Discord messages for {uid}, guild_id={guild_id}, channel_id={channel_id}")

        async with httpx.AsyncClient() as client:

            # ── CASE 1: specific channel via bot token ──────────────────────
            if channel_id and bot_token:
                response = await client.get(
                    f"{DISCORD_API_BASE}/channels/{channel_id}/messages?limit={limit}",
                    headers={"Authorization": f"Bot {bot_token}"}
                )
                if response.status_code == 200:
                    msgs = response.json()
                    for m in msgs:
                        m["_channel_name"] = "Channel"
                        m["_channel_type"] = "guild"
                    return {"messages": msgs, "source": "discord_channel"}
                print(f"🔴 Channel fetch failed: {response.status_code} {response.text}")

            # ── CASE 2: specific guild via bot token ─────────────────────────
            if guild_id and bot_token:
                channels_res = await client.get(
                    f"{DISCORD_API_BASE}/guilds/{guild_id}/channels",
                    headers={"Authorization": f"Bot {bot_token}"}
                )
                if channels_res.status_code == 200:
                    channels = channels_res.json()
                    text_channels = [c for c in channels if c.get("type") == 0]
                    print(f"🔵 Found {len(text_channels)} text channels in guild {guild_id}")

                    all_messages = []
                    for ch in text_channels[:3]:
                        msg_res = await client.get(
                            f"{DISCORD_API_BASE}/channels/{ch['id']}/messages?limit=10",
                            headers={"Authorization": f"Bot {bot_token}"}
                        )
                        if msg_res.status_code == 200:
                            msgs = msg_res.json()
                            for m in msgs:
                                m["_channel_name"] = ch.get("name", "unknown")
                                m["_channel_type"] = "guild"
                            all_messages.extend(msgs)
                        else:
                            print(f"🔴 Msg fetch failed ch {ch['id']}: {msg_res.status_code}")

                    if all_messages:
                        all_messages.sort(key=lambda m: m.get("timestamp", ""), reverse=True)
                        return {
                            "messages": all_messages[:limit],
                            "source": "discord_guild",
                            "count": len(all_messages)
                        }
                else:
                    print(f"🔴 Guild channels fetch failed: {channels_res.status_code}")

            # ── CASE 3: no guild/channel specified — try ALL user guilds ─────
            if bot_token and access_token and not guild_id and not channel_id:
                # Get user's guilds from Discord
                guilds_res = await client.get(
                    f"{DISCORD_API_BASE}/users/@me/guilds",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if guilds_res.status_code == 200:
                    user_guilds = guilds_res.json()
                    print(f"🔵 User has {len(user_guilds)} guilds, trying bot access...")

                    all_messages = []
                    for g in user_guilds[:5]:  # Check up to 5 guilds
                        g_id = g.get("id")
                        if not g_id:
                            continue

                        # Check if bot is in this guild
                        channels_res = await client.get(
                            f"{DISCORD_API_BASE}/guilds/{g_id}/channels",
                            headers={"Authorization": f"Bot {bot_token}"}
                        )
                        if channels_res.status_code != 200:
                            print(f"🔴 Bot not in guild {g.get('name', g_id)} or no access")
                            continue

                        channels = channels_res.json()
                        text_channels = [c for c in channels if c.get("type") == 0]
                        print(f"🔵 Bot in guild {g.get('name', g_id)} — {len(text_channels)} text channels")

                        for ch in text_channels[:2]:
                            msg_res = await client.get(
                                f"{DISCORD_API_BASE}/channels/{ch['id']}/messages?limit=10",
                                headers={"Authorization": f"Bot {bot_token}"}
                            )
                            if msg_res.status_code == 200:
                                msgs = msg_res.json()
                                for m in msgs:
                                    m["_channel_name"] = f"#{ch.get('name', 'unknown')} ({g.get('name', 'Server')})"
                                    m["_channel_type"] = "guild"
                                    m["_guild_name"] = g.get("name", "Server")
                                all_messages.extend(msgs)
                            else:
                                print(f"🔴 Msg fetch failed ch {ch['id']}: {msg_res.status_code}")

                    if all_messages:
                        all_messages.sort(key=lambda m: m.get("timestamp", ""), reverse=True)
                        return {
                            "messages": all_messages[:limit],
                            "source": "discord_multi_guild",
                            "count": len(all_messages),
                            "guilds_checked": len(user_guilds)
                        }

        # ── FALLBACK: mock data (for hackathon/demo) ─────────────────────
        print("🟡 Using mock message data")
        return {
            "messages": [
                {
                    "id": "1",
                    "content": "Hey, the sprint planning doc is ready for review!",
                    "timestamp": "2026-05-09T03:00:00+00:00",
                    "_channel_name": "Alex",
                    "_channel_type": "dm",
                    "author": {"username": "Alex", "id": "0001"}
                },
                {
                    "id": "2",
                    "content": "Production latency spiked by 34% — can you check?",
                    "timestamp": "2026-05-09T02:00:00+00:00",
                    "_channel_name": "Engineering Bot",
                    "_channel_type": "dm",
                    "author": {"username": "Engineering Bot", "id": "0002"}
                },
                {
                    "id": "3",
                    "content": "Don't forget — internship interview tomorrow at 10AM!",
                    "timestamp": "2026-05-09T01:00:00+00:00",
                    "_channel_name": "Sarah",
                    "_channel_type": "dm",
                    "author": {"username": "Sarah", "id": "0003"}
                },
            ],
            "source": "mock"
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"🔴 Discord messages error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# DISCONNECT
# =========================

@router.post("/disconnect/{uid}")
async def disconnect_discord(uid: str):

    try:

        from auth import db

        db.collection("users") \
            .document(uid) \
            .collection("connections") \
            .document("discord") \
            .delete()

        return {
            "success": True
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# BOT INVITE URL
# =========================

@router.get("/bot-invite")
async def get_bot_invite_url(guild_id: str = ""):
    """
    Generate a Discord bot invite URL.
    Users can open this to invite the bot to their server.
    """
    if not settings.DISCORD_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Discord client ID not configured")

    # Build URL manually to ensure correct encoding
    invite_url = f"{DISCORD_OAUTH_URL}?client_id={settings.DISCORD_CLIENT_ID}&permissions={BOT_PERMISSIONS}&scope=bot"

    if guild_id:
        invite_url += f"&guild_id={guild_id}"
        print(f"🔵 Bot invite URL for guild {guild_id}: {invite_url}")
    else:
        print(f"🔵 Generic bot invite URL: {invite_url}")

    return {
        "invite_url": invite_url,
        "permissions": BOT_PERMISSIONS,
        "scope": "bot",
        "guild_id": guild_id or None
    }