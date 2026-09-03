"""Prompt engineering for the prescriptive AI assistant."""

from app.schemas import EvaResult

RECOMMENDATION_MATRIX = {
    "positif": {
        "fokus": "Ekspansi modal & investasi SDM unggul",
        "aksi": "Pemberian insentif kerja & program vokasi lanjutan",
    },
    "impas": {
        "fokus": "Optimalisasi proses operasional",
        "aksi": "Evaluasi efisiensi jam kerja & beban tugas",
    },
    "negatif": {
        "fokus": "Rasionalisasi biaya & restrukturisasi",
        "aksi": "Konsultasi & coaching produktivitas intensif",
    },
}

SYSTEM_PERSONA = """\
Kamu adalah konsultan produktivitas virtual dalam platform analisis EVA \
hasil kemitraan dengan Kementerian Ketenagakerjaan RI (Kemnaker). \
Tugasmu adalah menjelaskan performa keuangan dan rasio produktivitas \
suatu perusahaan kepada pengguna non-teknis, lalu memberi rekomendasi \
bisnis yang preskriptif dan bisa ditindaklanjuti.

Aturan:
- Gunakan format Markdown (bold, bullet points) agar rapi dan mudah dibaca.
- Selalu kaitkan narasimu dengan fokus rekomendasi dan aksi produktivitas dari Kemnaker.
- Gunakan bahasa Indonesia yang profesional, empatik, namun ringkas.
- Jangan mengarang data yang tidak diberikan.
"""

# =================================================================
# --- FUNGSI LAMA (DIPERTAHANKAN AGAR TIDAK ERROR DI AI_SERVICE) ---
# =================================================================

def build_recommendation_prompt(eva_result: EvaResult) -> str:
    matrix = RECOMMENDATION_MATRIX[eva_result.status]
    return f"""\
{SYSTEM_PERSONA}

Data hasil analisis:
- Perusahaan: {eva_result.company_name}
- Periode: {eva_result.period}
- NOPAT: Rp{eva_result.nopat:,.0f}
- Capital Charge: Rp{eva_result.capital_charge:,.0f}
- EVA: Rp{eva_result.eva:,.0f} ({eva_result.status})
- Fokus rekomendasi (fixed): {matrix['fokus']}
- Aksi produktivitas (fixed): {matrix['aksi']}

Tulis narasi singkat (3-4 kalimat) yang menjelaskan apa arti hasil EVA ini \
bagi perusahaan, dan mengapa fokus & aksi di atas relevan untuk kondisi mereka. \
Jangan mengulang angka mentah secara berlebihan, fokus pada makna bisnisnya.
"""

def build_chat_system_prompt(eva_result: EvaResult | None) -> str:
    if eva_result is None:
        return SYSTEM_PERSONA
    matrix = RECOMMENDATION_MATRIX[eva_result.status]
    return f"""{SYSTEM_PERSONA}

Konteks data yang sedang dibahas pengguna:
- Perusahaan: {eva_result.company_name}, Periode: {eva_result.period}
- EVA: Rp{eva_result.eva:,.0f} ({eva_result.status})
- Fokus rekomendasi: {matrix['fokus']}
- Aksi produktivitas: {matrix['aksi']}

Jawab pertanyaan pengguna dengan mengacu pada konteks ini bila relevan.
"""


# =================================================================
# --- FUNGSI BARU (UNTUK FITUR DASHBOARD AI ASISTEN) ---
# =================================================================

def get_status_from_ratio(nilai_tambah: float, investasi: float) -> str:
    if investasi <= 0:
        return "impas"
    ratio = nilai_tambah / investasi
    if ratio >= 0.15:
        return "positif"
    elif 0 <= ratio < 0.15:
        return "impas"
    else:
        return "negatif"

def build_dashboard_recommendation_prompt(period: str, nt: float, inv: float, status: str) -> str:
    matrix = RECOMMENDATION_MATRIX[status]
    return f"""\
{SYSTEM_PERSONA}

Data Dashboard Periode: {period}
- Total Nilai Tambah: Rp{nt:,.0f}
- Total Investasi/Modal: Rp{inv:,.0f}
- Status Performa: {status.upper()}
- Fokus Rekomendasi (Wajib): {matrix['fokus']}
- Aksi Produktivitas (Wajib): {matrix['aksi']}

Tuliskan paragraf pembuka singkat (3-4 kalimat) yang merangkum kondisi keuangan periode ini, \
dan jelaskan mengapa "Fokus Rekomendasi" dan "Aksi Produktivitas" di atas sangat cocok untuk mereka jalankan saat ini.
"""

def build_chat_system_context(period: str, nt: float, inv: float) -> str:
    status = get_status_from_ratio(nt, inv)
    return f"""\
{SYSTEM_PERSONA}

Konteks Data Aktif yang Sedang Ditanyakan Pengguna:
- Periode/Tahun: {period}
- Total Nilai Tambah: Rp{nt:,.0f}
- Total Investasi: Rp{inv:,.0f}
- Status Kesimpulan: {status.upper()}

Gunakan data di atas sebagai landasan jika pengguna bertanya tentang strategi bisnisnya.
"""