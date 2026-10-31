'use strict';
/* =====================================================================
   SİNYAL — çekirdek: yardımcılar, kayıt, Leitner tekrar sistemi,
   soru (task) şablonları.  Bölge dosyaları (r1.js, …) bunları kullanır.
   ===================================================================== */

/* ---------- Genel yardımcılar ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stripTags = s => String(s).replace(/<sub>(.*?)<\/sub>/g, '_$1').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const DIG = '0123456789ABCDEF';
/** (değer)taban gösterimi */
const B = (v, b) => `<span class="mono">(${v})<sub>${b}</sub></span>`;
/** üst çizgi (complement) */
const ov = s => `<span class="ov">${s}</span>`;
const bin = (n, w = 0) => n.toString(2).padStart(w, '0');
const randBits = n => Array.from({ length: n }, () => rnd(0, 1)).join('');

/** Sayı cevaplarını karşılaştırmak için normalleştir: boşluk, baştaki/sondaki gereksiz 0'lar, virgül→nokta */
function normNum(s) {
  s = String(s).toUpperCase().replace(/[\s_|]/g, '').replace(',', '.');
  let [i, f = ''] = s.split('.');
  i = i.replace(/^0+(?=.)/, '');
  if (i === '') i = '0';
  f = f.replace(/0+$/, '');
  return f ? `${i}.${f}` : i;
}
const sameNum = (a, b) => normNum(a) === normNum(b);
/** Onluk ondalıklı sayı eşitliği */
function decEq(user, val) {
  const x = parseFloat(String(user).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(x) && Math.abs(x - val) < 1e-9;
}
/** Sabit genişlikli bit dizisi (BCD, Gray…): boşluklar yok sayılır, baştaki eksik 0'lar kabul */
function bitsEq(user, ans) {
  const u = String(user).replace(/[\s_|]/g, ''), a = String(ans).replace(/[\s_|]/g, '');
  return /^[01]+$/.test(u) && u.length <= a.length && u.padStart(a.length, '0') === a;
}

/* ---------- Ses (WebAudio bip) ---------- */
const Sound = {
  ctx: null,
  beep(freq, dur = .08, type = 'square', vol = .035, delay = 0) {
    if (!Store.s.sound) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume(); // iOS: ilk dokunuşta uyandır
      const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* ses yoksa sorun değil */ }
  },
  ok() { this.beep(880, .07); this.beep(1320, .1, 'square', .035, .07); },
  bad() { this.beep(170, .22, 'sawtooth', .03); },
  tick() { this.beep(1600, .025, 'square', .02); },
  win() { [523, 659, 784, 1046].forEach((f, i) => this.beep(f, .14, 'square', .035, i * .11)); },
};

/* ---------- Kalıcı durum (localStorage) ---------- */
const Store = {
  KEY: 'sinyal_eef205e_v1',
  s: null,
  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { }
    this.s = Object.assign({ xp: 0, done: {}, lessons: {}, skills: {}, mistakes: [], boss: {}, sound: true, ok: 0, bad: 0, intro: false }, raw || {});
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.s)); } catch (e) { } },
  reset() { localStorage.removeItem(this.KEY); this.load(); },
};
Store.load();

/* ---------- Leitner tekrar kutuları ----------
   Kutu 1: yanlış → hemen tekrar.  Doğru bildikçe kutu artar, aralık uzar. */
const Leitner = {
  INT: { 1: 0, 2: 3 * 60e3, 3: 30 * 60e3, 4: 24 * 3600e3, 5: 3 * 24 * 3600e3 },
  get(id) { return Store.s.skills[id]; },
  record(id, ok) {
    const s = Store.s.skills[id] || (Store.s.skills[id] = { box: 0, due: 0, ok: 0, bad: 0 });
    if (ok) { s.box = Math.min(5, s.box + 1); s.ok++; } else { s.box = 1; s.bad++; }
    s.due = Date.now() + this.INT[s.box];
    Store.save();
  },
  due() {
    const now = Date.now();
    return Object.entries(Store.s.skills)
      .filter(([id, v]) => v.due <= now && Registry.skills[id])
      .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
      .map(([id]) => id);
  },
  box(id) { return (Store.s.skills[id] || {}).box || 0; },
};

/* ---------- Kayıt: bölge → istasyon → beceri ---------- */
const Registry = {
  regions: [], stations: {}, skills: {},
  addRegion(r) {
    this.regions.push(r);
    r.stations.forEach((st, i) => {
      st.region = r; st.index = i; this.stations[st.id] = st;
      st.skills.forEach(sk => { sk.station = st; this.skills[sk.id] = sk; });
    });
  },
  gen(skillId) {
    const sk = this.skills[skillId];
    const t = sk.gen();
    t.skill = skillId;
    t.ref = t.ref || sk.ref || sk.station.ref;
    return t;
  },
};

