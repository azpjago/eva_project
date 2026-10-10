// ===== GRAFIK EVA =====
let grafikCharts = {};

const CHART_THEME = {
    textColor: '#0f172a',
    textSecondary: '#64748b',
    gridColor: 'rgba(203, 213, 225, 0.35)',
    // Vibrant Rainbow Palette — lebih beragam & fresh
    gradients: {
        teal:    ['#2dd4bf', '#0d9488'],   // 🌊 Nilai tambah
        cyan:    ['#22d3ee', '#0891b2'],   // 🔷 Per jam
        green:   ['#4ade80', '#16a34a'],   // 🟢 Growth / profit
        blue:    ['#60a5fa', '#2563eb'],   // 🔵 Efisiensi / modal
        yellow:  ['#fbbf24', '#d97706'],   // 🟡 Value / keuangan
        red:     ['#f87171', '#dc2626'],   // 🔴 Biaya / warning
        purple:  ['#a78bfa', '#7c3aed'],   // 🟣 Aset / investasi
        pink:    ['#f472b6', '#db2777'],   // 🩷 Profitabilitas
        indigo:  ['#818cf8', '#4f46e5'],   // bonus
        amber:   ['#fcd34d', '#f59e0b'],   // bonus
        emerald: ['#34d399', '#059669'],   // bonus
    },
    borderColors: {
        teal: '#0f766e',
        cyan: '#0e7490',
        green: '#15803d',
        blue: '#1d4ed8',
        yellow: '#b45309',
        red: '#b91c1c',
        purple: '#6d28d9',
        pink: '#be185d',
        indigo: '#4338ca',
        amber: '#b45309',
        emerald: '#047857',
    },
};

// ===== PALETTE RAINBOW (cycle per bar) =====
// Setiap bar punya warna berbeda: merah → kuning → hijau → biru → ungu
const RAINBOW_PALETTE = [
    { grad: ['#fbbf24', '#d97706'], border: '#b45309' }, // 🟡 Kuning
    { grad: ['#4ade80', '#16a34a'], border: '#15803d' }, // 🟢 Hijau
    { grad: ['#22d3ee', '#0891b2'], border: '#0e7490' }, // 🔷 Cyan
    { grad: ['#60a5fa', '#2563eb'], border: '#1d4ed8' }, // 🔵 Biru
    { grad: ['#a78bfa', '#7c3aed'], border: '#6d28d9' }, // 🟣 Ungu
    { grad: ['#f472b6', '#db2777'], border: '#be185d' }, // 🩷 Pink
    { grad: ['#f87171', '#dc2626'], border: '#b91c1c' }, // 🔴 Merah
    { grad: ['#2dd4bf', '#0d9488'], border: '#0f766e' }, // 🌊 Teal
];

// ===== HELPER: Buat gradient vertikal untuk Chart.js =====
function makeGradient(ctx, area, colorTop, colorBottom) {
    if (!area) return colorTop;
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, colorTop);
    g.addColorStop(1, colorBottom);
    return g;
}

// ===== HELPER: Config Chart.js default =====
function baseChartOptions(extra = {}) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
            duration: 800,
            easing: 'easeOutQuart',
        },
        plugins: {
            legend: {
                labels: {
                    color: CHART_THEME.textColor,
                    font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                    boxWidth: 14,
                    boxHeight: 14,
                    padding: 12,
                    usePointStyle: true,
                    pointStyle: 'roundedRect',
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(20, 184, 166, 0.5)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                displayColors: true,
                titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
                bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                boxPadding: 6,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: CHART_THEME.textSecondary,
                    font: { family: 'Plus Jakarta Sans', size: 11 },
                    padding: 8,
                    callback: function(v) { return v.toLocaleString('id-ID'); },
                },
                grid: {
                    color: CHART_THEME.gridColor,
                    drawBorder: false,
                    borderDash: [4, 4],
                },
                border: { display: false },
            },
            x: {
                ticks: {
                    color: CHART_THEME.textSecondary,
                    font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                    padding: 6,
                },
                grid: { display: false },
                border: { display: false },
            },
        },
        ...extra,
    };
}

