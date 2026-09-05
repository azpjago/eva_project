// ===== RASIO PRODUKTIVITAS =====
let rasioData = [];

// ===== DEFINISI RATIO =====
const RATIO_GROUPS = [
    {
        name: 'PRODUKTIVITAS TENAGA KERJA',
        ratios: [
            {
                id: 'nilai_tambah_per_tenaga',
                label: 'Nilai Tambah / Jumlah Tenaga Kerja',
                satuan: 'Rp/Org',
                deskripsi: 'Kontribusi rata-rata tenaga kerja dalam menciptakan nilai tambah',
                calc: (d) => d.jumlahTenagaKerja > 0 ? d.nilaiTambah / d.jumlahTenagaKerja : 0
            },
            {
                id: 'nilai_tambah_per_jam',
                label: 'Nilai Tambah / Jam Kerja',
                satuan: 'Rp/Jam',
                deskripsi: 'Kontribusi rata-rata tenaga kerja per jam dalam menciptakan nilai tambah',
                calc: (d) => d.totalJamKerja > 0 ? d.nilaiTambah / d.totalJamKerja : 0
            },
            {
                id: 'nilai_tambah_per_biaya_tk',
                label: 'Nilai Tambah / Biaya Tenaga Kerja',
                satuan: 'Rp',
                deskripsi: 'Mendayagunakan tenaga kerja dari setiap rupiah yang dibiayakan',
                calc: (d) => d.biayaTenagaKerja > 0 ? d.nilaiTambah / d.biayaTenagaKerja : 0
            },
            {
                id: 'biaya_tk_per_jam',
                label: 'Biaya Tenaga Kerja / Total Jam Kerja',
                satuan: 'Rp/Jam',
                deskripsi: 'Nilai Rupiah yang dibayarkan kepada tenaga kerja setiap jam',
                calc: (d) => d.totalJamKerja > 0 ? d.biayaTenagaKerja / d.totalJamKerja : 0
            }
        ]
    },
    {
        name: 'PRODUKTIVITAS MODAL',
        ratios: [
            {
                id: 'penjualan_per_investasi',
                label: 'Penjualan / Total Investasi',
                satuan: 'Rp',
                deskripsi: 'Kemampuan perusahaan dalam menciptakan penjualan melalui pendayagunaan modal',
                calc: (d) => d.totalInvestasi > 0 ? d.penjualan / d.totalInvestasi : 0
            },
            {
                id: 'nilai_tambah_per_investasi',
                label: 'Nilai Tambah / Total Investasi',
                satuan: 'Rp',
                deskripsi: 'Kemampuan perusahaan dalam menciptakan nilai tambah dalam pendayagunaan modal',
                calc: (d) => d.totalInvestasi > 0 ? d.nilaiTambah / d.totalInvestasi : 0
            },
            {
                id: 'investasi_per_tenaga',
                label: 'Total Investasi / Jumlah Tenaga Kerja',
                satuan: 'Rp/Org',
                deskripsi: 'Nilai Aset yang di-handle oleh rata-rata setiap tenaga kerja',
                calc: (d) => d.jumlahTenagaKerja > 0 ? d.totalInvestasi / d.jumlahTenagaKerja : 0
            }
        ]
    },
    {
        name: 'PROFITABILITAS',
        ratios: [
            {
                id: 'laba_per_penjualan',
                label: 'Laba Bersih / Total Penjualan',
                satuan: '%',
                deskripsi: 'Tingkat efisiensi penggunaan bahan dan jasa dalam menciptakan pendapatan',
                calc: (d) => d.penjualan > 0 ? (d.labaBersih / d.penjualan) * 100 : 0
            },
            {
                id: 'laba_per_nilai_tambah',
                label: 'Laba Bersih / Nilai Tambah',
                satuan: '%',
                deskripsi: 'Perbandingan laba bersih dengan nilai tambah',
                calc: (d) => d.nilaiTambah > 0 ? (d.labaBersih / d.nilaiTambah) * 100 : 0
            },
            {
                id: 'laba_per_investasi',
                label: 'Laba Bersih / Total Investasi',
                satuan: '%',
                deskripsi: 'Pendayagunaan modal dalam menciptakan laba perusahaan',
                calc: (d) => d.totalInvestasi > 0 ? (d.labaBersih / d.totalInvestasi) * 100 : 0
            }
        ]
    },
    {
        name: 'PENDUKUNG',
        ratios: [
            {
                id: 'nilai_tambah_per_penjualan',
                label: 'Nilai Tambah / Total Penjualan',
                satuan: '%',
                deskripsi: 'Tingkat efisiensi proses pembuatan produk terhadap bahan dan jasa',
                calc: (d) => d.penjualan > 0 ? (d.nilaiTambah / d.penjualan) * 100 : 0
            },
            {
                id: 'nilai_tambah_per_bahan_baku',
                label: 'Nilai Tambah / Bahan Baku',
                satuan: 'Rp',
                deskripsi: 'Kreativitas dan kemampuan inovasi perusahaan terhadap bahan baku',
                calc: (d) => d.bahanBaku > 0 ? d.nilaiTambah / d.bahanBaku : 0
            },
            {
                id: 'nilai_tambah_per_biaya_tk_v2',
                label: 'Nilai Tambah / Biaya Tenaga Kerja',
                satuan: 'Rp',
                deskripsi: 'Kemampuan melipatgandakan biaya tenaga kerja dalam menghasilkan laba',
                calc: (d) => d.biayaTenagaKerja > 0 ? d.nilaiTambah / d.biayaTenagaKerja : 0
            }
        ]
    }
];

