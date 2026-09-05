// ===== AUTHENTICATION FUNCTIONS =====
function handleLogout() {
    localStorage.removeItem('eva_token');
    localStorage.removeItem('eva_user_name');
    localStorage.removeItem('eva_guest_chat_count');
    window.location.href = '/login';
}

// ===== CHECK AUTH ON LOAD =====
if (!localStorage.getItem('eva_token')) {
    window.location.href = '/login';
}