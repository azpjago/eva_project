// ===== NILAI TAMBAH =====
let nilaiTambahItems = [];
let currentYearNT = '';
let amenitiesValue = 0;

// ApexCharts tidak butuh init khusus
let googleChartsReady = true;

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
let apexChartNT = null;

function renderPieChartNT() {
    const chartContainer = document.getElementById('pieChartNT');
    const legendContainer = document.getElementById('legendNT');
    if (!chartContainer) return;

    const titleEl = document.getElementById('ntChartTitle');
    if (titleEl) titleEl.textContent = `NT Metode Penjumlahan (${currentYearNT})`;

    const getVal = (id) => {
        const item = nilaiTambahItems.find(i => i.id === id);
        return item ? (parseFloat(item.value) || 0) : 0;
    };

    const penjualan = getVal('penjualan');
    const totalDed = nilaiTambahItems
        .filter(i => !i.isTop)
        .reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0);
    const laba = penjualan - totalDed;

    // Data 5 slice
    const labels = ['Gaji Karyawan', 'Bunga Bank', 'Pajak', 'Penyusutan', 'Laba'];
    const values = [
        getVal('tenaga_kerja'),
        getVal('bunga'),
        getVal('pajak'),
        getVal('penyusutan'),
        Math.max(0, laba),
    ];

    // Filter nilai 0
    const filtered = labels.map((l, i) => ({ label: l, value: values[i] }))
                          .filter(x => x.value > 0);

    if (filtered.length === 0) {
        chartContainer.innerHTML = '<p class="text-center text-slate-400 py-12 italic text-sm">Tidak ada data bernilai positif.</p>';
        if (legendContainer) legendContainer.innerHTML = '';
        if (apexChartNT) { apexChartNT.destroy(); apexChartNT = null; }
        return;
    }

    const palette = ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#f59e0b'];

    const options = {
        chart: {
            type: 'donut',
            height: 480,           // ← FIXED HEIGHT
            width: '100%',
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 600,
            },
            dropShadow: {
                enabled: true,
                top: 8,
                left: 3,
                blur: 8,
                opacity: 0.35,
                color: '#000',
            },
            toolbar: { show: false },
        },
        labels: filtered.map(x => x.label),
        series: filtered.map(x => x.value),
        colors: palette,
        legend: { show: false },   // pakai legend custom
        dataLabels: {
            enabled: true,
            formatter: (val) => val.toFixed(1) + '%',
            style: {
                fontSize: '13px',
                fontWeight: 'bold',
                colors: ['#fff'],
            },
            dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 2,
                opacity: 0.5,
            },
        },
        plotOptions: {
            pie: {
                expandOnClick: true,
                donut: {
                    size: '62%',   // tebal donut, memberi efek 3D
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '14px',
                            color: '#94a3b8',
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#ffffff',
                            formatter: (val) => {
                                return parseInt(val).toLocaleString('id-ID');
                            },
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            color: '#94a3b8',
                            fontSize: '13px',
                            formatter: (w) => {
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                return 'Rp' + Math.round(total).toLocaleString('id-ID');
                            },
                        },
                    },
                },
            },
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val) => 'Rp' + Math.round(val).toLocaleString('id-ID'),
            },
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['#1e293b'],
        },
        responsive: [{
            breakpoint: 640,
            options: {
                chart: { height: 320 },
            },
        }],
    };

    // Destroy chart lama jika ada
    if (apexChartNT) {
        apexChartNT.destroy();
        apexChartNT = null;
    }

    chartContainer.innerHTML = '';
    const chartDiv = document.createElement('div');
    chartDiv.id = 'apexChartNTDiv';
    chartContainer.appendChild(chartDiv);

    apexChartNT = new ApexCharts(chartDiv, options);
    apexChartNT.render();

    // ===== Legend Custom =====
    if (legendContainer) {
        const total = filtered.reduce((sum, x) => sum + x.value, 0);
        const legendItems = filtered.map((item, i) => {
            const pct = total > 0 ? (item.value / total * 100).toFixed(1) : '0.0';
            const color = palette[i % palette.length];
            return `
                <div class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-700/30 transition cursor-pointer"
                     onclick="if(apexChartNT) apexChartNT.toggleSeries('${item.label}')">
                    <span class="w-3 h-3 rounded-full shrink-0" style="background: ${color}; box-shadow: 0 0 8px ${color}60;"></span>
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] text-slate-200 font-medium truncate">${item.label}</div>
                        <div class="text-[10px] text-slate-500 tabular-nums">${formatRupiah(item.value)}</div>
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
}