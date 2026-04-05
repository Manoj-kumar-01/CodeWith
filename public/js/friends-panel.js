// Friends panel toggle
function toggleFriends() {
    const aside = document.getElementById('friends-aside');
    const panel = document.getElementById('friends-panel');
    if (!aside) return;

    if (aside.classList.contains('hidden')) {
        aside.classList.remove('hidden');
        if (panel) panel.classList.remove('hidden');
        // Re-render lucide icons inside panel
        if (window.lucide) lucide.createIcons();
    } else {
        aside.classList.add('hidden');
    }
}

// Close panel on click outside
document.addEventListener('mousedown', function (e) {
    const aside = document.getElementById('friends-aside');
    const toggleBtn = document.querySelector('[data-friends-toggle]');
    if (!aside || aside.classList.contains('hidden')) return;
    if (aside.contains(e.target)) return;
    if (toggleBtn && toggleBtn.contains(e.target)) return;
    aside.classList.add('hidden');
});
