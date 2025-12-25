# Voice Analysis Service

This folder contains a dedicated FastAPI service for Voice Analysis implemented in `voice_main.py`.

Prerequisites

- Python 3.10+
- `GROQ_API_KEY` environment variable set to your Groq API key

Install

```bash
pip install -r Analysis/requirements.txt
```

Run (development)

Windows PowerShell:

```powershell
$env:GROQ_API_KEY="your_groq_api_key_here"
uvicorn Analysis.voice_main:app --host 127.0.0.1 --port 8001 --reload
```

Or POSIX (bash):

```bash
export GROQ_API_KEY="your_groq_api_key_here"
uvicorn Analysis.voice_main:app --host 127.0.0.1 --port 8001 --reload
```

Endpoint

- `POST /voice` — multipart/form-data; field name: `file` (the audio file). Returns JSON array with objects:

```json
[
  {
    "amount": number | null,
    "category": "food" | "transport" | "shopping" | "bills" | "other",
    "item": string | null,
    "place": string | null
  }
]
```

Example test (curl):

```bash
curl -X POST -F "file=@/path/to/audio.wav" http://127.0.0.1:8001/voice -H "Accept: application/json"
```

Notes

- The service is intentionally separate and runs on port `8001`.
- Do not modify other project files, OCR, or WebSocket code.
- The `GROQ_API_KEY` must be present in the environment when running the service.
