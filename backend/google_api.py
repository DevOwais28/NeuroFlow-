"""
Google OAuth2 Integration — Gmail + Google Calendar
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from config import settings
import httpx
from datetime import datetime, timezone

router = APIRouter()

# Simple in-memory cache for status checks (30 second TTL)
status_cache = {}

def is_cache_valid(uid):
    if uid not in status_cache:
        return False
    return (datetime.now(timezone.utc) - status_cache[uid]["time"]).seconds < 30

def get_cache(uid):
    return status_cache.get(uid, {}).get("data")

def set_cache(uid, data):
    status_cache[uid] = {"data": data, "time": datetime.now(timezone.utc)}

def get_db():
    from auth import db
    if db is None:
        raise HTTPException(
            status_code=500, 
            detail="Firestore not initialized. Check your Firebase environment variables (FIREBASE_PRIVATE_KEY, etc.) in Railway."
        )
    return db

# Google OAuth2 URLs
GOOGLE_AUTH_URL    = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL   = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GMAIL_API_URL      = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
CALENDAR_API_URL   = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

# Scopes — gmail.readonly + calendar.readonly
GOOGLE_SCOPES = (
    "openid email profile "
    "https://www.googleapis.com/auth/gmail.readonly "
    "https://www.googleapis.com/auth/calendar.readonly"
)

# =========================
# MODELS
# =========================

class GoogleLinkRequest(BaseModel):
    code: str
    uid: str
    redirect_uri: Optional[str] = None

# =========================
# HELPERS
# =========================

async def _refresh_access_token(refresh_token: str) -> Optional[str]:
    """Exchange a refresh token for a new access token."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            })
            if res.status_code == 200:
                return res.json().get("access_token")
    except Exception as e:
        print(f"🔴 Token refresh failed: {e}")
    return None


async def _get_valid_token(uid: str) -> Optional[str]:
    """Return a valid access token, refreshing if needed."""
    db = get_db()

    doc = db.collection("users").document(uid).collection("connections").document("google").get()
    if not doc.exists:
        return None

    data = doc.to_dict()
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")

    # Quick check — try using the current token
    async with httpx.AsyncClient(timeout=10.0) as client:
        test = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if test.status_code == 200:
            return access_token

    # Token expired — refresh it
    if refresh_token:
        new_token = await _refresh_access_token(refresh_token)
        if new_token:
            db.collection("users").document(uid).collection("connections").document("google").update({
                "access_token": new_token
            })
            return new_token

    return None

# =========================
# AUTH URL
# =========================

@router.get("/auth-url")
async def get_google_auth_url(uid: str):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google client ID not configured")

    from urllib.parse import urlencode
    params = {
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         GOOGLE_SCOPES,
        "state":         uid,
        "access_type":   "offline",
        "prompt":        "consent",
    }
    return {"auth_url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"}

# =========================
# CALLBACK
# =========================

