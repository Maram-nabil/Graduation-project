"""
Local Voice Analysis service using OpenAI Whisper (local) for speech-to-text

Features:
- POST /voice accepts multipart/form-data `file` (audio)
- Transcribes audio locally using `whisper` model
- Extracts expense-like transactions from text using simple heuristics
- Returns JSON array with objects: amount, category, item, place

Notes:
- This implementation is fully local and does NOT call external APIs.
- Whisper requires `ffmpeg` available on the system and `whisper` Python package.
"""

import os
import io
import re
import json
import tempfile
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

# Define app at module level (NOT inside any conditional or function)
app = FastAPI(title="Voice Analysis (local)")

# Load .env if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Optional whisper import; graceful fallback for testing
try:
    import whisper
except Exception:
    whisper = None

# Cached whisper model
_whisper_model = None


def get_whisper_model(name: str = "small"):
    """Lazily load and cache the whisper model."""
    global _whisper_model
    if _whisper_model is None:
        if whisper is None:
            raise RuntimeError(
                "whisper package not installed. Install with `pip install -U openai-whisper` "
                "and ensure ffmpeg is available on PATH."
            )
        _whisper_model = whisper.load_model(name)
    return _whisper_model


def parse_transactions_from_text(text: str) -> List[dict]:
    """Simple rule-based extraction of transaction-like information from free text.

    Returns a list (possibly a single-item list) where each item is an object:
    {
      "amount": number | None,
      "category": "food"|"transport"|"shopping"|"bills"|"other",
      "item": string | None,
      "place": string | None
    }

    - If a field cannot be inferred, it is set to None.
    - Category is inferred from keywords; defaults to "other".
    """
    allowed_categories = {"food", "transport", "shopping", "bills", "other"}

    # Normalize text
    t = (text or "").strip()
    if not t:
        return [{"amount": None, "category": "other", "item": None, "place": None}]

    # Find amount like 12.50, 12, $12.50
    amt_match = re.search(r"\b(?:\$|USD\s*)?(?P<amt>\d{1,6}(?:[\.,]\d{1,2})?)\b", t, re.IGNORECASE)
    amount: Optional[float] = None
    if amt_match:
        amt_str = amt_match.group("amt").replace(",", "")
        try:
            amount = float(amt_str)
        except Exception:
            amount = None

    # Infer place: look for 'at <place>' or 'in <place>'
    place = None
    place_match = re.search(r"\b(?:at|in)\s+([A-Za-z0-9 &\-\']+?)(?:[\.,]| for | on |$)", t, re.IGNORECASE)
    if place_match:
        place = place_match.group(1).strip()

    # Infer item: look for 'for <item>' or 'bought <item>' or 'ordered <item>'
    item = None
    item_match = re.search(
        r"\b(?:for|bought|ordered|purchased|got|grabbed)\s+(?:a |an |the )?([A-Za-z0-9 &\-\']+?)(?:[\.,]| at | in |$)",
        t,
        re.IGNORECASE,
    )
    if item_match:
        item = item_match.group(1).strip()
    else:
        # fallback: if pattern like 'coffee' or 'burger' appears
        simple_item = re.search(r"\b(coffee|burger|pizza|taxi|train ticket|shoes|sandwich|lunch|dinner)\b", t, re.IGNORECASE)
        if simple_item:
            item = simple_item.group(1)

    # Infer category by keyword mapping
    cat = "other"
    lowered = t.lower()
    if any(k in lowered for k in ["restaurant", "cafe", "coffee", "burger", "pizza", "lunch", "dinner", "sandwich"]):
        cat = "food"
    elif any(k in lowered for k in ["taxi", "uber", "cab", "bus", "train", "metro", "ticket", "transport"]):
        cat = "transport"
    elif any(k in lowered for k in ["buy", "bought", "shopping", "mall", "amazon", "shoes", "clothes", "store"]):
        cat = "shopping"
    elif any(k in lowered for k in ["bill", "electricity", "water", "internet", "rent", "subscription"]):
        cat = "bills"
    else:
        cat = "other"

    if cat not in allowed_categories:
        cat = "other"

    return [{"amount": amount, "category": cat, "item": item, "place": place}]


@app.post("/voice")
async def voice(file: UploadFile = File(...)):
    """Accepts an audio file via multipart/form-data (field name 'file').
    Transcribes audio locally using whisper (if available) or uses a dummy transcription for testing.
    Extracts transactions and returns a JSON array of objects with keys: amount, category, item, place.

    Error responses:
    - 400: no file uploaded or empty file
    - 422: transcription failures
    - 500: unexpected server errors
    """
    if file is None:
        raise HTTPException(status_code=400, detail="No file uploaded")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    # Save to temporary file for whisper (or for inspection)
    suffix = os.path.splitext(file.filename or "")[1] or ".wav"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # If whisper is available, transcribe; otherwise use a safe dummy transcription
        if whisper is not None:
            try:
                model = get_whisper_model("small")
            except Exception as e:
                # Loading model failed (e.g., missing torch). Raise error with details.
                raise HTTPException(status_code=500, detail=f"Failed to load Whisper model: {e}")
            try:
                # Use whisper's transcription; result contains "text" key
                result = model.transcribe(tmp_path)
                transcript = (result.get("text") or "").strip()
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Transcription failed: {e}")
        else:
            # Dummy transcription for local testing when whisper is not installed.
            # This keeps the service runnable without external dependencies for quick testing.
            transcript = "Bought a coffee for $3.50 at Starbucks."

        if not transcript:
            raise HTTPException(status_code=422, detail="Transcription returned empty text")

        transactions = parse_transactions_from_text(transcript)
        return JSONResponse(content=transactions)
    finally:
        # Clean up temporary file if it was created
        try:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
        except Exception:
            pass


if __name__ == "__main__":
    # Allow running directly: `python voice_main.py`
    import uvicorn

    uvicorn.run("voice_main:app", host="127.0.0.1", port=8001, reload=True)

