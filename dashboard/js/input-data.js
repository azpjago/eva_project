// ===== INPUT DATA (KALKULATOR EVA) =====
let yearCount = 0;
let activeYearId = null;
const yearMeta = {};
const CURRENCY_GROUPS = [
    'penjualan', 'biaya_tenaga_kerja', 'bahan_digunakan', 'overhead_produksi',
    'bunga_pinjaman', 'biaya_administrasi', 'penyusutan', 'pajak',
    'aktiva', 'laba'
];

// ===== GENERATE PANEL TEMPLATE =====
function generateYearPanelHTML(yearId) {
    return `
    <div class="year-panel hidden space-y-6" data-year-id="${yearId}">
        <!-- Penjualan -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden" open>
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-cart-shopping w-4 text-teal-400"></i> Penjualan
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="penjualan" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Total Penjualan / Pendapatan (Rp)</label>
                    <input type="number" min="0" data-group="penjualan" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Jumlah Unit Terjual (unit)</label>
                    <input type="number" min="0" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Harga Jual Rata-rata (Rp)</label>
                    <input type="number" min="0" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Pertumbuhan Penjualan (%)</label>
                    <input type="number" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Penjualan Periode Sebelumnya (Rp)</label>
                    <input type="number" min="0" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Biaya Tenaga Kerja -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-users w-4 text-teal-400"></i> Biaya Tenaga Kerja
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="biaya_tenaga_kerja" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Upah dan Gaji (Rp)</label>
                    <input type="number" min="0" data-group="biaya_tenaga_kerja" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Dana Pensiun (Rp)</label>
                    <input type="number" min="0" data-group="biaya_tenaga_kerja" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Tunjangan-tunjangan Tenaga Kerja (Rp)</label>
                    <input type="number" min="0" data-group="biaya_tenaga_kerja" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Bahan yang Digunakan -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-boxes-stacked w-4 text-teal-400"></i> Bahan yang Digunakan
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="bahan_digunakan" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Barang dan Jasa yang Dibeli (Rp)</label>
                    <input type="number" min="0" data-group="bahan_digunakan" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Barang yang Digunakan (Rp)</label>
                    <input type="number" min="0" data-group="bahan_digunakan" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Bahan Baku (Rp)</label>
                    <input type="number" min="0" data-group="bahan_digunakan" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Bahan Pengemas (Rp)</label>
                    <input type="number" min="0" data-group="bahan_digunakan" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Overhead Produksi -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-industry w-4 text-teal-400"></i> Overhead Produksi
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="overhead_produksi" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Pekerjaan Sub Kontrak (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Sewa (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Air dan Listrik (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Asuransi Perusahaan (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Transport (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Pemeliharaan Mesin (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Suplai dan Gudang (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Lain-lain (Rp)</label>
                    <input type="number" min="0" data-group="overhead_produksi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Bunga Pinjaman -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-percent w-4 text-teal-400"></i> Bunga Pinjaman
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="bunga_pinjaman" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Bunga Pinjaman Jangka Pendek (Rp)</label>
                    <input type="number" min="0" data-group="bunga_pinjaman" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Bunga Pinjaman Jangka Panjang (Rp)</label>
                    <input type="number" min="0" data-group="bunga_pinjaman" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Biaya Administrasi -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-file-invoice w-4 text-teal-400"></i> Biaya Administrasi
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="biaya_administrasi" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Sewa (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Air dan Listrik (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Telepon, Pos dan Telegram (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Percetakan, Stationary & Office Supplies (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Kendaraan (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Advertising (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Hiburan / Entertainment (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Majalah dan Surat Kabar (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Jamuan Makan (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Perbaikan Umum (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Bank (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Akuntan dan Audit (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Bantuan Hukum & Jasa Profesional (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Komisi (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Biaya Umum (Rp)</label>
                    <input type="number" min="0" data-group="biaya_administrasi" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Penyusutan -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-arrow-trend-down w-4 text-teal-400"></i> Penyusutan
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="penyusutan" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Penyusutan Gedung (Rp)</label>
                    <input type="number" min="0" data-group="penyusutan" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Penyusutan Peralatan dan Mesin (Rp)</label>
                    <input type="number" min="0" data-group="penyusutan" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Pajak -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-landmark w-4 text-teal-400"></i> Pajak
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="pajak" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Pajak Penghasilan (Rp)</label>
                    <input type="number" min="0" data-group="pajak" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Pajak Kekayaan (Rp)</label>
                    <input type="number" min="0" data-group="pajak" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Pajak Upah (Rp)</label>
                    <input type="number" min="0" data-group="pajak" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- Aktiva Perusahaan -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-building w-4 text-teal-400"></i> Aktiva Perusahaan
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Total: <span data-total="aktiva" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Kas dan Bank (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Persediaan (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Piutang Dagang (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Piutang dan Lain-lain (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Tanah (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Gedung (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Mesin dan Peralatan (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Aktiva Tetap Lainnya (Rp)</label>
                    <input type="number" min="0" data-group="aktiva" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
            </div>
        </details>

        <!-- ===== LABA (AUTO GENERATED) ===== -->
        <details class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <summary class="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-sack-dollar w-4 text-teal-400"></i> Laba (Otomatis)
                </span>
                <span class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">Bersih: <span data-total="laba" class="text-teal-400 font-bold">Rp0</span></span>
                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs chevron"></i>
                </span>
            </summary>
            <div class="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Laba Kotor (Rp)</label>
                    <input type="text" data-field="laba_kotor" readonly 
                           class="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600 text-base md:text-sm text-slate-300 cursor-not-allowed" 
                           placeholder="Auto">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Laba Operasi (Rp)</label>
                    <input type="text" data-field="laba_operasi" readonly 
                           class="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600 text-base md:text-sm text-slate-300 cursor-not-allowed" 
                           placeholder="Auto">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Laba Bersih (Rp)</label>
                    <input type="text" data-field="laba_bersih" readonly 
                           class="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600 text-base md:text-sm text-slate-300 cursor-not-allowed" 
                           placeholder="Auto">
                </div>
            </div>
        </details>

        <!-- Investasi & Produktivitas -->
        <div class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div class="px-5 py-4 flex items-center gap-2 border-b border-slate-700">
                <i class="fa-solid fa-user-clock w-4 text-teal-400"></i>
                <span class="font-bold text-white text-sm">Investasi & Produktivitas</span>
            </div>
            <div class="px-5 pb-5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Total Investasi (Rp)</label>
                    <input type="number" min="0" data-field="total_investasi" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                    <p class="mt-1.5 text-[11px] text-slate-500">Modal/investasi yang digunakan perusahaan pada periode tahun tersebut.</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Jumlah Tenaga Kerja (orang)</label>
                    <input type="number" min="0" data-field="jumlah_tenaga_kerja" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Jumlah Jam Kerja (jam)</label>
                    <input type="number" min="0" data-field="jumlah_jam_kerja" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Jumlah Jam Lembur (jam)</label>
                    <input type="number" min="0" data-field="jumlah_jam_lembur" oninput="recomputeTotals()" placeholder="0" class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-base md:text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5">Total Jam Kerja (jam)</label>
                    <input type="number" data-field="total_jam_kerja" readonly class="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600 text-base md:text-sm text-slate-300 cursor-not-allowed" placeholder="Otomatis">
                </div>
            </div>
        </div>
        
        <!-- Total Nilai Tambah -->
        <div class="bg-gradient-to-r from-teal-500/10 to-slate-800 rounded-2xl border border-teal-500/30 p-6">
            <div class="flex items-center justify-between gap-4">
                <div>
                    <div class="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
                        Total Nilai Tambah
                    </div>
                    <p class="text-xs text-slate-400">
                        Hasil dari pengurangan Total Penjualan dengan Bahan Digunakan, Overhead Produksi, dan Biaya Administrasi.
                    </p>
                </div>
                <div data-result="total_nilai_tambah" class="text-2xl md:text-3xl font-extrabold text-teal-400 whitespace-nowrap">
                    Rp0
                </div>
            </div>
        </div>

        <!-- Rangkuman -->
        <div class="bg-slate-800 rounded-2xl border border-teal-500/30 p-6">
            <h2 class="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <i class="fa-solid fa-square-root-variable"></i> Rangkuman Perhitungan Nilai Tambah
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <div class="text-slate-400 text-xs mb-1">Total Penjualan</div>
                    <div data-result="penjualan" class="font-bold text-white">Rp0</div>
                </div>
                <div>
                    <div class="text-slate-400 text-xs mb-1">Bahan Digunakan</div>
                    <div data-result="bahan_digunakan" class="font-bold text-white">Rp0</div>
                </div>
                <div>
                    <div class="text-slate-400 text-xs mb-1">Overhead Produksi</div>
                    <div data-result="overhead_produksi" class="font-bold text-white">Rp0</div>
                </div>
                <div>
                    <div class="text-slate-400 text-xs mb-1">Biaya Administrasi</div>
                    <div data-result="biaya_administrasi" class="font-bold text-white">Rp0</div>
                </div>
            </div>
            <div class="mt-5 pt-5 border-t border-slate-700 flex items-center justify-between">
                <span class="text-slate-300 font-semibold text-sm">Total Nilai Tambah</span>
                <span data-result="total_ringkasan" class="text-2xl font-extrabold text-teal-400">Rp0</span>
            </div>
        </div>

        <div class="flex justify-end gap-3 pb-4">
            <button type="button" onclick="resetInputData()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 transition flex items-center gap-2">
                <i class="fa-solid fa-rotate-left"></i> Reset Form
            </button>
            <button type="button" id="btnSaveData" onclick="saveDataToServer()" class="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-teal-500 hover:bg-teal-400 transition flex items-center gap-2 shadow-lg shadow-teal-500/20">
                <i class="fa-solid fa-floppy-disk"></i> Simpan Analisis
            </button>
        </div>
    </div>
    `;
}

