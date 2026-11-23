'use strict';
/* =====================================================================
   SİNYAL — Boolean motoru (U2–U4 için ortak):
   ifade ayrıştırıcı, doğruluk tablosu, maliyet (L/G/GN),
   Quine-McCluskey ile prime implicant + minimum örtü,
   doğruluk tablosu ve K-map widget'ları, ifade cevaplı soru şablonu.
   Değişken sırası: vars[0] = MSB (A,B,C,D → m_i'nin indeksi ABCD).
   ===================================================================== */
const Bool = (() => {
  /* ---------- Ayrıştırıcı ----------
     NOT: x'  ~x  !x   AND: xy  x·y  x.y  x*y  x&y   OR: x+y  x|y   XOR: x^y  x⊕y   sabitler 0 1 */
  function tokenize(s) {
    const out = [];
    for (const ch of String(s)) {
      if (/\s/.test(ch)) continue;
      if (/[A-Za-z]/.test(ch)) out.push({ t: 'v', c: ch });
      else if (ch === '0' || ch === '1') out.push({ t: 'k', v: +ch });
      else if ("'’`´′".includes(ch)) out.push({ t: "'" });
      else if ('~!¬'.includes(ch)) out.push({ t: '~' });
      else if ('+|∨'.includes(ch)) out.push({ t: '+' });
      else if ('.*·&∧⋅'.includes(ch)) out.push({ t: '.' });
      else if ('^⊕'.includes(ch)) out.push({ t: '^' });
      else if ('([{'.includes(ch)) out.push({ t: '(' });
      else if (')]}'.includes(ch)) out.push({ t: ')' });
      else throw new Error(`Tanınmayan karakter: "${ch}"`);
    }
    return out;
  }
  function parse(str, vars) {
    const V = [...vars].map(c => c.toLowerCase());
    const toks = tokenize(str);
    if (!toks.length) throw new Error('Boş ifade');
    let p = 0;
    const peek = () => toks[p], eat = t => { if (!toks[p] || toks[p].t !== t) throw new Error(t === ')' ? 'Kapanmayan parantez var' : 'İfade eksik'); return toks[p++]; };
    function expr() { const a = [xor()]; while (peek() && peek().t === '+') { p++; a.push(xor()); } return a.length > 1 ? { t: 'or', a } : a[0]; }
    function xor() { const a = [term()]; while (peek() && peek().t === '^') { p++; a.push(term()); } return a.length > 1 ? { t: 'xor', a } : a[0]; }
    function term() {
      const a = [factor()];
      for (;;) {
        const k = peek(); if (!k) break;
        if (k.t === '.') { p++; a.push(factor()); }
        else if (k.t === 'v' || k.t === 'k' || k.t === '(' || k.t === '~') a.push(factor());
        else break;
      }
      return a.length > 1 ? { t: 'and', a } : a[0];
    }
    function factor() {
      const k = peek();
      if (!k) throw new Error('İfade yarım kaldı');
      if (k.t === '~') { p++; return { t: 'not', a: factor() }; }
      let n = primary();
      while (peek() && peek().t === "'") { p++; n = { t: 'not', a: n }; }
      return n;
    }
    function primary() {
      const k = toks[p++];
      if (!k) throw new Error('İfade yarım kaldı');
      if (k.t === 'v') {
        const i = V.indexOf(k.c.toLowerCase());
        if (i < 0) throw new Error(`Bilinmeyen değişken "${k.c}". Kullanılabilir: ${[...vars].join(', ')}`);
        return { t: 'var', i };
      }
      if (k.t === 'k') return { t: 'k', v: k.v };
      if (k.t === '(') { const e = expr(); eat(')'); return { t: 'par', a: e }; }
      if (k.t === ')') throw new Error('Fazladan ")" var');
      throw new Error(`Burada "${k.t === "'" ? "'" : k.t}" beklenmiyordu`);
    }
    const e = expr();
    if (p < toks.length) throw new Error(toks[p].t === ')' ? 'Fazladan ")" var' : 'İfade beklenmedik yerde bitti');
    return e;
  }
  const unpar = n => { while (n.t === 'par') n = n.a; return n; };
  function ev(n, x, nv) {
    switch (n.t) {
      case 'var': return (x >> (nv - 1 - n.i)) & 1;
      case 'k': return n.v;
      case 'par': return ev(n.a, x, nv);
      case 'not': return 1 - ev(n.a, x, nv);
      case 'and': return n.a.every(c => ev(c, x, nv)) ? 1 : 0;
      case 'or': return n.a.some(c => ev(c, x, nv)) ? 1 : 0;
      case 'xor': return n.a.reduce((s, c) => s ^ ev(c, x, nv), 0);
    }
  }
  /** doğruluk tablosu: dizi [f(0), f(1), …] */
  const ttOf = (ast, nv) => Array.from({ length: 2 ** nv }, (_, x) => ev(ast, x, nv));
  const tt = (str, vars) => ttOf(parse(str, vars), vars.length);
  const onesOf = t => t.map((v, i) => v === 1 ? i : -1).filter(i => i >= 0);
  const countLits = n => n.t === 'var' ? 1 : n.t === 'k' ? 0 : n.t === 'par' || n.t === 'not' ? countLits(n.a) : n.a.reduce((s, c) => s + countLits(c), 0);
  /** literal mi? (x veya x') */
  const isLit = n => { n = unpar(n); return n.t === 'var' || (n.t === 'not' && unpar(n.a).t === 'var'); };
  const litOf = n => { n = unpar(n); return n.t === 'var' ? { i: n.i, neg: false } : { i: unpar(n.a).i, neg: true }; };
  /** SOP ise terim listesi (her terim literal listesi), değilse null */
  function sopTerms(ast) {
    ast = unpar(ast);
    if (ast.t === 'k') return ast.v ? [[]] : [];
    const ts = ast.t === 'or' ? ast.a.map(unpar) : [ast];
    const out = [];
    for (const t of ts) {
      if (t.t === 'k') { if (t.v) out.push([]); continue; }
      if (isLit(t)) out.push([litOf(t)]);
      else if (t.t === 'and' && t.a.every(isLit)) out.push(t.a.map(litOf));
      else return null;
    }
    return out;
  }
  /** POS ise toplam-terim listesi, değilse null */
  function posTerms(ast) {
    ast = unpar(ast);
    if (ast.t === 'k') return ast.v ? [] : [[]];
    const ts = ast.t === 'and' ? ast.a.map(unpar) : [ast];
    const out = [];
    for (const t of ts) {
      if (t.t === 'k') { if (!t.v) out.push([]); continue; }
      if (isLit(t)) out.push([litOf(t)]);
      else if (t.t === 'or' && t.a.every(isLit)) out.push(t.a.map(litOf));
      else return null;
    }
    return out;
  }
  /** iki seviyeli (SOP/POS) maliyet, slayt 3–6 (Lecture 4–5) */
  function cost(terms) {
    const L = terms.reduce((s, t) => s + t.length, 0);
    const multi = terms.filter(t => t.length > 1).length;
    const G = terms.length > 1 ? L + multi : L;          // tek terimde dış kapı yok
    const negs = new Set(); terms.forEach(t => t.forEach(l => l.neg && negs.add(l.i)));
    return { L, G, GN: G + negs.size };
  }

  /* ---------- Formatlama ---------- */
  const PREC = { or: 1, xor: 2, and: 3, not: 4, var: 5, k: 5, par: 5 };
  function fmt(n, vars, parentPrec = 0) {
    let s;
    switch (n.t) {
      case 'var': return vars[n.i];
      case 'k': return String(n.v);
      case 'par': return fmt(n.a, vars, parentPrec);
      case 'not': { const inner = unpar(n.a); const b = fmt(inner, vars, 4); return (PREC[inner.t] >= 4 && inner.t !== 'not' ? b : `(${fmt(inner, vars)})`) + "'"; }
      case 'and': s = n.a.map(c => fmt(c, vars, 3)).join(''); break;
      case 'or': s = n.a.map(c => fmt(c, vars, 1)).join(' + '); break;
      case 'xor': s = n.a.map(c => fmt(c, vars, 2)).join(' ⊕ '); break;
    }
    return PREC[n.t] < parentPrec ? `(${s})` : s;
  }
  /** dual: + ↔ ·, 0 ↔ 1 (literaller aynı kalır) */
  function dual(n) {
    switch (n.t) {
      case 'var': return n;
      case 'k': return { t: 'k', v: 1 - n.v };
      case 'par': return { t: 'par', a: dual(n.a) };
      case 'not': return { t: 'not', a: dual(n.a) };
      case 'and': return { t: 'or', a: n.a.map(dual) };
      case 'or': return { t: 'and', a: n.a.map(dual) };
      case 'xor': throw new Error('xor dual yok');
    }
  }

  /* ---------- Küpler (implicant): {v: değer bitleri, d: tire maskesi} ---------- */
  const pop = x => { let c = 0; for (; x; x &= x - 1) c++; return c; };
  const cubeLits = (c, n) => n - pop(c.d);
  const cubeHas = (c, m) => (m & ~c.d) === c.v;
  const cubeMins = (c, n) => Array.from({ length: 2 ** n }, (_, m) => m).filter(m => cubeHas(c, m));
  /** SOP çarpım terimi: 1 → x, 0 → x' */
  function cubeStr(c, vars) {
    const n = vars.length; let s = '';
    for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); if (c.d & b) continue; s += vars[k] + (c.v & b ? '' : "'"); }
    return s || '1';
  }
  /** POS toplam terimi (0'ların küpünden): 0 → x, 1 → x' */
  function cubeSumStr(c, vars) {
    const n = vars.length, a = [];
    for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); if (c.d & b) continue; a.push(vars[k] + (c.v & b ? "'" : '')); }
    return a.length ? (a.length > 1 ? `(${a.join(' + ')})` : a[0]) : '0';
  }
  /** desen: 1, 0, - (QM tablosu gibi) */
  function cubePat(c, n) { let s = ''; for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); s += c.d & b ? '-' : c.v & b ? '1' : '0'; } return s; }
  const cubeTerms = (cs, n) => cs.map(c => { const t = []; for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); if (!(c.d & b)) t.push({ i: k, neg: !(c.v & b) }); } return t; });

  /** Quine-McCluskey 1. faz: tüm prime implicant'lar */
  function primes(ones, dc, n) {
    let cur = [...new Set([...ones, ...dc])].map(m => ({ v: m, d: 0 }));
    const out = [];
    while (cur.length) {
      const used = new Set(), next = new Map();
      for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
        const a = cur[i], b = cur[j];
        if (a.d !== b.d) continue;
        const diff = a.v ^ b.v;
        if (pop(diff) !== 1) continue;
        used.add(i); used.add(j);
        const c = { v: a.v & ~diff, d: a.d | diff };
        next.set(c.v + ':' + c.d, c);
      }
      cur.forEach((c, i) => { if (!used.has(i)) out.push(c); });
      cur = [...next.values()];
    }
    // sadece don't care içeren primeler gereksiz
    return out.filter(c => ones.some(m => cubeHas(c, m)));
  }
  /** essential prime implicant'lar */
  function essentials(P, ones) {
    const E = new Set();
    ones.forEach(m => { const cov = P.filter(c => cubeHas(c, m)); if (cov.length === 1) E.add(cov[0]); });
    return P.filter(c => E.has(c));
  }
  /** minimum maliyetli örtü (önce G, sonra L) — dal-sınır */
  function minCover(ones, dc, n) {
    if (!ones.length) return { terms: [], cost: { L: 0, G: 0, GN: 0 }, primes: [], ess: [] };
    const P = primes(ones, dc, n), ess = essentials(P, ones);
    const score = cs => { const k = cost(cubeTerms(cs, n)); return k.G * 100 + k.L; };
    let best = null, bestS = Infinity;
    const rec = (chosen, left) => {
      if (score(chosen) >= bestS) return;
      if (!left.length) { best = chosen.slice(); bestS = score(chosen); return; }
      const m = left.reduce((a, b) => (P.filter(c => cubeHas(c, a)).length <= P.filter(c => cubeHas(c, b)).length ? a : b));
      P.filter(c => cubeHas(c, m) && !chosen.includes(c))
        .sort((a, b) => pop(b.d) - pop(a.d))
        .forEach(c => rec([...chosen, c], left.filter(x => !cubeHas(c, x))));
    };
    rec(ess.slice(), ones.filter(m => !ess.some(c => cubeHas(c, m))));
    best.sort((a, b) => pop(b.d) - pop(a.d) || a.v - b.v);
    return { terms: best, cost: cost(cubeTerms(best, n)), primes: P, ess };
  }
  /** minimum SOP / POS metin olarak */
  function minSOP(ones, dc, vars) {
    const r = minCover(ones, dc, vars.length);
    r.str = r.terms.length ? r.terms.map(c => cubeStr(c, vars)).join(' + ') : '0';
    return r;
  }
  function minPOS(ones, dc, vars) {
    const N = 2 ** vars.length, zeros = [];
    for (let m = 0; m < N; m++) if (!ones.includes(m) && !dc.includes(m)) zeros.push(m);
    const r = minCover(zeros, dc, vars.length);
    r.str = r.terms.length ? r.terms.map(c => cubeSumStr(c, vars)).join('') : '1';
    if (r.terms.length === 1) r.str = r.str.replace(/^\((.*)\)$/, '$1');
    return r;
  }
  const sopOfMins = (ms, vars) => ms.length ? ms.map(m => cubeStr({ v: m, d: 0 }, vars)).join(' + ') : '0';
  const minterm = (m, vars) => cubeStr({ v: m, d: 0 }, vars);
  const maxterm = (m, vars) => cubeSumStr({ v: m, d: 0 }, vars);

  /* ---------- K-map yerleşimi (Gray sırası) ---------- */
  const G2 = [0, 1, 3, 2];
  function kmapLayout(n) {
    if (n === 2) return { rows: [0, 1], cols: [0, 1], rb: 1, cb: 1, idx: (r, c) => r * 2 + c };
    if (n === 3) return { rows: [0, 1], cols: G2, rb: 1, cb: 2, idx: (r, c) => r * 4 + c };
    return { rows: G2, cols: G2, rb: 2, cb: 2, idx: (r, c) => r * 4 + c };
  }
  const GROUPC = ['#3dff8e', '#6cc8ff', '#ffbf3c', '#ff7ad9', '#b48cff', '#ff8a5c', '#9effc4'];
  /** K-map: vals[m] ∈ 0/1/'x'; editable ise tıklayınca 0→1(→x)→0 döner */
  function kmap(host, vars, { vals, editable = false, allowX = false, groups = [], onChange, showIdx = true } = {}) {
    const n = vars.length, L = kmapLayout(n);
    let v = vals ? vals.slice() : Array(2 ** n).fill(0);
    const rv = [...vars].slice(0, L.rb), cv = [...vars].slice(L.rb);
    const draw = () => {
      const memb = {};
      groups.forEach((g, gi) => cubeMins(g, n).forEach(m => (memb[m] = memb[m] || []).push(GROUPC[gi % GROUPC.length])));
      host.innerHTML = `<table class="kmap ${editable ? 'edit' : ''}"><tr><th class="corner"><span class="rv">${rv.join('')}</span><span class="cv">${cv.join('')}</span></th>
        ${L.cols.map(c => `<th>${bin(c, L.cb)}</th>`).join('')}</tr>
        ${L.rows.map(r => `<tr><th>${bin(r, L.rb)}</th>${L.cols.map(c => {
          const m = L.idx(r, c), val = v[m], sh = (memb[m] || []).map((col, k) => `inset 0 0 0 ${3 + k * 3}px ${col}`).join(',');
          return `<td data-m="${m}" class="v${val}" style="${sh ? `box-shadow:${sh}` : ''}"><b>${val === 0 && !editable ? '' : val === 'x' ? 'x' : val}</b>${showIdx ? `<i>${m}</i>` : ''}</td>`;
        }).join('')}</tr>`).join('')}</table>`;
      if (editable) $$('td', host).forEach(td => td.onclick = () => {
        const m = +td.dataset.m;
        v[m] = v[m] === 0 ? 1 : v[m] === 1 ? (allowX ? 'x' : 0) : 0;
        Sound.tick(); draw(); onChange && onChange(v.slice());
      });
    };
    draw();
    return { get: () => v.slice(), set(nv) { v = nv.slice(); draw(); }, groups(gs) { groups = gs; draw(); } };
  }

  /** doğruluk tablosu; outs: { ad: dizi } salt-okunur sütunlar; edit: düzenlenebilir sütunun adı */
  function truthTable(host, vars, { cols = {}, edit = null, allowX = false, onChange, idx = true } = {}) {
    const n = vars.length, N = 2 ** n;
    let e = Array(N).fill(null);
    const draw = () => {
      host.innerHTML = `<table class="t tt"><tr>${idx ? '<th class="dim">i</th>' : ''}${[...vars].map(x => `<th>${x}</th>`).join('')}${Object.keys(cols).map(k => `<th>${k}</th>`).join('')}${edit ? `<th class="edcol">${edit}</th>` : ''}</tr>
        ${Array.from({ length: N }, (_, m) => `<tr>${idx ? `<td class="dim">${m}</td>` : ''}${bin(m, n).split('').map(b => `<td>${b}</td>`).join('')}${Object.values(cols).map(a => `<td class="o${a[m]}">${a[m]}</td>`).join('')}${edit ? `<td class="ed ${e[m] === null ? 'empty' : 'o' + e[m]}" data-m="${m}">${e[m] ?? '?'}</td>` : ''}</tr>`).join('')}</table>`;
      if (edit) $$('td.ed', host).forEach(td => td.onclick = () => {
        const m = +td.dataset.m;
        e[m] = e[m] === null ? 1 : e[m] === 1 ? 0 : e[m] === 0 ? (allowX ? 'x' : 1) : 1;
        Sound.tick(); draw(); onChange && onChange(e.slice());
      });
    };
    draw();
    return { get: () => e.slice(), set(a) { e = a.slice(); draw(); } };
  }

  /** sayı listesi "1, 4 7" → sıralı benzersiz dizi; hatalıysa null */
  function parseList(s) {
    const parts = String(s).replace(/[()mMΣΠ]/g, ' ').split(/[\s,;.]+/).filter(Boolean);
    if (!parts.length || !parts.every(p => /^\d+$/.test(p))) return null;
    return [...new Set(parts.map(Number))].sort((a, b) => a - b);
  }
  const sameList = (a, b) => !!a && a.length === b.length && a.every((x, i) => x === b[i]);

  /* =====================================================================
     İFADE CEVAPLI SORU
     check(info) → { ok, msg }  info: { ast, tt, lits, sop, pos, str }
     Yazım hatası (ayrıştırılamayan ifade) yanlış sayılmaz: sadece uyarı.
     ===================================================================== */
  function exprTask({ q, qText, vars, check, answer, ans, why, hint, placeholder = "ör. AB' + C", xp }) {
    return {
      q: qText || stripTags(q), xp,
      render(box, done) {
        box.innerHTML = `<div class="q">${q}</div>
          <div class="row"><input class="ans expr" data-keys="${esc([...vars].join('') + "'+()01")}" placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false">
          <button class="btn primary chk">Kontrol ⏎</button>${hint ? '<button class="btn ghost hintb">💡 İpucu</button>' : ''}</div>
          <div class="exprprev"></div><div class="hintbox"></div>
          <div class="note">Yazım: tümleyen <b class="mono">A'</b> · AND yan yana <b class="mono">AB</b> · OR <b class="mono">+</b> · parantez serbest. Değişkenler: <b class="mono">${[...vars].join(', ')}</b></div>`;
        const inp = $('input', box), pv = $('.exprprev', box);
        let hinted = false;
        setTimeout(() => inp.focus(), 30);
        const info = v => {
          const ast = parse(v, vars);
          return { ast, str: v, tt: ttOf(ast, vars.length), lits: countLits(ast), sop: sopTerms(ast), pos: posTerms(ast) };
        };
        inp.addEventListener('input', () => {
          const v = inp.value.trim(); inp.classList.remove('bad');
          if (!v) { pv.textContent = ''; return; }
          try { const a = parse(v, vars); pv.innerHTML = `<span class="dim">okunan:</span> <span class="mono">${esc(fmt(a, vars))}</span> <span class="dim">· ${countLits(a)} literal</span>`; }
          catch (e) { pv.innerHTML = `<span class="dim">…${esc(e.message)}</span>`; }
        });
        const submit = () => {
          const v = inp.value.trim(); if (!v) return;
          let I;
          try { I = info(v); } catch (e) { pv.innerHTML = `<span style="color:var(--amber)">⚠ ${esc(e.message)}. Düzeltip tekrar gönder (yanlış sayılmadı).</span>`; inp.classList.add('bad'); return; }
          const r = check(I);
          inp.classList.add(r.ok ? 'good' : 'bad');
          done(r.ok, { your: v, answer: `<span class="mono">${answer}</span>`, why: (r.msg ? `<b>${r.msg}</b><br>` : '') + (why || ''), hinted });
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); } });
        $('.chk', box).onclick = submit;
        if (hint) $('.hintb', box).onclick = () => { hinted = true; $('.hintbox', box).innerHTML = '💡 ' + hint; inp.focus(); };
        box._auto = () => { inp.value = ans ?? answer; submit(); };
      },
    };
  }
  /** hedef doğruluk tablosu (dc: 'x' serbest) ile karşılaştır */
  const ttMatch = (u, target) => target.every((t, i) => t === 'x' || u[i] === t);
  const diffRows = (u, target, vars) => target.map((t, i) => t !== 'x' && u[i] !== t ? i : -1).filter(i => i >= 0)
    .slice(0, 3).map(i => `${[...vars].map((x, k) => `${x}=${bin(i, vars.length)[k]}`).join(' ')} → senin: ${u[i]}, olmalı: ${target[i]}`).join('<br>');
  /** yaygın kontrol: eşdeğer mi? + form + literal/maliyet sınırı */
  function checker(target, vars, { form = null, maxLits = null, maxG = null, minNote = '' } = {}) {
    return I => {
      if (!ttMatch(I.tt, target)) return { ok: false, msg: `Eşdeğer değil. Farklı çıkan satır(lar):<br>${diffRows(I.tt, target, vars)}` };
      if (form === 'sop' && !I.sop) return { ok: false, msg: 'Fonksiyon doğru ama SOP (çarpımların toplamı) formunda değil.' };
      if (form === 'pos' && !I.pos) return { ok: false, msg: 'Fonksiyon doğru ama POS (toplamların çarpımı) formunda değil.' };
      if (maxLits != null && I.lits > maxLits) return { ok: false, msg: `Eşdeğer ✔ ama yeterince sade değil: ${I.lits} literal, en az ${maxLits} olabilir.${minNote}` };
      if (maxG != null) {
        const terms = form === 'pos' ? I.pos : I.sop, c = cost(terms);
        if (c.G > maxG) return { ok: false, msg: `Eşdeğer ✔ ama minimum değil: G = ${c.G}, minimum G = ${maxG}. Daha büyük gruplar / daha az terim mümkün.` };
      }
      return { ok: true };
    };
  }

  /** stepTask için ifade alanı (eşdeğerlik ile kontrol) */
  const exprField = (target, vars, show, w = 12) => ({ answer: show, show, w, keys: [...vars].join('') + "'+()01", check: u => { try { return ttMatch(tt(u, vars), target); } catch (e) { return false; } } });

  return { parse, tt, ttOf, onesOf, fmt, dual, countLits, sopTerms, posTerms, cost, cubeStr, cubeSumStr, cubePat, cubeHas, cubeMins, cubeLits, cubeTerms,
    primes, essentials, minCover, minSOP, minPOS, sopOfMins, minterm, maxterm, kmap, kmapLayout, truthTable, parseList, sameList,
    exprTask, checker, ttMatch, exprField, pop, GROUPC };
})();

