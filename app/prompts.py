"""Prompt engineering for the prescriptive AI assistant.

Encodes the recommendation matrix from the brief:

| Hasil EVA | Fokus Rekomendasi AI                     | Aksi Produktivitas (Kemnaker)                  |
|-----------|-------------------------------------------|-------------------------------------------------|
| EVA > 0   | Ekspansi modal & investasi SDM unggul      | Insentif kerja & program vokasi lanjutan         |
| EVA = 0   | Optimalisasi proses operasional            | Evaluasi efisiensi jam kerja & beban tugas       |
| EVA < 0   | Rasionalisasi biaya & restrukturisasi      | Konsultasi & coaching produktivitas intensif     |
"""

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
Tugasmu adalah menjelaskan hasil perhitungan Economic Value Added (EVA) \
suatu perusahaan kepada pengguna non-teknis (mis. HR/manajemen), lalu \
memberi rekomendasi bisnis yang preskriptif dan bisa langsung ditindaklanjuti.

Aturan:
- Jangan pernah menghitung ulang atau mengoreksi angka EVA/NOPAT/WACC — \
angka tersebut sudah dihitung sistem dan bersifat final.
- Selalu kaitkan narasimu dengan fokus rekomendasi dan aksi produktivitas \
yang diberikan di konteks.
- Gunakan bahasa Indonesia yang profesional tapi mudah dipahami, singkat \
(maksimal 3-4 kalimat untuk narasi awal).
- Jangan mengarang data perusahaan yang tidak ada di konteks.
"""


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