// ===== YEAR MANAGEMENT FUNCTIONS =====
function getYearPanel(yearId = activeYearId) {
    if (!yearId) return null;
    return document.querySelector(`.year-panel[data-year-id="${yearId}"]`);
}

function updateYearEmptyState() {
    const empty = document.getElementById('emptyYearState');
    const panels = document.getElementById('yearPanels');
    const hasData = yearCount > 0;
    empty.classList.toggle('hidden', hasData);
    panels.classList.toggle('hidden', !hasData);
}

function renderYearTabs() {
    const list = document.getElementById('yearTabsList');
    list.innerHTML = '';

    if (yearCount === 0) {
        const hint = document.createElement('div');
        hint.className = 'w-full flex items-center justify-center';
        hint.innerHTML = '<span class="text-sm text-slate-500">Tab tahun akan muncul di sini setelah Anda menambahkan data</span>';
        list.appendChild(hint);
        updateYearEmptyState();
        return;
    }

    Object.keys(yearMeta).forEach((yearId, index) => {
        const meta = yearMeta[yearId];
        const active = yearId === activeYearId;

        const tab = document.createElement('div');
        tab.className = `group flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-t-xl border border-b-0 transition ${
            active
                ? 'bg-slate-900 border-slate-700 text-teal-400'
                : 'bg-slate-800/70 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`;

        const iconButton = document.createElement('button');
        iconButton.type = 'button';
        iconButton.className = `flex items-center justify-center text-xs ${active ? 'text-teal-400' : 'text-slate-500'}`;
        iconButton.innerHTML = '<i class="fa-solid fa-calendar-days"></i>';
        iconButton.title = 'Buka data tahun ini';
        iconButton.addEventListener('click', () => activateYear(yearId));

        const input = document.createElement('input');
        input.type = 'text';
        input.value = meta.title;
        input.placeholder = 'Tahun';
        input.title = 'Edit judul tab secara langsung';
        input.className = `w-24 bg-transparent outline-none border-b border-transparent focus:border-teal-500 text-base md:text-sm font-bold ${active ? 'text-teal-400' : 'text-slate-300'}`;
        
        input.addEventListener('click', e => {
            e.stopPropagation();
            setActiveYearVisual(yearId);
        });
        input.addEventListener('mousedown', e => {
            e.stopPropagation();
            setActiveYearVisual(yearId);
        });
        input.addEventListener('focus', () => setActiveYearVisual(yearId));
        input.addEventListener('input', e => {
            yearMeta[yearId].title = e.target.value;
            updateRingkasanView(); 
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = `ml-1 w-6 h-6 rounded-md flex items-center justify-center text-xs transition ${active ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/10'}`;
        deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteButton.title = `Hapus data ${meta.title || 'tahun ini'}`;
        deleteButton.addEventListener('mousedown', e => e.stopPropagation());
        deleteButton.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            deleteYear(yearId);
        });

        tab.appendChild(iconButton);
        tab.appendChild(input);
        tab.appendChild(deleteButton);
        list.appendChild(tab);
    });

    const addWrap = document.createElement('div');
    addWrap.className = 'shrink-0 ml-1';
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.onclick = addYear;
    addButton.className = 'w-10 h-10 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-teal-400 hover:border-teal-500/60 hover:bg-teal-500/5 transition flex items-center justify-center';
    addButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
    addButton.title = 'Tambah data keuangan tahun baru';
    addWrap.appendChild(addButton);
    list.appendChild(addWrap);

    updateYearEmptyState();
}

