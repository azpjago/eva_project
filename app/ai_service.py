"""Thin wrapper around the Gemini API (google-genai SDK).

Kept isolated so swapping providers (e.g. adding Groq as a fallback,
per the brief) later only means changing this file.
"""

import logging
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

from app.prompts import build_chat_system_prompt, build_recommendation_prompt
from app.schemas import ChatMessage, EvaResult

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# Inisialisasi client Gemini secara aman
_client = genai.Client(api_key=API_KEY) if API_KEY else None


def _get_client() -> genai.Client:
    """Helper internal untuk memastikan Client terinisialisasi sebelum dipanggil."""
    if _client is None:
        raise ValueError(
            "API Key Gemini belum terkonfigurasi. Pastikan GEMINI_API_KEY terisi di file .env"
        )
    return _client


def generate_recommendation_narrative(eva_result: EvaResult) -> str:
    """Menghasilkan narasi rekomendasi keputusan bisnis berdasarkan kalkulasi EVA."""
    client = _get_client()
    prompt = build_recommendation_prompt(eva_result)

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.4),
        )
        if response.text:
            return response.text.strip()
        return "Tidak dapat menghasilkan rekomendasi (respons AI kosong atau terblokir filter)."
    
    except Exception as e:
        logger.error(f"Error pada generate_recommendation_narrative: {e}", exc_info=True)
        return f"Gagal membuat rekomendasi bisnis: {str(e)}"


def chat_reply(message: str, history: list[ChatMessage], eva_context: EvaResult | None) -> str:
    """Mengelola balasan chat interaktif dengan menyisipkan riwayat pesan dan instruksi sistem."""
    client = _get_client()
    system_instruction = build_chat_system_prompt(eva_context)

    # Convert history ke format SDK. Map role 'assistant' menjadi 'model' sesuai standar Gemini SDK.
    contents = []
    for h in history:
        role = "model" if h.role in ["assistant", "model"] else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=h.content)]))

    # Tambahkan pesan terbaru dari user
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.5,
            ),
        )
        if response.text:
            return response.text.strip()
        return "Maaf, AI tidak memberikan respon (respons kosong)."

    except Exception as e:
        logger.error(f"Error pada chat_reply: {e}", exc_info=True)
        return f"Terjadi kesalahan koneksi ke AI: {str(e)}"

def _coerce_to_string(val, default=""):
    """Ubah nilai apa pun menjadi string yang aman untuk ditampilkan."""
    if val is None:
        return default
    if isinstance(val, str):
        return val.strip() or default
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, dict):
        # Coba gabungkan value dari dict
        parts = []
        for k, v in val.items():
            if isinstance(v, str) and v.strip():
                parts.append(v.strip())
            elif isinstance(v, (int, float)):
                parts.append(str(v))
        return " ".join(parts) if parts else default
    if isinstance(val, list):
        parts = [_coerce_to_string(x) for x in val]
        return " ".join([p for p in parts if p]) or default
    return str(val) or default
    
