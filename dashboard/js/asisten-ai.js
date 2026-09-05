// ===== ASISTEN AI =====
let chatContext = { period: "Tahun Saat Ini", nt: 0, inv: 0 };

// ===== TAB SWITCHER =====
function switchAITab(tab) {
    const btnRekomendasi = document.getElementById('btnTabRekomendasi');
    const btnChat = document.getElementById('btnTabChat');
    const panelRekomendasi = document.getElementById('aiPanelRekomendasi');
    const panelChat = document.getElementById('aiPanelChat');

    const activeClass = "px-4 py-2 rounded-lg text-xs font-bold transition bg-teal-500 text-slate-950 shadow-md";
    const inactiveClass = "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white";

    if (tab === 'rekomendasi') {
        btnRekomendasi.className = activeClass;
        btnChat.className = inactiveClass;
        panelRekomendasi.classList.remove('hidden');
        panelChat.classList.add('hidden');
        loadRecommendation();
    } else {
        btnChat.className = activeClass;
        btnRekomendasi.className = inactiveClass;
        panelChat.classList.remove('hidden');
        panelRekomendasi.classList.add('hidden');
        loadChatHistory();
    }
}

// ===== LOAD RECOMMENDATION =====
async function loadRecommendation() {
    const token = localStorage.getItem('eva_token');
    const panel = getYearPanel(); 
    if(!panel) {
        document.getElementById('ai-rekomendasi-konten').innerHTML = "<em>Silakan isi data keuangan di Kalkulator EVA terlebih dahulu.</em>";
        return;
    }

    const ntEl = panel.querySelector('[data-result="total_nilai_tambah"]');
    const invInput = panel.querySelector('input[data-field="total_investasi"]');
    
    chatContext.nt = ntEl ? parseFloat(ntEl.textContent.replace(/Rp|\./g, '')) || 0 : 0;
    chatContext.inv = invInput ? parseFloat(invInput.value) || 0 : 0;
    chatContext.period = yearMeta[activeYearId]?.title || "Periode Aktif";

    document.getElementById('ai-rekomendasi-konten').innerHTML = '<div class="flex items-center justify-center py-12 text-slate-400 gap-2"><i class="fa-solid fa-spinner animate-spin text-teal-400 text-lg"></i> Menganalisis...</div>';

    try {
        const res = await fetch('/api/ai/dashboard-recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ period: chatContext.period, nilai_tambah: chatContext.nt, total_investasi: chatContext.inv })
        });
        const data = await res.json();
        
        let warnaStatus = data.status === 'positif' ? 'text-emerald-400' : (data.status === 'negatif' ? 'text-rose-400' : 'text-amber-400');
        
        document.getElementById('ai-rekomendasi-konten').innerHTML = `
            <div class="mb-2"><span class="font-bold text-white">Status:</span> <span class="font-extrabold uppercase ${warnaStatus}">${data.status}</span></div>
            <div class="mb-2"><span class="font-bold text-white">Fokus:</span> <span class="text-teal-300">${data.fokus_rekomendasi}</span></div>
            <div class="mb-3"><span class="font-bold text-white">Aksi Kemnaker:</span> <span class="text-teal-300">${data.aksi_produktivitas}</span></div>
            <div class="p-4 bg-slate-900/50 rounded-xl border border-slate-700 italic prose prose-invert max-w-none text-sm">${marked.parse(data.narasi_ai)}</div>
        `;
    } catch(e) {
        document.getElementById('ai-rekomendasi-konten').innerHTML = "Gagal memuat rekomendasi.";
    }
}

