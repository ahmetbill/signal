'use strict';
/* =====================================================================
   SİNYAL — uygulama: harita, istasyon (ders/pratik), tekrar, boss,
   hata defteri.
   ===================================================================== */

/** Henüz yapılmamış bölgeler (haritada plan olarak görünür) */
const FUTURE = [
  { chip: 'U2', name: 'Teorem Ormanı', lec: 'Lecture 2', plan: ['AND · OR · NOT & doğruluk tablosu', 'Aksiyomlar & öncelik', 'Teoremler (absorption, De Morgan…)', 'İspat Merdiveni', 'Sadeleştirme', 'Fonksiyonun tümleyeni'] },
  { chip: 'U3', name: 'Kanonik Kale', lec: 'Lecture 3', plan: ['Minterm & maxterm', 'İndeks gösterimi', 'Σm ve ΠM', 'SOP ↔ POS dönüşümü', 'Tümleyen fonksiyon', 'Kapılar & devre'] },
  { chip: 'U4', name: 'Harita Vadisi', lec: 'Lecture 4–5', plan: ['Maliyet: L · G · GN', 'K-map 2-3-4 değişken', 'Prime & essential implicant', "Don't care", 'POS K-map', 'Quine-McCluskey', 'XOR & NAND/NOR'] },
];

const App = {
  leave: [], enter: null,
  onLeave(fn) { this.leave.push(fn); },
  go(view, params = {}) {
    this.leave.forEach(f => { try { f(); } catch (e) { } });
    this.leave = []; this.enter = null;
    window.scrollTo(0, 0);
    Views[view]($('#main'), params);
    this.refreshHeader();
  },
  refreshHeader() {
    const s = Store.s, L = levelInfo(s.xp);
    $('#top .lvl').innerHTML = `Lv ${L.lvl} · <b>${L.name}</b> · ${s.xp} XP${L.next ? ` <span class="dim">/ ${L.next}</span>` : ''}`;
    $('#top .bar i').style.width = (L.pct * 100).toFixed(1) + '%';
    $('#bReview .cnt').textContent = Leitner.due().length;
    $('#bMist .cnt').textContent = s.mistakes.length;
    $('#bSound').textContent = s.sound ? '🔊' : '🔇';
  },
};

/* ---------- Durum yardımcıları ---------- */
function regionOpen(r) {
  const i = Registry.regions.indexOf(r);
  if (i <= 0) return true;
  const p = Registry.regions[i - 1];
  return !!Store.s.boss[p.id] || p.stations.every(s => Store.s.done[s.id]);
}
function stationStatus(st) {
  if (Store.s.done[st.id]) return 'done';
  if (st.index === 0) return regionOpen(st.region) ? 'open' : 'locked';
  return Store.s.done[st.region.stations[st.index - 1].id] ? 'open' : 'locked';
}
function mastery(st) {
  const b = st.skills.map(sk => Leitner.box(sk.id));
  return b.reduce((a, x) => a + x, 0) / b.length;
}
const masteryHTML = v => `<span class="mastery" title="Ustalık ${v.toFixed(1)}/5">${[1, 2, 3, 4, 5].map(i => `<i class="${v >= i - .5 ? 'on' : ''}"></i>`).join('')}</span>`;
const boxHTML = id => masteryHTML(Leitner.box(id));
function nextStep() {
  for (const r of Registry.regions) {
    for (const st of r.stations) if (!Store.s.done[st.id]) return { label: `${st.title}`, go: () => App.go('station', { id: st.id }) };
    if (!Store.s.boss[r.id]) return { label: `${r.chip} Boss`, go: () => App.go('boss', { rid: r.id }) };
  }
  return null;
}
const Mistakes = {
  add(m) { Store.s.mistakes.unshift(m); if (Store.s.mistakes.length > 150) Store.s.mistakes.length = 150; Store.save(); },
};
const fmtAgo = t => { const d = (Date.now() - t) / 60e3; return d < 1 ? 'az önce' : d < 60 ? `${Math.round(d)} dk önce` : d < 1440 ? `${Math.round(d / 60)} sa önce` : `${Math.round(d / 1440)} gün önce`; };

