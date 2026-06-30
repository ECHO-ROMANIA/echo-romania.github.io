/* ECHO Romania landing — hero map animation + tiny reveal observer.
   Mirrors the behaviour of the main site so the visual feels identical, but
   trimmed to just the pieces this one page needs (no nav, no parallax). */
(function () {
    'use strict';

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

    function reveal(el, animate) {
        if (el.dataset.revealed) { return; }
        el.dataset.revealed = '1';
        if (animate) {
            var name = el.getAttribute('data-reveal') || 'fadeInUp';
            el.classList.add('animate__animated', 'animate__' + name);
        }
        el.classList.add('is-revealed');
    }

    if (revealEls.length) {
        if (prefersReduced || !('IntersectionObserver' in window)) {
            revealEls.forEach(function (el) { reveal(el, false); });
        } else {
            revealEls.forEach(function (el) {
                var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) {
                    return c.hasAttribute('data-reveal');
                });
                var index = siblings.indexOf(el);
                if (index > 0) { el.style.animationDelay = (index * 0.09) + 's'; }
            });

            var observer = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) { return; }
                    reveal(entry.target, true);
                    obs.unobserve(entry.target);
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

            revealEls.forEach(function (el) { observer.observe(el); });

            window.addEventListener('load', function () {
                setTimeout(function () {
                    var anyRevealed = revealEls.some(function (el) { return el.dataset.revealed; });
                    if (!anyRevealed) {
                        revealEls.forEach(function (el) { reveal(el, false); });
                    }
                }, 1500);
            });
        }
    }
})();

