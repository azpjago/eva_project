import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path

from app.ai_service import chat_reply, generate_recommendation_narrative
from app.database import Base, engine, get_db
from app.eva_calculator import calculate_eva
from app.models import User, EvaRecord
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
    EvaRecordResponse
)
from app.security import create_access_token, hash_password, verify_password, SECRET_KEY, ALGORITHM

app = FastAPI(
    title="EVA Analysis & AI Recommendation API",
    description="Backend API untuk kalkulasi Economic Value Added dan rekomendasi AI produktivitas ketenagakerjaan.",
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

# ===== MOUNT STATIC FILES =====
# Mount folder dashboard (jika ada)
dashboard_path = BASE_DIR / "dashboard"
if dashboard_path.exists() and dashboard_path.is_dir():
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
    
    # Fallback ke dashboard.html di root (jika ada)
    fallback = BASE_DIR / "dashboard.html"
    if fallback.exists():
        return FileResponse(fallback)
    
    raise HTTPException(status_code=404, detail="Dashboard not found")

# ===== SERVE FILE STATIC LAINNYA (FALLBACK) =====
@app.get("/{file_path:path}", include_in_schema=False)
def serve_static_files(file_path: str):
    """Serve semua file HTML, CSS, JS, dan assets lainnya"""
    # Cek di root directory
    root_file = BASE_DIR / file_path
    if root_file.exists() and root_file.is_file():
        return FileResponse(root_file)
    
    # Cek di folder dashboard
    dashboard_file = BASE_DIR / "dashboard" / file_path
    if dashboard_file.exists() and dashboard_file.is_file():
        return FileResponse(dashboard_file)
    
    # Cek di folder static (jika ada)
    static_file = BASE_DIR / "static" / file_path
    if static_file.exists() and static_file.is_file():
        return FileResponse(static_file)
    
    raise HTTPException(status_code=404, detail="File not found")

# ===== API ENDPOINTS =====
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
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc
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
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc
    updated_history = req.history + [
        ChatMessage(role="user", content=req.message),
        ChatMessage(role="model", content=reply),
    ]
    return ChatResponse(reply=reply, history=updated_history)

# ===== AUTH ENDPOINTS (tanpa is_active) =====
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
            nilai_tambah=rec.nilai_tambah
        )
        db.add(new_record)
        saved_records.append(new_record)
    
    db.commit()
    for r in saved_records:
        db.refresh(r)
        
    return saved_records

@app.get("/api/eva/history", response_model=list[EvaRecordResponse])
def get_eva_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(EvaRecord).filter(EvaRecord.user_id == current_user.id).all()

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
        narasi = "Sistem AI sedang sibuk, mohon coba lagi nanti."

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
        ai_text = "Maaf, koneksi ke AI sedang terganggu."

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)