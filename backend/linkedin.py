"""
linkedin.py — LinkedIn OAuth & profile/posts fetching for NeuroFlow
GET  /linkedin/install     — OAuth install URL
GET  /linkedin/callback    — OAuth callback
GET  /linkedin/status/{uid} — check connection status
GET  /linkedin/posts/{uid}  — fetch user's recent LinkedIn posts/activity
POST /linkedin/disconnect/{uid} — disconnect
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from config import settings
from firebase_admin import firestore
import httpx
import urllib.parse

router = APIRouter()

# Simple in-memory cache for status checks (30 second TTL)
status_cache = {}

def is_cache_valid(uid):
    if uid not in status_cache:
        return False
    return (datetime.utcnow() - status_cache[uid]["time"]).seconds < 30

def get_cache(uid):
    return status_cache.get(uid, {}).get("data")

def set_cache(uid, data):
    status_cache[uid] = {"data": data, "time": datetime.utcnow()}

def get_db():
    from auth import db
    if db is None:
        raise HTTPException(
            status_code=500, 
            detail="Firestore not initialized. Check your Firebase environment variables (FIREBASE_PRIVATE_KEY, etc.) in Railway."
        )
    return db

# =========================


# =========================
# OAUTH INSTALL
# =========================

@router.get("/install")
def linkedin_install(uid: str):
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(status_code=500, detail="LinkedIn Client ID not configured")

    # Requires "Sign In with LinkedIn using OpenID Connect" product enabled in your LinkedIn Developer App.
    # Go to: https://www.linkedin.com/developers/apps -> your app -> Products tab -> add it.
    scope = "openid profile email"

    params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "scope": scope,
        "state": uid,
    })
    url = f"https://www.linkedin.com/oauth/v2/authorization?{params}"
    return RedirectResponse(url)



# =========================
# OAUTH CALLBACK
# =========================

@router.get("/callback")
async def linkedin_callback(
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
):
    uid = state

    # Handle OAuth errors (user cancelled, access denied, etc.)
    if error:
        error_msg = error_description or error
        return HTMLResponse(content=f"""
            <html>
            <head><title>LinkedIn Error</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;
                         font-family:sans-serif;background:#0a0a1a;color:#fff;">
                <div style="text-align:center;">
                    <h2 style="color:#ef4444;">Connection Failed</h2>
                    <p style="color:#94a3b8;">{error_msg}</p>
                    <p style="color:#64748b;font-size:0.85rem;">You can close this window.</p>
                    <script>
                        if (window.opener) {{
                            window.opener.postMessage({{ type: 'LINKEDIN_ERROR', error: '{error_msg}' }}, '*');
                        }}
                        setTimeout(() => window.close(), 3000);
                    </script>
                </div>
            </body>
            </html>
        """)

    if not code:
        raise HTTPException(status_code=400, detail="Authorization code missing from LinkedIn callback.")

    print(f"🔵 LinkedIn Callback: Received code for UID: {uid}")
    if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
        print("🔴 LinkedIn Error: Credentials not configured")
        raise HTTPException(status_code=500, detail="LinkedIn credentials not configured")

    # Exchange code for access token
    print(f"🔵 LinkedIn: Exchanging code with redirect_uri: {settings.LINKEDIN_REDIRECT_URI}")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            token_resp_raw = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=15.0
            )
            token_resp = token_resp_raw.json()
        except Exception as e:
            print(f"🔴 LinkedIn Error during token exchange: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")

    if "access_token" not in token_resp:
        print(f"🔴 LinkedIn token exchange failed: {token_resp}")
        raise HTTPException(status_code=400, detail=token_resp.get("error_description", "OAuth failed"))

    access_token = token_resp["access_token"]

    # --- Fetch profile: try /v2/me first (works with r_basicprofile),
    #     then fall back to OpenID /userinfo (requires openid product) ---
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Try the current v2/me endpoint
        me_resp = await client.get(
            "https://api.linkedin.com/v2/me",
            headers={**auth_headers, "X-Restli-Protocol-Version": "2.0.0"},
            timeout=10.0
        )

        linkedin_id = ""
        name = ""
        email = ""
        picture = ""

        if me_resp.status_code == 200:
            me = me_resp.json()
            linkedin_id = me.get("id", "")
            fn = me.get("firstName", {}).get("localized", {})
            ln = me.get("lastName", {}).get("localized", {})
            name = f"{list(fn.values())[0] if fn else ''} {list(ln.values())[0] if ln else ''}".strip()
            pic_data = me.get("profilePicture", {}).get("displayImage~", {}).get("elements", [])
            if pic_data:
                identifiers = pic_data[-1].get("identifiers", [])
                if identifiers:
                    picture = identifiers[0].get("identifier", "")
        else:
            # Fallback: try OpenID Connect userinfo endpoint
            userinfo_resp = await client.get("https://api.linkedin.com/v2/userinfo", headers=auth_headers, timeout=10.0)
            if userinfo_resp.status_code == 200:
                profile = userinfo_resp.json()
                linkedin_id = profile.get("sub", "")
                name = profile.get("name", "")
                email = profile.get("email", "")
                picture = profile.get("picture", "")

        # Try to get email separately if we have it via userinfo scope
        if not email:
            email_resp = await client.get(
                "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
                headers=auth_headers,
                timeout=10.0
            )
            if email_resp.status_code == 200:
                elements = email_resp.json().get("elements", [])
                if elements:
                    email = elements[0].get("handle~", {}).get("emailAddress", "")

    print(f"✅ LinkedIn connected for user {uid} (LinkedIn ID: {linkedin_id})")

    # Store in Firestore with retry logic
    db = get_db()
    if db:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                li_ref = db.collection("users").document(uid).collection("connections").document("linkedin")
                li_ref.set({
                    "access_token": access_token,
                    "linkedin_id": linkedin_id,
                    "name": name,
                    "email": email,
                    "picture": picture,
                    "connected": True,
                    "connected_at": firestore.SERVER_TIMESTAMP,
                }, merge=True)
                print(f"✅ LinkedIn saved to Firestore on attempt {attempt + 1}")
                break
            except Exception as e:
                print(f"🔴 LinkedIn Firestore Error (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    raise HTTPException(status_code=500, detail=f"Failed to save connection after retries: {str(e)}")
                import time
                time.sleep(1)

    return HTMLResponse(content=f"""
        <html>
        <head><title>LinkedIn Connected!</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;
                     font-family:sans-serif;background:#0a0a1a;color:#fff;">
            <div style="text-align:center;">
                <h2 style="color:#0A66C2;">✓ LinkedIn Connected!</h2>
                <p style="color:#94a3b8;">Welcome, {name}! You can close this window.</p>
                <script>
                    if (window.opener) {{
                        window.opener.postMessage({{ type: 'LINKEDIN_CONNECTED', uid: '{uid}' }}, '*');
                    }}
                    setTimeout(() => window.close(), 1500);
                </script>
            </div>
        </body>
        </html>
    """)


# =========================
# GET LINKEDIN STATUS
# =========================

@router.get("/status/{uid}")
async def linkedin_status(uid: str):
    # Check cache first
    if is_cache_valid(uid):
        return get_cache(uid)

    db = get_db()
    if not db:
        result = {"connected": False}
        set_cache(uid, result)
        return result
    try:
        doc = db.collection("users").document(uid).collection("connections").document("linkedin").get()
        if not doc.exists:
            result = {"connected": False}
            set_cache(uid, result)
            return result

        data = doc.to_dict()
        result = {
            "connected": data.get("connected", False),
            "profile": {
                "linkedin_id": data.get("linkedin_id"),
                "name": data.get("name"),
                "email": data.get("email"),
                "picture": data.get("picture"),
            },
        }
        set_cache(uid, result)
        return result
    except Exception as e:
        print(f"🔴 LinkedIn status error: {e}")
        return {"connected": False}


# =========================
# FETCH LINKEDIN POSTS / ACTIVITY
# =========================

@router.get("/posts/{uid}")
async def get_linkedin_posts(uid: str, limit: int = 10):
    """Fetch recent LinkedIn posts/shares for the user"""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        doc = db.collection("users").document(uid).collection("connections").document("linkedin").get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="LinkedIn not connected")

        data = doc.to_dict()
        token = data.get("access_token")
        linkedin_id = data.get("linkedin_id")
        
        if not token:
            raise HTTPException(status_code=400, detail="No LinkedIn token found")

        headers = {"Authorization": f"Bearer {token}"}

        # Try to fetch posts using the UGC Posts API (requires r_member_social scope)
        posts_resp = requests.get(
            f"https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:{linkedin_id})&count={limit}",
            headers={**headers, "X-Restli-Protocol-Version": "2.0.0"},
        )

        posts = []
        posts_unavailable = False
        unavailable_reason = ""

        if posts_resp.status_code == 200:
            raw = posts_resp.json().get("elements", [])
            for p in raw:
                content = p.get("specificContent", {}).get("com.linkedin.ugc.ShareContent", {})
                text_block = content.get("shareCommentary", {}).get("text", "")
                created = p.get("created", {}).get("time", 0)
                posts.append({
                    "id": p.get("id", ""),
                    "text": text_block[:300] if text_block else "(no text)",
                    "timestamp": created,
                    "url": f"https://www.linkedin.com/feed/update/{p.get('id', '')}",
                    "platform": "LinkedIn",
                })
        else:
            # Post fetching requires r_member_social — a restricted LinkedIn Partner permission.
            # This is expected for standard developer apps; just mark unavailable cleanly.
            print(f"🟡 LinkedIn posts unavailable (status {posts_resp.status_code}) — r_member_social not granted")
            posts_unavailable = True
            unavailable_reason = "Post activity requires LinkedIn Partner API access (r_member_social)."

        return {
            "posts": posts[:limit],
            "count": len(posts),
            "posts_unavailable": posts_unavailable,
            "unavailable_reason": unavailable_reason,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"🔴 LinkedIn posts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# DISCONNECT LINKEDIN
# =========================

@router.post("/disconnect/{uid}")
async def disconnect_linkedin(uid: str):
    db = get_db()
    if not db:
        return {"success": True}
    try:
        db.collection("users").document(uid).collection("connections").document("linkedin").delete()
        return {"success": True}
    except Exception as e:
        print(f"🔴 Disconnect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
