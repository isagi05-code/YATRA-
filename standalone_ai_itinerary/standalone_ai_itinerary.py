#!/usr/bin/env python3
"""
Standalone AI Itinerary Planner
================================
A completely self-contained AI-powered travel itinerary generator using Google Gemini.
Can be used independently of any platform or project:
  1. CLI Tool:         python standalone_ai_itinerary.py --dest "Goa" --days 5 --budget 30000
  2. Standalone Server: python standalone_ai_itinerary.py --server --port 8080
  3. Python Module:    from standalone_ai_itinerary import generate_itinerary
"""

import os
import sys
import json
import argparse
from typing import Optional, Dict, Any

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
    parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if os.path.exists(parent_env):
        load_dotenv(parent_env)
except Exception:
    pass


def generate_itinerary(
    destination: str,
    days: int = 5,
    budget: float = 0,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a day-wise itinerary using Google Gemini REST API.
    """
    gemini_key = (api_key or os.environ.get("GEMINI_API_KEY", "")).strip()
    if not gemini_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable "
            "or pass api_key to generate_itinerary()."
        )

    model_pref = preferred_model or os.environ.get("GEMINI_MODEL", "gemini-2.0-flash").strip()
    models_to_try = [model_pref, "gemini-2.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"]
    
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    budget_val = int(budget) if budget > 0 else days * 6000
    budget_label = f"₹{budget_val:,}"
    dest_clean = destination.strip().title()

    prompt = f"""You are an expert Indian and global travel planner with deep local knowledge. Generate a highly detailed, realistic {days}-day itinerary for {dest_clean} with a total budget of {budget_label}.

Return ONLY valid JSON — no markdown formatting, no code fences, no extra text. Use EXACTLY this schema:
{{
  "destination": "{dest_clean}",
  "days": {days},
  "summary": "<2-3 sentence vivid trip summary capturing the mood, highlights, and best experiences>",
  "estimated_budget": {budget_val},
  "budget_breakdown": {{
    "accommodation": <integer, ~35-40% of total>,
    "food": <integer, ~20-25% of total>,
    "transport": <integer, ~15-20% of total>,
    "activities_and_entry": <integer, ~10-15% of total>,
    "shopping_and_misc": <integer, ~5-10% of total>
  }},
  "accommodation_suggestion": {{
    "name": "<specific hotel or guesthouse name for {dest_clean}>",
    "area": "<locality or area in {dest_clean}>",
    "price_per_night": <integer in INR>,
    "type": "<Budget / Mid-range / Luxury>"
  }},
  "itinerary": [
    {{
      "day": 1,
      "title": "<thematic title for this day>",
      "theme": "<one-word theme: Heritage / Nature / Adventure / Spiritual / Leisure / Culture>",
      "estimated_cost": <integer daily cost in INR>,
      "highlights": ["<top attraction 1>", "<top attraction 2>", "<top attraction 3>"],
      "activities": [
        {{
          "time": "Morning",
          "time_slot": "07:00 - 10:00",
          "name": "<specific attraction or activity name>",
          "location": "<exact place name, neighbourhood, or landmark>",
          "description": "<2-3 sentences: what to do, what to see, why it's special>",
          "distance_from_base": "<X km from hotel/city center>",
          "entry_fee": "<₹XX per person or Free>",
          "duration": "<approx duration e.g. 2 hours>",
          "tips": "<1 practical insider tip>"
        }},
        {{
          "time": "Late Morning",
          "time_slot": "10:30 - 13:00",
          "name": "<specific attraction or activity name>",
          "location": "<exact place name>",
          "description": "<2-3 sentences>",
          "distance_from_base": "<X km>",
          "entry_fee": "<₹XX or Free>",
          "duration": "<approx duration>",
          "tips": "<1 practical tip>"
        }},
        {{
          "time": "Afternoon",
          "time_slot": "13:00 - 14:30",
          "name": "Lunch at <specific restaurant or cafe name>",
          "location": "<restaurant area or street name>",
          "description": "<what dishes to try, type of cuisine, ambiance>",
          "distance_from_base": "<X km>",
          "entry_fee": "₹<approx cost per person>",
          "duration": "1.5 hours",
          "tips": "<ordering tip or reservation advice>"
        }},
        {{
          "time": "Afternoon",
          "time_slot": "15:00 - 18:00",
          "name": "<specific afternoon attraction or activity>",
          "location": "<exact location>",
          "description": "<2-3 sentences>",
          "distance_from_base": "<X km>",
          "entry_fee": "<₹XX or Free>",
          "duration": "<approx duration>",
          "tips": "<1 practical tip>"
        }},
        {{
          "time": "Evening",
          "time_slot": "18:30 - 21:00",
          "name": "<specific evening experience or dinner spot>",
          "location": "<exact location>",
          "description": "<2-3 sentences capturing the evening atmosphere>",
          "distance_from_base": "<X km>",
          "entry_fee": "<₹XX or Free>",
          "duration": "<approx duration>",
          "tips": "<evening-specific tip>"
        }}
      ],
      "transport_for_day": {{
        "mode": "<Auto / Cab / Bus / Walk / Boat / Scooter>",
        "estimated_cost": "<₹XX for the day>",
        "notes": "<key transport detail or booking tip>"
      }},
      "meals_budget": "<₹XX estimated for all meals today>"
    }}
  ],
  "tips": [
    "<specific, actionable tip 1 for {dest_clean}>",
    "<specific tip 2 about local customs or etiquette>",
    "<specific tip 3 about safety or health>",
    "<specific tip 4 about best local experiences>",
    "<specific tip 5 about money-saving or booking>"
  ],
  "best_time_to_visit": "<specific months and reason>",
  "how_to_reach": {{
    "by_air": "<nearest airport and approx distance>",
    "by_train": "<nearest railway station and approx distance>",
    "by_road": "<road route from nearest major city>"
  }},
  "emergency_contacts": {{
    "police": "100",
    "ambulance": "108",
    "tourist_helpline": "1800-11-1363"
  }}
}}

RULES:
- Use REAL, SPECIFIC place names, restaurant names, and landmarks in {dest_clean}.
- Entry fees must be approximate realistic INR amounts or 'Free'.
- Generate exactly {days} day objects in the itinerary array.
- Budget breakdown integers must sum exactly to {budget_val}."""

    last_error = None
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.65,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json"
            }
        }
        try:
            resp = requests.post(url, json=payload, timeout=45)
            if resp.status_code == 200:
                candidates = resp.json().get("candidates", [])
                if candidates:
                    raw = candidates[0]["content"]["parts"][0]["text"].strip()
                    if raw.startswith("```"):
                        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
                        raw = raw.rsplit("```", 1)[0].strip()
                    data = json.loads(raw)
                    return data
            else:
                last_error = f"Model {model} returned HTTP {resp.status_code}: {resp.text[:200]}"
        except Exception as e:
            last_error = str(e)

    raise RuntimeError(f"Failed to generate itinerary. Last error: {last_error}")


def run_web_server(port: int = 8080):
    """Run a standalone web application server."""
    try:
        from fastapi import FastAPI, Query, HTTPException
        from fastapi.responses import HTMLResponse
        from fastapi.middleware.cors import CORSMiddleware
        import uvicorn
    except ImportError:
        print("To run the standalone server, install fastapi and uvicorn:")
        print("pip install fastapi uvicorn")
        sys.exit(1)

    app = FastAPI(title="Standalone AI Itinerary Planner", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/itinerary")
    def api_itinerary(destination: str = Query(...), days: int = Query(5), budget: float = Query(0)):
        try:
            return generate_itinerary(destination=destination, days=days, budget=budget)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/", response_class=HTMLResponse)
    def index():
        html_file = os.path.join(os.path.dirname(__file__), "index.html")
        if os.path.exists(html_file):
            with open(html_file, "r", encoding="utf-8") as f:
                return f.read()
        return "<h1>Standalone AI Itinerary Generator is running. Use /api/itinerary</h1>"

    print(f"\n🚀 Standalone AI Itinerary Web App running at: http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)


def main():
    parser = argparse.ArgumentParser(description="Standalone AI Travel Itinerary Planner")
    parser.add_argument("--dest", "-d", type=str, help="Destination name (e.g. 'Goa', 'Kedarnath', 'Jaipur')")
    parser.add_argument("--days", "-n", type=int, default=5, help="Number of trip days (default: 5)")
    parser.add_argument("--budget", "-b", type=float, default=0, help="Total trip budget in INR (optional)")
    parser.add_argument("--api-key", "-k", type=str, default="", help="Google Gemini API key (optional if GEMINI_API_KEY env is set)")
    parser.add_argument("--output", "-o", type=str, default="", help="Save output JSON to file")
    parser.add_argument("--server", "-s", action="store_true", help="Run standalone web server")
    parser.add_argument("--port", "-p", type=int, default=8080, help="Server port (default: 8080)")

    args = parser.parse_args()

    if args.server:
        run_web_server(port=args.port)
        return

    if not args.dest:
        print("Please provide a destination using --dest or run web server with --server.")
        print("Example: python standalone_ai_itinerary.py --dest 'Goa' --days 4 --budget 25000")
        parser.print_help()
        sys.exit(1)

    print(f"✈️ Generating {args.days}-day itinerary for {args.dest}...")
    try:
        data = generate_itinerary(
            destination=args.dest,
            days=args.days,
            budget=args.budget,
            api_key=args.api_key or None
        )
        output_str = json.dumps(data, indent=2, ensure_ascii=False)
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output_str)
            print(f"✅ Itinerary saved to {args.output}")
        else:
            print("\n" + output_str)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
