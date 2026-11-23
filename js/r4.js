'use strict';
/* =====================================================================
   BÖLGE U4 — HARİTA VADİSİ  (Lecture 4–5: optimizasyon, K-map, QM, NAND/NOR)
   ===================================================================== */
(() => {
  const R = s => `Lecture 4–5 · slayt ${s}`;
  const kmapHTML = (vars, vals, opts = {}) => { const d = document.createElement('div'); Bool.kmap(d, vars, Object.assign({ vals }, opts)); return d.innerHTML; };
  const V3 = () => pick(['xyz', 'ABC']), V4 = () => pick(['wxyz', 'ABCD']);
  const zerosOf = (ones, dc, n) => Array.from({ length: 2 ** n }, (_, i) => i).filter(i => !ones.includes(i) && !dc.includes(i));
  const listQ = (u, want) => Bool.sameList(Bool.parseList(u), want);
  /** "güzel" fonksiyon: minimum SOP 2..maxT terim, sabit değil */
  function niceFn(n, { pX = 0, minT = 2, maxT = 4, pOne = .45, minEss = 0 } = {}) {
    for (let g = 0; g < 400; g++) {
      const f = randFn(n, { pOne, pX, minOnes: 3 }), vars = n === 3 ? 'ABC' : 'ABCD';
      const r = Bool.minSOP(f.ones, f.dc, vars);
      if (r.terms.length < minT || r.terms.length > maxT || r.ess.length < minEss) continue;
      if (r.terms.some(c => Bool.cubeLits(c, n) === 0)) continue;
      return f;
    }
    return { ones: [0, 1, 3, 7], dc: [] };
  }
  /** grupları açıklayan metin */
  const groupWhy = (r, vars, pos = false) => r.terms.map((c, i) => `<span style="color:${Bool.GROUPC[i % 7]}">■</span> ${pos ? Bool.cubeSumStr(c, vars) : Bool.cubeStr(c, vars)} <span class="dim">(${Bool.cubeMins(c, vars.length).join(', ')})</span>`).join('<br>');
  const mapWithGroups = (vars, vals, r) => kmapHTML(vars, vals, { groups: r.terms });

  /** etkileşimli K-map laboratuvarı (ders sayfaları için) */
  function kmapLab(el, vars, { allowX = false, pos = false, init = [] } = {}) {
    const n = vars.length, host = $('.lab', el), out = $('.labo', el);
    let vals = Array(2 ** n).fill(0); init.forEach(([m, v]) => vals[m] = v);
    let km;
    const show = v => {
      vals = v;
      const ones = v.map((x, i) => x === 1 ? i : -1).filter(i => i >= 0), dc = v.map((x, i) => x === 'x' ? i : -1).filter(i => i >= 0);
      const r = pos ? Bool.minPOS(ones, dc, vars) : Bool.minSOP(ones, dc, vars);
      km.groups(r.terms);
      if (!pos) {
        const P = r.primes, E = new Set(r.ess);
        out.innerHTML = `<b>Minimum SOP:</b> <span class="mono">F = ${r.str}</span> &nbsp; <span class="dim">L=${r.cost.L} G=${r.cost.G} GN=${r.cost.GN}</span><br>
          <span class="dim">Prime implicant'lar (${P.length}):</span> ${P.map(c => `<span class="mono" style="${E.has(c) ? 'color:var(--led)' : ''}">${Bool.cubeStr(c, vars)}${E.has(c) ? '★' : ''}</span>`).join(', ') || '—'}<br><span class="note">★ = essential</span>`;
      } else out.innerHTML = `<b>Minimum POS:</b> <span class="mono">F = ${r.str}</span> &nbsp; <span class="dim">L=${r.cost.L} G=${r.cost.G}</span><br><span class="note">Renkli gruplar 0'ları kapsıyor.</span>`;
    };
    km = Bool.kmap(host, vars, { vals, editable: true, allowX, onChange: show });
    show(vals);
  }

  /* =================================================================
     İSTASYON 1 — Maliyet: L · G · GN
     ================================================================= */
  function randTwoLevel(vars, pos) {
    const V = [...vars];
    for (;;) {
      const terms = Array.from({ length: rnd(2, 4) }, () => shuffle(V).slice(0, rnd(1, Math.min(3, V.length))).sort().map(v => v + (Math.random() < .45 ? "'" : '')));
      if (new Set(terms.map(t => t.join())).size !== terms.length) continue;
      const s = pos ? terms.map(t => t.length > 1 ? `(${t.join(' + ')})` : t[0]).join('') : terms.map(t => t.join('')).join(' + ');
      return { s, terms };
    }
  }
  const S1 = {
    id: 'r4s1', title: 'Maliyet: L · G · GN', ref: R('2–6'),
    lesson: [
      {
        t: 'Neden maliyet?',
        html: `<p><b>Optimization</b>, bir fonksiyonu en ucuz devreyle gerçekleştirmek için yapılan sistematik sadeleştirmedir. "Ucuz"u ölçmek için bir <b>maliyet kriteri</b> gerekir (slayt 2):</p>
          <table class="t"><tr><th>Kriter</th><th>Sayılan</th></tr>
          <tr><td><b>L</b> — literal cost</td><td>ifadedeki literal geçişleri</td></tr>
          <tr><td><b>G</b> — gate input cost</td><td>kapı girişleri (NOT hariç)</td></tr>
          <tr><td><b>GN</b> — gate input cost with NOTs</td><td>G + NOT kapılarının girişleri</td></tr></table>
          <div class="rule"><b>SOP/POS için formül (slayt 4):</b><br>
          L = bütün literal geçişleri<br>
          G = L + <b>tek literalli olmayan terim sayısı</b> (bunlar AND/OR kapılarının çıkışları, dıştaki kapıya giriş olur)<br>
          GN = G + <b>farklı tümleyenli değişken sayısı</b> (her biri için bir NOT kapısı)</div>`,
      },
      {
        t: 'Örnekler (slayt 5–6)',
        html: `<p><b>F = A + BC + B'C'</b></p>
          <table class="t"><tr><td>L</td><td>A, B, C, B', C' → 5</td></tr>
          <tr><td>G</td><td>5 + 2 (BC ve B'C' terimleri) = 7</td></tr>
          <tr><td>GN</td><td>7 + 2 (B' ve C' için iki NOT) = 9</td></tr></table>
          <p><b>F = A'B'C + ABC'</b> → L = 6, G = 8, GN = 11 &nbsp; vs. &nbsp; aynı fonksiyonun POS hali → L = 6, G = 9</p>
          <p>Literal sayıları eşit ama G'si küçük olan seçilir. Dersin tercihi: <b>gate input cost (G)</b>.</p>
          <div class="demo">SOP ya da POS yaz (A,B,C,D): <input class="txt cx expr" data-keys="ABCD'+()01" value="A + BC + B'C'" style="width:22ch"><div class="calc co mono"></div></div>`,
        init(el) {
          const inp = $('.cx', el), o = $('.co', el);
          const show = () => {
            try {
              const a = Bool.parse(inp.value, 'ABCD'), s = Bool.sopTerms(a), p = Bool.posTerms(a), t = s || p;
              if (!t) { o.innerHTML = '<span class="dim">İki seviyeli (SOP/POS) değil</span>'; return; }
              const c = Bool.cost(t); o.innerHTML = `${s ? 'SOP' : 'POS'} · L = <b>${c.L}</b> · G = <b>${c.G}</b> · GN = <b>${c.GN}</b>`;
            } catch (e) { o.innerHTML = `<span class="dim">${esc(e.message)}</span>`; }
          };
          inp.oninput = show; show();
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>L = literal geçişleri</li>
          <li>G = L + (tek literalli olmayan terim sayısı)</li>
          <li>GN = G + (farklı tümleyenli değişken sayısı)</li>
          <li>Tek terim varsa dış kapı yoktur: G = L</li>
          <li>Karşılaştırmada G kullanılır</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.cost.calc', name: 'L, G, GN hesapla', ref: R('3–6'), long: true,
        gen() {
          const vars = 'ABCD', pos = Math.random() < .35, T = randTwoLevel(vars, pos);
          const terms = Bool.cubeTerms ? (pos ? Bool.posTerms : Bool.sopTerms)(Bool.parse(T.s, vars)) : null;
          const c = Bool.cost(terms), multi = terms.filter(t => t.length > 1).length;
          const negs = [...new Set(terms.flat().filter(l => l.neg).map(l => vars[l.i]))];
          return stepTask({ q: `${E('F = ' + T.s)} &nbsp;(${pos ? 'POS' : 'SOP'}) için maliyetleri bul.`, rows: [
            { html: 'L = [[0]]', fields: [{ answer: String(c.L), w: 2 }], why: 'Bütün literal geçişlerini say (tümleyenliler de sayılır).', after: `L = ${c.L}` },
            { html: 'G = [[0]]', fields: [{ answer: String(c.G), w: 2 }], why: terms.length > 1 ? `G = L + tek literalli olmayan terim sayısı = ${c.L} + ${multi}` : 'Tek terim: dış kapı yok, G = L.', after: `G = ${c.G}` },
            { html: 'GN = [[0]]', fields: [{ answer: String(c.GN), w: 2 }], why: `Farklı tümleyenli değişkenler: ${negs.join(', ') || 'yok'} → her biri için 1 NOT girişi.`, after: `GN = ${c.GN}` },
          ], answer: `L=${c.L}, G=${c.G}, GN=${c.GN}`, why: `L = ${c.L}; G = ${c.L} + ${terms.length > 1 ? multi : 0} = ${c.G}; GN = ${c.G} + ${negs.length} (${negs.join(', ') || '—'}) = ${c.GN}` });
        },
      },
      {
        id: 'r4.cost.cmp', name: 'Hangi gerçekleme daha ucuz?', ref: R(6),
        gen() {
          for (;;) {
            const vars = 'ABC', f = niceFn(3, { maxT: 3 }), s = Bool.minSOP(f.ones, [], vars), p = Bool.minPOS(f.ones, [], vars);
            const cs = s.cost, cp = p.cost;
            if (cs.L <= 2 || cp.L <= 2) continue;
            const c = cs.G < cp.G ? 0 : cp.G < cs.G ? 1 : 2;
            const opts = ['SOP daha ucuz', 'POS daha ucuz', 'G maliyetleri eşit'];
            return choiceTask({ q: `Aynı fonksiyonun iki gerçeklemesi:<br>SOP: ${E(s.str)}<br>POS: ${E(p.str)}<br>Gate input cost (G) açısından hangisi daha ucuz?`, options: opts, correct: c,
              why: `SOP: L=${cs.L}, G=${cs.G} · POS: L=${cp.L}, G=${cp.G}. G = L + (çok literalli terim sayısı).` });
          }
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 2 — K-map Okuma
     ================================================================= */
  const S2 = {
    id: 'r4s2', title: 'K-map Okuma', ref: R('9–20, 24–27, 35–36'),
    lesson: [
      {
        t: 'K-map nedir?',
        html: `<p><b>Karnaugh map</b>, doğruluk tablosunun yeniden düzenlenmiş halidir. Her kare bir mintermdir (slayt 9).</p>
          <div class="rule"><b>Asıl fikir:</b> Komşu kareler sadece <b>bir değişkende</b> farklıdır. Bu yüzden satır/sütun etiketleri ikili sayma sırasıyla değil, <b>Gray kod</b> sırasıyla yazılır: <span class="mono">00, 01, 11, 10</span>.</div>
          <p>Komşu iki 1'i birleştirmek, Lecture 2'deki <b>Minimization teoremini</b> uygulamaktır: <span class="mono">xy + xy' = x</span>. Değişen değişken kaybolur.</p>
          <div class="row" style="align-items:flex-start;gap:24px"><div><div class="silk">2 değişken</div>${kmapHTML('xy', [0, 1, 2, 3].map(() => 0))}</div><div><div class="silk">3 değişken</div>${kmapHTML('xyz', Array(8).fill(0))}</div></div>
          <p class="note">Küçük gri sayılar minterm indeksleri. 3 değişkende sütun sırasının 0, 1, <b>3, 2</b> olduğuna dikkat!</p>`,
      },
      {
        t: '4 değişken ve kenar komşuluğu',
        html: `${kmapHTML('wxyz', Array(16).fill(0))}
          <div class="rule">Satırlar wx, sütunlar yz; ikisi de Gray sırası: 00, 01, 11, 10.<br>Hücre indeksi = <b>wxyz</b> bitlerinin ikili değeri. Ör: satır 11, sütun 01 → 1101 = 13.<br>
          <b>Kenarlar birbirine komşu:</b> en sol sütun ile en sağ sütun, en üst satır ile en alt satır komşudur (harita bir simit gibi sarılır). Dört köşe (0, 2, 8, 10) birlikte bir 4'lü grup oluşturabilir!</div>
          <p><b>İki minterm ne zaman komşu?</b> İndekslerinin ikili gösterimi tam <b>bir bitte</b> farklıysa (ör. m2 = 0010 ve m10 = 1010).</p>`,
      },
      {
        t: 'Grupları okumak',
        html: `<p>Bir dikdörtgen grubun terimini okumak için (slayt 31):</p>
          <div class="rule">• Grubun içinde değeri <b>hep 1</b> olan değişken → düz yaz<br>• <b>Hep 0</b> olan → tümleyenli yaz<br>• Hem 0 hem 1 olan → yazma (kaybolur)</div>
          <table class="t"><tr><th>Grup boyutu (4 değişkende)</th><th>1</th><th>2</th><th>4</th><th>8</th><th>16</th></tr>
          <tr><td>Literal sayısı</td><td>4</td><td>3</td><td>2</td><td>1</td><td>0 (F=1)</td></tr></table>
          <p>Genel: 2<sup>k</sup> hücrelik grup → n − k literal. Grup boyutu <b>mutlaka 2'nin kuvveti</b> olmalı.</p>
          <p><b>5 değişken</b> (slayt 35–36): v = 0 ve v = 1 için iki ayrı 4'lük map. Bir map'teki hücre, diğer map'te <b>aynı konumdaki</b> hücreyle komşudur (m4 ↔ m20, m15 ↔ m31).</p>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Gray sırası: 00, 01, 11, 10</li>
          <li>Komşu = indeksler 1 bit farklı; kenarlar sarılır</li>
          <li>2<sup>k</sup> hücre → n − k literal</li>
          <li>Hep 1 → düz, hep 0 → tümleyen, değişen → yok</li>
          <li>5 değişken: v=0 / v=1 haritalarında aynı konum komşu</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.km.cell', name: 'Hücre → minterm indeksi', ref: R('15, 24'),
        gen() {
          const n = pick([3, 4, 4]), vars = n === 3 ? V3() : V4(), m = rnd(0, 2 ** n - 1);
          return inputTask({ q: `İşaretli hücre hangi minterm? (m<sub>i</sub>, i = ?)${kmapHTML(vars, Array(2 ** n).fill(0), { groups: [{ v: m, d: 0 }], showIdx: false })}`, qText: `K-map hücre → indeks (${m})`, answer: String(m),
            why: `Satır etiketi + sütun etiketi = ${bin(m, n)} → <b>${m}</b>. Gray sırasına dikkat: üçüncü sütun 11, dördüncü 10.` });
        },
      },
      {
        id: 'r4.km.adj', name: 'Komşu mu?', ref: R('15, 26, 36'),
        gen() {
          const n = pick([3, 4, 4, 5]), N = 2 ** n, a = rnd(0, N - 1);
          const yes = Math.random() < .5;
          let b;
          if (yes) b = a ^ (1 << rnd(0, n - 1));
          else { do { b = rnd(0, N - 1); } while (b === a || Bool.pop(a ^ b) === 1); }
          const d = Bool.pop(a ^ b);
          return choiceTask({ q: `${n} değişkenli K-map'te <b>m<sub>${a}</sub></b> ve <b>m<sub>${b}</sub></b> komşu mu?`, options: ['Evet, komşu', 'Hayır'], correct: yes ? 0 : 1,
            why: `${bin(a, n)} vs ${bin(b, n)} → ${d} bit farklı. ${d === 1 ? 'Tam 1 bit farklı → komşu' + (n === 5 && (a ^ b) === 16 ? ' (iki map\'te aynı konum: v farklı).' : (Math.abs(a - b) > 2 ? ' (haritada uzak görünse de kenarlar sarılır).' : '.')) : 'Komşuluk için tam 1 bit farkı gerekir.'}` });
        },
      },
      {
        id: 'r4.km.read', name: 'Grubun terimini oku', ref: R('18–20, 31'),
        gen() {
          const n = pick([3, 4, 4]), vars = n === 3 ? V3() : V4();
          const k = rnd(1, n - 1), bits = shuffle([...Array(n).keys()]).slice(0, k), d = bits.reduce((s, b) => s | (1 << b), 0);
          const v = rnd(0, 2 ** n - 1) & ~d, c = { v, d }, ans = Bool.cubeStr(c, vars);
          const t = Array.from({ length: 2 ** n }, (_, m) => Bool.cubeHas(c, m) ? 1 : 0);
          return Bool.exprTask({ q: `Renkli grubun ifade ettiği çarpım terimi nedir?${kmapHTML(vars, t, { groups: [c] })}`, qText: `K-map grup → terim (${ans})`, vars, answer: ans,
            check: I => { const r = Bool.checker(t, vars, { form: 'sop' })(I); return r.ok && I.sop.length !== 1 ? { ok: false, msg: 'Tek bir çarpım terimi yaz.' } : r; },
            why: `Grupta ${2 ** k} hücre → ${n - k} literal. Sabit kalan değişkenler: ${[...vars].map((x, i) => { const b = 1 << (n - 1 - i); return d & b ? null : `${x}=${v & b ? 1 : 0}`; }).filter(Boolean).join(', ')} → <b>${ans}</b>` });
        },
      },
      {
        id: 'r4.km.size', name: 'Grup boyutu → literal sayısı', ref: R('17, 25'),
        gen() {
          const n = pick([3, 4, 5]), k = rnd(0, n), sz = 2 ** k;
          return inputTask({ q: `${n} değişkenli bir K-map'te <b>${sz}</b> hücrelik bir grup kaç literallik bir terim verir?`, answer: String(n - k),
            why: `${sz} = 2<sup>${k}</sup> hücre → ${k} değişken kaybolur → ${n} − ${k} = <b>${n - k}</b> literal.${n - k === 0 ? ' (Bütün harita 1 → F = 1.)' : ''}` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 3 — K-map ile Sadeleştirme
     ================================================================= */
  function minTask(n, { pX = 0 } = {}) {
    const vars = n === 3 ? V3() : V4(), f = niceFn(n, { pX, maxT: n === 3 ? 3 : 4 });
    const r = Bool.minSOP(f.ones, f.dc, vars), t = ttFrom(f.ones, f.dc, n);
    return { vars, f, r, t };
  }
  const S3 = {
    id: 'r4s3', title: 'K-map ile Sadeleştirme', ref: R('21–31'),
    lesson: [
      {
        t: 'Adım adım',
        html: `<div class="rule"><b>K-map kullanımı (slayt 31):</b><br>1. Fonksiyonun 1'lerini haritaya yerleştir.<br>2. 1'leri <b>mümkün olan en büyük</b> dikdörtgenlerle kapsa (1, 2, 4, 8… hücre). Kenarlardan taşmak serbest.<br>3. Her dikdörtgen bir çarpım terimidir. Hepsini OR'la.<br>4. Bütün 1'ler kapsanmalı. Gruplar üst üste binebilir, ama gereksiz grup ekleme.</div>
          <p><b>Örnek (slayt 23):</b> F(X,Y,Z) = Σm(0,1,2,4,6,7) → F = Z' + X'Y' + XY</p>
          ${kmapHTML('XYZ', ttFrom([0, 1, 2, 4, 6, 7], [], 3), { groups: Bool.minSOP([0, 1, 2, 4, 6, 7], [], 'XYZ').terms })}
          <p class="note">Z' = sol ve sağ sütun (kenar komşuluğu!) 4'lü grup. X'Y' ve XY ikili gruplar.</p>`,
      },
      {
        t: 'K-map laboratuvarı',
        html: `<p>Hücrelere dokunarak 1 koy. Minimum SOP ve gruplar canlı hesaplanır. Slayt 28'deki örneği dene: Σm(0,1,2,4,5,6,8,9,12,13,14) → y' + w'z' + xz'.</p>
          <div class="demo"><div class="lab"></div><div class="calc labo" style="margin-top:8px"></div></div>`,
        init(el) { kmapLab(el, 'wxyz', { init: [0, 1, 2, 4, 5, 6, 8, 9, 12, 13, 14].map(m => [m, 1]) }); },
      },
      {
        t: 'Sık hatalar',
        html: `<ul><li><b>3'lü ya da 6'lı grup</b> yapmak: grup boyutu 2'nin kuvveti olmalı.</li>
          <li><b>Çapraz</b> hücreleri gruplamak: sadece dikdörtgenler (komşuluk 1 bit farkı).</li>
          <li><b>Kenar sarmasını unutmak:</b> 0. ve 2. sütun komşudur, köşeler de.</li>
          <li><b>Küçük grupla yetinmek:</b> bir 1'i kapsayan en büyük dikdörtgeni seç (prime implicant).</li>
          <li><b>Gereksiz grup:</b> bütün 1'leri zaten başka gruplar kapsıyorsa ekleme.</li></ul>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>En büyük 2<sup>k</sup> dikdörtgenler, kenarlar sarılır</li>
          <li>Her 1 en az bir grupta</li>
          <li>Az grup + büyük grup = düşük maliyet</li>
          <li>Hep 1 → x · hep 0 → x' · değişen → yok</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.km.fill', name: 'Σm → K-map doldur', ref: R('15, 24'),
        gen() {
          const n = pick([3, 4]), vars = n === 3 ? V3() : V4(), f = randFn(n, { pOne: .4 }), t = ttFrom(f.ones, [], n);
          return fillTask({ q: `${Σ(f.ones, vars)} fonksiyonunu K-map'e yerleştir.`, vars, target: t, mode: 'kmap', answerHtml: kmapHTML(vars, t),
            why: 'Her mintermin indeksini ikili yaz: ilk bitler satırı, son bitler sütunu verir (Gray sırası!).' });
        },
      },
      {
        id: 'r4.km.min3', name: '3 değişkenli K-map → minimum SOP', ref: R('21–23'), long: true,
        gen() {
          const { vars, f, r, t } = minTask(3);
          return Bool.exprTask({ q: `Minimum SOP ifadesini yaz:<br>${Σ(f.ones, vars)}${kmapHTML(vars, t)}`, qText: `K-map3 Σm(${f.ones}) → min SOP`, vars, answer: r.str,
            check: Bool.checker(t, vars, { form: 'sop', maxG: r.cost.G }),
            why: `${mapWithGroups(vars, t, r)}${groupWhy(r, vars)}<br>F = <b>${r.str}</b> (G = ${r.cost.G})`, hint: 'Önce en büyük grupları ara: 4\'lü bir grup var mı? Kenar sütunları komşu.' });
        },
      },
      {
        id: 'r4.km.min4', name: '4 değişkenli K-map → minimum SOP', ref: R('24–29'), long: true,
        gen() {
          const { vars, f, r, t } = minTask(4);
          return Bool.exprTask({ q: `Minimum SOP ifadesini yaz:<br>${Σ(f.ones, vars)}${kmapHTML(vars, t)}`, qText: `K-map4 Σm(${f.ones}) → min SOP`, vars, answer: r.str,
            check: Bool.checker(t, vars, { form: 'sop', maxG: r.cost.G }),
            why: `${mapWithGroups(vars, t, r)}${groupWhy(r, vars)}<br>F = <b>${r.str}</b> (G = ${r.cost.G})`, hint: 'Köşeler ve kenarlar komşu. Önce sadece tek bir şekilde kapsanabilen 1\'leri bul.' });
        },
      },
      {
        id: 'r4.km.expr', name: 'İfadeyi K-map ile sadeleştir', ref: R(29), long: true,
        gen() {
          for (;;) {
            const vars = V4(), V = [...vars];
            const terms = Array.from({ length: rnd(3, 4) }, () => shuffle(V).slice(0, rnd(2, 3)).sort((a, b) => vars.indexOf(a) - vars.indexOf(b)).map(v => v + (Math.random() < .5 ? "'" : '')).join(''));
            const s = terms.join(' + '), t = Bool.tt(s, vars), ones = Bool.onesOf(t), r = Bool.minSOP(ones, [], vars);
            const L = Bool.countLits(Bool.parse(s, vars));
            if (r.cost.L >= L || ones.length < 3) continue;
            return Bool.exprTask({ q: `${E('F = ' + s)}<br>Haritaya yerleştir ve minimum SOP'yi bul.`, vars, answer: r.str,
              check: Bool.checker(t, vars, { form: 'sop', maxG: r.cost.G }),
              why: `F = Σm(${ones.join(', ')})${mapWithGroups(vars, t, r)}${groupWhy(r, vars)}<br>F = <b>${r.str}</b>`, hint: 'Her terim bir dikdörtgendir: 3 literalli terim 2 hücre, 2 literalli terim 4 hücre kaplar.' });
          }
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 4 — Prime & Essential Implicant
     ================================================================= */
  const S4 = {
    id: 'r4s4', title: 'Prime & Essential Implicant', ref: R('32–34, 42–45'),
    lesson: [
      {
        t: 'Tanımlar',
        html: `<div class="rule"><b>Prime implicant (PI):</b> Daha büyük bir dikdörtgene genişletilemeyen grup (2'nin kuvveti boyutlu, mümkün olan en büyük).<br>
          <b>Essential prime implicant (EPI):</b> Bir 1'i kapsayan <b>tek</b> prime implicant. O 1'i başka hiçbir PI kapsamıyorsa EPI çözümde zorunludur.</div>
          <p><b>Optimizasyon algoritması (slayt 42):</b><br>1. Bütün PI'leri bul.<br>2. Bütün EPI'leri çözüme ekle.<br>3. Hâlâ kapsanmayan 1'ler için en az maliyetli PI kümesini seç.</p>
          <p><b>Seçim kuralı (slayt 43):</b> PI'ler arası örtüşmeyi azalt. Seçilen her PI, başka hiçbir seçili PI'nin kapsamadığı en az bir minterm içermeli.</p>`,
      },
      {
        t: 'Laboratuvar: PI ve EPI',
        html: `<p>Slayt 34: F(A,B,C,D) = Σm(0,2,3,8,9,10,11,12,13,14,15). Yeşil ★ olanlar essential.</p>
          <div class="demo"><div class="lab"></div><div class="calc labo" style="margin-top:8px"></div></div>
          <p class="note">Bir 1'e bak: onu kapsayan kaç PI var? Sadece bir taneyse o PI essential'dır.</p>`,
        init(el) { kmapLab(el, 'ABCD', { init: [0, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15].map(m => [m, 1]) }); },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>PI: genişletilemeyen en büyük grup</li>
          <li>EPI: bir 1'i kapsayan <b>tek</b> PI → zorunlu</li>
          <li>Algoritma: PI'ler → EPI'ler → kalanları en ucuz PI'lerle kapsa</li>
          <li>Her seçilen PI'nin kendine ait bir minterm'i olmalı</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.pi.count', name: 'Kaç prime implicant var?', ref: R('32–33'),
        gen() {
          const n = pick([3, 4]), vars = n === 3 ? 'ABC' : 'ABCD', f = niceFn(n, { maxT: 4 }), r = Bool.minSOP(f.ones, [], vars), t = ttFrom(f.ones, [], n);
          return inputTask({ q: `Bu fonksiyonun <b>kaç tane prime implicant</b>'ı var?${kmapHTML(vars, t)}`, qText: `PI sayısı Σm(${f.ones})`, answer: String(r.primes.length),
            why: `PI'ler: ${r.primes.map(c => `<span class="mono">${Bool.cubeStr(c, vars)}</span>`).join(', ')} → <b>${r.primes.length}</b>${kmapHTML(vars, t, { groups: r.primes })}<span class="note">Hepsi minimum çözümde kullanılmak zorunda değil.</span>`,
            hint: 'Her 1 için, onu içeren en büyük dikdörtgen(ler)i bul. Başka bir grubun içinde kalan grup prime değildir.' });
        },
      },
      {
        id: 'r4.pi.ess', name: 'Hangileri essential?', ref: R('32–34'),
        gen() {
          for (;;) {
            const n = 4, vars = 'ABCD', f = niceFn(n, { maxT: 4, minEss: 1 }), r = Bool.minSOP(f.ones, [], vars), t = ttFrom(f.ones, [], n);
            if (r.primes.length < 3 || r.primes.length > 7 || r.ess.length === r.primes.length) continue;
            const P = shuffle(r.primes), corr = P.map((c, i) => r.ess.includes(c) ? i : -1).filter(i => i >= 0);
            const own = c => f.ones.filter(m => Bool.cubeHas(c, m) && r.primes.filter(p => Bool.cubeHas(p, m)).length === 1);
            return choiceTask({ q: `Prime implicant'lardan hangileri <b>essential</b>?${kmapHTML(vars, t)}`, qText: `EPI seç Σm(${f.ones})`, multi: true, mono: true,
              options: P.map(c => Bool.cubeStr(c, vars)), correct: corr,
              why: r.ess.map(c => `${Bool.cubeStr(c, vars)}: m${own(c).join(', m')} sadece bu PI tarafından kapsanıyor`).join('<br>') + kmapHTML(vars, t, { groups: r.ess }) });
          }
        },
      },
      {
        id: 'r4.pi.steps', name: 'PI → EPI → minimum çözüm', ref: R('42–45'), long: true,
        gen() {
          const n = 4, vars = V4(), f = niceFn(n, { maxT: 4, minEss: 1 }), r = Bool.minSOP(f.ones, [], vars), t = ttFrom(f.ones, [], n);
          const covered = f.ones.filter(m => r.ess.some(c => Bool.cubeHas(c, m)));
          const left = f.ones.filter(m => !covered.includes(m));
          return stepTask({ q: `${Σ(f.ones, vars)}${kmapHTML(vars, t)}`, qText: `PI/EPI adımları Σm(${f.ones})`, rows: [
            { html: 'Prime implicant sayısı: [[0]]', fields: [{ answer: String(r.primes.length), w: 2 }], why: 'Her 1 için genişletilemeyen en büyük grupları say.', after: `PI'ler: ${r.primes.map(c => Bool.cubeStr(c, vars)).join(', ')}` },
            { html: 'Essential PI sayısı: [[0]]', fields: [{ answer: String(r.ess.length), w: 2 }], why: 'Sadece tek bir PI tarafından kapsanan 1\'leri bul.', after: `EPI'ler: ${r.ess.map(c => Bool.cubeStr(c, vars)).join(', ')}` },
            { html: 'EPI\'lerden sonra kapsanmayan minterm sayısı: [[0]]', fields: [{ answer: String(left.length), w: 2 }], why: `EPI'lerin kapsadığı: ${covered.join(', ')}.`, after: left.length ? `Kalan: ${left.join(', ')}` : 'Hepsi kapsandı!' },
            { html: 'F = [[0]]', fields: [Object.assign(Bool.exprField(t, vars, r.str, 18), { check: u => { try { const a = Bool.parse(u, vars), s = Bool.sopTerms(a); return Bool.ttMatch(Bool.ttOf(a, n), t) && !!s && Bool.cost(s).G <= r.cost.G; } catch (e) { return false; } } })], why: 'EPI\'leri al, kalanları en az maliyetle kapsayan PI\'leri ekle (minimum G).' },
          ], answer: r.str, why: `${groupWhy(r, vars)}<br>F = <b>${r.str}</b>` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 5 — Don't Care
     ================================================================= */
  const BCDF = [
    { d: '5 veya daha büyük (≥ 5)', f: x => x >= 5 }, { d: 'çift', f: x => x % 2 === 0 }, { d: '3\'e tam bölünebilir (0 dahil)', f: x => x % 3 === 0 },
    { d: 'asal (2, 3, 5, 7)', f: x => [2, 3, 5, 7].includes(x) }, { d: '7 veya daha büyük', f: x => x >= 7 }, { d: '2 ile 6 arasında (dahil)', f: x => x >= 2 && x <= 6 },
    { d: 'tek ve 3\'ten büyük', f: x => x % 2 === 1 && x > 3 }, { d: '4\'ten küçük', f: x => x < 4 },
  ];
  const S5 = {
    id: 'r4s5', title: "Don't Care", ref: R('38–41, 45'),
    lesson: [
      {
        t: "Don't care (x) nedir?",
        html: `<p>Bazen bir giriş kombinasyonu <b>hiç oluşmaz</b> ya da o durumda çıkış <b>kullanılmaz</b>. Bu durumda çıkışın 0 ya da 1 olması fark etmez: buna <b>don't care</b> denir ve haritaya <b>x</b> yazılır (slayt 38).</p>
          <p><b>Örnek:</b> BCD girişli bir devrede 1010 … 1111 (10–15) kodları asla gelmez → 6 tane x.</p>
          <div class="rule"><b>Kural:</b> Her x'i, işine yarıyorsa 1, yaramıyorsa 0 kabul et.<br>• x'leri sadece grupları <b>büyütmek</b> için kullan.<br>• x'leri kapsamak <b>zorunlu değildir</b>. Sadece x'lerden oluşan bir grup yapma.<br>• Aynı x, SOP çözümünde 1, POS çözümünde 0 olabilir (slayt 39).</div>`,
      },
      {
        t: 'BCD "5 veya daha büyük" (slayt 40)',
        html: `${kmapHTML('wxyz', ttFrom([5, 6, 7, 8, 9], [10, 11, 12, 13, 14, 15], 4), { groups: Bool.minSOP([5, 6, 7, 8, 9], [10, 11, 12, 13, 14, 15], 'wxyz').terms })}
          <p>x'leri kullanınca: F<sub>1</sub> = <b>w + xz + xy</b> (G = 7)<br>x'leri 0 sayınca: F<sub>2</sub> = w'xz + w'xy + wx'y' (G = 12)</p>
          <p>Don't care'ler maliyeti neredeyse yarıya indirdi!</p>`,
      },
      {
        t: 'Laboratuvar',
        html: `<p>Hücreye 1. dokunuş → 1, 2. → x, 3. → 0. x eklemenin minimum ifadeyi nasıl değiştirdiğini izle.</p>
          <div class="demo"><div class="lab"></div><div class="calc labo" style="margin-top:8px"></div></div>`,
        init(el) { kmapLab(el, 'wxyz', { allowX: true, init: [[5, 1], [6, 1], [7, 1], [8, 1], [9, 1], ...[10, 11, 12, 13, 14, 15].map(m => [m, 'x'])] }); },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>x = 0 ya da 1, hangisi işine yararsa</li>
          <li>x'i kapsamak zorunlu değil</li>
          <li>Sadece x'lerden grup yapma</li>
          <li>BCD girişlerde 10–15 → x</li>
          <li>F = Σm(…) + d(…) yazımı</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.dc.min', name: "Don't care ile minimum SOP", ref: R('38–41'), long: true,
        gen() {
          const { vars, f, r, t } = minTask(4, { pX: .17 });
          return Bool.exprTask({ q: `Minimum SOP (x'leri akıllıca kullan):<br>${Σ(f.ones, vars)} + d(${f.dc.join(', ')})${kmapHTML(vars, t)}`, qText: `dc Σm(${f.ones}) d(${f.dc}) → min SOP`, vars, answer: r.str,
            check: Bool.checker(t, vars, { form: 'sop', maxG: r.cost.G }),
            why: `${mapWithGroups(vars, t, r)}${groupWhy(r, vars)}<br>F = <b>${r.str}</b> (G = ${r.cost.G})`, hint: 'Bir x, bir grubu iki katına çıkarıyorsa onu 1 say.' });
        },
      },
      {
        id: 'r4.dc.bcd', name: 'BCD girişli fonksiyon', ref: R(40), long: true,
        gen() {
          for (;;) {
            const B = pick(BCDF), vars = 'wxyz', ones = [...Array(10).keys()].filter(B.f), dc = [10, 11, 12, 13, 14, 15];
            const r = Bool.minSOP(ones, dc, vars), t = ttFrom(ones, dc, 4);
            if (!r.terms.length) continue;
            return Bool.exprTask({ q: `Giriş wxyz bir <b>BCD rakamı</b> (0–9). Rakam <b>${B.d}</b> ise F = 1. 10–15 kodları hiç gelmez. Minimum SOP?`, vars, answer: r.str,
              check: Bool.checker(t, vars, { form: 'sop', maxG: r.cost.G }),
              why: `F = Σm(${ones.join(', ')}) + d(10, 11, 12, 13, 14, 15)${mapWithGroups(vars, t, r)}${groupWhy(r, vars)}<br>F = <b>${r.str}</b>`, hint: '10–15 hücrelerine x koy (alttaki iki satırın büyük kısmı).' });
          }
        },
      },
      {
        id: 'r4.dc.concept', name: "Don't care kavramı", ref: R('38–39'),
        gen() {
          const qs = [
            { q: 'Bir don\'t care (x) minimum çözümde nasıl kullanılır?', o: ['İşe yarıyorsa 1, yaramıyorsa 0 kabul edilir', 'Her zaman 1 kabul edilir', 'Her zaman 0 kabul edilir', 'Mutlaka bir grupla kapsanmalıdır'], c: 0, w: 'x\'in değeri serbesttir. Grubu büyütüyorsa 1, gerekmiyorsa 0 kabul et. Kapsamak zorunlu değil.' },
            { q: 'BCD girişli bir devrede kaç tane don\'t care kombinasyonu vardır?', o: ['6', '4', '10', '16'], c: 0, w: '4 bit → 16 kod. BCD sadece 0–9\'u (10 kod) kullanır → 16 − 10 = 6 (1010 … 1111).' },
            { q: 'Aynı x hücresi SOP ve POS çözümlerinde farklı değer alabilir mi?', o: ['Evet', 'Hayır'], c: 0, w: 'Slayt 39: bir x, SOP çözümünde 1, POS çözümünde 0 olarak kullanılabilir (ya da tersi).' },
            { q: 'Sadece x\'lerden oluşan bir grup eklemek maliyeti nasıl etkiler?', o: ['Boşuna maliyet ekler, yapılmaz', 'Maliyeti azaltır', 'Zorunludur'], c: 0, w: 'x\'leri kapsamak gerekmez. Sadece x içeren bir terim hiçbir 1\'i kapsamaz, sadece kapı ekler.' },
          ];
          const x = pick(qs), opts = shuffle(x.o);
          return choiceTask({ q: x.q, options: opts, correct: opts.indexOf(x.o[x.c]), why: x.w });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 6 — POS K-map
     ================================================================= */
  const S6 = {
    id: 'r4s6', title: 'POS ile K-map', ref: R('30, 41'),
    lesson: [
      {
        t: "0'ları grupla",
        html: `<p>Minimum <b>POS</b> için 1'ler yerine <b>0'ları</b> gruplarsın. Aslında F'nin (F'nin 1'leri = F'nin 0'ları) minimum SOP'sini bulup De Morgan uygularsın.</p>
          <div class="rule"><b>Okuma kuralı (POS):</b> grupta<br>• hep <b>0</b> olan değişken → <b>düz</b> yaz<br>• hep <b>1</b> olan değişken → <b>tümleyenli</b> yaz<br>• değişen → yazma<br>Her grup bir <b>toplam</b> terimi verir, terimler AND'lenir.</div>
          <p>Ör: x=0, z=1 sabit olan bir 0-grubu → <span class="mono">(x + z')</span></p>
          <p><b>Slayt 30:</b> f = ΠM(1,4,5,8,11,12,14) → (w + y + z')(w' + x + y' + z')(x' + y + z)(w' + x' + z) …(bir kısmı seçmeli)</p>`,
      },
      {
        t: 'Laboratuvar (POS)',
        html: `<p>Hücrelere dokunarak 1 koy. Bu sefer gruplar <b>0'ları</b> kapsıyor.</p>
          <div class="demo"><div class="lab"></div><div class="calc labo" style="margin-top:8px"></div></div>`,
        init(el) { kmapLab(el, 'wxyz', { pos: true, init: [0, 2, 3, 6, 7, 9, 10, 13, 15].map(m => [m, 1]) }); },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>POS: 0'ları grupla</li>
          <li>Hep 0 → x (düz), hep 1 → x' (tümleyen)</li>
          <li>Her grup → (toplam), terimler çarpılır</li>
          <li>ΠM(…) listesi = haritadaki 0'lar</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.pos.read', name: "0-grubunun toplam terimi", ref: R(30),
        gen() {
          const n = pick([3, 4]), vars = n === 3 ? V3() : V4();
          const k = rnd(1, n - 2), bits = shuffle([...Array(n).keys()]).slice(0, k), d = bits.reduce((s, b) => s | (1 << b), 0);
          const v = rnd(0, 2 ** n - 1) & ~d, c = { v, d }, ans = Bool.cubeSumStr(c, vars);
          const t = Array.from({ length: 2 ** n }, (_, m) => Bool.cubeHas(c, m) ? 0 : 1);
          return Bool.exprTask({ q: `Renkli <b>0</b> grubunun ifade ettiği <b>toplam</b> terimi nedir?${kmapHTML(vars, t, { groups: [c] })}`, qText: `POS grup → toplam terimi (${ans})`, vars, answer: ans,
            check: I => { const r = Bool.checker(t, vars, { form: 'pos' })(I); return r.ok && I.pos.length !== 1 ? { ok: false, msg: 'Tek bir toplam terimi yaz.' } : r; },
            why: `Sabit değişkenler: ${[...vars].map((x, i) => { const b = 1 << (n - 1 - i); return d & b ? null : `${x}=${v & b ? 1 : 0} → ${v & b ? x + "'" : x}`; }).filter(Boolean).join(', ')} → <b>${ans}</b><br>POS'ta 0 → düz, 1 → tümleyen (SOP'nin tersi).` });
        },
      },
      {
        id: 'r4.pos.min', name: 'K-map → minimum POS', ref: R('30, 41'), long: true,
        gen() {
          const n = pick([3, 4, 4]), vars = n === 3 ? V3() : V4();
          let f, r;
          for (;;) { f = niceFn(n, { pOne: .58, maxT: 4 }); r = Bool.minPOS(f.ones, [], vars); if (r.terms.length >= 2 && r.terms.length <= 4) break; }
          const t = ttFrom(f.ones, [], n), z = zerosOf(f.ones, [], n);
          return Bool.exprTask({ q: `Minimum <b>POS</b> ifadesini yaz:<br>${Π(z, vars)}${kmapHTML(vars, t)}`, qText: `POS ΠM(${z}) → min POS`, vars, answer: r.str, placeholder: "ör. (A + B')(C + D)",
            check: Bool.checker(t, vars, { form: 'pos', maxG: r.cost.G }),
            why: `${kmapHTML(vars, t, { groups: r.terms })}${groupWhy(r, vars, true)}<br>F = <b>${r.str}</b> (G = ${r.cost.G})`, hint: "0'ları grupla. Grupta hep 0 olan değişken düz, hep 1 olan tümleyenli yazılır." });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 7 — Quine-McCluskey
     ================================================================= */
  /** QM tablosu: aşamalar → [{cube, used, mins}] */
  function qmStages(ones, dc, n) {
    let cur = [...new Set([...ones, ...dc])].sort((a, b) => Bool.pop(a) - Bool.pop(b) || a - b).map(m => ({ v: m, d: 0, mins: [m] }));
    const st = [];
    while (cur.length) {
      const used = new Set(), next = new Map();
      for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
        const a = cur[i], b = cur[j];
        if (a.d !== b.d || Bool.pop(a.v ^ b.v) !== 1) continue;
        used.add(i); used.add(j);
        const diff = a.v ^ b.v, c = { v: a.v & ~diff, d: a.d | diff };
        const key = c.v + ':' + c.d;
        if (!next.has(key)) next.set(key, Object.assign(c, { mins: [...a.mins, ...b.mins].sort((x, y) => x - y) }));
      }
      st.push(cur.map((c, i) => Object.assign(c, { used: used.has(i) })));
      cur = [...next.values()].sort((a, b) => Bool.pop(a.v) - Bool.pop(b.v));
    }
    return st;
  }
  const qmHTML = (st, n) => `<div class="qm">${st.map((col, k) => `<table class="t"><tr><th colspan="2">${k === 0 ? 'mintermler' : `${2 ** k}'li gruplar`}</th></tr>${col.map(c => `<tr><td>${c.mins.join(',')}</td><td class="mono">${Bool.cubePat(c, n)} ${c.used ? '✓' : '<b style="color:var(--led)">PI</b>'}</td></tr>`).join('')}</table>`).join('')}</div>`;
  const S7 = {
    id: 'r4s7', title: 'Quine-McCluskey', ref: R('46–55'),
    lesson: [
      {
        t: 'Neden QM?',
        html: `<p>K-map 5–6 değişkenden sonra pratik değildir. <b>Quine-McCluskey</b> aynı işi bir tablo algoritmasıyla yapar, bilgisayara uygundur (slayt 46).</p>
          <div class="rule"><b>1. faz:</b> Bütün prime implicant'ları bul.<br><b>2. faz:</b> Prime implicant'lardan minimum örtüyü seç (coverage table / Petrick).</div>
          <p><b>1. faz nasıl yapılır?</b><br>1. Mintermleri ikili yaz, <b>içindeki 1 sayısına göre</b> grupla.<br>2. Komşu gruplardaki (1 sayısı 1 farklı) terimleri karşılaştır. Sadece <b>bir bitte</b> farklıysa birleştir, o bite <b>−</b> yaz, ikisini de ✓ ile işaretle.<br>3. Yeni tabloyla tekrarla (tireler <b>aynı yerde</b> olmalı).<br>4. Hiç ✓ almayan terimler <b>prime implicant</b>'tır.</p>`,
      },
      {
        t: 'QM tablosu (canlı)',
        html: `<p>Σm listesini değiştir. Tablo otomatik oluşsun (slayt 47 örneği yüklü).</p>
          <div class="demo">f(x1,x2,x3,x4) = Σm( <input class="txt ql" value="1,3,5,6,7,8,12,14,15" style="width:22ch"> )<div class="qmo"></div></div>`,
        init(el) {
          const inp = $('.ql', el), o = $('.qmo', el);
          const show = () => {
            const L = Bool.parseList(inp.value);
            if (!L || L.some(x => x > 15)) { o.innerHTML = '<span class="dim">0–15 arası sayılar gir</span>'; return; }
            const r = Bool.minSOP(L, [], 'ABCD');
            o.innerHTML = qmHTML(qmStages(L, [], 4), 4) + `<p>Prime implicant'lar: ${r.primes.map(c => `<span class="mono">${Bool.cubePat(c, 4)}</span>`).join(', ')}<br>Minimum: <span class="mono">${r.str}</span> <span class="dim">(değişkenler A=x1, B=x2, C=x3, D=x4)</span></p>`;
          };
          inp.oninput = show; show();
        },
      },
      {
        t: '2. faz: coverage table',
        html: `<p>Satırlar PI'ler, sütunlar mintermler. Bir PI bir mintermi kapsıyorsa X koy.</p>
          <div class="rule">• Bir sütunda <b>tek X</b> varsa o satırdaki PI <b>essential</b>'dır → seç.<br>• EPI'lerin kapsadığı sütunları sil.<br>• Kalanlar için en ucuz PI'leri seç.<br><b>Petrick yöntemi:</b> Her minterm için onu kapsayan PI'lerin toplamını yaz, hepsini çarp: P = (C)(C+D)(A+B)… Sadeleştir (X + XY = X), en ucuz çarpımı seç.</div>
          <p class="note">Slayt 48–49: f = Σm(1,3,5,6,7,8,12,14,15) → x1x3'x4' + x1'x4 + x2x3</p>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Grupla: 1 sayısına göre</li>
          <li>Birleştir: sadece 1 bit farklı → o bit −</li>
          <li>Tireler aynı konumda olmalı</li>
          <li>✓ almayan = prime implicant</li>
          <li>Coverage: tek X'li sütun → EPI</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.qm.group', name: 'Mintermi grupla (1 sayısı)', ref: R(47),
        gen() {
          const ms = shuffle([...Array(16).keys()]).slice(0, rnd(5, 8)).sort((a, b) => a - b);
          const k = pick([...new Set(ms.map(Bool.pop))].filter(x => x > 0 && x < 4).concat([1]));
          const g = ms.filter(m => Bool.pop(m) === k);
          if (!g.length) return this.gen();
          return inputTask({ q: `f = Σm(${ms.join(', ')}) (4 değişken). QM'nin ilk adımında <b>tam ${k} tane 1</b> içeren gruptaki mintermler hangileri?`, answer: g.join(', '),
            check: u => listQ(u, g), placeholder: 'ör. 3 5 6',
            why: ms.map(m => `${m}=${bin(m, 4)} (${Bool.pop(m)})`).join(', ') + `<br>${k} tane 1: <b>${g.join(', ')}</b>` });
        },
      },
      {
        id: 'r4.qm.combine', name: 'İki terimi birleştir', ref: R(47),
        gen() {
          const n = 4, stage = Math.random() < .5 ? 0 : 1;
          let a, b;
          if (stage === 0) { a = rnd(0, 15); b = a ^ (1 << rnd(0, 3)); }
          else { const d = 1 << rnd(0, 3); let v = rnd(0, 15) & ~d, e; do { e = 1 << rnd(0, 3); } while (e === d); a = { v: v & ~e, d }; b = { v: v | e, d }; }
          const A = stage === 0 ? { v: Math.min(a, b), d: 0 } : a, Bc = stage === 0 ? { v: Math.max(a, b), d: 0 } : b;
          const diff = A.v ^ Bc.v, c = { v: A.v & ~diff, d: A.d | diff }, ans = Bool.cubePat(c, n);
          return inputTask({ q: `QM: <span class="mono">${Bool.cubePat(A, n)}</span> ile <span class="mono">${Bool.cubePat(Bc, n)}</span> birleşince ne olur? <span class="sub">0, 1 ve − kullan (ör. 0-01)</span>`, answer: ans, placeholder: 'ör. 0-01', keys: '01-',
            check: u => u.replace(/\s/g, '').replace(/[–—_]/g, '-') === ans,
            why: `Sadece bir bit farklı (${[...Bool.cubePat(A, n)].map((x, i) => x !== Bool.cubePat(Bc, n)[i] ? i + 1 : 0).filter(Boolean).join('')}. bit). O bite − yazılır, diğerleri aynen kalır → <b>${ans}</b>` });
        },
      },
      {
        id: 'r4.qm.can', name: 'Birleşebilir mi?', ref: R(47),
        gen() {
          const n = 4, d = Math.random() < .5 ? 0 : 1 << rnd(0, 3), a = { v: rnd(0, 15) & ~d, d };
          const freeBits = [0, 1, 2, 3].map(i => 1 << i).filter(b => !(b & d));
          const kind = pick(['one', 'one', 'two', 'dash']);
          let b;
          if (kind === 'one') b = { v: a.v ^ pick(freeBits), d };
          else if (kind === 'two') { const [p, q] = shuffle(freeBits); b = { v: a.v ^ p ^ q, d }; }
          else { const nd = pick(freeBits); b = { v: (a.v ^ pick(freeBits.filter(x => x !== nd).concat(d || 1))) & ~nd & 15, d: nd }; if (b.d === a.d) b.d = a.d ? 0 : 1; b.v &= ~b.d; }
          const ok = a.d === b.d && Bool.pop(a.v ^ b.v) === 1;
          const pa = Bool.cubePat(a, n), pb = Bool.cubePat(b, n);
          return choiceTask({ q: `QM'de <span class="mono">${pa}</span> ile <span class="mono">${pb}</span> birleştirilebilir mi?`, options: ['Evet', 'Hayır'], correct: ok ? 0 : 1,
            why: a.d !== b.d ? 'Hayır: tireler (−) aynı konumlarda değil.' : ok ? 'Evet: tireler aynı yerde ve tam bir bit farklı.' : `Hayır: ${Bool.pop(a.v ^ b.v)} bit farklı. Birleştirmek için tam 1 bit farkı gerekir.` });
        },
      },
      {
        id: 'r4.qm.steps', name: 'QM ile çöz', ref: R('47–49'), long: true,
        gen() {
          const n = 4, vars = 'ABCD', f = niceFn(4, { maxT: 4, minEss: 1, pOne: .42 }), r = Bool.minSOP(f.ones, [], vars), st = qmStages(f.ones, [], n);
          const cnt = k => f.ones.filter(m => Bool.pop(m) === k).length;
          const pis = r.primes.map(c => Bool.cubePat(c, n)).sort();
          const t = ttFrom(f.ones, [], n);
          return stepTask({ q: `f(A,B,C,D) = Σm(${f.ones.join(', ')}) fonksiyonunu Quine-McCluskey ile sadeleştir.`, rows: [
            { html: '1 sayısına göre grup boyutları: 0→[[0]] 1→[[1]] 2→[[2]] 3→[[3]] 4→[[4]]', fields: [0, 1, 2, 3, 4].map(k => ({ answer: String(cnt(k)), w: 1 })), why: 'Her mintermi ikili yaz, içindeki 1\'leri say.', after: f.ones.map(m => `${m}:${bin(m, 4)}`).join(' ') },
            { html: 'Birinci birleştirmede kaç 2\'li terim oluşur? [[0]]', fields: [{ answer: String((st[1] || []).length), w: 2 }], why: 'Komşu gruplardan, sadece 1 bitte farklı bütün çiftleri say.', after: (st[1] || []).map(c => `${c.mins.join(',')}: ${Bool.cubePat(c, n)}`).join(' · ') || 'hiç yok' },
            { html: 'Toplam prime implicant sayısı: [[0]]', fields: [{ answer: String(r.primes.length), w: 2 }], why: 'Bütün aşamalarda ✓ almayan terimleri say.', after: `PI: ${pis.join(', ')}` },
            { html: 'Essential PI sayısı: [[0]]', fields: [{ answer: String(r.ess.length), w: 2 }], why: 'Coverage table\'da tek X içeren sütunlar.', after: `EPI: ${r.ess.map(c => Bool.cubePat(c, n)).join(', ')}` },
            { html: 'f = [[0]]', fields: [Object.assign(Bool.exprField(t, vars, r.str, 18), { check: u => { try { const a = Bool.parse(u, vars), s = Bool.sopTerms(a); return Bool.ttMatch(Bool.ttOf(a, n), t) && !!s && Bool.cost(s).G <= r.cost.G; } catch (e) { return false; } } })], why: 'EPI\'ler + kalanları kapsayan en ucuz PI\'ler. Desen → terim: 1 → düz, 0 → tümleyen, − → yok.' },
          ], answer: r.str, why: `${qmHTML(st, n)}f = <b>${r.str}</b>` });
        },
      },
      {
        id: 'r4.qm.cover', name: 'Coverage table: EPI seç', ref: R('48, 53–54'),
        gen() {
          for (;;) {
            const vars = 'ABCD', f = niceFn(4, { maxT: 4, minEss: 1 }), r = Bool.minSOP(f.ones, [], vars);
            if (r.primes.length < 3 || r.primes.length > 6 || r.ess.length === r.primes.length) continue;
            const P = r.primes, labels = 'PQRSTU';
            const tbl = `<table class="t"><tr><th></th>${f.ones.map(m => `<th>${m}</th>`).join('')}</tr>${P.map((c, i) => `<tr><th>${labels[i]} <span class="mono dim">${Bool.cubePat(c, 4)}</span></th>${f.ones.map(m => `<td>${Bool.cubeHas(c, m) ? 'X' : ''}</td>`).join('')}</tr>`).join('')}</table>`;
            const corr = P.map((c, i) => r.ess.includes(c) ? i : -1).filter(i => i >= 0);
            return choiceTask({ q: `Coverage table'a göre hangi prime implicant'lar <b>essential</b>?${tbl}`, qText: `Coverage EPI Σm(${f.ones})`, multi: true,
              options: P.map((c, i) => `${labels[i]} (${Bool.cubePat(c, 4)})`), correct: corr,
              why: `Tek X içeren sütunlar: ${f.ones.filter(m => P.filter(c => Bool.cubeHas(c, m)).length === 1).map(m => `${m} → ${labels[P.findIndex(c => Bool.cubeHas(c, m))]}`).join(', ')}. Bu satırlar essential.` });
          }
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 8 — XOR · NAND · NOR
     ================================================================= */
  const F16 = { 0: 'F0 = 0 (sabit)', 1: 'AND (xy)', 6: 'XOR (x ⊕ y)', 7: 'OR (x + y)', 8: 'NOR ((x + y)\')', 9: 'XNOR (x ⊙ y)', 14: 'NAND ((xy)\')', 15: 'F15 = 1 (sabit)', 3: 'F3 = x (transfer)', 5: 'F5 = y (transfer)', 12: "F12 = x' (NOT)", 10: "F10 = y' (NOT)" };
  const S8 = {
    id: 'r4s8', title: 'XOR · NAND · NOR', ref: R('58–75'),
    lesson: [
      {
        t: '16 iki değişkenli fonksiyon',
        html: `<p>İki girişle 2<sup>2</sup> = 4 satır, her satır 0/1 → 2<sup>4</sup> = <b>16 farklı fonksiyon</b> vardır (slayt 59). AND, OR, NOT bunlardan sadece üçü.</p>
          <table class="t"><tr><th>x y</th>${[...Array(16).keys()].map(i => `<th>F${i}</th>`).join('')}</tr>
          ${[0, 1, 2, 3].map(r => `<tr><td>${bin(r, 2)}</td>${[...Array(16).keys()].map(i => `<td>${(i >> (3 - r)) & 1}</td>`).join('')}</tr>`).join('')}</table>
          <div class="rule">F<sub>i</sub>'nin sütunu, i'nin 4 bitlik ikili yazılışıdır (üstten alta). Önemliler: F1 = AND, F6 = XOR, F7 = OR, F8 = NOR, F9 = XNOR, F14 = NAND.</div>`,
      },
      {
        t: 'XOR ve XNOR',
        html: `<p><b>XOR:</b> x ⊕ y = x'y + xy' → "x ya da y, ama ikisi birden değil". <b>XNOR</b> (equivalence): (x ⊕ y)' = xy + x'y' → "x, y'ye eşitse 1".</p>
          <table class="t"><tr><th>x y</th><th>XOR</th><th>XNOR</th></tr>${[0, 1, 2, 3].map(r => `<tr><td>${bin(r, 2)}</td><td>${(r >> 1) ^ (r & 1)}</td><td>${1 - ((r >> 1) ^ (r & 1))}</td></tr>`).join('')}</table>
          <div class="rule">• Çok girişte XOR = <b>odd function</b>: tek sayıda 1 → 1 (slayt 67).<br>• x ⊕ 0 = x, x ⊕ 1 = x', x ⊕ x = 0, x ⊕ x' = 1<br>• Kullanım: toplayıcılar, sayıcılar, <b>parity</b> üreteç/denetleyicileri</div>`,
      },
      {
        t: 'Universal kapılar: NAND ve NOR',
        html: `<p>Her fonksiyon AND, OR, NOT ile yazılabilir. Bu üçü sadece NAND'larla (ya da sadece NOR'larla) yapılabiliyorsa, NAND (NOR) <b>universal</b>'dır (slayt 69–71).</p>
          <table class="t"><tr><th></th><th>NAND ile</th><th>kapı</th><th>NOR ile</th><th>kapı</th></tr>
          <tr><td>NOT x</td><td>(xx)'</td><td>1</td><td>(x + x)'</td><td>1</td></tr>
          <tr><td>x AND y</td><td>((xy)')'</td><td>2</td><td>(x' + y')'</td><td>3</td></tr>
          <tr><td>x OR y</td><td>(x'y')'</td><td>3</td><td>((x + y)')'</td><td>2</td></tr></table>
          <div class="rule"><b>NAND/NOR associative değildir</b> (slayt 75): ((xy)'z)' = xy + z' ama (x(yz)')' = x' + yz. Bu yüzden 3 girişli NAND, iki tane 2 girişli NAND'ı art arda bağlayarak <b>yapılamaz</b>.</div>
          <p><b>Buffer</b> (F = X): mantıksal olarak bir bağlantıdır ama gerilim seviyelerini iyileştirir ve hızı artırır (slayt 63).</p>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>16 fonksiyon: F<sub>i</sub> sütunu = i'nin ikilisi</li>
          <li>F1 AND · F6 XOR · F7 OR · F8 NOR · F9 XNOR · F14 NAND</li>
          <li>XOR: tek sayıda 1 → 1 · x⊕1 = x'</li>
          <li>NAND: NOT 1, AND 2, OR 3 kapı</li>
          <li>NOR: NOT 1, OR 2, AND 3 kapı</li>
          <li>NAND/NOR commutative ama associative değil</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r4.g.f16', name: '16 fonksiyon: hangisi?', ref: R('59–61'),
        gen() {
          const keys = Object.keys(F16).map(Number), i = pick(keys);
          if (Math.random() < .5) {
            const col = bin(i, 4), opts = shuffle([i, ...shuffle(keys.filter(k => k !== i)).slice(0, 3)]);
            return choiceTask({ q: `x y = 00, 01, 10, 11 için çıkış sütunu <span class="mono">${col.split('').join(', ')}</span>. Bu hangi fonksiyon?`, options: opts.map(k => F16[k]), correct: opts.indexOf(i),
              why: `Sütun ${col} → ikili ${col} = ${i} → <b>${F16[i]}</b>` });
          }
          return inputTask({ q: `<b>${F16[i]}</b> fonksiyonu 16 iki değişkenli fonksiyondan hangisi? F<sub>i</sub>, i = ?`, answer: String(i),
            why: `Çıkış sütunu (xy = 00, 01, 10, 11): ${bin(i, 4)} → ikiliden onluğa = <b>${i}</b>` });
        },
      },
      {
        id: 'r4.g.xor', name: 'XOR / XNOR', ref: R('66–68'),
        gen() {
          if (Math.random() < .55) {
            const k = rnd(2, 4), a = Array.from({ length: k }, () => rnd(0, 1)), xn = Math.random() < .3, s = a.reduce((x, y) => x ^ y, 0), y = xn ? 1 - s : s;
            const names = 'ABCD'.slice(0, k);
            return inputTask({ q: `${xn ? `(${[...names].join(' ⊕ ')})'` : [...names].join(' ⊕ ')} = ? &nbsp; <span class="mono">${[...names].map((v, i) => `${v}=${a[i]}`).join(', ')}</span>`, answer: String(y), placeholder: '0 veya 1',
              why: `${a.filter(x => x).length} tane 1 var → ${s ? 'tek' : 'çift'} → XOR = ${s}${xn ? `, tümleyeni = ${y}` : ''}. Sonuç: <b>${y}</b>` });
          }
          const ids = [['x ⊕ 0', 'x'], ['x ⊕ 1', "x'"], ['x ⊕ x', '0'], ["x ⊕ x'", '1'], ["x' ⊕ y'", 'x ⊕ y'], ["x ⊕ y'", "(x ⊕ y)'"]];
          const [l, rr] = pick(ids), opts = shuffle([...new Set([rr, ...shuffle(['x', "x'", '0', '1', 'x ⊕ y', "(x ⊕ y)'", 'y']).filter(o => o !== rr).slice(0, 3)])]);
          return choiceTask({ q: `${E(l)} = ?`, options: opts.map(E), correct: opts.indexOf(rr), mono: true, why: `x ⊕ y = x'y + xy'. Yerine koy: ${E(l)} = <b>${rr}</b>` });
        },
      },
      {
        id: 'r4.g.nand', name: 'NAND/NOR ile kaç kapı?', ref: R('69–71'),
        gen() {
          const g = pick(['NAND', 'NOR']), f = pick(['NOT', 'AND', 'OR']);
          const N = { NAND: { NOT: 1, AND: 2, OR: 3 }, NOR: { NOT: 1, OR: 2, AND: 3 } }[g][f];
          const how = { NAND: { NOT: "(xx)' = x'", AND: "((xy)')' : NAND + NAND'lı NOT", OR: "(x'y')' : iki NOT + bir NAND" }, NOR: { NOT: "(x + x)' = x'", OR: "((x + y)')' : NOR + NOR'lu NOT", AND: "(x' + y')' : iki NOT + bir NOR" } }[g][f];
          return inputTask({ q: `Sadece 2 girişli <b>${g}</b> kapıları kullanarak <b>${f}</b> işlemi en az kaç kapıyla yapılır?`, answer: String(N), why: `${how} → <b>${N}</b> kapı` });
        },
      },
      {
        id: 'r4.g.assoc', name: 'NAND zinciri: ifadeyi aç', ref: R(75),
        gen() {
          const vars = 'xyz', which = pick([0, 1, 2, 3]);
          const C = [
            { s: "((xy)'z)'", a: "xy + z'" }, { s: "(x(yz)')'", a: "x' + yz" },
            { s: "((x + y)' + z)'", a: "(x + y)z'" }, { s: "(x + (y + z)')'", a: "x'(y + z)" },
          ][which];
          const t = Bool.tt(C.s, vars);
          return Bool.exprTask({ q: `${E(C.s)} ifadesini De Morgan ile <b>parantez dışında tümleyen kalmayacak</b> şekilde sadeleştir.`, vars, answer: C.a,
            check: I => { const r = Bool.checker(t, vars)(I); if (r.ok && /\)'/.test(I.str.replace(/\s/g, ''))) return { ok: false, msg: 'Eşdeğer ama hâlâ parantez dışında tümleyen var.' }; return r; },
            why: `Dıştaki tümleyeni De Morgan ile içeri al: ${E(C.s)} = <b>${C.a}</b>. Bu yüzden NAND/NOR <b>associative değildir</b>: parantezin yeri sonucu değiştirir.` });
        },
      },
      {
        id: 'r4.g.concept', name: 'Kapı türleri kavramları', ref: R('58, 63–67, 69, 75'),
        gen() {
          const qs = [
            { q: 'NAND kapısı neden <b>universal</b> kabul edilir?', o: ['Sadece NAND\'larla NOT, AND ve OR yapılabildiği için', 'En hızlı kapı olduğu için', 'Associative olduğu için', 'XOR\'u içerdiği için'], c: 0, w: 'AND, OR, NOT ile her fonksiyon yazılabilir. Üçü de NAND ile yapılabiliyorsa NAND da her fonksiyonu yapabilir.' },
            { q: 'Buffer (F = X) mantıksal olarak bir bağlantıdır. Neden kullanılır?', o: ['Gerilim seviyelerini iyileştirmek ve hızı artırmak için', 'Sinyali tersine çevirmek için', 'Maliyeti azaltmak için'], c: 0, w: 'Slayt 63: buffer elektronik bir yükselteçtir. Mantık değiştirmez.' },
            { q: 'NAND ve NOR kapıları için hangisi doğru?', o: ['Commutative ama associative değil', 'Hem commutative hem associative', 'Associative ama commutative değil', 'İkisi de değil'], c: 0, w: 'Slayt 75: ((xy)\'z)\' ≠ (x(yz)\')\'. Giriş sırasını değiştirmek sorun değil ama gruplamak sonucu değiştirir.' },
            { q: 'XOR ve XNOR kapıları neden <b>complex gate</b> sayılır?', o: ['Tanımları için birden fazla temel işlem türü (AND ve OR) gerekir', 'Üç girişli oldukları için', 'Universal oldukları için'], c: 0, w: 'Primitive gate: tek işlem türü (AND ya da OR) + isteğe bağlı tümleme. XOR = x\'y + xy\' hem AND hem OR içerir.' },
            { q: 'Çok girişli XOR fonksiyonuna ne ad verilir?', o: ['Odd function', 'Even function', 'Majority function'], c: 0, w: 'Slayt 67: tek sayıda giriş 1 olunca 1 → odd function. XNOR\'un karşılığı even function.' },
            { q: 'XOR kapılarının tipik kullanım alanı hangisi değildir?', o: ['Bellek hücresi (flip-flop) yapmak', 'Toplayıcı/çıkarıcı', 'Parity üreteci/denetleyicisi', 'Sayıcı'], c: 0, w: 'Slayt 67: XOR toplayıcılar, sayıcılar ve parity devrelerinde kullanılır.' },
          ];
          const x = pick(qs), opts = shuffle(x.o);
          return choiceTask({ q: x.q, options: opts, correct: opts.indexOf(x.o[x.c]), why: x.w });
        },
      },
    ],
  };

  Registry.addRegion({
    id: 'r4', chip: 'U4', name: 'Harita Vadisi', lec: 'Lecture 4–5', ref: 'Lecture 4–5',
    stations: [S1, S2, S3, S4, S5, S6, S7, S8],
  });
})();
