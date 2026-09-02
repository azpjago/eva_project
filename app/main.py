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