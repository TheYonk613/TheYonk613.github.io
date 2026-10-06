/* ============================================================
   YOUNKERSTUDIO — interaction layer
   Vanilla JS. No libraries. One rAF loop drives everything.
   ============================================================ */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── TICKER ─────────────────────────────────────────────
  // S.y is the scroll position eased toward the real one, so every
  // scroll-linked effect glides instead of snapping to wheel ticks.
  const S = { y: scrollY, raw: scrollY, vel: 0, vw: innerWidth, vh: innerHeight, px: -9999, py: -9999 };
  const tasks = [];
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    S.raw = scrollY;
    const prev = S.y;
    S.y = RM ? S.raw : lerp(S.y, S.raw, 1 - Math.exp(-dt * 9));
    if (Math.abs(S.raw - S.y) < .05) S.y = S.raw;
    S.vel = dt ? (S.y - prev) / dt : 0;
    for (const t of tasks) t(dt, now);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { S.vw = innerWidth; S.vh = innerHeight; }, { passive: true });
  addEventListener('pointermove', e => { S.px = e.clientX; S.py = e.clientY; }, { passive: true });

  // ── SPLIT TEXT ─────────────────────────────────────────
  function split(el) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = d.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.append(' '); return; }
            const w = d.createElement('span'); w.className = 'w';
            const wi = d.createElement('span'); wi.className = 'wi';
            wi.style.setProperty('--i', i++);
            wi.textContent = tok;
            w.append(wi); frag.append(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    };
    walk(el);
  }

  // ── REVEALS ────────────────────────────────────────────
  function initReveals() {
    const els = $$('[data-reveal], [data-split]');
    if (RM || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: .01, rootMargin: '0px 0px -8% 0px' });
    // Anything already on screen reveals straight away rather than waiting on the observer.
    setTimeout(() => els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { el.classList.add('is-in'); io.unobserve(el); }
    }), 60);
    els.forEach(el => io.observe(el));
  }

  // ── BOOT ───────────────────────────────────────────────
  function boot(done) {
    const b = $('.boot');
    let seen = false;
    try { seen = !!sessionStorage.getItem('ys-boot'); } catch (e) { /* storage blocked */ }
    if (!b || RM || seen) { if (b) b.remove(); root.classList.add('booted'); return done(); }
    const n = $('.boot__n', b);
    const t0 = performance.now(), dur = 1250;
    const tick = now => {
      const p = clamp((now - t0) / dur);
      n.textContent = String(Math.round(ease(p) * 100)).padStart(3, '0');
      if (p < 1) return requestAnimationFrame(tick);
      try { sessionStorage.setItem('ys-boot', '1'); } catch (e) { /* storage blocked */ }
      root.classList.add('booted');
      setTimeout(done, 380);
      setTimeout(() => b.remove(), 1200);
    };
    requestAnimationFrame(tick);
  }

  // ── NAV ────────────────────────────────────────────────
  function initNav() {
    const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
    if (!nav) return;
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      if (!root.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > 300);
      lastY = y;
    }, { passive: true });

    const toggle = open => {
      root.classList.toggle('menu-open', open);
      if (open) nav.classList.remove('is-hidden');
      burger.setAttribute('aria-expanded', open);
      d.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle(!root.classList.contains('menu-open')));
    $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
    d.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

    const bar = $('.progress');
    if (bar) tasks.push(() => {
      const max = d.documentElement.scrollHeight - S.vh;
      bar.style.setProperty('--p', max > 0 ? clamp(S.y / max).toFixed(4) : 0);
    });
  }

  // ── CURSOR FOLLOWER ────────────────────────────────────
  function initCursor() {
    const c = $('.cursor');
    if (!c || !FINE || RM) return;
    let x = S.vw / 2, y = S.vh / 2;
    tasks.push(dt => {
      if (S.px < -999) return;
      const k = 1 - Math.exp(-dt * 16);
      x = lerp(x, S.px, k); y = lerp(y, S.py, k);
      c.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
    addEventListener('pointermove', () => c.classList.add('is-on'), { once: true });
    d.addEventListener('pointerleave', () => c.classList.remove('is-on'));
    d.addEventListener('pointerenter', () => c.classList.add('is-on'));
    d.addEventListener('pointerover', e => {
      c.classList.toggle('is-link', !!e.target.closest('a, button, input, textarea, select, [data-tilt]'));
    });
  }

  // ── MAGNETIC BUTTONS ───────────────────────────────────
  function initMagnetic() {
    if (!FINE || RM) return;
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(dx * .22).toFixed(1)}px,${(dy * .32).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ── TILT + SPOTLIGHT CARDS ─────────────────────────────
  function initTilt() {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (FINE && !RM) {
          el.style.setProperty('--ry', ((px - .5) * 7).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
        }
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  // ── COUNT-UP ───────────────────────────────────────────
  function initCounts() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const run = el => {
      const to = +el.dataset.count, t0 = performance.now(), dur = 1800;
      const tick = now => {
        const p = clamp((now - t0) / dur);
        el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * to);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (RM || !('IntersectionObserver' in window)) return;
    els.forEach(el => { el.textContent = '0'; });
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
    }), { threshold: .4 });
    els.forEach(el => io.observe(el));
  }

  // ── MARQUEE (speeds up with scroll velocity) ───────────
  function initMarquee() {
    $$('.marquee').forEach(m => {
      const track = $('.marquee__track', m), set = $('.marquee__set', m);
      if (!track || !set) return;
      track.append(set.cloneNode(true), set.cloneNode(true));
      $$('.marquee__set', track).slice(1).forEach(s => s.setAttribute('aria-hidden', 'true'));
      if (RM) return;
      let x = 0, w = set.offsetWidth, skew = 0;
      addEventListener('resize', () => { w = set.offsetWidth; }, { passive: true });
      tasks.push(dt => {
        if (!w) { w = set.offsetWidth; return; }
        x -= (60 + Math.abs(S.vel) * .35) * dt;
        if (x <= -w) x += w;
        skew = lerp(skew, clamp(S.vel / 400, -1, 1) * -6, .1);
        track.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      });
    });
  }

  // ── SCROLL PROGRESS VARS ───────────────────────────────
  // [data-progress] gets --p from 0→1 as it crosses the viewport.
  function initProgress() {
    const els = $$('[data-progress]');
    if (!els.length) return;
    tasks.push(() => {
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > S.vh + 200) return;
        const p = clamp((S.vh * .78 - r.top) / (r.height + S.vh * .25));
        el.style.setProperty('--p', p.toFixed(4));
      });
    });
  }

  // ── LAYERS: pinned isometric stack ─────────────────────
  function initLayers() {
    const sec = $('.layers');
    if (!sec) return;
    const items = $$('.layer', sec), planes = $$('.plane', sec), stack = $('.stack', sec);
    let active = -1;
    const set = i => {
      if (i === active) return;
      active = i;
      items.forEach((it, k) => it.classList.toggle('is-active', k === i));
      planes.forEach(p => {
        const k = +p.dataset.i;
        p.classList.toggle('is-active', k === i);
        p.classList.toggle('is-above', k > i);
      });
    };
    set(0);
    tasks.push(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > S.vh) return;
      const span = r.height - S.vh;
      const p = span > 0 ? clamp(-r.top / span) : 0;
      set(Math.min(items.length - 1, Math.floor(p * items.length)));
      stack.style.setProperty('--open', clamp(1 - r.top / (S.vh * .8)).toFixed(3));
    });
    items.forEach((it, i) => $('.layer__head', it).addEventListener('click', () => {
      const span = sec.offsetHeight - S.vh;
      const top = sec.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + span * ((i + .5) / items.length), behavior: RM ? 'auto' : 'smooth' });
    }));
  }

  // ── FLOW DEMO ──────────────────────────────────────────
  function initFlow() {
    const flow = $('#flow');
    if (!flow) return;
    const nodes = $$('.flow__node', flow), links = $$('.flow__link', flow);
    const log = $('#flow-log'), btn = $('#flow-run');
    let token = 0;

    const stamp = ms => {
      const t = new Date(2026, 0, 1, 9, 41, 2, ms);
      return t.toTimeString().slice(0, 8) + '.' + String(t.getMilliseconds()).padStart(3, '0');
    };
    const line = async (my, ms, key, text, cls) => {
      const row = d.createElement('div');
      row.innerHTML = `<span class="t">${stamp(ms)}</span>  <span class="${cls || 'k'}">${key.padEnd(9)}</span>`;
      const span = d.createElement('span');
      row.append(span);
      log.append(row);
      for (const ch of text) {
        if (my !== token) return;
        span.textContent += ch;
        if (!RM) await sleep(9);
      }
    };

    async function run() {
      const my = ++token;
      const t0 = performance.now();
      nodes.forEach(n => n.classList.remove('is-on'));
      links.forEach(l => l.classList.remove('is-on'));
      log.textContent = '';
      btn.textContent = 'Running…';
      let ms = 0;
      for (let i = 0; i < nodes.length; i++) {
        if (my !== token) return;
        nodes[i].classList.add('is-on');
        await line(my, ms, nodes[i].dataset.key, nodes[i].dataset.log);
        if (my !== token) return;
        ms += 180 + i * 90;
        if (links[i]) { links[i].classList.add('is-on'); await sleep(RM ? 0 : 420); }
      }
      if (my !== token) return;
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      await line(my, ms, 'done', `${secs}s end to end. Nobody touched it.`, 'ok');
      btn.textContent = 'Run again';
    }

    btn.addEventListener('click', run);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { run(); io.disconnect(); }
      }), { threshold: .45 });
      io.observe(flow);
    }
  }

  // ── FAQ ────────────────────────────────────────────────
  function initFaq() {
    $$('.faq__q').forEach(q => q.addEventListener('click', () => {
      const open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!open));
    }));
  }

  // ── FOOTER WORDMARK: weight follows the pointer ────────
  function initWord() {
    const word = $('.footer__word');
    if (!word || RM) return;
    const txt = word.textContent.trim();
    const cut = +word.dataset.accentFrom || txt.length;
    word.setAttribute('aria-label', txt);
    word.textContent = '';
    const letters = [...txt].map((ch, i) => {
      const s = d.createElement('span');
      s.textContent = ch; s.setAttribute('aria-hidden', 'true');
      if (i >= cut) s.className = 's';
      word.append(s);
      return { el: s, w: 300 };
    });
    tasks.push((dt, now) => {
      const r = word.getBoundingClientRect();
      if (r.bottom < 0 || r.top > S.vh) return;
      letters.forEach((l, i) => {
        const b = l.el.getBoundingClientRect();
        let target;
        if (FINE && S.px > -999) {
          const dist = Math.hypot(S.px - (b.left + b.width / 2), (S.py - (b.top + b.height / 2)) * .6);
          target = 220 + 580 * Math.pow(clamp(1 - dist / (S.vw * .28)), 1.6);
        } else {
          target = 320 + 330 * (.5 + .5 * Math.sin(now / 700 - i * .55));
        }
        l.w = lerp(l.w, target, 1 - Math.exp(-dt * 8));
        l.el.style.setProperty('--wg', l.w.toFixed(0));
      });
    });
  }


  // ── TOOL: cost of manual work ──────────────────────────
  // hours/yr   = people × hours per week × 48 working weeks
  // cost/yr    = hours/yr × hourly value
  // recovered  = hours/yr × automatable share
  // net/yr     = recovered × hourly value − 12 × monthly software cost
  // payback    = build cost ÷ net/yr, in calendar time (the 48 working weeks span a 52-week year)
  // first year = net/yr − build cost
  function initCalc() {
    const el = $('#calc');
    if (!el) return;
    const ins = $$('input[type=range]', el);
    const nf = new Intl.NumberFormat('en-US');
    const money = n => (n < 0 ? '−$' : '$') + nf.format(Math.abs(Math.round(n)));
    const count = n => nf.format(Math.round(n));
    const out = { cost: [$('#calc-cost'), money], hours: [$('#calc-hours'), count], rec: [$('#calc-rec'), count], net: [$('#calc-net'), money], first: [$('#calc-first'), money] };
    const cur = { cost: 0, hours: 0, rec: 0, net: 0, first: 0 }, tgt = { ...cur };
    const WEEKS = 48, RATE = 50;

    const read = () => {
      const v = {};
      ins.forEach(i => {
        v[i.name] = +i.value;
        i.style.setProperty('--v', ((i.value - i.min) / (i.max - i.min) * 100).toFixed(1) + '%');
        $(`output[for="${i.id}"]`, el).textContent = (i.dataset.pre || '') + nf.format(i.value) + (i.dataset.suf || '');
      });
      const build = v.build * RATE;
      tgt.hours = v.people * v.hours * WEEKS;
      tgt.cost = tgt.hours * v.rate;
      tgt.rec = tgt.hours * v.auto / 100;
      tgt.net = tgt.rec * v.rate - v.tools * 12;
      tgt.first = tgt.net - build;

      const months = tgt.net > 0 ? build / (tgt.net / 12) : Infinity;
      const weeks = months * 52 / 12;
      $('#calc-build').textContent = money(build);
      $('#calc-payback').textContent = tgt.net <= 0 ? 'Does not pay back'
        : weeks < 1 ? 'Under a week'
        : weeks <= 12 ? `${Math.ceil(weeks)} weeks`
        : months <= 24 ? `${months.toFixed(1)} months`
        : `${(months / 12).toFixed(1)} years`;
      $('#calc-verdict').hidden = months <= 24;
      el.style.setProperty('--after', (1 - v.auto / 100).toFixed(3));
    };
    ins.forEach(i => i.addEventListener('input', read));
    read();
    Object.assign(cur, tgt); // first paint shows the real figures, not zeros
    for (const k in cur) out[k][0].textContent = out[k][1](cur[k]);

    // Eased on real elapsed time (not the capped frame delta) so the figures always settle on the exact values.
    let then = performance.now();
    tasks.push((_, now) => {
      const k10 = 1 - Math.exp(-(now - then) / 100);
      then = now;
      for (const k in cur) {
        cur[k] = RM || Math.abs(tgt[k] - cur[k]) < 1 ? tgt[k] : lerp(cur[k], tgt[k], k10);
        const s = out[k][1](cur[k]);
        if (out[k][0].textContent !== s) out[k][0].textContent = s;
      }
    });
  }

  // ── TOOL: operations diagnostic ────────────────────────
  function initDiag() {
    const el = $('#diag');
    if (!el) return;
    const D = [
      { name: 'Process', full: 'Process clarity',
        qs: ['Core processes are documented, and a new hire could follow them without asking.', 'When something goes wrong, we can trace where in the process it failed.'],
        rec: 'Write down the two or three processes you run most often, and agree on one way of doing each. Everything else gets easier once that is settled.' },
      { name: 'Data', full: 'Customer data',
        qs: ['Customer and contact data lives in one system that the team trusts.', 'Records are free of duplicates, and nobody keeps a private spreadsheet as a backup.'],
        rec: 'Get your customer data into one place and clean it up before adding anything new. Every report and automation depends on it.' },
      { name: 'Automation', full: 'Automation',
        qs: ['Data moves between our tools without anyone copying and pasting.', 'Routine follow-ups, reminders and handoffs happen without someone remembering to do them.'],
        rec: 'List the tasks where someone moves data between tools by hand, sort them by hours per week, and automate the biggest one first. The calculator above will tell you if it is worth it.' },
      { name: 'Reporting', full: 'Reporting and visibility',
        qs: ['We can see the current state of work, pipeline or cash without asking anyone.', 'Regular reports are produced automatically.'],
        rec: 'Pick the handful of numbers you run the business on and set up one report that sends them to you every week. Once you can see them, the next priority is usually obvious.' },
      { name: 'Ownership', full: 'Ownership',
        qs: ['Every recurring task and system has a named owner.', 'Work rarely stalls or gets dropped at the handoff between people or vendors.'],
        rec: 'Give every system and recurring task one named owner, and spell out the handoffs. Most dropped work gets lost between people.' }
    ];
    const OPTS = ['Not true', 'Partly true', 'Mostly true', 'Fully true'];
    const BANDS = [
      [40, 'Reactive', 'Things run on effort and memory right now. There is a lot of time to win back.'],
      [70, 'Developing', 'The basics are there, but a few gaps are slowing you down.'],
      [101, 'Structured', 'Things are in good shape. What is left is fine-tuning.']
    ];
    const qs = D.flatMap((dm, di) => dm.qs.map(q => ({ di, q })));
    const ans = new Array(qs.length).fill(null);
    let i = 0;

    const card = $('#diag-card'), qEl = $('#diag-q'), dimEl = $('#diag-dim'), bar = $('#diag-bar'),
      opts = $('#diag-opts'), back = $('#diag-back'), ask = $('#diag-ask'), res = $('#diag-result');

    // radar
    const svg = $('#radar'), NS = 'http://www.w3.org/2000/svg', C = 170, R = 108, N = D.length;
    const pt = (k, r) => { const a = -Math.PI / 2 + k * 2 * Math.PI / N; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
    const mk = (tag, attrs) => { const n = d.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); svg.append(n); return n; };
    const poly = r => D.map((_, k) => pt(k, r).map(n => n.toFixed(1)).join(',')).join(' ');
    [.25, .5, .75, 1].forEach(f => mk('polygon', { class: 'ring', points: poly(R * f) }));
    D.forEach((dm, k) => {
      const [x, y] = pt(k, R), [lx, ly] = pt(k, R + 22);
      mk('line', { class: 'axis', x1: C, y1: C, x2: x, y2: y });
      const t = mk('text', { x: lx, y: ly + 3, 'text-anchor': Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end' });
      t.textContent = dm.name;
    });
    const shape = mk('polygon', { class: 'shape' });
    const dots = D.map(() => mk('circle', { class: 'dot', r: 3.5 }));
    const cur = D.map(() => 0);

    const score = di => {
      const mine = qs.map((q, k) => (q.di === di ? ans[k] : undefined)).filter(v => v !== undefined);
      return mine.reduce((s, v) => s + (v || 0), 0) / (mine.length * 3);
    };
    const drawRadar = () => {
      const pts = cur.map((v, k) => pt(k, R * (.07 + .93 * v)));
      shape.setAttribute('points', pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '));
      dots.forEach((c, k) => { c.setAttribute('cx', pts[k][0].toFixed(1)); c.setAttribute('cy', pts[k][1].toFixed(1)); });
    };
    tasks.push(dt => {
      let moved = false;
      cur.forEach((v, k) => {
        const t = score(k);
        if (Math.abs(t - v) < .001) return;
        cur[k] = RM ? t : lerp(v, t, 1 - Math.exp(-dt * 7));
        moved = true;
      });
      if (moved) drawRadar();
    });
    drawRadar();

    OPTS.forEach((label, v) => {
      const b = d.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => {
        ans[i] = v;
        $$('button', opts).forEach((o, k) => o.setAttribute('aria-pressed', String(k === v)));
        setTimeout(() => { i++; render(); }, 220);
      });
      opts.append(b);
    });
    back.addEventListener('click', () => { i = Math.max(0, i - 1); render(); });

    function render() {
      const done = i >= qs.length;
      ask.style.display = done ? 'none' : 'contents'; res.hidden = !done;
      bar.style.setProperty('--p', (Math.min(i, qs.length) / qs.length).toFixed(3));
      if (done) return result();
      dimEl.textContent = D[qs[i].di].full;
      qEl.textContent = qs[i].q;
      qEl.classList.remove('swap'); void qEl.offsetWidth; qEl.classList.add('swap');
      $$('button', opts).forEach((o, k) => o.setAttribute('aria-pressed', String(ans[i] === k)));
      back.disabled = i === 0;
    }

    function result() {
      const s = D.map((_, k) => score(k));
      const overall = Math.round(s.reduce((a, b) => a + b, 0) / N * 100);
      const low = s.indexOf(Math.min(...s)), high = s.indexOf(Math.max(...s));
      const band = BANDS.find(b => overall < b[0]);
      $('#diag-score').firstChild.textContent = overall;
      $('#diag-band').textContent = `${band[1]}. ${band[2]}`;
      $('#diag-rec').innerHTML = `<b>Start with ${D[low].full.toLowerCase()}.</b> ${D[low].rec}` +
        (high !== low ? ` You are strongest on ${D[high].full.toLowerCase()}.` : '');
    }
    $('#diag-reset').addEventListener('click', () => { ans.fill(null); i = 0; render(); card.scrollIntoView({ block: 'nearest' }); });
    render();
  }

  // ── CONTACT FORM ───────────────────────────────────────
  function initForm() {
    const form = $('#contact-form');
    if (!form) return;
    const submitBtn = $('#form-submit'), statusEl = $('#form-status'), label = $('span', submitBtn);
    const SCRIPT_URL = form.dataset.endpoint;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      // Honeypot check — bots fill this field, humans don't
      if ($('#hp-website').value) return;

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      if (!name || !email || !message) {
        statusEl.textContent = 'Please fill in your name, email, and message.';
        statusEl.className = 'form__status error';
        return;
      }

      submitBtn.disabled = true;
      label.textContent = 'Sending…';
      statusEl.className = 'form__status';
      statusEl.textContent = '';

      const data = {
        name, email, message,
        business: form.business.value.trim(),
        timestamp: new Date().toISOString(),
        hp: $('#hp-website').value // Apps Script should reject if non-empty
      };

      try {
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        statusEl.textContent = "Got it. I'll get back to you within one business day.";
        statusEl.className = 'form__status success';
        form.reset();
      } catch (err) {
        statusEl.textContent = "That didn't send. Please email me at younkerstudio@gmail.com instead.";
        statusEl.className = 'form__status error';
      } finally {
        submitBtn.disabled = false;
        label.textContent = 'Send it over';
      }
    });
  }

  // ── HERO: a tangled network that resolves into a running system ──
  function initHero() {
    const hero = $('.hero'), c = $('#hero-canvas');
    if (!hero || !c) return;
    const ctx = c.getContext('2d');
    const statusBtn = $('#hero-status'), statusTxt = $('#hero-status-text');
    const PAPER = '241,237,228', SIGNAL = '255,90,43';

    let W = 0, H = 0, nodes = [], dust = [], edgesO = [], edgesC = [], out = [], pulses = [];
    let order = 0, target = 0, visible = true, spawnT = 0, state = '';
    const rnd = (a, b) => a + Math.random() * (b - a);

    function build() {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mobile = W < 800;
      const cols = mobile ? [1, 3, 4, 3, 1] : [2, 4, 6, 6, 4, 2];
      const reg = mobile
        ? { x0: W * .1, x1: W * .9, y0: H * .68, y1: H * .9 }
        : { x0: W * .5, x1: W * .94, y0: H * .16, y1: H * .8 };
      const gy = (reg.y1 - reg.y0) / Math.max(...cols);

      const old = nodes;
      nodes = []; edgesO = []; edgesC = []; pulses = [];
      const byCol = [];
      cols.forEach((n, ci) => {
        byCol[ci] = [];
        for (let j = 0; j < n; j++) {
          const k = nodes.length, o = old[k];
          const node = {
            ox: reg.x0 + (reg.x1 - reg.x0) * ci / (cols.length - 1),
            oy: (reg.y0 + reg.y1) / 2 + (j - (n - 1) / 2) * gy,
            cx: rnd(W * .04, W * .96), cy: rnd(H * .1, H * .92),
            ph: rnd(0, 6.28), sp: rnd(.25, .7), amp: rnd(24, 64),
            t: o ? o.t : 0, x: 0, y: 0, col: ci, flash: 0
          };
          byCol[ci].push(k); nodes.push(node);
        }
      });

      // ordered edges: every node feeds the nearest node(s) in the next column
      const seen = new Set();
      const link = (a, b) => { const key = a + '-' + b; if (!seen.has(key)) { seen.add(key); edgesO.push([a, b]); } };
      for (let ci = 0; ci < cols.length - 1; ci++) {
        const A = byCol[ci], B = byCol[ci + 1];
        A.forEach((a, j) => link(a, B[Math.round(j * (B.length - 1) / Math.max(A.length - 1, 1))]));
        B.forEach((b, j) => link(A[Math.round(j * (A.length - 1) / Math.max(B.length - 1, 1))], b));
      }
      out = nodes.map(() => []);
      edgesO.forEach((e, i) => out[e[0]].push(i));

      // chaos edges: everything wired to everything, the way it grows by accident
      nodes.forEach((_, a) => {
        for (let k = 0; k < 2; k++) {
          const b = Math.floor(rnd(0, nodes.length));
          if (b !== a) edgesC.push([a, b]);
        }
      });

      // dust settles into a quiet dot lattice behind the system
      dust = [];
      const gx = mobile ? 9 : 14, gyN = mobile ? 5 : 9, pad = mobile ? 14 : 44;
      for (let i = 0; i < gx; i++) for (let j = 0; j < gyN; j++) {
        dust.push({
          ox: reg.x0 - pad + (reg.x1 - reg.x0 + pad * 2) * i / (gx - 1),
          oy: reg.y0 - pad + (reg.y1 - reg.y0 + pad * 2) * j / (gyN - 1),
          cx: rnd(0, W), cy: rnd(0, H), ph: rnd(0, 6.28), sp: rnd(.15, .5), t: 0
        });
      }
    }

    function setState(s) {
      if (s === state || !statusTxt) return;
      state = s;
      statusTxt.textContent = s === 'ok' ? 'System running' : s === 'mid' ? 'Untangling…' : 'System tangled';
      statusBtn.classList.toggle('is-ok', s === 'ok');
    }

    const bez = (a, b, p) => {
      const mx = (a.x + b.x) / 2, q = 1 - p;
      return {
        x: q * q * q * a.x + 3 * q * q * p * mx + 3 * q * p * p * mx + p * p * p * b.x,
        y: q * q * q * a.y + 3 * q * q * p * a.y + 3 * q * p * p * b.y + p * p * p * b.y
      };
    };

    function draw(dt, now) {
      const time = now / 1000;
      order = lerp(order, target, 1 - Math.exp(-dt * (target ? 1.5 : 4)));
      setState(order > .93 ? 'ok' : order > .12 && target ? 'mid' : 'bad');

      const top = hero.getBoundingClientRect().top;
      const place = (n, r, k) => {
        const dist = Math.hypot(S.px - n.x, S.py - top - n.y);
        const want = clamp(order - clamp(1 - dist / r) * k);
        n.t = lerp(n.t, want, 1 - Math.exp(-dt * 5));
        const e = ease(n.t), a = n.amp || 30;
        n.x = lerp(n.cx + Math.sin(time * n.sp + n.ph) * a, n.ox, e);
        n.y = lerp(n.cy + Math.cos(time * n.sp * .8 + n.ph * 1.7) * a, n.oy, e);
        return e;
      };

      ctx.clearRect(0, 0, W, H);

      for (const p of dust) {
        const e = place(p, 120, .8);
        ctx.fillStyle = `rgba(${PAPER},${(.1 + e * .12).toFixed(3)})`;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }

      const es = nodes.map(n => place(n, 190, 1));

      ctx.lineWidth = 1;
      for (const [a, b] of edgesC) {
        const al = (1 - Math.max(es[a], es[b])) * .34;
        if (al < .01) continue;
        ctx.strokeStyle = `rgba(${SIGNAL},${al.toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
      }
      for (const [a, b] of edgesO) {
        const al = Math.min(es[a], es[b]) * .3;
        if (al < .01) continue;
        const A = nodes[a], B = nodes[b], mx = (A.x + B.x) / 2;
        ctx.strokeStyle = `rgba(${PAPER},${al.toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.bezierCurveTo(mx, A.y, mx, B.y, B.x, B.y); ctx.stroke();
      }

      // pulses: work moving through the system on its own
      if (order > .9 && !RM) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = rnd(.18, .5);
          const starts = nodes.map((n, i) => (n.col === 0 ? i : -1)).filter(i => i >= 0);
          const s = starts[Math.floor(rnd(0, starts.length))];
          if (out[s].length) pulses.push({ e: out[s][Math.floor(rnd(0, out[s].length))], p: 0 });
        }
      } else if (order < .5) pulses.length = 0;

      for (let i = pulses.length - 1; i >= 0; i--) {
        const pu = pulses[i];
        pu.p += dt * 1.5;
        const [a, b] = edgesO[pu.e];
        if (pu.p >= 1) {
          nodes[b].flash = 1;
          if (out[b].length) { pu.e = out[b][Math.floor(rnd(0, out[b].length))]; pu.p = 0; }
          else pulses.splice(i, 1);
          continue;
        }
        const pt = bez(nodes[a], nodes[b], pu.p);
        ctx.fillStyle = `rgba(${SIGNAL},.18)`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 9, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgb(${SIGNAL})`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.6, 0, 6.283); ctx.fill();
      }

      nodes.forEach((n, i) => {
        const e = es[i];
        if (n.flash > .01) {
          ctx.strokeStyle = `rgba(${SIGNAL},${(n.flash * .8).toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(n.x, n.y, 5 + (1 - n.flash) * 16, 0, 6.283); ctx.stroke();
          n.flash *= Math.exp(-dt * 3.2);
        }
        ctx.fillStyle = '#0B0B0D';
        ctx.beginPath(); ctx.arc(n.x, n.y, 5.5, 0, 6.283); ctx.fill();
        ctx.strokeStyle = `rgba(${PAPER},${(.35 + e * .55).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 4.5, 0, 6.283); ctx.stroke();
        ctx.fillStyle = e > .5 ? `rgba(${PAPER},${e.toFixed(3)})` : `rgba(${SIGNAL},${(1 - e).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.8, 0, 6.283); ctx.fill();
      });
    }

    build();
    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 150); }, { passive: true });

    if (RM) {
      order = target = 1;
      nodes.concat(dust).forEach(n => { n.t = 1; });
      draw(0, 0); draw(0, 0);
      setState('ok');
      return;
    }

    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
    tasks.push((dt, now) => {
      if (!visible) return;
      draw(dt, now);
      hero.style.setProperty('--hp', clamp(S.y / (S.vh * .9)).toFixed(4));
    });

    statusBtn.addEventListener('click', () => {
      target = 0;
      setTimeout(() => { target = 1; }, 1500);
    });

    return () => setTimeout(() => { target = 1; }, 700); // start resolving once the page is revealed
  }

  // ── INIT ───────────────────────────────────────────────
  $$('[data-split]').forEach(split);
  initNav();
  initCursor();
  initMagnetic();
  initTilt();
  initMarquee();
  initProgress();
  initLayers();
  initFaq();
  initWord();
  initForm();
  initCalc();
  initDiag();
  const startHero = initHero();
  requestAnimationFrame(frame);

  boot(() => {
    initReveals();
    initCounts();
    initFlow();
    if (startHero) startHero();
  });
})();
