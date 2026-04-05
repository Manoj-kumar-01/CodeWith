// Mouse-follow radial gradient effect on contest cards
(function () {
    document.addEventListener('mousemove', function (e) {
        var cards = document.querySelectorAll('.contest-card');
        cards.forEach(function (card) {
            var rect = card.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', x + '%');
            card.style.setProperty('--mouse-y', y + '%');
        });
    });
})();
