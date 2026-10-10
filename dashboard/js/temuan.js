// ============================================================
// TEMUAN & TINDAK LANJUT
// ============================================================

let currentTemuanTab = 'temuan';
let temuanCache = [];

// ===== INIT =====
function initTemuan() {
    loadKategoriOptions();
    loadTemuanList();
}

// ===== SWITCH TAB =====
function switchTemuanTab(tab) {
    currentTemuanTab = tab;

    // Sembunyikan semua panel
    document.getElementById('temuanPanelList').classList.add('hidden');
    document.getElementById('temuanPanelPic').classList.add('hidden');
    document.getElementById('temuanPanelDashboard').classList.add('hidden');

    // Reset class semua tab button
    const activeCls = 'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition bg-teal-500 text-white shadow-md flex items-center justify-center gap-2';
    const inactiveCls = 'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2';

    document.getElementById('btnTabTemuanList').className = tab === 'temuan' ? activeCls : inactiveCls;
    document.getElementById('btnTabTemuanPic').className = tab === 'pic' ? activeCls : inactiveCls;
    document.getElementById('btnTabTemuanDashboard').className = tab === 'dashboard' ? activeCls : inactiveCls;

    // Tampilkan panel yang aktif
    if (tab === 'temuan') {
        document.getElementById('temuanPanelList').classList.remove('hidden');
        loadTemuanList();
    } else if (tab === 'pic') {
        document.getElementById('temuanPanelPic').classList.remove('hidden');
        if (typeof loadPICPanel === 'function') loadPICPanel();
    } else if (tab === 'dashboard') {
        document.getElementById('temuanPanelDashboard').classList.remove('hidden');
        if (typeof loadDashboardTemuan === 'function') loadDashboardTemuan();
    }
}