function setActiveYearVisual(yearId) {
    if (!yearMeta[yearId]) return;
    activeYearId = yearId;

    document.querySelectorAll('.year-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.yearId !== yearId);
    });

    document.querySelectorAll('#yearTabsList > div.group').forEach(tab => {
        tab.classList.remove('bg-slate-900', 'border-slate-700', 'text-teal-400');
        tab.classList.add('bg-slate-800/70', 'border-transparent', 'text-slate-400');
    });

    const ids = Object.keys(yearMeta);
    const index = ids.indexOf(yearId);
    const tabs = document.querySelectorAll('#yearTabsList > div.group');
    if (index >= 0 && tabs[index]) {
        const activeTab = tabs[index];
        activeTab.classList.remove('bg-slate-800/70', 'border-transparent', 'text-slate-400');
        activeTab.classList.add('bg-slate-900', 'border-slate-700', 'text-teal-400');
        const tabInput = activeTab.querySelector('input');
        if (tabInput) {
            tabInput.classList.remove('text-slate-300');
            tabInput.classList.add('text-teal-400');
        }
    }

    recomputeTotals(getYearPanel(yearId));
}

function activateYear(yearId) {
    if (!yearMeta[yearId]) return;
    activeYearId = yearId;

    document.querySelectorAll('.year-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.yearId !== yearId);
    });

    renderYearTabs();
    recomputeTotals(getYearPanel(yearId));
}