/* ---------- Soru çalıştırıcı ---------- */
function runTask(host, task, { tag = '', onNext }) {
  host.innerHTML = `${tag}<div class="task"></div><div class="fbwrap"></div>`;
  const tb = $('.task', host), fw = $('.fbwrap', host);
  let finished = false;
  const done = (ok, info = {}) => {
    if (finished) return; finished = true;
    $$('input,button,select', tb).forEach(x => x.disabled = true);
    Leitner.record(task.skill, ok);
    const xp = ok ? (info.hinted ? 5 : (task.xp || 10)) : info.partial ? 5 : 2;
    ok ? Store.s.ok++ : Store.s.bad++;
    addXP(xp);
    ok ? Sound.ok() : Sound.bad();
    const sk = Registry.skills[task.skill];
    if (!ok) Mistakes.add({ t: Date.now(), skill: task.skill, q: task.q, your: info.your, answer: info.answer, why: info.why, ref: task.ref });
    const head = ok ? '✔ Doğru!' : info.partial ? '◐ Bitti, ama hatalı adım(lar) vardı. Bu tip yakında tekrar gelecek.' : '✘ Yanlış';
    fw.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><div class="head">${head} <span class="dim mono" style="font-size:13px;font-weight:400">+${xp} XP · ${esc(sk.name)}</span></div>
      ${!ok ? `<div class="line">Senin cevabın: ${esc(info.your ?? '')}</div>` : ''}
      <div class="line">Doğru cevap: ${info.answer ?? ''}</div>
      ${info.why ? `<div class="why">💡 <b>Neden?</b> ${info.why}</div>` : ''}
      <div class="refl">📖 ${task.ref || ''}</div>
      <div class="row" style="margin-bottom:0"><button class="btn primary next">Devam ⏎</button></div></div>`;
    const go = () => { App.enter = null; onNext(ok); };
    $('.next', fw).onclick = go;
    setTimeout(() => { App.enter = go; }, 60);
    fw.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  try { task.render(tb, done); }
  catch (e) {
    console.error(e);
    tb.innerHTML = `<div class="warn">Bu soru oluşturulurken bir hata oldu: ${esc(e.message)}</div><button class="btn">Atla</button>`;
    $('button', tb).onclick = () => onNext(null);
  }
}

/** Pratik sıralayıcı: beceriler karışık döner, yanlışlar 3 soru sonra geri gelir,
    her 4 soruda bir başka istasyondan zamanı gelen tekrar kartı araya girer. */
function makeScheduler(ids, withReview) {
  let order = shuffle(ids), pos = 0, retry = [], count = 0, last = null;
  return {
    next() {
      count++;
      const r = retry.find(x => x.at <= count);
      if (r) { retry = retry.filter(x => x !== r); return (last = { skill: r.skill }); }
      if (withReview && count % 4 === 0) {
        const due = Leitner.due().filter(id => !ids.includes(id));
        if (due.length) return (last = { skill: due[0], review: true });
      }
      if (pos >= order.length) { order = shuffle(ids); if (order[0] === (last && last.skill) && order.length > 1) order.push(order.shift()); pos = 0; }
      return (last = { skill: order[pos++] });
    },
    result(skill, ok) { if (ok === false) retry.push({ skill, at: count + 3 }); },
  };
}

/* =====================================================================
   GÖRÜNÜMLER
   ===================================================================== */
const Views = {};

Views.map = m => {
  const s = Store.s, due = Leitner.due().length, nx = nextStep();
  const all = Registry.regions.flatMap(r => r.stations), nDone = all.filter(st => s.done[st.id]).length;
  const acc = s.ok + s.bad ? Math.round(100 * s.ok / (s.ok + s.bad)) : 0;
  m.innerHTML = `<div class="hero panel">
      <div><h2>Devre Haritası</h2><div class="dim">Her çip bir ders. İstasyonları sırayla bitir: önce 📘 <b>Ders</b>, sonra 🎯 <b>Pratik</b>.<br>Zamanı gelen kartlar ↺ <b>Tekrar</b>'da birikir. Her gün önce onları temizle.</div></div>
      <div class="stats">
        <div class="stat"><span class="n">${nDone}/${all.length}</span><span class="l">istasyon</span></div>
        <div class="stat"><span class="n">${acc}%</span><span class="l">isabet</span></div>
        <div class="stat"><span class="n">${due}</span><span class="l">tekrar bekliyor</span></div>
      </div>
      <div class="spacer"></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${due ? `<button class="btn big goreview">↺ Tekrarları çöz (${due})</button>` : ''}
        ${nx ? `<button class="btn primary big gonext">▶ Sıradaki: ${esc(nx.label)}</button>` : '<span class="silk">Tüm bölgeler tamam! 🎉</span>'}
      </div>
    </div>
    <div class="regions"></div>`;
  const R = $('.regions', m);
  Registry.regions.forEach(r => {
    const open = regionOpen(r), allDone = r.stations.every(st => s.done[st.id]);
    const c = document.createElement('div'); c.className = 'chip';
    c.innerHTML = `<div class="notch"></div><div class="ref">${r.chip} · ${r.lec}</div><h3>${r.name}</h3>
      <ul class="stations">${r.stations.map(st => `<li class="st ${stationStatus(st)}" data-id="${st.id}"><span class="via"></span><span class="name">${st.title}</span>${masteryHTML(mastery(st))}</li>`).join('')}
      <li class="st boss ${s.boss[r.id] ? 'done' : allDone ? 'open' : 'locked'}" data-boss="${r.id}"><span class="via"></span><span class="name">⚡ Boss: ${r.chip} Final Testi</span>${s.boss[r.id] ? '🏅' : ''}</li></ul>`;
    if (!open) c.style.opacity = .6;
    R.appendChild(c);
  });
  FUTURE.forEach(f => {
    const c = document.createElement('div'); c.className = 'chip future';
    c.innerHTML = `<div class="notch"></div><div class="ref">${f.chip} · ${f.lec}</div><h3>${f.name}</h3>
      <ul class="stations">${f.plan.map(p => `<li class="st locked"><span class="via"></span><span class="name">${p}</span></li>`).join('')}</ul>
      <div class="silk" style="text-align:center">yapım aşamasında</div>`;
    R.appendChild(c);
  });
  $$('.st[data-id]', m).forEach(li => li.onclick = () => {
    const st = Registry.stations[li.dataset.id];
    if (stationStatus(st) === 'locked') {
      UI.modal(`<h3>🔒 Kilitli istasyon</h3><p>Önceki istasyonu bitirmeden geliyorsun. Konular üst üste kurulduğu için sırayla gitmen önerilir.</p>`,
        [{ label: 'Vazgeç' }, { label: 'Yine de gir', primary: true, onClick: () => App.go('station', { id: st.id }) }]);
    } else App.go('station', { id: st.id });
  });
  $$('.st[data-boss]', m).forEach(li => li.onclick = () => App.go('boss', { rid: li.dataset.boss }));
  if (nx) $('.gonext', m).onclick = nx.go;
  if (due) $('.goreview', m).onclick = () => App.go('review');
};

Views.station = (m, { id, tab }) => {
  const st = Registry.stations[id];
  tab = tab || (Store.s.lessons[id] ? 'practice' : 'lesson');
  m.innerHTML = `<div class="crumbs"><button class="btn ghost sm back">← Harita</button><span class="silk">${st.region.chip} · ${st.region.name} · istasyon ${st.index + 1}/${st.region.stations.length}</span></div>
    <h2>${st.title} ${Store.s.done[id] ? '<span style="color:var(--led)">✔</span>' : ''}</h2>
    <div class="tabs"><button data-t="lesson" class="${tab === 'lesson' ? 'on' : ''}">📘 Ders</button><button data-t="practice" class="${tab === 'practice' ? 'on' : ''}">🎯 Pratik</button></div>
    <div class="tabbody"></div>`;
  $('.back', m).onclick = () => App.go('map');
  $$('.tabs button', m).forEach(b => b.onclick = () => App.go('station', { id, tab: b.dataset.t }));
  (tab === 'lesson' ? showLesson : showPractice)($('.tabbody', m), st);
};

function showLesson(host, st) {
  let i = 0, cleanup = null;
  const n = st.lesson.length;
  App.onLeave(() => cleanup && cleanup());
  const render = () => {
    if (cleanup) { cleanup(); cleanup = null; }
    const p = st.lesson[i], last = i === n - 1;
    host.innerHTML = `<div class="lesson panel"><div class="silk">Ders · sayfa ${i + 1}/${n} · ${st.ref}</div><h3>${p.t}</h3><div class="page">${p.html}</div>
      <div class="lesson-nav"><button class="btn prev" ${i === 0 ? 'disabled' : ''}>← Geri</button>
      <div class="dots">${st.lesson.map((_, k) => `<i class="${k === i ? 'on' : ''}" data-k="${k}" title="${esc(st.lesson[k].t)}"></i>`).join('')}</div><div class="spacer"></div>
      ${last ? '<button class="btn primary fin">Pratiğe geç 🎯</button>' : '<button class="btn primary nxt">İleri →</button>'}</div></div>`;
    if (p.init) cleanup = p.init($('.page', host)) || null;
    $('.prev', host).onclick = () => { i--; render(); };
    $$('.dots i', host).forEach(d => d.onclick = () => { i = +d.dataset.k; render(); });
    if (last) {
      Store.s.lessons[st.id] = true; Store.save();
      $('.fin', host).onclick = () => App.go('station', { id: st.id, tab: 'practice' });
    } else $('.nxt', host).onclick = () => { i++; render(); window.scrollTo(0, 0); };
  };
  render();
}

function showPractice(host, st) {
  const ids = st.skills.map(s => s.id);
  const goal = st.goal || Math.max(6, Math.min(12, ids.length * 2));
  const sched = makeScheduler(ids, true);
  const cheat = (st.lesson.find(p => /Kural kartı/.test(p.t)) || {}).html || '';
  let got = 0;
  host.innerHTML = `<div class="practice"><div class="panel"><div class="ptitle"><span class="pt"></span><span class="pc"></span></div><div class="pbar"></div><div class="tasks"></div></div>
    <aside class="pside"><div class="panel"><h4>Beceriler</h4><div class="sk"></div><div class="note" style="margin-top:8px">Çubuklar = tekrar kutusu (1–5). Yanlış yaparsan kutu 1'e düşer ve kısa süre sonra yine sorulur.</div></div>
    ${cheat ? `<div class="panel"><h4>Kural kartı</h4>${cheat.replace(/<p>[\s\S]*?<\/p>/g, '')}</div>` : ''}</aside></div>`;
  const paint = () => {
    const done = !!Store.s.done[st.id];
    $('.pt', host).textContent = done ? 'Serbest pratik (istasyon tamamlandı ✔)' : `Hedef: ${goal} doğru cevap`;
    $('.pc', host).textContent = done ? `${got} doğru` : `${got}/${goal}`;
    $('.pbar', host).innerHTML = done ? '' : [...Array(goal)].map((_, k) => `<i class="${k < got ? 'on' : ''}"></i>`).join('');
    $('.sk', host).innerHTML = st.skills.map(sk => `<div class="skill-li"><span class="nm">${sk.name}</span>${boxHTML(sk.id)}</div>`).join('');
  };
  const complete = () => {
    Store.s.done[st.id] = true; Store.save(); addXP(50); Sound.win();
    const nxt = st.region.stations[st.index + 1];
    UI.modal(`<h3>🎉 İstasyon tamamlandı: ${st.title}</h3><p>+50 XP. Bu istasyonun soruları artık ↺ <b>Tekrar</b> kuyruğunda, aralıklarla geri gelecek.</p>`,
      [{ label: 'Burada devam', onClick: next }, { label: 'Harita', onClick: () => App.go('map') },
       nxt ? { label: `Sıradaki: ${nxt.title} →`, primary: true, onClick: () => App.go('station', { id: nxt.id }) }
           : { label: `⚡ ${st.region.chip} Boss'a git`, primary: true, onClick: () => App.go('boss', { rid: st.region.id }) }]);
  };
  const next = () => {
    paint();
    const { skill, review } = sched.next();
    const tag = review ? `<span class="tag review">↺ Tekrar · ${esc(Registry.skills[skill].station.title)}</span>` : '';
    runTask($('.tasks', host), Registry.gen(skill), {
      tag, onNext: ok => {
        sched.result(skill, ok);
        if (ok && !review) got++;
        paint();
        if (got >= goal && !Store.s.done[st.id]) complete(); else next();
      },
    });
  };
  next();
}

