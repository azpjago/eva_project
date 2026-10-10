"""Pydantic models for request & response bodies."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from datetime import datetime
import json as _json
from pydantic import BaseModel, Field, field_validator

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

class RasioDialogSend(BaseModel):
    ratio_id: str
    years_key: str
    content: str
    # Konteks rasio dikirim dari frontend agar AI tahu apa yang sedang dibahas
    ratio_label: Optional[str] = None
    ratio_deskripsi: Optional[str] = None
    years: Optional[list] = None
    values: Optional[list] = None
    analysis_summary: Optional[str] = None


class RasioDialogResponse(BaseModel):
    id: int
    ratio_id: str
    years_key: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


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
    bonus_persen: float = 0.0

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

# ============================================================
# SCHEMAS: PIC Hierarkis + Temuan + History
# ============================================================

# ---------- PIC ----------
class PICCreate(BaseModel):
    nama_jabatan: str
    departemen: Optional[str] = None
    parent_id: Optional[int] = None
    level: Optional[int] = 1
    urutan: Optional[int] = 0
    nama_orang: Optional[str] = None
    email: Optional[str] = None
    telepon: Optional[str] = None
    foto_base64: Optional[str] = None
    kategori_tanggung_jawab: Optional[list] = []
    is_active: Optional[bool] = True


class PICUpdate(BaseModel):
    nama_jabatan: Optional[str] = None
    departemen: Optional[str] = None
    parent_id: Optional[int] = None
    level: Optional[int] = None
    urutan: Optional[int] = None
    nama_orang: Optional[str] = None
    email: Optional[str] = None
    telepon: Optional[str] = None
    foto_base64: Optional[str] = None
    kategori_tanggung_jawab: Optional[list] = None
    is_active: Optional[bool] = None


from pydantic import field_validator

class PICResponse(BaseModel):
    id: int
    user_id: int
    parent_id: Optional[int] = None
    level: int
    urutan: int
    nama_jabatan: str
    departemen: Optional[str] = None
    nama_orang: Optional[str] = None
    email: Optional[str] = None
    telepon: Optional[str] = None
    foto_base64: Optional[str] = None
    kategori_tanggung_jawab: list = []
    is_active: bool = True
    is_template: bool = True
    created_at: datetime
    updated_at: datetime

    @field_validator('kategori_tanggung_jawab', mode='before')
    @classmethod
    def parse_kategori(cls, v):
        """Parse JSON string → list. Handle juga kalau sudah list."""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = _json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except (ValueError, TypeError):
                return []
        return []

    class Config:
        from_attributes = True


# ---------- TEMUAN ----------
class TemuanCreate(BaseModel):
    tahun: str
    judul: str
    deskripsi: str
    kategori: str
    prioritas: str = "sedang"
    data_pendukung: Optional[dict] = {}
    dampak: Optional[str] = None
    rekomendasi: Optional[str] = None
    pic_id: Optional[int] = None
    status: str = "open"
    deadline: Optional[datetime] = None


class TemuanUpdate(BaseModel):
    judul: Optional[str] = None
    deskripsi: Optional[str] = None
    kategori: Optional[str] = None
    prioritas: Optional[str] = None
    dampak: Optional[str] = None
    rekomendasi: Optional[str] = None
    pic_id: Optional[int] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None


class TemuanStatusUpdate(BaseModel):
    status: str
    catatan: Optional[str] = None


class TemuanResponse(BaseModel):
    id: int
    user_id: int
    tahun: str
    judul: str
    deskripsi: str
    kategori: str
    prioritas: str
    data_pendukung: dict = {}
    dampak: Optional[str] = None
    rekomendasi: Optional[str] = None
    recommended_methods: list = []
    pic_id: Optional[int] = None
    status: str
    deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('data_pendukung', mode='before')
    @classmethod
    def parse_data_pendukung(cls, v):
        """Parse JSON string → dict. Handle kalau sudah dict."""
        if v is None:
            return {}
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                parsed = _json.loads(v)
                return parsed if isinstance(parsed, dict) else {}
            except (ValueError, TypeError):
                return {}
        return {}

    class Config:
        from_attributes = True

class TemuanHistoryResponse(BaseModel):
    id: int
    temuan_id: int
    status_lama: Optional[str] = None
    status_baru: str
    catatan: Optional[str] = None
    changed_by: Optional[int] = None
    changed_at: datetime

    class Config:
        from_attributes = True


# ---------- REQUEST: ANALISIS TEMUAN ----------
class AnalyzeTemuanRequest(BaseModel):
    tahun_list: list = []        # kosong = semua tahun
    force_refresh: bool = False  # True = paksa re-call AI