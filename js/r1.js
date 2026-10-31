'use strict';
/* =====================================================================
   BÖLGE U1 — SAYI LİMANI  (Lecture 1: sayı sistemleri ve kodlar)
   ===================================================================== */
(() => {
  const R = s => `Lecture 1 · slayt ${s}`;
  const BCD = d => bin(d, 4);
  const EX3 = d => bin(d + 3, 4);
  const C84 = ['0000', '0111', '0110', '0101', '0100', '1011', '1010', '1001', '1000', '1111'];
  const gray = n => n ^ (n >> 1);
  const ungray = g => { let b = 0; for (; g; g >>= 1) b ^= g; return b; };
  const sup = k => `<sup>${k}</sup>`;

  /** 1 olan bitlerin ağırlık açılımı */
  function binExpand(s) {
    const n = s.length, ks = [];
    for (let i = 0; i < n; i++) if (s[i] === '1') ks.push(n - 1 - i);
    if (!ks.length) return '0';
    return `${ks.map(k => `2${sup(k)}`).join(' + ')} = ${ks.map(k => 2 ** k).join(' + ')} = <b>${ks.reduce((a, k) => a + 2 ** k, 0)}</b>`;
  }
  /** kesir bitleri açılımı (virgülden sonrası) */
  function fracExpand(fb) {
    const ks = [];
    for (let j = 0; j < fb.length; j++) if (fb[j] === '1') ks.push(j + 1);
    if (!ks.length) return '0';
    return `${ks.map(k => `2${sup('-' + k)}`).join(' + ')} = ${ks.map(k => 2 ** -k).join(' + ')} = <b>${ks.reduce((a, k) => a + 2 ** -k, 0)}</b>`;
  }
  /** taban-r tamsayı açılımı */
  function expand(str, base) {
    const n = str.length;
    const terms = [...str].map((c, i) => `${DIG.indexOf(c)}·${base}${sup(n - 1 - i)}`);
    const vals = [...str].map((c, i) => DIG.indexOf(c) * base ** (n - 1 - i));
    return `${terms.join(' + ')} = ${vals.join(' + ')} = <b>${vals.reduce((a, b) => a + b, 0)}</b>`;
  }
  /** binary'yi taban noktasından başlayarak g'li grupla */
  function groupConv(I, F, g) {
    const ip = (g - I.length % g) % g, fp = F ? (g - F.length % g) % g : 0;
    const Ip = '0'.repeat(ip) + I, Fp = F + '0'.repeat(fp);
    const chunk = s => s.match(new RegExp(`.{${g}}`, 'g')) || [];
    const ig = chunk(Ip), fg = chunk(Fp);
    const d = grp => DIG[parseInt(grp, 2)];
    const res = ig.map(d).join('') + (fg.length ? '.' + fg.map(d).join('') : '');
    const box = (grp, padL, padR) => {
      const a = grp.slice(0, padL), m = grp.slice(padL, g - padR), z = grp.slice(g - padR);
      return `<span class="grp"><span class="bits"><span class="pad">${a}</span>${m}<span class="pad">${z}</span></span><span class="dg">${d(grp)}</span></span>`;
    };
    let html = ig.map((grp, i) => box(grp, i === 0 ? ip : 0, 0)).join('');
    if (fg.length) html += '<span class="grp-dot">.</span>' + fg.map((grp, i) => box(grp, 0, i === fg.length - 1 ? fp : 0)).join('');
    return { res: normNum(res), html: `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;margin:6px 0">${html}</div><span class="note">Soluk 0'lar dolgu (padding).</span>` };
  }
  /** hex/oktal → binary (her basamak g bit) */
  function digitsToBin(s, g) {
    const [I, F = ''] = s.split('.');
    const m = c => bin(DIG.indexOf(c), g);
    const res = normNum([...I].map(m).join('') + (F ? '.' + [...F].map(m).join('') : ''));
    const map = [...s.replace('.', '')].map(c => `${c}→${m(c)}`).join(', ');
    return { res, map };
  }
  const randDigits = (n, b, firstNZ = true) => Array.from({ length: n }, (_, i) => DIG[(i === 0 && firstNZ) ? rnd(1, b - 1) : rnd(0, b - 1)]).join('');
  const randFracDigits = (n, b) => { const s = randDigits(n, b, false); return s.slice(0, -1) + DIG[rnd(1, b - 1)]; };

  /* =================================================================
     İSTASYON 1 — Basamak Değeri
     ================================================================= */
  const S1 = {
    id: 'r1s1', title: 'Basamak Değeri', ref: R('6–17, 23'),
    lesson: [
      {
        t: 'Analog → Dijital',
        html: `<p>Gerçek dünyadaki büyüklükler (gerilim, sıcaklık, konum) <b>sürekli</b>dir: iki sınır arasında her değeri alabilir. Bunlara <b>analog</b> sinyal denir.</p>
          <p>Dijital sistemler ise <b>ayrık (discrete)</b> değerlerle çalışır, yani sonlu sayıda seçenek vardır. Aşağıda bir analog sinyali <b>n bit</b> ile örnekliyorsun (quantization). <b>n bit → 2<sup>n</sup> seviye.</b></p>
          <div class="demo"><svg class="quant" viewBox="0 0 420 170" width="100%" style="max-width:520px"></svg>
          <div class="row"><label>Bit sayısı n = <b class="nb mono">2</b> <input type="range" min="1" max="6" value="2"></label><span class="lv mono"></span></div></div>
          <div class="rule">En basit küme <b>ikili (binary)</b> kümedir: {0, 1}. Elektronikte iki gerilim seviyesiyle temsil edilir: <b>0 = LOW = FALSE</b>, <b>1 = HIGH = TRUE</b>. Bir ikili basamağa <b>bit</b> (binary digit) denir.</div>`,
        init(el) {
          const svg = $('.quant', el), rng = $('input', el);
          const draw = () => {
            const n = +rng.value, L = 2 ** n;
            $('.nb', el).textContent = n; $('.lv', el).textContent = `→ ${L} seviye`;
            const f = x => .5 + .42 * Math.sin(x / 420 * Math.PI * 3.2) * Math.cos(x / 420 * 1.3);
            let ap = '', qp = '';
            for (let x = 0; x <= 420; x += 3) ap += `${x ? 'L' : 'M'}${x},${160 - f(x) * 150}`;
            const N = 28;
            for (let i = 0; i < N; i++) {
              const x0 = i * 420 / N, x1 = (i + 1) * 420 / N;
              const lv = Math.round(f(x0) * (L - 1)) / (L - 1);
              const y = 160 - lv * 150;
              qp += `${i ? 'L' : 'M'}${x0},${y} L${x1},${y} `;
            }
            let grid = '';
            for (let k = 0; k < L && L <= 16; k++) { const y = 160 - k / (L - 1) * 150; grid += `<line x1="0" x2="420" y1="${y}" y2="${y}" stroke="#2c6b4f" stroke-dasharray="2 4"/><text x="2" y="${y - 2}" font-size="9" fill="#8fb3a0">${bin(k, n)}</text>`; }
            svg.innerHTML = `${grid}<path d="${ap}" fill="none" stroke="#6cc8ff" stroke-width="2" opacity=".8"/><path d="${qp}" fill="none" stroke="#e0ad4a" stroke-width="2.5"/>
              <text x="300" y="14" font-size="11" fill="#6cc8ff">— analog</text><text x="300" y="28" font-size="11" fill="#e0ad4a">— dijital (${n} bit)</text>`;
          };
          rng.oninput = draw; draw();
        },
      },
      {
        t: 'Bitler ve ağırlıkları',
        html: `<p>Binary'de her basamağın bir <b>ağırlığı</b> vardır. Sağdan sola 2<sup>0</sup>=1, 2<sup>1</sup>=2, 2<sup>2</sup>=4, … diye gider. Sayının değeri, <b>1 olan bitlerin ağırlıklarının toplamıdır</b>.</p>
          <p>LED'lere tıklayıp yakarak dene:</p>
          <div class="demo"><div class="bb"></div><div class="calc out"></div></div>
          <div class="rule">En soldaki bit <b>MSB</b> (Most Significant Bit, en büyük ağırlık), en sağdaki <b>LSB</b> (Least Significant Bit) olarak adlandırılır.<br>
          8 bit ile <b>en büyük</b> sayı 1111 1111 = 255, <b>en küçük</b> 0000 0000 = 0. Genel olarak n bit → 0 … 2<sup>n</sup>−1.</div>
          <p class="note">Örnek (slayt 15): (215)<sub>10</sub> = (1101 0111)<sub>2</sub> = 128+64+16+4+2+1</p>`,
        init(el) {
          const out = $('.out', el);
          const show = v => { const s = bin(v, 8); out.innerHTML = `(${s})<sub>2</sub> → ${v ? binExpand(s) : '0'} &nbsp; <span class="dim">(onluk: ${v})</span>`; };
          bitBoard($('.bb', el), 8, { value: 215, onChange: show }); show(215);
        },
      },
      {
        t: 'Başka tabanlar',
        html: `<p>Aynı fikir her taban için geçerlidir. <b>Taban r</b>'de basamak ağırlıkları r<sup>0</sup>, r<sup>1</sup>, r<sup>2</sup>, …, virgülden sonra ise r<sup>-1</sup>, r<sup>-2</sup>, … olur.</p>
          <table class="t"><tr><th>Ad</th><th>Taban</th><th>Rakamlar</th></tr>
          <tr><td>Binary</td><td>2</td><td>0, 1</td></tr><tr><td>Octal</td><td>8</td><td>0–7</td></tr>
          <tr><td>Decimal</td><td>10</td><td>0–9</td></tr><tr><td>Hexadecimal</td><td>16</td><td>0–9, A=10, B=11, C=12, D=13, E=14, F=15</td></tr></table>
          <div class="rule"><b>Taban r → onluk (kolay yön):</b> Kuvvet serisine aç ve topla.<br>
          <span class="mono">(2E)<sub>16</sub> = 2·16<sup>1</sup> + 14·16<sup>0</sup> = 46</span><br>
          <span class="mono">(0.1011)<sub>2</sub> = 2<sup>-1</sup> + 2<sup>-3</sup> + 2<sup>-4</sup> = 0.5 + 0.125 + 0.0625 = 0.6875</span></div>
          <div class="demo">Kendin dene: <input class="txt num" value="2E" style="width:9ch"> taban <select class="bs"><option>2</option><option>8</option><option selected>16</option></select>
          <div class="calc out" style="margin-top:8px"></div></div>`,
        init(el) {
          const inp = $('.num', el), bs = $('.bs', el), out = $('.out', el);
          const show = () => {
            const b = +bs.value, s = inp.value.toUpperCase().trim();
            const [I, F = ''] = s.split('.');
            if (!s || ![...(I + F)].every(c => DIG.indexOf(c) >= 0 && DIG.indexOf(c) < b)) { out.innerHTML = `<span class="dim">Taban ${b} için geçersiz rakam var.</span>`; return; }
            let h = I ? expand(I, b) : '0';
            if (F) {
              const terms = [...F].map((c, j) => `${DIG.indexOf(c)}·${b}${sup('-' + (j + 1))}`);
              const val = [...F].reduce((a, c, j) => a + DIG.indexOf(c) * b ** -(j + 1), 0);
              h += `<br>kesir: ${terms.join(' + ')} = <b>${+val.toFixed(8)}</b>`;
            }
            out.innerHTML = h;
          };
          inp.oninput = show; bs.onchange = show; show();
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li>n bit ile 2<sup>n</sup> farklı değer temsil edilir: 0 … 2<sup>n</sup>−1</li>
          <li>Basamak ağırlığı: sağdan r<sup>0</sup>, r<sup>1</sup>, r<sup>2</sup>…  virgül sonrası r<sup>-1</sup>, r<sup>-2</sup>…</li>
          <li>Taban r → onluk: <b>her basamak × ağırlık</b>, sonra topla</li>
          <li>Hex harfleri: A=10, B=11, C=12, D=13, E=14, F=15</li>
          <li>MSB en solda, LSB en sağda</li></ul></div>
          <p>Şimdi <b>Pratik</b> sekmesine geç. Yanlış yaptığın soru tipi bir süre sonra tekrar karşına çıkacak.</p>`,
      },
    ],
    skills: [
      {
        id: 'r1.pos.b2d', name: 'Binary → onluk', ref: R(15),
        gen() {
          const n = rnd(5, 8), v = rnd(2 ** (n - 1), 2 ** n - 1), s = bin(v);
          return inputTask({ q: `${B(s, 2)} = ( ? )<sub>10</sub>`, answer: String(v), placeholder: 'onluk değer',
            why: `1 olan bitlerin ağırlıklarını topla:<br>${binExpand(s)}`, hint: 'Sağdan sola ağırlıklar: 1, 2, 4, 8, 16, 32, 64, 128' });
        },
      },
      {
        id: 'r1.pos.d2b', name: 'Onluk → LED (binary)', ref: R(15),
        gen() {
          const v = rnd(10, 255);
          return {
            q: `(${v})_10 → 8 LED`,
            render(box, done) {
              box.innerHTML = `<div class="q">${B(v, 10)} sayısını LED'leri yakarak <b>8 bit binary</b> olarak göster.</div><div class="bb"></div>
                <div class="row"><button class="btn primary chk">Kontrol</button><span class="sub">Ağırlıklar LED'lerin altında yazıyor. En büyükten başla.</span></div>`;
              const bb = bitBoard($('.bb', box), 8, {});
              let rest = v; const parts = [];
              for (let k = 7; k >= 0; k--) if (rest >= 2 ** k) { parts.push(2 ** k); rest -= 2 ** k; }
              $('.chk', box).onclick = () => done(bb.value() === v, { your: `${bb.str()} (= ${bb.value()})`, answer: bin(v, 8),
                why: `Büyük ağırlıktan küçüğe: sığıyorsa o biti 1 yap ve çıkar.<br>${v} = ${parts.join(' + ')} → <b>${bin(v, 8)}</b>` });
            },
          };
        },
      },
      {
        id: 'r1.pos.r2d', name: 'Octal/Hex → onluk', ref: R('16, 23'),
        gen() {
          const b = pick([8, 16]), len = rnd(2, 3), s = randDigits(len, b);
          const v = parseInt(s, b);
          return inputTask({ q: `${B(s, b)} = ( ? )<sub>10</sub>`, answer: String(v),
            why: `Kuvvet serisine aç: ${expand(s, b)}${b === 16 ? '<br>(A=10, B=11, C=12, D=13, E=14, F=15)' : ''}`,
            hint: `Sağdan sola ağırlıklar: 1, ${b}, ${b * b}` });
        },
      },
      {
        id: 'r1.pos.f2d', name: 'Kesirli binary → onluk', ref: R(23),
        gen() {
          const i = rnd(1, 15), k = rnd(1, 15), fb = bin(k, 4).replace(/0+$/, ''), val = i + k / 16, s = `${bin(i)}.${fb}`;
          return inputTask({ q: `${B(s, 2)} = ( ? )<sub>10</sub>`, answer: String(val), check: u => decEq(u, val), placeholder: 'ör. 5.375',
            why: `Tam kısım: ${binExpand(bin(i))}<br>Kesir kısım (ağırlıklar 0.5, 0.25, 0.125, 0.0625): ${fracExpand(fb)}<br>Toplam: <b>${val}</b>`,
            hint: 'Virgülden sonraki ağırlıklar: 2⁻¹=0.5, 2⁻²=0.25, 2⁻³=0.125, 2⁻⁴=0.0625' });
        },
      },
      {
        id: 'r1.pos.max', name: 'n bit ile en büyük sayı', ref: R(15),
        gen() {
          const n = rnd(3, 16);
          return inputTask({ q: `<b>${n} bit</b> ile temsil edilebilen <b>en büyük</b> pozitif sayı (onluk) kaçtır?`, answer: String(2 ** n - 1),
            why: `Bütün bitler 1 olunca: 2<sup>${n}</sup> − 1 = <b>${2 ** n - 1}</b>. En küçüğü ise 0. Yani toplam 2<sup>${n}</sup> = ${2 ** n} farklı değer.` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 2 — Bölme Makinesi (onluk → taban r)
     ================================================================= */
  const orderIntRow = {
    html: 'Kalanları sonuçta hangi sırayla yazarsın?',
    choice: { options: ['İlk kalandan sonuncuya (yukarıdan aşağı)', 'Son kalandan ilkine (aşağıdan yukarı)'], correct: 1 },
    why: 'İlk kalan N mod r, yani r<sup>0</sup> basamağıdır (LSB). LSB en sağa yazılır, bu yüzden kalanlar <b>aşağıdan yukarı</b> okunur.',
    after: 'Son kalan = MSB (en sol), ilk kalan = LSB (en sağ).',
  };
  const orderFracRow = {
    html: 'Tam kısımları (basamakları) hangi sırayla yazarsın?',
    choice: { options: ['İlk elde edilenden sonuncuya (yukarıdan aşağı)', 'Sondan başa (aşağıdan yukarı)'], correct: 0 },
    why: 'Çarpmada ilk elde edilen basamak r<sup>-1</sup> basamağıdır (virgülün hemen sağı). Bu yüzden <b>düz sırada</b> yazılır. Tamsayı kısmındaki yönün tersidir!',
    after: 'Kesirde düz sıra: ilk basamak virgülün hemen sağına gelir.',
  };
  function divRows(N, b) {
    const rows = [], rems = []; let n = N;
    while (n > 0) {
      const q = Math.floor(n / b), r = n % b;
      rows.push({
        html: `${n} ÷ ${b} = [[0]] kalan [[1]]`,
        fields: [{ answer: String(q), w: 5 }, { answer: String(r), accept: [String(r), DIG[r]], w: 3 }],
        why: `${n} = ${b}·${q} + ${r} → bölüm <b>${q}</b>, kalan <b>${r}</b>${r > 9 ? ` (= ${DIG[r]})` : ''}.`,
      });
      rems.push(r); n = q;
    }
    return { rows, rems };
  }
  const genDiv = b => () => {
    const N = b === 2 ? rnd(20, 200) : b === 8 ? rnd(70, 999) : rnd(200, 4000);
    const { rows, rems } = divRows(N, b), res = N.toString(b).toUpperCase();
    rows.push(orderIntRow, {
      html: `(${N})<sub>10</sub> = ( [[0]] )<sub>${b}</sub>`, fields: [{ answer: res, w: 12 }],
      why: `Kalanları son → ilk sırayla yaz: ${rems.slice().reverse().map(r => DIG[r]).join(' ')}${b === 16 ? ' (10 ve üstü harfe çevrilir)' : ''}`,
    });
    return stepTask({ q: `${B(N, 10)} sayısını <b>${b} tabanına</b> çevir. Her adımda bölümü ve kalanı yaz.${b === 16 ? ' <span class="sub">(Kalan 10–15 ise sayı ya da harf yazabilirsin.)</span>' : ''}`,
      qText: `${N} (onluk) → taban ${b}, bölme yöntemi`, rows, answer: B(res, b),
      why: `Kalanlar ilk→son: ${rems.map(r => DIG[r]).join(', ')}. Ters sırada: <b>${res}</b>` });
  };
  const S2 = {
    id: 'r1s2', title: 'Bölme Makinesi', ref: R('18–22'),
    lesson: [
      {
        t: 'Neden bölüyoruz?',
        html: `<p>Bir sayıyı r'ye böldüğünde <b>kalan, sayının taban r'deki en sağ basamağıdır</b>. Bölümü tekrar r'ye bölersen bir sonraki basamağı bulursun. Bölüm 0 olana kadar devam edilir.</p>
          <div class="demo">Sayı: <input class="txt N" value="46" style="width:8ch"> → taban <select class="bs"><option>2</option><option>8</option><option>16</option></select>
          <button class="btn sm stepb">Adım ▶</button> <button class="btn ghost sm rst">Baştan</button>
          <div class="calc out" style="margin-top:10px"></div></div>
          <div class="rule">Kalanlar <b>ters sırada</b> (son kalandan ilk kalana, yani aşağıdan yukarı) okunur. Çünkü ilk kalan 2<sup>0</sup> basamağıdır (LSB).</div>`,
        init(el) {
          const out = $('.out', el); let st = null;
          const reset = () => { const N = Math.max(1, parseInt($('.N', el).value) || 46); st = { n: N, N, b: +$('.bs', el).value, rows: [], rems: [] }; out.innerHTML = '<span class="dim">"Adım"a bas.</span>'; };
          const paint = () => {
            let h = st.rows.join('<br>');
            if (st.n === 0) {
              const res = st.N.toString(st.b).toUpperCase();
              h += `<br><br>Kalanlar aşağıdan yukarı: <b class="r">${st.rems.slice().reverse().map(r => DIG[r]).join(' ')}</b><br>(${st.N})<sub>10</sub> = <b>(${res})<sub>${st.b}</sub></b>`;
            }
            out.innerHTML = h;
          };
          $('.stepb', el).onclick = () => {
            if (st.n === 0) return;
            const q = Math.floor(st.n / st.b), r = st.n % st.b;
            st.rows.push(`${st.n} ÷ ${st.b} = ${q} &nbsp; kalan <span class="r">${r}${r > 9 ? ' (' + DIG[r] + ')' : ''}</span>${st.rows.length === 0 ? ' ← LSB' : ''}${q === 0 ? ' ← MSB' : ''}`);
            st.rems.push(r); st.n = q; Sound.tick(); paint();
          };
          $('.rst', el).onclick = reset; $('.N', el).onchange = reset; $('.bs', el).onchange = reset; reset();
        },
      },
      {
        t: 'Kesirli kısım: çarp!',
        html: `<p>Kesir kısmı için tersini yaparız: <b>kesri r ile çarp</b>. Çıkan tam kısım, bir sonraki basamaktır. Kalan kesirle devam et. Kesir 0 olunca (ya da yeterli basamak elde edince) dur.</p>
          <div class="demo">Kesir: <input class="txt F" value="0.6875" style="width:9ch"> → taban <select class="bs"><option>2</option><option>16</option></select>
          <button class="btn sm stepb">Adım ▶</button> <button class="btn ghost sm rst">Baştan</button>
          <div class="calc out" style="margin-top:10px"></div></div>
          <div class="rule">Kesirde basamaklar <b>düz sırada</b> (yukarıdan aşağı) okunur. İlk elde edilen basamak virgülün hemen sağına gelir (r<sup>-1</sup>).</div>
          <div class="warn"><b>Tam ve kesir kısmı ayrı ayrı çevrilir</b>, sonra virgülle birleştirilir: 46.6875 → 101110 . 1011 = (101110.1011)<sub>2</sub></div>
          <p class="note">Bazı kesirler sonlanmaz. Örneğin 0.6831 → hex: A, E, D, F, … (slayt 22). O durumda istenen sayıda basamak alınır.</p>`,
        init(el) {
          const out = $('.out', el); let st = null;
          const reset = () => { let f = parseFloat($('.F', el).value); if (!(f > 0 && f < 1)) f = .6875; st = { f, F: f, b: +$('.bs', el).value, rows: [], digs: [] }; out.innerHTML = '<span class="dim">"Adım"a bas.</span>'; };
          const paint = () => {
            let h = st.rows.join('<br>');
            if (st.f === 0 || st.digs.length >= 8) h += `<br><br>Düz sırada: <b>(0.${st.digs.map(d => DIG[d]).join('')})<sub>${st.b}</sub></b>${st.f ? ' …(devam ediyor)' : ''}`;
            out.innerHTML = h;
          };
          $('.stepb', el).onclick = () => {
            if (st.f === 0 || st.digs.length >= 8) return;
            const p = st.f * st.b, d = Math.floor(p + 1e-12);
            st.rows.push(`${+st.f.toFixed(6)} × ${st.b} = ${+p.toFixed(6)} → basamak <span class="r">${d}${d > 9 ? ' (' + DIG[d] + ')' : ''}</span>`);
            st.digs.push(d); st.f = +(p - d).toFixed(10); if (st.f < 1e-9) st.f = 0; Sound.tick(); paint();
          };
          $('.rst', el).onclick = reset; $('.F', el).onchange = reset; $('.bs', el).onchange = reset; reset();
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul>
          <li><b>Tam kısım:</b> r'ye böl, kalanları topla → <b>ters sırada</b> oku (ilk kalan = LSB)</li>
          <li><b>Kesir kısım:</b> r ile çarp, tam kısımları al → <b>düz sırada</b> oku (ilk = r<sup>-1</sup>)</li>
          <li>Taban 10'dan büyükse 10–15 → A–F</li>
          <li>Tam ve kesir <b>ayrı</b> çevrilir, sonra birleştirilir</li></ul></div>`,
      },
    ],
    skills: [
      { id: 'r1.div.b2', name: 'Bölme: onluk → binary', ref: R(20), gen: genDiv(2), long: true },
      { id: 'r1.div.b8', name: 'Bölme: onluk → octal', ref: R(18), gen: genDiv(8), long: true },
      { id: 'r1.div.b16', name: 'Bölme: onluk → hex', ref: R(22), gen: genDiv(16), long: true },
      {
        id: 'r1.div.frac', name: 'Çarpma: kesir → binary', ref: R(21), long: true,
        gen() {
          const m = pick([3, 4, 4, 5]), k = rnd(1, 2 ** m - 1) | 1;
          let f = k / 2 ** m; const F0 = f, rows = [], digs = [];
          while (f > 0) {
            const p = f * 2, d = Math.floor(p);
            rows.push({
              html: `${f} × 2 = [[0]] → basamak [[1]]`,
              fields: [{ answer: String(p), check: u => decEq(u, p), w: 7, show: String(p) }, { answer: String(d), w: 1 }],
              why: `${f} × 2 = ${p}. Tam kısım <b>${d}</b> basamak olur, kesir ${p - d} ile devam edilir.`,
            });
            digs.push(d); f = p - d;
          }
          const ans = digs.join('');
          rows.push(orderFracRow, { html: `(${F0})<sub>10</sub> = ( 0.[[0]] )<sub>2</sub>`, fields: [{ answer: ans, check: u => sameNum('0.' + u.replace(/^0?\./, ''), '0.' + ans), w: 8 }], why: `Basamaklar düz sırada: ${ans}` });
          return stepTask({ q: `${B(F0, 10)} kesrini <b>binary</b>'ye çevir. Her adımda çarpımı ve elde edilen basamağı yaz.`, qText: `${F0} → binary (çarpma)`, rows, answer: B('0.' + ans, 2), why: `Basamaklar düz sırada (ilk = 2<sup>-1</sup>): <b>0.${ans}</b>` });
        },
      },
      {
        id: 'r1.div.mix', name: 'Kesirli onluk → binary', ref: R('20–21'),
        gen() {
          const i = rnd(5, 99), k = rnd(1, 15), val = i + k / 16, fb = bin(k, 4).replace(/0+$/, ''), ans = `${bin(i)}.${fb}`;
          return inputTask({ q: `${B(val, 10)} = ( ? )<sub>2</sub>`, answer: ans, placeholder: 'ör. 101.011',
            why: `Tam ve kesir <b>ayrı</b> çevrilir.<br>Tam: ${i} → bölmeyle → ${bin(i)}<br>Kesir: ${k / 16} → ×2 ile → .${fb}<br>Birleştir: <b>${ans}</b>`,
            hint: `Önce ${i}'yi böl, sonra ${k / 16}'yı 2 ile çarparak çevir.` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 3 — Gruplama (binary ↔ octal/hex)
     ================================================================= */
  const S3 = {
    id: 'r1s3', title: 'Gruplama: Octal & Hex', ref: R(24),
    lesson: [
      {
        t: 'Neden 3 ve 4?',
        html: `<p>8 = 2<sup>3</sup> ve 16 = 2<sup>4</sup>. Bu yüzden <b>her octal basamak tam olarak 3 bite</b>, <b>her hex basamak tam olarak 4 bite</b> karşılık gelir. Bölme yapmaya gerek kalmaz, sadece gruplarsın.</p>
          <div class="demo">Binary: <input class="txt bn" value="1011100011.0001011101" style="width:24ch">
          <label style="margin-left:10px"><input type="radio" name="g" value="3" checked> Octal (3'lü)</label> <label><input type="radio" name="g" value="4"> Hex (4'lü)</label>
          <div class="out"></div><div class="calc res"></div></div>
          <div class="warn"><b>Gruplama her zaman virgülden başlar!</b><br>Tam kısımda virgülden <b>sola</b> doğru, kesir kısmında virgülden <b>sağa</b> doğru gruplanır. Eksik kalan grup <b>0 ile doldurulur</b> (tam kısımda sola, kesirde sağa). Kesirdeki dolgu çok önemlidir: <span class="mono">.1</span> → <span class="mono">.100</span> = 4 olur, 1 değil!</div>`,
        init(el) {
          const show = () => {
            const s = $('.bn', el).value.trim(), g = +$('input[name=g]:checked', el).value;
            if (!/^[01]+(\.[01]+)?$/.test(s)) { $('.out', el).innerHTML = '<span class="dim">Sadece 0/1 ve tek bir nokta.</span>'; $('.res', el).innerHTML = ''; return; }
            const [I, F = ''] = s.split('.'); const r = groupConv(I, F, g);
            $('.out', el).innerHTML = r.html;
            $('.res', el).innerHTML = `(${s})<sub>2</sub> = <b>(${r.res})<sub>${g === 3 ? 8 : 16}</sub></b>`;
          };
          $('.bn', el).oninput = show; $$('input[name=g]', el).forEach(x => x.onchange = show); show();
        },
      },
      {
        t: 'Ters yön: aç!',
        html: `<p>Octal ya da hex'ten binary'ye geçerken <b>her basamağı 3 (veya 4) bitlik karşılığına açarsın</b>. Baştaki ve sondaki gereksiz 0'lar sonra atılabilir.</p>
          <div class="calc">(743.056)<sub>8</sub> = 111 100 011 . 000 101 110 = (111100011.00010111)<sub>2</sub><br>(A49.0C6)<sub>16</sub> = 1010 0100 1001 . 0000 1100 0110</div>
          <table class="t" style="margin-top:12px"><tr>${[...Array(16)].map((_, i) => `<th>${DIG[i]}</th>`).join('')}</tr><tr>${[...Array(16)].map((_, i) => `<td>${bin(i, 4)}</td>`).join('')}</tr></table>
          <p class="note">Bu tabloyu ezberle: hex ↔ binary dönüşümleri sınavda çok sık çıkar. İpucu: 8-4-2-1 ağırlıklarıyla anında hesaplanır (ör. B = 11 = 8+2+1 → 1011).</p>
          <div class="rule"><b>Octal ↔ Hex:</b> Doğrudan çevrilmez. Önce binary'ye aç, sonra yeniden grupla. (8 → 2 → 16)</div>
          <p>Octal ve hex, binary'nin <b>kısa yazımıdır</b>. Bilgisayarın içindeki gösterimle doğrudan ilişkili oldukları için kullanılırlar.</p>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul><li>Binary → octal: virgülden başlayarak <b>3'lü</b> grupla, hex: <b>4'lü</b></li>
          <li>Eksik grup 0 ile doldurulur: tam kısımda <b>sola</b>, kesirde <b>sağa</b></li>
          <li>Octal/hex → binary: her basamak 3/4 bite açılır</li>
          <li>Octal ↔ hex: binary üzerinden</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r1.grp.gap', name: 'Ayraç yerleştir + çevir', ref: R(24), long: true,
        gen() {
          const g = pick([3, 4]), b = g === 3 ? 8 : 16;
          const I = '1' + randBits(rnd(g, 9));
          const F = Math.random() < .35 ? '' : (randBits(rnd(1, 6)) + '1');
          const want = new Set();
          for (let j = 0; j < I.length - 1; j++) if ((I.length - 1 - j) % g === 0) want.add('i' + j);
          for (let j = 0; j < F.length - 1; j++) if ((j + 1) % g === 0) want.add('f' + j);
          const conv = groupConv(I, F, g), s = I + (F ? '.' + F : '');
          return {
            q: `${s}_2 → taban ${b} (gruplama)`, xp: 15,
            render(box, done) {
              let errors = 0;
              const bits = (str, p) => [...str].map((c, j) => `<span class="bit">${c}</span>${j < str.length - 1 ? `<button class="gapbtn" data-id="${p}${j}"></button>` : ''}`).join('');
              box.innerHTML = `<div class="q">${B(s, 2)} sayısını <b>${b === 8 ? 'octal' : 'hex'}</b>'e çevireceksin.</div>
                <div class="sub">1) Bitlerin arasına tıklayarak <b>${g}'lü grup ayraçlarını</b> yerleştir.</div>
                <div class="gapline">${bits(I, 'i')}${F ? `<span class="radix">.</span>${bits(F, 'f')}` : ''}</div>
                <div class="row"><button class="btn primary c1">Ayraçları kontrol et</button><span class="m1 step-why"></span></div>
                <div class="ph2" style="display:none"><div class="out"></div><div class="sub">2) Şimdi her grubu ${b === 8 ? 'octal' : 'hex'} basamağa çevir.</div>
                <div class="row">${B('…', 2)} = <input class="ans r2" style="min-width:140px" autocomplete="off"> <sub>${b}</sub> <button class="btn primary c2">Kontrol ⏎</button></div></div>`;
              const sel = new Set();
              $$('.gapbtn', box).forEach(x => x.onclick = () => { const id = x.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); x.classList.toggle('on'); x.classList.remove('miss'); Sound.tick(); });
              let tries = 0;
              $('.c1', box).onclick = () => {
                const ok = sel.size === want.size && [...want].every(x => sel.has(x));
                if (!ok) {
                  if (tries === 0) errors++; tries++; Sound.bad();
                  $('.m1', box).innerHTML = `✘ Virgülden başla! Tam kısımda virgülden <b>sola</b>, kesirde <b>sağa</b> doğru ${g}'er bit say.${tries >= 2 ? ' (Doğru yerler kırmızıyla gösterildi.)' : ''}`;
                  if (tries >= 2) $$('.gapbtn', box).forEach(x => { if (want.has(x.dataset.id) && !sel.has(x.dataset.id)) x.classList.add('miss'); });
                  return;
                }
                Sound.tick(); $('.m1', box).innerHTML = '<span class="okmsg">✔ Ayraçlar doğru.</span>';
                $$('.gapbtn', box).forEach(x => x.disabled = true); $('.c1', box).disabled = true;
                $('.ph2', box).style.display = '';
                $('.out', box).innerHTML = conv.html.replace(/<span class="dg">.*?<\/span>/g, '<span class="dg">?</span>');
                const inp = $('.r2', box); inp.focus();
                const sub2 = () => {
                  const v = inp.value.trim(); if (!v) return;
                  const ok2 = sameNum(v, conv.res);
                  inp.classList.add(ok2 ? 'good' : 'bad');
                  $('.out', box).innerHTML = conv.html;
                  done(ok2 && errors === 0, { your: `${v}${errors ? ' (ayraçlarda hata vardı)' : ''}`, answer: B(conv.res, b), partial: ok2 && errors > 0, why: `Virgülden başlayarak ${g}'lü gruplar:<br>${conv.html}` });
                };
                inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); sub2(); } });
                $('.c2', box).onclick = sub2;
              };
            },
          };
        },
      },
      {
        id: 'r1.grp.b2h', name: 'Binary → hex', ref: R(24),
        gen() {
          const I = '1' + randBits(rnd(4, 10)), F = Math.random() < .5 ? '' : randBits(rnd(0, 6)) + '1';
          const c = groupConv(I, F, 4);
          return inputTask({ q: `${B(I + (F ? '.' + F : ''), 2)} = ( ? )<sub>16</sub>`, answer: c.res, why: `Virgülden başlayarak 4'lü grupla:<br>${c.html}` });
        },
      },
      {
        id: 'r1.grp.b2o', name: 'Binary → octal', ref: R(24),
        gen() {
          const I = '1' + randBits(rnd(3, 9)), F = Math.random() < .5 ? '' : randBits(rnd(0, 5)) + '1';
          const c = groupConv(I, F, 3);
          return inputTask({ q: `${B(I + (F ? '.' + F : ''), 2)} = ( ? )<sub>8</sub>`, answer: c.res, why: `Virgülden başlayarak 3'lü grupla:<br>${c.html}` });
        },
      },
      {
        id: 'r1.grp.h2b', name: 'Hex → binary', ref: R(24),
        gen() {
          const s = randDigits(rnd(2, 3), 16) + (Math.random() < .5 ? '' : '.' + randFracDigits(rnd(1, 2), 16));
          const c = digitsToBin(s, 4);
          return inputTask({ q: `${B(s, 16)} = ( ? )<sub>2</sub>`, answer: c.res, placeholder: 'boşluk bırakabilirsin',
            why: `Her hex basamağı 4 bite aç: ${c.map}<br>Sonuç (baştaki/sondaki gereksiz 0'lar atılmış): <b>${c.res}</b>` });
        },
      },
      {
        id: 'r1.grp.o2h', name: 'Octal → hex (binary üzerinden)', ref: R(24),
        gen() {
          const s = randDigits(rnd(2, 3), 8), b = digitsToBin(s, 3), v = parseInt(s, 8), hx = v.toString(16).toUpperCase();
          return inputTask({ q: `${B(s, 8)} = ( ? )<sub>16</sub>`, answer: hx,
            why: `Doğrudan çevrilmez, binary üzerinden gidilir.<br>1) Her basamağı 3 bite aç: ${b.map} → ${b.res}<br>2) 4'lü yeniden grupla: ${groupConv(b.res, '', 4).html}` , hint: 'Önce her octal basamağı 3 bite aç, sonra sağdan 4\'lü grupla.' });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 4 — Kaç Bit?
     ================================================================= */
  const nBits = m => { let n = 0; while (2 ** n < m) n++; return n; };
  const S4 = {
    id: 'r1s4', title: 'Kaç Bit Gerekir?', ref: R('25–29'),
    lesson: [
      {
        t: 'm eleman için n bit',
        html: `<p><b>Binary kod:</b> Temsil edilecek elemanların her birine ayrı bir bit dizisi (<b>code word</b>) atamaktır. Tek şart: her eleman <b>benzersiz</b> kodlanmalı.</p>
          <p>n bit ile 2<sup>n</sup> farklı kod sözcüğü vardır. m eleman için <b>en küçük n</b> şöyle bulunur:</p>
          <div class="rule mono" style="text-align:center;font-size:19px"><b>2<sup>n</sup> ≥ m &gt; 2<sup>n−1</sup></b></div>
          <div class="demo"><label>Eleman sayısı m = <b class="mv mono">7</b> <input type="range" min="1" max="70" value="7"></label>
          <div class="calc out"></div><div class="cells" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:8px;max-width:620px"></div></div>
          <p class="note">Örnek (slayt 26): gökkuşağının 7 rengi → 3 bit. 8 koddan biri (100) kullanılmaz.</p>`,
        init(el) {
          const rng = $('input', el);
          const show = () => {
            const m = +rng.value, n = nBits(m);
            $('.mv', el).textContent = m;
            $('.out', el).innerHTML = `2<sup>${n}</sup> = ${2 ** n} ≥ ${m}${n > 0 ? ` &gt; 2<sup>${n - 1}</sup> = ${2 ** (n - 1)}` : ''} → <b>n = ${n} bit</b> &nbsp; <span class="r">(${2 ** n - m} kod kullanılmaz)</span>`;
            $('.cells', el).innerHTML = [...Array(2 ** n)].map((_, i) => `<span class="mono" style="font-size:11px;padding:2px 4px;border-radius:3px;border:1px ${i < m ? 'solid #e0ad4a;background:rgba(224,173,74,.18)' : 'dashed #2c6b4f;color:#56786a'}">${bin(i, n) || '–'}</span>`).join('');
          };
          rng.oninput = show; show();
        },
      },
      {
        t: 'r tabanında n basamak, one-hot',
        html: `<p>Genel kural: <b>r tabanında n basamakla r<sup>n</sup> farklı eleman</b> temsil edilebilir. Ama istersen daha az (m &lt; r<sup>n</sup>) eleman da kodlayabilirsin.</p>
          <table class="t"><tr><th>Eleman</th><th>2-bit binary</th><th>4-bit one-hot</th></tr>
          <tr><td>0</td><td>00</td><td>0001</td></tr><tr><td>1</td><td>01</td><td>0010</td></tr><tr><td>2</td><td>10</td><td>0100</td></tr><tr><td>3</td><td>11</td><td>1000</td></tr></table>
          <div class="rule"><b>One-hot kod:</b> Her kod sözcüğünde yalnızca <b>bir</b> bit 1'dir. m eleman için <b>m bit</b> gerekir. Bit sayısı açısından savurgandır ama hangi elemanın seçili olduğu tek bakışta anlaşılır.</div>`,
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul><li>m eleman için minimum bit: <b>2<sup>n</sup> ≥ m &gt; 2<sup>n−1</sup></b> (yani n = ⌈log<sub>2</sub> m⌉)</li>
          <li>Kullanılmayan kod sayısı: 2<sup>n</sup> − m</li><li>r tabanında n basamak → r<sup>n</sup> eleman</li><li>One-hot: m eleman → m bit</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r1.bits.n', name: 'm eleman → kaç bit', ref: R(27),
        gen() {
          const m = rnd(3, 300), n = nBits(m);
          return inputTask({ q: `<b>${m}</b> farklı elemanı binary olarak kodlamak için <b>en az kaç bit</b> gerekir?`, answer: String(n),
            why: `2<sup>${n}</sup> = ${2 ** n} ≥ ${m} &gt; 2<sup>${n - 1}</sup> = ${2 ** (n - 1)} → <b>${n} bit</b>. (${n - 1} bit yalnızca ${2 ** (n - 1)} eleman verir, yetmez.)` });
        },
      },
      {
        id: 'r1.bits.unused', name: 'Kullanılmayan kod sayısı', ref: R(26),
        gen() {
          const m = rnd(3, 100), n = nBits(m);
          if (2 ** n === m) return this.gen();
          return inputTask({ q: `${m} eleman <b>minimum bit</b> ile kodlanırsa kaç kod sözcüğü <b>kullanılmadan</b> kalır?`, answer: String(2 ** n - m),
            why: `Minimum bit: n = ${n} (2<sup>${n}</sup> = ${2 ** n} ≥ ${m}). Kullanılmayan: ${2 ** n} − ${m} = <b>${2 ** n - m}</b>.` });
        },
      },
      {
        id: 'r1.bits.rn', name: 'r tabanında n basamak', ref: R(29),
        gen() {
          const r = pick([2, 3, 8, 10, 16]), n = rnd(2, r > 8 ? 3 : 5);
          return inputTask({ q: `${r} tabanında <b>${n} basamak</b> ile en fazla kaç farklı eleman temsil edilebilir?`, answer: String(r ** n),
            why: `Her basamak ${r} değer alabilir: ${r}<sup>${n}</sup> = <b>${r ** n}</b>` });
        },
      },
      {
        id: 'r1.bits.onehot', name: 'One-hot kod', ref: R(29),
        gen() {
          const m = rnd(4, 12), n = nBits(m);
          if (Math.random() < .5) {
            return inputTask({ q: `${m} elemanı <b>one-hot</b> kodla kodlamak için kaç bit gerekir?`, answer: String(m),
              why: `One-hot'ta her elemanın kendi biti vardır ve yalnızca o bit 1'dir → <b>${m} bit</b>. (Binary ile ${n} bit yeterdi.)` });
          }
          const k = rnd(0, Math.min(m, 8) - 1), w = Math.min(m, 8), code = bin(2 ** k, w);
          const opts = shuffle([code, bin(2 ** k | 2 ** ((k + 1) % w), w), bin(0, w), bin((2 ** w - 1) ^ (2 ** k), w)]);
          return choiceTask({ q: `${w}-bitlik kodlardan hangisi <b>geçerli bir one-hot</b> kod sözcüğüdür?`, options: opts, correct: opts.indexOf(code), mono: true,
            why: `One-hot kodda <b>tam olarak bir</b> bit 1'dir. Sadece <b>${code}</b> bu şartı sağlıyor.` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 5 — Kodlar: BCD, Excess-3, 84-2-1, Gray
     ================================================================= */
  const S5 = {
    id: 'r1s5', title: 'Kodlar: BCD · Excess-3 · Gray', ref: R('30–33, 37'),
    lesson: [
      {
        t: 'BCD (8421) kodu',
        html: `<p><b>BCD (Binary Coded Decimal)</b> kodunda her onluk rakam (0–9) ayrı ayrı <b>4 bit</b> ile kodlanır. Ağırlıklar <b>8, 4, 2, 1</b>'dir, yani BCD <b>ağırlıklı (weighted)</b> bir koddur.</p>
          <div class="demo"><div class="row">Kod: <select class="sch"><option value="bcd">BCD 8421</option><option value="ex3">Excess-3</option><option value="c84">8, 4, −2, −1</option></select></div>
          <div class="bb"></div><div class="calc out"></div></div>
          <div class="rule">4 bit = 16 kombinasyon, ama sadece 10 rakam var → <b>6 geçersiz (invalid) BCD kod sözcüğü</b>: <span class="mono">1010, 1011, 1100, 1101, 1110, 1111</span>.</div>
          <p><b>Excess-3:</b> BCD + 3 (yani 0011 eklenir). 0 → 0011, 9 → 1100.<br><b>8, 4, −2, −1:</b> Ağırlıklardan ikisi negatiftir. Örneğin 0111 = 4 − 2 − 1 = 1.</p>
          <p class="note">Excess-3 ve 84-2-1 <i>kendini tümleyen (self-complementing)</i> kodlardır: bitleri ters çevirince 9'a tümleyeni (9 − d) elde edilir.</p>`,
        init(el) {
          const out = $('.out', el), sch = $('.sch', el);
          let bb;
          const show = v => {
            const s = bin(v, 4), a = [...s].map(Number), t = sch.value;
            let d, txt;
            if (t === 'bcd') { d = v <= 9 ? v : null; txt = `8·${a[0]} + 4·${a[1]} + 2·${a[2]} + 1·${a[3]} = ${v}`; }
            else if (t === 'ex3') { d = v >= 3 && v <= 12 ? v - 3 : null; txt = `binary değer ${v} − 3 = ${v - 3}`; }
            else { const w = 8 * a[0] + 4 * a[1] - 2 * a[2] - a[3]; d = C84.indexOf(s) >= 0 ? C84.indexOf(s) : null; txt = `8·${a[0]} + 4·${a[1]} − 2·${a[2]} − 1·${a[3]} = ${w}`; }
            out.innerHTML = `${s}: ${txt} → ${d === null ? '<b style="color:var(--red)">GEÇERSİZ kod sözcüğü</b>' : `rakam <b style="color:var(--led)">${d}</b>`}`;
          };
          const build = () => {
            const w = sch.value === 'c84' ? [8, 4, -2, -1] : sch.value === 'ex3' ? [8, 4, 2, 1] : [8, 4, 2, 1];
            bb = bitBoard($('.bb', el), 4, { value: sch.value === 'ex3' ? 8 : 9, weights: w, labels: sch.value === 'ex3' ? ['8', '4', '2', '1 (−3)'] : w, onChange: show });
            show(bb.value());
          };
          sch.onchange = build; build();
        },
      },
      {
        t: 'Dikkat: dönüşüm mü, kodlama mı?',
        html: `<p>Sınavlarda en sık yapılan hata budur (slayt 33). <b>Dönüşüm (conversion)</b> sayının <i>tamamını</i> 2 tabanına çevirir. <b>Kodlama (coding)</b> ise <i>her rakamı ayrı ayrı</i> 4 bite çevirir.</p>
          <div class="demo">Onluk sayı: <input class="txt dn" value="13" style="width:8ch"><div class="calc out" style="margin-top:8px"></div></div>
          <div class="warn">13 → binary <b>1101</b> (dönüşüm) ama BCD <b>0001 0011</b> (kodlama). İkisi farklı bit dizileridir!</div>`,
        init(el) {
          const show = () => {
            const n = parseInt($('.dn', el).value); if (!(n >= 0 && n < 1e6)) return;
            $('.out', el).innerHTML = `Dönüşüm (binary): <b>${bin(n)}</b> <span class="dim">(${bin(n).length} bit)</span><br>Kodlama (BCD): <b>${[...String(n)].map(c => BCD(+c)).join(' ')}</b> <span class="dim">(${String(n).length * 4} bit)</span><br>Excess-3: ${[...String(n)].map(c => EX3(+c)).join(' ')}`;
          };
          $('.dn', el).oninput = show; show();
        },
      },
      {
        t: 'Gray kodu',
        html: `<p><b>Gray kodunda</b> art arda gelen iki sayının kodu <b>yalnızca 1 bit</b> farklıdır (sondan başa geçişte de: 7 → 0). Ağırlıklı bir kod değildir.</p>
          <table class="t gt"></table>
          <div class="rule"><b>Binary → Gray:</b> MSB aynen kalır. Sonraki her Gray biti: <i>o bit ile solundaki binary bit farklıysa 1, aynıysa 0</i> (XOR).<br>
          <b>Gray → Binary:</b> MSB aynen kalır. Sonraki her binary biti: <i>bir önce bulunan binary bit ile o Gray biti farklıysa 1</i>.</div>
          <div class="demo">Binary'yi seç (LED): <div class="bb"></div><div class="calc out"></div></div>`,
        init(el) {
          let h = '<tr><th>Onluk</th><th>Binary</th><th>Gray</th><th>Değişen bit</th></tr>';
          for (let i = 0; i < 8; i++) {
            const g = bin(gray(i), 3), pg = bin(gray((i + 7) % 8), 3);
            h += `<tr><td>${i}</td><td>${bin(i, 3)}</td><td>${[...g].map((c, j) => c !== pg[j] ? `<b style="color:var(--led)">${c}</b>` : c).join('')}</td><td class="dim">${i === 0 ? '(7→0)' : ''} ${[...g].findIndex((c, j) => c !== pg[j]) === 0 ? 'MSB' : [...g].findIndex((c, j) => c !== pg[j]) === 1 ? 'orta' : 'LSB'}</td></tr>`;
          }
          $('.gt', el).innerHTML = h;
          const show = v => {
            const b = bin(v, 4), g = bin(gray(v), 4);
            const steps = [`g₃ = b₃ = ${b[0]}`].concat([1, 2, 3].map(i => `g${3 - i} = (${b[i - 1]} ≠ ${b[i]}) ? → ${g[i]}`));
            $('.out', el).innerHTML = `Binary ${b} → Gray <b>${g}</b><br><span class="dim">${steps.join(' · ')}</span>`;
          };
          bitBoard($('.bb', el), 4, { value: 6, onChange: show }); show(6);
        },
      },
      {
        t: 'Kural kartı',
        html: `<div class="rule"><ul><li><b>BCD:</b> her rakam ayrı 4 bit, ağırlık 8-4-2-1. 1010–1111 arasındaki 6 kod geçersiz.</li>
          <li><b>Excess-3:</b> BCD + 0011</li><li><b>84-2-1:</b> ağırlıklar 8, 4, −2, −1</li>
          <li><b>Dönüşüm ≠ kodlama:</b> 13 → 1101 ama BCD 0001 0011</li>
          <li><b>Gray:</b> komşu kodlar 1 bit farklı. b→g: g<sub>i</sub> = b<sub>i</sub> ⊕ b<sub>i+1</sub>, MSB aynı.</li></ul></div>`,
      },
    ],
    skills: [
      {
        id: 'r1.code.bcd', name: 'Onluk → BCD', ref: R(31),
        gen() {
          const n = rnd(10, 999), ans = [...String(n)].map(c => BCD(+c)).join(' ');
          return inputTask({ q: `${B(n, 10)} sayısının <b>BCD</b> kodu nedir?`, answer: ans, check: u => bitsEq(u, ans), placeholder: 'ör. 0001 0011',
            why: `Her rakam ayrı ayrı 4 bite: ${[...String(n)].map(c => `${c}→${BCD(+c)}`).join(', ')} → <b>${ans}</b>` });
        },
      },
      {
        id: 'r1.code.bcd2d', name: 'BCD → onluk', ref: R(31),
        gen() {
          const n = rnd(10, 999), s = [...String(n)].map(c => BCD(+c)).join(' ');
          return inputTask({ q: `BCD kodu <span class="mono">${s}</span> hangi onluk sayıdır?`, answer: String(n),
            why: `4'lü gruplar ayrı ayrı okunur (binary sayı gibi DEĞİL): ${s.split(' ').map(g => `${g}→${parseInt(g, 2)}`).join(', ')} → <b>${n}</b>` });
        },
      },
      {
        id: 'r1.code.invalid', name: 'Geçersiz BCD kodu', ref: R(31),
        gen() {
          const bad = rnd(10, 15), goods = shuffle([...Array(10).keys()]).slice(0, 3);
          const opts = shuffle([bad, ...goods]).map(v => bin(v, 4));
          return choiceTask({ q: 'Hangisi <b>geçerli bir BCD</b> kod sözcüğü <b>DEĞİLDİR</b>?', options: opts, correct: opts.indexOf(bin(bad, 4)), mono: true,
            why: `${bin(bad, 4)} = ${bad} &gt; 9. BCD sadece 0–9 rakamlarını kodlar. 1010…1111 arasındaki <b>6 kod geçersizdir</b>.` });
        },
      },
      {
        id: 'r1.code.ex3', name: 'Excess-3 kodu', ref: R(32),
        gen() {
          const n = rnd(0, 99), ds = [...String(n)], ans = ds.map(c => EX3(+c)).join(' ');
          return inputTask({ q: `${B(n, 10)} sayısının <b>Excess-3</b> kodu nedir?`, answer: ans, check: u => bitsEq(u, ans), placeholder: 'her rakam 4 bit',
            why: `Her rakama 3 ekle, sonra 4 bit binary: ${ds.map(c => `${c}+3=${+c + 3}→${EX3(+c)}`).join(', ')} → <b>${ans}</b>` });
        },
      },
      {
        id: 'r1.code.c84', name: '8,4,−2,−1 kodu', ref: R(32),
        gen() {
          const d = rnd(0, 9), c = C84[d], a = [...c].map(Number);
          const w = `8·${a[0]} + 4·${a[1]} − 2·${a[2]} − 1·${a[3]} = ${d}`;
          if (Math.random() < .5) return inputTask({ q: `<b>8, 4, −2, −1</b> kodunda <span class="mono">${c}</span> hangi rakamdır?`, answer: String(d), why: `Ağırlıklarla çarp ve topla: ${w}` });
          return inputTask({ q: `${d} rakamının <b>8, 4, −2, −1</b> kodu nedir?`, answer: c, check: u => bitsEq(u, c), placeholder: '4 bit',
            why: `${c}: ${w}.${d >= 1 && d <= 4 ? ' (Küçük rakamlarda 4 ile başlayıp −2 ve −1 ile azaltırız.)' : ''}` });
        },
      },
      {
        id: 'r1.code.conv', name: 'Dönüşüm mü kodlama mı?', ref: R(33),
        gen() {
          const n = rnd(10, 99), bc = [...String(n)].map(c => BCD(+c)).join(' '), bn = bin(n, 8).replace(/(.{4})/, '$1 ');
          const ex = [...String(n)].map(c => EX3(+c)).join(' ');
          const askBCD = Math.random() < .5;
          let opts = [bc, bn, ex];
          const dist = bin((n + rnd(1, 5)) % 100, 8).replace(/(.{4})/, '$1 ');
          if (!opts.includes(dist)) opts.push(dist);
          opts = shuffle([...new Set(opts)]);
          return choiceTask({ q: `${B(n, 10)} için <b>${askBCD ? 'BCD kodu' : '8-bit binary dönüşümü'}</b> hangisidir?`, options: opts, correct: opts.indexOf(askBCD ? bc : bn), mono: true,
            why: `Dönüşüm (sayının tamamı → taban 2): ${n} = <b>${bn}</b><br>Kodlama (her rakam ayrı): BCD = <b>${bc}</b><br>(Excess-3 ise ${ex}.)` });
        },
      },
      {
        id: 'r1.code.b2g', name: 'Binary → Gray', ref: R(37),
        gen() {
          const v = rnd(1, 15), b = bin(v, 4), g = bin(gray(v), 4);
          return inputTask({ q: `Binary <span class="mono">${b}</span> sayısının <b>Gray</b> kodu nedir?`, answer: g, check: u => bitsEq(u, g), placeholder: '4 bit',
            why: `MSB aynen: ${b[0]}. Sonra komşu binary bitleri karşılaştır (farklı→1, aynı→0): ${[1, 2, 3].map(i => `${b[i - 1]}${b[i]}→${b[i - 1] !== b[i] ? 1 : 0}`).join(', ')} → <b>${g}</b>` });
        },
      },
      {
        id: 'r1.code.g2b', name: 'Gray → binary', ref: R(37),
        gen() {
          const v = rnd(1, 15), b = bin(v, 4), g = bin(gray(v), 4);
          const st = [`b₃ = g₃ = ${b[0]}`];
          for (let i = 1; i < 4; i++) st.push(`${b[i - 1]}≠${g[i]}? → ${b[i]}`);
          return inputTask({ q: `Gray kodu <span class="mono">${g}</span> hangi binary sayıdır?`, answer: b, check: u => bitsEq(u, b), placeholder: '4 bit',
            why: `MSB aynen kalır. Sonra her adımda <i>bir önce bulunan binary bit</i> ile Gray bitini karşılaştır: ${st.join(' · ')} → <b>${b}</b> (= ${ungray(gray(v))})` });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 6 — BCD Toplama
     ================================================================= */
  function bcdColumnRows(a, b, cin) {
    const s = a + b + cin, rows = [];
    rows.push({
      html: `${BCD(a)} + ${BCD(b)}${cin ? ' + 1 (carry)' : ''} = [[0]] <span class="dim">(ham binary toplam)</span>`,
      fields: [{ answer: bin(s), w: 5 }],
      why: `${a} + ${b}${cin ? ' + 1' : ''} = ${s} → binary ${bin(s, 5)}`,
    });
    rows.push({
      html: `Ham toplam ${bin(s, 5)} (= ${s}). Düzeltme gerekli mi?`,
      choice: { options: ['Evet → +0110 (6) ekle', 'Hayır, toplam geçerli bir BCD'], correct: s > 9 ? 0 : 1 },
      why: s > 9 ? `${s} &gt; 9. Sonuç geçersiz bir BCD (ya da 4 bitten taşma var). 6 geçersiz kodu atlamak için <b>6 eklenir</b>.` : `${s} ≤ 9. Sonuç zaten geçerli bir BCD rakamı, düzeltme gerekmez.`,
      after: s > 9 ? 'Toplam > 9 → +6 düzeltmesi.' : 'Toplam ≤ 9 → olduğu gibi kalır.',
    });
    if (s > 9) rows.push({
      html: `${bin(s, 5)} + 0110 = [[0]]`, fields: [{ answer: bin(s + 6), w: 5 }],
      why: `${s} + 6 = ${s + 6} → ${bin(s + 6, 5)}`,
      after: `Alttaki 4 bit (${bin((s + 6) & 15, 4)}) = rakam, en üstteki bit = carry.`,
    });
    rows.push({
      html: `Bu basamak: carry = [[0]], BCD rakam = [[1]]`,
      fields: [{ answer: s > 9 ? '1' : '0', w: 1 }, { answer: BCD(s % 10), check: u => bitsEq(u, BCD(s % 10)), w: 4, show: BCD(s % 10) }],
      why: `${s > 9 ? `${s} = 10 + ${s - 10} → carry 1, rakam ${s - 10}` : `carry 0, rakam ${s}`} → ${BCD(s % 10)}`,
    });
    return { rows, d: s % 10, c: s > 9 ? 1 : 0 };
  }
  const S6 = {
    id: 'r1s6', title: 'BCD Toplama', ref: R('34–36'),
    lesson: [
      {
        t: 'Neden +6?',
        html: `<p>İki BCD rakamını binary olarak topladığında sonuç 0–18 (carry ile 19) arasında olur. <b>Toplam ≤ 9</b> ise sonuç zaten geçerli bir BCD'dir. <b>Toplam &gt; 9</b> ise, yani geçersiz bir kod ya da 4 bitten taşma (carry) varsa, sonuca <b>6 (0110) eklenir</b>.</p>
          <div class="rule"><b>Neden 6?</b> 4 bitte 16 kod var, BCD bunlardan sadece 10'unu kullanıyor. Aradaki 16 − 10 = <b>6 geçersiz kod</b> atlanmalı. +6 eklemek, toplamı bir sonraki basamağa (carry) taşır ve doğru rakamı bırakır.</div>
          <div class="demo">a = <input class="txt A" type="number" min="0" max="9" value="8" style="width:6ch"> + b = <input class="txt Bv" type="number" min="0" max="9" value="5" style="width:6ch">
          <div class="calc out" style="margin-top:10px"></div></div>`,
        init(el) {
          const show = () => {
            const a = Math.min(9, Math.max(0, +$('.A', el).value || 0)), b = Math.min(9, Math.max(0, +$('.Bv', el).value || 0)), s = a + b;
            let h = `&nbsp; ${BCD(a)} &nbsp;(${a})<br>+ ${BCD(b)} &nbsp;(${b})<br>= ${bin(s, 5)} &nbsp;(${s}) `;
            if (s > 9) h += `<span class="r">→ ${s} &gt; 9, düzeltme!</span><br>+ 00110<br>= <b>${bin(s + 6, 5)}</b> → carry <b>1</b>, rakam <b>${BCD(s - 10)}</b> (${s - 10})<br>BCD sonuç: <b>0001 ${BCD(s - 10)}</b> = ${s}`;
            else h += `→ ≤ 9, geçerli. BCD sonuç: <b>${BCD(s)}</b>`;
            $('.out', el).innerHTML = h;
          };
          $('.A', el).oninput = show; $('.Bv', el).oninput = show; show();
        },
      },
      {
        t: 'Çok basamaklı toplama',
        html: `<p>Sağdaki basamaktan başlanır. Her basamakta: <b>topla (önceki carry ile)</b> → <b>&gt; 9 ise +6 ekle</b> → <b>carry'yi bir sonraki basamağa taşı</b>.</p>
          <div class="calc">Örnek: 448 + 489<br>
          birler: 1000 + 1001 = 10001 (17) → +0110 = 1 0111 → rakam 7, carry 1<br>
          onlar: 0100 + 1000 + 1 = 01101 (13) → +0110 = 1 0011 → rakam 3, carry 1<br>
          yüzler: 0100 + 0100 + 1 = 01001 (9) → düzeltme yok → rakam 9<br>
          Sonuç: <b>1001 0011 0111</b> = 937 ✔</div>
          <div class="warn">9 + 9 = 18 = 10010 örneğinde alttaki 4 bit (0010) geçerli bir rakam gibi görünür, ama 4 bitten <b>taşma (carry)</b> olmuştur. Toplam &gt; 9 olduğu için yine +6 eklenir: 10010 + 0110 = 11000 → rakam 1000 (8), carry 1 → 18 ✔</div>`,
      },
    ],
    skills: [
      {
        id: 'r1.bcd.digit', name: 'İki BCD rakamı topla', ref: R(34), long: true,
        gen() {
          let a = rnd(0, 9), b = rnd(0, 9);
          if (Math.random() < .65) while (a + b <= 9) { a = rnd(2, 9); b = rnd(2, 9); }
          const { rows, d, c } = bcdColumnRows(a, b, 0);
          return stepTask({ q: `BCD toplama: <span class="mono">${BCD(a)} + ${BCD(b)}</span> &nbsp;(${a} + ${b})`, qText: `BCD ${a}+${b}`, rows,
            answer: `<span class="mono">${c ? '0001 ' : ''}${BCD(d)}</span>`, why: a + b > 9 ? `${a + b} &gt; 9 olduğu için +6 düzeltmesi yapılır.` : `${a + b} ≤ 9, düzeltme gerekmez.` });
        },
      },
      {
        id: 'r1.bcd.multi', name: 'İki basamaklı BCD toplama', ref: R('35–36'), long: true,
        gen() {
          const A = rnd(15, 89), Bn = rnd(10, 99);
          const a = [A % 10, Math.floor(A / 10)], b = [Bn % 10, Math.floor(Bn / 10)];
          const r0 = bcdColumnRows(a[0], b[0], 0), r1 = bcdColumnRows(a[1], b[1], r0.c);
          const label = (rs, t) => rs.map((r, i) => i === 0 ? Object.assign({}, r, { html: `<span class="dim">[${t}]</span> ` + r.html }) : r);
          const sum = A + Bn, ans = [...String(sum)].map(c => BCD(+c)).join(' ');
          const rows = [...label(r0.rows, 'birler'), ...label(r1.rows, 'onlar'),
            { html: `Sonuç (BCD) = [[0]]`, fields: [{ answer: ans, check: u => bitsEq(u, ans), w: 16, show: ans }], why: `Carry ve rakamları birleştir: ${ans}` }];
          return stepTask({ q: `BCD toplama: <b>${A} + ${Bn}</b><br><span class="mono">${BCD(a[1])} ${BCD(a[0])} + ${BCD(b[1])} ${BCD(b[0])}</span>`, qText: `BCD ${A}+${Bn}`, rows,
            answer: `<span class="mono">${ans}</span> (= ${sum})`, why: 'Sağdan başla, her basamakta: topla → >9 ise +6 → carry\'yi taşı.', xp: 20 });
        },
      },
    ],
  };

  /* =================================================================
     İSTASYON 7 — Şaft Enkoderi (neden Gray?)
     ================================================================= */
  function possibleReads(c1, c2, nb) {
    const d = c1 ^ c2, res = [];
    for (let v = 0; v < 2 ** nb; v++) if (((v ^ c1) & ~d) === 0) res.push(v);
    return res;
  }
  function arcPath(cx, cy, r0, r1, a0, a1) {
    const p = (r, a) => { const t = (a - 90) * Math.PI / 180; return `${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`; };
    return `M${p(r1, a0)} A${r1},${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)} Z`;
  }
  const S7 = {
    id: 'r1s7', title: 'Şaft Enkoderi: Neden Gray?', ref: R('38–40'),
    lesson: [
      {
        t: 'Simülasyon',
        html: `<p>Optik şaft enkoderi, bir milin açısal konumunu okur. Diskte 3 halka (3 bit) bulunur. <b>Saydam alan = 1</b>, <b>opak alan = 0</b>. Her halkanın üstünde bir ışık sensörü vardır. Gerçek hayatta sensörler <b>tam olarak aynı hizada değildir</b>: aralarında küçük kaymalar olur.</p>
          <div class="demo enc-wrap"><svg class="disk" viewBox="0 0 260 260" width="260" height="260"></svg>
          <div class="enc-read"></div></div>
          <div class="row"><label>Açı <input type="range" class="ang" min="0" max="359.5" step="0.5" value="170"></label>
          <button class="btn sm play">▶ Döndür</button>
          <select class="mode"><option value="bin">Binary kodlu disk</option><option value="gray">Gray kodlu disk</option></select>
          <button class="btn ghost sm b34">3↔4 sınırına git</button></div>
          <p class="note">Binary diskte 3 → 4 geçişini yavaşça izle (açıyı 172°–188° arasında kaydır). Sonra aynısını Gray diskte dene.</p>`,
        init(el) {
          const svg = $('.disk', el), ang = $('.ang', el), mode = $('.mode', el), rd = $('.enc-read', el);
          const OFF = [-5, 1, 6], RR = [[40, 66], [68, 94], [96, 122]];
          let raf = null;
          const code = k => mode.value === 'gray' ? gray(k) : k;
          const draw = () => {
            const th = +ang.value; let g = '';
            for (let k = 0; k < 8; k++) for (let i = 0; i < 3; i++) {
              const bit = (code(k) >> (2 - i)) & 1;
              g += `<path d="${arcPath(130, 130, RR[i][0], RR[i][1], k * 45, (k + 1) * 45)}" fill="${bit ? '#eaf2e5' : '#1a1a1a'}" stroke="#a87a28" stroke-width=".6"/>`;
            }
            for (let k = 0; k < 8; k++) { const t = ((k * 45 + 22.5) - 90) * Math.PI / 180; g += `<text x="${130 + 30 * Math.cos(t)}" y="${134 + 30 * Math.sin(t)}" font-size="10" fill="#e0ad4a" text-anchor="middle">${k}</text>`; }
            let sens = '';
            const read = OFF.map((o, i) => {
              const a = ((th + o) % 360 + 360) % 360, s = Math.floor(a / 45);
              const t = (o - 90) * Math.PI / 180, r = (RR[i][0] + RR[i][1]) / 2;
              sens += `<circle cx="${130 + r * Math.cos(t)}" cy="${130 + r * Math.sin(t)}" r="4.5" fill="#ff5f5f" stroke="#fff" stroke-width="1"/>`;
              return (code(s) >> (2 - i)) & 1;
            });
            svg.innerHTML = `<g transform="rotate(${-th} 130 130)">${g}</g><circle cx="130" cy="130" r="14" fill="#a87a28"/>${sens}<line x1="130" y1="2" x2="130" y2="12" stroke="#ff5f5f" stroke-width="2"/>`;
            const rv = (read[0] << 2) | (read[1] << 1) | read[2];
            const pos = mode.value === 'gray' ? ungray(rv) : rv;
            const near = new Set([Math.floor(((th - 7 + 360) % 360) / 45), Math.floor(th / 45), Math.floor(((th + 7) % 360) / 45)]);
            const ok = near.has(pos);
            const k = Math.floor(th / 45), c1 = code(k), c2 = code((k + 1) % 8), poss = possibleReads(c1, c2, 3);
            rd.innerHTML = `Gerçek konum: <b>${(th / 45).toFixed(2)}</b> (sektör ${k})<br>Sensörler okuyor: <span class="big ${ok ? 'okc' : 'err'}">${bin(rv, 3)}</span><br>
              Çözülen konum: <b class="${ok ? 'okc' : 'err'}">${pos}</b> ${ok ? '✔' : '✘ TAMAMEN YANLIŞ!'}<br>
              <span class="dim">${k}↔${(k + 1) % 8} sınırında okunabilecek kodlar (${poss.length}):<br>${poss.map(v => bin(v, 3)).join(', ')}</span>`;
          };
          const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; $('.play', el).textContent = '▶ Döndür'; };
          $('.play', el).onclick = () => {
            if (raf) return stop();
            $('.play', el).textContent = '⏸ Dur';
            const loop = () => { ang.value = (+ang.value + .35) % 360; draw(); raf = requestAnimationFrame(loop); };
            loop();
          };
          ang.oninput = draw; mode.onchange = draw;
          $('.b34', el).onclick = () => { stop(); ang.value = 179; draw(); };
          draw();
          return stop;
        },
      },
      {
        t: 'Sebep → sonuç',
        html: `<p><b>Binary'de 3 → 4:</b> 011 → 100. <b>Üç bit birden</b> değişiyor. Sensörler tam hizalı olmadığı için bitler aynı anda değişmez. Hangisinin önce değişeceği de belli değildir. Sonuç olarak sınırda <b>2<sup>3</sup> = 8 kodun hepsi</b> okunabilir: 000, 010, 001, 110, 101, 111 (yanlış) ve 011, 100 (doğru). Konum <b>tamamen bilinmez</b> hale gelir!</p>
          <p><b>Gray'de 3 → 4:</b> 010 → 110. Sadece <b>1 bit</b> değişiyor. Okunabilecek kodlar yalnızca 010 ya da 110'dur, yani 3 ya da 4. Mil zaten tam ortada olduğu için ikisi de kabul edilebilir.</p>
          <div class="rule"><b>Genel kural:</b> İki komşu kod arasında <b>h bit</b> farklıysa sınırda <b>2<sup>h</sup></b> farklı kod okunabilir. Gray kodda her komşu çift için h = 1 olduğundan (7 → 0 dahil) hatalı bir kod <b>asla oluşmaz</b>.</div>`,
      },
    ],
    skills: [
      {
        id: 'r1.enc.set', name: 'Sınırda okunabilecek kodlar', ref: R(40),
        gen() {
          const isGray = Math.random() < .4, k = rnd(0, 7), c = x => isGray ? gray(x) : x;
          const c1 = c(k), c2 = c((k + 1) % 8), poss = possibleReads(c1, c2, 3);
          if (!isGray && poss.length < 4 && Math.random() < .6) return this.gen();
          const opts = [...Array(8)].map((_, v) => bin(v, 3));
          return choiceTask({ q: `<b>${isGray ? 'Gray' : 'Binary'}</b> kodlu 3-bit enkoderde mil, konum <b>${k}</b> (${bin(c1, 3)}) ile <b>${(k + 1) % 8}</b> (${bin(c2, 3)}) arasındaysa hangi kodlar okunabilir?`,
            options: opts, correct: poss, multi: true, mono: true,
            why: `Farklı olan bitler: ${[0, 1, 2].filter(i => ((c1 ^ c2) >> (2 - i)) & 1).map(i => ['MSB', 'orta', 'LSB'][i]).join(', ')}. Bu bitlerin her biri 0 ya da 1 okunabilir, aynı olan bitler sabit kalır → 2<sup>${poss.length === 1 ? 0 : Math.log2(poss.length)}</sup> = <b>${poss.length}</b> kod: ${poss.map(v => bin(v, 3)).join(', ')}` });
        },
      },
      {
        id: 'r1.enc.count', name: 'Kaç farklı kod okunabilir?', ref: R(40),
        gen() {
          const nb = pick([3, 4]), isGray = Math.random() < .3, k = rnd(0, 2 ** nb - 2), c = x => isGray ? gray(x) : x;
          const c1 = c(k), c2 = c(k + 1), h = bin(c1 ^ c2).split('').filter(x => x === '1').length;
          return inputTask({ q: `${nb}-bit <b>${isGray ? 'Gray' : 'binary'}</b> kodlu enkoderde ${k} (${bin(c1, nb)}) ile ${k + 1} (${bin(c2, nb)}) sınırında <b>kaç farklı kod</b> okunabilir? (doğrular dahil)`, answer: String(2 ** h),
            why: `Farklı bit sayısı h = ${h} → 2<sup>${h}</sup> = <b>${2 ** h}</b> kod.${isGray ? ' Gray kodda komşular her zaman 1 bit farklıdır → hep 2.' : ''}` });
        },
      },
      {
        id: 'r1.enc.why', name: 'Neden Gray?', ref: R('38–40'),
        gen() {
          const qs = [
            { q: 'Şaft enkoderinde Gray kodun binary koda göre <b>asıl üstünlüğü</b> nedir?', o: ['Komşu konumların kodları yalnızca 1 bit farklıdır, sınırda hatalı kod oluşmaz', 'Daha az bit kullanır', 'Ağırlıklı bir koddur, toplama kolaydır', 'Sensör sayısını azaltır'], c: 0,
              w: 'Komşu kodlar 1 bit farklı olduğu için sınırda sadece doğru iki koddan biri okunur. Bit sayısı aynıdır (3 bit), Gray ağırlıklı da değildir.' },
            { q: 'Binary diskte konum 3 ile 4 arasında hangi durum oluşabilir?', o: ['Konum tamamen bilinmez olabilir (8 kodun hepsi okunabilir)', 'Sadece 3 ya da 4 okunur', 'Sadece 011 okunur', 'Disk durur'], c: 0,
              w: '011 → 100 geçişinde 3 bit birden değişir. Sensörler hizasız olduğu için 2³ = 8 kodun hepsi okunabilir.' },
            { q: 'Gray kodlu enkoder 7 (100) ile 0 (000) arasında doğru çalışır mı?', o: ['Evet, sadece MSB değişir', 'Hayır, 3 bit değişir', 'Sadece 4-bit diskte çalışır'], c: 0,
              w: 'Gray kodu çevrimseldir (cyclic): son kod ile ilk kod arasında da 1 bit fark vardır.' },
          ];
          const x = pick(qs), opts = shuffle(x.o);
          return choiceTask({ q: x.q, options: opts, correct: opts.indexOf(x.o[x.c]), why: x.w });
        },
      },
    ],
  };

  Registry.addRegion({
    id: 'r1', chip: 'U1', name: 'Sayı Limanı', lec: 'Lecture 1', ref: 'Lecture 1',
    stations: [S1, S2, S3, S4, S5, S6, S7],
  });
})();
