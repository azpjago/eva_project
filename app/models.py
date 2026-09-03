# app/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

    records = relationship("EvaRecord", back_populates="owner")
    chats = relationship("ChatMessage", back_populates="owner")

class EvaRecord(Base):
    __tablename__ = "eva_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    year_title = Column(String, index=True, nullable=False)
    raw_data = Column(Text, nullable=False)
    nilai_tambah = Column(Float, default=0.0)

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