@router.post("/callback")
async def google_callback(data: GoogleLinkRequest):
    print(f"🔵 Google callback called with uid={data.uid}, code={'***' if data.code else 'NONE'}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:

            # Use the redirect_uri from frontend if provided, otherwise fallback to settings
            redirect_uri = data.redirect_uri or settings.GOOGLE_REDIRECT_URI
            print(f"🔵 Using redirect_uri: {redirect_uri}")

            # Exchange code for tokens
            print(f"🔵 Google: Starting token exchange for UID: {data.uid}...")
            token_res = await client.post(
                GOOGLE_TOKEN_URL, 
                data={
                    "client_id":     settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "grant_type":    "authorization_code",
                    "code":          data.code,
                    "redirect_uri":  redirect_uri,
                },
                timeout=15.0
            )
            print(f"🔵 Google: Token exchange status: {token_res.status_code}")

            if token_res.status_code != 200:
                print(f"🔴 Google token exchange failed: {token_res.text}")
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_res.text}")

            token_data = token_res.json()
            print("🔵 Google: Successfully received tokens")
            access_token  = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")

            # Get user profile (with increased timeout)
            user_res = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=15.0
            )

            if user_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

            user_data = user_res.json()

        # Store in Firestore
        try:
            db = get_db()
            if db:
                print(f"🔵 Google: Saving credentials to Firestore for user: {data.uid}")
                db.collection("users").document(data.uid).collection("connections").document("google").set({
                    "access_token":  access_token,
                    "refresh_token": refresh_token,
                    "token_uri":     GOOGLE_TOKEN_URL,
                    "client_id":     settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "scopes":        token_data.get("scope", "").split(" "),
                    "connected_at":  datetime.now(timezone.utc).isoformat(),
                    "email":         user_data.get("email"),
                    "name":          user_data.get("name"),
                    "picture":       user_data.get("picture")
                }, merge=True)
                print("✅ Google: Firestore update successful")
            else:
                print(f"🔴 Firestore db not available")
                raise HTTPException(status_code=500, detail="Database not initialized")
        except Exception as db_error:
            print(f"🔴 Firestore error: {db_error}")
            import traceback
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
        return {
            "email":   user_data.get("email"),
            "name":    user_data.get("name"),
            "picture": user_data.get("picture"),
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"🔴 Google callback error: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# STATUS
# =========================

@router.get("/status/{uid}")
async def get_google_status(uid: str, refresh: bool = False):
    # Check cache first (skip if refresh requested)
    if not refresh and is_cache_valid(uid):
        return get_cache(uid)

    try:
        db = get_db()
        doc = db.collection("users").document(uid).collection("connections").document("google").get()

        if not doc.exists:
            result = {"connected": False, "email": None}
            set_cache(uid, result)
            return result

        data = doc.to_dict()
        result = {
            "connected": True,
            "email":     data.get("email"),
            "name":      data.get("name"),
            "picture":   data.get("picture"),
        }
        set_cache(uid, result)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# EMAILS (Gmail)
# =========================

@router.get("/emails/{uid}")
async def get_emails(uid: str, limit: int = 10):
    try:
        access_token = await _get_valid_token(uid)
        if not access_token:
            raise HTTPException(status_code=400, detail="Google not connected or token expired")

        async with httpx.AsyncClient(timeout=10.0) as client:

            # List message IDs
            list_res = await client.get(
                f"{GMAIL_API_URL}?maxResults={limit}&labelIds=INBOX",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if list_res.status_code != 200:
                print(f"🔴 Gmail list failed: {list_res.text}")
                raise HTTPException(status_code=400, detail="Failed to fetch emails")

            messages_list = list_res.json().get("messages", [])

            # Fetch each message's details
            email_details = []
            for msg in messages_list[:limit]:
                msg_res = await client.get(
                    f"{GMAIL_API_URL}/{msg['id']}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if msg_res.status_code == 200:
                    msg_data = msg_res.json()
                    hdrs = {h["name"]: h["value"] for h in msg_data.get("payload", {}).get("headers", [])}
                    email_details.append({
                        "id":       msg_data["id"],
                        "snippet":  msg_data.get("snippet", ""),
                        "subject":  hdrs.get("Subject", "(No Subject)"),
                        "from":     hdrs.get("From", "Unknown"),
                        "date":     hdrs.get("Date", ""),
                        "threadId": msg_data.get("threadId"),
                        "unread":   "UNREAD" in msg_data.get("labelIds", []),
                    })

        return {"emails": email_details, "count": len(email_details)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"🔴 Google callback exception: {str(e)}")
        # Include the actual error message to help debug
        raise HTTPException(status_code=500, detail=f"Google Callback Error: {str(e)}")

# =========================
# CALENDAR EVENTS
# =========================

@router.get("/events/{uid}")
async def get_calendar_events(uid: str, limit: int = 10):
    try:
        access_token = await _get_valid_token(uid)
        if not access_token:
            raise HTTPException(status_code=400, detail="Google not connected or token expired")

        # Fetch upcoming events from now
        now = datetime.now(timezone.utc).isoformat()

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                CALENDAR_API_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                params={
                    "maxResults":   limit,
                    "orderBy":      "startTime",
                    "singleEvents": "true",
                    "timeMin":      now,
                }
            )

            if res.status_code != 200:
                print(f"🔴 Calendar API failed: {res.text}")
                raise HTTPException(status_code=400, detail="Failed to fetch calendar events")

            events = res.json().get("items", [])

        # Normalise event shape
        normalised = []
        for e in events:
            start = e.get("start", {})
            normalised.append({
                "id":          e.get("id"),
                "summary":     e.get("summary", "(No Title)"),
                "description": e.get("description", ""),
                "start":       start.get("dateTime") or start.get("date"),
                "end":         (e.get("end") or {}).get("dateTime") or (e.get("end") or {}).get("date"),
                "location":    e.get("location", ""),
                "htmlLink":    e.get("htmlLink", ""),
                "allDay":      "date" in start and "dateTime" not in start,
            })

        return {"events": normalised, "count": len(normalised)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"🔴 Google callback exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Google Callback Error: {str(e)}")

# =========================
# DISCONNECT
# =========================

@router.post("/disconnect/{uid}")
async def disconnect_google(uid: str):
    try:
        db = get_db()
        db.collection("users").document(uid).collection("connections").document("google").delete()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
