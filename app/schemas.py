"""Pydantic models for request & response bodies."""

from pydantic import BaseModel, Field
from datetime import datetime

# Tambahkan pada app/schemas.py
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str

class FinancialInput(BaseModel):
    """Raw financial figures uploaded/entered by the user.

    Matches the columns mentioned in the brief: EBIT, Tarif Pajak,
    Total Utang, Ekuitas, WACC.
    """

    company_name: str = Field(..., examples=["PT Contoh Sejahtera"])
    period: str = Field(..., examples=["Q1 2026"])
    ebit: float = Field(..., description="Earnings Before Interest & Tax (Rupiah)")
    tax_rate: float = Field(..., ge=0, le=1, description="Tarif pajak, mis. 0.22 untuk 22%")
    invested_capital: float = Field(..., description="Total modal yang diinvestasikan (Rupiah)")
    wacc: float = Field(..., ge=0, le=1, description="Weighted Average Cost of Capital, mis. 0.10 untuk 10%")


class EvaResult(BaseModel):
    """Server-calculated EVA breakdown — this is ground truth, never left to the LLM."""

    company_name: str
    period: str
    nopat: float
    capital_charge: float
    eva: float
    status: str  # "positif" | "impas" | "negatif"


class RecommendationResponse(BaseModel):
    eva_result: EvaResult
    fokus_rekomendasi: str
    aksi_produktivitas: str
    narasi_ai: str


class ChatMessage(BaseModel):
    role: str  # "user" | "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    eva_context: EvaResult | None = Field(
        default=None,
        description="Hasil EVA yang sedang dibahas, kalau ada — supaya AI menjawab dengan konteks angka yang benar.",
    )


class ChatResponse(BaseModel):
    reply: str
    history: list[ChatMessage]

class EvaRecordBase(BaseModel):
    year_title: str
    raw_data: str
    nilai_tambah: float

class EvaRecordCreate(EvaRecordBase):
    pass

class EvaRecordResponse(EvaRecordBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class DashboardContext(BaseModel):
    period: str
    nilai_tambah: float
    total_investasi: float

class DashboardRecommendation(BaseModel):
    status: str
    fokus_rekomendasi: str
    aksi_produktivitas: str
    narasi_ai: str

class ChatMsgSend(BaseModel):
    content: str
    period_context: str = ""
    nilai_tambah_context: float = 0.0
    investasi_context: float = 0.0

class ChatMsgResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True