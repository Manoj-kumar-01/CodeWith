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

// Handle custom room invites
async function inviteFriendToRoom(btnElem, friendUsername, friendName) {
    if (typeof ROOM_ID === 'undefined' || !ROOM_ID) {
        alert('You must be inside a custom room to send an invite.');
        return;
    }

    try {
        const fromUsername = typeof USERNAME !== 'undefined' ? USERNAME : 'alexchen';
        const roomNameDisplay = document.getElementById('room-name-display');
        const roomName = roomNameDisplay ? roomNameDisplay.innerText : '';

        const icon = btnElem.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', 'loader-2');
            icon.classList.add('animate-spin');
            lucide.createIcons();
        }

        const res = await fetch('/api/invites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: ROOM_ID,
                roomName: roomName,
                to: friendUsername,
                from: fromUsername
            })
        });

        if (res.ok) {
            // Show success
            if (icon) {
                icon.setAttribute('data-lucide', 'check');
                icon.classList.remove('animate-spin');
                icon.classList.remove('text-primary');
                icon.classList.add('text-emerald-500');
                lucide.createIcons();
                
                setTimeout(() => {
                    icon.setAttribute('data-lucide', 'send');
                    icon.classList.remove('text-emerald-500');
                    icon.classList.add('text-primary');
                    lucide.createIcons();
                }, 2000);
            }
        }
    } catch (err) {
        console.error('Failed to send invite', err);
        alert('Failed to send invite.');
    }
}