Views.review = (m, { free } = {}) => {
  // free: zamanı gelmemiş olsa da en zayıf kartlardan serbest tekrar (metroda boş vakit için)
  const queue = free
    ? Object.entries(Store.s.skills).filter(([id]) => Registry.skills[id]).sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due).slice(0, 10).map(([id]) => id)
    : Leitner.due().slice(0, 12);
  if (!queue.length) {
    const fut = Object.values(Store.s.skills).map(v => v.due).filter(t => t > Date.now()).sort((a, b) => a - b)[0];
    m.innerHTML = `<div class="panel"><h2>↺ Tekrar</h2><p>Şu an zamanı gelen kart yok. 🎉</p>
      <p class="dim">${fut ? `Bir sonraki kartın zamanı yaklaşık <b>${Math.max(1, Math.round((fut - Date.now()) / 60e3))} dk</b> sonra gelecek.` : 'Önce bir istasyonda pratik yap, kartlar burada birikir.'}</p>
      <div class="rule"><b>Nasıl çalışır?</b> Her soru tipi bir karttır. Doğru bildikçe kart üst kutulara çıkar, tekrar aralığı uzar (3 dk → 30 dk → 1 gün → 3 gün). Yanlış bilirsen kart 1. kutuya döner. Unutmaya başladığın şeyi tam zamanında tekrar edersin.</div>
      <div class="row"><button class="btn primary back">← Harita</button>${Object.keys(Store.s.skills).length ? '<button class="btn free">🎲 Yine de çalış: en zayıf 10 kart</button>' : ''}</div></div>`;
    $('.back', m).onclick = () => App.go('map');
    if ($('.free', m)) $('.free', m).onclick = () => App.go('review', { free: true });
    return;
  }
  const total = queue.length, tries = {};
  let cleared = 0, okc = 0;
  m.innerHTML = `<div class="crumbs"><button class="btn ghost sm back">← Harita</button><span class="silk">↺ ${free ? 'Serbest tekrar' : 'Tekrar oturumu'}</span></div>
    <div class="panel"><div class="ptitle"><span>${free ? 'En zayıf kartların' : 'Zamanı gelen kartlar'}</span><span class="pc"></span></div><div class="pbar"></div><div class="tasks"></div></div>`;
  $('.back', m).onclick = () => App.go('map');
  const paint = () => { $('.pc', m).textContent = `${cleared}/${total}`; $('.pbar', m).innerHTML = [...Array(total)].map((_, k) => `<i class="${k < cleared ? 'on' : ''}"></i>`).join(''); };
  const next = () => {
    paint();
    if (!queue.length) {
      $('.tasks', m).innerHTML = `<h3>Tekrar bitti ✔</h3><p>${okc}/${total} kart ilk seferde doğru. ${okc === total ? 'Harika!' : 'Yanlışlar 1. kutuya döndü, kısa süre sonra tekrar gelecekler.'}</p><div class="row"><button class="btn primary hm">← Harita</button><button class="btn more">🎲 10 kart daha</button></div>`;
      $('.tasks .hm', m).onclick = () => App.go('map');
      $('.tasks .more', m).onclick = () => App.go('review', { free: true });
      return;
    }
    const sk = queue.shift();
    runTask($('.tasks', m), Registry.gen(sk), {
      tag: `<span class="tag review">↺ ${esc(Registry.skills[sk].station.title)} · ${esc(Registry.skills[sk].name)}</span>`,
      onNext: ok => {
        tries[sk] = (tries[sk] || 0) + 1;
        if (ok && tries[sk] === 1) okc++;
        if (!ok && tries[sk] < 2) queue.splice(Math.min(2, queue.length), 0, sk); else cleared++;
        next();
      },
    });
  };
  next();
};

