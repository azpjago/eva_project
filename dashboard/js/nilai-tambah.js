// ===== NILAI TAMBAH =====
let nilaiTambahItems = [];
let currentYearNT = '';
let googleChartsReady = false;
let amenitiesValue = 0;

// Load Google Charts
(function initGoogleCharts() {
    if (typeof google === 'undefined' || !google.charts) {
        console.warn('Google Charts belum dimuat.');
        return;
    }
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        googleChartsReady = true;
        console.log('✅ Google Charts siap.');
        if (currentYearNT) renderPieChartNT();
    });
})();

// ===== INIT =====
function initNilaiTambah() {
    populateYearFilterNT();
    loadNilaiTambahData();
}

// ===== POPULATE FILTER TAHUN =====
function populateYearFilterNT() {
    const select = document.getElementById('filterTahunNT');
    const panels = document.querySelectorAll('.year-panel:not([data-year-id="template"])');
    const years = [];

    panels.forEach(panel => {
        const title = yearMeta[panel.dataset.yearId]?.title || '';
        if (title && !years.includes(title)) years.push(title);
    });

    years.sort((a, b) => b.localeCompare(a));

    select.innerHTML = '';
    if (years.length === 0) {
        select.innerHTML = '<option value="">(Belum ada data tahun)</option>';
        return;
    }

    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
    });

    select.value = years[0];
    currentYearNT = years[0];
}

// ===== LOAD DATA =====
function loadNilaiTambahData() {
    const year = document.getElementById('filterTahunNT').value;
    if (!year) {
        document.getElementById('ntTableContainer').innerHTML = 
            '<div class="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center text-slate-400">Belum ada data tahun.</div>';
        document.getElementById('pieChartNT').innerHTML = '';
        document.getElementById('legendNT').innerHTML = '';
        return;
    }
    currentYearNT = year;

    let targetPanel = null;
    document.querySelectorAll('.year-panel:not([data-year-id="template"])').forEach(p => {
        if ((yearMeta[p.dataset.yearId]?.title || '') === year) targetPanel = p;
    });

    if (!targetPanel) {
        document.getElementById('ntTableContainer').innerHTML = 
            '<div class="bg-slate-800/50 rounded-2xl border border-rose-500/30 p-12 text-center text-rose-400">Tidak ada data untuk tahun ini.</div>';
        return;
    }

    const getTotal = (group) => {
        const el = targetPanel.querySelector(`[data-total="${group}"]`);
        if (!el) return 0;
        return parseFloat(el.textContent.replace(/Rp|\./g, '').trim()) || 0;
    };

    // Reset amenities setiap kali ganti tahun
    amenitiesValue = 0;

    nilaiTambahItems = [
        { id: 'penjualan', label: 'Penjualan', value: getTotal('penjualan'), isTop: true },
        { id: 'bahan', label: 'Bahan Baku & Bahan Penolong', value: getTotal('bahan_digunakan') },
        { id: 'amenities', label: 'Bahan Amenities', value: 0, editable: true },
        { id: 'overhead', label: 'Biaya Overhead Produksi', value: getTotal('overhead_produksi') },
        { id: 'administrasi', label: 'Biaya Administrasi & Umum', value: getTotal('biaya_administrasi') },
        { id: 'tenaga_kerja', label: 'Biaya Tenaga Kerja', value: getTotal('biaya_tenaga_kerja') },
        { id: 'penyusutan', label: 'Penyusutan', value: getTotal('penyusutan') },
        { id: 'pajak', label: 'Pajak', value: getTotal('pajak') },
        { id: 'bunga', label: 'Bunga Bank', value: getTotal('bunga_pinjaman') },
    ];

    renderNTTable();
    renderPieChartNT();
}

