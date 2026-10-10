// ============================================================
// PIC & STRUKTUR ORGANISASI
// ============================================================

let picData = [];
let picCategories = [];
let picDataById = {};

// ===== INIT =====
async function loadPICPanel() {
    const panel = document.getElementById('temuanPanelPic');
    if (!panel) return;

    // Set loading
    panel.innerHTML = `
        <div class="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
            <i class="fa-solid fa-spinner animate-spin text-3xl text-teal-500 mb-3"></i>
            <p class="text-slate-500 text-sm">Memuat struktur organisasi...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('eva_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch PIC + Kategori parallel
        const [rPic, rCat] = await Promise.all([
            fetch('/api/pic', { headers }),
            fetch('/api/pic/categories', { headers })
        ]);

        if (!rPic.ok) throw new Error('Gagal memuat PIC');
        
        picData = await rPic.json();
        picCategories = (await rCat.json()).categories || [];
        
        // Build map id → pic untuk lookup cepat
        picDataById = {};
        picData.forEach(p => { picDataById[p.id] = p; });

        renderPICPanel();
    } catch (err) {
        console.error('Error load PIC:', err);
        panel.innerHTML = `
            <div class="bg-rose-50 rounded-2xl p-8 border border-rose-200 text-center">
                <i class="fa-solid fa-triangle-exclamation text-2xl text-rose-500 mb-2"></i>
                <p class="text-rose-700 text-sm">${err.message}</p>
                <button onclick="loadPICPanel()" class="mt-3 px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold">Coba Lagi</button>
            </div>
        `;
    }
}

// ===== RENDER PANEL =====
function renderPICPanel() {
    const panel = document.getElementById('temuanPanelPic');
    if (!panel) return;

    // Hitung statistik
    const total = picData.length;
    const filled = picData.filter(p => p.nama_orang && p.nama_orang.trim()).length;
    const empty = total - filled;

    panel.innerHTML = `
        <!-- Header Aksi -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-sitemap text-teal-500"></i> Struktur Organisasi Perusahaan
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">
                        Klik <strong>Isi</strong> untuk mengisi nama PIC di setiap posisi. 
                        Klik posisi untuk melihat detail.
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="openAddPICModal()" 
                            class="px-3.5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5">
                        <i class="fa-solid fa-plus text-[10px]"></i> Tambah Posisi
                    </button>
                    <button onclick="resetPICConfirm()" 
                            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition flex items-center gap-1.5">
                        <i class="fa-solid fa-rotate-left text-[10px]"></i> Reset Template
                    </button>
                </div>
            </div>
            
            <!-- Stats Mini -->
            <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div class="text-center">
                    <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Posisi</div>
                    <div class="text-xl font-extrabold text-slate-900">${total}</div>
                </div>
                <div class="text-center">
                    <div class="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Sudah Diisi</div>
                    <div class="text-xl font-extrabold text-emerald-600">${filled}</div>
                </div>
                <div class="text-center">
                    <div class="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Belum Diisi</div>
                    <div class="text-xl font-extrabold text-amber-600">${empty}</div>
                </div>
            </div>
        </div>

        <!-- Tree View -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div id="picTreeView" class="space-y-1">
                ${renderPICTree(null, 0)}
            </div>
        </div>
    `;
}

// ===== RENDER TREE (RECURSIVE) =====
function renderPICTree(parentId, depth) {
    const children = picData.filter(p => p.parent_id === parentId);
    if (children.length === 0) return '';

    return children.map(pic => {
        const subTree = renderPICTree(pic.id, depth + 1);
        const hasChildren = picData.some(p => p.parent_id === pic.id);
        
        // Warna badge berdasarkan level
        const levelColors = [
            'bg-purple-100 text-purple-700 border-purple-200',
            'bg-blue-100 text-blue-700 border-blue-200',
            'bg-teal-100 text-teal-700 border-teal-200',
            'bg-emerald-100 text-emerald-700 border-emerald-200',
        ];
        const levelColor = levelColors[Math.min(pic.level, levelColors.length - 1)];

        // Foto atau inisial
        const photoHtml = pic.foto_base64 
            ? `<img src="${pic.foto_base64}" alt="${escapeHtml(pic.nama_orang || pic.nama_jabatan)}" class="w-10 h-10 rounded-xl object-cover border border-slate-200">`
            : `<div class="w-10 h-10 rounded-xl ${levelColor} border flex items-center justify-center text-xs font-bold">
                ${getInitials(pic.nama_orang || pic.nama_jabatan)}
              </div>`;

        // Status filled/empty
        const isFilled = pic.nama_orang && pic.nama_orang.trim();
        const statusBadge = isFilled 
            ? '<span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">AKTIF</span>'
            : '<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">KOSONG</span>';

        // Kategori badges
        const kats = (pic.kategori_tanggung_jawab || []).slice(0, 3);
        const katHtml = kats.map(k => {
            const cat = picCategories.find(c => c.id === k);
            return `<span class="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">${cat ? cat.label : k}</span>`;
        }).join('');
        const moreKat = (pic.kategori_tanggung_jawab || []).length > 3 
            ? `<span class="text-[9px] text-slate-500">+${pic.kategori_tanggung_jawab.length - 3}</span>` : '';

        return `
            <div>
                <div class="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-200"
                     onclick="showPICDetail(${pic.id})">
                    
                    <!-- Indentasi -->
                    <div style="width: ${depth * 24}px; flex-shrink: 0;"></div>

                    <!-- Foto -->
                    ${photoHtml}

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-bold text-sm text-slate-900">${escapeHtml(pic.nama_jabatan)}</span>
                            ${statusBadge}
                        </div>
                        ${isFilled ? `
                            <div class="text-xs text-slate-600 mt-0.5">
                                <i class="fa-solid fa-user text-[9px] text-slate-400"></i>
                                <span class="font-semibold">${escapeHtml(pic.nama_orang)}</span>
                                ${pic.departemen ? `<span class="text-slate-400">• ${escapeHtml(pic.departemen)}</span>` : ''}
                            </div>
                        ` : `
                            <div class="text-xs text-slate-400 mt-0.5 italic">
                                <i class="fa-solid fa-user-slash text-[9px]"></i>
                                ${pic.departemen ? escapeHtml(pic.departemen) : 'Belum ada PIC'}
                            </div>
                        `}
                        ${katHtml ? `<div class="flex items-center gap-1 mt-1.5 flex-wrap">${katHtml}${moreKat}</div>` : ''}
                    </div>

                    <!-- Tombol Aksi -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onclick="event.stopPropagation(); openEditPICModal(${pic.id})"
                                class="w-7 h-7 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition"
                                title="Edit">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onclick="event.stopPropagation(); deletePICConfirm(${pic.id})"
                                class="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition"
                                title="Hapus">
                            <i class="fa-solid fa-trash text-[10px]"></i>
                        </button>
                    </div>
                </div>
                ${subTree}
            </div>
        `;
    }).join('');
}

// ===== SHOW DETAIL =====
function showPICDetail(picId) {
    const pic = picDataById[picId];
    if (!pic) return;

    const levelLabels = ['Top Level', 'Direktur', 'Manajer', 'Supervisor', 'Staf'];
    const levelLabel = levelLabels[Math.min(pic.level, levelLabels.length - 1)];

    const oldModal = document.getElementById('picDetailModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'picDetailModal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const photoHtml = pic.foto_base64
        ? `<img src="${pic.foto_base64}" class="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200">`
        : `<div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            ${getInitials(pic.nama_orang || pic.nama_jabatan)}
          </div>`;

    const categoriesHtml = (pic.kategori_tanggung_jawab || []).map(k => {
        const cat = picCategories.find(c => c.id === k);
        return `<span class="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">${cat ? cat.label : k}</span>`;
    }).join('') || '<span class="text-xs text-slate-400 italic">Belum ada kategori</span>';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl my-8">
            <div class="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 flex-1">
                    ${photoHtml}
                    <div>
                        <h3 class="text-lg font-bold text-slate-900 leading-tight">${escapeHtml(pic.nama_jabatan)}</h3>
                        <div class="text-xs text-slate-500 mt-1">
                            <span class="font-semibold">${levelLabel}</span>
                            ${pic.departemen ? ` • ${escapeHtml(pic.departemen)}` : ''}
                        </div>
                    </div>
                </div>
                <button onclick="document.getElementById('picDetailModal').remove()" 
                        class="text-slate-400 hover:text-slate-900 p-1 transition">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

            <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <!-- Info Orang -->
                ${pic.nama_orang ? `
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <div class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">PIC Aktif</div>
                        <div class="text-sm font-bold text-emerald-900">${escapeHtml(pic.nama_orang)}</div>
                        ${pic.email ? `<div class="text-xs text-emerald-700 mt-1"><i class="fa-solid fa-envelope"></i> ${escapeHtml(pic.email)}</div>` : ''}
                        ${pic.telepon ? `<div class="text-xs text-emerald-700 mt-0.5"><i class="fa-solid fa-phone"></i> ${escapeHtml(pic.telepon)}</div>` : ''}
                    </div>
                ` : `
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                        <i class="fa-solid fa-user-slash text-amber-500 mb-1"></i>
                        <div class="text-xs text-amber-700">Posisi ini belum diisi PIC</div>
                    </div>
                `}

                <!-- Kategori -->
                <div>
                    <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori Tanggung Jawab</div>
                    <div class="flex flex-wrap gap-1.5">${categoriesHtml}</div>
                </div>
            </div>

            <div class="p-4 border-t border-slate-200 flex justify-end gap-2">
                <button onclick="document.getElementById('picDetailModal').remove()" 
                        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition">
                    Tutup
                </button>
                <button onclick="document.getElementById('picDetailModal').remove(); openEditPICModal(${pic.id});" 
                        class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-sm transition flex items-center gap-1.5">
                    <i class="fa-solid fa-pen text-xs"></i> Edit PIC
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== MODAL EDIT PIC =====
function openEditPICModal(picId) {
    const pic = picDataById[picId];
    if (!pic) return;

    const categoriesCheckbox = picCategories.map(cat => {
        const checked = (pic.kategori_tanggung_jawab || []).includes(cat.id) ? 'checked' : '';
        return `
            <label class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input type="checkbox" value="${cat.id}" ${checked} class="rounded border-slate-300 text-teal-500 focus:ring-teal-500">
                <span class="text-xs text-slate-700 font-medium">${cat.label}</span>
            </label>
        `;
    }).join('');

    const photoPreview = pic.foto_base64
        ? `<img id="picPhotoPreview" src="${pic.foto_base64}" class="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200">`
        : `<div id="picPhotoPreviewPlaceholder" class="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
            <i class="fa-solid fa-user text-2xl"></i>
          </div>`;

    const oldModal = document.getElementById('picEditModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'picEditModal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8">
            <div class="p-5 border-b border-slate-200 flex items-start justify-between">
                <div>
                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-user-pen text-teal-500"></i> Edit PIC
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">${escapeHtml(pic.nama_jabatan)}</p>
                </div>
                <button onclick="document.getElementById('picEditModal').remove()" 
                        class="text-slate-400 hover:text-slate-900 p-1 transition">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

            <form onsubmit="savePIC(event, ${pic.id})" class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <!-- Foto Upload -->
                <div class="flex items-center gap-4">
                    <div id="picPhotoContainer">${photoPreview}</div>
                    <div class="flex-1">
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Foto Profil (opsional)</label>
                        <input type="file" id="picPhotoInput" accept="image/*" onchange="handlePhotoUpload(event)"
                               class="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer">
                        <p class="text-[10px] text-slate-400 mt-1">Maks 300 KB. Format JPG/PNG.</p>
                    </div>
                    <input type="hidden" id="picPhotoBase64" value="${pic.foto_base64 || ''}">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Nama Jabatan -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Nama Jabatan <span class="text-rose-500">*</span></label>
                        <input type="text" id="picJabatan" value="${escapeHtml(pic.nama_jabatan)}" required
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Departemen -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Departemen</label>
                        <input type="text" id="picDepartemen" value="${escapeHtml(pic.departemen || '')}"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Nama Orang -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Nama Orang (PIC)</label>
                        <input type="text" id="picNamaOrang" value="${escapeHtml(pic.nama_orang || '')}" placeholder="Belum diisi"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Email -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                        <input type="email" id="picEmail" value="${escapeHtml(pic.email || '')}" placeholder="email@perusahaan.com"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Telepon -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Telepon</label>
                        <input type="text" id="picTelepon" value="${escapeHtml(pic.telepon || '')}" placeholder="0812-xxxx-xxxx"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>
                </div>

                <!-- Kategori Tanggung Jawab -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-2">Kategori Tanggung Jawab</label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                        ${categoriesCheckbox}
                    </div>
                </div>

                <!-- Tombol -->
                <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onclick="document.getElementById('picEditModal').remove()"
                            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition">
                        Batal
                    </button>
                    <button type="submit"
                            class="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-sm transition flex items-center gap-2">
                        <i class="fa-solid fa-floppy-disk text-xs"></i> Simpan
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== PHOTO UPLOAD HANDLER =====
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 300 * 1024) {
        alert('Ukuran foto maksimal 300 KB. Ukuran saat ini: ' + (file.size / 1024).toFixed(0) + ' KB');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        document.getElementById('picPhotoBase64').value = base64;
        
        // Update preview
        const container = document.getElementById('picPhotoContainer');
        container.innerHTML = `<img src="${base64}" class="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200">`;
    };
    reader.readAsDataURL(file);
}

// ===== SAVE PIC =====
async function savePIC(event, picId) {
    event.preventDefault();

    const jabatan = document.getElementById('picJabatan').value.trim();
    if (!jabatan) {
        alert('Nama jabatan harus diisi!');
        return;
    }

    // Ambil kategori yang di-check
    const checkboxes = document.querySelectorAll('#picEditModal input[type="checkbox"]:checked');
    const kategori = Array.from(checkboxes).map(cb => cb.value);

    const payload = {
        nama_jabatan: jabatan,
        departemen: document.getElementById('picDepartemen').value.trim() || null,
        nama_orang: document.getElementById('picNamaOrang').value.trim() || null,
        email: document.getElementById('picEmail').value.trim() || null,
        telepon: document.getElementById('picTelepon').value.trim() || null,
        foto_base64: document.getElementById('picPhotoBase64').value || null,
        kategori_tanggung_jawab: kategori
    };

    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch(`/api/pic/${picId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!r.ok) {
            const err = await r.json();
            throw new Error(err.detail || 'Gagal menyimpan');
        }

        document.getElementById('picEditModal').remove();
        showToast('✅ PIC berhasil disimpan');
        await loadPICPanel();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== MODAL TAMBAH PIC =====
function openAddPICModal() {
    // Buat opsi parent
    const parentOptions = picData.map(p => {
        const indent = '&nbsp;&nbsp;'.repeat(p.level);
        return `<option value="${p.id}">${indent}${escapeHtml(p.nama_jabatan)}</option>`;
    }).join('');

    const categoriesCheckbox = picCategories.map(cat => `
        <label class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input type="checkbox" value="${cat.id}" class="rounded border-slate-300 text-teal-500 focus:ring-teal-500">
            <span class="text-xs text-slate-700 font-medium">${cat.label}</span>
        </label>
    `).join('');

    const oldModal = document.getElementById('picAddModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'picAddModal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8">
            <div class="p-5 border-b border-slate-200 flex items-start justify-between">
                <div>
                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-plus text-teal-500"></i> Tambah Posisi Baru
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Tambahkan posisi di struktur organisasi.</p>
                </div>
                <button onclick="document.getElementById('picAddModal').remove()" 
                        class="text-slate-400 hover:text-slate-900 p-1 transition">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

            <form onsubmit="createPIC(event)" class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Parent -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Posisi Atasan (Parent)</label>
                        <select id="picParent" 
                                class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                            <option value="">-- Tidak ada (Top Level) --</option>
                            ${parentOptions}
                        </select>
                    </div>

                    <!-- Nama Jabatan -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Nama Jabatan <span class="text-rose-500">*</span></label>
                        <input type="text" id="picAddJabatan" required placeholder="Contoh: Manager Keuangan"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Departemen -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Departemen</label>
                        <input type="text" id="picAddDepartemen" placeholder="Contoh: Keuangan"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Nama Orang -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Nama Orang (PIC)</label>
                        <input type="text" id="picAddNamaOrang" placeholder="Opsional"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Email -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                        <input type="email" id="picAddEmail" placeholder="Opsional"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>

                    <!-- Telepon -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">Telepon</label>
                        <input type="text" id="picAddTelepon" placeholder="Opsional"
                               class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none">
                    </div>
                </div>

                <!-- Kategori -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-2">Kategori Tanggung Jawab</label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                        ${categoriesCheckbox}
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onclick="document.getElementById('picAddModal').remove()"
                            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition">
                        Batal
                    </button>
                    <button type="submit"
                            class="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-sm transition flex items-center gap-2">
                        <i class="fa-solid fa-plus text-xs"></i> Tambah
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== CREATE PIC =====
async function createPIC(event) {
    event.preventDefault();

    const parentId = document.getElementById('picParent').value;
    const jabatan = document.getElementById('picAddJabatan').value.trim();

    if (!jabatan) {
        alert('Nama jabatan harus diisi!');
        return;
    }

    // Tentukan level: parent level + 1, atau 1 jika tidak ada parent
    let level = 1;
    if (parentId) {
        const parent = picDataById[parseInt(parentId)];
        if (parent) level = parent.level + 1;
    }

    const checkboxes = document.querySelectorAll('#picAddModal input[type="checkbox"]:checked');
    const kategori = Array.from(checkboxes).map(cb => cb.value);

    const payload = {
        nama_jabatan: jabatan,
        departemen: document.getElementById('picAddDepartemen').value.trim() || null,
        parent_id: parentId ? parseInt(parentId) : null,
        level: level,
        urutan: 0,
        nama_orang: document.getElementById('picAddNamaOrang').value.trim() || null,
        email: document.getElementById('picAddEmail').value.trim() || null,
        telepon: document.getElementById('picAddTelepon').value.trim() || null,
        kategori_tanggung_jawab: kategori,
        is_active: true
    };

    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch('/api/pic', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!r.ok) {
            const err = await r.json();
            throw new Error(err.detail || 'Gagal menambah PIC');
        }

        document.getElementById('picAddModal').remove();
        showToast('✅ Posisi baru berhasil ditambahkan');
        await loadPICPanel();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== DELETE PIC =====
async function deletePICConfirm(picId) {
    const pic = picDataById[picId];
    if (!pic) return;

    // Hitung berapa descendant yang akan ikut terhapus
    const countDescendants = (parentId) => {
        const children = picData.filter(p => p.parent_id === parentId);
        let count = children.length;
        children.forEach(c => { count += countDescendants(c.id); });
        return count;
    };
    const total = 1 + countDescendants(picId);

    const msg = total > 1
        ? `Hapus "${pic.nama_jabatan}" beserta ${total - 1} posisi di bawahnya?`
        : `Hapus posisi "${pic.nama_jabatan}"?`;

    if (!confirm(msg)) return;

    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch(`/api/pic/${picId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!r.ok) throw new Error('Gagal menghapus');

        const data = await r.json();
        showToast(`🗑️ ${data.message || 'PIC dihapus'}`);
        await loadPICPanel();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== RESET TEMPLATE =====
async function resetPICConfirm() {
    if (!confirm('Hapus semua PIC dan reset ke template default?\n\nSemua kustomisasi akan hilang.')) return;

    try {
        const token = localStorage.getItem('eva_token');
        const r = await fetch('/api/pic/reset-template', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!r.ok) throw new Error('Gagal reset');

        const data = await r.json();
        showToast(`✅ ${data.message}`);
        await loadPICPanel();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ===== HELPERS =====
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}