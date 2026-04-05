// Daily Challenge countdown timer
(function () {
    let hours = 9, minutes = 59, seconds = 45;
    const el = document.getElementById('timer');
    if (!el) return;

    function pad(n) { return n.toString().padStart(2, '0'); }

    setInterval(function () {
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; }
        el.textContent = pad(hours) + ' : ' + pad(minutes) + ' : ' + pad(seconds);
    }, 1000);
})();
