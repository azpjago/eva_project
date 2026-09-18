"""Thin wrapper around the Gemini API (google-genai SDK).

Kept isolated so swapping providers (e.g. adding Groq as a fallback,
per the brief) later only means changing this file.
"""

import logging
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

from app.prompts import build_chat_system_prompt, build_recommendation_prompt
from app.schemas import ChatMessage, EvaResult

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# Inisialisasi client Gemini secara aman
_client = genai.Client(api_key=API_KEY) if API_KEY else None


def _get_client() -> genai.Client:
    """Helper internal untuk memastikan Client terinisialisasi sebelum dipanggil."""
    if _client is None:
        raise ValueError(
            "API Key Gemini belum terkonfigurasi. Pastikan GEMINI_API_KEY terisi di file .env"
        )
    return _client


def generate_recommendation_narrative(eva_result: EvaResult) -> str:
    """Menghasilkan narasi rekomendasi keputusan bisnis berdasarkan kalkulasi EVA."""
    client = _get_client()
    prompt = build_recommendation_prompt(eva_result)

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.4),
        )
        if response.text:
            return response.text.strip()
        return "Tidak dapat menghasilkan rekomendasi (respons EVA kosong atau terblokir filter)."
    
    except Exception as e:
        logger.error(f"Error pada generate_recommendation_narrative: {e}", exc_info=True)
        return f"Gagal membuat rekomendasi bisnis: {str(e)}"


def chat_reply(message: str, history: list[ChatMessage], eva_context: EvaResult | None) -> str:
    """Mengelola balasan chat interaktif dengan menyisipkan riwayat pesan dan instruksi sistem."""
    client = _get_client()
    system_instruction = build_chat_system_prompt(eva_context)

    # Convert history ke format SDK. Map role 'assistant' menjadi 'model' sesuai standar Gemini SDK.
    contents = []
    for h in history:
        role = "model" if h.role in ["assistant", "model"] else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=h.content)]))

    # Tambahkan pesan terbaru dari user
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.5,
            ),
        )
        if response.text:
            return response.text.strip()
        return "Maaf, EVA tidak memberikan respon (respons kosong)."

    except Exception as e:
        logger.error(f"Error pada chat_reply: {e}", exc_info=True)
        return f"Terjadi kesalahan koneksi ke EVA: {str(e)}"

def _coerce_to_string(val, default=""):
    """Ubah nilai apa pun menjadi string yang aman untuk ditampilkan."""
    if val is None:
        return default
    if isinstance(val, str):
        return val.strip() or default
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, dict):
        parts = []
        for k, v in val.items():
            if isinstance(v, str) and v.strip():
                parts.append(v.strip())
            elif isinstance(v, (int, float)):
                parts.append(str(v))
        return " ".join(parts) if parts else default
    if isinstance(val, list):
        parts = [_coerce_to_string(x) for x in val]
        return " ".join([p for p in parts if p]) or default
    return str(val) or default


