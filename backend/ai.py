"""
ai.py — Gemini AI summarization & task extraction for NeuroFlow
POST /ai/digest  — accepts messages + emails + events, returns summary + tasks
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
import json
from config import settings

router = APIRouter()


class Message(BaseModel):
    author: Optional[str] = ""
    content: Optional[str] = ""
    timestamp: Optional[str] = ""
    channel: Optional[str] = ""


class Email(BaseModel):
    subject: Optional[str] = ""
    from_: Optional[str] = ""
    snippet: Optional[str] = ""
    date: Optional[str] = ""
    unread: Optional[bool] = False


class CalendarEvent(BaseModel):
    summary: Optional[str] = ""
    start: Optional[str] = ""
    location: Optional[str] = ""


class DigestRequest(BaseModel):
    messages: List[Message] = []
    emails: List[Email] = []
    events: List[CalendarEvent] = []


class Task(BaseModel):
    text: str
    source: str
    priority: str  # "high" | "medium" | "low"


class DigestResponse(BaseModel):
    summary: str
    tasks: List[Task]
    highlights: List[str]


def _build_prompt(req: DigestRequest) -> str:
    parts = ["You are an AI assistant for NeuroFlow. Analyze the user's messages, emails, and calendar events below.\n"]

    if req.messages:
        parts.append("=== DISCORD MESSAGES ===")
        for m in req.messages[:20]:
            parts.append(f"- [{m.timestamp or ''}] @{m.author}: {m.content}")

    if req.emails:
        parts.append("\n=== GMAIL EMAILS ===")
        for e in req.emails[:15]:
            parts.append(f"- [{e.date or ''}] From: {e.from_} | Subject: {e.subject} | Preview: {e.snippet}")

    if req.events:
        parts.append("\n=== UPCOMING CALENDAR EVENTS ===")
        for ev in req.events[:10]:
            parts.append(f"- {ev.summary} at {ev.start}" + (f" @ {ev.location}" if ev.location else ""))

    parts.append("""
Based on ALL of the above data, respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "summary": "A concise 2-3 sentence overview of what's happening today across all services",
  "highlights": [
    "Most important item 1",
    "Most important item 2",
    "Most important item 3"
  ],
  "tasks": [
    { "text": "Action item extracted from messages/emails", "source": "Gmail/Discord/Calendar", "priority": "high" },
    { "text": "Another task", "source": "Discord", "priority": "medium" }
  ]
}

Rules:
- summary: plain language, no emojis
- highlights: up to 5 bullet points of the most urgent/important things
- tasks: extract REAL actionable items from the content (things that need to be done), up to 8 tasks
- priority must be exactly: "high", "medium", or "low"
- If no data, summary should say "No messages or emails connected yet."
""")
    return "\n".join(parts)


def _call_gemini_api(prompt: str, model: str = "gemini-1.5-flash-002") -> str:
    """Call Gemini REST API directly"""
    # Ensure model name has 'models/' prefix if not already present
    model_path = model if model.startswith("models/") else f"models/{model}"
    url = f"https://generativelanguage.googleapis.com/v1beta/{model_path}:generateContent"
    params = {"key": settings.GEMINI_API_KEY}
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
        }
    }
    
    response = requests.post(url, params=params, json=payload)
    
    if response.status_code != 200:
        print(f"🔴 API Error: {response.status_code} - {response.text}")
        raise Exception(f"API Error {response.status_code}: {response.text}")
    
    result = response.json()
    
    # Extract text from response
    if "candidates" in result and len(result["candidates"]) > 0:
        candidate = result["candidates"][0]
        if "content" in candidate and "parts" in candidate["content"]:
            text = candidate["content"]["parts"][0].get("text", "")
            return text.strip()
    
    raise Exception("No content in response")


@router.post("/digest", response_model=DigestResponse)
async def generate_digest(req: DigestRequest):
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
        raise HTTPException(status_code=503, detail="Gemini API key not configured. Add GEMINI_API_KEY to backend/.env")

    # Try models in order (newest first for best results)
    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-001",
        "gemini-2.0-flash-lite-001",
    ]
    
    last_error = None
    prompt = _build_prompt(req)
    
    for model_name in models_to_try:
        try:
            print(f"🟡 Trying model: {model_name}")
            text = _call_gemini_api(prompt, model_name)
            
            # Strip markdown code fences
            text = text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                # Remove first line (```json or ```) and last line (```)
                lines = lines[1:] if lines[0].startswith("```") else lines
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                text = "\n".join(lines).strip()
            
            data = json.loads(text)
            
            tasks = [
                Task(
                    text=t.get("text", ""),
                    source=t.get("source", "Unknown"),
                    priority=t.get("priority", "medium"),
                )
                for t in data.get("tasks", [])
            ]
            
            print(f"✅ Model {model_name} worked!")
            return DigestResponse(
                summary=data.get("summary", ""),
                highlights=data.get("highlights", []),
                tasks=tasks,
            )
            
        except Exception as e:
            last_error = str(e)
            print(f"🔴 Model {model_name} failed: {last_error}")
            continue
    
    # All models failed
    raise HTTPException(status_code=500, detail=f"Gemini error: {last_error}")


@router.get("/models")
async def list_models():
    """List available Gemini models (debug)"""
    url = "https://generativelanguage.googleapis.com/v1beta/models"
    params = {"key": settings.GEMINI_API_KEY}
    
    try:
        res = requests.get(url, params=params)
        return res.json()
    except Exception as e:
        return {"error": str(e)}
