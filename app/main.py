import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

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

@app.get("/", include_in_schema=False)
def read_index():
    return FileResponse("index.html")

@app.get("/login", include_in_schema=False)
@app.get("/login.html", include_in_schema=False)
def read_login():
    return FileResponse("login.html")

@app.get("/register", include_in_schema=False)
@app.get("/register.html", include_in_schema=False)
def read_register():
    return FileResponse("register.html")

@app.get("/dashboard", include_in_schema=False)
def read_dashboard():
    return FileResponse("dashboard.html")

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

# --- ENDPOINT BARU UNTUK DATABASE EVA ---
@app.post("/api/eva/save", response_model=list[EvaRecordResponse])
def save_eva_records(records: list[EvaRecordCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Hapus data riwayat lama pengguna ini, lalu timpa dengan data array terbaru dari dashboard
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


# Tambahkan ini di bagian BAWAH app/main.py (sebelumnya pastikan import terpasang)
from app.prompts import build_dashboard_recommendation_prompt, build_chat_system_context, get_status_from_ratio, RECOMMENDATION_MATRIX
from app.schemas import DashboardContext, DashboardRecommendation, ChatMsgSend, ChatMsgResponse
from app.models import ChatMessage
import google.generativeai as genai
import os

# Set Gemini API Key (Sesuaikan dengan variabel env kamu)
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "ISI_API_KEY_KAMU_DISINI"))
model = genai.GenerativeModel('gemini-1.5-flash')

@app.post("/api/ai/dashboard-recommend", response_model=DashboardRecommendation)
def get_dashboard_recommendation(data: DashboardContext, current_user: User = Depends(get_current_user)):
    status = get_status_from_ratio(data.nilai_tambah, data.total_investasi)
    matrix = RECOMMENDATION_MATRIX[status]
    prompt = build_dashboard_recommendation_prompt(data.period, data.nilai_tambah, data.total_investasi, status)
    
    try:
        response = model.generate_content(prompt)
        narasi = response.text
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
    return db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).order_by(ChatMessage.created_at.asc()).all()

@app.delete("/api/ai/chat/clear")
def clear_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}

@app.post("/api/ai/chat/send", response_model=ChatMsgResponse)
def send_chat_message(req: ChatMsgSend, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Simpan pesan user
    user_msg = ChatMessage(user_id=current_user.id, role="user", content=req.content)
    db.add(user_msg)
    db.commit()

    # 2. Ambil riwayat untuk konteks Gemini
    history = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).order_by(ChatMessage.created_at.asc()).all()
    
    # 3. Rakit konteks percakapan
    system_ctx = build_chat_system_context(req.period_context, req.nilai_tambah_context, req.investasi_context)
    chat_prompt = f"{system_ctx}\n\nRiwayat Percakapan:\n"
    for h in history[-10:]: # Ambil 10 pesan terakhir agar memori tidak over
        chat_prompt += f"{'Pengguna' if h.role == 'user' else 'Asisten'}: {h.content}\n"
    chat_prompt += f"\nResponlah pertanyaan Pengguna terakhir dengan ramah."

    # 4. Dapatkan respon AI
    try:
        response = model.generate_content(chat_prompt)
        ai_text = response.text
    except Exception as e:
        ai_text = "Maaf, koneksi ke AI sedang terganggu."

    # 5. Simpan respon AI
    ai_msg = ChatMessage(user_id=current_user.id, role="model", content=ai_text)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    return ai_msg

@app.put("/api/ai/chat/edit/{msg_id}")
def edit_chat_message(msg_id: int, req: ChatMsgSend, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Cari pesan yang mau diedit
    msg = db.query(ChatMessage).filter(ChatMessage.id == msg_id, ChatMessage.user_id == current_user.id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    
    # Hapus pesan ini dan SEMUA pesan setelahnya (truncation)
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id, ChatMessage.created_at >= msg.created_at).delete()
    db.commit()

    # Kirim ulang pesan yang baru diedit seolah-olah itu pesan baru
    return send_chat_message(req, db, current_user)