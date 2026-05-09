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
import requests
import urllib.parse

router = APIRouter()

# Firestore client (reuse from auth.py initialization)
try:
    db = firestore.client()
except Exception:
    db = None


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

    if not uid or uid == "undefined":
        raise HTTPException(status_code=400, detail="User ID is missing. Please log in again.")

    if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="LinkedIn credentials not configured")

    # Exchange code for access token
    token_resp = requests.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    ).json()

    if "access_token" not in token_resp:
        raise HTTPException(status_code=400, detail=token_resp.get("error_description", "OAuth failed"))

    access_token = token_resp["access_token"]

    # --- Fetch profile: try /v2/me first (works with r_basicprofile),
    #     then fall back to OpenID /userinfo (requires openid product) ---
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # Try the current v2/me endpoint
    me_resp = requests.get(
        "https://api.linkedin.com/v2/me",
        headers={**auth_headers, "X-Restli-Protocol-Version": "2.0.0"},
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
        # Try to get profile picture
        pic_data = me.get("profilePicture", {}).get("displayImage~", {}).get("elements", [])
        if pic_data:
            identifiers = pic_data[-1].get("identifiers", [])
            if identifiers:
                picture = identifiers[0].get("identifier", "")
    else:
        # Fallback: try OpenID Connect userinfo endpoint
        userinfo_resp = requests.get("https://api.linkedin.com/v2/userinfo", headers=auth_headers)
        if userinfo_resp.status_code == 200:
            profile = userinfo_resp.json()
            linkedin_id = profile.get("sub", "")
            name = profile.get("name", "")
            email = profile.get("email", "")
            picture = profile.get("picture", "")
        else:
            print(f"🟡 LinkedIn: could not fetch profile (me={me_resp.status_code}, userinfo={userinfo_resp.status_code})")
            linkedin_id = ""
            name = "LinkedIn User"

    # Try to get email separately if we have it via userinfo scope
    if not email:
        email_resp = requests.get(
            "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
            headers=auth_headers,
        )
        if email_resp.status_code == 200:
            elements = email_resp.json().get("elements", [])
            if elements:
                email = elements[0].get("handle~", {}).get("emailAddress", "")

    print(f"✅ LinkedIn connected for user {uid} (LinkedIn ID: {linkedin_id})")

    # Store in Firestore
    if db:
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
        except Exception as e:
            print(f"🔴 Firestore Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to save connection")

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
    if not db:
        return {"connected": False}
    try:
        doc = db.collection("users").document(uid).collection("connections").document("linkedin").get()
        if not doc.exists:
            return {"connected": False}

        data = doc.to_dict()
        return {
            "connected": data.get("connected", False),
            "profile": {
                "linkedin_id": data.get("linkedin_id"),
                "name": data.get("name"),
                "email": data.get("email"),
                "picture": data.get("picture"),
            },
        }
    except Exception as e:
        print(f"🔴 LinkedIn status error: {e}")
        return {"connected": False}


# =========================
# FETCH LINKEDIN POSTS / ACTIVITY
# =========================

@router.get("/posts/{uid}")
async def get_linkedin_posts(uid: str, limit: int = 10):
    """Fetch recent LinkedIn posts/shares for the user"""
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
    if not db:
        return {"success": True}
    try:
        db.collection("users").document(uid).collection("connections").document("linkedin").delete()
        return {"success": True}
    except Exception as e:
        print(f"🔴 Disconnect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