function deleteYear(yearId) {
    if (!yearMeta[yearId]) return;

    const title = (yearMeta[yearId].title || '').trim();
    const label = title || 'tahun ini';
    const confirmed = window.confirm(`Hapus data ${label}? Semua input keuangan pada tab ini akan dihapus.`);
    if (!confirmed) return;

    const ids = Object.keys(yearMeta);
    const deletedIndex = ids.indexOf(yearId);
    const wasActive = activeYearId === yearId;

    delete yearMeta[yearId];
    const panel = document.querySelector(`.year-panel[data-year-id="${yearId}"]`);
    if (panel) panel.remove();

    yearCount = Object.keys(yearMeta).length;

    if (yearCount === 0) {
        activeYearId = null;
        renderYearTabs();
        updateYearEmptyState();
        updateRingkasanView();
        return;
    }

    if (wasActive) {
        const remainingIds = Object.keys(yearMeta);
        const fallbackIndex = Math.min(Math.max(deletedIndex - 1, 0), remainingIds.length - 1);
        activeYearId = remainingIds[fallbackIndex];
    } else if (!yearMeta[activeYearId]) {
        activeYearId = Object.keys(yearMeta)[0];
    }

    renderYearTabs();
    document.querySelectorAll('.year-panel').forEach(panelEl => {
        panelEl.classList.toggle('hidden', panelEl.dataset.yearId !== activeYearId);
    });
    recomputeTotals(getYearPanel(activeYearId));
    updateRingkasanView();
}

