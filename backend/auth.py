from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from config import settings
import firebase_admin
import os
from firebase_admin import credentials, auth, firestore

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Firebase Admin Init ---
def initialize_firebase():
    global db
    try:
        # 1. Try environment variables FIRST (works on Vercel)
        private_key = settings.FIREBASE_PRIVATE_KEY
        if private_key:
            # Handle escaped newlines in env var
            private_key = private_key.replace("\\n", "\n")
            
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": settings.FIREBASE_CLIENT_ID,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL}"
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print(f"✅ Firebase Admin initialized from environment variables (Project: {settings.FIREBASE_PROJECT_ID})")
        else:
            # 2. Fallback to serviceAccountKey.json file (local dev)
            script_dir = os.path.dirname(os.path.abspath(__file__))
            service_key_path = os.path.join(script_dir, "serviceAccountKey.json")
            if os.path.exists(service_key_path):
                cred = credentials.Certificate(service_key_path)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin initialized from serviceAccountKey.json")
            else:
                print("🔴 Firebase Error: No credentials found (FIREBASE_PRIVATE_KEY is missing)")
                return None
        
        return firestore.client()
    except Exception as e:
        print(f"Firebase init error: {e}")
        return None

db = initialize_firebase()


# --- Models ---
class SignupData(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class TokenData(BaseModel):
    id_token: str


class ForgotPasswordData(BaseModel):
    email: str


# --- Signup: Backend creates user + Firestore + sends verification ---
@router.post("/signup")
async def signup(data: SignupData):
    try:
        user = auth.create_user(
            email=data.email,
            password=data.password,
            display_name=data.name or "",
            email_verified=False
        )

        if db:
            db.collection("users").document(user.uid).set({
                "uid": user.uid,
                "email": data.email,
                "display_name": data.name or "",
                "email_verified": False,
                "created_at": firestore.SERVER_TIMESTAMP,
                "auth_provider": "email_password"
            })

        auth.generate_email_verification_link(data.email)

        return {
            "success": True,
            "uid": user.uid,
            "email": user.email,
            "message": "Account created. Please verify your email."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Verify Token: Frontend sends ID token after client-side login ---
@router.post("/verify-token")
async def verify_token(data: TokenData):
    try:
        decoded = auth.verify_id_token(data.id_token)
        uid = decoded["uid"]

        # Get user from Firebase Auth
        user = auth.get_user(uid)

        if db:
            user_doc = db.collection("users").document(uid).get()

            if not user_doc.exists:
                # Create Firestore doc if missing (e.g., Google signin)
                db.collection("users").document(uid).set({
                    "uid": uid,
                    "email": user.email,
                    "display_name": user.display_name or "",
                    "email_verified": user.email_verified,
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "auth_provider": "google" if user.provider_data and any(p.provider_id == "google.com" for p in user.provider_data) else "email_password"
                })
            elif user.email_verified:
                # Update verification status
                db.collection("users").document(uid).update({
                    "email_verified": True,
                    "verified_at": firestore.SERVER_TIMESTAMP
                })

        # Get user data from Firestore
        user_doc = db.collection("users").document(uid).get() if db else None
        user_data = user_doc.to_dict() if user_doc and user_doc.exists else {}

        return {
            "valid": True,
            "uid": uid,
            "email": decoded.get("email"),
            "email_verified": user.email_verified,
            "can_access": user.email_verified,
            "user_data": user_data
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# --- Get User Data ---
@router.get("/me/{uid}")
async def get_user(uid: str):
    try:
        user_doc = db.collection("users").document(uid).get() if db else None
        if not user_doc or not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        return {"user": user_doc.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Forgot Password ---
@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordData):
    try:
        link = auth.generate_password_reset_link(data.email)
        return {"message": "Password reset link generated", "reset_link": link}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Firebase Config for Frontend ---
@router.get("/firebase-config")
async def get_firebase_config():
    return {
        "apiKey": settings.FIREBASE_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN,
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID,
        "measurementId": settings.FIREBASE_MEASUREMENT_ID
    }
