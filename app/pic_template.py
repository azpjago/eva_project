"""
Template struktur organisasi default untuk PIC.
Dipanggil otomatis saat user pertama kali buka tab PIC.
User bisa edit/hapus/tambah setelah di-seed.
"""

# Struktur: (nama_jabatan, departemen, level, parent_index, kategori_tanggung_jawab, urutan)
# parent_index = index di list ini (0-based), None = root
# level: 0=RUPS, 1=Dewan/Direktur Utama, 2=Direktur, 3=Manager, 4=Supervisor

PIC_TEMPLATE = [
    # ===== LEVEL 0: RUPS =====
    ("RUPS", "Governance", 0, None, [], 0),
    
    # ===== LEVEL 1: Dewan Komisaris =====
    ("Dewan Komisaris", "Governance", 1, 0, [], 0),
    ("Komite Nominasi & Remunerasi", "Governance", 2, 1, ["governance"], 0),
    ("Komite Audit", "Governance", 2, 1, ["compliance", "governance"], 1),
    ("Internal Audit", "Governance", 3, 3, ["compliance", "governance"], 0),
    
    # ===== LEVEL 1: Direktur Utama =====
    ("Direktur Utama", "Executive", 1, 1, ["strategic"], 1),
    ("Sekretaris Perusahaan & Hubungan Investor", "Executive", 2, 5, ["compliance"], 0),
    
    # ===== Direktur Keuangan =====
    ("Direktur Keuangan", "Keuangan", 2, 5, ["finance_cost", "profit"], 1),
    ("Tax & Payroll", "Keuangan", 3, 7, ["tax", "payroll"], 0),
    ("Export Import", "Keuangan", 3, 7, ["compliance"], 1),
    ("Finance Accounting", "Keuangan", 3, 7, ["finance_cost", "profit", "admin_cost"], 2),
    ("Controlling", "Keuangan", 3, 7, ["finance_cost", "admin_cost"], 3),
    ("FPMR", "Keuangan", 3, 7, ["finance_cost"], 4),
    
    # ===== Direktur Operasional =====
    ("Direktur Operasional", "Operasional", 2, 5, ["operasional", "productivity"], 2),
    ("Legal", "Operasional", 3, 13, ["legal", "compliance"], 0),
    ("HRD & GA", "Operasional", 3, 13, ["labor_cost", "admin_cost"], 1),
    ("RnD", "Operasional", 3, 13, ["productivity", "quality"], 2),
    ("IT", "Operasional", 3, 13, ["it_support"], 3),
    ("Plant Manager", "Operasional", 3, 13, ["overhead_cost", "productivity", "quality"], 4),
    # Sub dari Plant Manager (level 4)
    ("Gudang", "Produksi", 4, 18, ["supply_chain", "material_cost"], 0),
    ("QC", "Produksi", 4, 18, ["quality"], 1),
    ("Maintenance", "Produksi", 4, 18, ["maintenance", "overhead_cost"], 2),
    ("Sterilisasi", "Produksi", 4, 18, ["quality"], 3),
    ("Assembling", "Produksi", 4, 18, ["productivity"], 4),
    ("OOM & HSE", "Produksi", 4, 18, ["compliance", "quality"], 5),
    ("Produksi", "Produksi", 4, 18, ["overhead_cost", "productivity"], 6),
    ("Teknik", "Produksi", 4, 18, ["maintenance", "overhead_cost"], 7),
    ("PPIC", "Produksi", 4, 18, ["supply_chain", "productivity"], 8),
    ("Pembelian", "Produksi", 4, 18, ["material_cost", "supply_chain"], 9),
    
    # ===== Direktur Pemasaran =====
    ("Direktur Pemasaran", "Pemasaran", 2, 5, ["sales_revenue"], 3),
    ("Pemasaran", "Pemasaran", 3, 29, ["sales_revenue"], 0),
]


# Daftar kategori standar untuk UI (bisa dipakai dropdown)
STANDARD_CATEGORIES = [
    {"id": "strategic", "label": "Strategi Perusahaan", "icon": "fa-chess-king"},
    {"id": "sales_revenue", "label": "Penjualan & Pendapatan", "icon": "fa-chart-line"},
    {"id": "labor_cost", "label": "Biaya Tenaga Kerja", "icon": "fa-users"},
    {"id": "material_cost", "label": "Bahan & Material", "icon": "fa-boxes-stacked"},
    {"id": "overhead_cost", "label": "Overhead Produksi", "icon": "fa-industry"},
    {"id": "finance_cost", "label": "Biaya Keuangan & Investasi", "icon": "fa-coins"},
    {"id": "admin_cost", "label": "Biaya Administrasi", "icon": "fa-file-invoice"},
    {"id": "tax", "label": "Pajak", "icon": "fa-landmark"},
    {"id": "payroll", "label": "Penggajian", "icon": "fa-money-check-dollar"},
    {"id": "profit", "label": "Laba & Profitabilitas", "icon": "fa-sack-dollar"},
    {"id": "productivity", "label": "Produktivitas", "icon": "fa-gauge-high"},
    {"id": "quality", "label": "Kualitas", "icon": "fa-certificate"},
    {"id": "supply_chain", "label": "Supply Chain", "icon": "fa-truck-fast"},
    {"id": "maintenance", "label": "Pemeliharaan", "icon": "fa-screwdriver-wrench"},
    {"id": "operasional", "label": "Operasional Umum", "icon": "fa-gears"},
    {"id": "compliance", "label": "Kepatuhan & Audit", "icon": "fa-shield-halved"},
    {"id": "legal", "label": "Legal", "icon": "fa-scale-balanced"},
    {"id": "it_support", "label": "IT & Sistem", "icon": "fa-laptop-code"},
    {"id": "governance", "label": "Tata Kelola", "icon": "fa-building-columns"},
]