Views.boss = (m, { rid }) => {
  const r = Registry.regions.find(x => x.id === rid);
  const N = 10, PASS = 8;
  const all = shuffle(r.stations.flatMap(s => s.skills));
  const longs = all.filter(s => s.long).slice(0, 2), shorts = all.filter(s => !s.long);
  const list = shuffle([...longs, ...shorts.slice(0, N - longs.length)]).map(s => s.id);
  const notDone = r.stations.filter(st => !Store.s.done[st.id]);
  m.innerHTML = `<div class="crumbs"><button class="btn ghost sm back">← Harita</button><span class="silk">${r.chip} · ${r.name}</span></div>
    <div class="panel"><h2>⚡ ${r.chip} Final Testi</h2>
    <p>${r.lec} konularının hepsinden karışık <b>${N} soru</b> gelecek. Geçmek için <b>${PASS} doğru</b> gerekiyor. Sınav provası gibi düşün: her yanlışın nedeni yine gösterilecek ve hata defterine yazılacak.</p>
    ${notDone.length ? `<div class="warn">Henüz bitirmediğin istasyonlar var: ${notDone.map(s => s.title).join(', ')}. Yine de deneyebilirsin.</div>` : ''}
    <button class="btn primary big start">Başla</button></div>`;
  $('.back', m).onclick = () => App.go('map');
  $('.start', m).onclick = () => {
    const res = [];
    m.innerHTML = `<div class="crumbs"><button class="btn ghost sm back">← Vazgeç</button><span class="silk">⚡ ${r.chip} Final Testi</span></div>
      <div class="panel"><div class="ptitle"><span>Geçmek için ${PASS}/${N}</span><span class="pc"></span></div><div class="pbar"></div><div class="tasks"></div></div>`;
    $('.back', m).onclick = () => App.go('map');
    const paint = () => {
      $('.pc', m).textContent = `${res.filter(x => x).length} doğru · ${res.length}/${N}`;
      $('.pbar', m).innerHTML = list.map((_, k) => `<i style="background:${k < res.length ? (res[k] ? 'var(--led)' : 'var(--red)') : ''}"></i>`).join('');
    };
    const next = () => {
      paint();
      if (res.length === N) {
        const sc = res.filter(x => x).length, pass = sc >= PASS;
        if (pass && !Store.s.boss[rid]) { Store.s.boss[rid] = true; Store.save(); addXP(150); }
        if (pass) Sound.win();
        $('.tasks', m).innerHTML = `<h2>${pass ? '🏅 Geçtin!' : '💥 Bu sefer olmadı'}</h2><p>Skor: <b>${sc}/${N}</b>. ${pass ? `${r.chip} çipi tamamlandı.` : `Geçmek için ${PASS} lazım. Hata defterindeki nedenlere bak, sonra tekrar dene.`}</p>
          <div class="row"><button class="btn primary hm">← Harita</button>${pass ? '' : '<button class="btn again">Tekrar dene</button>'}<button class="btn mist">📕 Hata Defteri</button></div>`;
        $('.hm', m).onclick = () => App.go('map');
        $('.mist', m).onclick = () => App.go('mistakes');
        if (!pass) $('.again', m).onclick = () => App.go('boss', { rid });
        return;
      }
      const sk = list[res.length];
      runTask($('.tasks', m), Registry.gen(sk), { tag: `<span class="tag boss">⚡ Soru ${res.length + 1}/${N} · ${esc(Registry.skills[sk].station.title)}</span>`, onNext: ok => { res.push(!!ok); next(); } });
    };
    next();
  };
};

