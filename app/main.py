import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
from app.models import PIC, Temuan, TemuanHistory
from app.schemas import (
    PICCreate, PICUpdate, PICResponse,
)
from app.pic_template import PIC_TEMPLATE
import json as _json

from app.ai_service import chat_reply, generate_recommendation_narrative, ratio_dialog_reply
from app.database import Base, engine, get_db
from app.eva_calculator import calculate_eva
from app.models import User, EvaRecord, RasioDialog
from app.prompts import RECOMMENDATION_MATRIX
from app.schemas import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    EvaResult,
    FinancialInput,
    RecommendationResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
    EvaRecordCreate,
    EvaRecordResponse,
    RasioDialogSend,
    RasioDialogResponse,
)
from app.ai_service import analyze_temuan
from app.schemas import (
    TemuanCreate, TemuanUpdate, TemuanStatusUpdate, 
    TemuanResponse, TemuanHistoryResponse,
    AnalyzeTemuanRequest,
)
from app.security import create_access_token, hash_password, verify_password, SECRET_KEY, ALGORITHM

app = FastAPI(
    title="EVA Analysis & Recommendation API",
    description="Backend API untuk kalkulasi Economic Value Added dan rekomendasi EVA produktivitas perusahaan.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ===== BASE DIRECTORY =====
BASE_DIR = Path(__file__).resolve().parent.parent  # karena main.py di dalam folder app/

# ===== MOUNT STATIC FILES (TANPA CATCH-ALL) =====
# Mount folder dashboard untuk CSS, JS, dan aset lainnya
dashboard_path = BASE_DIR / "dashboard"
if dashboard_path.exists() and dashboard_path.is_dir():
    # Mount subfolder CSS dan JS secara terpisah agar path-nya sesuai
    css_path = dashboard_path / "css"
    if css_path.exists() and css_path.is_dir():
        app.mount("/css", StaticFiles(directory=str(css_path)), name="css")
    
    js_path = dashboard_path / "js"
    if js_path.exists() and js_path.is_dir():
        app.mount("/js", StaticFiles(directory=str(js_path)), name="js")
    
    # Mount root dashboard untuk index.html dan file lainnya (opsional)
    app.mount("/dashboard", StaticFiles(directory=str(dashboard_path), html=True), name="dashboard")

# Mount folder static (jika ada)
static_path = BASE_DIR / "static"
if static_path.exists() and static_path.is_dir():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# --- DEPENDENCY CEK TOKEN ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")
    except Exception:
        raise HTTPException(status_code=401, detail="Token tidak valid atau kedaluwarsa")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    return user

# ===== ROUTE HALAMAN UTAMA =====
@app.get("/", include_in_schema=False)
def read_index():
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "EVA AI Platform API"}

@app.get("/login", include_in_schema=False)
@app.get("/login.html", include_in_schema=False)
def read_login():
    login_path = BASE_DIR / "login.html"
    if login_path.exists():
        return FileResponse(login_path)
    raise HTTPException(status_code=404, detail="Login page not found")

@app.get("/register", include_in_schema=False)
@app.get("/register.html", include_in_schema=False)
def read_register():
    register_path = BASE_DIR / "register.html"
    if register_path.exists():
        return FileResponse(register_path)
    raise HTTPException(status_code=404, detail="Register page not found")

@app.get("/dashboard", include_in_schema=False)
def read_dashboard():
    """Halaman Dashboard - menggunakan index.html di folder dashboard"""
    dashboard_index = BASE_DIR / "dashboard" / "index.html"
    if dashboard_index.exists():
        return FileResponse(dashboard_index)
    
    fallback = BASE_DIR / "dashboard.html"
    if fallback.exists():
        return FileResponse(fallback)
    
    raise HTTPException(status_code=404, detail="Dashboard not found")

# ===== API ENDPOINTS (SEMUA ROUTE API DILETAKKAN DI SINI) =====
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "EVA Analysis & AI Recommendation API"}

@app.post("/api/eva/calculate", response_model=EvaResult)
def calculate(data: FinancialInput) -> EvaResult:
    return calculate_eva(data)

