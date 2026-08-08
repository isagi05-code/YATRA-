# AI Itinerary Generator Endpoints
@app.post("/ai-itinerary")
def generate_ai_itinerary(destination: str, days: int, budget: float = 0):
    """Generate a real day-wise itinerary using Google Gemini Flash (free tier, REST)."""
    import json as _json
    import requests as _requests

    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured. Add it to backend/.env to enable AI itinerary generation."
        )

    # Model name is env-configurable so it can be swapped without a code change
    # when Google deprecates/retires a model generation.
    gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")

    budget_label = f"₹{int(budget):,}" if budget else "flexible"

    prompt = f"""You are a professional Indian travel planner. Generate a {days}-day itinerary for {destination} with a total budget of {budget_label}.

Return ONLY valid JSON — no markdown, no extra text, no code fences. Use this exact schema:
{{
  "destination": "<destination name>",
  "days": {days},
  "summary": "<one-sentence trip summary>",
  "estimated_budget": <total number in INR, integer>,
  "budget_breakdown": {{
    "accommodation": <integer>,
    "food": <integer>,
    "transport": <integer>,
    "activities": <integer>,
    "miscellaneous": <integer>
  }},
  "itinerary": [
    {{
      "day": 1,
      "title": "<theme or focus for the day>",
      "estimated_cost": <integer>,
      "activities": [
        {{ "time": "Morning",   "name": "<activity name>", "description": "<1-2 sentence description>" }},
        {{ "time": "Afternoon", "name": "<activity name>", "description": "<1-2 sentence description>" }},
        {{ "time": "Evening",   "name": "<activity name>", "description": "<1-2 sentence description>" }}
      ]
    }}
  ],
  "tips": "<2-3 practical travel tips, semicolon-separated>",
  "best_time_to_visit": "<season or months>"
}}

Generate exactly {days} day objects in the itinerary array. Keep descriptions practical and specific to {destination}."""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{gemini_model}:generateContent?key={gemini_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json"
        }
    }

    try:
        resp = _requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        candidates = resp.json().get("candidates", [])
        if not candidates:
            raise HTTPException(status_code=500, detail="Gemini returned no candidates.")
        raw = candidates[0]["content"]["parts"][0]["text"].strip()
        # Strip markdown code fences if model still wraps output
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw
            raw = raw.rsplit("```", 1)[0].strip()
        data = _json.loads(raw)
        return data
    except _json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"AI returned malformed JSON: {exc}")
    except _requests.HTTPError as exc:
        detail = str(exc)
        try:
            detail = resp.json().get("error", {}).get("message", detail)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Gemini API error (model={gemini_model}): {detail}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {exc}")