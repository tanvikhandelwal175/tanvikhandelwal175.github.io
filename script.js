/* ==========================================================================
   WONDERLAND HOME (Phase 1)
   - layered mouse parallax
   - the mysterious door: hover -> open -> camera moves in -> real navigation
   - fireflies, falling rose petals, dust and door sparks on one lightweight canvas
   - reduced-motion + "ambient motion" toggle + skip-the-reveal
   The door is modular: openDoor(target) takes any section id, so it can be
   pointed at the immersive About page in Phase 2 without touching this file.
   ========================================================================== */
(function () {
    'use strict';

    var hero = document.querySelector('.wl-hero');
    if (!hero) return;

    var stage = document.getElementById('wlStage');
    var panel = document.getElementById('wlPanel');
    var doorWrap = document.getElementById('wlDoorWrap');
    var door = document.getElementById('wlDoor');
    var canvas = document.getElementById('wlCanvas');
    var calmBtn = document.getElementById('wlCalm');
    var ctx = canvas.getContext('2d');

    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var layers = Array.prototype.map.call(stage.querySelectorAll('.wl-layer'), function (el) {
        return { el: el, depth: parseFloat(el.dataset.depth || 0), zoom: parseFloat(el.dataset.zoom || 0) };
    });

    /* ------------------------------------------------------------------
       Calm mode: honours prefers-reduced-motion, user can also toggle it
       ------------------------------------------------------------------ */
    var calm = false;
    try { calm = localStorage.getItem('wlCalm') === '1'; } catch (e) {}
    if (mqReduce.matches) calm = true;

    function setCalm(v, persist) {
        calm = v;
        hero.classList.toggle('is-calm', v);
        calmBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
        calmBtn.querySelector('b').textContent = v ? 'Ambient motion: off' : 'Ambient motion: on';
        if (persist) { try { localStorage.setItem('wlCalm', v ? '1' : '0'); } catch (e) {} }
        if (v) { tx = ty = 0; kick(); clearCanvas(); } else { startParticles(); }
    }
    calmBtn.addEventListener('click', function () { setCalm(!calm, true); });

    /* ------------------------------------------------------------------
       Skip the opening reveal (any key / click in the first few seconds)
       ------------------------------------------------------------------ */
    function skipReveal() { hero.classList.add('wl-skip'); detachSkip(); }
    function detachSkip() { window.removeEventListener('keydown', skipReveal); hero.removeEventListener('pointerdown', skipReveal); }
    window.addEventListener('keydown', skipReveal);
    hero.addEventListener('pointerdown', skipReveal);
    setTimeout(detachSkip, 5200);

    /* ------------------------------------------------------------------
       Parallax + camera (one rAF loop that sleeps when nothing moves)
       ------------------------------------------------------------------ */
    var mx = 0, my = 0, tx = 0, ty = 0, cam = 0, raf = 0;

    function frame() {
        raf = 0;
        mx += (tx - mx) * 0.07;
        my += (ty - my) * 0.07;
        for (var i = 0; i < layers.length; i++) {
            var L = layers[i];
            var s = 1 + cam * L.zoom * 1.55;
            L.el.style.transform = 'translate3d(' + (-mx * L.depth * 26).toFixed(2) + 'px,' + (-my * L.depth * 14).toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
        }
        if (Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002 || cam > 0) kick();
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || calm || state !== 'idle') return;
        var r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
    });
    hero.addEventListener('pointerleave', function () { tx = ty = 0; kick(); });

    /* ------------------------------------------------------------------
       THE DOOR
       ------------------------------------------------------------------ */
    var state = 'idle';                         // idle | opening | entering
    var portal = document.createElement('div');
    portal.className = 'wl-portal';
    document.body.appendChild(portal);

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function setPivot() {
        var d = door.getBoundingClientRect(), h = hero.getBoundingClientRect();
        var px = d.left + d.width * 0.5 - h.left, py = d.top + d.height * 0.5 - h.top;
        layers.forEach(function (L) { L.el.style.transformOrigin = px + 'px ' + py + 'px'; });
        portal.style.setProperty('--px', (d.left + d.width * 0.5) + 'px');
        portal.style.setProperty('--py', (d.top + d.height * 0.5) + 'px');
    }

    function resetScene() {
        doorWrap.classList.add('is-reset');
        doorWrap.classList.remove('is-open', 'is-hover');
        hero.classList.remove('is-entering');
        cam = 0; tx = ty = mx = my = 0;
        layers.forEach(function (L) { L.el.style.transformOrigin = ''; });
        frame();
        void doorWrap.offsetWidth;                // flush so the closed door snaps back without animating
        doorWrap.classList.remove('is-reset');
    }

    function arrive(target) {
        var html = document.documentElement, prev = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';       // we are hidden behind the light: jump, don't scroll
        if (target) {
            if (location.hash !== target) location.hash = target;   // real history entry: Back works
            else { var el = document.querySelector(target); if (el) el.scrollIntoView(); }
        }
        html.style.scrollBehavior = prev;
        resetScene();
        portal.style.transition = 'opacity .95s ease';
        portal.style.opacity = '0';
        setTimeout(function () { state = 'idle'; }, 950);
    }

    function openDoor(target) {
        if (state !== 'idle') return;
        state = 'opening';
        target = target || door.getAttribute('data-door-target');
        detachSkip();

        // Reduced motion / calm: no camera move, just a soft crossfade through the light.
        if (mqReduce.matches) {
            portal.style.transition = 'opacity .35s ease';
            portal.style.opacity = '1';
            setTimeout(function () { arrive(target); }, 380);
            return;
        }

        var arrived = false;
        function go() { if (arrived) return; arrived = true; arrive(target); }
        // safety net: if the browser throttles animation frames (background tab etc.) the door still completes
        setTimeout(go, 3800);

        setPivot();
        doorWrap.classList.add('is-open');
        hero.classList.add('is-entering');
        tx = ty = 0;

        // 1) the door swings inward (CSS) ... 2) then the camera glides toward the doorway
        setTimeout(function () {
            var t0 = performance.now(), dur = 1500, flooded = false;
            (function step(now) {
                var p = Math.min(1, (now - t0) / dur);
                cam = ease(p);
                kick();
                if (!flooded && p > 0.42) {         // 3) light and mist spill through the opening
                    flooded = true;
                    portal.style.transition = 'opacity .75s ease-in';
                    portal.style.opacity = '1';
                }
                if (p < 1) requestAnimationFrame(step);
                else setTimeout(go, 260);
            })(t0);
        }, 620);
    }

    door.addEventListener('click', function () { openDoor(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-door-open]'), function (el) {
        el.addEventListener('click', function () { openDoor(); });
    });

    // hover / keyboard focus = the door stirs, its handle turns and light leaks out
    var hovering = false;
    function hoverOn() { if (state === 'idle') { doorWrap.classList.add('is-hover'); hovering = true; } }
    function hoverOff() { doorWrap.classList.remove('is-hover'); hovering = false; }
    door.addEventListener('pointerenter', hoverOn);
    door.addEventListener('pointerleave', hoverOff);
    door.addEventListener('focus', function () { if (door.matches(':focus-visible')) hoverOn(); });
    door.addEventListener('blur', hoverOff);

    /* ------------------------------------------------------------------
       PARTICLES: fireflies, rose petals, dust, door sparks
       ------------------------------------------------------------------ */
    var W = 0, H = 0, dpr = 1, running = false, inView = true, last = 0;
    var flies = [], petals = [], dust = [], sparks = [], nextPetal = 0;

    var glow = document.createElement('canvas');
    glow.width = glow.height = 64;
    (function () {
        var g = glow.getContext('2d');
        var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(255,252,225,1)');
        gr.addColorStop(0.18, 'rgba(255,226,140,.85)');
        gr.addColorStop(0.5, 'rgba(255,190,90,.22)');
        gr.addColorStop(1, 'rgba(255,170,70,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    })();

    function rand(a, b) { return a + Math.random() * (b - a); }

    function resize() {
        var r = hero.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        W = r.width; H = r.height;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var nf = W < 820 ? 9 : 22, nd = W < 820 ? 18 : 42;
        while (flies.length < nf) flies.push({ x: rand(0, W), y: rand(H * 0.18, H * 0.92), a: rand(0, 6.28), sp: rand(0.14, 0.34), ph: rand(0, 10), fr: rand(0.7, 1.8), r: rand(0.7, 1.35) });
        flies.length = nf;
        while (dust.length < nd) dust.push({ x: rand(0, W), y: rand(0, H), vx: rand(-0.05, 0.05), vy: rand(-0.09, -0.015), r: rand(0.5, 1.5), a: rand(0.12, 0.42), ph: rand(0, 6) });
        dust.length = nd;
    }

    function clearCanvas() { ctx.clearRect(0, 0, W, H); }

    function drawPetal(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(Math.cos(p.flip), 1);
        var s = p.s;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.95, -s * 0.5, s * 0.8, s * 0.65, 0, s);
        ctx.bezierCurveTo(-s * 0.8, s * 0.65, -s * 0.95, -s * 0.5, 0, -s);
        var g = ctx.createLinearGradient(0, -s, 0, s);
        g.addColorStop(0, '#d04560'); g.addColorStop(1, '#6e1428');
        ctx.fillStyle = g; ctx.globalAlpha = 0.92; ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,205,.35)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.7); ctx.stroke();
        ctx.restore();
    }

    function tick(now) {
        if (!running) return;
        if (calm || !inView || document.hidden) { running = false; return; }
        if (W < 820 && last && now - last < 30) { requestAnimationFrame(tick); return; }   // ~30fps on phones
        var dt = Math.min(48, now - (last || now)); last = now;
        var k = dt / 16.67;
        ctx.clearRect(0, 0, W, H);

        // dust motes
        ctx.globalCompositeOperation = 'source-over';
        for (var i = 0; i < dust.length; i++) {
            var d = dust[i];
            d.x += d.vx * k; d.y += d.vy * k;
            if (d.y < -4) { d.y = H + 4; d.x = rand(0, W); }
            if (d.x < -4) d.x = W + 4; else if (d.x > W + 4) d.x = -4;
            var tw = 0.55 + 0.45 * Math.sin(now * 0.001 + d.ph);
            ctx.fillStyle = 'rgba(255,236,190,' + (d.a * tw).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
        }

        // fireflies (additive glow)
        ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < flies.length; i++) {
            var f = flies[i];
            f.a += (Math.sin(now * 0.0006 + f.ph) * 0.035 + (Math.random() - 0.5) * 0.03) * k;
            f.x += Math.cos(f.a) * f.sp * k; f.y += Math.sin(f.a) * f.sp * 0.7 * k;
            if (f.x < -20) f.x = W + 20; else if (f.x > W + 20) f.x = -20;
            if (f.y < H * 0.1) f.a = Math.abs(f.a); else if (f.y > H * 0.96) f.a = -Math.abs(f.a);
            var pulse = 0.5 + 0.5 * Math.sin(now * 0.001 * f.fr + f.ph);
            var al = 0.18 + 0.82 * pulse * pulse;
            ctx.globalAlpha = al;
            var sz = 34 * f.r * (0.8 + 0.4 * pulse);
            ctx.drawImage(glow, f.x - sz / 2, f.y - sz / 2, sz, sz);
        }

        // door sparks while hovering the door
        if (hovering && state === 'idle' && Math.random() < 0.55) {
            var dr = door.getBoundingClientRect(), hr = hero.getBoundingClientRect();
            sparks.push({ x: dr.left - hr.left + rand(-dr.width * 0.15, dr.width * 1.15), y: dr.top - hr.top + rand(dr.height * 0.1, dr.height * 1.02), vx: rand(-0.25, 0.25), vy: rand(-0.9, -0.3), life: 0, max: rand(55, 105), r: rand(0.5, 1.1) });
        }
        for (i = sparks.length - 1; i >= 0; i--) {
            var s = sparks[i];
            s.life += k; s.x += s.vx * k; s.y += s.vy * k;
            if (s.life >= s.max) { sparks.splice(i, 1); continue; }
            var t = s.life / s.max;
            ctx.globalAlpha = Math.sin(t * Math.PI) * 0.95;
            var ss = 22 * s.r;
            ctx.drawImage(glow, s.x - ss / 2, s.y - ss / 2, ss, ss);
        }

        // rose petals drift down now and then
        if (now > nextPetal && petals.length < 7) {
            petals.push({ x: rand(0, W), y: -20, vx: rand(-0.25, 0.35), vy: rand(0.5, 1.0), rot: rand(0, 6.28), vr: rand(-0.03, 0.03), sw: rand(0, 6), swa: rand(0.3, 0.9), s: rand(6, 11), flip: rand(0, 6.28), vf: rand(0.02, 0.05) });
            nextPetal = now + rand(2600, 6200);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (i = petals.length - 1; i >= 0; i--) {
            var p = petals[i];
            p.sw += 0.02 * k;
            p.x += (p.vx + Math.sin(p.sw) * p.swa) * k; p.y += p.vy * k;
            p.rot += p.vr * k; p.flip += p.vf * k;
            if (p.y > H + 24) { petals.splice(i, 1); continue; }
            drawPetal(p);
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(tick);
    }

    function startParticles() {
        if (running || calm || !inView || document.hidden) return;
        running = true; last = 0;
        if (!nextPetal) nextPetal = performance.now() + 1800;
        requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            inView = entries[0].isIntersecting;
            if (inView) startParticles();
        }, { threshold: 0.05 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) startParticles(); });

    var rto;
    window.addEventListener('resize', function () {
        clearTimeout(rto);
        rto = setTimeout(function () { resize(); kick(); }, 150);
    });

    /* ---- boot ---- */
    resize();
    setCalm(calm, false);
    frame();
    startParticles();
})();
