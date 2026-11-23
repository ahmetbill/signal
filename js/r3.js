'use strict';
/* =====================================================================
   BÖLGE U3 — KANONİK KALE  (Lecture 3: minterm, maxterm, Σm, ΠM)
   ===================================================================== */
(() => {
  const R = s => `Lecture 3 · slayt ${s}`;
  /** salt-okunur doğruluk tablosu HTML'i */
  const ttHTML = (vars, t, name = 'F') => `<table class="t tt"><tr><th class="dim">i</th>${[...vars].map(v => `<th>${v}</th>`).join('')}<th>${name}</th></tr>
    ${t.map((f, m) => `<tr><td class="dim">${m}</td>${bin(m, vars.length).split('').map(b => `<td>${b}</td>`).join('')}<td class="o${f}">${f}</td></tr>`).join('')}</table>`;
  const listQ = (u, want) => Bool.sameList(Bool.parseList(u), want);
  const comp = (ms, n) => Array.from({ length: 2 ** n }, (_, i) => i).filter(i => !ms.includes(i));
  const varsOf = n => n === 2 ? pick(['xy', 'AB']) : n === 3 ? pick(['xyz', 'ABC']) : n === 4 ? pick(['ABCD', 'wxyz']) : 'ABCDE';
  /** değişken bazında açıklama: hangi bit hangi literal */
  const explainMin = (m, vars) => [...vars].map((v, k) => `${v}=${bin(m, vars.length)[k]} → ${bin(m, vars.length)[k] === '1' ? v : v + "'"}`).join(', ');
  const explainMax = (m, vars) => [...vars].map((v, k) => `${v}=${bin(m, vars.length)[k]} → ${bin(m, vars.length)[k] === '0' ? v : v + "'"}`).join(', ');

  /* =================================================================
     İSTASYON 1 — Minterm & Maxterm
     ================================================================= */
  const S1 = {
    id: 'r3s1', title: 'Minterm & Maxterm', ref: R('5–12'),
    lesson: [
      {
        t: 'Tanımlar',
        html: `<p>Lecture 2 slayt 5'teki tanımlar burada önem kazanıyor:</p>
          <table class="t"><tr><th>Terim</th><th>Anlamı</th><th>Örnek (A,B,C)</th></tr>
          <tr><td>Literal</td><td>değişken ya da tümleyeni</td><td>A, B'</td></tr>
          <tr><td>Implicant</td><td>literallerin çarpımı (AND)</td><td>AB', BC</td></tr>
          <tr><td><b>Minterm</b></td><td>bütün değişkenleri içeren çarpım</td><td>AB'C</td></tr>
          <tr><td><b>Maxterm</b></td><td>bütün değişkenleri içeren toplam</td><td>(A + B' + C)</td></tr></table>
          <p>n değişken için 2<sup>n</sup> minterm ve 2<sup>n</sup> maxterm vardır (her değişken ya düz ya tümleyenli).</p>
          <div class="rule"><b>Standart sıra:</b> Değişkenler her terimde aynı sırada yazılır (genelde alfabetik). (b + a + c) standart sırada değildir. (a + c) ise b eksik olduğu için maxterm değildir.</div>`,
      },
      {
        t: 'İndeks: hangi değişken tümlenecek?',
        html: `<p>m<sub>i</sub> ve M<sub>i</sub>'deki i indeksini ikili yaz. Her bit, standart sıradaki bir değişkene karşılık gelir.</p>
          <div class="rule"><b>Minterm m<sub>i</sub>:</b> bit 1 → değişken düz, bit 0 → tümleyenli. (m<sub>i</sub> tam olarak i. satırda 1 olur.)<br>
          <b>Maxterm M<sub>i</sub>:</b> bit 0 → değişken düz, bit 1 → tümleyenli. (M<sub>i</sub> tam olarak i. satırda 0 olur.)</div>
          <p>LED'lere dokunarak indeksi değiştir:</p>
          <div class="demo"><div class="bb"></div><div class="calc mo mono" style="font-size:17px"></div></div>
          <p class="note">Slayt 10'un sorusu: X,Y,Z için m<sub>6</sub> = XYZ', M<sub>6</sub> = X' + Y' + Z.</p>`,
        init(el) {
          const out = $('.mo', el), vars = 'XYZ';
          const show = v => { out.innerHTML = `i = ${v} = (${bin(v, 3)})<sub>2</sub><br>m<sub>${v}</sub> = <b>${Bool.minterm(v, vars)}</b> &nbsp;&nbsp; M<sub>${v}</sub> = <b>${Bool.maxterm(v, vars)}</b>`; };
          bitBoard($('.bb', el), 3, { value: 6, onChange: show, labels: ['X', 'Y', 'Z'] }); show(6);
        },
      },
      {
        t: 'm ve M ilişkisi',
        html: `<p>De Morgan ile: <span class="mono">(x'y)' = x + y'</span>. Yani m<sub>1</sub> = x'y ise M<sub>1</sub> = x + y'.</p>
          <div class="rule"><b>M<sub>i</sub> = (m<sub>i</sub>)'</b> ve <b>m<sub>i</sub> = (M<sub>i</sub>)'</b>. Aynı indeksli minterm ve maxterm birbirinin tümleyenidir (slayt 12).</div>
          <table class="t"><tr><th>i</th><th>bit</th><th>m<sub>i</sub></th><th>M<sub>i</sub></th></tr>
          ${[0, 1, 2, 3].map(i => `<tr><td>${i}</td><td>${bin(i, 2)}</td><td>${Bool.minterm(i, 'xy')}</td><td>${Bool.maxterm(i, 'xy')}</td></tr>`).join('')}</table>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Minterm: tüm değişkenlerin <b>çarpımı</b> · Maxterm: tüm değişkenlerin <b>toplamı</b></li>
          <li>m<sub>i</sub>: bit 1 → x, bit 0 → x'</li>
          <li>M<sub>i</sub>: bit 0 → x, bit 1 → x'</li>
          <li>m<sub>i</sub> sadece i. satırda 1 · M<sub>i</sub> sadece i. satırda 0</li>
          <li>M<sub>i</sub> = m<sub>i</sub>'</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r3.mm.def', name: 'Literal / implicant / minterm / maxterm', ref: R('5–8'),
        gen() {
          const vars = 'ABC', V = [...vars], kind = pick(['lit', 'imp', 'min', 'max', 'none']);
          const lits = k => V.filter((_, i) => i < 3).slice(0, 3).sort(() => 0).filter(() => true);
          const L = v => v + (Math.random() < .5 ? "'" : '');
          let s;
          if (kind === 'lit') s = L(pick(V));
          else if (kind === 'imp') s = shuffle(V).slice(0, 2).sort().map(L).join('');
          else if (kind === 'min') s = V.map(L).join('');
          else if (kind === 'max') s = `(${V.map(L).join(' + ')})`;
          else s = Math.random() < .5 ? `(${shuffle(V).slice(0, 2).sort().map(L).join(' + ')})` : `(${[V[1], V[0], V[2]].map(L).join(' + ')})`;
          const O = { lit: 'Literal', imp: 'Implicant (minterm değil)', min: 'Minterm', max: 'Maxterm', none: 'Hiçbiri' };
          const opts = Object.keys(O);
          const W = { lit: 'Tek bir değişken ya da tümleyeni.', imp: 'Literallerin çarpımı ama bütün değişkenleri içermiyor.', min: 'A, B, C\'nin hepsini içeren çarpım.', max: 'A, B, C\'nin hepsini standart sırada içeren toplam.', none: 'Toplam ama ya bir değişken eksik ya da standart sırada (A, B, C) değil → maxterm sayılmaz.' };
          return choiceTask({ q: `Değişkenler A, B, C (standart sıra). ${E(s)} için en doğru ad hangisi?`, options: opts.map(k => O[k]), correct: opts.indexOf(kind), why: W[kind] });
        },
      },
      {
        id: 'r3.mm.m2e', name: 'm<sub>i</sub> → çarpım terimi', ref: R('9–11, 15'),
        gen() {
          const n = pick([3, 3, 4, 5]), vars = varsOf(n), i = rnd(0, 2 ** n - 1), ans = Bool.minterm(i, vars);
          const t = Array.from({ length: 2 ** n }, (_, m) => m === i ? 1 : 0);
          return Bool.exprTask({ q: `F(${[...vars].join(',')}) için <b>m<sub>${i}</sub></b> nedir?`, vars, answer: ans,
            check: I => { const r = Bool.checker(t, vars, { form: 'sop' })(I); return r.ok && I.sop.length !== 1 ? { ok: false, msg: 'Tek bir çarpım terimi olmalı.' } : r; },
            why: `${i} = (${bin(i, n)})<sub>2</sub>. Minterm: 1 → düz, 0 → tümleyenli.<br>${explainMin(i, vars)} → <b>${ans}</b>`, hint: `${i}'yi ${n} bit ikili yaz.` });
        },
      },
      {
        id: 'r3.mm.M2e', name: 'M<sub>i</sub> → toplam terimi', ref: R('9–11, 18'),
        gen() {
          const n = pick([3, 3, 4]), vars = varsOf(n), i = rnd(0, 2 ** n - 1), ans = Bool.maxterm(i, vars);
          const t = Array.from({ length: 2 ** n }, (_, m) => m === i ? 0 : 1);
          return Bool.exprTask({ q: `F(${[...vars].join(',')}) için <b>M<sub>${i}</sub></b> nedir?`, vars, answer: ans,
            check: I => { const r = Bool.checker(t, vars, { form: 'pos' })(I); return r.ok && I.pos.length !== 1 ? { ok: false, msg: 'Tek bir toplam terimi olmalı.' } : r; },
            why: `${i} = (${bin(i, n)})<sub>2</sub>. Maxterm: <b>0 → düz, 1 → tümleyenli</b> (mintermin tersi!).<br>${explainMax(i, vars)} → <b>${ans}</b>`, hint: 'Maxterm kuralı mintermin tersidir.' });
        },
      },
      {
        id: 'r3.mm.e2i', name: 'Terimden indeks bul', ref: R('9–11'),
        gen() {
          const n = pick([3, 4]), vars = varsOf(n), i = rnd(0, 2 ** n - 1), isMax = Math.random() < .45;
          const s = isMax ? Bool.maxterm(i, vars) : Bool.minterm(i, vars);
          return inputTask({ q: `${E(s)} hangi ${isMax ? '<b>maxterm</b> (M<sub>i</sub>)' : '<b>minterm</b> (m<sub>i</sub>)'}? i = ?`, answer: String(i),
            why: `${isMax ? 'Maxterm: düz → 0, tümleyenli → 1' : 'Minterm: düz → 1, tümleyenli → 0'}. Bitler: ${bin(i, n)} → i = <b>${i}</b>`,
            hint: isMax ? 'Maxtermde düz değişken 0 demek.' : 'Mintermde düz değişken 1 demek.' });
        },
      },
      {
        id: 'r3.mm.rel', name: 'm<sub>i</sub> ve M<sub>i</sub> ilişkisi', ref: R(12),
        gen() {
          const i = rnd(0, 7), j = 7 - i;
          const k = pick([0, 1, 2]);
          if (k === 0) {
            const opts = shuffle([`M<sub>${i}</sub>`, `m<sub>${j}</sub>`, `M<sub>${j}</sub>`, `m<sub>${i}</sub>`]);
            return choiceTask({ q: `3 değişkenli bir fonksiyonda <b>(m<sub>${i}</sub>)'</b> neye eşittir?`, options: opts, correct: opts.indexOf(`M<sub>${i}</sub>`), why: `De Morgan: aynı indeksli minterm ve maxterm birbirinin tümleyenidir. (m<sub>i</sub>)' = M<sub>i</sub>.` });
          }
          if (k === 1) return inputTask({ q: `3 değişkenli M<sub>${i}</sub> doğruluk tablosunun kaçıncı satırında (indeks) <b>0</b> olur?`, answer: String(i), why: `M<sub>i</sub> sadece i. satırda 0, diğer bütün satırlarda 1'dir. Cevap: <b>${i}</b>` });
          return inputTask({ q: `3 değişkenli m<sub>${i}</sub> doğruluk tablosunda kaç satırda <b>1</b> olur?`, answer: '1', why: 'Bir minterm sadece kendi indeksindeki tek satırda 1 olur.' });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 2 — Σm · ΠM · Doğruluk Tablosu
     ================================================================= */
  const S2 = {
    id: 'r3s2', title: 'Σm · ΠM · Doğruluk Tablosu', ref: R('13–18, 33'),
    lesson: [
      {
        t: 'Mintermlerin toplamı (Σm)',
        html: `<p>Bir fonksiyonu, <b>1 olduğu satırların mintermlerini OR'layarak</b> yazabilirsin. Buna <b>canonical SOP</b> (sum of minterms) denir.</p>
          <p>Slayt 13–14: F<sub>1</sub>(x,y,z) = m<sub>1</sub> + m<sub>4</sub> + m<sub>7</sub> = x'y'z + xy'z' + xyz</p>
          <p>Kısaltma (slayt 33): <span class="mono">F(x,y,z) = Σm(1, 4, 7)</span>. Değişkenler standart sırada yazılır, "m" harfleri atılır.</p>
          <div class="rule">Σm listesi = doğruluk tablosunda <b>F = 1</b> olan satırların indeksleri.</div>`,
      },
      {
        t: 'Maxtermlerin çarpımı (ΠM)',
        html: `<p>Aynı fonksiyonu <b>0 olduğu satırların maxtermlerini AND'leyerek</b> de yazabilirsin: <b>canonical POS</b> (product of maxterms).</p>
          <p>Slayt 16–17: F<sub>1</sub> = M<sub>0</sub>·M<sub>2</sub>·M<sub>3</sub>·M<sub>5</sub>·M<sub>6</sub> = ΠM(0, 2, 3, 5, 6)</p>
          <p><b>Neden çalışır?</b> Her M<sub>i</sub> sadece kendi satırında 0'dır. Çarpımda herhangi biri 0 ise sonuç 0 olur. Yani F tam olarak listelenen satırlarda 0, diğerlerinde 1.</p>
          <div class="rule">ΠM listesi = <b>F = 0</b> olan satırlar = Σm listesinde <b>olmayan</b> indeksler.</div>
          <div class="demo">Doğruluk tablosunda F sütununa dokun:<div class="tw"></div><div class="calc tlo mono"></div></div>`,
        init(el) {
          const vars = 'xyz', out = $('.tlo', el);
          const show = a => { const t = a.map(x => x ?? 0); const o = Bool.onesOf(t), z = comp(o, 3); out.innerHTML = `F = Σm(${o.join(', ')})<br>F = ΠM(${z.join(', ')})`; };
          const w = Bool.truthTable($('.tw', el), vars, { edit: 'F', onChange: show });
          w.set([0, 1, 0, 0, 1, 0, 0, 1]); show([0, 1, 0, 0, 1, 0, 0, 1]);
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Σm(…) = F'nin <b>1</b> olduğu satırlar</li>
          <li>ΠM(…) = F'nin <b>0</b> olduğu satırlar</li>
          <li>Σm ve ΠM listeleri birbirini tamamlar (birlikte 0 … 2<sup>n</sup>−1)</li>
          <li>Satır indeksi = girişlerin ikili değeri (ilk değişken MSB)</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r3.sm.tt', name: 'Σm / ΠM → doğruluk tablosu', ref: R('14, 17'), long: true,
        gen() {
          const n = 3, vars = varsOf(3), f = randFn(n, { pOne: .45 }), t = ttFrom(f.ones, [], n), isP = Math.random() < .4;
          const z = comp(f.ones, n);
          return fillTask({ q: `${isP ? Π(z, vars) : Σ(f.ones, vars)}<br>Doğruluk tablosunu doldur.`, vars, target: t,
            why: isP ? `ΠM listesi F'nin <b>0</b> olduğu satırlar: ${z.join(', ')}. Diğer satırlar 1.` : `Σm listesi F'nin <b>1</b> olduğu satırlar: ${f.ones.join(', ')}. Diğer satırlar 0.` });
        },
      },
      {
        id: 'r3.sm.list', name: 'Doğruluk tablosu → Σm', ref: R('14, 33'),
        gen() {
          const n = 3, vars = varsOf(3), f = randFn(n), t = ttFrom(f.ones, [], n);
          return inputTask({ q: `Bu fonksiyonu Σm(…) olarak yaz. <span class="sub">Sadece indeksleri gir, ör. 1 4 7</span>${ttHTML(vars, t)}`, qText: `tt ${t.join('')} → Σm`, answer: f.ones.join(', '),
            check: u => listQ(u, f.ones), why: `F = 1 olan satırlar: <b>Σm(${f.ones.join(', ')})</b>` });
        },
      },
      {
        id: 'r3.sm.pi', name: 'Doğruluk tablosu → ΠM', ref: R('16–17'),
        gen() {
          const n = 3, vars = varsOf(3), f = randFn(n), t = ttFrom(f.ones, [], n), z = comp(f.ones, n);
          return inputTask({ q: `Bu fonksiyonu ΠM(…) olarak yaz. <span class="sub">Sadece indeksleri gir.</span>${ttHTML(vars, t)}`, qText: `tt ${t.join('')} → ΠM`, answer: z.join(', '),
            check: u => listQ(u, z), why: `ΠM = F'nin <b>0</b> olduğu satırlar: <b>ΠM(${z.join(', ')})</b>. (1 olanları değil, 0 olanları listele!)` });
        },
      },
      {
        id: 'r3.sm.write', name: 'Σm → canonical SOP ifadesi', ref: R('13, 15'),
        gen() {
          const n = 3, vars = varsOf(3), ms = shuffle([...Array(8).keys()]).slice(0, rnd(2, 3)).sort((a, b) => a - b);
          const ans = Bool.sopOfMins(ms, vars), t = ttFrom(ms, [], n);
          return Bool.exprTask({ q: `${Σ(ms, vars)} fonksiyonunu <b>mintermlerin toplamı</b> olarak açık yaz.`, vars, answer: ans,
            check: I => { const r = Bool.checker(t, vars, { form: 'sop' })(I); if (r.ok && !I.sop.every(tm => tm.length === n)) return { ok: false, msg: 'Eşdeğer ama canonical değil: her terim bütün değişkenleri içermeli (sadeleştirme yapma).' }; return r; },
            why: ms.map(m => `m<sub>${m}</sub> = ${Bool.minterm(m, vars)}`).join(', ') + `<br>F = <b>${ans}</b>` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 3 — İfadeden Kanonik Forma
     ================================================================= */
  /** standart SOP üret: 2–3 terim, bazıları eksik değişkenli */
  function stdSOP(vars) {
    const V = [...vars];
    for (;;) {
      const terms = Array.from({ length: rnd(2, 3) }, () => shuffle(V).slice(0, rnd(1, V.length - 1)).sort().map(v => v + (Math.random() < .45 ? "'" : '')).join(''));
      const s = terms.join(' + '), o = Bool.onesOf(Bool.tt(s, vars));
      if (o.length >= 2 && o.length <= 2 ** V.length - 2 && new Set(terms).size === terms.length) return { s, terms, ones: o };
    }
  }
  function stdPOS(vars) {
    const V = [...vars];
    for (;;) {
      const terms = Array.from({ length: rnd(1, 2) }, () => shuffle(V).slice(0, rnd(1, V.length - 1)).sort().map(v => v + (Math.random() < .45 ? "'" : '')));
      const s = terms.map(t => t.length > 1 ? `(${t.join(' + ')})` : t[0]).join('');
      const t = Bool.tt(s, vars), z = t.map((x, i) => x ? -1 : i).filter(i => i >= 0);
      if (z.length >= 1 && z.length <= 2 ** V.length - 2) return { s, zeros: z };
    }
  }
  const S3 = {
    id: 'r3s3', title: 'İfadeden Kanonik Forma', ref: R('19–20, 34–35'),
    lesson: [
      {
        t: 'Eksik değişkeni (v + v\') ile tamamla',
        html: `<p>Bir ifadeyi Σm'e çevirmek için her terimin <b>bütün değişkenleri</b> içermesi gerekir. Eksik v değişkeni için terimi <b>(v + v')</b> = 1 ile çarparsın (değeri değişmez!), sonra dağıtırsın.</p>
          <p><b>Slayt 20:</b> F(A,B,C) = A + B'C</p>
          <table class="t"><tr><td>A</td><td>= A(B + B')(C + C') = AB'C' + AB'C + ABC' + ABC</td><td>m4, m5, m6, m7</td></tr>
          <tr><td>B'C</td><td>= (A + A')B'C = AB'C + A'B'C</td><td>m5, m1</td></tr></table>
          <p>Tekrarlanan m5 bir kez yazılır: F = Σm(1, 4, 5, 6, 7).</p>
          <div class="rule"><b>Kısa yol:</b> Bir terimde k değişken eksikse o terim <b>2<sup>k</sup> minterm</b> verir. Terimdeki literaller bitleri sabitler, eksik değişkenler 0/1 bütün kombinasyonları alır.<br>B'C (A eksik) → A?·B=0·C=1 → 001, 101 → m1, m5</div>`,
      },
      {
        t: 'POS tarafı',
        html: `<p>ΠM için eksik değişken v'yi <b>vv'</b> = 0 ile OR'larsın, sonra ikinci dağılma kuralıyla açarsın: x + y = x + y + zz' = (x + y + z)(x + y + z').</p>
          <p><b>Slayt 34:</b> f(x,y,z) = x + x'y' → (x + x')(x + y') = x + y' → (x + y' + z)(x + y' + z') = M<sub>2</sub>·M<sub>3</sub></p>
          <div class="rule"><b>Kısa yol:</b> Bir toplam terimi, <b>bütün literalleri 0</b> olduğunda 0 olur. (x + y') → x=0, y=1 → satır 01? → M2, M3.</div>
          <div class="demo">İfade yaz (A,B,C): <input class="txt cx expr" data-keys="ABC'+()01" value="A + B'C" style="width:16ch"><div class="calc co mono"></div></div>`,
        init(el) {
          const inp = $('.cx', el), o = $('.co', el);
          const show = () => { try { const t = Bool.tt(inp.value, 'ABC'), on = Bool.onesOf(t); o.innerHTML = `Σm(${on.join(', ')})<br>ΠM(${comp(on, 3).join(', ')})`; } catch (e) { o.innerHTML = `<span class="dim">${esc(e.message)}</span>`; } };
          inp.oninput = show; show();
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>SOP → Σm: eksik v için ×(v + v'), dağıt, tekrarları at</li>
          <li>k eksik değişkenli terim → 2<sup>k</sup> minterm</li>
          <li>POS → ΠM: eksik v için +vv', ikinci dağılma kuralı</li>
          <li>Toplam terimi, bütün literalleri 0 iken 0</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r3.cf.sop', name: 'SOP ifade → Σm listesi', ref: R('19–20'),
        gen() {
          const vars = pick(['ABC', 'xyz', 'ABCD']), S = stdSOP(vars);
          return inputTask({ q: `${E(`F(${[...vars].join(',')}) = ${S.s}`)} → Σm(…) = ? <span class="sub">Sadece indeksleri gir.</span>`, answer: S.ones.join(', '), check: u => listQ(u, S.ones),
            why: S.terms.map(t => { const o = Bool.onesOf(Bool.tt(t, vars)); return `${t} → m${o.join(', m')}`; }).join('<br>') + `<br>Birleştir: <b>Σm(${S.ones.join(', ')})</b>`,
            hint: 'Her terim için: literaller bitleri sabitler, eksik değişkenler 0 ve 1 olur.' });
        },
      },
      {
        id: 'r3.cf.pos', name: 'POS ifade → ΠM listesi', ref: R('34–35'),
        gen() {
          const vars = pick(['ABC', 'xyz']), P = stdPOS(vars);
          return inputTask({ q: `${E(`F(${[...vars].join(',')}) = ${P.s}`)} → ΠM(…) = ? <span class="sub">Sadece indeksleri gir.</span>`, answer: P.zeros.join(', '), check: u => listQ(u, P.zeros),
            why: `F'nin 0 olduğu satırları bul: her toplam terimi, bütün literalleri 0 olunca 0 olur. → <b>ΠM(${P.zeros.join(', ')})</b>`,
            hint: "(x + y') terimi x=0 ve y=1 iken 0 olur." });
        },
      },
      {
        id: 'r3.cf.steps', name: 'Adım adım: terimleri genişlet', ref: R(20), long: true,
        gen() {
          const vars = pick(['ABC', 'xyz']), S = stdSOP(vars);
          const rows = [];
          S.terms.forEach(t => {
            const o = Bool.onesOf(Bool.tt(t, vars)), miss = 3 - t.replace(/'/g, '').length;
            rows.push({ html: `${t}: eksik değişken sayısı k = [[0]] → 2<sup>k</sup> = [[1]] minterm`, fields: [{ answer: String(miss), w: 1 }, { answer: String(2 ** miss), w: 2 }], why: `${t} terimi 3 değişkenden ${3 - miss} tanesini içeriyor.` });
            rows.push({ html: `${t} → mintermler: [[0]]`, fields: [{ answer: o.join(' '), w: 10, check: u => listQ(u, o) }], why: `Literaller bitleri sabitler: ${[...vars].map(v => t.includes(v + "'") ? `${v}=0` : t.includes(v) ? `${v}=1` : `${v}=?`).join(', ')} → ${o.join(', ')}` });
          });
          rows.push({ html: `F = Σm( [[0]] )`, fields: [{ answer: S.ones.join(' '), w: 14, check: u => listQ(u, S.ones) }], why: 'Bütün mintermleri birleştir, tekrarları bir kez yaz.' });
          return stepTask({ q: `${E(`F(${[...vars].join(',')}) = ${S.s}`)} ifadesini Σm'e çevir.`, rows, answer: `Σm(${S.ones.join(', ')})`, why: `F = <b>Σm(${S.ones.join(', ')})</b>` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 4 — Dönüşümler & Tümleyen
     ================================================================= */
  const S4 = {
    id: 'r3s4', title: 'Dönüşümler & Tümleyen', ref: R('3–4, 36'),
    lesson: [
      {
        t: 'Σm ↔ ΠM ve F\'',
        html: `<p>n değişkende indeksler 0 … 2<sup>n</sup>−1. Bunlar F = 1 olanlar (Σm) ve F = 0 olanlar (ΠM) diye ikiye ayrılır.</p>
          <p><b>Slayt 36:</b> F(x,y,z) = Σm(1, 3, 5, 7)</p>
          <table class="t"><tr><td>F</td><td>= Σm(1,3,5,7)</td><td>= ΠM(0,2,4,6)</td></tr>
          <tr><td>F'</td><td>= Σm(0,2,4,6)</td><td>= ΠM(1,3,5,7)</td></tr></table>
          <div class="rule"><b>Kural:</b><br>• F = Σm(L) ⟺ F = ΠM(L'nin dışındakiler)<br>• F' = Σm(eksik olanlar) — F'nin 1'leri, F'nin 0'larıdır<br>• F' = ΠM(L) — <b>aynı indeksler</b>, Σ yerine Π</div>`,
      },
      {
        t: 'Canonical vs Standard',
        html: `<p><b>Canonical</b> form: her terim bütün değişkenleri içerir (Σm ya da ΠM). Eşitlik karşılaştırmak için idealdir ama uzundur.</p>
          <p><b>Standard</b> form: SOP ya da POS, terimlerin bütün değişkenleri içermesi gerekmez (slayt 4).</p>
          <table class="t"><tr><td>f(x,y,z) = y' + xy + x'yz'</td><td>standart SOP</td></tr>
          <tr><td>g(x,y,z) = x(y' + z)(x' + y + z')</td><td>standart POS</td></tr>
          <tr><td>xy'z + x'yz</td><td>canonical SOP (her terim 3 değişken)</td></tr>
          <tr><td>A(B + C)' + D</td><td>ne SOP ne POS (iki seviyeli değil)</td></tr></table>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Σm(L) = ΠM(geri kalanlar)</li>
          <li>F' = Σm(geri kalanlar) = ΠM(L)</li>
          <li>Canonical: her terimde bütün değişkenler</li>
          <li>Standard: SOP/POS, eksik değişkenli terimler olabilir</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r3.cv.s2p', name: 'Σm ↔ ΠM', ref: R(36),
        gen() {
          const n = pick([3, 4]), vars = varsOf(n), f = randFn(n, { pOne: .4 }), z = comp(f.ones, n), toP = Math.random() < .6;
          return inputTask({ q: toP ? `${Σ(f.ones, vars)} → F = ΠM(…) = ?` : `${Π(z, vars)} → F = Σm(…) = ?`, answer: (toP ? z : f.ones).join(', '),
            check: u => listQ(u, toP ? z : f.ones), why: `0 … ${2 ** n - 1} arasında verilen listede <b>olmayan</b> indeksler: <b>${(toP ? z : f.ones).join(', ')}</b>` });
        },
      },
      {
        id: 'r3.cv.comp', name: "F' → Σm / ΠM", ref: R(36),
        gen() {
          const n = 3, vars = varsOf(n), f = randFn(n, { pOne: .45 }), z = comp(f.ones, n), asSum = Math.random() < .5;
          const ans = asSum ? z : f.ones;
          return inputTask({ q: `${Σ(f.ones, vars)} ise <b>F'</b> = ${asSum ? 'Σm' : 'ΠM'}(…) = ?`, answer: ans.join(', '), check: u => listQ(u, ans),
            why: asSum ? `F'nin 1 olduğu yerler, F'nin 0 olduğu yerlerdir → F' = Σm(<b>${z.join(', ')}</b>)` : `F' = ΠM(<b>aynı indeksler</b>) = ΠM(${f.ones.join(', ')}). Çünkü F' bu satırlarda 0 olur.` });
        },
      },
      {
        id: 'r3.cv.std', name: 'Canonical mı, standard mı?', ref: R('3–4'),
        gen() {
          const vars = 'ABC', V = [...vars], L = v => v + (Math.random() < .45 ? "'" : '');
          const kinds = {
            cSOP: () => shuffle([...Array(8).keys()]).slice(0, 2).map(m => Bool.minterm(m, vars)).join(' + '),
            sSOP: () => `${L('A')}${L('B')} + ${L('C')}`,
            cPOS: () => shuffle([...Array(8).keys()]).slice(0, 2).map(m => Bool.maxterm(m, vars)).join(''),
            sPOS: () => `(${L('A')} + ${L('B')})${L('C')}`,
            none: () => pick([`${L('A')}(${L('B')} + ${L('C')})'`, `(${L('A')}${L('B')} + ${L('C')})${L('A')}`, `(${L('A')} + ${L('B')}C)'`]),
          };
          const O = { cSOP: 'Canonical SOP (sum of minterms)', sSOP: 'Standard SOP (canonical değil)', cPOS: 'Canonical POS (product of maxterms)', sPOS: 'Standard POS (canonical değil)', none: 'Ne SOP ne POS' };
          const k = pick(Object.keys(kinds)), s = kinds[k](), keys = Object.keys(O);
          return choiceTask({ q: `${E(s)} hangi formda?`, options: keys.map(x => O[x]), correct: keys.indexOf(k),
            why: { cSOP: 'Çarpımların toplamı ve her terim A, B, C\'nin üçünü de içeriyor.', sSOP: 'Çarpımların toplamı ama bazı terimlerde değişken eksik.', cPOS: 'Toplamların çarpımı ve her toplam üç değişkeni de içeriyor.', sPOS: 'Toplamların çarpımı ama bazı terimlerde değişken eksik.', none: 'İç içe parantez ya da parantezin üstünde tümleyen var. İki seviyeli (AND-OR veya OR-AND) bir yapı değil.' }[k] });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 5 — Kapılar & Gecikme
     ================================================================= */
  const GATES = {
    AND: a => a.every(x => x) ? 1 : 0, OR: a => a.some(x => x) ? 1 : 0, NAND: a => a.every(x => x) ? 0 : 1,
    NOR: a => a.some(x => x) ? 0 : 1, XOR: a => a.reduce((s, x) => s ^ x, 0), XNOR: a => 1 - a.reduce((s, x) => s ^ x, 0),
  };
  const S5 = {
    id: 'r3s5', title: 'Kapılar & Gecikme', ref: R('39–42'),
    lesson: [
      {
        t: 'Lojik kapılar',
        html: `<p>Önce röleler, sonra vakum tüpleri, bugün <b>transistörler</b> elektronik anahtar olarak çalışır ve kapıları oluşturur (slayt 39).</p>
          <table class="t"><tr><th>Kapı</th><th>Çıkış 1 olur, eğer…</th></tr>
          <tr><td>AND</td><td>bütün girişler 1</td></tr><tr><td>OR</td><td>en az bir giriş 1</td></tr>
          <tr><td>NOT</td><td>giriş 0</td></tr><tr><td>NAND</td><td>en az bir giriş 0 (AND'in tersi)</td></tr>
          <tr><td>NOR</td><td>bütün girişler 0 (OR'un tersi)</td></tr><tr><td>XOR</td><td>tek sayıda giriş 1</td></tr></table>
          <div class="demo"><div class="row"><b>X</b><span class="gx"></span><b>Y</b><span class="gy"></span><b>Z</b><span class="gz"></span></div><div class="calc go mono"></div></div>`,
        init(el) {
          const v = [1, 0, 1];
          const draw = () => {
            ['.gx', '.gy', '.gz'].forEach((s, i) => { $(s, el).innerHTML = `<button class="ledbtn ${v[i] ? 'on' : ''}"></button>`; $(s + ' button', el).onclick = () => { v[i] ^= 1; Sound.tick(); draw(); }; });
            $('.go', el).innerHTML = Object.entries(GATES).map(([g, f]) => `${g}(X,Y,Z) = <b>${f(v)}</b>`).join(' &nbsp; ');
          };
          draw();
        },
      },
      {
        t: 'Kapı gecikmesi (gate delay)',
        html: `<p>Gerçek bir kapıda giriş değişince çıkış <b>anında</b> değişmez. Aradaki süreye <b>gate delay</b> denir: t<sub>G</sub> (slayt 41, örnekte t<sub>G</sub> = 0.3 ns).</p>
          <div class="rule">Girişten çıkışa bir sinyal art arda k kapıdan geçiyorsa toplam gecikme ≈ <b>k · t<sub>G</sub></b>. Devrenin hızını <b>en uzun yol</b> (critical path) belirler.</div>
          <p>İki seviyeli bir SOP devresinde (NOT → AND → OR) en uzun yol 3 kapıdır. Bu yüzden basit (iki seviyeli) ifadeler hem ucuz hem hızlıdır.</p>`,
      },
      {
        t: 'Aynı fonksiyon, farklı devreler',
        html: `<p>Slayt 42: F = X + Y'Z için Boolean ifadesi, doğruluk tablosu ve lojik diyagram <b>aynı fonksiyonu</b> anlatır.</p>
          <div class="rule"><b>Doğruluk tablosu tektir (unique)</b>. İfadeler ve devre diyagramları tek değildir: aynı fonksiyonun pek çok farklı ifadesi ya da devresi olabilir. Bu da en ucuz devreyi seçme esnekliği verir (Lecture 4'ün konusu).</div>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>NAND = AND'in tersi · NOR = OR'un tersi</li>
          <li>XOR = tek sayıda 1 → 1</li>
          <li>Toplam gecikme ≈ en uzun yoldaki kapı sayısı × t<sub>G</sub></li>
          <li>Doğruluk tablosu tektir; ifade ve devre değil</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r3.gt.out', name: 'Kapı çıkışı', ref: R(40),
        gen() {
          const g = pick(Object.keys(GATES)), k = rnd(2, 3), a = Array.from({ length: k }, () => rnd(0, 1)), y = GATES[g](a);
          const why = { AND: 'AND: hepsi 1 ise 1.', OR: 'OR: biri 1 ise 1.', NAND: 'NAND: AND\'in tersi. Hepsi 1 değilse 1.', NOR: 'NOR: OR\'un tersi. Hepsi 0 ise 1.', XOR: 'XOR: tek sayıda 1 varsa 1.', XNOR: 'XNOR: XOR\'un tersi. Çift sayıda 1 varsa 1.' }[g];
          return inputTask({ q: `${k} girişli <b>${g}</b> kapısının girişleri: <span class="mono">${a.join(', ')}</span>. Çıkış = ?`, answer: String(y), placeholder: '0 veya 1', why: `${why} → <b>${y}</b>` });
        },
      },
      {
        id: 'r3.gt.delay', name: 'Kapı gecikmesi hesabı', ref: R(41),
        gen() {
          const tg = pick([0.3, 0.5, 1, 2]), k = rnd(2, 5);
          if (Math.random() < .5) return inputTask({ q: `Girişten çıkışa en uzun yolda art arda <b>${k}</b> kapı var. Her kapının gecikmesi t<sub>G</sub> = ${tg} ns. Girişteki değişim çıkışa en geç kaç ns sonra ulaşır?`, answer: String(+(k * tg).toFixed(2)), check: u => decEq(u, k * tg), why: `${k} × ${tg} = <b>${+(k * tg).toFixed(2)} ns</b>` });
          return inputTask({ q: `Girişlerin tümleyenleri NOT kapılarıyla alınıp bir SOP ifadesi (AND → OR) olarak gerçekleniyor. t<sub>G</sub> = ${tg} ns ise en kötü durumda gecikme kaç ns?`, answer: String(+(3 * tg).toFixed(2)), check: u => decEq(u, 3 * tg), why: `En uzun yol: NOT → AND → OR = 3 kapı → 3 × ${tg} = <b>${+(3 * tg).toFixed(2)} ns</b>` });
        },
      },
      {
        id: 'r3.gt.uniq', name: 'Tablo, ifade, devre', ref: R(42),
        gen() {
          const qs = [
            { q: 'Bir Boolean fonksiyonu için hangisi <b>tektir (unique)</b>?', o: ['Doğruluk tablosu', 'Boolean ifadesi', 'Lojik diyagram', 'Hepsi'], c: 0, w: 'Doğruluk tablosu fonksiyonu tamamen ve tek şekilde tanımlar. İfadeler ve devreler ise sonsuz çeşitlilikte olabilir.' },
            { q: 'F = X + Y\'Z ve G = (X + Y\')(X + Z) için hangisi doğru?', o: ['Aynı fonksiyondur, farklı devrelerle gerçeklenebilir', 'Farklı fonksiyonlardır', 'Sadece X = 1 iken eşittir'], c: 0, w: 'Distributive: X + Y\'Z = (X + Y\')(X + Z). Doğruluk tabloları aynı, devreleri farklı.' },
            { q: 'Canonical formların (Σm, ΠM) başlıca kullanım amacı nedir?', o: ['İki fonksiyonun eşit olup olmadığını karşılaştırmak', 'En ucuz devreyi elde etmek', 'Gecikmeyi azaltmak'], c: 0, w: 'Slayt 3: canonical form eşitlik karşılaştırmaya izin verir ve doğruluk tablosuna birebir karşılık gelir. Genelde en ucuz form değildir.' },
            { q: 'Daha basit (daha az literalli) bir ifade devreye nasıl yansır?', o: ['Daha az kapı/giriş → daha ucuz iki seviyeli devre', 'Daha fazla gecikme', 'Fark etmez'], c: 0, w: 'Slayt 15: basit ifadeler daha basit iki seviyeli gerçeklemelere yol açar.' },
          ];
          const x = pick(qs), opts = shuffle(x.o);
          return choiceTask({ q: x.q, options: opts, correct: opts.indexOf(x.o[x.c]), why: x.w });
        },
      },
    ],
  };

  Registry.addRegion({
    id: 'r3', chip: 'U3', name: 'Kanonik Kale', lec: 'Lecture 3', ref: 'Lecture 3',
    stations: [S1, S2, S3, S4, S5],
  });
})();
