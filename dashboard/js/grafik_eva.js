// ===== GRAFIK EVA =====
let grafikCharts = {};
// ===== THEME CONFIG (Light Mode) =====
const CHART_THEME = {
    textColor: '#0f172a',           // slate-900
    textSecondary: '#64748b',       // slate-500
    gridColor: 'rgba(203, 213, 225, 0.4)',  // slate-300 alpha
    barColors: ['#14b8a6', '#0d9488', '#0891b2', '#2563eb', '#6366f1', '#8b5cf6'],
};

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
    const toSelect = options.slice(0, maxSelect);
    toSelect.forEach(opt => opt.selected = true);
    
    updateSelectedYearsInfo();
}

// ===== UPDATE INFO TAHUN TERPILIH =====
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

// ===== RESET FILTER =====
function resetFilterGrafik() {
    const select = document.getElementById('filterTahun');
    const options = Array.from(select.options);
    const maxSelect = 5;
    const toSelect = options.slice(0, maxSelect);
    toSelect.forEach(opt => opt.selected = true);
    updateSelectedYearsInfo();
    applyFilterGrafik();
}

// ===== APPLY FILTER =====
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
    const bahanDigunakan = getNumberFromResult('bahan_digunakan');
    const biayaTenagaKerja = getTotalFromGroup('biaya_tenaga_kerja');
    const totalInvestasi = getInputValue('total_investasi');
    const jumlahTenagaKerja = getInputValue('jumlah_tenaga_kerja');
    const totalJamKerja = getInputValue('total_jam_kerja');
    const labaBersih = profit.labaBersih;
    const bahanBakuInput = panel.querySelector('input[data-field="bahan_baku"]');
    const bahanBaku = bahanBakuInput ? parseFloat(bahanBakuInput.value) || 0 : 0;

    const biayaPerJam = totalJamKerja > 0 ? biayaTenagaKerja / totalJamKerja : 0;
    const nilaiTambahPerTenaga = jumlahTenagaKerja > 0 ? nilaiTambah / jumlahTenagaKerja : 0;
    const nilaiTambahPerJam = totalJamKerja > 0 ? nilaiTambah / totalJamKerja : 0;
    const nilaiTambahPerBiayaTK = biayaTenagaKerja > 0 ? nilaiTambah / biayaTenagaKerja : 0;
    const penjualanPerInvestasi = totalInvestasi > 0 ? penjualan / totalInvestasi : 0;
    const nilaiTambahPerInvestasi = totalInvestasi > 0 ? nilaiTambah / totalInvestasi : 0;
    const investasiPerTenaga = jumlahTenagaKerja > 0 ? totalInvestasi / jumlahTenagaKerja : 0;

    const labaBersihPerPenjualan = penjualan > 0 ? (labaBersih / penjualan) * 100 : 0;
    const labaBersihPerBahanBaku = bahanBaku > 0 ? (labaBersih / bahanBaku) * 100 : 0;
    const labaBersihPerInvestasi = totalInvestasi > 0 ? (labaBersih / totalInvestasi) * 100 : 0;

    return {
        tahun: title,
        penjualan,
        nilaiTambah,
        bahanDigunakan,
        biayaTenagaKerja,
        totalInvestasi,
        jumlahTenagaKerja,
        totalJamKerja,
        labaBersih,
        bahanBaku,
        biayaPerJam,
        nilaiTambahPerTenaga,
        nilaiTambahPerJam,
        nilaiTambahPerBiayaTK,
        penjualanPerInvestasi,
        nilaiTambahPerInvestasi,
        investasiPerTenaga,
        labaBersihPerPenjualan,
        labaBersihPerBahanBaku,
        labaBersihPerInvestasi
    };
}

// ===== RENDER GRAFIK =====
function renderGrafik(data) {
    const container = document.getElementById('grafikContainer');
    container.innerHTML = '';

    const colors = CHART_THEME.barColors;
    const bgColors = colors.map(c => c + 'CC');

    // 1. Grafik Nilai Tambah per Tahun
    const wrapper1 = document.createElement('div');
    wrapper1.className = 'bg-white rounded-2xl p-4 border border-slate-200 shadow-sm';
    wrapper1.innerHTML = '<h3 class="text-sm font-bold text-slate-900 mb-2">Nilai Tambah per Tahun</h3>';
    const canvas1 = document.createElement('canvas');
    wrapper1.appendChild(canvas1);
    container.appendChild(wrapper1);

    new Chart(canvas1, {
        type: 'bar',
        data: {
            labels: data.map(d => d.tahun),
            datasets: [{
                label: 'Nilai Tambah (Rp)',
                data: data.map(d => d.nilaiTambah),
                backgroundColor: bgColors[0],
                borderColor: colors[0],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Nilai Tambah per Tahun', color: CHART_THEME.textColor },
                legend: { labels: { color: CHART_THEME.textColor } }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { color: CHART_THEME.textColor },
                    grid: { color: CHART_THEME.gridColor }
                },
                x: { 
                    ticks: { color: CHART_THEME.textColor },
                    grid: { color: CHART_THEME.gridColor }
                }
            }
        }
    });

    // 2. Produktivitas Nilai Tambah
    const group2 = createGroup(container, 'Produktivitas Nilai Tambah');
    renderGroup2(group2, data);

    // 3. Efisiensi Investasi & Penjualan
    const group3 = createGroup(container, 'Efisiensi Investasi & Penjualan');
    renderGroup3(group3, data);

    // 4. Profitabilitas
    const group4 = createGroup(container, 'Profitabilitas');
    renderGroup4(group4, data);
}