// ===== INIT =====
function initRasio() {
    populateYearFilterRasio();
    applyFilterRasio();
}

// ===== POPULATE FILTER =====
function populateYearFilterRasio() {
    const select = document.getElementById('filterTahunRasio');
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

    // Pilih maksimal 3 tahun terbaru
    const options = Array.from(select.options);
    const maxSelect = Math.min(3, options.length);
    options.slice(0, maxSelect).forEach(opt => opt.selected = true);
    updateInfoTahunRasio();
}

// ===== UPDATE INFO =====
function updateInfoTahunRasio() {
    const select = document.getElementById('filterTahunRasio');
    const selected = Array.from(select.selectedOptions).map(opt => opt.value);
    const info = document.getElementById('selectedTahunRasioInfo');
    const info2 = document.getElementById('infoTahunRasio');
    if (selected.length >= 2) {
        info.textContent = 'Tahun terpilih: ' + selected.join(', ');
        info2.textContent = 'Minimal 2 tahun';
    } else if (selected.length === 1) {
        info.textContent = 'Tahun terpilih: ' + selected.join(', ') + ' (butuh minimal 2 tahun)';
        info2.textContent = '⚠️ Butuh minimal 2 tahun';
    } else {
        info.textContent = 'Belum ada tahun terpilih';
        info2.textContent = 'Pilih minimal 2 tahun';
    }
}

// ===== RESET FILTER =====
function resetFilterRasio() {
    const select = document.getElementById('filterTahunRasio');
    const options = Array.from(select.options);
    const maxSelect = Math.min(3, options.length);
    options.slice(0, maxSelect).forEach(opt => opt.selected = true);
    updateInfoTahunRasio();
    applyFilterRasio();
}

// ===== APPLY FILTER =====
function applyFilterRasio() {
    const select = document.getElementById('filterTahunRasio');
    let selectedYears = Array.from(select.selectedOptions).map(opt => opt.value);
    
    if (selectedYears.length < 2) {
        document.getElementById('rasioContainer').innerHTML = `
            <div class="text-center text-amber-400 py-12 bg-slate-800/50 rounded-2xl border border-amber-500/30">
                <i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i>
                <p class="text-sm">Butuh minimal 2 tahun data untuk menampilkan rasio dan growth.</p>
                <p class="text-xs text-slate-400 mt-1">Pilih minimal 2 tahun.</p>
            </div>
        `;
        return;
    }

    // Batasi maksimal 3 tahun
    const allYears = Array.from(select.options).map(opt => opt.value);
    const sortedAll = [...allYears].sort((a, b) => b.localeCompare(a));
    const latest3 = sortedAll.slice(0, 3);
    selectedYears = selectedYears.filter(y => latest3.includes(y));
    if (selectedYears.length > 3) {
        selectedYears = selectedYears.slice(0, 3);
    }

    // Ambil data dari panel
    const panels = document.querySelectorAll('.year-panel:not([data-year-id="template"])');
    const dataTahun = [];

    panels.forEach(panel => {
        const yearId = panel.dataset.yearId;
        const title = yearMeta[yearId]?.title || '';
        if (selectedYears.includes(title)) {
            const data = getDataPanelRasio(panel);
            if (data) dataTahun.push({ tahun: title, ...data });
        }
    });

    if (dataTahun.length < 2) {
        document.getElementById('rasioContainer').innerHTML = `
            <div class="text-center text-amber-400 py-12 bg-slate-800/50 rounded-2xl border border-amber-500/30">
                <i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i>
                <p class="text-sm">Data untuk tahun yang dipilih tidak lengkap.</p>
                <p class="text-xs text-slate-400 mt-1">Pastikan semua data terisi di Kalkulator EVA.</p>
            </div>
        `;
        return;
    }

    dataTahun.sort((a, b) => a.tahun.localeCompare(b.tahun));
    rasioData = dataTahun;

    // Tampilkan loading
    document.getElementById('loadingRasio').classList.remove('hidden');
    document.getElementById('rasioContainer').innerHTML = '';

    // Hitung semua rasio
    const allRatios = [];
    RATIO_GROUPS.forEach(group => {
        group.ratios.forEach(ratio => {
            const values = dataTahun.map(d => ratio.calc(d));
            const growth = calculateGrowth(values);
            allRatios.push({
                group: group.name,
                ratioId: ratio.id,
                label: ratio.label,
                satuan: ratio.satuan,
                deskripsi: ratio.deskripsi,
                values: values,
                growth: growth,
                years: dataTahun.map(d => d.tahun)
            });
        });
    });

    // Kirim ke AI untuk analisis
    analyzeRatios(allRatios, dataTahun).then(analyses => {
        document.getElementById('loadingRasio').classList.add('hidden');
        renderRasioTable(allRatios, analyses);
    }).catch(() => {
        document.getElementById('loadingRasio').classList.add('hidden');
        renderRasioTable(allRatios, {});
    });
}