/* Hero map: live UK ↔ Romania connections.
   Replaces the pre-baked static arcs and nodes (hidden in CSS once `.js`
   is present) with randomized links drawn on the fly. Skipped for reduced-
   motion visitors and paused while the hero is off-screen or the tab is
   hidden. Lifted verbatim from the main site so the motion matches. */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

    var svg = document.getElementById('echo-map');
    var flyways = svg && svg.querySelector('.flyways');
    if (!flyways) { return; }

    var NS = 'http://www.w3.org/2000/svg';

    var UK = [[210.7, 234], [231.6, 230.9], [291.6, 378.5], [257.1, 347.3]];
    var RO = [[710, 549.6], [757.3, 520.6], [835.3, 509.5], [805.9, 586.4]];

    var MAX = 5;
    var active = [];
    var rafId = null, schedTimer = null, live = false;

    function rand(a, b) { return a + Math.random() * (b - a); }
    function spot(poly) {
        var a = poly[0], areas = [], total = 0, i;
        for (i = 1; i < poly.length - 1; i++) {
            areas.push(Math.abs((poly[i][0] - a[0]) * (poly[i + 1][1] - a[1]) -
                                (poly[i + 1][0] - a[0]) * (poly[i][1] - a[1])));
            total += areas[i - 1];
        }
        var r = Math.random() * total, k = 0;
        while (k < areas.length - 1 && r > areas[k]) { r -= areas[k]; k++; }
        var b = poly[k + 1], c = poly[k + 2];
        var u = Math.random(), w = Math.random();
        if (u + w > 1) { u = 1 - u; w = 1 - w; }
        return [a[0] + u * (b[0] - a[0]) + w * (c[0] - a[0]),
                a[1] + u * (b[1] - a[1]) + w * (c[1] - a[1])];
    }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function el(name, cls) {
        var n = document.createElementNS(NS, name);
        if (cls) { n.setAttribute('class', cls); }
        return n;
    }

    function arcPath(from, to) {
        var ox = from[0], oy = from[1], dx = to[0], dy = to[1];
        var mx = (ox + dx) / 2, my = (oy + dy) / 2;
        var vx = dx - ox, vy = dy - oy;
        var len = Math.sqrt(vx * vx + vy * vy) || 1;
        var nx = -vy / len, ny = vx / len;
        if (ny > 0) { nx = -nx; ny = -ny; }
        var curve = len * rand(0.16, 0.30);
        var cx = mx + nx * curve, cy = my + ny * curve;
        return 'M' + ox.toFixed(1) + ' ' + oy.toFixed(1) +
               'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' +
               dx.toFixed(1) + ' ' + dy.toFixed(1);
    }

    function anim(attr, values) {
        var a = el('animate');
        a.setAttribute('attributeName', attr);
        a.setAttribute('begin', '0s');
        a.setAttribute('dur', '3s');
        a.setAttribute('values', values);
        a.setAttribute('repeatCount', 'indefinite');
        return a;
    }

    function makeNode(x, y) {
        var g = el('g', 'node');
        var pulse = el('circle', 'pulse');
        pulse.setAttribute('cx', x); pulse.setAttribute('cy', y); pulse.setAttribute('r', '3');
        pulse.appendChild(anim('r', '3;15'));
        pulse.appendChild(anim('opacity', '0.55;0'));
        var core = el('circle', 'core');
        core.setAttribute('cx', x); core.setAttribute('cy', y); core.setAttribute('r', '2.6');
        g.appendChild(pulse); g.appendChild(core);
        return g;
    }

    function place(dot, path, at) {
        var p = path.getPointAtLength(at);
        dot.setAttribute('cx', p.x.toFixed(1));
        dot.setAttribute('cy', p.y.toFixed(1));
    }

    function spawn() {
        var ukToRo = Math.random() < 0.5;
        var o = spot(ukToRo ? UK : RO);
        var d = spot(ukToRo ? RO : UK);

        var g = el('g', 'flyway-link');
        var path = el('path', 'flyway');
        path.setAttribute('d', arcPath(o, d));
        g.appendChild(path);
        g.appendChild(makeNode(o[0].toFixed(1), o[1].toFixed(1)));
        g.appendChild(makeNode(d[0].toFixed(1), d[1].toFixed(1)));

        var dot = el('circle', 'flyway-dot');
        dot.setAttribute('r', (1.8 + Math.random() * 0.9).toFixed(2));
        g.appendChild(dot);
        flyways.appendChild(g);

        var L = path.getTotalLength();
        path.style.strokeDasharray = L;
        path.style.strokeDashoffset = L;
        place(dot, path, 0);

        active.push({
            group: g, path: path, dot: dot, len: L, phase: 'out', since: null,
            tOut: rand(1500, 2400), tHold: rand(140, 340),
            tBack: rand(1500, 2300), tFade: rand(650, 950)
        });
        if (!rafId) { rafId = window.requestAnimationFrame(tick); }
    }

    function tick(now) {
        rafId = null;
        var stillLive = [];
        for (var i = 0; i < active.length; i++) {
            var c = active[i];
            if (c.since === null) { c.since = now; }
            var t = now - c.since;

            if (c.phase === 'out') {
                var p = t / c.tOut; if (p > 1) { p = 1; }
                var e = ease(p);
                c.path.style.strokeDashoffset = c.len * (1 - e);
                place(c.dot, c.path, e * c.len);
                if (p >= 1) { c.phase = 'hold'; c.since = now; c.path.style.strokeDashoffset = 0; }
            } else if (c.phase === 'hold') {
                if (t >= c.tHold) { c.phase = 'back'; c.since = now; }
            } else if (c.phase === 'back') {
                var pb = t / c.tBack; if (pb > 1) { pb = 1; }
                place(c.dot, c.path, (1 - ease(pb)) * c.len);
                if (pb >= 1) { c.phase = 'fade'; c.since = now; }
            } else if (c.phase === 'fade') {
                var f = t / c.tFade; if (f > 1) { f = 1; }
                c.group.style.opacity = String(1 - f);
                if (f >= 1) {
                    if (c.group.parentNode) { flyways.removeChild(c.group); }
                    continue;
                }
            }
            stillLive.push(c);
        }
        active = stillLive;
        if (active.length) { rafId = window.requestAnimationFrame(tick); }
    }

    function schedule() {
        schedTimer = null;
        if (!live) { return; }
        if (active.length < MAX) { spawn(); }
        schedTimer = window.setTimeout(schedule, rand(600, 1400));
    }

    function start() {
        if (live) { return; }
        live = true;
        spawn();
        schedTimer = window.setTimeout(schedule, rand(350, 750));
    }

    function stop() {
        live = false;
        if (schedTimer) { window.clearTimeout(schedTimer); schedTimer = null; }
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
        for (var i = 0; i < active.length; i++) {
            if (active[i].group.parentNode) { flyways.removeChild(active[i].group); }
        }
        active = [];
    }

    var onScreen = true;
    function sync() { if (onScreen && !document.hidden) { start(); } else { stop(); } }

    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            onScreen = entries[0].isIntersecting;
            sync();
        }, { threshold: 0 });
        io.observe(flyways.closest('.hero-map') || svg);
    }
    sync();
})();