function addYear() {
    yearCount += 1;
    const newYearId = `year-${yearCount}`;
    yearMeta[newYearId] = { title: '' };

    const panelsContainer = document.getElementById('yearPanels');
    const newPanelHTML = generateYearPanelHTML(newYearId);
    
    const templatePanel = panelsContainer.querySelector('.year-panel[data-year-id="template"]');
    if (templatePanel) {
        templatePanel.insertAdjacentHTML('beforebegin', newPanelHTML);
    } else {
        panelsContainer.insertAdjacentHTML('beforeend', newPanelHTML);
    }

    const newPanel = document.querySelector(`.year-panel[data-year-id="${newYearId}"]`);
    newPanel.classList.remove('hidden');

    activeYearId = newYearId;
    activateYear(newYearId);

    requestAnimationFrame(() => {
        const inputs = [...document.querySelectorAll('#yearTabsList input')];
        const newTitleInput = inputs[inputs.length - 1];
        if (newTitleInput) {
            newTitleInput.focus();
            newTitleInput.select();
        }
    });
    updateRingkasanView();
}

// ===== COMPUTATION FUNCTIONS =====
function sumGroup(panel, group) {
    let sum = 0;
    panel.querySelectorAll(`input[data-group="${group}"]`).forEach(input => {
        sum += parseFloat(input.value) || 0;
    });
    return sum;
}

function setResult(panel, key, value) {
    const resultEl = panel.querySelector(`[data-result="${key}"]`);
    if (resultEl) {
        resultEl.textContent = formatRupiah(value);
    }
}

// ===== FUNGSI PERHITUNGAN LABA OTOMATIS =====
function calculateProfits(panel) {
    // Ambil total penjualan
    const penjualan = sumGroup(panel, 'penjualan');
    
    // Biaya operasional (masuk laba operasi)
    const biayaOperasional = 
        sumGroup(panel, 'biaya_tenaga_kerja') +
        sumGroup(panel, 'bahan_digunakan') +
        sumGroup(panel, 'overhead_produksi') +
        sumGroup(panel, 'biaya_administrasi') +
        sumGroup(panel, 'penyusutan');
    
    // Biaya non-operasional (tidak masuk laba operasi)
    const biayaNonOperasional = 
        sumGroup(panel, 'bunga_pinjaman') +
        sumGroup(panel, 'pajak');
    
    // Laba Kotor = Penjualan - Bahan Digunakan
    const labaKotor = penjualan - sumGroup(panel, 'bahan_digunakan');
    
    // Laba Operasi = Penjualan - Biaya Operasional
    const labaOperasi = penjualan - biayaOperasional;
    
    // Laba Bersih = Laba Operasi - Biaya Non-Operasional
    const labaBersih = labaOperasi - biayaNonOperasional;
    
    return { labaKotor, labaOperasi, labaBersih };
}

