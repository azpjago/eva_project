// ===== RINGKASAN VIEW =====
function updateRingkasanView() {
    const container = document.getElementById('ringkasan-content');
    if (!container) return;

    const activePanels = document.querySelectorAll('.year-panel:not([data-year-id="template"])');

    if (activePanels.length === 0) {
        container.innerHTML = `
            <div class="bg-slate-800/70 rounded-2xl border border-dashed border-slate-600 px-6 py-12 text-center fade-in">
                <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                    <i class="fa-solid fa-chart-pie text-xl"></i>
                </div>
                <h2 class="text-lg font-bold text-white mb-2">Belum Ada Data Visualisasi</h2>
                <p class="text-sm text-slate-400 max-w-md mx-auto mb-5">Silakan tambahkan dan isi data keuangan di Kalkulator EVA terlebih dahulu agar visualisasi rangkuman dapat ditampilkan di sini.</p>
                <button type="button" onclick="switchView('input-data')" class="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition inline-flex items-center gap-2">
                    <i class="fa-solid fa-arrow-right"></i> Ke Kalkulator EVA
                </button>
            </div>
        `;
        return;
    }

    let htmlContent = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">';

    activePanels.forEach((panel, index) => {
        const yearId = panel.dataset.yearId;
        const title = yearMeta[yearId]?.title || `Tahun ${index + 1} (Belum Dinamai)`;

        const getValue = (key) => {
            const el = panel.querySelector(`[data-result="${key}"]`);
            return el ? el.textContent : 'Rp0';
        };

        htmlContent += `
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-teal-500/50 transition-colors duration-300">
                <div class="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-calendar-days text-teal-400"></i> ${title}
                    </h3>
                    <span class="px-3 py-1 bg-teal-500/10 text-teal-400 text-[10px] uppercase font-bold rounded-lg border border-teal-500/20">Data Analisis</span>
                </div>
                <div class="space-y-4">
                    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Nilai Tambah</p>
                        <p class="text-2xl font-extrabold text-teal-400">${getValue('total_nilai_tambah')}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Penjualan</p>
                            <p class="text-sm font-bold text-white">${getValue('penjualan')}</p>
                        </div>
                        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bahan Digunakan</p>
                            <p class="text-sm font-bold text-white">${getValue('bahan_digunakan')}</p>
                        </div>
                        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Overhead Produksi</p>
                            <p class="text-sm font-bold text-white">${getValue('overhead_produksi')}</p>
                        </div>
                        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Biaya Administrasi</p>
                            <p class="text-sm font-bold text-white">${getValue('biaya_administrasi')}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    htmlContent += '</div>';
    container.innerHTML = htmlContent;
}