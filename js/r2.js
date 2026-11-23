'use strict';
/* =====================================================================
   BÖLGE U2 — TEOREM ORMANI  (Lecture 2: Boolean cebri)
   ===================================================================== */
(() => {
  const R = s => `Lecture 2 · slayt ${s}`;
  const V3 = () => pick(['ABC', 'XYZ', 'xyz']);
  /** ifade şablonundaki X,Y,Z yer tutucularını gerçek alt ifadelerle değiştir */
  const subst = (tpl, map) => tpl.replace(/[XYZ]/g, c => map[c]);
  /** yer tutucu → rastgele literal ya da küçük terim */
  function randMap(vars) {
    const V = shuffle([...vars]);
    const lit = v => v + (Math.random() < .3 ? "'" : '');
    return { X: lit(V[0]), Y: lit(V[1]), Z: lit(V[2] || V[0]) };
  }
  /** x' → (x)' gibi şablon içi tümleyen: X'' oluşursa sadeleştir */
  const tidy = s => s.replace(/(\w)''/g, '$1');
  const ttEq = (a, b, vars) => Bool.tt(a, vars).join('') === Bool.tt(b, vars).join('');
  const TH = {
    id: 'Identity element', nul: 'Null element', idem: 'Idempotency', inv: 'Involution', comp: 'Complement',
    comm: 'Commutative', assoc: 'Associative', dist: 'Distributive', abs: 'Absorption', minz: 'Minimization (Combining)',
    simp: "Simplification (X + X'Y)", cons: 'Consensus', dm: "De Morgan",
  };
  /** teorem örnekleri: [isim, sol, sağ] — X,Y,Z yer tutucu */
  const IDS = [
    ['id', 'X·1', 'X'], ['id', 'X + 0', 'X'], ['nul', 'X·0', '0'], ['nul', 'X + 1', '1'],
    ['idem', 'X·X', 'X'], ['idem', 'X + X', 'X'], ['inv', "(X')'", 'X'], ['comp', "X·X'", '0'], ['comp', "X + X'", '1'],
    ['comm', 'X + Y', 'Y + X'], ['comm', 'XY', 'YX'], ['assoc', 'X + (Y + Z)', '(X + Y) + Z'], ['assoc', 'X(YZ)', '(XY)Z'],
    ['dist', 'X(Y + Z)', 'XY + XZ'], ['dist', 'X + YZ', '(X + Y)(X + Z)'],
    ['abs', 'X + XY', 'X'], ['abs', 'X(X + Y)', 'X'], ['minz', "XY + XY'", 'X'], ['minz', "(X + Y)(X + Y')", 'X'],
    ['simp', "X + X'Y", 'X + Y'], ['simp', "X(X' + Y)", 'XY'],
    ['cons', "XY + X'Z + YZ", "XY + X'Z"], ['cons', "(X + Y)(X' + Z)(Y + Z)", "(X + Y)(X' + Z)"],
    ['dm', "(X + Y)'", "X'Y'"], ['dm', "(XY)'", "X' + Y'"],
  ];
  /** gerçek harflerle örnek üret (X,Y,Z = farklı değişkenler, bazen tümleyenli) */
  function inst(row, vars = 'ABC') {
    const V = shuffle([...vars]), m = { X: V[0], Y: V[1], Z: V[2] };
    if (Math.random() < .3) m.Y = m.Y + "'";
    const f = s => tidy(s.replace(/[XYZ]/g, c => m[c])).replace(/([A-Za-z'])·([A-Za-z(])/g, '$1$2');
    return { name: row[0], L: f(row[1]), R: f(row[2]), raw: row };
  }

  /* =================================================================
     İSTASYON 1 — AND · OR · NOT & Doğruluk Tablosu
     ================================================================= */
  const S1 = {
    id: 'r2s1', title: 'AND · OR · NOT & Doğruluk Tablosu', ref: R('2–10, 22'),
    lesson: [
      {
        t: 'İkili değişkenler ve 3 temel işlem',
        html: `<p>Bir <b>binary variable</b> sadece iki değer alabilir: 1/0, True/False, On/Off. Lojik tasarımın tamamı üç temel işlem üzerine kurulur:</p>
          <table class="t"><tr><th>İşlem</th><th>Yazılışı</th><th>Okunuşu</th><th>Ne zaman 1?</th></tr>
          <tr><td>AND</td><td>A·B veya AB</td><td>"A and B"</td><td>ikisi de 1 ise</td></tr>
          <tr><td>OR</td><td>A + B</td><td>"A or B"</td><td>en az biri 1 ise</td></tr>
          <tr><td>NOT</td><td>A' veya Ā veya ~A</td><td>"not A"</td><td>A = 0 ise</td></tr></table>
          <div class="rule"><b>Dikkat (slayt 6):</b> Burada <b class="mono">1 + 1 = 1</b> ("1 OR 1 eşittir 1"). Bu bir toplama değil! Sıradan aritmetikteki 1 + 1 = 2 ile karıştırma.</div>
          <div class="demo"><div class="row"><b>A</b><span class="la"></span><b>B</b><span class="lb"></span></div><div class="calc gout mono"></div></div>`,
        init(el) {
          let a = 1, b = 0;
          const led = (h, v, f) => { h.innerHTML = `<button class="ledbtn ${v ? 'on' : ''}"></button>`; $('button', h).onclick = f; };
          const draw = () => {
            led($('.la', el), a, () => { a ^= 1; Sound.tick(); draw(); }); led($('.lb', el), b, () => { b ^= 1; Sound.tick(); draw(); });
            $('.gout', el).innerHTML = `A·B = ${a}·${b} = <b>${a & b}</b> &nbsp;&nbsp; A + B = ${a} + ${b} = <b>${a | b}</b> &nbsp;&nbsp; A' = <b>${1 - a}</b> &nbsp;&nbsp; B' = <b>${1 - b}</b>`;
          };
          draw();
        },
      },
      {
        t: 'Öncelik sırası',
        html: `<p>Bir ifade şu sırayla hesaplanır (slayt 10):</p>
          <div class="rule"><b>1. Parantez → 2. NOT → 3. AND → 4. OR</b></div>
          <p>Yani <span class="mono">A + BC'</span> aslında <span class="mono">A + (B·(C'))</span> demektir. AND, OR'dan önce gelir (çarpmanın toplamadan önce gelmesi gibi). Bu yüzden OR'u önce yapmak istiyorsan parantez gerekir: <span class="mono">F = A(B + C)(C + D)</span>.</p>
          <p>Dikkat: <span class="mono">(AB)'</span> ile <span class="mono">A'B'</span> <b>aynı şey değildir</b>. Tümleyen çizgisi neyi kapsıyorsa onu tümler.</p>
          <div class="demo">İfade yaz, doğruluk tablosu canlı çıksın: <input class="txt ex expr" data-keys="ABC'+()01" value="A + BC'" style="width:16ch">
          <div class="exo" style="margin-top:8px"></div></div>`,
        init(el) {
          const inp = $('.ex', el), out = $('.exo', el);
          const show = () => {
            try { const t = Bool.tt(inp.value, 'ABC'); Bool.truthTable(out, 'ABC', { cols: { F: t } }); }
            catch (e) { out.innerHTML = `<span class="dim">${esc(e.message)}</span>`; }
          };
          inp.oninput = show; show();
        },
      },
      {
        t: 'Doğruluk tablosu',
        html: `<p><b>Truth table</b>: fonksiyonun bütün giriş kombinasyonları için değerlerini listeleyen tablo. <b>n giriş → 2<sup>n</sup> satır</b> (slayt 22).</p>
          <p>Satırlar her zaman ikili sayma sırasıyla yazılır: 000, 001, 010, … 111. Satırın indeksi (0, 1, 2 …) bu ikili sayının onluk değeridir. Lecture 3'te bu indeks çok önemli olacak.</p>
          <p><b>Nasıl doldurulur?</b> Her satırda değişkenlerin değerini ifadeye koy, öncelik sırasına uyarak hesapla. Daha hızlısı: SOP'ta bir terimin 1 olduğu satırları bul. Örneğin <span class="mono">xy'</span> sadece x=1, y=0 iken 1'dir.</p>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>AND (·): ikisi de 1 → 1 · OR (+): biri 1 → 1 · NOT ('): tersler</li>
          <li><b>1 + 1 = 1</b> (OR), aritmetik toplama değil</li>
          <li>Öncelik: <b>() → NOT → AND → OR</b></li>
          <li>n giriş → 2<sup>n</sup> satır, satırlar ikili sayma sırasıyla</li>
          <li>(AB)' ≠ A'B' — çizginin kapsamına bak</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r2.tt.eval', name: 'İfadeyi verilen girişte hesapla', ref: R('7–10'),
        gen() {
          const vars = pick(['ABC', 'ABCD']), ex = randExpr(vars, { terms: [2, 3], lits: [1, 3], nest: .45 });
          const x = rnd(0, 2 ** vars.length - 1), bits = bin(x, vars.length), v = Bool.tt(ex, vars)[x];
          const asg = [...vars].map((c, k) => `${c}=${bits[k]}`).join(', ');
          const a = Bool.parse(ex, vars);
          return inputTask({ q: `${E('F = ' + ex)}<br><span class="mono">${asg}</span> için F = ?`, answer: String(v), placeholder: '0 veya 1',
            why: `Değerleri yerine koy ve öncelik sırasına uy (() → NOT → AND → OR).<br>${E(Bool.fmt(a, vars))} → ${(Bool.sopTerms(a) || []).length ? 'her terimi ayrı hesapla; herhangi biri 1 ise F = 1.' : 'içten dışa doğru hesapla.'}<br>Sonuç: <b>F = ${v}</b>`,
            hint: 'OR ile bağlı terimlerden biri 1 olursa sonuç 1. AND terimi ise sadece bütün literalleri 1 olunca 1.' });
        },
      },
      {
        id: 'r2.tt.fill', name: 'Doğruluk tablosu doldur', ref: R(22), long: true,
        gen() {
          const vars = pick(['xyz', 'ABC', 'AB']);
          const ex = randExpr(vars, { terms: [1, 3], lits: [1, 3], nest: .25 }), t = Bool.tt(ex, vars);
          const ones = Bool.onesOf(t);
          return fillTask({ q: `${E('F = ' + ex)} fonksiyonunun doğruluk tablosunu doldur.`, vars, target: t, why: `F'nin 1 olduğu satırlar: <b>${ones.join(', ') || 'yok'}</b>. Her terim için o terimi 1 yapan satırları bul, sonra birleştir (OR).` });
        },
      },
      {
        id: 'r2.tt.prec', name: 'Öncelik: ifade nasıl okunur?', ref: R(10),
        gen() {
          const V = shuffle(['A', 'B', 'C', 'D']).slice(0, 3), [a, b, c] = V;
          const forms = pick([
            { s: `${a} + ${b}${c}'`, o: [`${a} + (${b}·(${c}'))`, `(${a} + ${b})·${c}'`, `${a} + (${b}${c})'`, `(${a} + ${b}${c})'`] },
            { s: `${a}'${b} + ${c}`, o: [`((${a}')·${b}) + ${c}`, `(${a}${b})' + ${c}`, `${a}'·(${b} + ${c})`, `(${a}'${b} + ${c})'`] },
            { s: `${a}(${b} + ${c})'`, o: [`${a}·((${b} + ${c})')`, `(${a}(${b} + ${c}))'`, `${a}·(${b}' + ${c}')`, `${a}${b} + ${c}'`] },
            { s: `${a} + ${b}'${c}'`, o: [`${a} + ((${b}')·(${c}'))`, `(${a} + ${b}')·${c}'`, `${a} + (${b}${c})'`, `(${a} + ${b})'${c}'`] },
          ]);
          const opts = shuffle(forms.o);
          return choiceTask({ q: `${E(forms.s)} ifadesi hangi parantezleme ile <b>aynı anlamdadır</b>?`, options: opts.map(E), correct: opts.indexOf(forms.o[0]), mono: true,
            why: `Öncelik: parantez → NOT → AND → OR. Önce tümleyenler, sonra yan yana yazılanlar (AND), en son + (OR).${forms.s.includes(')\'') ? ' Tümleyen işareti parantezin dışındaysa parantezin <b>tamamını</b> tümler.' : ''}` });
        },
      },
      {
        id: 'r2.tt.rows', name: 'Kaç satır? Hangi satırlar 1?', ref: R('8, 22'),
        gen() {
          if (Math.random() < .4) {
            const n = rnd(2, 6);
            return inputTask({ q: `${n} girişli bir fonksiyonun doğruluk tablosunda kaç satır vardır?`, answer: String(2 ** n), why: `Her giriş 0 ya da 1 → 2·2·…·2 = 2<sup>${n}</sup> = <b>${2 ** n}</b> satır.` });
          }
          const vars = 'ABC', V = [...vars], k = rnd(2, 3), lits = shuffle(V).slice(0, k).map(v => v + (Math.random() < .5 ? "'" : ''));
          const term = lits.join(''), rows = Bool.onesOf(Bool.tt(term, vars));
          return inputTask({ q: `${E('F(A,B,C) = ' + term)} hangi satırlarda (indeks) 1'dir? <span class="sub">Virgül ya da boşlukla ayır.</span>`, answer: rows.join(', '),
            check: u => Bool.sameList(Bool.parseList(u), rows), placeholder: 'ör. 2, 3',
            why: `AND terimi sadece her literal 1 olunca 1'dir: ${lits.map(l => l.endsWith("'") ? `${l[0]}=0` : `${l}=1`).join(', ')}. ${k < 3 ? 'Eksik değişken serbest (0 da 1 de olabilir) → ' : ''}satırlar: <b>${rows.join(', ')}</b>` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 2 — Teoremler
     ================================================================= */
  const S2 = {
    id: 'r2s2', title: 'Aksiyomlar & Teoremler', ref: R('9–18'),
    lesson: [
      {
        t: 'Aksiyomlar',
        html: `<p>Boolean cebri B = {0, 1} kümesi üzerinde tanımlanır. Her şey birkaç <b>aksiyomdan</b> türetilir (slayt 9). Her kuralın bir <b>dual</b>'ı vardır: + ↔ · ve 0 ↔ 1 değiştir, kural yine doğru kalır.</p>
          <table class="t"><tr><th>Aksiyom</th><th>OR biçimi</th><th>AND biçimi (dual)</th></tr>
          <tr><td>Identity element</td><td>a + 0 = a</td><td>a · 1 = a</td></tr>
          <tr><td>Commutative</td><td>a + b = b + a</td><td>a · b = b · a</td></tr>
          <tr><td>Distributive</td><td>a + bc = (a + b)(a + c)</td><td>a(b + c) = ab + ac</td></tr>
          <tr><td>Associative</td><td>a + (b + c) = (a + b) + c</td><td>a(bc) = (ab)c</td></tr>
          <tr><td>Complement</td><td>a + a' = 1</td><td>a · a' = 0</td></tr></table>
          <div class="rule"><b>Sıradan cebirden farkı:</b> OR, AND üzerine de dağılır: <span class="mono">a + bc = (a + b)(a + c)</span> (slayt 18, T8'). Bu kural ispatlarda çok kullanılır.</div>`,
      },
      {
        t: 'Tek değişkenli teoremler',
        html: `<table class="t"><tr><th>Teorem</th><th>OR</th><th>AND</th></tr>
          <tr><td>Null element</td><td>B + 1 = 1</td><td>B · 0 = 0</td></tr>
          <tr><td>Idempotency</td><td>B + B = B</td><td>B · B = B</td></tr>
          <tr><td>Involution</td><td colspan="2">(B')' = B</td></tr>
          <tr><td>Complement</td><td>B + B' = 1</td><td>B · B' = 0</td></tr></table>
          <p>Hepsini kendin doğrulayabilirsin: B yerine önce 0, sonra 1 koy. İki durumda da iki taraf eşitse kural doğrudur. Bu yönteme <b>perfect induction</b> (bütün durumları denemek) denir.</p>
          <div class="demo">B = <span class="lb"></span> <div class="calc bo mono"></div></div>`,
        init(el) {
          let b = 0;
          const draw = () => {
            $('.lb', el).innerHTML = `<button class="ledbtn ${b ? 'on' : ''}"></button>`; $('.lb button', el).onclick = () => { b ^= 1; Sound.tick(); draw(); };
            $('.bo', el).innerHTML = `B + 1 = ${b} + 1 = <b>1</b> · B·0 = <b>0</b> · B + B = <b>${b}</b> · B·B' = ${b}·${1 - b} = <b>0</b> · B + B' = <b>1</b>`;
          };
          draw();
        },
      },
      {
        t: 'Çok değişkenli teoremler',
        html: `<table class="t"><tr><th>Teorem</th><th>Biçim</th><th>Dual</th></tr>
          <tr><td>Absorption</td><td>X + XY = X</td><td>X(X + Y) = X</td></tr>
          <tr><td>Minimization (Combining)</td><td>XY + XY' = X</td><td>(X + Y)(X + Y') = X</td></tr>
          <tr><td>Simplification</td><td>X + X'Y = X + Y</td><td>X(X' + Y) = XY</td></tr>
          <tr><td>Consensus</td><td>XY + X'Z + YZ = XY + X'Z</td><td>(X + Y)(X' + Z)(Y + Z) = (X + Y)(X' + Z)</td></tr>
          <tr><td>De Morgan</td><td>(X + Y)' = X'Y'</td><td>(XY)' = X' + Y'</td></tr></table>
          <div class="rule"><b>Akılda tutma:</b><br>• Absorption: "X zaten varsa, X'li büyük terim gereksiz."<br>• Minimization: "Sadece bir değişkende farklı iki terim → o değişken kaybolur." (K-map'in temeli!)<br>• Consensus: "XY ve X'Z varken YZ fazladan." (YZ, X ve X'den arta kalan ortak kısım)</div>
          <div class="demo">Kendi eşitliğini dene: <input class="txt l expr" data-keys="ABC'+()01" value="A + A'B" style="width:14ch"> = <input class="txt r expr" data-keys="ABC'+()01" value="A + B" style="width:14ch"> <div class="calc eo"></div></div>`,
        init(el) {
          const l = $('.l', el), r = $('.r', el), o = $('.eo', el);
          const show = () => {
            try { const a = Bool.tt(l.value, 'ABC'), b = Bool.tt(r.value, 'ABC'); o.innerHTML = a.join('') === b.join('') ? '<span style="color:var(--led)">✔ Eşit: 8 satırın hepsinde aynı değer.</span>' : `<span style="color:var(--red)">✘ Eşit değil: satır ${a.map((x, i) => x !== b[i] ? i : -1).filter(i => i >= 0).join(', ')} farklı.</span>`; }
            catch (e) { o.innerHTML = `<span class="dim">${esc(e.message)}</span>`; }
          };
          l.oninput = r.oninput = show; show();
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Identity: X+0=X, X·1=X · Null: X+1=1, X·0=0</li>
          <li>Idempotency: X+X=X, XX=X · Involution: X''=X</li>
          <li>Complement: X+X'=1, XX'=0</li>
          <li>Distributive: X(Y+Z)=XY+XZ, <b>X+YZ=(X+Y)(X+Z)</b></li>
          <li>Absorption: X+XY=X · Minimization: XY+XY'=X</li>
          <li>Simplification: X+X'Y=X+Y · Consensus: XY+X'Z+YZ=XY+X'Z</li>
          <li>De Morgan: (X+Y)'=X'Y', (XY)'=X'+Y'</li>
          <li>Dual: + ↔ ·, 0 ↔ 1</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r2.th.name', name: 'Bu hangi teorem?', ref: R('14–18'),
        gen() {
          const row = pick(IDS), I = inst(row), names = Object.keys(TH);
          const others = shuffle(names.filter(n => n !== row[0])).slice(0, 3);
          const opts = shuffle([row[0], ...others]);
          return choiceTask({ q: `${E(`${I.L} = ${I.R}`)}<br>Bu eşitlik hangi kuraldır?`, options: opts.map(n => TH[n]), correct: opts.indexOf(row[0]),
            why: `Genel biçim: <span class="mono">${row[1].replace(/·/g, '·')} = ${row[2]}</span> → <b>${TH[row[0]]}</b>.` });
        },
      },
      {
        id: 'r2.th.apply', name: 'Teoremi uygula: sadeleştir', ref: R('14–18'),
        gen() {
          const rows = IDS.filter(r => ['abs', 'minz', 'simp', 'cons', 'comp', 'nul', 'idem', 'inv'].includes(r[0]));
          const row = pick(rows), vars = 'ABC', I = inst(row, vars), t = Bool.tt(I.R, vars), lit = Bool.countLits(Bool.parse(I.R, vars));
          return Bool.exprTask({ q: `Sadeleştir: ${E(I.L)}`, vars, answer: I.R,
            check: Bool.checker(t, vars, { maxLits: lit }),
            why: `<b>${TH[row[0]]}</b>: <span class="mono">${row[1]} = ${row[2]}</span>`, hint: `Bir teorem kalıbına benziyor mu? ${TH[row[0]].split(' ')[0]}…` });
        },
      },
      {
        id: 'r2.th.tf', name: 'Eşitlik doğru mu?', ref: R('14–18'),
        gen() {
          const vars = 'ABC', row = pick(IDS.filter(r => !['comm', 'assoc'].includes(r[0]))), I = inst(row, vars);
          let R2 = I.R, lie = Math.random() < .5;
          const fakes = [
            ['X + YZ', '(X + Y)Z'], ["(X + Y)'", "X' + Y'"], ["(XY)'", "X'Y'"], ["X + X'Y", 'X'], ['X(X + Y)', 'XY'],
            ["XY + XY'", 'Y'], ['X + XY', 'XY'], ["XY + X'Z + YZ", 'XY + YZ'], ['X + 1', 'X'], ["X + X'", '0'],
          ];
          let L = I.L;
          if (lie) {
            const f = pick(fakes), V = shuffle([...vars]), m = { X: V[0], Y: V[1], Z: V[2] };
            L = tidy(f[0].replace(/[XYZ]/g, c => m[c])); R2 = tidy(f[1].replace(/[XYZ]/g, c => m[c]));
            if (ttEq(L, R2, vars)) lie = false;
          }
          const truth = ttEq(L, R2, vars), a = Bool.tt(L, vars), b = Bool.tt(R2, vars), bad = a.findIndex((x, i) => x !== b[i]);
          return choiceTask({ q: `${E(`${L} = ${R2}`)}<br>Bu eşitlik her zaman doğru mu?`, options: ['Doğru', 'Yanlış'], correct: truth ? 0 : 1,
            why: truth ? `Doğru. ${row && !lie ? `(${TH[row[0]]})` : ''} Bütün satırlarda iki taraf aynı.` : `Yanlış. Karşı örnek: A=${bin(bad, 3)[0]}, B=${bin(bad, 3)[1]}, C=${bin(bad, 3)[2]} için sol = ${a[bad]}, sağ = ${b[bad]}. Doğru kurallarla karşılaştır: X + YZ = (X+Y)(X+Z), (X+Y)' = X'Y', (XY)' = X'+Y', X + X'Y = X + Y.` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 3 — İspat Merdiveni
     ================================================================= */
  const PROOFS = [
    { name: 'Absorption: X + XY = X', ref: R(19), steps: [['X + XY', null], ['X·1 + XY', 'id'], ['X(1 + Y)', 'dist'], ['X·1', 'nul'], ['X', 'id']] },
    { name: "Minimization: XY + XY' = X", ref: R(17), steps: [["XY + XY'", null], ["X(Y + Y')", 'dist'], ['X·1', 'comp'], ['X', 'id']] },
    { name: "Simplification: X + X'Y = X + Y", ref: R(18), steps: [["X + X'Y", null], ["(X + X')(X + Y)", 'dist'], ['1·(X + Y)', 'comp'], ['X + Y', 'id']] },
    { name: 'Absorption (dual): X(X + Y) = X', ref: R(17), steps: [['X(X + Y)', null], ['XX + XY', 'dist'], ['X + XY', 'idem'], ['X', 'abs']] },
    { name: "Consensus: XY + X'Z + YZ = XY + X'Z", ref: R(20), steps: [["XY + X'Z + YZ", null], ["XY + X'Z + 1·YZ", 'id'], ["XY + X'Z + (X + X')YZ", 'comp'], ["XY + X'Z + XYZ + X'YZ", 'dist'], ["XY + XYZ + X'Z + X'YZ", 'comm'], ["XY(1 + Z) + X'Z(1 + Y)", 'dist'], ["XY·1 + X'Z·1", 'nul'], ["XY + X'Z", 'id']] },
    { name: "(X + Y)'Z + X'Y = X'(Y + Z)", ref: R(21), steps: [["(X + Y)'Z + X'Y", null], ["X'Y'Z + X'Y", 'dm'], ["X'(Y'Z + Y)", 'dist'], ["X'(Y + Y')(Y + Z)", 'dist'], ["X'·1·(Y + Z)", 'comp'], ["X'(Y + Z)", 'id']] },
    { name: "(X + Y)(X + Y') = X", ref: R(17), steps: [["(X + Y)(X + Y')", null], ["X + YY'", 'dist'], ['X + 0', 'comp'], ['X', 'id']] },
  ];
  const renameProof = (s, m) => tidy(s.replace(/[XYZ]/g, c => m[c]));
  const S3 = {
    id: 'r2s3', title: 'İspat Merdiveni', ref: R('19–21'),
    lesson: [
      {
        t: 'Cebirsel ispat nasıl yapılır?',
        html: `<p>Bir eşitliği ispatlamak için sol taraftan başlayıp her adımda <b>tek bir</b> aksiyom ya da teorem uygularsın, ta ki sağ tarafa ulaşana kadar. Her adımın yanına hangi kuralı kullandığını yazarsın (slayt 19).</p>
          <table class="t"><tr><th>Adım</th><th>Kural</th></tr>
          <tr><td>A + AB</td><td></td></tr><tr><td>= A·1 + AB</td><td>Identity element (X = X·1)</td></tr>
          <tr><td>= A(1 + B)</td><td>Distributive (XY + XZ = X(Y + Z))</td></tr>
          <tr><td>= A·1</td><td>Null element (1 + X = 1)</td></tr><tr><td>= A</td><td>Identity element</td></tr></table>
          <div class="rule"><b>Hile sezgileri:</b><br>• Takıldığında bir terimi <b>1 ile çarp</b>, sonra 1'i <b>(X + X')</b> olarak yaz. Consensus ispatı tam olarak böyle yapılır (slayt 20).<br>• Ortak çarpanı dışarı al (Distributive), sonra <b>1 + Y = 1</b> ile terimi yok et.<br>• Tümleyen bir parantezin dışındaysa önce De Morgan.</div>
          <p>Bu istasyonda ispatın her adımı sırayla açılacak, sen <b>hangi kuralın kullanıldığını</b> seçeceksin.</p>`,
      },
      {
        t: 'Örnek: Consensus (slayt 20)',
        html: `<table class="t"><tr><td>AB + A'C + BC</td><td></td></tr>
          <tr><td>= AB + A'C + 1·BC</td><td>Identity</td></tr><tr><td>= AB + A'C + (A + A')BC</td><td>Complement</td></tr>
          <tr><td>= AB + A'C + ABC + A'BC</td><td>Distributive</td></tr><tr><td>= AB + ABC + A'C + A'BC</td><td>Commutative</td></tr>
          <tr><td>= AB(1 + C) + A'C(1 + B)</td><td>Distributive</td></tr><tr><td>= AB + A'C</td><td>Null + Identity</td></tr></table>
          <p class="note">Fikir: BC terimini A ve A' parçalarına ayır, sonra her parçayı onu "yutan" büyük terimin içine göm.</p>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Her adımda <b>tek</b> kural</li>
          <li>X = X·1 → 1 = (X + X') hilesi (consensus)</li>
          <li>Ortak çarpan dışarı (Distributive) → 1 + Y = 1 (Null)</li>
          <li>Tümleyen parantez dışında → önce De Morgan</li>
          <li>Sıra değiştirmek: Commutative · Parantez taşımak: Associative</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r2.pf.ladder', name: 'İspat adımlarının kuralını seç', ref: R('19–21'), long: true,
        gen() {
          const P = pick(PROOFS), V = shuffle(['A', 'B', 'C']), m = { X: V[0], Y: V[1], Z: V[2] };
          const st = P.steps.map(([s, r]) => [renameProof(s, m), r]);
          const names = Object.keys(TH);
          const rows = st.slice(1).map(([s, r], k) => {
            const opts = shuffle([r, ...shuffle(names.filter(n => n !== r && !(r === 'abs' && n === 'minz'))).slice(0, 3)]);
            return { html: `= ${s}`, choice: { options: opts.map(n => TH[n]), correct: opts.indexOf(r) }, why: `${st[k][0]} → ${s}: hangi kural bu dönüşümü yapar?`, after: TH[r] };
          });
          return stepTask({ q: `İspat: ${E(renameProof(P.name.split(': ').pop(), m))}<br><span class="sub">Başlangıç: ${E(st[0][0])}. Her adım için kullanılan kuralı seç.</span>`, qText: `İspat: ${renameProof(P.name, m)}`, rows, answer: st.map(x => x[0]).join(' = '), why: `Adımlar: ${st.map(([s, r]) => `${s}${r ? ` <span class="dim">(${TH[r]})</span>` : ''}`).join(' →<br>')}`, xp: 15 });
        },
      },
      {
        id: 'r2.pf.next', name: 'İspatta sonraki adım', ref: R('19–21'),
        gen() {
          const P = pick(PROOFS), V = shuffle(['A', 'B', 'C']), m = { X: V[0], Y: V[1], Z: V[2] };
          const st = P.steps.map(([s, r]) => [renameProof(s, m), r]);
          const k = rnd(0, st.length - 2), cur = st[k][0], nx = st[k + 1][0], rule = st[k + 1][1];
          // çeldiriciler: yanlış dönüşümler
          const vars = 'ABC', target = Bool.tt(cur, vars).join('');
          const cands = shuffle(st.map(x => x[0]).filter(s => s !== nx && s !== cur)).concat([`${cur}'`]);
          const fake = [];
          const muts = [s => s.replace(/'/, ''), s => s.replace(/\+/, '·'), s => s.replace(/([A-C])(?!')/, "$1'"), s => s.replace(/1/, '0'),
            s => s.replace(/[A-C]/, m => ({ A: 'B', B: 'C', C: 'A' })[m]), s => s.replace(/ \+ [^+]*$/, ''), s => `(${s})'`];
          for (const f of shuffle(muts.slice(0, -1)).concat(muts.slice(-1))) { const t = tidy(f(nx)); try { if (t !== nx && Bool.tt(t, vars).join('') !== target && !fake.includes(t)) fake.push(t); } catch (e) { } if (fake.length >= 3) break; }
          const opts = shuffle([nx, ...fake.slice(0, 3)]);
          return choiceTask({ q: `${E(cur)} ifadesine <b>${TH[rule]}</b> uygulanırsa hangisi elde edilir?`, options: opts.map(E), correct: opts.indexOf(nx), mono: true,
            why: `${E(cur)} → (${TH[rule]}) → ${E(nx)}. Diğer seçenekler ilk ifadeye eşit bile değil.` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 4 — De Morgan & Tümleyen
     ================================================================= */
  const S4 = {
    id: 'r2s4', title: 'De Morgan & Tümleyen', ref: R('14, 24'),
    lesson: [
      {
        t: 'De Morgan teoremi',
        html: `<div class="rule"><span class="mono">(X + Y)' = X'·Y'</span> &nbsp;&nbsp; ve &nbsp;&nbsp; <span class="mono">(X·Y)' = X' + Y'</span></div>
          <p><b>Sözle:</b> "Tümleyeni içeri sokarken her literali tümle ve işlemi değiştir (+ ↔ ·)."</p>
          <p>n değişkene de genişler: <span class="mono">(A + B + C)' = A'B'C'</span>, <span class="mono">(ABC)' = A' + B' + C'</span>.</p>
          <p class="note">Genel De Morgan (slayt 14): f(X<sub>1</sub>…X<sub>n</sub>, 0, 1, +, ·)' = f(X<sub>1</sub>'…X<sub>n</sub>', 1, 0, ·, +)</p>
          <div class="demo"><div class="row"><b>A</b><span class="la"></span><b>B</b><span class="lb"></span></div><div class="calc dmo mono"></div></div>`,
        init(el) {
          let a = 0, b = 1;
          const draw = () => {
            [['.la', () => a, v => a = v], ['.lb', () => b, v => b = v]].forEach(([s, g, set]) => { $(s, el).innerHTML = `<button class="ledbtn ${g() ? 'on' : ''}"></button>`; $(s + ' button', el).onclick = () => { set(1 - g()); Sound.tick(); draw(); }; });
            $('.dmo', el).innerHTML = `(A + B)' = <b>${1 - (a | b)}</b> &nbsp; A'·B' = <b>${(1 - a) & (1 - b)}</b><br>(A·B)' = <b>${1 - (a & b)}</b> &nbsp; A' + B' = <b>${(1 - a) | (1 - b)}</b>`;
          };
          draw();
        },
      },
      {
        t: 'Bir fonksiyonun tümleyeni',
        html: `<p>F'yi bulmak için (slayt 24):</p>
          <div class="rule"><b>1.</b> AND ↔ OR değiştir (gerekirse parantez ekle, gruplar korunmalı!)<br><b>2.</b> Her literali ve sabiti tümle (x ↔ x', 0 ↔ 1)</div>
          <p><b>Örnek:</b> F = x'yz' + x'y'z<br>F' = (x + y' + z)(x + y + z')</p>
          <p><b>Örnek:</b> G = (a' + bc)d + e<br>G' = (a(b' + c') + d')e'</p>
          <p class="note">En sık hata: grupları bozmak. F = AB + C ise F' = (A' + B')C', <b>A' + B'C' değil</b>. Her terim önce paranteze alınır.</p>`,
      },
      {
        t: 'Dual',
        html: `<p>Bir ifadenin <b>dual</b>'ı: + ↔ · ve 0 ↔ 1 değiştirilir, <b>literaller tümlenmez</b>.</p>
          <p>Örnek: F = A(B + C') + 0 → dual: A + BC'·1 → A + BC'</p>
          <div class="rule">Tümleyen = dual + bütün literalleri tümle. Bir teorem doğruysa dual'ı da doğrudur (aksiyomlar çift çift tanımlandığı için).</div>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>(X + Y)' = X'Y' · (XY)' = X' + Y'</li>
          <li>F': AND ↔ OR, literal ↔ tümleyen, 0 ↔ 1</li>
          <li>Önce her AND terimini paranteze al, gruplar bozulmaz</li>
          <li>Dual: sadece + ↔ ·, 0 ↔ 1 (literaller aynen kalır)</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r2.dm.simple', name: "De Morgan: tümleyeni içeri sok", ref: R(14),
        gen() {
          const V = shuffle(['A', 'B', 'C', 'D']).slice(0, rnd(2, 3)), vars = 'ABCD';
          const lits = V.map(v => v + (Math.random() < .35 ? "'" : ''));
          const isOr = Math.random() < .5, src = isOr ? `(${lits.join(' + ')})'` : `(${lits.join('')})'`;
          const inv = lits.map(l => l.endsWith("'") ? l[0] : l + "'");
          const ans = isOr ? inv.join('') : inv.join(' + ');
          return Bool.exprTask({ q: `${E(src)} ifadesini De Morgan ile <b>tümleyeni sadece literallerin üzerinde</b> olacak şekilde yaz.`, vars, answer: ans,
            check: I => { const r = Bool.checker(Bool.tt(ans, vars), vars, { form: 'sop', maxLits: lits.length })(I); if (r.ok && /\)'/.test(I.str.replace(/\s/g, ''))) return { ok: false, msg: 'Eşdeğer ama hâlâ parantezin dışında tümleyen var.' }; return r; },
            why: `${isOr ? '(X + Y)\' = X\'Y\'' : "(XY)' = X' + Y'"}: her literali tümle, işlemi değiştir → <b>${ans}</b>${lits.some(l => l.endsWith("'")) ? " (X'' = X: çift tümleyen kaybolur)" : ''}` });
        },
      },
      {
        id: 'r2.dm.comp', name: "Fonksiyonun tümleyeni F'", ref: R(24), long: true,
        gen() {
          const vars = pick(['xyz', 'ABC', 'ABCD']), F = randExpr(vars, { terms: [2, 3], lits: [2, 3], nest: .15 });
          const t = Bool.tt(F, vars).map(x => 1 - x), ast = Bool.parse(F, vars);
          const compl = n => {
            switch (n.t) {
              case 'var': return { t: 'not', a: n };
              case 'k': return { t: 'k', v: 1 - n.v };
              case 'par': return { t: 'par', a: compl(n.a) };
              case 'not': return n.a;
              case 'and': return { t: 'or', a: n.a.map(compl) };
              case 'or': return { t: 'and', a: n.a.map(compl) };
            }
          };
          const ans = Bool.fmt(compl(ast), vars);
          return Bool.exprTask({ q: `${E('F = ' + F)} ise <b>F'</b> = ? <span class="sub">(Herhangi bir eşdeğer biçim kabul.)</span>`, vars, answer: ans,
            check: Bool.checker(t, vars),
            why: `AND ↔ OR değiştir, her literali tümle, grupları paranteze al:<br>F' = <b>${ans}</b>`, hint: 'Her AND terimi kendi parantezinde bir OR terimine dönüşür.' });
        },
      },
      {
        id: 'r2.dm.dual', name: 'Dual ifadeyi yaz', ref: R('9, 14'),
        gen() {
          const vars = 'ABC', F = randExpr(vars, { terms: [2, 2], lits: [1, 2], nest: .4 }) + (Math.random() < .3 ? ' + 0' : '');
          const D = Bool.dual(Bool.parse(F, vars)), ans = Bool.fmt(D, vars), t = Bool.ttOf(D, 3);
          return Bool.exprTask({ q: `${E('F = ' + F)} ifadesinin <b>dual</b>'ı nedir?`, vars, answer: ans, check: Bool.checker(t, vars),
            why: `Dual: + ↔ ·, 0 ↔ 1, literaller <b>aynen</b> kalır (tümlenmez). Öncelik bozulmasın diye OR'lar paranteze alınır → <b>${ans}</b>` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 5 — Sadeleştirme
     ================================================================= */
  /** sade bir fonksiyonu "kirli" SOP olarak sun */
  function messy(vars) {
    for (;;) {
      const n = vars.length, f = randFn(n, { pOne: .45 });
      const r = Bool.minSOP(f.ones, [], vars);
      if (r.cost.L < 2 || r.cost.L > 6) continue;
      let cubes = [];
      r.terms.forEach(c => {
        const free = []; for (let k = 0; k < n; k++) if (c.d & (1 << k)) free.push(1 << k);
        if (free.length && Math.random() < .75) { const b = pick(free); cubes.push({ v: c.v, d: c.d & ~b }, { v: c.v | b, d: c.d & ~b }); }
        else cubes.push(c);
      });
      // fazladan bir minterm ekle (absorption ile yutulacak)
      if (Math.random() < .5) { const m = pick(f.ones); cubes.push({ v: m, d: 0 }); }
      cubes = shuffle(cubes.filter((c, i, a) => a.findIndex(d => d.v === c.v && d.d === c.d) === i));
      const s = cubes.map(c => Bool.cubeStr(c, vars)).join(' + ');
      const L = cubes.reduce((a, c) => a + Bool.cubeLits(c, n), 0);
      if (L > r.cost.L + 1) return { s, r, t: ttFrom(f.ones, [], n), L };
    }
  }
  const S5 = {
    id: 'r2s5', title: 'Sadeleştirme', ref: R('23'),
    lesson: [
      {
        t: 'Literal sayısını azalt',
        html: `<p><b>Literal</b> = bir değişkenin ya da tümleyeninin her geçişi. Literal sayısı ne kadar azsa devre o kadar ucuz olur (daha az kapı girişi).</p>
          <p>Slayt 23'teki örnek:</p>
          <table class="t"><tr><td>A'B + A'CD + A'BD + A'CD' + ABCD</td><td>(15 literal)</td></tr>
          <tr><td>= A'B + ABCD + A'CD + A'CD' + A'BD</td><td>commutative</td></tr>
          <tr><td>= A'B + AB(CD) + A'C(D + D') + A'BD</td><td>distributive</td></tr>
          <tr><td>= A'B + ABCD + A'C + A'BD</td><td>complement, identity</td></tr>
          <tr><td>= B(A' + ACD) + A'C</td><td>A'BD, A'B tarafından yutulur</td></tr>
          <tr><td>= B(A' + CD) + A'C</td><td>simplification (X' + XY = X' + Y)</td></tr></table>
          <div class="rule"><b>Strateji:</b><br>1. Sadece bir değişkende farklı terim çifti ara → birleştir (XY + XY' = X).<br>2. Bir terimi tamamen içeren daha kısa bir terim varsa büyüğünü sil (absorption).<br>3. X + X'Y = X + Y kalıbını ara.<br>4. Consensus terimini sil.</div>`,
      },
      {
        t: 'Sadeleştirme laboratuvarı',
        html: `<p>Bir ifade yaz. Kaç literal olduğunu ve bu fonksiyonun <b>en az kaç literal</b> ile (SOP olarak) yazılabileceğini gör. Hedefe inmeye çalış.</p>
          <div class="demo"><input class="txt sl expr" data-keys="ABCD'+()01" value="A'B + A'CD + A'BD + A'CD' + ABCD" style="width:100%;max-width:520px">
          <div class="calc so" style="margin-top:8px"></div></div>`,
        init(el) {
          const inp = $('.sl', el), o = $('.so', el);
          const show = () => {
            try {
              const a = Bool.parse(inp.value, 'ABCD'), t = Bool.ttOf(a, 4), r = Bool.minSOP(Bool.onesOf(t), [], 'ABCD');
              o.innerHTML = `Senin ifaden: <b>${Bool.countLits(a)}</b> literal · Minimum SOP: <span class="mono">${r.str}</span> (<b>${r.cost.L}</b> literal)`;
            } catch (e) { o.innerHTML = `<span class="dim">${esc(e.message)}</span>`; }
          };
          inp.oninput = show; show();
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>Literal = değişkenin her geçişi (A'B + C → 3)</li>
          <li>XY + XY' = X (tek farklı değişken düşer)</li>
          <li>X + XY = X (yutma)</li>
          <li>X + X'Y = X + Y</li>
          <li>XY + X'Z + YZ = XY + X'Z</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r2.sp.lits', name: 'Literal say', ref: R(23),
        gen() {
          const vars = 'ABCD', F = randExpr(vars, { terms: [2, 4], lits: [1, 4], nest: .3 }), n = Bool.countLits(Bool.parse(F, vars));
          return inputTask({ q: `${E('F = ' + F)} ifadesinde kaç <b>literal</b> var?`, answer: String(n),
            why: `Her değişken geçişi (tümleyenli ya da değil) 1 literal: <b>${n}</b>. Aynı değişken iki kez geçiyorsa iki kez sayılır.` });
        },
      },
      {
        id: 'r2.sp.simp', name: 'İfadeyi sadeleştir', ref: R(23), long: true,
        gen() {
          const vars = pick(['ABC', 'ABC', 'xyz']), M = messy(vars);
          return Bool.exprTask({ q: `Cebirsel olarak sadeleştir (en az literal): ${E('F = ' + M.s)} <span class="sub">(${M.L} literal)</span>`, vars, answer: M.r.str,
            check: Bool.checker(M.t, vars, { maxLits: M.r.cost.L }),
            why: `Minimum: <b>${M.r.str}</b> (${M.r.cost.L} literal). Önce yalnızca bir değişkende farklı terimleri birleştir (XY + XY' = X), sonra yutulan terimleri sil.`,
            hint: 'Terimleri ikişer ikişer karşılaştır: sadece bir değişkenin tümleyeni farklıysa o değişken düşer.' });
        },
      },
    ],
  };

  Registry.addRegion({
    id: 'r2', chip: 'U2', name: 'Teorem Ormanı', lec: 'Lecture 2', ref: 'Lecture 2',
    stations: [S1, S2, S3, S4, S5],
  });
})();