function recomputeTotals(panel = getYearPanel()) {
    if (!panel) return;

    // Hitung total per kelompok
    const totals = Object.fromEntries(
        CURRENCY_GROUPS.map(group => [group, sumGroup(panel, group)])
    );

    // Update total per kategori di summary
    CURRENCY_GROUPS.forEach(group => {
        const totalEl = panel.querySelector(`[data-total="${group}"]`);
        if (totalEl) {
            totalEl.textContent = formatRupiah(totals[group]);
        }
    });

    // Hitung Nilai Tambah
    const nilaiTambah =
        (totals.penjualan || 0) -
        (totals.bahan_digunakan || 0) -
        (totals.overhead_produksi || 0) -
        (totals.biaya_administrasi || 0);

    setResult(panel, 'penjualan', totals.penjualan);
    setResult(panel, 'bahan_digunakan', totals.bahan_digunakan);
    setResult(panel, 'overhead_produksi', totals.overhead_produksi);
    setResult(panel, 'biaya_administrasi', totals.biaya_administrasi);
    setResult(panel, 'total_nilai_tambah', nilaiTambah);
    setResult(panel, 'total_ringkasan', nilaiTambah);

    // ===== LABA OTOMATIS =====
    const profit = calculateProfits(panel);
    const labaKotorInput = panel.querySelector('input[data-field="laba_kotor"]');
    const labaOperasiInput = panel.querySelector('input[data-field="laba_operasi"]');
    const labaBersihInput = panel.querySelector('input[data-field="laba_bersih"]');
    if (labaKotorInput) labaKotorInput.value = formatRupiah(profit.labaKotor);
    if (labaOperasiInput) labaOperasiInput.value = formatRupiah(profit.labaOperasi);
    if (labaBersihInput) labaBersihInput.value = formatRupiah(profit.labaBersih);

    // Update total laba di summary (pakai laba bersih)
    const totalLabaEl = panel.querySelector('[data-total="laba"]');
    if (totalLabaEl) {
        totalLabaEl.textContent = formatRupiah(profit.labaBersih);
    }

    // ===== TOTAL INVESTASI OTOMATIS DARI AKTIVA (TAPI BISA DIEDIT) =====
    const totalAktiva = sumGroup(panel, 'aktiva');
    const investasiInput = panel.querySelector('input[data-field="total_investasi"]');
    if (investasiInput) {
        const currentVal = parseFloat(investasiInput.value) || 0;
        // Hanya isi otomatis jika belum diubah manual (nilai 0 atau sama dengan total aktiva)
        if (currentVal === 0 || currentVal === totalAktiva) {
            investasiInput.value = totalAktiva; // langsung angka, bukan format Rupiah
        }
    }

    // ===== TOTAL JAM KERJA OTOMATIS =====
    const jamKerjaInput = panel.querySelector('input[data-field="jumlah_jam_kerja"]');
    const jamLemburInput = panel.querySelector('input[data-field="jumlah_jam_lembur"]');
    const totalJamKerjaInput = panel.querySelector('input[data-field="total_jam_kerja"]');
    if (totalJamKerjaInput) {
        const jamKerja = parseFloat(jamKerjaInput?.value) || 0;
        const jamLembur = parseFloat(jamLemburInput?.value) || 0;
        totalJamKerjaInput.value = jamKerja + jamLembur;
    }

    updateRingkasanView();
}

function resetInputData() {
    const panel = getYearPanel();
    if (!panel) return;

    panel.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '';
    });

    recomputeTotals(panel);
}