function initGrafik() {
    populateYearFilter();
    applyFilterGrafik();
}

// ===== POPULATE FILTER TAHUN =====
function populateYearFilter() {
    const select = document.getElementById('filterTahun');
    const panels = document.querySelectorAll('.year-panel:not([data-year-id="template"])');
    const years = [];

    panels.forEach(panel => {
        const yearId = panel.dataset.yearId;
        const title = yearMeta[yearId]?.title || 'Tahun';
        if (title && !years.includes(title)) {
            years.push(title);
        }
    });

    years.sort((a, b) => b.localeCompare(a));

    select.innerHTML = '';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });

    const options = Array.from(select.options);
    const maxSelect = 5;
    options.slice(0, maxSelect).forEach(opt => opt.selected = true);
    
    updateSelectedYearsInfo();
}

function updateSelectedYearsInfo() {
    const select = document.getElementById('filterTahun');
    const selected = Array.from(select.selectedOptions).map(opt => opt.value);
    const info = document.getElementById('selectedYearsInfo');
    if (selected.length > 0) {
        info.textContent = 'Tahun terpilih: ' + selected.join(', ');
    } else {
        info.textContent = 'Belum ada tahun terpilih';
    }
}

function resetFilterGrafik() {
    const select = document.getElementById('filterTahun');
    const options = Array.from(select.options);
    const maxSelect = 5;
    options.slice(0, maxSelect).forEach(opt => opt.selected = true);
    updateSelectedYearsInfo();
    applyFilterGrafik();
}

function applyFilterGrafik() {
    const select = document.getElementById('filterTahun');
    let selectedYears = Array.from(select.selectedOptions).map(opt => opt.value);
    
    if (selectedYears.length === 0) {
        alert('Pilih minimal 1 tahun!');
        return;
    }

    const allYears = Array.from(select.options).map(opt => opt.value);
    const sortedAll = [...allYears].sort((a, b) => b.localeCompare(a));
    const latest5 = sortedAll.slice(0, 5);
    
    selectedYears = selectedYears.filter(year => latest5.includes(year));
    if (selectedYears.length === 0) {
        selectedYears = latest5;
        Array.from(select.options).forEach(opt => {
            opt.selected = selectedYears.includes(opt.value);
        });
    }
    
    updateSelectedYearsInfo();

    const panels = document.querySelectorAll('.year-panel:not([data-year-id="template"])');
    const dataTahun = [];

    panels.forEach(panel => {
        const yearId = panel.dataset.yearId;
        const title = yearMeta[yearId]?.title || '';
        if (selectedYears.includes(title)) {
            const data = getDataPanel(panel, yearId, title);
            if (data) dataTahun.push(data);
        }
    });

    if (dataTahun.length === 0) {
        document.getElementById('grafikContainer').innerHTML = '<div class="text-center text-slate-500 py-12">Tidak ada data untuk tahun yang dipilih.</div>';
        return;
    }

    dataTahun.sort((a, b) => a.tahun.localeCompare(b.tahun));
    renderGrafik(dataTahun);
}

