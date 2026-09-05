// ===== NAVIGASI UTAMA =====
const NAV_ACTIVE = "nav-active";
const NAV_INACTIVE = "nav-inactive";

function switchView(view) {
    // Panggil fungsi sesuai view
    if (view === 'ringkasan') {
        updateRingkasanView();
    }
    if (view === 'asisten-ai') {
        loadRecommendation();
        loadChatHistory();
    }
    if (view === 'grafik-eva') {
        if (typeof initGrafik === 'function') {
            initGrafik();
        }
    }

    // Toggle tampilan view
    document.getElementById('view-ringkasan').classList.toggle('hidden', view !== 'ringkasan');
    document.getElementById('view-input-data').classList.toggle('hidden', view !== 'input-data');
    document.getElementById('view-asisten-ai').classList.toggle('hidden', view !== 'asisten-ai');
    document.getElementById('view-grafik-eva').classList.toggle('hidden', view !== 'grafik-eva');

    // Update active class di sidebar
    document.getElementById('navRingkasan').className = view === 'ringkasan' ? NAV_ACTIVE : NAV_INACTIVE;
    document.getElementById('navInputData').className = view === 'input-data' ? NAV_ACTIVE : NAV_INACTIVE;
    document.getElementById('navAsistenAI').className = view === 'asisten-ai' ? NAV_ACTIVE : NAV_INACTIVE;
    document.getElementById('navGrafik').className = view === 'grafik-eva' ? NAV_ACTIVE : NAV_INACTIVE;
}

// ===== TAMPILKAN NAMA PENGGUNA =====
document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('eva_user_name');
    if (userName) {
        document.getElementById('userNameDisplay').textContent = userName;
    }
    
    renderYearTabs();
    updateYearEmptyState();
    updateRingkasanView();
    loadDataFromServer();
});

// ===== FORMAT RUPIAH =====
function formatRupiah(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
}