Views.mistakes = m => {
  const L = Store.s.mistakes;
  const cnt = {};
  L.forEach(x => cnt[x.skill] = (cnt[x.skill] || 0) + 1);
  const top = Object.entries(cnt).filter(([id]) => Registry.skills[id]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  m.innerHTML = `<div class="crumbs"><button class="btn ghost sm back">← Harita</button><span class="silk">📕 Hata Defteri</span></div>
    <h2>📕 Hata Defteri</h2>
    ${L.length ? `<p class="dim">Her yanlışın burada nedeniyle birlikte duruyor. "Benzerini çöz" ile aynı tipte yeni bir soru gelir. Anladığın kayıtları silebilirsin.</p>
      <div class="silk">En çok zorlandığın konular</div><div class="topbad">${top.map(([id, n]) => `<span>${esc(Registry.skills[id].name)} · ${n}</span>`).join('')}</div>`
    : '<div class="panel"><p>Henüz hata yok. Pratik yaptıkça yanlışların nedenleriyle birlikte buraya yazılır.</p></div>'}
    <div class="list"></div>`;
  $('.back', m).onclick = () => App.go('map');
  const list = $('.list', m);
  L.slice(0, 60).forEach((x, i) => {
    const sk = Registry.skills[x.skill]; if (!sk) return;
    const d = document.createElement('div'); d.className = 'panel mist';
    d.innerHTML = `<div class="meta">${fmtAgo(x.t)} · ${esc(sk.station.title)} › ${esc(sk.name)} · ${esc(x.ref || '')}</div>
      <div class="q" style="font-size:16px;margin:4px 0">${esc(x.q)}</div>
      <div class="line mono" style="font-size:14px">Senin cevabın: <span style="color:#ffb3b3">${esc(x.your ?? '')}</span> &nbsp;·&nbsp; Doğru: ${x.answer ?? ''}</div>
      ${x.why ? `<div class="why">💡 ${x.why}</div>` : ''}
      <div class="row" style="margin-bottom:0"><button class="btn sm drill">🎯 Benzerini çöz</button><button class="btn ghost sm del">✓ Anladım, sil</button></div>`;
    $('.drill', d).onclick = () => App.go('drill', { skill: x.skill });
    $('.del', d).onclick = () => { Store.s.mistakes.splice(Store.s.mistakes.indexOf(x), 1); Store.save(); d.remove(); App.refreshHeader(); };
    list.appendChild(d);
  });
};

Views.drill = (m, { skill }) => {
  const sk = Registry.skills[skill], N = 3; let k = 0, okc = 0;
  m.innerHTML = `<div class="crumbs"><button class="btn ghost sm back">← Hata Defteri</button><span class="silk">🎯 ${esc(sk.name)} · ${N} soru</span></div><div class="panel"><div class="tasks"></div></div>`;
  $('.back', m).onclick = () => App.go('mistakes');
  const next = () => {
    if (k === N) {
      $('.tasks', m).innerHTML = `<h3>${okc}/${N} doğru</h3><div class="row"><button class="btn primary">← Hata Defteri</button><button class="btn again">3 soru daha</button></div>`;
      $('.tasks .primary', m).onclick = () => App.go('mistakes');
      $('.tasks .again', m).onclick = () => App.go('drill', { skill });
      return;
    }
    k++;
    runTask($('.tasks', m), Registry.gen(skill), { tag: `<span class="tag review">${k}/${N}</span>`, onNext: ok => { if (ok) okc++; next(); } });
  };
  next();
};

/* ---------- Arka plan devre izleri ---------- */
function drawTraces() {
  const svg = $('#bg'), W = innerWidth, H = innerHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  let s = '';
  for (let i = 0; i < 26; i++) {
    let x = Math.round(Math.random() * W / 18) * 18, y = Math.round(Math.random() * H / 18) * 18, d = `M${x},${y}`;
    for (let j = 0; j < 4; j++) {
      const L = rnd(3, 12) * 18;
      if (j % 2 === 0) x += pick([-1, 1]) * L; else y += pick([-1, 1]) * L;
      d += ` L${x},${y}`;
    }
    s += `<path d="${d}" fill="none" stroke="#e0ad4a" stroke-width="2" opacity=".5"/><circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#e0ad4a" stroke-width="2"/>`;
  }
  svg.innerHTML = s;
}

/* ---------- Başlat ---------- */
(function boot() {
  drawTraces();
  $('#brand').onclick = () => App.go('map');
  $('#bReview').onclick = () => App.go('review');
  $('#bMist').onclick = () => App.go('mistakes');
  $('#bSound').onclick = () => { Store.s.sound = !Store.s.sound; Store.save(); App.refreshHeader(); };
  $('#bReset').onclick = () => UI.modal('<h3>İlerlemeyi sıfırla?</h3><p>Tüm XP, tamamlanan istasyonlar, tekrar kartları ve hata defteri silinir.</p>',
    [{ label: 'Vazgeç' }, { label: 'Sıfırla', primary: true, onClick: () => { Store.reset(); App.go('map'); } }]);
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && App.enter && !$('.modal-bg')) { e.preventDefault(); App.enter(); }
  });
  setInterval(() => App.refreshHeader(), 30e3);
  App.go('map');
  if (!Store.s.intro) {
    Store.s.intro = true; Store.save();
    UI.modal(`<h2>⚡ SİNYAL'e hoş geldin</h2>
      <p>EEF205E slaytlarından yapılmış bir çalışma oyunu. Haritadaki her <b>çip</b> bir derse, içindeki her <b>istasyon</b> bir konuya karşılık geliyor.</p>
      <ul><li>📘 <b>Ders:</b> Konu interaktif demolarla anlatılır. LED'lere tıkla, sürgüleri kaydır, adım adım ilerle.</li>
      <li>🎯 <b>Pratik:</b> Rastgele üretilen sorular gelir. Cevabı her seferinde sen üretirsin, yanlışta <b>nedeni</b> gösterilir.</li>
      <li>↺ <b>Tekrar:</b> Yanlış yaptığın soru tipleri aralıklı tekrar sistemiyle geri gelir.</li>
      <li>📕 <b>Hata Defteri:</b> Bütün yanlışların, nedenleri ve slayt numaralarıyla birlikte burada durur.</li>
      <li>⚡ <b>Boss:</b> Her çipin sonunda karışık sorulardan oluşan bir final testi var.</li></ul>
      <p class="dim">İpucu: Cevap verdikten sonra <b>Enter</b> ile devam edebilirsin. İlerlemen bu tarayıcıda otomatik kaydedilir.</p>`,
      [{ label: 'Başlayalım ▶', primary: true }]);
  }
})();
