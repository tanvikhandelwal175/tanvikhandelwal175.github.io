/* ==========================================================================
   WONDERLAND APP - a no-scroll site made of "views"
   home (the forest + door)  ->  hub (six cards)  ->  one full-screen page each
   Real URLs (#hub, #about ...), so Back / Forward / refresh / direct links all work.
   ========================================================================== */
(function () {
    'use strict';

    var VIEWS = ['home', 'hub', 'about', 'projects', 'experience', 'leadership', 'certifications', 'insights', 'contact'];
    var PAGES = VIEWS.slice(2);
    var TITLES = {
        home: 'Tanvi Khandelwal | Portfolio',
        hub: 'Choose Your Path \u2014 Tanvi Khandelwal',
        about: 'About Me \u2014 Tanvi Khandelwal',
        projects: 'Projects \u2014 Tanvi Khandelwal',
        experience: 'Experience \u2014 Tanvi Khandelwal',
        leadership: 'Leadership \u2014 Tanvi Khandelwal',
        certifications: 'Certifications \u2014 Tanvi Khandelwal',
        insights: 'Insights \u2014 Tanvi Khandelwal',
        contact: 'Contact \u2014 Tanvi Khandelwal'
    };

    var root = document.getElementById('wlViews');
    if (!root) return;

    var views = {};
    VIEWS.forEach(function (id) { views[id] = document.getElementById(id); });
    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var current = null;

    /* soft "step through the light" flash used for sign clicks (shared with the door) */
    var portal = document.querySelector('.wl-portal');
    if (!portal) {
        portal = document.createElement('div');
        portal.className = 'wl-portal';
        document.body.appendChild(portal);
    }

    function parse() {
        var id = (location.hash || '').replace('#', '');
        return VIEWS.indexOf(id) > -1 ? id : 'home';
    }

    function activate(id) {
        VIEWS.forEach(function (v) {
            var el = views[v], on = v === id;
            if (!el) return;
            el.classList.toggle('is-active', on);
            el.setAttribute('aria-hidden', on ? 'false' : 'true');
            if ('inert' in el) el.inert = !on;
        });
        current = id;
        document.title = TITLES[id];
        root.setAttribute('data-view', id);
        document.dispatchEvent(new CustomEvent('wl:view', { detail: { id: id } }));
        if (id !== 'home') {                                    // move keyboard / screen-reader focus into the new screen
            var h = views[id].querySelector('h2');
            if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
        }
    }

    function flash(cb, x, y) {
        if (typeof x === 'number') { portal.style.setProperty('--px', x + 'px'); portal.style.setProperty('--py', y + 'px'); }
        portal.style.transition = 'opacity .3s ease-in';
        portal.style.opacity = '1';
        setTimeout(function () {
            cb();
            portal.style.transition = 'opacity .7s ease';
            portal.style.opacity = '0';
        }, 320);
    }

    /* opts.mode: 'fade' (default) | 'light' | 'none'   opts.instant === none   opts.push === false -> don't add history */
    function navigate(id, opts) {
        opts = opts || {};
        if (VIEWS.indexOf(id) < 0 || id === current) return;
        if (opts.push !== false) {
            try { history.pushState({ view: id }, '', '#' + id); } catch (e) { location.hash = id; }
        }
        var mode = opts.instant ? 'none' : (opts.mode || 'fade');
        if (mode === 'none' || mqReduce.matches) { activate(id); }
        else if (mode === 'light') { flash(function () { activate(id); }, opts.x, opts.y); }
        else { activate(id); }
    }

    window.WL = { navigate: navigate, current: function () { return current; }, views: VIEWS };

    /* ---- links to views (signposts, hub cards, logo, back buttons) ---- */
    document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
        if (!a || a.hasAttribute('data-door-open')) return;
        var id = a.getAttribute('href').slice(1);
        if (VIEWS.indexOf(id) < 0) return;
        e.preventDefault();
        navigate(id, { mode: a.classList.contains('wl-sign') ? 'light' : 'fade', x: e.clientX, y: e.clientY });
    });

    window.addEventListener('popstate', function () { activate(parse()); });

    /* ---- Esc steps back: popup -> sheet -> page -> hub -> home (capture phase: we see the state BEFORE other handlers close things) ---- */
    var escState = { modal: false, sheet: false };
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        escState.modal = !!document.querySelector('.work-modal-overlay.active');
        escState.sheet = !!document.querySelector('.wl-sheet-overlay.is-open');
    }, true);
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || escState.modal) return;          // the Read More popup handles its own Esc
        if (escState.sheet) { closeSheet(); return; }
        if (PAGES.indexOf(current) > -1) navigate('hub');
        else if (current === 'hub') navigate('home');
    });

    /* ---- per-page furniture: back button + drifting dust ---- */
    function furnish(id) {
        var el = views[id];
        if (!el) return;
        var dust = document.createElement('i');
        dust.className = 'wl-dust';
        dust.setAttribute('aria-hidden', 'true');
        el.insertBefore(dust, el.firstChild);
        if (PAGES.indexOf(id) > -1) {
            var back = document.createElement('a');
            back.className = 'wl-back';
            back.href = '#hub';
            back.innerHTML = '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i> All paths';
            el.appendChild(back);
        }
    }
    ['hub'].concat(PAGES).forEach(furnish);

    /* ---- Projects: arrows (and wheel / arrow keys) instead of a scrollbar ---- */
    var car = document.querySelector('#projects .work-carousel');
    if (car) {
        var wrap = document.createElement('div');
        wrap.className = 'wl-car';
        car.parentNode.insertBefore(wrap, car);
        wrap.appendChild(car);
        var prev = document.createElement('button'), next = document.createElement('button');
        prev.type = next.type = 'button';
        prev.className = 'wl-car-btn prev'; next.className = 'wl-car-btn next';
        prev.setAttribute('aria-label', 'Previous projects'); next.setAttribute('aria-label', 'Next projects');
        prev.innerHTML = '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>';
        next.innerHTML = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
        wrap.appendChild(prev); wrap.appendChild(next);

        var step = function () { return Math.max(240, Math.round(car.clientWidth * 0.72)); };
        var sync = function () {
            prev.disabled = car.scrollLeft < 8;
            next.disabled = car.scrollLeft > car.scrollWidth - car.clientWidth - 8;
        };
        prev.addEventListener('click', function () { car.scrollBy({ left: -step(), behavior: 'smooth' }); });
        next.addEventListener('click', function () { car.scrollBy({ left: step(), behavior: 'smooth' }); });
        car.addEventListener('scroll', sync, { passive: true });
        window.addEventListener('resize', sync);
        car.addEventListener('wheel', function (e) {                          // a normal mouse wheel moves the row sideways
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { car.scrollLeft += e.deltaY; e.preventDefault(); }
        }, { passive: false });
        document.addEventListener('keydown', function (e) {
            if (current !== 'projects' || document.querySelector('.work-modal-overlay.active')) return;
            if (e.key === 'ArrowRight') { car.scrollBy({ left: step(), behavior: 'smooth' }); }
            if (e.key === 'ArrowLeft') { car.scrollBy({ left: -step(), behavior: 'smooth' }); }
        });
        sync();
        document.addEventListener('wl:view', function (e) { if (e.detail.id === 'projects') { car.scrollLeft = 0; setTimeout(sync, 50); } });
    }


    /* ---- About Me: the mirror's four tabs ---- */
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.ab-tab'));
    function pickTab(btn) {
        tabs.forEach(function (t) { var on = t === btn; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
        Array.prototype.forEach.call(document.querySelectorAll('.ab-panel'), function (p) { p.classList.toggle('is-on', p.getAttribute('data-panel') === btn.getAttribute('data-tab')); });
    }
    tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { pickTab(t); });
        t.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); var n = tabs[(i + 1) % tabs.length]; n.focus(); pickTab(n); }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); var p = tabs[(i + tabs.length - 1) % tabs.length]; p.focus(); pickTab(p); }
        });
    });

    /* ---- Insights: a tab opens a sheet with the matching posts ---- */
    var SHEET = { brand: 'Brand Analyses', market: 'Marketing Observations', biz: 'Business Learnings', all: 'LinkedIn Articles' };
    var sheet = document.createElement('div');
    sheet.className = 'wl-sheet-overlay';
    sheet.innerHTML = '<div class="wl-sheet" role="dialog" aria-modal="true" aria-labelledby="wlSheetTitle">' +
        '<div class="wl-sheet-head"><h3 class="wl-sheet-title" id="wlSheetTitle"></h3><button type="button" class="wl-sheet-close" aria-label="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
        '<div class="wl-sheet-car"><div class="wl-sheet-track"></div>' +
        '<button type="button" class="wl-car-btn prev" aria-label="Previous posts"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
        '<button type="button" class="wl-car-btn next" aria-label="Next posts"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></div></div>';
    document.body.appendChild(sheet);
    var sTrack = sheet.querySelector('.wl-sheet-track'), sPrev = sheet.querySelector('.prev'), sNext = sheet.querySelector('.next'), sTitle = sheet.querySelector('.wl-sheet-title');
    var lastTab = null;
    function sheetSync() { sPrev.disabled = sTrack.scrollLeft < 8; sNext.disabled = sTrack.scrollLeft > sTrack.scrollWidth - sTrack.clientWidth - 8; }
    function openSheet(key, trigger) {
        sTrack.innerHTML = '';
        var n = 0;
        Array.prototype.forEach.call(document.querySelectorAll('#insights .wl-posts .work-card'), function (c) {
            if (key === 'all' || c.getAttribute('data-cat') === key) { sTrack.appendChild(c.cloneNode(true)); n++; }
        });
        sTitle.innerHTML = SHEET[key] + '<small>' + n + (n === 1 ? ' post' : ' posts') + ' &middot; from LinkedIn</small>';
        lastTab = trigger || null;
        sheet.classList.add('is-open');
        sTrack.scrollLeft = 0; setTimeout(sheetSync, 60);
        sheet.querySelector('.wl-sheet-close').focus();
    }
    function closeSheet() { sheet.classList.remove('is-open'); if (lastTab) lastTab.focus(); }
    Array.prototype.forEach.call(document.querySelectorAll('.tab-card[data-sheet]'), function (t) {
        t.addEventListener('click', function () { openSheet(t.getAttribute('data-sheet'), t); });
    });
    sheet.addEventListener('click', function (e) {
        if (e.target === sheet || e.target.closest('.wl-sheet-close')) { closeSheet(); return; }
        var trig = e.target.closest('.work-modal-trigger');                  // "Read More" on a post that has no LinkedIn link
        if (trig && typeof openWorkModal === 'function') openWorkModal(trig.getAttribute('data-modal-target'));
    });
    sPrev.addEventListener('click', function () { sTrack.scrollBy({ left: -Math.round(sTrack.clientWidth * .72), behavior: 'smooth' }); });
    sNext.addEventListener('click', function () { sTrack.scrollBy({ left: Math.round(sTrack.clientWidth * .72), behavior: 'smooth' }); });
    sTrack.addEventListener('scroll', sheetSync, { passive: true });
    sTrack.addEventListener('wheel', function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { sTrack.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
    document.addEventListener('wl:view', function () { sheet.classList.remove('is-open'); });

    /* ---- boot: honour the URL (refresh / shared link / Back) ---- */
    activate(parse());
})();
