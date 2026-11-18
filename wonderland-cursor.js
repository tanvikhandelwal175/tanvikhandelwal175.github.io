/* ==========================================================================
   MAGIC PAINTBRUSH CURSOR
   A glowing brush whose bristle tip is the pointer, with a trail of sparkles.
   - bigger glow over anything clickable, little burst on click
   - fine pointers only (never replaces touch); no trail with reduced motion
   ========================================================================== */
(function () {
    'use strict';
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var TIP_X = 18, TIP_Y = 16;                 // where the bristle tip sits inside the 110px drawing
    var HOT = 'a, button, [role="button"], .hub-card, .work-card, .cab-item, .proj-card, .tab-card, summary, label, input, select, textarea';

    document.body.classList.add('custom-cursor-active');

    var brush = document.createElement('div');
    brush.className = 'wl-brush';
    brush.setAttribute('aria-hidden', 'true');
    brush.innerHTML =
        '<svg viewBox="0 0 110 110" width="110" height="110">' +
        '<defs>' +
        '<radialGradient id="wbGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".35" stop-color="#8fe3ff" stop-opacity=".65"/><stop offset="1" stop-color="#4fb8ff" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="wbHandle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a4a12"/><stop offset=".35" stop-color="#f3b45c"/><stop offset=".7" stop-color="#d9822c"/><stop offset="1" stop-color="#7a3d0c"/></linearGradient>' +
        '<linearGradient id="wbFerrule" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c7580"/><stop offset=".4" stop-color="#f1f5f8"/><stop offset="1" stop-color="#6c7580"/></linearGradient>' +
        '<radialGradient id="wbBristle" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#bff0ff"/><stop offset="1" stop-color="#3fb4f0"/></radialGradient>' +
        '<linearGradient id="wbSwoosh" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8fe3ff" stop-opacity=".9"/><stop offset="1" stop-color="#8fe3ff" stop-opacity="0"/></linearGradient>' +
        '</defs>' +
        '<path d="M18 16C34 -2 70 -2 100 14" fill="none" stroke="url(#wbSwoosh)" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M22 20C42 6 72 8 96 24" fill="none" stroke="url(#wbSwoosh)" stroke-width="1" stroke-linecap="round" opacity=".7"/>' +
        '<circle class="tipglow" cx="18" cy="16" r="20" fill="url(#wbGlow)"/>' +
        '<g transform="translate(18 16) rotate(-43)">' +
        '<path d="M-6 42H6L5.4 92C5 99-5 99-5.4 92Z" fill="url(#wbHandle)" stroke="#5a2a06" stroke-width=".8"/>' +
        '<path d="M-2.2 46L-2 90" stroke="rgba(255,240,210,.55)" stroke-width="1.6" stroke-linecap="round"/>' +
        '<rect x="-7" y="28" width="14" height="14" rx="1.5" fill="url(#wbFerrule)" stroke="#59616b" stroke-width=".8"/>' +
        '<path d="M-7 33H7M-7 37H7" stroke="rgba(60,70,80,.45)" stroke-width=".8"/>' +
        '<path d="M0 0C-3 8-8 16-7 28L7 28C8 16 3 8 0 0Z" fill="url(#wbBristle)" stroke="#6cc8f4" stroke-width=".6"/>' +
        '</g>' +
        '<g fill="#fff" opacity=".95">' +
        '<path d="M30 8l1.4 3.6L35 13l-3.6 1.4L30 18l-1.4-3.6L25 13l3.6-1.4z"/>' +
        '<path d="M8 30l1 2.6L11.6 34 9 35l-1 2.6L7 35l-2.6-1L7 33z" opacity=".8"/>' +
        '<path d="M52 22l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" opacity=".7"/>' +
        '</g>' +
        '</svg>';
    document.body.appendChild(brush);

    var canvas = document.createElement('canvas');
    canvas.className = 'wl-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0;
    function size() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    size(); window.addEventListener('resize', size);

    var COLORS = ['255,255,255', '159,232,255', '255,233,168', '216,181,255'];
    var sprites = COLORS.map(function (c) {
        var s = document.createElement('canvas'); s.width = s.height = 32;
        var g = s.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        gr.addColorStop(0, 'rgba(' + c + ',1)'); gr.addColorStop(.3, 'rgba(' + c + ',.55)'); gr.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
        return s;
    });

    var parts = [], raf = 0, lx = -999, ly = -999, acc = 0, last = 0;
    function spawn(x, y, burst) {
        var a = burst ? Math.random() * 6.283 : -0.6 + Math.random() * 1.2;
        var sp = burst ? 0.6 + Math.random() * 2.2 : 0.15 + Math.random() * 0.7;
        parts.push({
            x: x + (Math.random() - .5) * 6, y: y + (Math.random() - .5) * 6,
            vx: Math.cos(a) * sp + (burst ? 0 : 0.15), vy: Math.sin(a) * sp - (burst ? 0 : 0.25),
            life: 0, max: burst ? 700 + Math.random() * 500 : 520 + Math.random() * 650,
            s: burst ? 6 + Math.random() * 10 : 5 + Math.random() * 9,
            c: (Math.random() * sprites.length) | 0, star: Math.random() < .35
        });
        if (parts.length > 220) parts.splice(0, parts.length - 220);
        if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick(now) {
        raf = 0;
        var dt = Math.min(40, now - (last || now)); last = now;
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        for (var i = parts.length - 1; i >= 0; i--) {
            var p = parts[i];
            p.life += dt; p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.004 * dt / 16;
            if (p.life >= p.max) { parts.splice(i, 1); continue; }
            var t = p.life / p.max, al = Math.sin(Math.min(1, t * 1.15) * Math.PI) * 0.95;
            ctx.globalAlpha = al;
            var s = p.s * (1.05 - t * 0.5);
            ctx.drawImage(sprites[p.c], p.x - s, p.y - s, s * 2, s * 2);
            if (p.star) {
                ctx.globalAlpha = al * 0.9; ctx.fillStyle = '#fff';
                var r = s * 0.55;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r * .2, p.y - r * .2); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x + r * .2, p.y + r * .2);
                ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r * .2, p.y + r * .2); ctx.lineTo(p.x - r, p.y); ctx.lineTo(p.x - r * .2, p.y - r * .2);
                ctx.closePath(); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        if (parts.length) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    }

    document.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        brush.style.transform = 'translate3d(' + (e.clientX - TIP_X) + 'px,' + (e.clientY - TIP_Y) + 'px,0)';
        brush.classList.add('is-on');
        var hot = e.target && e.target.closest ? e.target.closest(HOT) : null;
        brush.classList.toggle('is-hot', !!hot);
        if (reduce) return;
        var d = Math.hypot(e.clientX - lx, e.clientY - ly);
        if (lx > -900) { acc += d; while (acc > 9) { acc -= 9; spawn(e.clientX, e.clientY, false); } }
        lx = e.clientX; ly = e.clientY;
    }, { passive: true });

    document.addEventListener('pointerdown', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        brush.classList.add('is-down');
        if (!reduce) for (var i = 0; i < 20; i++) spawn(e.clientX, e.clientY, true);
    });
    document.addEventListener('pointerup', function () { brush.classList.remove('is-down'); });
    document.documentElement.addEventListener('mouseleave', function () { brush.classList.remove('is-on'); lx = ly = -999; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { parts.length = 0; } });
})();
