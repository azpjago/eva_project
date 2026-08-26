# EVA AI Service

Modul integrasi AI untuk Platform Analisis EVA (Kemnaker). Bagian ini hanya
mencakup **backend AI**: perhitungan EVA (deterministik, di Python) + AI
untuk narasi rekomendasi preskriptif & dialog interaktif (Gemini API).

Frontend (React), penyimpanan riwayat ke PostgreSQL, dan upload
CSV/Excel belum termasuk di modul ini — menyusul di tahap berikutnya.

## 1. Setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# isi GEMINI_API_KEY di .env dengan key dari Google AI Studio
```

## 2. Jalankan server

```bash
uvicorn app.main:app --reload --port 8000
```

Dokumentasi interaktif otomatis tersedia di `http://localhost:8000/docs`.

## 3. Contoh test dengan curl

**Hitung EVA saja (tanpa AI):**

```bash
curl -X POST http://localhost:8000/api/eva/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "PT Contoh Sejahtera",
    "period": "Q1 2026",
    "ebit": 500000000,
    "tax_rate": 0.22,
    "invested_capital": 2000000000,
    "wacc": 0.10
  }'
```

**Minta rekomendasi AI (hitung EVA + narasi preskriptif):**

```bash
curl -X POST http://localhost:8000/api/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "PT Contoh Sejahtera",
    "period": "Q1 2026",
    "ebit": 500000000,
    "tax_rate": 0.22,
    "invested_capital": 2000000000,
    "wacc": 0.10
  }'
```

**Chat lanjutan dengan konteks hasil EVA:**

```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Kalau EVA-nya negatif gini, mana yang harus dipangkas duluan?",
    "history": [],
    "eva_context": {
      "company_name": "PT Contoh Sejahtera",
      "period": "Q1 2026",
      "nopat": 390000000,
      "capital_charge": 200000000,
      "eva": 190000000,
      "status": "positif"
    }
  }'
```

## Struktur

```
app/
  schemas.py          # Pydantic models (request/response)
  eva_calculator.py   # Logika EVA — murni Python, tidak pernah diserahkan ke AI
  prompts.py          # Matriks rekomendasi + prompt engineering
  ai_service.py        # Wrapper Gemini API (google-genai SDK)
  main.py              # Endpoint FastAPI
```

## Kenapa perhitungan EVA tidak dilakukan oleh AI?

LLM tidak deterministik dan bisa salah hitung, terutama untuk angka besar.
Di sini AI hanya bertugas **menginterpretasikan** hasil yang sudah pasti
benar (dihitung Python), sesuai instruksi di brief: AI sebagai "konsultan
produktivitas virtual", bukan kalkulator.

## Langkah selanjutnya

- Tambah Groq API sebagai fallback provider (brief menyebut "Gemini/Groq")
- Simpan riwayat chat ke PostgreSQL (saat ini histori hanya dikirim
  bolak-balik oleh client, belum persisten)
- Endpoint upload CSV/Excel + validasi kolom (EBIT, Tarif Pajak, dst.)
- Autentikasi (belum ada — semua endpoint masih terbuka)
