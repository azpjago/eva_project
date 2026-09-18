// ===== RASIO PRODUKTIVITAS =====
let rasioData = [];
let currentYearsKey = ''; 

// ===== INJECT CSS ANIMASI TYPING =====
(function injectTypingCSS() {
    if (document.getElementById('rasioTypingCSS')) return;
    const style = document.createElement('style');
    style.id = 'rasioTypingCSS';
    style.textContent = `
        .typing-dots {
            display: inline-flex;
            gap: 4px;
            align-items: center;
            padding: 4px 0;
        }
        .typing-dots span {
            width: 7px;
            height: 7px;
            background: #14b8a6;
            border-radius: 50%;
            display: inline-block;
            animation: typingBounce 1.4s infinite ease-in-out both;
        }
        .typing-dots span:nth-child(1) { animation-delay: 0s; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
        .pulse-glow {
            animation: pulseGlow 1.8s ease-in-out infinite;
        }
        @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(20, 184, 166, 0); }
        }
    `;
    document.head.appendChild(style);
})();

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
async function applyFilterRasio() {
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

    const allYears = Array.from(select.options).map(opt => opt.value);
    const sortedAll = [...allYears].sort((a, b) => b.localeCompare(a));
    const latest3 = sortedAll.slice(0, 3);
    selectedYears = selectedYears.filter(y => latest3.includes(y));
    if (selectedYears.length > 3) selectedYears = selectedYears.slice(0, 3);

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
    currentYearsKey = dataTahun.map(d => d.tahun).join(',');

    document.getElementById('loadingRasio').classList.remove('hidden');
    document.getElementById('rasioContainer').innerHTML = '';

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

    // ===== CACHING =====
    // Key cache = hash dari years + semua nilai (biar tidak re-call AI untuk data yang sama)
    const cacheKey = 'eva_rasio_ai_' + btoa(JSON.stringify({
        years: dataTahun.map(d => d.tahun),
        ratios: allRatios.map(r => [r.ratioId, r.values.map(v => Math.round(v * 100) / 100)])
    })).slice(0, 80);

    let analyses = null;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            analyses = JSON.parse(cached);
            console.log("✅ Memakai cache EVA analisis.");
        }
    } catch (e) { /* ignore */ }

    if (!analyses) {
        console.log("🤖 Memanggil EVA untuk analisis rasio...");
        analyses = await analyzeRatios(allRatios, dataTahun);
        try {
            localStorage.setItem(cacheKey, JSON.stringify(analyses));
        } catch (e) { /* ignore quota error */ }
    }

    document.getElementById('loadingRasio').classList.add('hidden');
    renderRasioTable(allRatios, analyses);
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
                    satuan: r.satuan,
                    deskripsi: r.deskripsi,
                    values: r.values,
                    growth: r.growth,
                    years: r.years
                }))
            })
        });
        if (!response.ok) throw new Error('EVA analysis failed: ' + response.status);
        const result = await response.json();
        console.log('🔍 Response EVA mentah:', result);       // ← DEBUG LOG
        console.log('🔍 Analyses:', result.analyses);        // ← DEBUG LOG
        return result.analyses || {};
    } catch (err) {
        console.error('❌ EVA error:', err);
        // Fallback if-else sederhana
        const fallback = {};
        allRatios.forEach(r => {
            const values = r.values;
            let trend = 'stabil', status = 'positif';
            let short = 'Data tidak cukup.';
            if (values.length >= 2) {
                const first = values[0], last = values[values.length - 1];
                if (last > first) { trend = 'naik'; status = 'positif'; short = `Meningkat dari ${first.toFixed(2)} ke ${last.toFixed(2)}.`; }
                else if (last < first) { trend = 'turun'; status = 'warning'; short = `Menurun dari ${first.toFixed(2)} ke ${last.toFixed(2)}.`; }
                else { short = `Stabil di ${first.toFixed(2)}.`; }
            }
            fallback[r.ratioId] = {
                short,
                detailed: short + ' (EVA sedang tidak tersedia, analisis mendetail tidak dapat ditampilkan.)',
                recommendations: [],
                trend, status
            };
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

function safeText(v, defaultVal = '-') {
    if (v === null || v === undefined) return defaultVal;
    if (typeof v === 'string') return v.trim() || defaultVal;
    if (typeof v === 'number') return String(v);
    if (Array.isArray(v)) return v.map(x => safeText(x, '')).filter(Boolean).join(' ') || defaultVal;
    if (typeof v === 'object') {
        // Gabungkan semua string value
        return Object.values(v).map(x => safeText(x, '')).filter(Boolean).join(' ') || defaultVal;
    }
    return String(v);
}

// ===== RENDER TABEL =====
function renderRasioTable(allRatios, analyses) {
    const container = document.getElementById('rasioContainer');
    container.innerHTML = '';

    if (!allRatios || allRatios.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 py-12">Tidak ada data rasio untuk ditampilkan.</div>';
        return;
    }

    // Simpan analyses ke global untuk diakses modal
    window.__rasioAnalyses = analyses;

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

        ratios.forEach((ratio) => {
            const analysis = analyses[ratio.ratioId] || {};
            const shortText = safeText(analysis.short, '-');
            const status = analysis.status || 'positif';
            const trend = analysis.trend || 'stabil';

            const statusColor = status === 'positif' ? 'text-emerald-400'
                              : status === 'warning' ? 'text-amber-400'
                              : 'text-rose-400';
            const trendIcon = trend === 'naik' ? 'fa-arrow-trend-up'
                            : trend === 'turun' ? 'fa-arrow-trend-down'
                            : 'fa-minus';

            // Baris Nilai
            const trValue = document.createElement('tr');
            trValue.className = 'border-b border-slate-700/50';
            const tdNo = document.createElement('td');
            tdNo.className = 'px-3 py-2 text-white font-bold';
            tdNo.textContent = no++;
            trValue.appendChild(tdNo);
            const tdLabel = document.createElement('td');
            tdLabel.className = 'px-3 py-2 text-white';
            tdLabel.textContent = ratio.label;
            trValue.appendChild(tdLabel);
            const tdSatuan = document.createElement('td');
            tdSatuan.className = 'px-3 py-2 text-slate-400';
            tdSatuan.textContent = ratio.satuan;
            trValue.appendChild(tdSatuan);
            ratio.values.forEach(val => {
                const td = document.createElement('td');
                td.className = 'px-3 py-2 text-white font-mono';
                td.textContent = val.toLocaleString('id-ID', { maximumFractionDigits: 2 });
                trValue.appendChild(td);
            });
            // Interpretasi (short)
            const tdInterpretasi = document.createElement('td');
            tdInterpretasi.className = 'px-3 py-2 text-sm max-w-xs';
            tdInterpretasi.innerHTML = `
                <div class="flex items-start gap-2">
                    <i class="fa-solid ${trendIcon} ${statusColor} mt-0.5"></i>
                    <div>
                        <p class="text-slate-300">${shortText}</p>
                        <button onclick="showRasioDetail('${ratio.ratioId}')" 
                                class="mt-1 text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1">
                            <i class="fa-solid fa-circle-info"></i> Lihat Detail
                        </button>
                    </div>
                </div>
            `;
            trValue.appendChild(tdInterpretasi);
            tbody.appendChild(trValue);

            // Baris Growth
            const trGrowth = document.createElement('tr');
            trGrowth.className = 'border-b border-slate-700/30 bg-slate-800/30';
            const tdEmpty = document.createElement('td');
            tdEmpty.className = 'px-3 py-1 text-xs text-slate-400';
            tdEmpty.textContent = 'Growth';
            trGrowth.appendChild(tdEmpty);
            [1, 2].forEach(() => {
                const td = document.createElement('td');
                td.className = 'px-3 py-1';
                trGrowth.appendChild(td);
            });
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
            const tdEmpty4 = document.createElement('td');
            tdEmpty4.className = 'px-3 py-1';
            trGrowth.appendChild(tdEmpty4);
            tbody.appendChild(trGrowth);
        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        container.appendChild(wrapper);
    }
}

// ===== MODAL DETAIL =====
function showRasioDetail(ratioId) {
    const analyses = window.__rasioAnalyses || {};
    const a = analyses[ratioId];
    if (!a) {
        alert('Analisis detail belum tersedia.');
        return;
    }

    let ratioInfo = null;
    RATIO_GROUPS.forEach(g => {
        g.ratios.forEach(r => {
            if (r.id === ratioId) ratioInfo = r;
        });
    });

    const statusColor = a.status === 'positif' ? 'text-emerald-400'
                      : a.status === 'warning' ? 'text-amber-400'
                      : 'text-rose-400';
    const statusLabel = a.status === 'positif' ? 'POSITIF'
                      : a.status === 'warning' ? 'PERLU PERHATIAN'
                      : 'NEGATIF';
    const statusBg = a.status === 'positif' ? 'bg-emerald-500/10 border-emerald-500/30'
                    : a.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-rose-500/10 border-rose-500/30';

    const recs = (Array.isArray(a.recommendations) ? a.recommendations : [])
        .map(r => safeText(r, '')).filter(x => x);
    const recsHtml = recs.length > 0
    ? `<ol class="space-y-2.5">${recs.map((r, i) => `
        <li class="flex items-start gap-2 text-sm text-slate-200">
            <span class="shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold flex items-center justify-center mt-0.5">${i + 1}</span>
            <span>${r}</span>
        </li>`).join('')}</ol>`
    : '<p class="text-sm text-slate-400 italic">Belum ada saran spesifik.</p>';

    const oldModal = document.getElementById('rasioDetailModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'rasioDetailModal';
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-7xl w-full border border-slate-700 shadow-2xl my-8">
            <!-- Header -->
            <div class="flex items-start justify-between p-5 border-b border-slate-700">
                <div>
                    <h3 class="text-lg font-bold text-white">${ratioInfo?.label || 'Detail Rasio'}</h3>
                    <p class="text-xs text-slate-400 mt-1">${ratioInfo?.deskripsi || ''}</p>
                </div>
                <button onclick="document.getElementById('rasioDetailModal').remove()" 
                        class="text-slate-400 hover:text-white transition p-1">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

            <!-- Body: 2 kolom -->
            <div class="grid grid-cols-1 lg:grid-cols-2">
                <!-- KOLOM KIRI: Analisis -->
                <div class="p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-700 max-h-[70vh] overflow-y-auto">
                    <!-- Status -->
                    <div class="${statusBg} border rounded-xl p-3 flex items-center gap-3">
                        <i class="fa-solid fa-circle-check ${statusColor} text-lg"></i>
                        <div>
                            <div class="text-xs text-slate-400">Status</div>
                            <div class="font-bold ${statusColor}">${statusLabel}</div>
                        </div>
                    </div>

                    <!-- Analisis Mendalam -->
                    <div>
                        <h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <i class="fa-solid fa-magnifying-glass-chart text-teal-400"></i> Analisis Mendalam
                        </h4>
                        <p class="text-sm text-slate-200 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            ${safeText(a.detailed || a.short, '-')}
                        </p>
                    </div>

                    <!-- Saran Perbaikan -->
                    <div>
                        <h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <i class="fa-solid fa-lightbulb text-amber-400"></i> Saran Perbaikan
                        </h4>
                        <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            ${recsHtml}
                        </div>
                    </div>
                </div>

                <!-- KOLOM KANAN: Dialog AI -->
                <div class="flex flex-col max-h-[70vh]">
                    <!-- Header dialog -->
                    <div class="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-900/30">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-robot text-teal-400"></i>
                            <span class="text-sm font-bold text-white">Diskusi dengan EVA</span>
                        </div>
                        <button onclick="clearRasioDialog('${ratioId}')" 
                                class="text-xs px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg transition flex items-center gap-1">
                            <i class="fa-solid fa-trash-can text-[10px]"></i> Clear
                        </button>
                    </div>

                    <!-- Chat history -->
                    <div id="rasioDialogHistory" class="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-900/20">
                        <p class="text-xs text-slate-500 italic text-center">Memuat riwayat...</p>
                    </div>

                    <!-- Input -->
                    <div class="p-4 border-t border-slate-700 bg-slate-900/40">
                        <div class="flex gap-2 items-end">
                            <textarea id="rasioDialogInput" rows="2"
                                      placeholder="Tanya EVA tentang rasio ini... (misal: kenapa turun? apa solusinya?)"
                                      class="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                                      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendRasioDialog('${ratioId}');}"></textarea>
                            <button onclick="sendRasioDialog('${ratioId}')" id="btnSendRasioDialog"
                                    class="px-4 h-10 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition flex items-center gap-1.5 shrink-0">
                                <span>Kirim</span> <i class="fa-solid fa-paper-plane text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-700 flex justify-end">
                <button onclick="document.getElementById('rasioDetailModal').remove()" 
                        class="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition">
                    Tutup
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Simpan ratioId aktif di modal
    modal.dataset.ratioId = ratioId;
    loadRasioDialog(ratioId);
}

// ===== LOAD RIWAYAT DIALOG =====
async function loadRasioDialog(ratioId) {
    const box = document.getElementById('rasioDialogHistory');
    if (!box) return;
    box.innerHTML = '<p class="text-xs text-slate-500 italic text-center">Memuat riwayat...</p>';

    try {
        const token = localStorage.getItem('eva_token');
        const url = `/api/rasio/dialog/${encodeURIComponent(ratioId)}?years_key=${encodeURIComponent(currentYearsKey)}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat');
        const data = await response.json();

        if (!data || data.length === 0) {
            box.innerHTML = `
                <div class="text-center text-slate-500 text-xs mt-8 flex flex-col items-center gap-2">
                    <i class="fa-solid fa-comments text-2xl text-slate-600"></i>
                    <span>Belum ada diskusi. Mulai dengan bertanya ke EVA!</span>
                </div>`;
            return;
        }

        box.innerHTML = '';
        data.forEach(msg => appendRasioDialogUI(msg));
        box.scrollTop = box.scrollHeight;
    } catch (err) {
        console.error('Error load dialog:', err);
        box.innerHTML = '<p class="text-xs text-rose-400 italic text-center">Gagal memuat riwayat.</p>';
    }
}

// ===== TAMPILKAN SATU PESAN DI DIALOG =====
function appendRasioDialogUI(msg) {
    const box = document.getElementById('rasioDialogHistory');
    if (!box) return;
    const isUser = msg.role === 'user';
    const align = isUser ? 'justify-end' : 'justify-start';
    const bubble = isUser 
        ? 'bg-teal-600 text-white rounded-br-none' 
        : 'bg-slate-700 text-slate-100 rounded-bl-none';
    const icon = isUser ? '' 
        : '<div class="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0 text-teal-400 mt-0.5"><i class="fa-solid fa-robot text-[10px]"></i></div>';

    const parsedText = isUser
        ? (window.escapeHtmlRasio ? escapeHtmlRasio(msg.content) : msg.content).replace(/\n/g, '<br>')
        : (typeof marked !== 'undefined' ? marked.parse(msg.content) : msg.content);

    if (box.innerHTML.includes('Belum ada diskusi')) box.innerHTML = '';

    box.innerHTML += `
        <div class="flex ${align} gap-2 w-full" data-msg-id="${msg.id || ''}">
            ${icon}
            <div class="max-w-[85%] p-2.5 rounded-2xl ${bubble} prose prose-invert prose-p:my-1 prose-ul:my-1 text-[13px] shadow-md shadow-slate-900/20">
                ${parsedText}
            </div>
        </div>`;
    box.scrollTop = box.scrollHeight;
}

async function sendRasioDialog(ratioId) {
    const input = document.getElementById('rasioDialogInput');
    const btn = document.getElementById('btnSendRasioDialog');
    const text = input.value.trim();
    if (!text) return;

    let ratioInfo = null;
    RATIO_GROUPS.forEach(g => {
        g.ratios.forEach(r => { if (r.id === ratioId) ratioInfo = r; });
    });

    const a = (window.__rasioAnalyses || {})[ratioId] || {};
    const years = rasioData.map(d => d.tahun);
    const values = rasioData.map(d => ratioInfo ? ratioInfo.calc(d) : 0);

    const box = document.getElementById('rasioDialogHistory');
    if (box && box.innerHTML.includes('Belum ada diskusi')) box.innerHTML = '';

    // 1. Tampilkan pesan user (optimistic)
    appendRasioDialogUI({ id: 'temp-user-' + Date.now(), role: 'user', content: text });

    input.value = '';
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i>';

    // 2. Tampilkan typing indicator AI
    const typingId = 'typing-' + Date.now();
    showTypingIndicator(typingId);

    try {
        const token = localStorage.getItem('eva_token');
        const response = await fetch('/api/rasio/dialog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ratio_id: ratioId,
                years_key: currentYearsKey,
                content: text,
                ratio_label: ratioInfo?.label,
                ratio_deskripsi: ratioInfo?.deskripsi,
                years: years,
                values: values,
                analysis_summary: safeText(a.short || a.detailed, '')
            })
        });
        if (!response.ok) throw new Error('Gagal mengirim');

        // 3. Hapus typing indicator & reload riwayat
        removeTypingIndicator(typingId);
        await loadRasioDialog(ratioId);
    } catch (err) {
        console.error('Error kirim dialog:', err);
        removeTypingIndicator(typingId);
        appendRasioDialogUI({
            id: 'err-' + Date.now(),
            role: 'model',
            content: '❌ Maaf, gagal mengirim pesan. Coba lagi.'
        });
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Kirim</span> <i class="fa-solid fa-paper-plane text-xs"></i>';
        // Fokus kembali ke input
        input.focus();
    }
}

// ===== TYPING INDICATOR =====
function showTypingIndicator(id) {
    const box = document.getElementById('rasioDialogHistory');
    if (!box) return;
    const html = `
        <div class="flex justify-start gap-2 w-full" id="${id}">
            <div class="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0 text-teal-400 mt-0.5 pulse-glow">
                <i class="fa-solid fa-robot text-[10px]"></i>
            </div>
            <div class="bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-md shadow-slate-900/20 flex items-center gap-2">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
                <span class="text-[11px] text-slate-400 ml-1">EVA sedang menganalisis...</span>
            </div>
        </div>`;
    box.insertAdjacentHTML('beforeend', html);
    box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ===== HAPUS RIWAYAT DIALOG =====
async function clearRasioDialog(ratioId) {
    if (!confirm('Hapus seluruh riwayat dialog untuk rasio ini?')) return;
    try {
        const token = localStorage.getItem('eva_token');
        const url = `/api/rasio/dialog/${encodeURIComponent(ratioId)}?years_key=${encodeURIComponent(currentYearsKey)}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal menghapus');
        await loadRasioDialog(ratioId);
    } catch (err) {
        console.error('Error clear dialog:', err);
        alert('Gagal menghapus riwayat dialog.');
    }
}

// ===== HELPER ESCAPE HTML =====
function escapeHtmlRasio(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}