// ===== DATABASE INTEGRATION =====
// ===== LOAD DATA FROM SERVER =====
async function loadDataFromServer() {
    const token = localStorage.getItem('eva_token');
    if (!token) {
        console.warn("Token tidak ditemukan, lewati load data.");
        return;
    }

    try {
        console.log("📡 Mengambil data dari /api/eva/history...");
        const response = await fetch('/api/eva/history', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("📊 Response status:", response.status);

        if (response.status === 401) {
            console.warn("Token tidak valid atau expired. Redirect ke login.");
            localStorage.removeItem('eva_token');
            window.location.href = '/login';
            return;
        }

        if (response.status === 404) {
            console.error("❌ Endpoint /api/eva/history tidak ditemukan (404). Periksa backend.");
            // Tampilkan pesan ke user (opsional)
            // alert("Endpoint history belum tersedia. Silakan hubungi admin.");
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Gagal load data:", response.status, errorText);
            return;
        }

        const data = await response.json();
        console.log("✅ Data dari server:", data);

        if (!data || data.length === 0) {
            console.log("ℹ️ Tidak ada data history.");
            return;
        }

        // Hapus semua panel kecuali template
        document.querySelectorAll('.year-panel:not([data-year-id="template"])').forEach(p => p.remove());
        for (let key in yearMeta) delete yearMeta[key];
        yearCount = 0;

        data.forEach((record) => {
            yearCount += 1;
            const newYearId = `year-${yearCount}`;
            yearMeta[newYearId] = { title: record.year_title };

            const panelsContainer = document.getElementById('yearPanels');
            const newPanelHTML = generateYearPanelHTML(newYearId);
            
            const templatePanel = panelsContainer.querySelector('.year-panel[data-year-id="template"]');
            if (templatePanel) {
                templatePanel.insertAdjacentHTML('beforebegin', newPanelHTML);
            } else {
                panelsContainer.insertAdjacentHTML('beforeend', newPanelHTML);
            }

            const newPanel = document.querySelector(`.year-panel[data-year-id="${newYearId}"]`);
            newPanel.classList.remove('hidden');

            try {
                const inputValues = JSON.parse(record.raw_data);
                const numberInputs = newPanel.querySelectorAll('input[type="number"]');
                numberInputs.forEach((inp, idx) => {
                    if (idx < inputValues.length) {
                        inp.value = inputValues[idx] || '';
                    }
                });
            } catch (e) {
                console.error("❌ Gagal mem-parsing raw_data", e);
            }

            recomputeTotals(newPanel);
        });

        const firstId = Object.keys(yearMeta)[0];
        if (firstId) {
            activeYearId = firstId;
        }
        
        renderYearTabs();
        if (activeYearId) activateYear(activeYearId);
        updateRingkasanView();

    } catch (err) {
        console.error("❌ Error saat load data:", err);
        // Tampilkan pesan error di console saja, tidak ganggu user
    }
}

// ===== SAVE DATA TO SERVER =====
async function saveDataToServer() {
    const token = localStorage.getItem('eva_token');
    if (!token) {
        alert("Sesi Anda telah habis. Silakan login kembali.");
        window.location.href = '/login';
        return;
    }

    const btn = document.getElementById('btnSaveData');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...`;
    btn.disabled = true;

    const activePanels = document.querySelectorAll('.year-panel:not([data-year-id="template"])');
    if (activePanels.length === 0) {
        alert("Tidak ada data keuangan untuk disimpan.");
        btn.disabled = false;
        btn.innerHTML = originalContent;
        return;
    }

    const payload = [];

    activePanels.forEach(panel => {
        const yearId = panel.dataset.yearId;
        const title = yearMeta[yearId]?.title || "Tahun Baru";
        
        // Ambil semua input number (kecuali yang readonly laba karena tidak ada di number)
        const inputValues = Array.from(panel.querySelectorAll('input[type="number"]')).map(inp => inp.value || '');
        const totalEl = panel.querySelector('[data-result="total_nilai_tambah"]');
        const nilaiTambah = totalEl ? parseFloat(totalEl.textContent.replace(/Rp|\./g, '').trim()) || 0 : 0;

        payload.push({
            year_title: title,
            raw_data: JSON.stringify(inputValues),
            nilai_tambah: nilaiTambah
        });
    });

    console.log("📤 Payload yang dikirim:", payload);

    try {
        const response = await fetch('/api/eva/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log("📥 Response status:", response.status);
        console.log("📄 Response body:", responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { detail: responseText };
        }

        if (!response.ok) {
            throw new Error(data.detail || `Gagal menyimpan data (status ${response.status})`);
        }
        
        alert("✅ Data analisis berhasil disimpan ke database!");
        updateRingkasanView();
    } catch (err) {
        console.error("❌ Error saat menyimpan:", err);
        alert("❌ Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}