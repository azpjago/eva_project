# app/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

    # Relasi 1-ke-banyak dengan EvaRecord
    records = relationship("EvaRecord", back_populates="owner")


class EvaRecord(Base):
    __tablename__ = "eva_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    year_title = Column(String, index=True, nullable=False)
    
    # Menyimpan array JSON dari seluruh nilai form agar praktis
    raw_data = Column(Text, nullable=False)
    
    # Hasil hitungan untuk ditampilkan cepat di dashboard
    nilai_tambah = Column(Float, default=0.0)

    owner = relationship("User", back_populates="records")