// ===== CHAT FUNCTIONS =====
async function loadChatHistory() {
    const token = localStorage.getItem('eva_token');
    const box = document.getElementById('chat-box');
    box.innerHTML = '<div class="text-center text-slate-500 text-sm mt-10"><i class="fa-solid fa-spinner animate-spin"></i> Memuat riwayat obrolan...</div>';
    
    try {
        const res = await fetch('/api/ai/chat/history', { headers: { 'Authorization': `Bearer ${token}` } });
        const history = await res.json();
        box.innerHTML = '';
        if(history.length === 0) {
            box.innerHTML = '<div class="text-center text-slate-500 text-sm mt-16 flex flex-col items-center gap-2"><i class="fa-solid fa-comments text-3xl text-slate-600"></i><span>Belum ada obrolan. Silakan mulai bertanya mengenai strategi produktivitas!</span></div>';
        } else {
            history.forEach(msg => appendChatUI(msg));
            box.scrollTop = box.scrollHeight;
        }
    } catch(e) {
        box.innerHTML = '<div class="text-center text-rose-500 text-sm mt-10">Gagal memuat riwayat.</div>';
    }
}

function appendChatUI(msg) {
    const box = document.getElementById('chat-box');
    const isUser = msg.role === 'user';
    const align = isUser ? 'justify-end' : 'justify-start';
    const bg = isUser ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none';
    const icon = isUser ? '' : '<div class="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center shrink-0 text-teal-400 mt-1"><i class="fa-solid fa-robot"></i></div>';
    
    const parsedText = isUser ? msg.content.replace(/</g, "&lt;").replace(/\n/g, "<br>") : marked.parse(msg.content);
    const safeContent = msg.content.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
    
    const actionBtn = isUser 
        ? `<button onclick="prepareEdit(${msg.id}, '${safeContent}')" class="text-[10px] text-teal-200 hover:text-white mt-1 opacity-50 hover:opacity-100 transition"><i class="fa-solid fa-pen"></i> Edit</button>`
        : `<button onclick="copyToClipboard('${safeContent}')" class="text-[10px] text-slate-400 hover:text-white mt-1 opacity-50 hover:opacity-100 transition"><i class="fa-solid fa-copy"></i> Copy</button>`;

    if(box.innerHTML.includes("Belum ada obrolan")) box.innerHTML = '';

    box.innerHTML += `
    <div class="flex ${align} gap-3 w-full fade-in" id="msg-${msg.id}">
        ${icon}
        <div class="max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}">
            <div class="p-3.5 rounded-2xl ${bg} prose prose-invert prose-p:my-1 prose-ul:my-1 text-[13px] shadow-md shadow-slate-900/20">
                ${parsedText}
            </div>
            ${actionBtn}
        </div>
    </div>`;
    box.scrollTop = box.scrollHeight;
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('btn-send-chat');
    const editId = document.getElementById('edit-msg-id').value;
    const text = input.value.trim();
    if(!text) return;

    input.value = '';
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i>';
    btn.disabled = true;

    const tempId = Date.now();
    appendChatUI({id: tempId, role: 'user', content: text});

    const token = localStorage.getItem('eva_token');
    const endpoint = editId ? `/api/ai/chat/edit/${editId}` : `/api/ai/chat/send`;
    const method = editId ? 'PUT' : 'POST';

    try {
        const res = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                content: text,
                period_context: chatContext.period,
                nilai_tambah_context: chatContext.nt,
                investasi_context: chatContext.inv
            })
        });
        
        document.getElementById('edit-msg-id').value = ''; 
        await loadChatHistory(); 
    } catch(e) {
        alert("Gagal mengirim pesan.");
    } finally {
        btn.innerHTML = '<span>Kirim</span> <i class="fa-solid fa-paper-plane text-xs"></i>';
        btn.disabled = false;
    }
}

function prepareEdit(id, text) {
    document.getElementById('chat-input').value = text;
    document.getElementById('edit-msg-id').value = id;
    document.getElementById('chat-input').focus();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => alert("Berhasil disalin ke clipboard!"));
}

async function clearChat() {
    if(!confirm("Hapus seluruh riwayat percakapan ini secara permanen?")) return;
    const token = localStorage.getItem('eva_token');
    await fetch('/api/ai/chat/clear', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    document.getElementById('chat-box').innerHTML = '<div class="text-center text-slate-500 text-sm mt-10">Riwayat telah dihapus.</div>';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Chat input enter key
    document.getElementById('chat-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    });
});