def analyze_ratio_trend(data_tahun: list, ratios: list) -> dict:
    """
    Menganalisis SEMUA rasio produktivitas sekaligus menggunakan Gemini AI.
    Return format:
    {
      "ratio_id": {
        "short": "1-2 kalimat",
        "detailed": "3-5 kalimat analisis",
        "recommendations": ["saran 1", "saran 2", ...],
        "trend": "naik" | "turun" | "stabil",
        "status": "positif" | "warning" | "negatif"
      }
    }
    """
    import json as _json

    # Fallback default (if-else sederhana) jika AI gagal
    def build_fallback():
        out = {}
        for r in ratios:
            values = r.get("values", [])
            if len(values) < 2:
                out[r["id"]] = {
                    "short": "Data tidak cukup untuk analisis.",
                    "detailed": "Dibutuhkan minimal 2 tahun data untuk analisis tren.",
                    "recommendations": ["Tambahkan data tahun berikutnya."],
                    "trend": "stabil",
                    "status": "warning",
                }
                continue
            first, last = values[0], values[-1]
            if last > first:
                trend, status = "naik", "positif"
                short = f"Rasio meningkat dari {first:.2f} ke {last:.2f}. Indikasi peningkatan efisiensi."
            elif last < first:
                trend, status = "turun", "warning"
                short = f"Rasio menurun dari {first:.2f} ke {last:.2f}. Perlu evaluasi strategi."
            else:
                trend, status = "stabil", "positif"
                short = f"Rasio stabil di {first:.2f}. Pertahankan kinerja."
            out[r["id"]] = {
                "short": short,
                "detailed": short + " Analisis detail membutuhkan AI yang aktif.",
                "recommendations": [],
                "trend": trend,
                "status": status,
            }
        return out

    # Pastikan client AI tersedia
    try:
        client = _get_client()
    except Exception as e:
        logger.warning(f"AI client tidak tersedia, pakai fallback: {e}")
        return build_fallback()

    # Susun prompt ringkas
    prompt_data = []
    for r in ratios:
        prompt_data.append({
            "id": r["id"],
            "label": r["label"],
            "satuan": r.get("satuan", ""),
            "deskripsi": r.get("deskripsi", ""),
            "tahun": r.get("years", []),
            "nilai": [round(v, 4) for v in r.get("values", [])],
            "growth_persen": [round(g, 2) for g in r.get("growth", [])],
        })

    prompt = f"""Anda adalah analis produktivitas senior untuk Kementerian Ketenagakerjaan Indonesia.

Berikut adalah data rasio produktivitas perusahaan lintas tahun:

{_json.dumps(prompt_data, ensure_ascii=False, indent=2)}

TUGAS:
Untuk SETIAP rasio di atas, berikan analisis singkat, analisis mendetail, dan saran perbaikan.
Fokus pada: tren (naik/turun/stabil), penyebab potensial, dampak bagi produktivitas, dan rekomendasi aksi nyata.

FORMAT OUTPUT (HARUS JSON VALID, tanpa markdown code fence):
{{
  "ratio_id": {{
    "short": "1-2 kalimat singkat untuk ditampilkan di tabel (maks 120 karakter)",
    "detailed": "3-5 kalimat analisis mendalam, sebutkan angka spesifik, penyebab, dan dampak",
    "recommendations": [
      "Saran aksi nyata 1",
      "Saran aksi nyata 2",
      "Saran aksi nyata 3"
    ],
    "trend": "naik" | "turun" | "stabil",
    "status": "positif" | "warning" | "negatif"
  }}
}}

Aturan:
- Gunakan Bahasa Indonesia profesional.
- Jika rasio menurun, status = "warning" atau "negatif" (sesuai besarnya penurunan).
- Jika rasio meningkat/stabil, status = "positif".
- Sertakan angka spesifik dari data.
- Jangan mengarang data yang tidak ada.
- Output HANYA JSON, tanpa penjelasan tambahan di luar JSON.
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                response_mime_type="application/json",  # paksa JSON
            ),
        )
        text = (response.text or "").strip()
        # Bersihkan jika masih ada code fence
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].lstrip()
        # Cari JSON object pertama
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start:end + 1]

        parsed = _json.loads(text)
        # Validasi minimal
        if not isinstance(parsed, dict):
            raise ValueError("AI tidak mengembalikan dict")

        # Isi default untuk ratio yang mungkin tidak ada
        fallback = build_fallback()
        for rid, fb in fallback.items():
            if rid not in parsed:
                parsed[rid] = fb
            else:
                # Pastikan field lengkap
                p = parsed[rid]
                p.setdefault("short", fb["short"])
                p.setdefault("detailed", p.get("short", fb["short"]))
                p.setdefault("recommendations", [])
                p.setdefault("trend", fb["trend"])
                p.setdefault("status", fb["status"])

        logger.info("Analisis rasio AI berhasil di-generate.")
        return parsed

    except Exception as e:
        logger.error(f"Error pada analyze_ratio_trend: {e}", exc_info=True)
        return build_fallback()