// ===== AMBIL DATA DARI SATU PANEL =====
function getDataPanel(panel, yearId, title) {
    const getNumberFromResult = (key) => {
        const el = panel.querySelector(`[data-result="${key}"]`);
        if (!el) return 0;
        return parseFloat(el.textContent.replace(/Rp|\./g, '').trim()) || 0;
    };

    const getInputValue = (field) => {
        const el = panel.querySelector(`input[data-field="${field}"]`);
        if (!el) return 0;
        return parseFloat(el.value) || 0;
    };

    const getTotalFromGroup = (group) => {
        const el = panel.querySelector(`[data-total="${group}"]`);
        if (!el) return 0;
        return parseFloat(el.textContent.replace(/Rp|\./g, '').trim()) || 0;
    };

    const profit = calculateProfits(panel);

    const penjualan = getNumberFromResult('penjualan');
    const nilaiTambah = getNumberFromResult('total_nilai_tambah');
    const biayaTenagaKerja = getTotalFromGroup('biaya_tenaga_kerja');
    const totalInvestasi = getInputValue('total_investasi');
    const jumlahTenagaKerja = getInputValue('jumlah_tenaga_kerja');
    const totalJamKerja = getInputValue('total_jam_kerja');
    const labaBersih = profit.labaBersih;
    const bahanBakuInput = panel.querySelector('input[data-field="bahan_baku"]');
    const bahanBaku = bahanBakuInput ? parseFloat(bahanBakuInput.value) || 0 : 0;

    return {
        tahun: title,
        penjualan,
        nilaiTambah,
        biayaTenagaKerja,
        totalInvestasi,
        jumlahTenagaKerja,
        totalJamKerja,
        labaBersih,
        bahanBaku,
        biayaPerJam: totalJamKerja > 0 ? biayaTenagaKerja / totalJamKerja : 0,
        nilaiTambahPerTenaga: jumlahTenagaKerja > 0 ? nilaiTambah / jumlahTenagaKerja : 0,
        nilaiTambahPerJam: totalJamKerja > 0 ? nilaiTambah / totalJamKerja : 0,
        nilaiTambahPerBiayaTK: biayaTenagaKerja > 0 ? nilaiTambah / biayaTenagaKerja : 0,
        penjualanPerInvestasi: totalInvestasi > 0 ? penjualan / totalInvestasi : 0,
        nilaiTambahPerInvestasi: totalInvestasi > 0 ? nilaiTambah / totalInvestasi : 0,
        investasiPerTenaga: jumlahTenagaKerja > 0 ? totalInvestasi / jumlahTenagaKerja : 0,
        labaBersihPerPenjualan: penjualan > 0 ? (labaBersih / penjualan) * 100 : 0,
        labaBersihPerBahanBaku: bahanBaku > 0 ? (labaBersih / bahanBaku) * 100 : 0,
        labaBersihPerInvestasi: totalInvestasi > 0 ? (labaBersih / totalInvestasi) * 100 : 0
    };
}

// ===== RENDER CHART DENGAN RAINBOW PER BAR =====
function createGradientChart(canvas, labels, dataValues, label, gradientPair, borderColor, isPercent = false, useRainbow = true) {
    const ctx = canvas.getContext('2d');

    // Scriptable background: setiap bar warna berbeda
    const backgroundColorFn = (context) => {
        const chart = context.chart;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return gradientPair[0];

        let pair = gradientPair;
        if (useRainbow) {
            const idx = context.dataIndex % RAINBOW_PALETTE.length;
            pair = RAINBOW_PALETTE[idx].grad;
        }
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, pair[0]);
        g.addColorStop(1, pair[1]);
        return g;
    };

    const hoverColorFn = (context) => {
        if (useRainbow) {
            const idx = context.dataIndex % RAINBOW_PALETTE.length;
            return RAINBOW_PALETTE[idx].grad[1];
        }
        return gradientPair[1];
    };

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: dataValues,
                backgroundColor: backgroundColorFn,
                hoverBackgroundColor: hoverColorFn,
                borderColor: borderColor,
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.65,
                categoryPercentage: 0.8,
            }]
        },
        options: baseChartOptions({
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: CHART_THEME.textSecondary,
                        font: { family: 'Plus Jakarta Sans', size: 11 },
                        padding: 8,
                        callback: function(v) {
                            if (isPercent) return v.toFixed(1) + '%';
                            return v.toLocaleString('id-ID');
                        },
                    },
                    grid: {
                        color: CHART_THEME.gridColor,
                        drawBorder: false,
                        borderDash: [4, 4],
                    },
                    border: { display: false },
                },
                x: {
                    ticks: {
                        color: CHART_THEME.textColor,
                        font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                        padding: 6,
                    },
                    grid: { display: false },
                    border: { display: false },
                },
            },
        }),
    });
    return chart;
}

