// Friends panel toggle
function toggleFriends(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    const aside = document.getElementById('friends-aside');
    if (!aside) return;

    if (aside.classList.contains('hidden')) {
        aside.classList.remove('hidden');
        const panel = document.getElementById('friends-panel');
        if (panel) panel.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    } else {
        aside.classList.add('hidden');
    }
}

// Close panel on click outside
document.addEventListener('mousedown', function (e) {
    const aside = document.getElementById('friends-aside');
    if (!aside || aside.classList.contains('hidden')) return;
    
    // Don't close if clicking inside the aside
    if (aside.contains(e.target)) return;
    
    // Don't close if clicking any toggle button
    const toggleBtns = document.querySelectorAll('[onclick="toggleFriends()"], [data-friends-toggle]');
    for (let btn of toggleBtns) {
        if (btn.contains(e.target)) return;
    }
    
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

// Poll /api/friends to keep the friends panel updated dynamically
async function pollFriendsPanel() {
    try {
        const res = await fetch('/api/friends');
        if (!res.ok) return;
        const data = await res.json();
        
        // Update DOM elements if they exist
        const onlineHeaderBadge = document.getElementById('friends-online-header-badge');
        const onlineCountSpan = document.getElementById('friends-online-count');
        const onlineListDiv = document.getElementById('friends-online-list');
        const offlineSection = document.getElementById('friends-offline-section');
        const offlineCountSpan = document.getElementById('friends-offline-count');
        const offlineListDiv = document.getElementById('friends-offline-list');
        
        if (!onlineListDiv || !offlineListDiv) return;

        const onlineFriends = data.onlineFriends || [];
        const offlineFriends = (data.friends || []).filter(f => f.status !== 'online');

        // 1. Update online count badges
        if (onlineHeaderBadge) {
            onlineHeaderBadge.textContent = `${onlineFriends.length} online`;
        }
        if (onlineCountSpan) {
            onlineCountSpan.textContent = onlineFriends.length;
        }

        // 2. Render Online List
        if (onlineFriends.length > 0) {
            let onlineHTML = '';
            onlineFriends.forEach(friend => {
                const initials = friend.name ? friend.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'FP';
                const friendUsername = friend.username || friend.name.toLowerCase().replace(/ /g, '');
                
                const actionBtnHTML = friend.inSameRoom ? `
                    <div class="p-2 text-emerald-500" title="In your lobby">
                        <i data-lucide="check-circle" class="w-5 h-5"></i>
                    </div>
                ` : `
                    <button onclick="inviteFriendToRoom(this, '${friendUsername}', '${friend.name}')"
                        class="p-2 rounded-lg hover:bg-primary/20 transition-all" title="Invite to Match">
                        <i data-lucide="send" class="w-4 h-4 text-primary"></i>
                    </button>
                `;

                const statusIcon = friend.inRoom ? 'users' : (friend.mode === 'in-contest' ? 'gamepad-2' : friend.mode === 'practicing' ? 'code' : 'circle');
                const statusIconColorClass = friend.inRoom ? 'text-blue-500' : 'text-muted-foreground';

                onlineHTML += `
                    <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-all cursor-pointer group">
                        <div class="relative shrink-0">
                            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-[#2e3c50] to-[#515f74] flex items-center justify-center text-sm font-semibold text-[#d5e3fd] shadow-lg group-hover:shadow-[#2e3c50]/20 transition-shadow">
                                ${initials}
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                ${friend.name}
                            </p>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <i data-lucide="${statusIcon}" class="w-3 h-3 ${statusIconColorClass}"></i>
                                <p class="text-xs text-muted-foreground">
                                    ${friend.desc || 'Available'}
                                </p>
                            </div>
                        </div>
                        ${actionBtnHTML}
                    </div>
                `;
            });
            onlineListDiv.innerHTML = onlineHTML;
        } else {
            onlineListDiv.innerHTML = `
                <div id="friends-panel-empty-state" class="py-12 text-center opacity-40">
                    <i data-lucide="users" class="w-8 h-8 mx-auto mb-2"></i>
                    <p class="text-xs italic">Connect with friends to see them here.</p>
                </div>
            `;
        }

        // 3. Render Offline List
        if (offlineFriends.length > 0) {
            if (offlineSection) offlineSection.classList.remove('hidden');
            if (offlineCountSpan) offlineCountSpan.textContent = offlineFriends.length;

            let offlineHTML = '';
            offlineFriends.forEach(friend => {
                const initials = friend.name ? friend.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'FP';
                offlineHTML += `
                    <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-all cursor-pointer group opacity-60 hover:opacity-100">
                        <div class="relative shrink-0">
                            <div class="w-11 h-11 rounded-full bg-muted/50 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                                ${initials}
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-muted-foreground truncate">
                                ${friend.name}
                            </p>
                            <p class="text-xs text-muted-foreground/70 mt-0.5">Last seen ${friend.lastSeen || 'recently'}</p>
                        </div>
                    </div>
                `;
            });
            offlineListDiv.innerHTML = offlineHTML;
        } else {
            if (offlineSection) offlineSection.classList.add('hidden');
            offlineListDiv.innerHTML = '';
        }

        // Re-initialize dynamic Lucide icons for new elements
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (err) {
        console.error('Error polling friends panel:', err);
    }
}

// Start polling every 5 seconds
if (!window.friendsPanelPoller) {
    window.friendsPanelPoller = setInterval(pollFriendsPanel, 5000);
}
// Run once immediately on load
setTimeout(pollFriendsPanel, 100);
