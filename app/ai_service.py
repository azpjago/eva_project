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