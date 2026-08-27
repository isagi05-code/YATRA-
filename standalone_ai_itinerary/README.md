# Standalone AI Travel Itinerary Planner 🌍✈️

A self-contained, independent tool for generating comprehensive day-wise travel itineraries using Google Gemini AI.

---

## 🚀 How to Run

### 1. Direct Python CLI (Command Line)
Generate an itinerary directly from terminal:
```bash
export GEMINI_API_KEY="your_api_key_here"

# Simple run
python standalone_ai_itinerary.py --dest "Goa" --days 5 --budget 35000

# Save output to JSON file
python standalone_ai_itinerary.py --dest "Kedarnath" --days 7 --output kedarnath.json
```

### 2. Standalone Web Server
Run the local FastAPI server to serve the standalone UI:
```bash
python standalone_ai_itinerary.py --server --port 8080
```
Open **http://localhost:8080** in your browser.

### 3. Open Single-File HTML Directly
Simply open `index.html` in any web browser and input your Gemini API Key in the form field.

### 4. Use as a Python Library
```python
from standalone_ai_itinerary import generate_itinerary

itinerary = generate_itinerary(
    destination="Rajasthan",
    days=8,
    budget=80000,
    api_key="your_api_key"
)

print(itinerary["summary"])
for day in itinerary["itinerary"]:
    print(f"Day {day['day']}: {day['title']}")
```