// ===== RENDER GRAFIK =====
function renderGrafik(data) {
    const container = document.getElementById('grafikContainer');
    container.innerHTML = '';

    const labels = data.map(d => d.tahun);

    // 1. Grafik Nilai Tambah per Tahun (FULL WIDTH dengan gaya premium)
    const wrapper1 = document.createElement('div');
    wrapper1.className = 'bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow';
    wrapper1.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center">
                <i class="fa-solid fa-chart-column text-white text-xs"></i>
            </div>
            <div>
                <h3 class="text-sm font-bold text-slate-900">Nilai Tambah per Tahun</h3>
                <p class="text-[11px] text-slate-500">Total nilai tambah yang dihasilkan perusahaan</p>
            </div>
        </div>
    `;
    const canvas1 = document.createElement('canvas');
    canvas1.style.maxHeight = '320px';
    wrapper1.appendChild(canvas1);
    container.appendChild(wrapper1);

        // Smart color: merah jika tren turun, teal jika naik
    const nilaiTambahArr = data.map(d => d.nilaiTambah);
    const isTrendingDown = nilaiTambahArr.length >= 2 && 
        nilaiTambahArr[nilaiTambahArr.length - 1] < nilaiTambahArr[0];
    
    const gradPair = isTrendingDown 
        ? CHART_THEME.gradients.red 
        : CHART_THEME.gradients.teal;
    const borderCol = isTrendingDown 
        ? CHART_THEME.borderColors.red 
        : CHART_THEME.borderColors.teal;

    createGradientChart(
        canvas1,
        labels,
        nilaiTambahArr,
        'Nilai Tambah (Rp)',
        CHART_THEME.gradients.teal,
        CHART_THEME.borderColors.teal,
        false,
        true   // ← Rainbow aktif
    );

    // 2. Produktivitas Nilai Tambah
    const group2 = createGroup(container, 'Produktivitas Nilai Tambah', 'fa-gauge-high', 'from-teal-500 to-cyan-500');
    renderGroup2(group2, data);

    // 3. Efisiensi Investasi & Penjualan
    const group3 = createGroup(container, 'Efisiensi Investasi & Penjualan', 'fa-coins', 'from-blue-500 to-indigo-500');
    renderGroup3(group3, data);

    // 4. Profitabilitas
    const group4 = createGroup(container, 'Profitabilitas', 'fa-percent', 'from-indigo-500 to-purple-500');
    renderGroup4(group4, data);
}

// ===== FUNGSI BANTU: Group dengan Header =====
function createGroup(container, title, iconClass, gradientClass) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow';
    wrapper.innerHTML = `
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr ${gradientClass} flex items-center justify-center shadow-sm">
                <i class="fa-solid ${iconClass} text-white text-xs"></i>
            </div>
            <h3 class="text-base font-bold text-slate-900">${title}</h3>
        </div>
    `;
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
    return grid;
}

// ===== CHART KECIL: Wrapper untuk sub-chart =====
function createSmallChartWrapper(grid, label, iconClass, gradientBg) {
    const div = document.createElement('div');
    div.className = 'bg-slate-50/70 rounded-xl p-4 border border-slate-100 hover:bg-white hover:shadow-sm transition-all';
    div.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 rounded-md ${gradientBg} flex items-center justify-center">
                <i class="fa-solid ${iconClass} text-white text-[10px]"></i>
            </div>
            <h4 class="text-xs font-semibold text-slate-700 leading-tight">${label}</h4>
        </div>
    `;
    const canvas = document.createElement('canvas');
    canvas.style.maxHeight = '220px';
    div.appendChild(canvas);
    grid.appendChild(div);
    return canvas;
}