/** Doğruluk tablosu / K-map doldurma sorusu (tıklamalı) */
function fillTask({ q, qText, vars, target, mode = 'tt', cols = {}, colName = 'F', allowX = false, why, answerHtml, xp }) {
  return {
    q: qText || stripTags(q), xp,
    render(box, done) {
      box.innerHTML = `<div class="q">${q}</div><div class="sub">${mode === 'tt' ? `<b>${colName}</b> sütunundaki hücrelere dokunarak 0/1 seç.` : 'Hücrelere dokunarak 1 yap (tekrar dokununca 0).'}${allowX ? ' Üçüncü dokunuş: x (don\'t care).' : ''}</div>
        <div class="fillw"></div><div class="row"><button class="btn primary chk">Kontrol</button></div>`;
      const w = mode === 'tt' ? Bool.truthTable($('.fillw', box), vars, { cols, edit: colName, allowX })
        : Bool.kmap($('.fillw', box), vars, { editable: true, allowX });
      const fin = () => {
        const u = w.get().map(x => x === null ? 0 : x);
        if (mode === 'tt' && w.get().some(x => x === null)) { UI.toast('Önce bütün satırları doldur'); return; }
        const ok = u.every((x, i) => x === target[i]);
        const wrong = u.map((x, i) => x !== target[i] ? i : -1).filter(i => i >= 0);
        done(ok, { your: mode === 'tt' ? u.join('') : `1 olanlar: ${Bool.onesOf(u).join(', ') || '—'}`, answer: answerHtml || target.join(''), why: (wrong.length ? `Hatalı satır/hücre indeksleri: <b>${wrong.join(', ')}</b><br>` : '') + (why || '') });
      };
      $('.chk', box).onclick = fin;
      box._auto = () => { w.set(target); fin(); };
    },
  };
}

