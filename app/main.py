from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.ai_service import chat_reply, generate_recommendation_narrative
from app.eva_calculator import calculate_eva
from app.prompts import RECOMMENDATION_MATRIX
from app.schemas import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    EvaResult,
    FinancialInput,
    RecommendationResponse,
)

app = FastAPI(
    title="EVA Analysis & AI Recommendation API",
    description="Backend API untuk kalkulasi Economic Value Added dan rekomendasi AI produktivitas ketenagakerjaan.",
    version="1.0.0",
)

# Longgarkan CORS untuk development; batasi ke domain frontend saat production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def root():
    """Mengarahkan (redirect) otomatis halaman utama langsung ke Swagger UI /docs."""
    return RedirectResponse(url="/docs")


@app.get("/health")
def health() -> dict:
    """Endpoint untuk pengecekan status keaktifan server."""
    return {"status": "ok", "service": "EVA Analysis & AI Recommendation API"}


@app.post("/api/eva/calculate", response_model=EvaResult)
def calculate(data: FinancialInput) -> EvaResult:
    """Hitung EVA murni (tanpa AI) — dipakai saat user upload/input data baru."""
    return calculate_eva(data)


@app.post("/api/ai/recommend", response_model=RecommendationResponse)
def recommend(data: FinancialInput) -> RecommendationResponse:
    """Hitung EVA lalu minta AI menulis narasi rekomendasi preskriptif."""
    eva_result = calculate_eva(data)
    matrix = RECOMMENDATION_MATRIX[eva_result.status]

    try:
        narasi = generate_recommendation_narrative(eva_result)
    except Exception as exc:  # noqa: BLE001 — surface a clean error to the client
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    return RecommendationResponse(
        eva_result=eva_result,
        fokus_rekomendasi=matrix["fokus"],
        aksi_produktivitas=matrix["aksi"],
        narasi_ai=narasi,
    )


@app.post("/api/ai/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """Dialog bebas dengan AI, opsional dengan konteks hasil EVA yang sedang dibahas."""
    try:
        reply = chat_reply(req.message, req.history, req.eva_context)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    # Menggunakan objek ChatMessage agar tipe data riwayat konsisten dengan Pydantic Schema
    updated_history = req.history + [
        ChatMessage(role="user", content=req.message),
        ChatMessage(role="model", content=reply),
    ]
    return ChatResponse(reply=reply, history=updated_history)