/* ---------- XP ve seviye ---------- */
const LEVELS = [[0, 'Stajyer'], [120, 'Lehimci'], [350, 'Teknisyen'], [700, 'Devre Çırağı'], [1150, 'Kapı Bekçisi'],
  [1700, 'Harita Okuyucu'], [2400, 'Lojik Mühendisi'], [3300, 'Sinyal Ustası']];
function levelInfo(xp) {
  let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
  const cur = LEVELS[i][0], next = LEVELS[i + 1] ? LEVELS[i + 1][0] : null;
  return { lvl: i + 1, name: LEVELS[i][1], cur, next, pct: next ? (xp - cur) / (next - cur) : 1 };
}

/* ---------- Küçük UI yardımcıları ---------- */
const UI = {
  floatXP(n, x, y) {
    const d = document.createElement('div');
    d.className = 'floatxp'; d.textContent = `+${n} XP`;
    d.style.left = (x ?? innerWidth / 2) + 'px'; d.style.top = (y ?? 90) + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 1200);
  },
  toast(msg, ms = 2200) {
    const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = msg;
    document.body.appendChild(d); setTimeout(() => d.remove(), ms);
  },
  modal(html, buttons = [{ label: 'Tamam', primary: true }]) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal panel">${html}<div class="row" style="justify-content:flex-end;margin-top:18px"></div></div>`;
    const row = $('.row:last-child', bg);
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'btn' + (b.primary ? ' primary' : ''); btn.innerHTML = b.label;
      btn.onclick = () => { bg.remove(); b.onClick && b.onClick(); };
      row.appendChild(btn);
    });
    document.body.appendChild(bg);
    return bg;
  },
};
function addXP(n) { Store.s.xp += n; Store.save(); App.refreshHeader(); if (n > 0) UI.floatXP(n); }

/* ---------- Tıklanabilir LED bit panosu ---------- */
function bitBoard(host, n, { value = 0, onChange, weights, labels } = {}) {
  const w = weights || Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
  let bits = Array.from({ length: n }, (_, i) => (value >> (n - 1 - i)) & 1);
  host.innerHTML = `<div class="bitboard">${w.map((wt, i) => `<div class="bitcell"><button class="ledbtn" data-i="${i}" title="tıkla: 0/1"></button><div class="bitval"></div><div class="wt">${labels ? labels[i] : wt}</div></div>`).join('')}</div>`;
  const paint = () => {
    $$('.ledbtn', host).forEach((b, i) => b.classList.toggle('on', !!bits[i]));
    $$('.bitval', host).forEach((d, i) => d.textContent = bits[i]);
  };
  const api = {
    value: () => bits.reduce((a, b) => a * 2 + b, 0),
    bits: () => bits.slice(),
    str: () => bits.join(''),
    set(v) { bits = Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1); paint(); },
  };
  $$('.ledbtn', host).forEach(b => b.onclick = () => {
    bits[+b.dataset.i] ^= 1; paint(); Sound.tick(); onChange && onChange(api.value(), bits.slice());
  });
  paint();
  return api;
}

/* =====================================================================
   SORU ŞABLONLARI
   Her soru: { q: 'kayıt için düz metin', render(box, done) }
   done(ok, { your, answer, why, hinted }) bir kez çağrılır.
   ===================================================================== */

/** Tek kutulu cevap */
function inputTask({ q, qText, answer, answerHtml, check, why, hint, placeholder = '', after = '' }) {
  return {
    q: qText || stripTags(q),
    render(box, done) {
      box.innerHTML = `<div class="q">${q}</div>
        <div class="row"><input class="ans" placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false">${after}
        <button class="btn primary chk">Kontrol ⏎</button>${hint ? '<button class="btn ghost hintb">💡 İpucu</button>' : ''}</div>
        <div class="hintbox"></div>`;
      const inp = $('input', box);
      let hinted = false;
      setTimeout(() => inp.focus(), 30);
      const submit = () => {
        const v = inp.value.trim(); if (!v) return;
        const ok = check ? check(v) : sameNum(v, answer);
        inp.classList.add(ok ? 'good' : 'bad');
        done(ok, { your: v, answer: answerHtml || answer, why, hinted });
      };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); } });
      $('.chk', box).onclick = submit;
      if (hint) $('.hintb', box).onclick = () => { hinted = true; $('.hintbox', box).innerHTML = '💡 ' + hint; inp.focus(); };
    },
  };
}

