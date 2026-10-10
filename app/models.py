# app/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

    records = relationship("EvaRecord", back_populates="owner")
    chats = relationship("ChatMessage", back_populates="owner")

class RasioDialog(Base):
    __tablename__ = "rasio_dialog"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ratio_id = Column(String(100), nullable=False, index=True)
    years_key = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # "user" | "model"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
# ============================================================
# MODELS BARU: PIC (Hierarkis) + Temuan + History
# ============================================================

class PIC(Base):
    """Person In Charge dengan hierarki organisasi (self-referencing)."""
    __tablename__ = "pic"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Hierarki organisasi
    parent_id = Column(Integer, ForeignKey("pic.id"), nullable=True, index=True)
    level = Column(Integer, default=1)        # 1=Direktur, 2=Manager, 3=Supervisor, 4=Staf
    urutan = Column(Integer, default=0)       # untuk sorting dalam level yang sama
    
    # Info posisi
    nama_jabatan = Column(String(200), nullable=False)
    departemen = Column(String(200), nullable=True)
    
    # Info personal (opsional, diisi nanti)
    nama_orang = Column(String(200), nullable=True)
    email = Column(String(200), nullable=True)
    telepon = Column(String(50), nullable=True)
    foto_base64 = Column(Text, nullable=True)  # foto profil (base64, maks ~300KB)
    
    # Mapping AI → PIC (array kategori)
    kategori_tanggung_jawab = Column(Text, default="[]")  # JSON array string
    
    # Meta
    is_active = Column(Boolean, default=True)
    is_template = Column(Boolean, default=True)  # 1 = masih default dari seed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Temuan(Base):
    """Temuan hasil analisis AI dari data kalkulator EVA."""
    __tablename__ = "temuan"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tahun = Column(String(100), nullable=False)
    judul = Column(String(300), nullable=False)
    deskripsi = Column(Text, nullable=False)
    kategori = Column(String(100), nullable=False)
    prioritas = Column(String(20), default="sedang")  # tinggi|sedang|rendah
    data_pendukung = Column(Text, default="{}")       # JSON string
    dampak = Column(Text, nullable=True)
    rekomendasi = Column(Text, nullable=True)
    recommended_methods = Column(Text, default="[]") 
    fingerprint = Column(String(200), default="", index=True)
    pic_id = Column(Integer, ForeignKey("pic.id"), nullable=True, index=True)
    status = Column(String(20), default="open")
    deadline = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TemuanHistory(Base):
    """Log riwayat perubahan status temuan."""
    __tablename__ = "temuan_history"

    id = Column(Integer, primary_key=True, index=True)
    temuan_id = Column(Integer, ForeignKey("temuan.id"), nullable=False, index=True)
    status_lama = Column(String(20), nullable=True)
    status_baru = Column(String(20), nullable=False)
    catatan = Column(Text, nullable=True)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)
class EvaRecord(Base):
    __tablename__ = "eva_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    year_title = Column(String, index=True, nullable=False)
    raw_data = Column(Text, nullable=False)
    nilai_tambah = Column(Float, default=0.0)
    bonus_persen = Column(Float, default=0.0)
    owner = relationship("User", back_populates="records")

# --- TABEL BARU: PENYIMPANAN RIWAYAT CHAT AI ---
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, nullable=False) # "user" atau "model"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="chats")