// ===== RENDER TABEL (compact, read-only kecuali amenities) =====
function renderNTTable() {
    const pjItem = nilaiTambahItems.find(i => i.id === 'penjualan');
    const deductions = nilaiTambahItems.filter(i => !i.isTop);
    const penjualan = parseFloat(pjItem.value) || 0;
    const totalDeduction = deductions.reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0);
    const laba = penjualan - totalDeduction;
    const labaColor = laba >= 0 ? 'text-emerald-400' : 'text-rose-400';

    let html = `
        <div class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div class="px-5 py-3 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-table-list text-teal-400"></i> Rincian Nilai Tambah — ${currentYearNT}
                </h3>
                <span class="text-[10px] uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded border border-teal-500/20">
                    <i class="fa-solid fa-lock text-[8px] mr-1"></i>Read-only
                </span>
            </div>
            <table class="w-full text-sm">
                <tbody>
                    <!-- Penjualan -->
                    <tr class="bg-teal-500/10 border-b border-teal-500/30">
                        <td class="px-4 py-2.5 w-8">
                            <i class="fa-solid fa-caret-right text-teal-400 text-xs"></i>
                        </td>
                        <td class="px-3 py-2.5 font-bold text-teal-300">Penjualan</td>
                        <td class="px-4 py-2.5 text-right font-bold text-teal-300 tabular-nums">
                            ${formatRupiah(penjualan)}
                        </td>
                    </tr>

                    <tr>
                        <td colspan="3" class="px-4 py-1.5 text-[11px] text-slate-500 italic border-b border-slate-700/50 bg-slate-900/30">
                            Dikurangi oleh:
                        </td>
                    </tr>
    `;

    // Baris 1-8
    deductions.forEach((item, idx) => {
        if (item.editable) {
            // Amenities — editable
            html += `
                <tr class="border-b border-slate-700/50 bg-amber-500/5">
                    <td class="px-4 py-2 text-center text-slate-500 font-mono text-xs">${idx + 1}.</td>
                    <td class="px-3 py-2 text-amber-300 font-medium">
                        ${item.label}
                        <span class="text-[10px] text-amber-400/70 italic ml-1">(editable)</span>
                    </td>
                    <td class="px-4 py-2 text-right">
                        <input type="number" data-nt-id="${item.id}" value="${item.value}"
                               oninput="onAmenitiesInput(this)"
                               placeholder="0"
                               class="bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1 text-right text-amber-200 font-semibold w-44 focus:ring-2 focus:ring-amber-500 outline-none tabular-nums text-sm">
                    </td>
                </tr>
            `;
        } else {
            // Read-only
            html += `
                <tr class="border-b border-slate-700/50 hover:bg-slate-700/10 transition">
                    <td class="px-4 py-2 text-center text-slate-500 font-mono text-xs">${idx + 1}.</td>
                    <td class="px-3 py-2 text-slate-300">${item.label}</td>
                    <td class="px-4 py-2 text-right text-white tabular-nums">
                        ${formatRupiah(item.value)}
                    </td>
                </tr>
            `;
        }
    });

    // Laba
    html += `
                    <tr class="border-t-2 border-slate-500 bg-slate-900/70">
                        <td class="px-4 py-3"></td>
                        <td class="px-3 py-3 font-bold text-white text-base">
                            <i class="fa-solid fa-equals text-slate-500 mr-2 text-xs"></i>Laba
                        </td>
                        <td class="px-4 py-3 text-right">
                            <span id="ntLabaValue" class="font-extrabold ${labaColor} text-base tabular-nums">
                                ${formatRupiah(laba)}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('ntTableContainer').innerHTML = html;
}

// ===== INPUT AMENITIES =====
function onAmenitiesInput(input) {
    const val = parseFloat(input.value) || 0;
    amenitiesValue = val;
    const item = nilaiTambahItems.find(i => i.id === 'amenities');
    if (item) item.value = val;

    // Recalc Laba
    const penjualan = parseFloat(nilaiTambahItems.find(i => i.id === 'penjualan').value) || 0;
    const totalDeduction = nilaiTambahItems
        .filter(i => !i.isTop)
        .reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0);
    const laba = penjualan - totalDeduction;

    const labaEl = document.getElementById('ntLabaValue');
    if (labaEl) {
        labaEl.textContent = formatRupiah(laba);
        labaEl.classList.remove('text-emerald-400', 'text-rose-400');
        labaEl.classList.add(laba >= 0 ? 'text-emerald-400' : 'text-rose-400');
    }

    renderPieChartNT();
}

// ===== PIE CHART 3D + LEGEND CUSTOM =====
function renderPieChartNT() {
    const chartContainer = document.getElementById('pieChartNT');
    const legendContainer = document.getElementById('legendNT');
    if (!chartContainer) return;

    // Update judul
    const titleEl = document.getElementById('ntChartTitle');
    if (titleEl) titleEl.textContent = `NT Metode Penjumlahan (${currentYearNT})`;

    if (!googleChartsReady) {
        chartContainer.innerHTML = '<div class="text-center text-slate-400 py-16"><i class="fa-solid fa-spinner animate-spin text-2xl mb-2"></i><p class="text-xs">Memuat grafik...</p></div>';
        return;
    }

    const getVal = (id) => {
        const item = nilaiTambahItems.find(i => i.id === id);
        return item ? (parseFloat(item.value) || 0) : 0;
    };

    const penjualan = getVal('penjualan');
    const totalDed = nilaiTambahItems
        .filter(i => !i.isTop)
        .reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0);
    const laba = penjualan - totalDed;

    const rawData = [
        ['Komponen', 'Nilai'],
        ['Gaji Karyawan', getVal('tenaga_kerja')],
        ['Bunga Bank', getVal('bunga')],
        ['Pajak', getVal('pajak')],
        ['Penyusutan', getVal('penyusutan')],
        ['Laba', Math.max(0, laba)],
    ];

    const filteredData = [rawData[0], ...rawData.slice(1).filter(row => row[1] > 0)];

    if (filteredData.length < 2) {
        chartContainer.innerHTML = '<p class="text-center text-slate-400 py-12 italic text-sm">Tidak ada data bernilai positif.</p>';
        if (legendContainer) legendContainer.innerHTML = '';
        return;
    }

    const data = google.visualization.arrayToDataTable(filteredData);

    const palette = ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#f59e0b'];

    const options = {
        is3D: true,
        backgroundColor: { fill: 'transparent' },
        legend: 'none',  // pakai legend custom
        pieSliceText: 'percentage',
        pieSliceTextStyle: { color: '#ffffff', fontSize: 14, bold: true },
        colors: palette,
        chartArea: { width: '92%', height: '92%', left: 15, top: 15 },
        tooltip: {
            textStyle: { color: '#1e293b', fontSize: 13 },
        },
        pieStartAngle: 0,
        pieHole: 0,
    };

    chartContainer.innerHTML = '';
    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = '480px';
    chartContainer.appendChild(chartDiv);

    const chart = new google.visualization.PieChart(chartDiv);
    chart.draw(data, options);

    // ===== Custom Legend dengan panah ke chart =====
    if (legendContainer) {
        const total = filteredData.slice(1).reduce((sum, r) => sum + r[1], 0);
        const legendItems = filteredData.slice(1).map((row, i) => {
            const label = row[0];
            const value = row[1];
            const pct = total > 0 ? (value / total * 100).toFixed(1) : '0.0';
            const color = palette[i % palette.length];
            return `
                <div class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-700/30 transition">
                    <span class="w-3 h-3 rounded-full shrink-0 ring-2 ring-opacity-30" style="background: ${color}; box-shadow: 0 0 8px ${color}60;"></span>
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] text-slate-200 font-medium truncate">${label}</div>
                        <div class="text-[10px] text-slate-500 tabular-nums">${formatRupiah(value)}</div>
                    </div>
                    <span class="text-sm font-bold tabular-nums" style="color: ${color};">${pct}%</span>
                </div>
            `;
        }).join('');

        legendContainer.innerHTML = `
            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                <span class="text-xs font-bold text-teal-400 uppercase tracking-wider">Komponen</span>
                <i class="fa-solid fa-arrow-left text-teal-400 text-xs animate-pulse"></i>
            </div>
            <div class="space-y-0.5">${legendItems}</div>
        `;
    }

    window.__ntPieChart = chart;
    window.__ntPieData = data;
    window.__ntPieOptions = options;
}

// ===== RESIZE =====
let ntResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(ntResizeTimer);
    ntResizeTimer = setTimeout(() => {
        if (window.__ntPieChart && window.__ntPieData && window.__ntPieOptions) {
            window.__ntPieChart.draw(window.__ntPieData, window.__ntPieOptions);
        }
    }, 200);
});