// ===== AMBIL DATA PANEL =====
function getDataPanelRasio(panel) {
    const getNumber = (key) => {
        const el = panel.querySelector(`[data-result="${key}"]`);
        if (!el) return 0;
        return parseFloat(el.textContent.replace(/Rp|\./g, '').trim()) || 0;
    };
    const getInput = (field) => {
        const el = panel.querySelector(`input[data-field="${field}"]`);
        if (!el) return 0;
        return parseFloat(el.value) || 0;
    };
    const getTotal = (group) => {
        const el = panel.querySelector(`[data-total="${group}"]`);
        if (!el) return 0;
        return parseFloat(el.textContent.replace(/Rp|\./g, '').trim()) || 0;
    };
    const profit = calculateProfits(panel);

    return {
        penjualan: getNumber('penjualan'),
        nilaiTambah: getNumber('total_nilai_tambah'),
        bahanDigunakan: getNumber('bahan_digunakan'),
        biayaTenagaKerja: getTotal('biaya_tenaga_kerja'),
        totalInvestasi: getInput('total_investasi'),
        jumlahTenagaKerja: getInput('jumlah_tenaga_kerja'),
        totalJamKerja: getInput('total_jam_kerja'),
        labaBersih: profit.labaBersih,
        bahanBaku: getInput('bahan_baku')
    };
}

// ===== HITUNG GROWTH =====
function calculateGrowth(values) {
    if (values.length < 2) return values.map(() => 0);
    const growth = [0];
    for (let i = 1; i < values.length; i++) {
        const prev = values[i-1];
        const curr = values[i];
        if (prev === 0) growth.push(0);
        else growth.push(((curr - prev) / prev) * 100);
    }
    return growth;
}

// ===== ANALISIS AI =====
async function analyzeRatios(allRatios, dataTahun) {
    try {
        const token = localStorage.getItem('eva_token');
        const response = await fetch('/api/ai/analyze-ratio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                data_tahun: dataTahun,
                ratios: allRatios.map(r => ({
                    id: r.ratioId,
                    label: r.label,
                    values: r.values,
                    growth: r.growth,
                    years: r.years
                }))
            })
        });
        if (!response.ok) throw new Error('AI analysis failed');
        const result = await response.json();
        return result.analyses || {};
    } catch (err) {
        console.error('AI error:', err);
        // Fallback: analisis sederhana
        const fallback = {};
        allRatios.forEach(r => {
            const trend = analyzeTrend(r.values);
            fallback[r.ratioId] = trend;
        });
        return fallback;
    }
}

// ===== ANALISIS TREND SEDERHANA (FALLBACK) =====
function analyzeTrend(values) {
    if (values.length < 2) return 'Data tidak cukup untuk analisis.';
    let trend = '';
    const last = values[values.length - 1];
    const first = values[0];
    if (last > first) {
        trend = 'Meningkat. Indikasi positif, efisiensi meningkat.';
    } else if (last < first) {
        trend = 'Menurun. Perlu evaluasi untuk meningkatkan efisiensi.';
    } else {
        trend = 'Stabil. Pertahankan kinerja.';
    }
    // Tambahkan detail growth
    const growths = [];
    for (let i = 1; i < values.length; i++) {
        const prev = values[i-1];
        const curr = values[i];
        if (prev !== 0) {
            const g = ((curr - prev) / prev) * 100;
            growths.push(g.toFixed(1) + '%');
        } else {
            growths.push('∞');
        }
    }
    return `${trend} (Growth: ${growths.join(', ')})`;
}

