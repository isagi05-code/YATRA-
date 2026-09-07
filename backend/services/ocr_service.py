"""Multimodal AI Vision OCR service for high-speed receipt and bill extraction.

Engineered for sub 2-3s parallel execution, in-memory PIL image optimization,
and strict zero-fallback policy.
"""
import io
import os
import json
import re
import time
import asyncio
from typing import Dict, Any, Tuple
from PIL import Image, ImageOps

# Default to gemini-3.5-flash-lite or gemini-flash-latest for ultra-fast, sub 2-4s multimodal extraction
DEFAULT_MODEL = "gemini-3.5-flash-lite"
FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.6-flash"]


def get_gemini_model() -> str:
    """Dynamically retrieve GEMINI_MODEL, reloading from .env if updated."""
    model = os.environ.get("GEMINI_MODEL", "").strip()
    try:
        from pathlib import Path
        for env_path in [Path(__file__).resolve().parents[2] / ".env", Path(__file__).resolve().parents[1] / ".env"]:
            if env_path.exists():
                for raw_line in env_path.read_text(encoding="utf-8").splitlines():
                    line = raw_line.strip()
                    if line.startswith("GEMINI_MODEL=") or line.startswith("GEMINI_MODEL ="):
                        _, _, val = line.partition("=")
                        val = val.split("#")[0].strip()
                        if val:
                            model = val
                            os.environ["GEMINI_MODEL"] = val
                            break
    except Exception:
        pass
    return model or DEFAULT_MODEL


def get_gemini_api_key() -> str:
    """Dynamically retrieve GEMINI_API_KEY, reloading from .env if updated."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    try:
        from pathlib import Path
        # Look in project root .env and backend/.env
        for env_path in [Path(__file__).resolve().parents[2] / ".env", Path(__file__).resolve().parents[1] / ".env"]:
            if env_path.exists():
                for raw_line in env_path.read_text(encoding="utf-8").splitlines():
                    line = raw_line.strip()
                    if line.startswith("GEMINI_API_KEY=") or line.startswith("GEMINI_API_KEY ="):
                        _, _, val = line.partition("=")
                        val = val.split("#")[0].strip()
                        if val:
                            key = val
                            os.environ["GEMINI_API_KEY"] = val
                            break
    except Exception:
        pass
    return key


def optimize_receipt_image(file_bytes: bytes, max_dim: int = 1200, quality: int = 80) -> Tuple[bytes, str, Tuple[int, int]]:
    """In-memory image preprocessing & normalization.
    
    - Validates image integrity using PIL
    - Auto-orients image based on EXIF metadata
    - Downsamples dimensions to max_dim (preserving aspect ratio) to keep transmission payloads sub-200KB
    - Converts color profile to RGB and re-encodes as optimized JPEG
    
    Returns:
        (optimized_bytes, mime_type, (width, height))
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img = ImageOps.exif_transpose(img)
    except Exception as e:
        raise ValueError(f"Invalid or corrupted image format: {str(e)}")

    orig_w, orig_h = img.size
    
    # Downsample if exceeding max dimension
    if max(orig_w, orig_h) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    
    # Ensure RGB
    if img.mode in ("RGBA", "P", "LA"):
        rgb_img = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "RGBA":
            rgb_img.paste(img, mask=img.split()[3])
        else:
            rgb_img.paste(img)
        img = rgb_img
    elif img.mode != "RGB":
        img = img.convert("RGB")
    
    out_buf = io.BytesIO()
    img.save(out_buf, format="JPEG", quality=quality, optimize=True)
    optimized_bytes = out_buf.getvalue()
    
    return optimized_bytes, "image/jpeg", img.size