/* ---------- Ortak yardımcılar (U2–U4) ---------- */
/** rastgele ifade üretici (n değişken) — okunaklı, 2 seviyeli + biraz iç içe */
function randExpr(vars, { terms = [2, 3], lits = [1, 3], nest = .3 } = {}) {
  const V = [...vars];
  const lit = () => pick(V) + (Math.random() < .45 ? "'" : '');
  const prod = () => { const k = rnd(lits[0], Math.min(lits[1], V.length)); return shuffle(V).slice(0, k).sort((a, b) => V.indexOf(a) - V.indexOf(b)).map(v => v + (Math.random() < .45 ? "'" : '')).join(''); };
  const parts = Array.from({ length: rnd(terms[0], terms[1]) }, () => {
    if (Math.random() < nest) {
      const a = lit(), s = `(${prod()} + ${lit()})`;
      return Math.random() < .3 ? `${s}'` : `${a.replace(/'/, '') === a ? a : a}${s}`;
    }
    return prod();
  });
  return parts.join(' + ');
}
const E = s => `<span class="mono">${s}</span>`;
const Σ = (ms, vars) => `F(${[...vars].join(',')}) = Σm(${ms.join(', ')})`;
const Π = (ms, vars) => `F(${[...vars].join(',')}) = ΠM(${ms.join(', ')})`;
/** rastgele fonksiyon: 1'ler (ve isteğe bağlı don't care) */
function randFn(n, { pOne = .45, pX = 0, minOnes = 2 } = {}) {
  for (;;) {
    const N = 2 ** n, ones = [], dc = [];
    for (let m = 0; m < N; m++) { const r = Math.random(); if (r < pX) dc.push(m); else if (r < pX + pOne) ones.push(m); }
    if (ones.length >= minOnes && ones.length + dc.length < N) return { ones, dc };
  }
}
const ttFrom = (ones, dc, n) => Array.from({ length: 2 ** n }, (_, m) => ones.includes(m) ? 1 : dc.includes(m) ? 'x' : 0);