// ===== FUNGSI BANTU =====
function createGroup(container, title) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-white rounded-2xl p-4 border border-slate-200 shadow-sm';
    const h3 = document.createElement('h3');
    h3.className = 'text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2';
    h3.textContent = title;
    wrapper.appendChild(h3);
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
    return grid;
}

// ===== RENDER GROUP 2: PRODUKTIVITAS =====
function renderGroup2(grid, data) {
    const colors = CHART_THEME.barColors;
    const bgColors = colors.map(c => c + 'CC');

    const charts = [
        { label: 'Nilai Tambah per Tenaga Kerja', key: 'nilaiTambahPerTenaga' },
        { label: 'Nilai Tambah per Jam Kerja', key: 'nilaiTambahPerJam' },
        { label: 'Nilai Tambah per Biaya Tenaga Kerja', key: 'nilaiTambahPerBiayaTK' },
        { label: 'Biaya Tenaga Kerja per Jam Kerja', key: 'biayaPerJam' }
    ];

    charts.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-slate-50 rounded-xl p-3 border border-slate-100';
        const canvas = document.createElement('canvas');
        div.appendChild(canvas);
        grid.appendChild(div);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.map(d => d.tahun),
                datasets: [{
                    label: item.label,
                    data: data.map(d => d[item.key]),
                    backgroundColor: bgColors[idx % bgColors.length],
                    borderColor: colors[idx % colors.length],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: CHART_THEME.textColor } }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: CHART_THEME.textColor, callback: function(v) { return v.toLocaleString('id-ID'); } },
                        grid: { color: CHART_THEME.gridColor }
                    },
                    x: { 
                        ticks: { color: CHART_THEME.textColor },
                        grid: { color: CHART_THEME.gridColor }
                    }
                }
            }
        });
    });
}

// ===== RENDER GROUP 3: EFISIENSI INVESTASI =====
function renderGroup3(grid, data) {
    const colors = CHART_THEME.barColors;
    const bgColors = colors.map(c => c + 'CC');

    const charts = [
        { label: 'Penjualan / Total Investasi', key: 'penjualanPerInvestasi' },
        { label: 'Nilai Tambah / Total Investasi', key: 'nilaiTambahPerInvestasi' },
        { label: 'Total Investasi / Tenaga Kerja', key: 'investasiPerTenaga' }
    ];

    charts.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-slate-50 rounded-xl p-3 border border-slate-100';
        const canvas = document.createElement('canvas');
        div.appendChild(canvas);
        grid.appendChild(div);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.map(d => d.tahun),
                datasets: [{
                    label: item.label,
                    data: data.map(d => d[item.key]),
                    backgroundColor: bgColors[idx % bgColors.length],
                    borderColor: colors[idx % colors.length],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: CHART_THEME.textColor } }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: CHART_THEME.textColor, callback: function(v) { return v.toLocaleString('id-ID'); } },
                        grid: { color: CHART_THEME.gridColor }
                    },
                    x: { 
                        ticks: { color: CHART_THEME.textColor },
                        grid: { color: CHART_THEME.gridColor }
                    }
                }
            }
        });
    });
}

// ===== RENDER GROUP 4: PROFITABILITAS =====
function renderGroup4(grid, data) {
    const colors = CHART_THEME.barColors;
    const bgColors = colors.map(c => c + 'CC');

    const charts = [
        { label: 'Laba Bersih / Penjualan (%)', key: 'labaBersihPerPenjualan' },
        { label: 'Laba Bersih / Biaya Bahan Baku (%)', key: 'labaBersihPerBahanBaku' },
        { label: 'Laba Bersih / Total Investasi (%)', key: 'labaBersihPerInvestasi' }
    ];

    charts.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-slate-50 rounded-xl p-3 border border-slate-100';
        const canvas = document.createElement('canvas');
        div.appendChild(canvas);
        grid.appendChild(div);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.map(d => d.tahun),
                datasets: [{
                    label: item.label,
                    data: data.map(d => d[item.key]),
                    backgroundColor: bgColors[idx % bgColors.length],
                    borderColor: colors[idx % colors.length],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: CHART_THEME.textColor } }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { 
                            color: CHART_THEME.textColor, 
                            callback: function(v) { return v.toFixed(1) + '%'; } 
                        },
                        grid: { color: CHART_THEME.gridColor }
                    },
                    x: { 
                        ticks: { color: CHART_THEME.textColor },
                        grid: { color: CHART_THEME.gridColor }
                    }
                }
            }
        });
    });
}