EXTRACTION_PROMPT = """You are an enterprise AI OCR engine specialized in extracting receipts, tax invoices, and bills for travel, fuel, stay, food, and fleet expenses.

Analyze the image carefully and extract all information into a single valid JSON object following this exact structure:
{
  "raw_text": "<verbatim transcribed text visible on the bill/receipt>",
  "merchant": {
    "name": "<merchant/vendor business name>",
    "branch_or_station": "<station, outlet, or location name if mentioned, otherwise null>",
    "gstin": "<GSTIN or Tax identification number if present, otherwise null>",
    "phone": "<phone/contact number if present, otherwise null>",
    "address": "<address if present, otherwise null>"
  },
  "invoice_metadata": {
    "invoice_number": "<bill/invoice/receipt number if found, otherwise null>",
    "date": "<YYYY-MM-DD format if date found, otherwise null>",
    "time": "<HH:MM:SS format if time found, otherwise null>",
    "currency": "INR"
  },
  "line_items": [
    {
      "description": "<item or service description>",
      "quantity": <number or null>,
      "unit_price": <number or null>,
      "total": <number>
    }
  ],
  "financials": {
    "subtotal": <subtotal number or null>,
    "cgst": <cgst number or null>,
    "sgst": <sgst number or null>,
    "total_tax": <total tax/gst number or null>,
    "discount": <discount number or null>,
    "total_amount": <total final amount as float, strictly required>
  },
  "payment": {
    "method": "<UPI | Cash | Card | Bank Transfer | Fuel Card | FASTag | Unknown>",
    "reference_id": "<UPI transaction ID / UTR / Auth code if visible, otherwise null>"
  },
  "category_hint": "<Fuel | Stay | Food | Toll | Vehicle Maintenance | Salary | Miscellaneous>",
  "confidence_score": <float between 0.85 and 1.0 depending on legibility>
}

CRITICAL INSTRUCTIONS:
1. Return ONLY the raw JSON object. Do not include markdown code blocks, backticks (```), or explanatory text.
2. If total_amount cannot be determined, inspect subtotal or line item sums to infer the final billed total.
3. Classify category_hint accurately based on the merchant and items (e.g. Petrol/Diesel -> Fuel, Hotel/Resort -> Stay, Restaurant/Cafe -> Food, Plaza/FASTag -> Toll, Garage/Workshop -> Vehicle Maintenance).
4. Extract exact numbers as numeric floats, not strings.
"""


def clean_json_response(text: str) -> Dict[str, Any]:
    """Parse JSON string from AI response, stripping code blocks or enclosing wrappers."""
    cleaned = text.strip()
    # Remove markdown code block fences if returned
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    
    cleaned = cleaned.strip()
    return json.loads(cleaned)


async def extract_receipt_multimodal(file_bytes: bytes, filename: str, timeout_seconds: float = 60.0) -> Dict[str, Any]:
    """Perform asynchronous multimodal AI extraction on a single receipt image.
    
    Zero-fallback to mock: raises explicit exceptions on API failure, timeout, or parsing failure.
    Includes automated fallback across available Gemini Flash models if a specific model is sunset.
    """
    t_start = time.perf_counter()
    
    # Step 1: In-memory image optimization (< 150ms)
    opt_bytes, mime_type, dimensions = optimize_receipt_image(file_bytes)
    t_prep = time.perf_counter() - t_start

    # Step 2: AI Multimodal Inference
    api_key = get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in .env. Real AI OCR extraction requires a valid API key (no fallbacks allowed).")
    
    preferred_model = get_gemini_model()
    # Deduplicate candidate models maintaining priority order
    candidate_models = [preferred_model] + [m for m in FALLBACK_MODELS if m != preferred_model]

    loop = asyncio.get_running_loop()

    def _sync_call() -> Tuple[str, str]:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        # Prepare image content part
        image_part = types.Part.from_bytes(
            data=opt_bytes,
            mime_type=mime_type,
        )

        last_error = None
        for target_model in candidate_models:
            try:
                response = client.models.generate_content(
                    model=target_model,
                    contents=[
                        EXTRACTION_PROMPT,
                        image_part
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        response_mime_type="application/json"
                    )
                )
                return response.text, target_model
            except Exception as e:
                last_error = e
                # Attempt next fallback model in candidate list
                continue

        raise last_error or RuntimeError("Multimodal extraction failed across all candidate models")

    try:
        response_text, used_model = await asyncio.wait_for(
            loop.run_in_executor(None, _sync_call),
            timeout=timeout_seconds
        )
    except asyncio.TimeoutError:
        raise TimeoutError(f"AI OCR extraction for '{filename}' timed out after {timeout_seconds}s. Breached SLA.")
    except Exception as e:
        raise RuntimeError(f"Multimodal AI Vision extraction failed for '{filename}': {str(e)}")

    # Step 3: Parse and validate JSON
    try:
        raw_data = clean_json_response(response_text)
    except Exception as e:
        raise ValueError(f"Failed to parse structured JSON from OCR response for '{filename}': {str(e)}\nRaw Response: {response_text[:300]}")

    t_total = time.perf_counter() - t_start
    raw_data["_meta"] = {
        "filename": filename,
        "prep_latency_sec": round(t_prep, 3),
        "total_latency_sec": round(t_total, 3),
        "dimensions": dimensions,
        "model": used_model
    }

    return raw_data