// ===== RENDER TABEL =====
function renderRasioTable(allRatios, analyses) {
    const container = document.getElementById('rasioContainer');
    container.innerHTML = '';

    // Kelompokkan berdasarkan group
    const groups = {};
    allRatios.forEach(r => {
        if (!groups[r.group]) groups[r.group] = [];
        groups[r.group].push(r);
    });

    let no = 1;
    for (const [groupName, ratios] of Object.entries(groups)) {
        const years = ratios[0]?.years || [];
        const wrapper = document.createElement('div');
        wrapper.className = 'bg-slate-800/50 rounded-2xl p-4 border border-slate-700 overflow-x-auto';

        const header = document.createElement('h3');
        header.className = 'text-lg font-bold text-white mb-3 border-b border-slate-700 pb-2';
        header.textContent = groupName;
        wrapper.appendChild(header);

        const table = document.createElement('table');
        table.className = 'w-full text-sm text-left';

        // Header
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        trHead.className = 'border-b border-slate-700';
        ['No', 'Rasio', 'Satuan', ...years, 'Interpretasi'].forEach(text => {
            const th = document.createElement('th');
            th.className = 'px-3 py-2 text-xs font-bold text-slate-400 uppercase';
            th.textContent = text;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        ratios.forEach((ratio, idx) => {
            // Baris Nilai
            const trValue = document.createElement('tr');
            trValue.className = 'border-b border-slate-700/50';
            // No
            const tdNo = document.createElement('td');
            tdNo.className = 'px-3 py-2 text-white font-bold';
            tdNo.textContent = no++;
            trValue.appendChild(tdNo);
            // Label
            const tdLabel = document.createElement('td');
            tdLabel.className = 'px-3 py-2 text-white';
            tdLabel.textContent = ratio.label;
            trValue.appendChild(tdLabel);
            // Satuan
            const tdSatuan = document.createElement('td');
            tdSatuan.className = 'px-3 py-2 text-slate-400';
            tdSatuan.textContent = ratio.satuan;
            trValue.appendChild(tdSatuan);
            // Values per tahun
            ratio.values.forEach(val => {
                const td = document.createElement('td');
                td.className = 'px-3 py-2 text-white font-mono';
                td.textContent = val.toLocaleString('id-ID', { maximumFractionDigits: 2 });
                trValue.appendChild(td);
            });
            // Interpretasi
            const tdInterpretasi = document.createElement('td');
            tdInterpretasi.className = 'px-3 py-2 text-sm text-slate-300 max-w-xs';
            const analysis = analyses[ratio.ratioId] || analyzeTrend(ratio.values);
            tdInterpretasi.textContent = analysis;
            trValue.appendChild(tdInterpretasi);
            tbody.appendChild(trValue);

            // Baris Growth
            const trGrowth = document.createElement('tr');
            trGrowth.className = 'border-b border-slate-700/30 bg-slate-800/30';
            const tdEmpty = document.createElement('td');
            tdEmpty.className = 'px-3 py-1 text-xs text-slate-400';
            tdEmpty.textContent = 'Growth';
            trGrowth.appendChild(tdEmpty);
            const tdEmpty2 = document.createElement('td');
            tdEmpty2.className = 'px-3 py-1';
            trGrowth.appendChild(tdEmpty2);
            const tdEmpty3 = document.createElement('td');
            tdEmpty3.className = 'px-3 py-1';
            trGrowth.appendChild(tdEmpty3);
            // Growth values
            ratio.growth.forEach((g, i) => {
                const td = document.createElement('td');
                td.className = 'px-3 py-1 text-xs font-mono';
                if (i === 0) {
                    td.textContent = '0%';
                    td.className += ' text-slate-500';
                } else {
                    const color = g > 0 ? 'text-emerald-400' : g < 0 ? 'text-rose-400' : 'text-slate-400';
                    td.textContent = g.toFixed(1) + '%';
                    td.className += ' ' + color;
                }
                trGrowth.appendChild(td);
            });
            // Growth interpretasi (kosong)
            const tdEmpty4 = document.createElement('td');
            tdEmpty4.className = 'px-3 py-1';
            trGrowth.appendChild(tdEmpty4);
            tbody.appendChild(trGrowth);
        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        container.appendChild(wrapper);
    }

    // Jika tidak ada data
    if (Object.keys(groups).length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 py-12">Tidak ada data rasio untuk ditampilkan.</div>';
    }
}