/** Çoktan seçmeli (multi: birden fazla doğru) */
function choiceTask({ q, qText, options, correct, multi = false, why, mono = false }) {
  const corr = new Set([].concat(correct));
  return {
    q: qText || stripTags(q),
    render(box, done) {
      box.innerHTML = `<div class="q">${q}</div>
        ${multi ? '<div class="sub">Birden fazla doğru olabilir — hepsini seç, sonra Kontrol.</div>' : '<div class="sub">Klavye: 1, 2, 3… ile de seçebilirsin.</div>'}
        <div class="choices ${mono ? 'mono' : ''}">${options.map((o, i) => `<button class="choice" data-i="${i}">${o}</button>`).join('')}</div>
        ${multi ? '<div class="row"><button class="btn primary chk">Kontrol</button></div>' : ''}`;
      const btns = $$('.choice', box);
      let fin = false;
      const finish = sel => {
        if (fin) return; fin = true;
        document.removeEventListener('keydown', key);
        const ok = sel.size === corr.size && [...sel].every(i => corr.has(i));
        btns.forEach((b, i) => { if (corr.has(i)) b.classList.add('right'); else if (sel.has(i)) b.classList.add('wrong'); });
        done(ok, { your: [...sel].map(i => stripTags(options[i])).join(', ') || '—', answer: [...corr].map(i => options[i]).join(', '), why });
      };
      const key = e => {
        if (multi || fin || e.target.tagName === 'INPUT') return;
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < btns.length && !btns[i].disabled) { e.preventDefault(); finish(new Set([i])); }
      };
      if (!multi) { btns.forEach(b => b.onclick = () => finish(new Set([+b.dataset.i]))); document.addEventListener('keydown', key); App.onLeave(() => document.removeEventListener('keydown', key)); }
      else {
        const sel = new Set();
        btns.forEach(b => b.onclick = () => { const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel'); Sound.tick(); });
        $('.chk', box).onclick = () => finish(sel);
      }
    },
  };
}

/** Adım adım makine: her satır sırayla açılır, yanlışta neden gösterilir ve tekrar denenir.
    rows: [{ html: 'metin [[0]] metin [[1]]', fields: [{ answer, accept?, check?, w?, show? }], why, after },
           { html, choice: { options, correct }, why, after }] */
function stepTask({ q, qText, rows, answer, why, xp = 15 }) {
  return {
    q: qText || stripTags(q), xp,
    render(box, done) {
      box.innerHTML = `<div class="q">${q}</div><div class="steps"></div>`;
      const wrap = $('.steps', box);
      let errors = 0, idx = 0;
      const next = () => {
        if (idx >= rows.length) {
          done(errors === 0, { your: errors ? `${errors} adımda hata yapıldı (düzelterek bitirdin)` : 'Tüm adımlar ilk denemede doğru', answer, why, partial: errors > 0 });
          return;
        }
        const r = rows[idx];
        const el = document.createElement('div'); el.className = 'step active';
        const line = r.html.replace(/\[\[(\d+)\]\]/g, (_, k) => {
          const f = r.fields[+k];
          return `<input class="fld" data-k="${k}" style="width:${(f.w || 4) + 2.2}ch" placeholder="${esc(f.ph || '')}" autocomplete="off" spellcheck="false">`;
        });
        el.innerHTML = `<div class="step-n">${idx + 1}</div><div class="step-body">
            <div class="step-line">${line}${r.choice ? '' : ' <button class="btn primary sm chk">✓</button>'}</div>
            ${r.choice ? `<div class="choices small">${r.choice.options.map((o, i) => `<button class="choice" data-i="${i}">${o}</button>`).join('')}</div>` : ''}
            <div class="step-why"></div></div>`;
        wrap.appendChild(el);
        let tries = 0;
        const whyEl = $('.step-why', el);
        const fail = () => {
          if (tries === 0) errors++;
          tries++;
          Sound.bad();
          whyEl.innerHTML = `✘ ${r.why || 'Tekrar dene.'}` + (tries >= 2 && !r.choice ? ' <button class="btn ghost sm reveal">Cevabı göster</button>' : '');
          el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
          const rv = $('.reveal', whyEl);
          if (rv) rv.onclick = () => { $$('.fld', el).forEach(inp => { const f = r.fields[+inp.dataset.k]; inp.value = f.show ?? f.answer; }); check(); };
        };
        const pass = () => {
          el.classList.remove('active'); el.classList.add('done');
          $$('input,button', el).forEach(x => x.disabled = true);
          whyEl.innerHTML = r.after ? `<span class="okmsg">✔ ${r.after}</span>` : '';
          Sound.tick(); idx++; next();
        };
        const check = () => {
          let all = true;
          $$('.fld', el).forEach(inp => {
            const f = r.fields[+inp.dataset.k], v = inp.value.trim();
            const ok = v !== '' && (f.check ? f.check(v) : (f.accept || [f.answer]).some(a => sameNum(a, v)));
            inp.classList.toggle('bad', !ok); inp.classList.toggle('good', ok);
            if (!ok) all = false;
          });
          all ? pass() : fail();
        };
        if (r.choice) {
          $$('.choice', el).forEach(b => b.onclick = () => {
            const i = +b.dataset.i;
            if (i === r.choice.correct) { b.classList.add('right'); pass(); }
            else { b.classList.add('wrong'); b.disabled = true; fail(); }
          });
        } else {
          const fl = $$('.fld', el);
          $('.chk', el).onclick = check;
          fl.forEach((inp, j) => inp.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            e.preventDefault(); e.stopPropagation();
            if (j < fl.length - 1 && !fl[j + 1].value.trim()) fl[j + 1].focus(); else check();
          }));
          setTimeout(() => fl[0] && fl[0].focus(), 30);
        }
      };
      next();
    },
  };
}