@app.post("/api/ai/recommend", response_model=RecommendationResponse)
def recommend(data: FinancialInput) -> RecommendationResponse:
    eva_result = calculate_eva(data)
    matrix = RECOMMENDATION_MATRIX[eva_result.status]
    try:
        narasi = generate_recommendation_narrative(eva_result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"EVA service error: {exc}") from exc
    return RecommendationResponse(
        eva_result=eva_result,
        fokus_rekomendasi=matrix["fokus"],
        aksi_produktivitas=matrix["aksi"],
        narasi_ai=narasi,
    )

@app.post("/api/ai/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    try:
        reply = chat_reply(req.message, req.history, req.eva_context)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"EVA service error: {exc}") from exc
    updated_history = req.history + [
        ChatMessage(role="user", content=req.message),
        ChatMessage(role="model", content=reply),
    ]
    return ChatResponse(reply=reply, history=updated_history)

# ===== AUTH ENDPOINTS =====
@app.post("/api/auth/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar.")
    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name or user_data.email.split('@')[0]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return TokenResponse(access_token=token, user_name=new_user.full_name)

@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email atau password salah.")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token, user_name=user.full_name)

# ===== EVA RECORDS ENDPOINTS =====
@app.post("/api/eva/save", response_model=list[EvaRecordResponse])
def save_eva_records(records: list[EvaRecordCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(EvaRecord).filter(EvaRecord.user_id == current_user.id).delete()
    
    saved_records = []
    for rec in records:
        new_record = EvaRecord(
            user_id=current_user.id,
            year_title=rec.year_title,
            raw_data=rec.raw_data,
            nilai_tambah=rec.nilai_tambah,
            bonus_persen=rec.bonus_persen or 0.0,
        )
        db.add(new_record)
        saved_records.append(new_record)
    
    db.commit()
    for r in saved_records:
        db.refresh(r)
        
    return saved_records

@app.get("/api/eva/history", response_model=list[EvaRecordResponse])
def get_eva_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(EvaRecord).filter(EvaRecord.user_id == current_user.id).all()
    return records

# ===== AI DASHBOARD & CHAT ENDPOINTS =====
from app.prompts import get_status_from_ratio
from app.schemas import DashboardContext, DashboardRecommendation, ChatMsgSend, ChatMsgResponse
from app.models import ChatMessage as DBChatMessage

@app.post("/api/ai/dashboard-recommend", response_model=DashboardRecommendation)
def get_dashboard_recommendation(data: DashboardContext, current_user: User = Depends(get_current_user)):
    status = get_status_from_ratio(data.nilai_tambah, data.total_investasi)
    matrix = RECOMMENDATION_MATRIX[status]
    
    dummy_eva = EvaResult(
        company_name="Perusahaan Pengguna",
        period=data.period,
        eva=data.nilai_tambah,
        status=status,
        nopat=0,
        invested_capital=data.total_investasi,
        wacc=0,
        capital_charge=0
    )
    
    try:
        narasi = generate_recommendation_narrative(dummy_eva)
    except Exception as e:
        narasi = "Sistem EVA sedang sibuk, mohon coba lagi nanti."

    return DashboardRecommendation(
        status=status,
        fokus_rekomendasi=matrix["fokus"],
        aksi_produktivitas=matrix["aksi"],
        narasi_ai=narasi
    )

@app.get("/api/ai/chat/history", response_model=list[ChatMsgResponse])
def get_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DBChatMessage).filter(DBChatMessage.user_id == current_user.id).order_by(DBChatMessage.created_at.asc()).all()

@app.delete("/api/ai/chat/clear")
def clear_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(DBChatMessage).filter(DBChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}

@app.post("/api/ai/chat/send", response_model=ChatMsgResponse)
def send_chat_message(req: ChatMsgSend, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_msg = DBChatMessage(user_id=current_user.id, role="user", content=req.content)
    db.add(user_msg)
    db.commit()

    db_history = db.query(DBChatMessage).filter(DBChatMessage.user_id == current_user.id).order_by(DBChatMessage.created_at.asc()).all()
    history_for_ai = [ChatMessage(role=h.role, content=h.content) for h in db_history[:-1]]

    status_eko = get_status_from_ratio(req.nilai_tambah_context, req.investasi_context)
    eva_ctx = EvaResult(
        company_name="Analisis Dashboard",
        period=req.period_context,
        eva=req.nilai_tambah_context,
        status=status_eko,
        nopat=0,
        invested_capital=req.investasi_context,
        wacc=0,
        capital_charge=0
    )

    try:
        ai_text = chat_reply(req.content, history_for_ai, eva_ctx)
    except Exception as e:
        ai_text = "Maaf, koneksi ke EVA sedang terganggu."

    ai_msg = DBChatMessage(user_id=current_user.id, role="model", content=ai_text)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    return ai_msg

@app.put("/api/ai/chat/edit/{msg_id}")
def edit_chat_message(msg_id: int, req: ChatMsgSend, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(DBChatMessage).filter(DBChatMessage.id == msg_id, DBChatMessage.user_id == current_user.id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    
    db.query(DBChatMessage).filter(DBChatMessage.user_id == current_user.id, DBChatMessage.created_at >= msg.created_at).delete()
    db.commit()

    return send_chat_message(req, db, current_user)

# ===== ENDPOINT ANALISIS RASIO PRODUKTIVITAS (BARU) =====
# Import tambahan (tidak mengubah yang sudah ada)
from typing import List, Dict, Any
from app.ai_service import analyze_ratio_trend  # Anda perlu tambahkan fungsi ini di ai_service.py

@app.post("/api/ai/analyze-ratio", response_model=Dict[str, Any])
def analyze_ratios(req: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """
    Menganalisis rasio produktivitas menggunakan EVA.
    Request body: {
        "data_tahun": [{"tahun": "2020", "nilaiTambah": 100, "penjualan": 200, ...}],
        "ratios": [{"id": "nilai_tambah_per_tenaga", "label": "...", "values": [...], "growth": [...], "years": [...]}]
    }
    Return: {"analyses": {"ratio_id": "analisis teks"}}
    """
    try:
        data_tahun = req.get("data_tahun", [])
        ratios = req.get("ratios", [])
        # Panggil fungsi analisis dari ai_service
        analyses = analyze_ratio_trend(data_tahun, ratios)
        return {"analyses": analyses}
    except Exception as e:
        # Fallback: analisis sederhana
        analyses = {}
        for r in ratios:
            values = r.get("values", [])
            if len(values) < 2:
                analyses[r["id"]] = "Data tidak cukup untuk analisis."
            else:
                first = values[0]
                last = values[-1]
                if last > first:
                    analyses[r["id"]] = "Meningkat. Indikasi positif, efisiensi meningkat."
                elif last < first:
                    analyses[r["id"]] = "Menurun. Perlu evaluasi untuk meningkatkan efisiensi."
                else:
                    analyses[r["id"]] = "Stabil. Pertahankan kinerja."
        return {"analyses": analyses}

# ===== ENDPOINT DIALOG AI PADA RASIO =====

@app.get("/api/rasio/dialog/{ratio_id}", response_model=list[RasioDialogResponse])
def list_rasio_dialog(
    ratio_id: str,
    years_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil riwayat dialog EVA untuk rasio tertentu."""
    return (
        db.query(RasioDialog)
        .filter(
            RasioDialog.user_id == current_user.id,
            RasioDialog.ratio_id == ratio_id,
            RasioDialog.years_key == years_key,
        )
        .order_by(RasioDialog.created_at.asc())
        .all()
    )


@app.post("/api/rasio/dialog", response_model=list[RasioDialogResponse])
def send_rasio_dialog(
    req: RasioDialogSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Simpan pesan user, panggil AI dengan konteks rasio, simpan balasan AI. Return [pesan_user, pesan_ai]."""
    # 1. Simpan pesan user
    user_msg = RasioDialog(
        user_id=current_user.id,
        ratio_id=req.ratio_id,
        years_key=req.years_key,
        role="user",
        content=req.content,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 2. Ambil riwayat sebelumnya
    db_history = (
        db.query(RasioDialog)
        .filter(
            RasioDialog.user_id == current_user.id,
            RasioDialog.ratio_id == req.ratio_id,
            RasioDialog.years_key == req.years_key,
        )
        .order_by(RasioDialog.created_at.asc())
        .all()
    )

    # Format untuk AI (exclude pesan user terakhir yang baru saja disimpan)
    history_for_ai = [
        {"role": h.role, "content": h.content}
        for h in db_history[:-1]
    ]

    # 3. Siapkan konteks rasio
    ratio_context = {
        "label": req.ratio_label or "Rasio",
        "deskripsi": req.ratio_deskripsi or "",
        "years": req.years or [],
        "values": req.values or [],
        "analysis_summary": req.analysis_summary or "",
    }

    # 4. Panggil AI
    try:
        ai_text = ratio_dialog_reply(req.content, history_for_ai, ratio_context)
    except Exception as e:
        ai_text = f"Maaf, EVA sedang tidak bisa dihubungi: {str(e)[:100]}"

    # 5. Simpan balasan AI
    ai_msg = RasioDialog(
        user_id=current_user.id,
        ratio_id=req.ratio_id,
        years_key=req.years_key,
        role="model",
        content=ai_text,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return [user_msg, ai_msg]


@app.delete("/api/rasio/dialog/{ratio_id}")
def clear_rasio_dialog(
    ratio_id: str,
    years_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus riwayat dialog untuk rasio & tahun tertentu."""
    db.query(RasioDialog).filter(
        RasioDialog.user_id == current_user.id,
        RasioDialog.ratio_id == ratio_id,
        RasioDialog.years_key == years_key,
    ).delete()
    db.commit()
    return {"message": "Riwayat dialog dihapus"}

# ============================================================
# ENDPOINT PIC (Person In Charge) — Hierarkis
# ============================================================

def _seed_pic_template(db: Session, user_id: int):
    """Generate struktur organisasi default untuk user."""
    created_ids = []
    
    for idx, (nama_jabatan, departemen, level, parent_idx, kategori, urutan) in enumerate(PIC_TEMPLATE):
        parent_id = None
        if parent_idx is not None and parent_idx < len(created_ids):
            parent_id = created_ids[parent_idx]
        
        pic = PIC(
            user_id=user_id,
            parent_id=parent_id,
            level=level,
            urutan=urutan,
            nama_jabatan=nama_jabatan,
            departemen=departemen,
            kategori_tanggung_jawab=_json.dumps(kategori),
            is_active=True,
            is_template=True,
        )
        db.add(pic)
        db.flush()  # untuk dapat id
        created_ids.append(pic.id)
    
    db.commit()
    return created_ids


@app.get("/api/pic", response_model=list[PICResponse])
def list_pic(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil semua PIC user. Auto-seed jika belum ada."""
    existing = db.query(PIC).filter(PIC.user_id == current_user.id).count()
    
    # Auto-seed jika user belum punya PIC
    if existing == 0:
        _seed_pic_template(db, current_user.id)
    
    pics = (
        db.query(PIC)
        .filter(PIC.user_id == current_user.id)
        .order_by(PIC.level.asc(), PIC.urutan.asc(), PIC.id.asc())
        .all()
    )
    return pics


@app.post("/api/pic", response_model=PICResponse)
def create_pic(
    data: PICCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tambah posisi PIC baru."""
    pic = PIC(
        user_id=current_user.id,
        parent_id=data.parent_id,
        level=data.level or 1,
        urutan=data.urutan or 0,
        nama_jabatan=data.nama_jabatan,
        departemen=data.departemen,
        nama_orang=data.nama_orang,
        email=data.email,
        telepon=data.telepon,
        foto_base64=data.foto_base64,
        kategori_tanggung_jawab=_json.dumps(data.kategori_tanggung_jawab or []),
        is_active=True,
        is_template=False,
    )
    db.add(pic)
    db.commit()
    db.refresh(pic)
    return pic


@app.put("/api/pic/{pic_id}", response_model=PICResponse)
def update_pic(
    pic_id: int,
    data: PICUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update data PIC."""
    pic = db.query(PIC).filter(
        PIC.id == pic_id,
        PIC.user_id == current_user.id,
    ).first()
    if not pic:
        raise HTTPException(status_code=404, detail="PIC tidak ditemukan")
    
    update_data = data.dict(exclude_unset=True)
    
    # Handle kategori_tanggung_jawab → JSON string
    if "kategori_tanggung_jawab" in update_data:
        update_data["kategori_tanggung_jawab"] = _json.dumps(
            update_data["kategori_tanggung_jawab"] or []
        )
    
    for key, value in update_data.items():
        setattr(pic, key, value)
    
    # Tandai sudah bukan template lagi
    pic.is_template = False
    
    db.commit()
    db.refresh(pic)
    return pic


@app.delete("/api/pic/{pic_id}")
def delete_pic(
    pic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus PIC. Anak-anaknya akan ikut terhapus (cascade manual)."""
    pic = db.query(PIC).filter(
        PIC.id == pic_id,
        PIC.user_id == current_user.id,
    ).first()
    if not pic:
        raise HTTPException(status_code=404, detail="PIC tidak ditemukan")
    
    # Kumpulkan semua descendant (BFS)
    to_delete = [pic.id]
    queue = [pic.id]
    while queue:
        parent = queue.pop(0)
        children = db.query(PIC).filter(
            PIC.parent_id == parent,
            PIC.user_id == current_user.id,
        ).all()
        for c in children:
            to_delete.append(c.id)
            queue.append(c.id)
    
    db.query(PIC).filter(PIC.id.in_(to_delete)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{len(to_delete)} PIC dihapus", "deleted_ids": to_delete}


@app.post("/api/pic/reset-template")
def reset_pic_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus semua PIC user lalu generate ulang dari template default."""
    db.query(PIC).filter(PIC.user_id == current_user.id).delete()
    db.commit()
    
    created_ids = _seed_pic_template(db, current_user.id)
    return {
        "message": f"Template berhasil di-reset. {len(created_ids)} posisi dibuat.",
        "total": len(created_ids),
    }


@app.get("/api/pic/categories")
def list_categories(current_user: User = Depends(get_current_user)):
    """Ambil daftar kategori standar untuk UI dropdown."""
    from app.pic_template import STANDARD_CATEGORIES
    return {"categories": STANDARD_CATEGORIES}

# ============================================================
# ENDPOINT TEMUAN & TINDAK LANJUT
# ============================================================

@app.get("/api/temuan", response_model=list[TemuanResponse])
def list_temuan(
    status: str = None,
    kategori: str = None,
    prioritas: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil semua temuan user dengan filter opsional."""
    query = db.query(Temuan).filter(Temuan.user_id == current_user.id)
    
    if status:
        query = query.filter(Temuan.status == status)
    if kategori:
        query = query.filter(Temuan.kategori == kategori)
    if prioritas:
        query = query.filter(Temuan.prioritas == prioritas)
    
    return query.order_by(Temuan.created_at.desc()).all()


@app.get("/api/temuan/{temuan_id}", response_model=TemuanResponse)
def get_temuan(
    temuan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil detail satu temuan."""
    temuan = db.query(Temuan).filter(
        Temuan.id == temuan_id,
        Temuan.user_id == current_user.id,
    ).first()
    if not temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
    return temuan


@app.post("/api/temuan", response_model=TemuanResponse)
def create_temuan(
    data: TemuanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Buat temuan baru."""
    temuan = Temuan(
        user_id=current_user.id,
        tahun=data.tahun,
        judul=data.judul,
        deskripsi=data.deskripsi,
        kategori=data.kategori,
        prioritas=data.prioritas,
        data_pendukung=_json.dumps(data.data_pendukung or {}),
        dampak=data.dampak,
        rekomendasi=data.rekomendasi,
        pic_id=data.pic_id,
        status=data.status or "open",
        deadline=data.deadline,
    )
    db.add(temuan)
    db.commit()
    db.refresh(temuan)
    return temuan


@app.put("/api/temuan/{temuan_id}", response_model=TemuanResponse)
def update_temuan(
    temuan_id: int,
    data: TemuanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update temuan."""
    temuan = db.query(Temuan).filter(
        Temuan.id == temuan_id,
        Temuan.user_id == current_user.id,
    ).first()
    if not temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(temuan, key, value)
    
    db.commit()
    db.refresh(temuan)
    return temuan


@app.delete("/api/temuan/{temuan_id}")
def delete_temuan(
    temuan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus temuan dan history-nya."""
    temuan = db.query(Temuan).filter(
        Temuan.id == temuan_id,
        Temuan.user_id == current_user.id,
    ).first()
    if not temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
    
    db.query(TemuanHistory).filter(TemuanHistory.temuan_id == temuan_id).delete()
    db.delete(temuan)
    db.commit()
    return {"message": "Temuan berhasil dihapus"}


@app.patch("/api/temuan/{temuan_id}/status")
def update_temuan_status(
    temuan_id: int,
    data: TemuanStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update status temuan + catat di history."""
    temuan = db.query(Temuan).filter(
        Temuan.id == temuan_id,
        Temuan.user_id == current_user.id,
    ).first()
    if not temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
    
    # Validasi status
    valid_status = ["open", "in_progress", "resolved", "on_hold"]
    if data.status not in valid_status:
        raise HTTPException(
            status_code=400, 
            detail=f"Status harus salah satu dari: {', '.join(valid_status)}"
        )
    
    status_lama = temuan.status
    temuan.status = data.status
    
    # Set resolved_at jika di-resolve
    if data.status == "resolved":
        temuan.resolved_at = datetime.utcnow()
    else:
        temuan.resolved_at = None
    
    # Log ke history
    history = TemuanHistory(
        temuan_id=temuan.id,
        status_lama=status_lama,
        status_baru=data.status,
        catatan=data.catatan,
        changed_by=current_user.id,
    )
    db.add(history)
    db.commit()
    db.refresh(temuan)
    
    return {"message": "Status berhasil diupdate", "temuan_id": temuan.id, "status": temuan.status}


@app.get("/api/temuan/{temuan_id}/history", response_model=list[TemuanHistoryResponse])
def get_temuan_history(
    temuan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil riwayat perubahan status temuan."""
    temuan = db.query(Temuan).filter(
        Temuan.id == temuan_id,
        Temuan.user_id == current_user.id,
    ).first()
    if not temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
    
    return (
        db.query(TemuanHistory)
        .filter(TemuanHistory.temuan_id == temuan_id)
        .order_by(TemuanHistory.changed_at.desc())
        .all()
    )


@app.post("/api/temuan/analyze")
def analyze_temuan_endpoint(
    req: AnalyzeTemuanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analisis semua data EVA user, hasilkan temuan, dan simpan ke database.
    Jika ada temuan baru, simpan. Jika judul sama & belum resolved, update.
    """
    # Ambil semua record EVA user
    records = db.query(EvaRecord).filter(EvaRecord.user_id == current_user.id).all()
    
    if not records:
        return {
            "message": "Belum ada data EVA. Silakan isi kalkulator terlebih dahulu.",
            "temuan_baru": 0,
            "temuan_updated": 0,
        }
    
    # Filter tahun jika ditentukan
    if req.tahun_list:
        records = [r for r in records if r.year_title in req.tahun_list]
    
    if len(records) < 2:
        return {
            "message": "Butuh minimal 2 tahun data untuk analisis.",
            "temuan_baru": 0,
            "temuan_updated": 0,
        }
    
    # Sort by tahun
    records.sort(key=lambda r: r.year_title)
    
    # Susun data untuk AI
    data_tahun = []
    for r in records:
        # Parse raw_data (list nilai input)
        try:
            raw = _json.loads(r.raw_data) if r.raw_data else []
        except:
            raw = []
        
        # Ambil nilai dari raw_data berdasarkan index field di form
        # Index sesuai urutan input di generateYearPanelHTML:
        # 0=Total Penjualan, 1=Jumlah Unit, 2=Harga Jual, 3=Pertumbuhan, 4=Penjualan Periode Sebelumnya,
        # 5-7=Biaya Tenaga Kerja, 8-11=Bahan Digunakan, 12-19=Overhead, 20-21=Bunga, 22-36=Biaya Admin,
        # 37-38=Penyusutan, 39-41=Pajak, 42-49=Aktiva, ... (index bisa beda)
        # Untuk aman, kita pakai nilai_tambah yang sudah tersimpan
        
        nilai_tambah = r.nilai_tambah or 0
        
        # Estimasi kasar nilai-nilai lain dari raw_data (jika index konsisten)
        def safe_get(idx, default=0):
            try:
                return float(raw[idx]) if idx < len(raw) and raw[idx] else default
            except (ValueError, TypeError):
                return default
        
        data_tahun.append({
            "tahun": r.year_title,
            "penjualan": safe_get(0),
            "biayaTenagaKerja": safe_get(5) + safe_get(6) + safe_get(7),
            "bahanDigunakan": safe_get(8) + safe_get(9) + safe_get(10) + safe_get(11),
            "overhead_produksi": sum(safe_get(i) for i in range(12, 20)),
            "biaya_administrasi": sum(safe_get(i) for i in range(22, 37)),
            "penyusutan": safe_get(37) + safe_get(38),
            "pajak": safe_get(39) + safe_get(40) + safe_get(41),
            "bunga_pinjaman": safe_get(20) + safe_get(21),
            "nilaiTambah": nilai_tambah,
            "totalInvestasi": safe_get(50),  # estimasi
            "labaBersih": nilai_tambah - safe_get(5) - safe_get(37) - safe_get(39) - safe_get(20),
            "jumlahTenagaKerja": safe_get(48),
            "totalJamKerja": safe_get(52),
            "bahanBaku": safe_get(10),
        })
    
    # Panggil AI
    try:
        temuan_list = analyze_temuan(data_tahun, force_refresh=req.force_refresh)
    except Exception as e:
        logger.error(f"Error analyze_temuan: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
    
    # Simpan ke database
    tahun_str = f"{data_tahun[0]['tahun']}-{data_tahun[-1]['tahun']}" if len(data_tahun) > 1 else data_tahun[0]['tahun']
    temuan_baru = 0
    temuan_updated = 0
    
    for t in temuan_list:
        # Cek apakah sudah ada temuan dengan judul sama & belum resolved
        existing = db.query(Temuan).filter(
            Temuan.user_id == current_user.id,
            Temuan.judul == t["judul"],
            Temuan.status != "resolved",
        ).first()
        
        if existing:
            # Update
            existing.deskripsi = t["deskripsi"]
            existing.kategori = t["kategori"]
            existing.prioritas = t["prioritas"]
            existing.data_pendukung = _json.dumps(t.get("data_pendukung", {}))
            existing.dampak = t.get("dampak")
            existing.rekomendasi = t.get("rekomendasi")
            temuan_updated += 1
        else:
            # Buat baru
            new_temuan = Temuan(
                user_id=current_user.id,
                tahun=tahun_str,
                judul=t["judul"],
                deskripsi=t["deskripsi"],
                kategori=t["kategori"],
                prioritas=t["prioritas"],
                data_pendukung=_json.dumps(t.get("data_pendukung", {})),
                dampak=t.get("dampak"),
                rekomendasi=t.get("rekomendasi"),
                status="open",
            )
            db.add(new_temuan)
            temuan_baru += 1
    
    db.commit()
    
    return {
        "message": f"Analisis selesai. {temuan_baru} temuan baru, {temuan_updated} diperbarui.",
        "temuan_baru": temuan_baru,
        "temuan_updated": temuan_updated,
        "total_temuan": len(temuan_list),
    }