// ===== LOAD KATEGORI OPTIONS =====
async function loadKategoriOptions() {
    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch('/api/pic/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await r.json();
        const select = document.getElementById('filterTemuanKategori');
        if (!select) return;
        select.innerHTML = '<option value="">Semua</option>';
        (data.categories || []).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.label}`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Error load kategori:', err);
    }
}

// ===== RESET FILTER =====
function resetFilterTemuan() {
    document.getElementById('filterTemuanStatus').value = '';
    document.getElementById('filterTemuanPrioritas').value = '';
    document.getElementById('filterTemuanKategori').value = '';
    loadTemuanList();
}

// ===== ANALISIS TEMUAN (panggil AI) =====
// ===== ANALISIS TEMUAN (dengan konfirmasi 3 lapis) =====
async function analyzeTemuan() {
    // Tampilkan dialog konfirmasi dulu
    showAnalyzeConfirmModal();
}

function showAnalyzeConfirmModal() {
    const oldModal = document.getElementById('analyzeConfirmModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'analyzeConfirmModal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 overflow-y-auto';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl my-8">
            <div class="p-5 border-b border-slate-200 flex items-start justify-between">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <i class="fa-solid fa-triangle-exclamation text-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-slate-900">Konfirmasi Analisis Ulang</h3>
                        <p class="text-xs text-slate-500 mt-1">Sistem akan menganalisis data EVA dengan 3 lapis proteksi.</p>
                    </div>
                </div>
                <button onclick="document.getElementById('analyzeConfirmModal').remove()" 
                        class="text-slate-400 hover:text-slate-900 p-1 transition">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <div class="p-5 space-y-3">
                <div class="bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <div class="flex items-start gap-2">
                        <i class="fa-solid fa-rotate text-teal-600 mt-0.5"></i>
                        <div>
                            <div class="text-xs font-bold text-teal-800">Update Otomatis</div>
                            <p class="text-[11px] text-teal-700 mt-0.5">
                                Temuan lama dengan <strong>kategori + metrik + arah tren sama</strong> akan diperbarui — tidak buat duplikat.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div class="flex items-start gap-2">
                        <i class="fa-solid fa-broom text-amber-600 mt-0.5"></i>
                        <div>
                            <div class="text-xs font-bold text-amber-800">Bersihkan yang Obsolete</div>
                            <p class="text-[11px] text-amber-700 mt-0.5">
                                Temuan <strong>status "open"</strong> yang tidak ditemukan lagi di analisis baru akan <strong>otomatis dihapus</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div class="flex items-start gap-2">
                        <i class="fa-solid fa-shield-halved text-emerald-600 mt-0.5"></i>
                        <div>
                            <div class="text-xs font-bold text-emerald-800">Temuan Aktif Dilindungi</div>
                            <p class="text-[11px] text-emerald-700 mt-0.5">
                                Temuan berstatus <strong>"in_progress"</strong> dan <strong>"resolved"</strong> tidak akan diganggu (PIC & status aman).
                            </p>
                        </div>
                    </div>
                </div>

                <div class="text-[11px] text-slate-500 italic pt-2 border-t border-slate-100">
                    💡 Proses ini memakan waktu 5-15 detik.
                </div>
            </div>

            <div class="p-4 border-t border-slate-200 flex justify-end gap-2">
                <button onclick="document.getElementById('analyzeConfirmModal').remove()"
                        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition">
                    Batal
                </button>
                <button onclick="document.getElementById('analyzeConfirmModal').remove(); runAnalyzeTemuan();"
                        class="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-sm transition flex items-center gap-2">
                    <i class="fa-solid fa-wand-magic-sparkles text-xs"></i> Ya, Analisis Ulang
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== EKSEKUSI ANALISIS =====
async function runAnalyzeTemuan() {
    const btn = document.getElementById('btnAnalyzeTemuan');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Menganalisis...';

    const listContainer = document.getElementById('temuanListContainer');
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
                <i class="fa-solid fa-wand-magic-sparkles text-4xl text-teal-500 mb-3 animate-pulse"></i>
                <p class="text-slate-700 font-semibold mb-1">AI sedang menganalisis data Anda...</p>
                <p class="text-slate-500 text-sm">Proses ini membutuhkan 5-15 detik. Mohon tunggu.</p>
            </div>
        `;
    }

    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch('/api/temuan/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tahun_list: [], force_refresh: true })
        });

        if (!r.ok) {
            const err = await r.text();
            throw new Error(err.substring(0, 200));
        }

        const data = await r.json();
        console.log('✅ Analisis selesai:', data);

        // Toast dengan info lengkap
        const parts = [];
        if (data.temuan_baru > 0) parts.push(`${data.temuan_baru} baru`);
        if (data.temuan_updated > 0) parts.push(`${data.temuan_updated} diperbarui`);
        if (data.temuan_deleted > 0) parts.push(`${data.temuan_deleted} dihapus`);
        
        showToast(`✅ ${parts.join(', ') || 'Analisis selesai'}`);

        await loadTemuanList();
    } catch (err) {
        console.error('Error analyze:', err);
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="bg-rose-50 rounded-2xl p-8 border border-rose-200 text-center">
                    <i class="fa-solid fa-triangle-exclamation text-3xl text-rose-500 mb-2"></i>
                    <p class="text-rose-700 font-semibold">Gagal menganalisis</p>
                    <p class="text-rose-600 text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

// ===== LOAD LIST TEMUAN =====
async function loadTemuanList() {
    const container = document.getElementById('temuanListContainer');
    if (!container) return;

    const token = localStorage.getItem('eva_token');
    const status = document.getElementById('filterTemuanStatus').value;
    const prioritas = document.getElementById('filterTemuanPrioritas').value;
    const kategori = document.getElementById('filterTemuanKategori').value;

    // Build query string
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (prioritas) params.append('prioritas', prioritas);
    if (kategori) params.append('kategori', kategori);

    try {
        const r = await fetch(`/api/temuan?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!r.ok) throw new Error('Gagal memuat temuan');

        const data = await r.json();
        temuanCache = data;

        // Update stats
        updateTemuanStats(data);

        if (data.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-2xl p-12 border border-dashed border-slate-300 text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <i class="fa-solid fa-clipboard-check text-teal-500 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 mb-2">Belum Ada Temuan</h3>
                    <p class="text-slate-500 text-sm max-w-md mx-auto mb-5">
                        Klik tombol <strong>"Analisis Ulang"</strong> untuk memulai analisis otomatis dari data kalkulator Anda.
                    </p>
                    <button onclick="analyzeTemuan()" class="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm transition inline-flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Mulai Analisis
                    </button>
                </div>
            `;
            return;
        }

        // Render list
        container.innerHTML = data.map(t => renderTemuanCard(t)).join('');
    } catch (err) {
        console.error('Error load temuan:', err);
        container.innerHTML = `
            <div class="bg-rose-50 rounded-2xl p-8 border border-rose-200 text-center">
                <i class="fa-solid fa-triangle-exclamation text-2xl text-rose-500 mb-2"></i>
                <p class="text-rose-700 text-sm">${err.message}</p>
            </div>
        `;
    }
}

// ===== STATISTIK KECIL =====
function updateTemuanStats(data) {
    const stats = document.getElementById('temuanStats');
    if (!stats) return;

    const total = data.length;
    const tinggi = data.filter(t => t.prioritas === 'tinggi').length;
    const open = data.filter(t => t.status === 'open').length;
    const resolved = data.filter(t => t.status === 'resolved').length;

    stats.innerHTML = `
        <div class="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total</div>
            <div class="text-2xl font-extrabold text-slate-900">${total}</div>
        </div>
        <div class="bg-rose-50 rounded-xl p-3 border border-rose-200 shadow-sm">
            <div class="text-[10px] text-rose-600 uppercase font-bold tracking-wider">Prioritas Tinggi</div>
            <div class="text-2xl font-extrabold text-rose-600">${tinggi}</div>
        </div>
        <div class="bg-blue-50 rounded-xl p-3 border border-blue-200 shadow-sm">
            <div class="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Open</div>
            <div class="text-2xl font-extrabold text-blue-600">${open}</div>
        </div>
        <div class="bg-emerald-50 rounded-xl p-3 border border-emerald-200 shadow-sm">
            <div class="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Selesai</div>
            <div class="text-2xl font-extrabold text-emerald-600">${resolved}</div>
        </div>
    `;
}

// ===== RENDER CARD TEMUAN =====
function renderTemuanCard(t) {
    const prioMap = {
        tinggi: { emoji: '🔴', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: 'TINGGI' },
        sedang: { emoji: '🟡', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'SEDANG' },
        rendah: { emoji: '🟢', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'RENDAH' },
    };
    const statMap = {
        open: { emoji: '🔵', label: 'Open', color: 'text-blue-600 bg-blue-50 border-blue-200' },
        in_progress: { emoji: '🟠', label: 'In Progress', color: 'text-amber-600 bg-amber-50 border-amber-200' },
        resolved: { emoji: '✅', label: 'Resolved', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        on_hold: { emoji: '⏸️', label: 'On Hold', color: 'text-slate-600 bg-slate-50 border-slate-200' },
    };
    const prio = prioMap[t.prioritas] || prioMap.sedang;
    const stat = statMap[t.status] || statMap.open;

    return `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div class="p-5">
                <!-- Header -->
                <div class="flex items-start gap-3 mb-3">
                    <div class="shrink-0 w-10 h-10 rounded-xl ${prio.bg} ${prio.border} border flex items-center justify-center text-lg">
                        ${prio.emoji}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center flex-wrap gap-2 mb-1">
                            <span class="text-[10px] font-bold ${prio.text} uppercase tracking-wider">${prio.label}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${stat.color}">${stat.emoji} ${stat.label}</span>
                            <span class="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">${t.kategori}</span>
                        </div>
                        <h3 class="text-base font-bold text-slate-900 leading-tight">${escapeHtml(t.judul)}</h3>
                    </div>
                </div>

                <!-- Deskripsi -->
                <p class="text-sm text-slate-600 leading-relaxed mb-3">${escapeHtml(t.deskripsi).substring(0, 250)}${t.deskripsi.length > 250 ? '...' : ''}</p>

                <!-- Data Pendukung (jika ada) -->
                ${renderDataPendukung(t.data_pendukung)}

                <!-- Meta Info -->
                <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span><i class="fa-solid fa-calendar text-slate-400"></i> ${t.tahun}</span>
                    <span><i class="fa-solid fa-user-tie text-slate-400"></i> PIC: ${t.pic_id ? `#${t.pic_id}` : '<em>Belum ditunjuk</em>'}</span>
                </div>
            </div>

            <!-- Action Bar -->
            <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button onclick="showTemuanDetail(${t.id})"
                        class="text-xs px-3.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-info text-[10px]"></i> Lihat Detail
                </button>
                <div class="flex items-center gap-1.5">
                    <button onclick="showUpdateStatus(${t.id}, '${t.status}')"
                            class="text-xs px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition flex items-center gap-1">
                        <i class="fa-solid fa-pen text-[10px]"></i> Status
                    </button>
                    <button onclick="deleteTemuanConfirm(${t.id})"
                            class="text-xs px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-semibold rounded-lg border border-slate-200 transition flex items-center gap-1">
                        <i class="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderDataPendukung(dp) {
    if (!dp || typeof dp !== 'object') return '';
    if (!dp.metrik || !dp.nilai) return '';

    const nilaiArr = Array.isArray(dp.nilai) ? dp.nilai : [];
    const tahunArr = Array.isArray(dp.tahun) ? dp.tahun : [];
    if (nilaiArr.length === 0) return '';

    // Cari nilai max, minimal 1 untuk hindari divide by zero
    const maxVal = Math.max(...nilaiArr.map(v => Number(v) || 0), 1);
    const CONTAINER_H = 64;     // px — tinggi total area bar
    const LABEL_H = 14;          // px — ruang untuk label tahun
    const BAR_MAX_H = CONTAINER_H - LABEL_H;  // 50px max bar

    const bars = nilaiArr.map((v, i) => {
        const numVal = Number(v) || 0;
        // Bar height dalam pixel — minimal 6px agar tetap terlihat
        const barHeight = Math.max(6, (numVal / maxVal) * BAR_MAX_H);
        const isLast = i === nilaiArr.length - 1;
        const color = isLast ? 'bg-teal-500' : 'bg-teal-300';

        return `
            <div class="flex-1 flex flex-col items-center justify-end" style="height: ${CONTAINER_H}px;">
                <div class="${color} rounded-t w-full transition-all" 
                     style="height: ${barHeight}px;"
                     title="${numVal.toLocaleString('id-ID')}">
                </div>
                <span class="text-[9px] text-slate-500 font-semibold mt-1">${tahunArr[i] || ''}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 mt-3">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                📊 ${escapeHtml(dp.metrik)}
            </div>
            <div class="flex items-end gap-1.5">
                ${bars}
            </div>
        </div>
    `;
}

// ===== UPDATE STATUS =====
async function showUpdateStatus(temuanId, currentStatus) {
    const newStatus = prompt(
        `Update status temuan #${temuanId}\n\nPilihan:\n1. open\n2. in_progress\n3. resolved\n4. on_hold\n\nMasukkan status baru:`,
        currentStatus
    );
    if (!newStatus || newStatus === currentStatus) return;
    if (!['open', 'in_progress', 'resolved', 'on_hold'].includes(newStatus)) {
        alert('Status tidak valid!');
        return;
    }
    const catatan = prompt('Catatan (opsional):', '') || '';

    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch(`/api/temuan/${temuanId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus, catatan })
        });
        if (!r.ok) throw new Error('Gagal update status');
        showToast('✅ Status berhasil diupdate');
        loadTemuanList();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== DELETE =====
async function deleteTemuanConfirm(temuanId) {
    if (!confirm(`Hapus temuan #${temuanId}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch(`/api/temuan/${temuanId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!r.ok) throw new Error('Gagal hapus');
        showToast('🗑️ Temuan dihapus');
        loadTemuanList();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== DETAIL MODAL =====
async function showTemuanDetail(temuanId) {
    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch(`/api/temuan/${temuanId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!r.ok) throw new Error('Gagal memuat detail');
        const t = await r.json();

        // Ambil list PIC untuk matching (kalau belum di-load)
        if (!picData || picData.length === 0) {
            try {
                const rPic = await fetch('/api/pic', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (rPic.ok) {
                    picData = await rPic.json();
                    picDataById = {};
                    picData.forEach(p => { picDataById[p.id] = p; });
                }
            } catch (e) {
                console.warn('Gagal load PIC:', e);
            }
        }

        const prioMap = {
            tinggi: { emoji: '🔴', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
            sedang: { emoji: '🟡', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
            rendah: { emoji: '🟢', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
        };
        const prio = prioMap[t.prioritas] || prioMap.sedang;

        // Ambil PIC yang sudah di-assign (kalau ada)
        const assignedPic = t.pic_id ? picDataById[t.pic_id] : null;

        // Cari PIC yang cocok berdasarkan kategori temuan
        const matchingPics = findMatchingPICs(t.kategori);

        // Render PIC section
        const picSectionHtml = renderPICAssignmentSection(t, assignedPic, matchingPics);

        const modal = document.createElement('div');
        modal.id = 'temuanDetailModal';
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8">
                <!-- Header -->
                <div class="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="shrink-0 w-12 h-12 rounded-xl ${prio.bg} ${prio.border} border flex items-center justify-center text-2xl">
                            ${prio.emoji}
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-slate-900 leading-tight">${escapeHtml(t.judul)}</h3>
                            <div class="flex items-center flex-wrap gap-2 mt-1.5">
                                <span class="text-[10px] font-bold ${prio.text} uppercase">${t.prioritas}</span>
                                <span class="text-[10px] text-slate-500">•</span>
                                <span class="text-[10px] text-slate-500">${t.kategori}</span>
                                <span class="text-[10px] text-slate-500">•</span>
                                <span class="text-[10px] text-slate-500">${t.tahun}</span>
                            </div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('temuanDetailModal').remove()" 
                            class="text-slate-400 hover:text-slate-900 p-1 transition">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <!-- Body -->
                <div class="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    <!-- Deskripsi -->
                    <div>
                        <h4 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <i class="fa-solid fa-file-lines text-teal-500"></i> Deskripsi
                        </h4>
                        <p class="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">${escapeHtml(t.deskripsi)}</p>
                    </div>

                    <!-- Dampak -->
                    ${t.dampak ? `
                    <div>
                        <h4 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation text-amber-500"></i> Dampak
                        </h4>
                        <p class="text-sm text-slate-700 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-200">${escapeHtml(t.dampak)}</p>
                    </div>` : ''}

                    <!-- Saran Menggunakan Alat, Teknik dan Metode (ATM) -->
                    ${renderATMSection(t.recommended_methods)}

                    <!-- ===== PIC PENANGGUNG JAWAB (BARU) ===== -->
                    ${picSectionHtml}
                </div>

                <!-- Footer -->
                <div class="p-4 border-t border-slate-200 flex justify-end">
                    <button onclick="document.getElementById('temuanDetailModal').remove()"
                            class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-sm transition">
                        Tutup
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== RENDER SARAN ATM (Alat, Teknik, Metode) =====
function renderATMSection(methods) {
    if (!Array.isArray(methods) || methods.length === 0) {
        return `
            <div>
                <h4 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <i class="fa-solid fa-toolbox text-cyan-500"></i> Saran Menggunakan Alat, Teknik dan Metode (ATM)
                </h4>
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p class="text-xs text-slate-500 italic">Belum ada saran ATM untuk temuan ini.</p>
                </div>
            </div>
        `;
    }

    const colors = [
        { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', icon_bg: 'bg-cyan-100', icon: 'fa-gears' },
        { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon_bg: 'bg-blue-100', icon: 'fa-diagram-project' },
        { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', icon_bg: 'bg-purple-100', icon: 'fa-lightbulb' },
    ];

    const cardsHtml = methods.map((m, i) => {
        const c = colors[i % colors.length];
        const methodName = m.method || 'Metode';
        const fullName = m.full_name || methodName;
        const alasan = m.alasan || '-';
        const penerapan = m.penerapan || '-';

        return `
            <div class="${c.bg} border ${c.border} rounded-xl p-3.5 space-y-2.5">
                <div class="flex items-start gap-2.5">
                    <div class="shrink-0 w-8 h-8 rounded-lg ${c.icon_bg} flex items-center justify-center ${c.text}">
                        <i class="fa-solid ${c.icon} text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-bold ${c.text} text-sm leading-tight">${escapeHtml(methodName)}</div>
                        <div class="text-[10px] text-slate-500 mt-0.5">${escapeHtml(fullName)}</div>
                    </div>
                </div>
                <div class="pl-10 space-y-2 text-xs">
                    <div class="flex items-start gap-2">
                        <span class="text-slate-500 shrink-0">💡</span>
                        <div>
                            <span class="text-slate-500 font-semibold">Alasan:</span>
                            <span class="text-slate-700 ml-1">${escapeHtml(alasan)}</span>
                        </div>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-slate-500 shrink-0">🎯</span>
                        <div>
                            <span class="text-slate-500 font-semibold">Penerapan:</span>
                            <span class="text-slate-700 ml-1">${escapeHtml(penerapan)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div>
            <h4 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <i class="fa-solid fa-toolbox text-cyan-500"></i> Saran Menggunakan Alat, Teknik dan Metode (ATM)
            </h4>
            <div class="space-y-2.5">
                ${cardsHtml}
            </div>
        </div>
    `;
}

// ===== CARI PIC YANG COCOK DENGAN KATEGORI TEMUAN =====
function findMatchingPICs(kategori) {
    if (!picData || picData.length === 0) return [];
    
    return picData
        .filter(p => {
            const kats = p.kategori_tanggung_jawab || [];
            return kats.includes(kategori);
        })
        .sort((a, b) => {
            // Prioritaskan yang sudah punya nama_orang
            const aFilled = (a.nama_orang && a.nama_orang.trim()) ? 1 : 0;
            const bFilled = (b.nama_orang && b.nama_orang.trim()) ? 1 : 0;
            if (aFilled !== bFilled) return bFilled - aFilled;
            // Lalu berdasarkan level (spesifik dulu = level tinggi)
            return b.level - a.level;
        });
}

// ===== RENDER PIC SECTION =====
function renderPICAssignmentSection(temuan, assignedPic, matchingPics) {
    let html = `
        <div class="border-t-2 border-dashed border-slate-200 pt-4">
            <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fa-solid fa-user-tie text-purple-500"></i> PIC Penanggung Jawab
            </h4>
    `;

    if (assignedPic) {
        // Sudah ada PIC di-assign
        const initials = getInitials(assignedPic.nama_orang || assignedPic.nama_jabatan);
        const photoHtml = assignedPic.foto_base64
            ? `<img src="${assignedPic.foto_base64}" class="w-12 h-12 rounded-xl object-cover border border-slate-200">`
            : `<div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">${initials}</div>`;

        html += `
            <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div class="flex items-start gap-3">
                    ${photoHtml}
                    <div class="flex-1 min-w-0">
                        <div class="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">PIC Aktif</div>
                        <div class="font-bold text-sm text-slate-900">
                            ${escapeHtml(assignedPic.nama_orang || '(Belum diisi nama)')}
                        </div>
                        <div class="text-xs text-purple-700">
                            ${escapeHtml(assignedPic.nama_jabatan)}
                            ${assignedPic.departemen ? ` • ${escapeHtml(assignedPic.departemen)}` : ''}
                        </div>
                        ${assignedPic.email ? `<div class="text-[11px] text-slate-500 mt-1"><i class="fa-solid fa-envelope text-[9px]"></i> ${escapeHtml(assignedPic.email)}</div>` : ''}
                        ${assignedPic.telepon ? `<div class="text-[11px] text-slate-500 mt-0.5"><i class="fa-solid fa-phone text-[9px]"></i> ${escapeHtml(assignedPic.telepon)}</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2 mt-3 pt-3 border-t border-purple-200">
                    <button onclick="openAssignPICModal(${temuan.id}, '${temuan.kategori}')"
                            class="text-xs px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition flex items-center gap-1.5">
                        <i class="fa-solid fa-repeat text-[10px]"></i> Ganti PIC
                    </button>
                    <button onclick="removePICAssignment(${temuan.id})"
                            class="text-xs px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-semibold rounded-lg border border-slate-200 transition flex items-center gap-1.5">
                        <i class="fa-solid fa-unlink text-[10px]"></i> Hapus Assign
                    </button>
                </div>
            </div>
        `;
    } else {
        // Belum di-assign
        html += `
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <i class="fa-solid fa-user-slash text-amber-500 text-2xl mb-2"></i>
                <div class="text-xs text-amber-700 font-semibold">Belum ada PIC yang ditunjuk</div>
                <p class="text-[11px] text-amber-600 mt-1">Assign PIC agar temuan ini bisa ditindaklanjuti.</p>
                <button onclick="openAssignPICModal(${temuan.id}, '${temuan.kategori}')"
                        class="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-user-plus text-[10px]"></i> Assign PIC Sekarang
                </button>
            </div>
        `;
    }

    // ===== SARAN PIC (BERDASARKAN KATEGORI) =====
    if (matchingPics.length > 0) {
        html += `
            <div class="mt-3">
                <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    💡 Rekomendasi PIC (kategori: <span class="text-purple-600">${escapeHtml(temuan.kategori)}</span>)
                </div>
                <div class="space-y-2">
                    ${matchingPics.slice(0, 3).map(p => {
                        const initials = getInitials(p.nama_orang || p.nama_jabatan);
                        const photoHtml = p.foto_base64
                            ? `<img src="${p.foto_base64}" class="w-9 h-9 rounded-lg object-cover border border-slate-200">`
                            : `<div class="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">${initials}</div>`;
                        const isAssigned = assignedPic && assignedPic.id === p.id;
                        const isFilled = p.nama_orang && p.nama_orang.trim();
                        
                        return `
                            <div class="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-purple-300 transition">
                                ${photoHtml}
                                <div class="flex-1 min-w-0">
                                    <div class="text-xs font-bold text-slate-900 truncate">
                                        ${escapeHtml(isFilled ? p.nama_orang : p.nama_jabatan)}
                                    </div>
                                    <div class="text-[10px] text-slate-500 truncate">
                                        ${escapeHtml(p.nama_jabatan)} • L${p.level}
                                    </div>
                                </div>
                                ${isAssigned 
                                    ? '<span class="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">✓ DIPILIH</span>'
                                    : `<button onclick="assignPICToTemuan(${temuan.id}, ${p.id})"
                                            class="text-[10px] px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded transition whitespace-nowrap">
                                        Pilih
                                    </button>`
                                }
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                <p class="text-[11px] text-slate-500">
                    <i class="fa-solid fa-info-circle"></i>
                    Tidak ada PIC dengan kategori <strong>${escapeHtml(temuan.kategori)}</strong>.
                    Silakan assign manual atau isi kategori di tab PIC & Struktur.
                </p>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

// ===== ASSIGN PIC KE TEMUAN =====
async function assignPICToTemuan(temuanId, picId) {
    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch(`/api/temuan/${temuanId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pic_id: picId })
        });

        if (!r.ok) throw new Error('Gagal assign PIC');

        showToast('✅ PIC berhasil di-assign');
        
        // Reload modal detail
        document.getElementById('temuanDetailModal').remove();
        setTimeout(() => showTemuanDetail(temuanId), 100);
        
        // Reload list
        loadTemuanList();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== HAPUS ASSIGN PIC =====
async function removePICAssignment(temuanId) {
    if (!confirm('Hapus assign PIC dari temuan ini?')) return;
    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch(`/api/temuan/${temuanId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pic_id: null })
        });

        if (!r.ok) throw new Error('Gagal hapus assign');

        showToast('✅ Assign PIC dihapus');
        document.getElementById('temuanDetailModal').remove();
        setTimeout(() => showTemuanDetail(temuanId), 100);
        loadTemuanList();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== MODAL PILIH PIC =====
function openAssignPICModal(temuanId, kategori) {
    const matchingPics = findMatchingPICs(kategori);
    
    const oldModal = document.getElementById('assignPICModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'assignPICModal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const listHtml = matchingPics.length > 0
        ? matchingPics.map(p => {
            const initials = getInitials(p.nama_orang || p.nama_jabatan);
            const photoHtml = p.foto_base64
                ? `<img src="${p.foto_base64}" class="w-10 h-10 rounded-lg object-cover border border-slate-200">`
                : `<div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">${initials}</div>`;
            const isFilled = p.nama_orang && p.nama_orang.trim();
            
            return `
                <button onclick="assignPICToTemuan(${temuanId}, ${p.id}); document.getElementById('assignPICModal').remove();"
                        class="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition text-left">
                    ${photoHtml}
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-sm text-slate-900">
                            ${escapeHtml(isFilled ? p.nama_orang : p.nama_jabatan)}
                            ${isFilled ? '' : '<span class="text-[10px] text-amber-500 font-normal">(belum diisi)</span>'}
                        </div>
                        <div class="text-xs text-slate-500">
                            ${escapeHtml(p.nama_jabatan)}
                            ${p.departemen ? ` • ${escapeHtml(p.departemen)}` : ''}
                        </div>
                        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                            ${(p.kategori_tanggung_jawab || []).slice(0, 3).map(k => 
                                `<span class="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">${k}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-slate-300"></i>
                </button>
            `;
        }).join('')
        : `
            <div class="text-center py-8">
                <i class="fa-solid fa-user-slash text-3xl text-slate-300 mb-2"></i>
                <p class="text-sm text-slate-500">Tidak ada PIC dengan kategori <strong>${escapeHtml(kategori)}</strong>.</p>
                <p class="text-xs text-slate-400 mt-1">Tambahkan kategori ini di tab PIC & Struktur.</p>
            </div>
        `;

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl my-8">
            <div class="p-5 border-b border-slate-200 flex items-start justify-between">
                <div>
                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-user-plus text-purple-500"></i> Pilih PIC
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">
                        Rekomendasi berdasarkan kategori <strong class="text-purple-600">${escapeHtml(kategori)}</strong>
                    </p>
                </div>
                <button onclick="document.getElementById('assignPICModal').remove()" 
                        class="text-slate-400 hover:text-slate-900 p-1 transition">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
            <div class="p-5 max-h-[60vh] overflow-y-auto space-y-2">
                ${listHtml}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== TOAST =====
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl z-[200] fade-in text-sm font-semibold';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== HELPER ESCAPE HTML =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ============================================================
// DASHBOARD STATISTIK TEMUAN
// ============================================================

let dashboardCharts = {};

async function loadDashboardTemuan() {
    const panel = document.getElementById('temuanPanelDashboard');
    if (!panel) return;

    panel.innerHTML = `
        <div class="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
            <i class="fa-solid fa-spinner animate-spin text-3xl text-teal-500 mb-3"></i>
            <p class="text-slate-500 text-sm">Memuat statistik temuan...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch('/api/temuan/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!r.ok) throw new Error('Gagal memuat statistik');
        const stats = await r.json();
        renderDashboardTemuan(stats);
    } catch (err) {
        console.error('Error load dashboard:', err);
        panel.innerHTML = `
            <div class="bg-rose-50 rounded-2xl p-8 border border-rose-200 text-center">
                <i class="fa-solid fa-triangle-exclamation text-2xl text-rose-500 mb-2"></i>
                <p class="text-rose-700 text-sm font-semibold">Gagal memuat statistik</p>
                <p class="text-rose-600 text-xs mt-1">${err.message}</p>
                <button onclick="loadDashboardTemuan()" class="mt-3 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

function renderDashboardTemuan(stats) {
    const panel = document.getElementById('temuanPanelDashboard');
    if (!panel) return;

    // Cleanup chart lama
    Object.values(dashboardCharts).forEach(c => {
        try { c.destroy(); } catch (e) { /* ignore */ }
    });
    dashboardCharts = {};

    // Kalau belum ada temuan
    if (stats.total === 0) {
        panel.innerHTML = `
            <div class="bg-white rounded-2xl p-12 border border-dashed border-slate-300 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-chart-pie text-teal-500 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-2">Belum Ada Data untuk Dashboard</h3>
                <p class="text-slate-500 text-sm max-w-md mx-auto mb-5">
                    Lakukan analisis temuan terlebih dahulu di tab <strong>Daftar Temuan</strong>.
                </p>
                <button onclick="switchTemuanTab('temuan')" 
                        class="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm transition inline-flex items-center gap-2">
                    <i class="fa-solid fa-arrow-right"></i> Ke Daftar Temuan
                </button>
            </div>
        `;
        return;
    }

    const pr = stats.prioritas;
    const st = stats.status;

    // ===== Bangun HTML =====
    panel.innerHTML = `
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <i class="fa-solid fa-clipboard-list text-slate-600 text-sm"></i>
                    </div>
                </div>
                <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Temuan</div>
                <div class="text-3xl font-extrabold text-slate-900 mt-1">${stats.total}</div>
            </div>
            <div class="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-4 border border-rose-200 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
                        <i class="fa-solid fa-fire text-rose-600 text-sm"></i>
                    </div>
                </div>
                <div class="text-[10px] text-rose-600 uppercase font-bold tracking-wider">Prioritas Tinggi</div>
                <div class="text-3xl font-extrabold text-rose-600 mt-1">${pr.tinggi}</div>
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 border border-blue-200 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                        <i class="fa-solid fa-hourglass-half text-blue-600 text-sm"></i>
                    </div>
                </div>
                <div class="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Sedang Dikerjakan</div>
                <div class="text-3xl font-extrabold text-blue-600 mt-1">${st.in_progress}</div>
            </div>
            <div class="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-200 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                    </div>
                </div>
                <div class="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Selesai</div>
                <div class="text-3xl font-extrabold text-emerald-600 mt-1">${st.resolved}</div>
            </div>
        </div>

        <!-- Charts Row 1: Kategori + Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 class="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <i class="fa-solid fa-chart-pie text-teal-500"></i> Distribusi per Kategori
                </h3>
                <p class="text-[11px] text-slate-500 mb-3">Proporsi temuan berdasarkan kategori produktivitas</p>
                <div style="height: 280px; position: relative;">
                    <canvas id="chartKategori"></canvas>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 class="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <i class="fa-solid fa-list-check text-blue-500"></i> Status Temuan
                </h3>
                <p class="text-[11px] text-slate-500 mb-3">Jumlah temuan per status tindak lanjut</p>
                <div style="height: 280px; position: relative;">
                    <canvas id="chartStatus"></canvas>
                </div>
            </div>
        </div>

        <!-- Charts Row 2: Prioritas + PIC -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 class="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <i class="fa-solid fa-flag text-rose-500"></i> Prioritas Temuan
                </h3>
                <p class="text-[11px] text-slate-500 mb-3">Tingkat keparahan temuan yang ditemukan</p>
                <div style="height: 260px; position: relative;">
                    <canvas id="chartPrioritas"></canvas>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 class="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <i class="fa-solid fa-trophy text-amber-500"></i> Top 5 PIC
                </h3>
                <p class="text-[11px] text-slate-500 mb-3">PIC dengan temuan terbanyak</p>
                <div id="topPicContainer" class="space-y-2"></div>
            </div>
        </div>

        <!-- Timeline -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mt-4">
            <h3 class="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <i class="fa-solid fa-chart-line text-purple-500"></i> Timeline Temuan
            </h3>
            <p class="text-[11px] text-slate-500 mb-3">Jumlah temuan per bulan (6 bulan terakhir)</p>
            <div style="height: 240px; position: relative;">
                <canvas id="chartTimeline"></canvas>
            </div>
        </div>

        <!-- Assignment Info -->
        <div class="bg-gradient-to-r from-teal-50 to-white rounded-2xl p-5 border border-teal-200 shadow-sm mt-4">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900">Status Assignment PIC</div>
                        <div class="text-xs text-slate-600 mt-0.5">
                            <span class="font-semibold text-emerald-600">${stats.assigned} sudah di-assign</span>
                            ${stats.unassigned > 0 ? ` • <span class="font-semibold text-amber-600">${stats.unassigned} belum di-assign</span>` : ''}
                        </div>
                    </div>
                </div>
                ${stats.unassigned > 0 ? `
                    <button onclick="switchTemuanTab('temuan'); document.getElementById('filterTemuanStatus').value='open'; loadTemuanList();"
                            class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5">
                        <i class="fa-solid fa-user-plus text-[10px]"></i> Assign PIC (${stats.unassigned} belum)
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    // ===== Render Charts =====
    renderChartKategori(stats.kategori);
    renderChartStatus(st);
    renderChartPrioritas(pr);
    renderTopPIC(stats.top_pics, stats.unassigned);
    renderChartTimeline(stats.timeline);
}

// ===== CHART KATEGORI (DOUGHNUT) =====
function renderChartKategori(kategoriData) {
    const canvas = document.getElementById('chartKategori');
    if (!canvas) return;

    // Sort by count desc
    const entries = Object.entries(kategoriData).sort((a, b) => b[1] - a[1]);
    const labels = [];
    const data = [];
    const colorPalette = [
        '#14b8a6', '#3b82f6', '#f59e0b', '#ec4899',
        '#8b5cf6', '#10b981', '#ef4444', '#6366f1',
        '#0891b2', '#f472b6', '#84cc16', '#f97316',
        '#a855f7', '#06b6d4', '#eab308'
    ];

    entries.forEach(([key, count]) => {
        // Cari label dari picCategories
        const cat = (picCategories || []).find(c => c.id === key);
        labels.push(cat ? cat.label : key);
        data.push(count);
    });

    dashboardCharts.kategori = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colorPalette.slice(0, labels.length),
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#0f172a',
                        font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 8,
                        usePointStyle: true,
                        pointStyle: 'circle',
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
                    bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
                    callbacks: {
                        label: function(ctx) {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.parsed / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===== CHART STATUS (BAR) =====
function renderChartStatus(statusData) {
    const canvas = document.getElementById('chartStatus');
    if (!canvas) return;

    const labels = ['Open', 'In Progress', 'Resolved', 'On Hold'];
    const data = [
        statusData.open || 0,
        statusData.in_progress || 0,
        statusData.resolved || 0,
        statusData.on_hold || 0,
    ];
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#64748b'];

    dashboardCharts.status = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Temuan',
                data: data,
                backgroundColor: colors,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
                    bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Plus Jakarta Sans', size: 11 },
                        precision: 0,
                    },
                    grid: { color: 'rgba(203, 213, 225, 0.3)', borderDash: [4, 4] },
                    border: { display: false },
                },
                x: {
                    ticks: {
                        color: '#0f172a',
                        font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
                    },
                    grid: { display: false },
                    border: { display: false },
                }
            }
        }
    });
}

// ===== CHART PRIORITAS (BAR) =====
function renderChartPrioritas(prioritasData) {
    const canvas = document.getElementById('chartPrioritas');
    if (!canvas) return;

    dashboardCharts.prioritas = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['🔴 Tinggi', '🟡 Sedang', '🟢 Rendah'],
            datasets: [{
                label: 'Jumlah Temuan',
                data: [
                    prioritasData.tinggi || 0,
                    prioritasData.sedang || 0,
                    prioritasData.rendah || 0,
                ],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 10,
                    cornerRadius: 8,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Plus Jakarta Sans', size: 11 },
                        precision: 0,
                    },
                    grid: { color: 'rgba(203, 213, 225, 0.3)', borderDash: [4, 4] },
                    border: { display: false },
                },
                x: {
                    ticks: {
                        color: '#0f172a',
                        font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                    },
                    grid: { display: false },
                    border: { display: false },
                }
            }
        }
    });
}

// ===== TOP PIC LIST =====
function renderTopPIC(topPics, unassigned) {
    const container = document.getElementById('topPicContainer');
    if (!container) return;

    if ((!topPics || topPics.length === 0) && unassigned === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fa-solid fa-user-slash text-3xl text-slate-300 mb-2"></i>
                <p class="text-xs text-slate-500">Belum ada PIC yang di-assign</p>
            </div>
        `;
        return;
    }

    const medalEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    let html = (topPics || []).map((p, i) => {
        const initials = getInitials(p.nama || p.jabatan);
        const photoHtml = p.foto_base64
            ? `<img src="${p.foto_base64}" class="w-10 h-10 rounded-xl object-cover border border-slate-200">`
            : `<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">${initials}</div>`;

        return `
            <div class="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                <span class="text-xl shrink-0 w-6 text-center">${medalEmojis[i] || ''}</span>
                ${photoHtml}
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-slate-900 truncate">${escapeHtml(p.nama || '(tanpa nama)')}</div>
                    <div class="text-[10px] text-slate-500 truncate">${escapeHtml(p.jabatan || '')}</div>
                </div>
                <div class="shrink-0">
                    <div class="text-lg font-extrabold text-teal-600">${p.total}</div>
                    <div class="text-[9px] text-slate-400 text-right -mt-1">temuan</div>
                </div>
            </div>
        `;
    }).join('');

    if (unassigned > 0) {
        html += `
            <div class="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/50">
                <span class="text-xl shrink-0 w-6 text-center">⚠️</span>
                <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                    <i class="fa-solid fa-user-slash text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-amber-700">Belum Di-assign</div>
                    <div class="text-[10px] text-amber-600">Perlu ditunjuk PIC</div>
                </div>
                <div class="shrink-0">
                    <div class="text-lg font-extrabold text-amber-600">${unassigned}</div>
                    <div class="text-[9px] text-amber-500 text-right -mt-1">temuan</div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ===== CHART TIMELINE (LINE) =====
function renderChartTimeline(timeline) {
    const canvas = document.getElementById('chartTimeline');
    if (!canvas || !timeline) return;

    const labels = timeline.map(t => t.label);
    const data = timeline.map(t => t.count);

    dashboardCharts.timeline = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Temuan',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
                    bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Plus Jakarta Sans', size: 11 },
                        precision: 0,
                    },
                    grid: { color: 'rgba(203, 213, 225, 0.3)', borderDash: [4, 4] },
                    border: { display: false },
                },
                x: {
                    ticks: {
                        color: '#0f172a',
                        font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
                    },
                    grid: { display: false },
                    border: { display: false },
                }
            }
        }
    });
}