function renderGroup2(grid, data) {
    const labels = data.map(d => d.tahun);

    const charts = [
        { 
            label: 'Nilai Tambah per Tenaga Kerja', 
            key: 'nilaiTambahPerTenaga', 
            grad: CHART_THEME.gradients.green,        // 🟢 HIJAU
            border: CHART_THEME.borderColors.green,
            icon: 'fa-user-group', 
            bg: 'bg-gradient-to-tr from-green-400 to-green-600'
        },
        { 
            label: 'Nilai Tambah per Jam Kerja', 
            key: 'nilaiTambahPerJam', 
            grad: CHART_THEME.gradients.blue,          // 🔵 BIRU
            border: CHART_THEME.borderColors.blue,
            icon: 'fa-clock', 
            bg: 'bg-gradient-to-tr from-blue-400 to-blue-600'
        },
        { 
            label: 'Nilai Tambah per Biaya Tenaga Kerja', 
            key: 'nilaiTambahPerBiayaTK', 
            grad: CHART_THEME.gradients.yellow,        // 🟡 KUNING
            border: CHART_THEME.borderColors.yellow,
            icon: 'fa-hand-holding-dollar', 
            bg: 'bg-gradient-to-tr from-yellow-400 to-yellow-600'
        },
        { 
            label: 'Biaya Tenaga Kerja per Jam Kerja', 
            key: 'biayaPerJam', 
            grad: CHART_THEME.gradients.red,           // 🔴 MERAH
            border: CHART_THEME.borderColors.red,
            icon: 'fa-money-bill-wave', 
            bg: 'bg-gradient-to-tr from-red-400 to-red-600'
        },
    ];

    charts.forEach((item) => {
        const canvas = createSmallChartWrapper(grid, item.label, item.icon, item.bg);
        createGradientChart(canvas, labels, data.map(d => d[item.key]), item.label, item.grad, item.border, false, true);
    });
}
// ===== RENDER GROUP 3: EFISIENSI INVESTASI =====
function renderGroup3(grid, data) {
    const labels = data.map(d => d.tahun);

    const charts = [
        { 
            label: 'Penjualan / Total Investasi', 
            key: 'penjualanPerInvestasi', 
            grad: CHART_THEME.gradients.cyan,          // 🔷 CYAN
            border: CHART_THEME.borderColors.cyan,
            icon: 'fa-arrow-trend-up', 
            bg: 'bg-gradient-to-tr from-cyan-400 to-cyan-600'
        },
        { 
            label: 'Nilai Tambah / Total Investasi', 
            key: 'nilaiTambahPerInvestasi', 
            grad: CHART_THEME.gradients.green,         // 🟢 HIJAU
            border: CHART_THEME.borderColors.green,
            icon: 'fa-chart-line', 
            bg: 'bg-gradient-to-tr from-green-400 to-green-600'
        },
        { 
            label: 'Total Investasi / Tenaga Kerja', 
            key: 'investasiPerTenaga', 
            grad: CHART_THEME.gradients.purple,        // 🟣 UNGU
            border: CHART_THEME.borderColors.purple,
            icon: 'fa-briefcase', 
            bg: 'bg-gradient-to-tr from-purple-400 to-purple-600'
        },
    ];

    charts.forEach((item) => {
        const canvas = createSmallChartWrapper(grid, item.label, item.icon, item.bg);
        createGradientChart(canvas, labels, data.map(d => d[item.key]), item.label, item.grad, item.border);
    });
}

function renderGroup4(grid, data) {
    const labels = data.map(d => d.tahun);

    const charts = [
        { 
            label: 'Laba Bersih / Penjualan (%)', 
            key: 'labaBersihPerPenjualan', 
            grad: CHART_THEME.gradients.green,         // 🟢 HIJAU
            border: CHART_THEME.borderColors.green,
            icon: 'fa-percent', 
            bg: 'bg-gradient-to-tr from-green-400 to-green-600'
        },
        { 
            label: 'Laba Bersih / Biaya Bahan Baku (%)', 
            key: 'labaBersihPerBahanBaku', 
            grad: CHART_THEME.gradients.yellow,        // 🟡 KUNING
            border: CHART_THEME.borderColors.yellow,
            icon: 'fa-boxes-stacked', 
            bg: 'bg-gradient-to-tr from-yellow-400 to-yellow-600'
        },
        { 
            label: 'Laba Bersih / Total Investasi (%)', 
            key: 'labaBersihPerInvestasi', 
            grad: CHART_THEME.gradients.pink,          // 🩷 PINK
            border: CHART_THEME.borderColors.pink,
            icon: 'fa-coins', 
            bg: 'bg-gradient-to-tr from-pink-400 to-pink-600'
        },
    ];

    charts.forEach((item) => {
        const canvas = createSmallChartWrapper(grid, item.label, item.icon, item.bg);
        createGradientChart(canvas, labels, data.map(d => d[item.key]), item.label, item.grad, item.border, true, true);
    });
}