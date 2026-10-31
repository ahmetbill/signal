'use strict';
/* =====================================================================
   SİNYAL — iPad / dokunmatik katmanı:
   ekran tuş takımı, tam ekran, çevrimdışı (service worker),
   ilerlemeyi cihazlar arası aktarma, kaldığın yerden devam.
   ===================================================================== */
const Touch = (() => {
  const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
  const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  const isTxt = el => !!el && el.tagName === 'INPUT' && (el.type === 'text' || !el.getAttribute('type'));
  const kpOn = () => coarse && Store.s.keypad !== false;

  /* ---------- Metin kutuları: iOS otomatik büyük harf/düzeltme kapalı ---------- */
  function prep(root) {
    if (!root.querySelectorAll) return;
    const list = root.tagName === 'INPUT' ? [root] : root.querySelectorAll('input');
    list.forEach(inp => {
      if (!isTxt(inp)) return;
      inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('autocorrect', 'off');
      inp.setAttribute('autocomplete', 'off'); inp.spellcheck = false;
      inp.setAttribute('enterkeyhint', 'done');
      if (kpOn()) inp.setAttribute('inputmode', 'none'); else inp.removeAttribute('inputmode');
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(prep))).observe(document.body, { childList: true, subtree: true });
  prep(document.body);

  /* ---------- Ekran tuş takımı ---------- */
  const kp = document.createElement('div');
  kp.id = 'kp';
  const key = (k, label, cls = '') => `<button data-k="${k}" class="${cls}">${label}</button>`;
  kp.innerHTML = `<div class="r">${[...'1234567890'].map(c => key(c, c)).join('')}${key('bs', '⌫', 'fn')}</div>
    <div class="r">${key('kb', '⌨', 'fn sm')}${[...'ABCDEF'].map(c => key(c, c, 'hx')).join('')}${key('.', '.')}${key(' ', '␣', 'fn')}${key('ent', '⏎', 'ent')}${key('hide', '▾', 'fn sm')}</div>`;
  document.body.appendChild(kp);
  let cur = null;

  function show(inp) {
    cur = inp;
    document.body.classList.add('kp-on');
    requestAnimationFrame(() => {
      const r = inp.getBoundingClientRect(), top = kp.getBoundingClientRect().top, head = $('#top').getBoundingClientRect().bottom;
      if (r.bottom > top - 12) window.scrollBy({ top: r.bottom - top + 60, behavior: 'smooth' });
      else if (r.top < head + 6) window.scrollBy({ top: r.top - head - 60, behavior: 'smooth' });
    });
  }
  function hide() { document.body.classList.remove('kp-on'); cur = null; }
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

  function press(k) {
    if (!cur || cur.disabled || !document.body.contains(cur)) { hide(); return; }
    if (document.activeElement !== cur) cur.focus();
    const inp = cur, s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? s;
    if (k === 'ent') {
      if (inp._kpDirty) { inp._kpDirty = false; fire(inp, 'change'); }
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      return;
    }
    if (k === 'hide') { inp.blur(); return; }
    if (k === 'kb') { setKeypad(false); inp.blur(); inp.focus(); return; }
    if (k === 'bs') { if (s !== e) inp.setRangeText('', s, e, 'end'); else if (s > 0) inp.setRangeText('', s - 1, s, 'end'); else return; }
    else inp.setRangeText(k, s, e, 'end');
    inp._kpDirty = true;
    fire(inp, 'input');
  }

  // Dokunuş inputun odağını çalmasın: varsayılanı engelle, işi pointerdown'da yap
  kp.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  kp.addEventListener('mousedown', e => e.preventDefault());
  let rep = null;
  const stopRep = () => { clearTimeout(rep); clearInterval(rep); rep = null; };
  kp.addEventListener('pointerdown', e => {
    const b = e.target.closest('button'); if (!b) return;
    e.preventDefault();
    b.classList.add('dn'); setTimeout(() => b.classList.remove('dn'), 130);
    press(b.dataset.k);
    if (b.dataset.k === 'bs') { stopRep(); rep = setTimeout(() => { rep = setInterval(() => press('bs'), 70); }, 420); }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => kp.addEventListener(t, stopRep));

  document.addEventListener('focusin', e => { if (isTxt(e.target)) { prep(e.target); if (kpOn()) show(e.target); } });
  document.addEventListener('focusout', e => {
    const t = e.target;
    if (isTxt(t) && t._kpDirty) { t._kpDirty = false; fire(t, 'change'); }
    setTimeout(() => { if (!kpOn() || !isTxt(document.activeElement)) hide(); }, 120);
  });

  function setKeypad(on) {
    Store.s.keypad = on; Store.save();
    prep(document.body);
    if (!on) hide(); else if (isTxt(document.activeElement)) show(document.activeElement);
    paintButtons();
    UI.toast(on ? '🔢 Ekran tuş takımı açık' : '⌨ Sistem klavyesi kullanılacak');
  }

  /* ---------- Tam ekran ---------- */
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const fsOk = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  function toggleFS() {
    const d = document.documentElement;
    try {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const p = (d.requestFullscreen || d.webkitRequestFullscreen).call(d); if (p && p.catch) p.catch(() => UI.toast('Tam ekran açılamadı')); }
    } catch (e) { UI.toast('Tam ekran açılamadı'); }
  }

  /* ---------- Başlık butonları ---------- */
  const nav = $('#top nav');
  const bFull = document.createElement('button'); bFull.id = 'bFull'; bFull.className = 'btn ghost'; bFull.title = 'Tam ekran';
  const bKey = document.createElement('button'); bKey.id = 'bKey'; bKey.className = 'btn ghost'; bKey.title = 'Ekran tuş takımı / sistem klavyesi';
  bFull.onclick = toggleFS; bKey.onclick = () => setKeypad(!kpOn());
  if (coarse) nav.appendChild(bKey);
  if (fsOk && !standalone()) nav.appendChild(bFull);
  function paintButtons() {
    bFull.textContent = fsEl() ? '🗗' : '⛶';
    bKey.textContent = kpOn() ? '🔢' : '⌨';
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(t => document.addEventListener(t, paintButtons));
  paintButtons();

  /* ---------- İlerlemeyi dışa / içe aktar ---------- */
  function exportProgress() {
    const name = `sinyal-ilerleme-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([JSON.stringify({ app: 'sinyal', v: 1, t: Date.now(), s: Store.s })], name, { type: 'application/json' });
    if (coarse && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'SİNYAL ilerleme' }).catch(() => { });
      return;
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  /** İki cihazın ilerlemesini birleştir: hiçbir şey kaybolmaz */
  function merge(a, b) {
    const s = Object.assign({}, a);
    s.xp = Math.max(a.xp || 0, b.xp || 0);
    s.ok = Math.max(a.ok || 0, b.ok || 0); s.bad = Math.max(a.bad || 0, b.bad || 0);
    ['done', 'lessons', 'boss'].forEach(k => s[k] = Object.assign({}, a[k], b[k]));
    s.skills = Object.assign({}, a.skills);
    for (const [id, v] of Object.entries(b.skills || {})) {
      const u = s.skills[id];
      if (!u || (v.ok + v.bad) > (u.ok + u.bad)) s.skills[id] = v;
    }
    const seen = new Set();
    s.mistakes = [...(a.mistakes || []), ...(b.mistakes || [])]
      .filter(m => { const k = m.t + '|' + m.skill; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((x, y) => y.t - x.t).slice(0, 150);
    return s;
  }
  const fileIn = document.createElement('input');
  fileIn.type = 'file'; fileIn.accept = '.json,application/json'; fileIn.style.display = 'none';
  document.body.appendChild(fileIn);
  fileIn.onchange = async () => {
    const f = fileIn.files[0]; fileIn.value = ''; if (!f) return;
    let obj = null;
    try { obj = JSON.parse(await f.text()); } catch (e) { }
    if (!obj || obj.app !== 'sinyal' || !obj.s) { UI.modal('<h3>Dosya okunamadı</h3><p>Bu bir SİNYAL ilerleme dosyası değil.</p>'); return; }
    UI.modal(`<h3>İlerleme yüklensin mi?</h3><p>Dosya: <b>${esc(f.name)}</b> · ${obj.s.xp || 0} XP · ${fmtAgo(obj.t)} kaydedilmiş.</p>
      <p><b>Birleştir:</b> iki cihazdaki ilerleme toplanır, hiçbir şey silinmez. <b>Değiştir:</b> bu cihazdaki ilerleme dosyadakiyle değişir.</p>`,
      [{ label: 'Vazgeç' },
       { label: 'Değiştir', onClick: () => apply(obj.s) },
       { label: 'Birleştir', primary: true, onClick: () => apply(merge(Store.s, obj.s)) }]);
  };
  function apply(s) {
    const keep = { sound: Store.s.sound, keypad: Store.s.keypad, a2hs: Store.s.a2hs };
    localStorage.setItem(Store.KEY, JSON.stringify(Object.assign({}, s, keep)));
    Store.load(); App.go('map'); UI.toast('✔ İlerleme yüklendi');
  }
  const foot = $('footer');
  const bExp = document.createElement('button'); bExp.className = 'btn ghost sm'; bExp.textContent = '⬇ İlerlemeyi kaydet';
  const bImp = document.createElement('button'); bImp.className = 'btn ghost sm'; bImp.textContent = '⬆ İlerleme yükle';
  bExp.title = 'Başka cihaza (PC ↔ iPad) taşımak için dosya olarak kaydet'; bImp.title = 'Kaydedilmiş ilerleme dosyasını yükle';
  bExp.onclick = exportProgress; bImp.onclick = () => fileIn.click();
  foot.prepend(bExp, bImp);

  /* ---------- Kaldığın yerden devam + ana ekran ipucu ---------- */
  const LAST = 'sinyal_last_view';
  const RESUME = ['station', 'review', 'mistakes', 'drill'];
  const go0 = App.go.bind(App);
  App.go = (view, params = {}) => {
    go0(view, params);
    try { localStorage.setItem(LAST, JSON.stringify({ view, params, t: Date.now() })); } catch (e) { }
    if (view === 'map') tip();
  };
  function tip() {
    if (!coarse || standalone() || Store.s.a2hs || !/^https/.test(location.protocol)) return;
    const d = document.createElement('div'); d.className = 'panel a2hs';
    d.innerHTML = `<b>📲 Metroda tam ekran ve internetsiz çalışmak için:</b> Safari'de <b>Paylaş</b> <span class="mono">⬆</span> → <b>Ana Ekrana Ekle</b>.
      Ana ekrandaki SİNYAL simgesinden açınca adres çubuğu olmadan tam ekran açılır ve internet olmadan da çalışır.
      <div class="row" style="margin-bottom:0"><button class="btn sm ok">Tamam, anladım</button></div>`;
    $('.ok', d).onclick = () => { Store.s.a2hs = true; Store.save(); d.remove(); };
    $('#main').prepend(d);
  }
  try {
    const last = JSON.parse(localStorage.getItem(LAST));
    const valid = last && RESUME.includes(last.view) && Date.now() - last.t < 12 * 3600e3 &&
      (last.view !== 'station' || Registry.stations[last.params.id]) && (last.view !== 'drill' || Registry.skills[last.params.skill]);
    if (valid && !$('.modal-bg')) App.go(last.view, last.params); else tip();
  } catch (e) { tip(); }

  /* ---------- Çevrimdışı: service worker (yalnızca https/localhost'ta çalışır) ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
  }

  return { coarse, standalone, setKeypad, merge };
})();