def analyze_ratio_trend(data_tahun: list, ratios: list) -> dict:
    """
    Menganalisis SEMUA rasio produktivitas sekaligus menggunakan EVA Agent.
    Return format:
    {
      "ratio_id": {
        "short": "1-2 kalimat",
        "detailed": "3-5 kalimat analisis",
        "recommendations": ["Saran 1", "Saran 2", "Saran 3", "Saran 4", "Saran 5"],
        "trend": "naik" | "turun" | "stabil",
        "status": "positif" | "warning" | "negatif"
      }
    }
    """
    import json as _json

    # === FALLBACK (if-else sederhana) jika AI gagal ===
    def build_fallback():
        out = {}
        for r in ratios:
            values = r.get("values", [])
            growth = r.get("growth", [])
            rid = r["id"]
            label = r.get("label", "")

            if len(values) < 2:
                out[rid] = {
                    "short": "Data tidak cukup untuk analisis.",
                    "detailed": (
                        f"Rasio {label} membutuhkan minimal 2 tahun data untuk analisis tren. "
                        "Saat ini belum dapat disimpulkan arah perkembangannya."
                    ),
                    "recommendations": [
                        "📋 Tambahkan data tahun berikutnya untuk analisis yang lebih komprehensif.",
                        "📊 Pastikan semua komponen pembentuk rasio sudah terisi lengkap.",
                    ],
                    "trend": "stabil",
                    "status": "warning",
                }
                continue

            first, last = values[0], values[-1]
            sev = _analyze_severity(values, growth)
            pct = sev["pct_change"]

            if last > first:
                trend, status = "naik", "positif"
                short = f"📈 Naik {pct:+.1f}% dari {first:.2f} ({r.get('years', ['awal'])[0]}) ke {last:.2f} ({r.get('years', ['', 'akhir'])[-1]}). Indikasi peningkatan efisiensi."
                detailed = (
                    f"Rasio {label} menunjukkan tren positif dengan kenaikan {pct:+.1f}% "
                    f"dari {first:.2f} menjadi {last:.2f}. Peningkatan ini mengindikasikan "
                    f"perbaikan efisiensi dan efektivitas dalam periode tersebut. "
                    f"Perusahaan perlu mempertahankan strategi yang sudah berjalan baik "
                    f"dan melakukan monitoring berkala untuk memastikan keberlanjutan tren positif."
                )
            elif last < first:
                severity_label = {"mild": "ringan", "moderate": "sedang", "severe": "signifikan"}[sev["level"]]
                trend = "turun"
                status = "warning" if sev["level"] in ("mild", "moderate") else "negatif"
                short = f"📉 Turun {pct:+.1f}% dari {first:.2f} ke {last:.2f}. Penurunan {severity_label} — perlu evaluasi strategi."
                detailed = (
                    f"Rasio {label} mengalami penurunan {pct:+.1f}% ({severity_label}) "
                    f"dari {first:.2f} menjadi {last:.2f}. Penurunan ini perlu menjadi "
                    f"perhatian manajemen untuk dievaluasi penyebabnya. Faktor seperti "
                    f"beban kerja, efisiensi proses, atau kualitas SDM patut ditinjau. "
                    f"Target pemulihan: kembalikan ke level {sev['max_value']:.2f} "
                    f"(kenaikan +{sev['gap_to_max']:.1f}% dari posisi saat ini)."
                )
            else:
                trend, status = "stabil", "positif"
                short = f"➡️ Stabil di {first:.2f}. Ada ruang perbaikan +{sev['gap_to_max']:.1f}% ke benchmark internal."
                detailed = (
                    f"Rasio {label} relatif stabil di angka {first:.2f} selama periode analisis. "
                    f"Kinerja stabil menunjukkan konsistensi operasional, namun masih ada ruang "
                    f"perbaikan menuju benchmark internal di {sev['max_value']:.2f} "
                    f"(potensi kenaikan +{sev['gap_to_max']:.1f}%). "
                    f"Disarankan untuk menerapkan program continuous improvement agar rasio dapat terus bertumbuh."
                )

            out[rid] = {
                "short": short,
                "detailed": detailed,
                "recommendations": _build_smart_recommendations(rid, trend, values, growth),
                "trend": trend,
                "status": status,
            }
        return out

    # Pastikan AI client tersedia
    try:
        client = _get_client()
    except Exception as e:
        logger.warning(f"EVA client tidak tersedia, pakai fallback: {e}")
        return build_fallback()

    # Susun prompt ringkas
    prompt_data = []
    for r in ratios:
        prompt_data.append({
            "id": r["id"],
            "label": r["label"],
            "satuan": r.get("satuan", ""),
            "deskripsi": r.get("deskripsi", ""),
            "tahun": r.get("years", []),
            "nilai": [round(v, 4) for v in r.get("values", [])],
            "growth_persen": [round(g, 2) for g in r.get("growth", [])],
        })

    prompt = f"""Anda adalah analis produktivitas senior untuk Kementerian Ketenagakerjaan Indonesia.

Berikut adalah data rasio produktivitas perusahaan lintas tahun:

{_json.dumps(prompt_data, ensure_ascii=False, indent=2)}

TUGAS:
Untuk SETIAP rasio, berikan analisis singkat, analisis mendetail, dan TEPAT 5 saran perbaikan yang spesifik, terukur, dan actionable.
Fokus pada: tren (naik/turun/stabil), penyebab potensial, dampak bagi produktivitas, dan rekomendasi aksi nyata.

FORMAT OUTPUT (HARUS JSON VALID, tanpa markdown code fence):
{{
  "ratio_id": {{
    "short": "1-2 kalimat singkat (STRING, maks 120 karakter)",
    "detailed": "3-5 kalimat analisis mendalam (STRING)",
    "recommendations": [
      "Saran aksi nyata 1 (STRING)",
      "Saran aksi nyata 2 (STRING)"
    ],
    "trend": "naik",
    "status": "positif"
  }}
}}

ATURAN PENTING:
- Field "short" dan "detailed" HARUS berupa STRING (kalimat), BUKAN object atau array.
- "recommendations" HARUS ARRAY of STRING (TEPAT 5 saran, masing-masing 1-2 kalimat actionable dengan angka target bila memungkinkan).
- Field "trend" HARUS salah satu dari: "naik", "turun", "stabil".
- Field "status" HARUS salah satu dari: "positif", "warning", "negatif".
- Gunakan Bahasa Indonesia profesional.
- Sertakan angka spesifik dari data.
- Jangan mengarang data yang tidak ada.
- Output HANYA JSON, tanpa penjelasan tambahan.
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                response_mime_type="application/json",
            ),
        )
        text = (response.text or "").strip()

        # Bersihkan jika masih ada code fence
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].lstrip()
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start:end + 1]

        parsed = _json.loads(text)
        if not isinstance(parsed, dict):
            raise ValueError("EVA tidak mengembalikan dict")

        # === NORMALISASI: paksa semua field jadi tipe yang benar ===
        for rid, item in list(parsed.items()):
            if not isinstance(item, dict):
                continue
            # short & detailed wajib string
            item["short"] = _coerce_to_string(item.get("short"), "-")
            item["detailed"] = _coerce_to_string(
                item.get("detailed") or item.get("short"), item["short"]
            )
            # recommendations wajib list of string
            recs = item.get("recommendations")
            if isinstance(recs, str):
                recs = [recs]
            elif not isinstance(recs, list):
                recs = []
            item["recommendations"] = [
                _coerce_to_string(r) for r in recs if _coerce_to_string(r)
            ]
            # trend & status wajib string valid
            trend = _coerce_to_string(item.get("trend"), "stabil").lower()
            if trend not in ("naik", "turun", "stabil"):
                trend = "stabil"
            item["trend"] = trend
            status = _coerce_to_string(item.get("status"), "positif").lower()
            if status not in ("positif", "warning", "negatif"):
                status = "positif"
            item["status"] = status

        # Isi default untuk ratio yang mungkin tidak ada di response AI
        fallback = build_fallback()
        for rid, fb in fallback.items():
            if rid not in parsed:
                parsed[rid] = fb

        logger.info("Analisis rasio EVA berhasil di-generate.")
        return parsed

    except Exception as e:
        logger.error(f"Error pada analyze_ratio_trend: {e}", exc_info=True)
        return build_fallback()

def _analyze_severity(values: list, growth_rates: list) -> dict:
    """
    Klasifikasikan tingkat keparahan berdasarkan growth dan volatilitas.
    """
    if len(values) < 2:
        return {"level": "unknown", "pct_change": 0, "max_value": 0, "min_value": 0}

    first, last = values[0], values[-1]
    max_val = max(values)
    min_val = min(values)

    # Total perubahan dari awal ke akhir
    pct_change = ((last - first) / first * 100) if first != 0 else 0

    # Volatilitas (standar deviasi perubahan growth)
    if len(growth_rates) > 1:
        avg_growth = sum(growth_rates[1:]) / (len(growth_rates) - 1)
    else:
        avg_growth = 0

    abs_pct = abs(pct_change)
    if abs_pct < 5:
        level = "mild"
    elif abs_pct < 15:
        level = "moderate"
    else:
        level = "severe"

    return {
        "level": level,
        "pct_change": round(pct_change, 2),
        "max_value": round(max_val, 4),
        "min_value": round(min_val, 4),
        "first": round(first, 4),
        "last": round(last, 4),
        "avg_growth": round(avg_growth, 2),
        "gap_to_max": round(((max_val - last) / max_val * 100), 2) if max_val > 0 else 0,
    }

def _ensure_min_5_suggestions(recs: list, trend: str) -> list:
    """Pastikan minimal 5 saran. Jika kurang, tambahkan saran generik yang relevan."""
    generic_pool = {
        "naik": [
            "📊 Lakukan benchmarking eksternal: bandingkan rasio ini dengan rata-rata industri sejenis untuk memastikan posisi kompetitif.",
            "🔄 Terapkan siklus PDCA (Plan-Do-Check-Act) untuk menjaga konsistensi perbaikan berkelanjutan.",
            "📚 Dokumentasikan praktik terbaik (best practice) menjadi SOP tertulis agar dapat direplikasi ke unit lain.",
            "🎯 Tetapkan target progresif: naikkan rasio +3% per kuartal sebagai bagian dari KPI tahunan.",
            "🏆 Berikan penghargaan (reward) kepada tim dengan pencapaian rasio tertinggi untuk memotivasi perbaikan berkelanjutan.",
        ],
        "turun": [
            "🔍 Bentuk tim investigasi (task force) untuk mengidentifikasi akar masalah dalam 30 hari.",
            "📈 Tetapkan KPI pemulihan: target kenaikan +2% per bulan sampai kembali ke benchmark internal.",
            "🎓 Adakan pelatihan intensif untuk tim operasional terkait proses yang bermasalah.",
            "🤝 Libatkan konsultan eksternal jika penurunan > 15% untuk audit independen.",
            "📋 Buat action plan tertulis dengan milestone 30/60/90 hari yang di-review mingguan.",
        ],
        "stabil": [
            "💡 Adopsi program Continuous Improvement: kumpulkan minimal 5 ide perbaikan per bulan dari tim.",
            "🎯 Tetapkan target progresif: +1% per kuartal untuk mendorong pertumbuhan.",
            "📊 Lakukan benchmark dengan kompetitor untuk melihat peluang peningkatan.",
            "🔄 Review proses bisnis secara berkala untuk menemukan titik optimasi.",
            "📚 Adakan sesi knowledge sharing antar divisi untuk berbagi praktik terbaik.",
        ],
    }
    pool = generic_pool.get(trend, generic_pool["stabil"])
    i = 0
    while len(recs) < 5 and i < len(pool):
        if pool[i] not in recs:
            recs.append(pool[i])
        i += 1
    return recs[:5] if len(recs) >= 5 else recs

def _build_smart_recommendations(ratio_id: str, trend: str, values: list, growth_rates: list) -> list:
    """
    Buat rekomendasi JELAS & TERUKUR dengan target, KPI, dan timeframe.
    Menggunakan data historis sebagai benchmark (nilai tertinggi = best-in-class).
    """
    sev = _analyze_severity(values, growth_rates)
    level = sev["level"]
    pct_change = sev["pct_change"]
    max_val = sev["max_value"]
    last_val = sev["last"]
    gap_to_max = sev["gap_to_max"]

    # Target minimal (kembali ke level tertinggi = benchmark realistis karena pernah dicapai)
    target_min = max_val
    target_pct = gap_to_max

    # ===== TREN NAIK (PERTAHANKAN + TINGKATKAN) =====
    if trend == "naik":
        base = [
            f"📊 **Target**: Pertahankan rasio minimal di level {last_val:.2f}, targetkan pertumbuhan +5% dalam 6 bulan ke depan (≥ {last_val * 1.05:.2f}).",
            f"📅 **KPI Monitoring**: Evaluasi rasio per kuartal. Alert jika turun >3% dari kuartal sebelumnya.",
            f"🏆 **Benchmark Internal**: Level tertinggi yang pernah dicapai: {max_val:.2f}. Jadikan standar minimum operasional.",
        ]
        # Tambahan sesuai jenis rasio
        specific = {
            "nilai_tambah_per_tenaga": [
                "👥 **Aksi SDM**: Adakan program pelatihan teknis lanjutan 40 jam/tahun untuk setiap tenaga kerja.",
                "💰 **Aksi Insentif**: Terapkan bonus produktivitas dengan formula: bonus = 2% × (kenaikan Nilai Tambah/Tenaga dari baseline).",
            ],
            "nilai_tambah_per_jam": [
                "⏱️ **Aksi Operasional**: Audit utilisasi jam kerja — targetkan idle time < 5% per shift.",
                "🔄 **Aksi Proses**: Implementasikan lean manufacturing untuk mengurangi waktu non-produktif.",
            ],
            "nilai_tambah_per_biaya_tk": [
                "💵 **Aksi Efisiensi**: Jaga rasio tetap ≥ 3.0 — jika turun < 3.0, review struktur kompensasi.",
                "📈 **Aksi Investasi SDM**: Alokasikan 2-3% dari biaya TK untuk pelatihan guna menjaga ROI tenaga kerja.",
            ],
            "biaya_tk_per_jam": [
                "⚖️ **Aksi Keseimbangan**: Pastikan kenaikan upah/jam ≤ kenaikan produktivitas/jam (growth produktivitas ≥ growth upah).",
                "📊 **Aksi Monitoring**: Benchmark gaji/jam vs rata-rata industri — jangan melebihi 110% rata-rata industri.",
            ],
            "penjualan_per_investasi": [
                f"💼 **Target**: Tingkatkan ke ≥ {max_val * 1.1:.2f} (naik 10% dari benchmark).",
                "📈 **Aksi Penjualan**: Alokasikan ulang modal ke lini produk dengan ROI tertinggi.",
            ],
            "nilai_tambah_per_investasi": [
                "🎯 **Target**: Jaga efisiensi modal ≥ level saat ini, target +5% YoY.",
                "🔧 **Aksi Modal**: Audit aset per semester — divestasi aset dengan kontribusi < 5% nilai tambah.",
            ],
            "investasi_per_tenaga": [
                "🏗️ **Aksi Utilisasi**: Pastikan setiap tenaga kerja mengelola aset dengan output/jam stabil.",
                "📚 **Aksi Pelatihan**: Pelatihan operasional alat berat/mesin minimal 20 jam/tahun per operator.",
            ],
            "laba_per_penjualan": [
                "💰 **Target Margin**: Jaga net profit margin ≥ level saat ini, target +1% per tahun.",
                "📉 **Aksi Biaya**: Kurangi biaya operasional non-esensial sebesar 2-3% dari total penjualan.",
            ],
            "laba_per_nilai_tambah": [
                "🎯 **Target Konversi**: Jaga konversi nilai tambah → laba ≥ 15%.",
                "🔍 **Aksi**: Audit setiap tahap produksi untuk deteksi kebocoran nilai.",
            ],
            "laba_per_investasi": [
                f"📈 **Target ROI**: Jaga ROI ≥ level saat ini ({last_val:.2f}%), target +2% YoY.",
                "💡 **Aksi**: Reinvestasikan 30% laba bersih untuk ekspansi lini bisnis paling profitable.",
            ],
            "nilai_tambah_per_penjualan": [
                "🏭 **Target**: Jaga rasio ≥ 40% (indikasi efisiensi produksi tinggi).",
                "🔧 **Aksi**: Kurangi waste bahan baku hingga < 3% dari total pembelian.",
            ],
            "nilai_tambah_per_bahan_baku": [
                "🧪 **Aksi Inovasi**: Kembangkan minimal 1 inisiatif inovasi produk per semester.",
                "💼 **Aksi Supplier**: Negosiasi kontrak jangka panjang dengan supplier utama untuk harga lebih stabil.",
            ],
            "nilai_tambah_per_biaya_tk_v2": [
                "🚀 **Target Multiplier**: Jaga rasio ≥ 3.0 (setiap Rp1 biaya TK menghasilkan ≥ Rp3 nilai tambah).",
                "👥 **Aksi**: Terapkan sistem reward berbasis output untuk menjaga pengganda tetap tinggi.",
            ],
        }
        return _ensure_min_5_suggestions(base + specific.get(ratio_id, []), "naik")

    # ===== TREN TURUN (PERBAIKAN TERUKUR) =====
    elif trend == "turun":
        # Base rekomendasi dengan target recovery
        base = [
            f"🎯 **Target Pemulihan**: Kembalikan rasio ke level {target_min:.2f} dalam {6 if level == 'mild' else 9 if level == 'moderate' else 12} bulan (kenaikan +{target_pct:.1f}% dari posisi saat ini {last_val:.2f}).",
            f"📅 **KPI Monitoring**: Evaluasi bulanan dengan target kenaikan +2% per bulan hingga tercapai level target.",
            f"⚠️ **Early Warning**: Jika rasio turun lagi >5% dalam 3 bulan, lakukan audit menyeluruh pada proses terkait.",
        ]

        # Severity-specific actions
        if level == "severe":
            base.append(f"🚨 **Tindakan Darurat**: Total penurunan {abs(pct_change):.1f}% — bentuk tim task force lintas divisi untuk investigasi akar masalah dalam 30 hari.")
        elif level == "moderate":
            base.append(f"🔧 **Tindakan Segera**: Penurunan {abs(pct_change):.1f}% — review proses bisnis terkait dalam 60 hari.")

        # Specific per rasio
        specific = {
            "nilai_tambah_per_tenaga": [
                f"👥 **Aksi SDM**: Audit produktivitas per individu. Target: naikkan output per tenaga kerja minimal +5% dalam 6 bulan.",
                "🎓 **Aksi Pelatihan**: Reskilling untuk 100% tenaga kerja dengan output < rata-rata tim, selesai dalam 3 bulan.",
                "⚙️ **Aksi Proses**: Identifikasi 3 proses paling menghambat produktivitas, perbaiki dalam 90 hari.",
            ],
            "nilai_tambah_per_jam": [
                f"⏱️ **Aksi Jam Kerja**: Turunkan idle time dari rata-rata saat ini ke < 5% dalam 3 bulan.",
                "📊 **Aksi Pengukuran**: Pasang time-tracking di semua lini produksi, review mingguan.",
                "🔄 **Aksi Rebalancing**: Redistribusi beban kerja — pastikan tidak ada divisi dengan utilasi < 70%.",
            ],
            "nilai_tambah_per_biaya_tk": [
                f"💵 **Aksi Struktur Biaya**: Evaluasi seluruh komponen biaya TK — target: turunkan biaya non-produktif sebesar 10% dalam 6 bulan.",
                "📈 **Aksi Output**: Tingkatkan nilai tambah minimal +8% dalam 6 bulan tanpa menambah biaya TK.",
                "⚖️ **Aksi Rasio**: Target rasio kembali ke ≥ 3.0 dalam 9 bulan.",
            ],
            "biaya_tk_per_jam": [
                f"⏰ **Aksi Overtime**: Batasi lembur maksimal 10% dari jam kerja reguler dalam 3 bulan.",
                "📋 **Aksi Penjadwalan**: Optimalkan shift kerja sesuai beban — target: turunkan biaya TK/jam sebesar 5-8% dalam 6 bulan.",
                "🎯 **Aksi Produktivitas**: Targetkan output per jam naik +5% untuk mengimbangi biaya TK/jam.",
            ],
            "penjualan_per_investasi": [
                f"📊 **Target Utilisasi**: Tingkatkan utilisasi kapasitas produksi dari saat ini ke minimal 85% dalam 6 bulan.",
                "💼 **Aksi Penjualan**: Targetkan kenaikan penjualan +10% dalam 6 bulan tanpa tambahan investasi.",
                "🔍 **Aksi Audit Aset**: Identifikasi 20% aset dengan kontribusi terendah — optimalkan atau divestasi.",
            ],
            "nilai_tambah_per_investasi": [
                f"📉 **Aksi Efisiensi Modal**: Turunkan modal kerja tidak produktif sebesar 15% dalam 6 bulan.",
                "🎯 **Target**: Kembalikan rasio ke level {target_min:.2f} dalam 12 bulan.",
                "🔧 **Aksi**: Implementasikan sistem monitoring ROI per unit aset, review kuartalan.",
            ],
            "investasi_per_tenaga": [
                f"👷 **Aksi SDM**: Evaluasi apakah jumlah tenaga kerja sudah sebanding dengan total aset yang dikelola.",
                "📚 **Aksi Kompetensi**: Pelatihan manajemen aset untuk semua supervisor, selesai dalam 3 bulan.",
                "🏗️ **Target**: Naikkan output per tenaga kerja minimal +7% dalam 6 bulan.",
            ],
            "laba_per_penjualan": [
                f"💰 **Target Margin**: Kembalikan net profit margin ke ≥ {target_min:.2f}% dalam 9 bulan.",
                "✂️ **Aksi Cost Cutting**: Identifikasi 5 biaya terbesar — target: potong 5-10% per pos dalam 6 bulan.",
                "💲 **Aksi Pricing**: Evaluasi harga jual produk dengan margin terendah — naikkan atau discontinue.",
            ],
            "laba_per_nilai_tambah": [
                f"🔍 **Aksi Deteksi Kebocoran**: Audit setiap tahap produksi — target: identifikasi minimal 3 titik kebocoran nilai dalam 60 hari.",
                "🎯 **Target**: Kembalikan konversi nilai tambah ke laba ≥ {target_min:.2f}% dalam 9 bulan.",
                "📊 **Aksi Monitoring**: Buat dashboard konversi real-time, review mingguan.",
            ],
            "laba_per_investasi": [
                f"📉 **Aksi ROI**: Hentikan atau restrukturisasi investasi dengan ROI < 5% dalam 6 bulan.",
                "🎯 **Target**: Kembalikan ROI ke ≥ {target_min:.2f}% dalam 12 bulan.",
                "💰 **Aksi Realokasi**: Realokasikan 30% modal dari investasi berkinerja rendah ke lini yang lebih profitable.",
            ],
            "nilai_tambah_per_penjualan": [
                f"🏭 **Aksi Produksi**: Kurangi biaya bahan dan jasa non-esensial sebesar 8% dalam 6 bulan.",
                "🎯 **Target**: Kembalikan rasio ke ≥ {target_min:.2f}% dalam 9 bulan.",
                "📊 **Aksi**: Benchmark dengan kompetitor — identifikasi gap efisiensi.",
            ],
            "nilai_tambah_per_bahan_baku": [
                f"💼 **Aksi Supplier**: Negosiasi ulang kontrak dengan top 3 supplier — target: hemat 5-10% dalam 6 bulan.",
                "♻️ **Aksi Waste Reduction**: Kurangi waste bahan baku dari saat ini ke < 5% dalam 6 bulan.",
                "🧪 **Aksi Inovasi**: Kembangkan 2 inisiatif inovasi produk per semester untuk tingkatkan nilai tambah.",
            ],
            "nilai_tambah_per_biaya_tk_v2": [
                f"👥 **Aksi Produktivitas**: Naikkan output per tenaga kerja minimal +8% dalam 6 bulan.",
                f"🎯 **Target**: Kembalikan multiplier ke ≥ {target_min:.2f} dalam 9 bulan.",
                "📚 **Aksi Pelatihan**: Fokus pelatihan pada 20% tenaga kerja dengan output terendah.",
            ],
        }
        return _ensure_min_5_suggestions(base + specific.get(ratio_id, []), "turun")

    # ===== TREN STABIL =====
    else:
        return _ensure_min_5_suggestions([
            f"📊 **Target**: Naikkan rasio +3-5% dari level saat ini ({last_val:.2f}) dalam 6 bulan ke depan.",
            f"🏆 **Benchmark Internal**: Level tertinggi yang pernah dicapai: {max_val:.2f}. Ada ruang perbaikan +{gap_to_max:.1f}%.",
            f"📅 **KPI Monitoring**: Review kuartalan dengan target kenaikan minimal +1% per kuartal.",
            "💡 **Aksi Continuous Improvement**: Adopsi program Kaizen — kumpulkan minimal 5 ide perbaikan per bulan dari tim operasional.",
            "🎯 **Aksi Benchmarking**: Bandingkan dengan rata-rata industri — identifikasi area gap untuk ditingkatkan.",
        ], "stabil")

def ratio_dialog_reply(
    message: str,
    history: list,
    ratio_context: dict,
) -> str:
    """
    Balas pesan user dalam konteks rasio produktivitas tertentu.
    
    Args:
        message: pesan user
        history: list dict {"role": "user"|"model", "content": "..."}
        ratio_context: {
            "label": "Nilai Tambah / Jumlah Tenaga Kerja",
            "deskripsi": "...",
            "years": ["2020", "2021", "2022"],
            "values": [100, 120, 130],
            "analysis_summary": "Rasio menurun..."
        }
    """
    client = _get_client()

    label = ratio_context.get("label", "Rasio")
    deskripsi = ratio_context.get("deskripsi", "")
    years = ratio_context.get("years", [])
    values = ratio_context.get("values", [])
    analysis = ratio_context.get("analysis_summary", "")

    # Susun konteks dalam format tabel sederhana
    data_str = ""
    for i, y in enumerate(years):
        v = values[i] if i < len(values) else "-"
        data_str += f"  - {y}: {v}\n"

    system_instruction = f"""Anda adalah analis produktivitas senior Kementerian Ketenagakerjaan Indonesia yang sedang berdialog dengan manajer perusahaan.

KONTEKS RASIO YANG SEDANG DIBAHAS:
- Nama Rasio: {label}
- Deskripsi: {deskripsi}
- Data antar tahun:
{data_str}
- Analisis terkini: {analysis}

PANDUAN MENJAWAB:
- Jawab lugas dan fokus pada pertanyaan user, jangan bertele-tele.
- Sertakan angka spesifik dari data di atas jika relevan.
- Berikan rekomendasi yang ACTIONABLE (bisa langsung dijalankan), bukan saran generik.
- Jika user bertanya "kenapa turun?", berikan hipotesis penyebab + cara verifikasinya.
- Jika user bertanya "apa yang harus dilakukan?", beri 2-3 langkah konkret dengan target terukur.
- Gunakan Bahasa Indonesia profesional. Maksimal 3-4 paragraf pendek.
"""

    # Susun contents
    contents = []
    for h in history:
        role = "model" if h.get("role") in ("assistant", "model") else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=h.get("content", ""))]))
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.5,
            ),
        )
        if response.text:
            return response.text.strip()
        return "Maaf, EVA tidak memberikan respon."
    except Exception as e:
        logger.error(f"Error pada ratio_dialog_reply: {e}", exc_info=True)
        return f"Maaf, koneksi ke EVA terganggu: {str(e)[:100]}"