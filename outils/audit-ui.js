/* ═══════════════════════════════════════════════════════════════════════════════
   Audit de l'interface de « plan de classe.html » — outil de développement
   ═══════════════════════════════════════════════════════════════════════════════
   N'est PAS chargé par l'application. On l'injecte à la main dans la page servie en
   local, pour rejouer à l'identique les audits complets (cf. docs/audit-complet-*.md
   et la section « Méthode de vérification » de CLAUDE.md).

   MODE D'EMPLOI (navigateur d'aperçu, config « static » de .claude/launch.json) :

   1. Ouvrir http://localhost:8765/plan%20de%20classe.html
   2. Données de DÉMO fraîches — JAMAIS les données réelles des élèves :
        for (const d of await indexedDB.databases()) indexedDB.deleteDatabase(d.name);
        localStorage.clear(); location.reload();
   3. Choisir le thème PAR UN RECHARGEMENT (une bascule dans la page fausse les mesures) :
        localStorage.planClasse_theme = 'dark'; location.reload();      // ou 'light'
   4. Injecter l'outil (la CSP autorise les scripts de la même origine) :
        await new Promise(r => { const s = document.createElement('script');
          s.src = 'outils/audit-ui.js?' + Date.now(); s.onload = r; document.head.appendChild(s); });
   4 bis. Si le panneau est masqué, lui donner une taille (sinon fenêtre de 0 px : refus) :
        resize_window 1280 × 800 dans l'outil du navigateur d'aperçu.
   5. Lancer la batterie EN ARRIÈRE-PLAN puis relire le résultat dans un second appel :
        __auditStart();                    // tout (≈ 1 à 3 min si le panneau est masqué)
        __auditStart({ print: false });    // sans les impressions
        window.__AUDIT                     // null tant que ce n'est pas fini
      ⚠️ Panneau d'aperçu MASQUÉ : minuteurs ralentis, document sans focus (les `blur`
      programmés ne se déclenchent pas), captures d'écran en retard d'une étape.
   6. Recommencer 3 à 5 dans l'autre thème.

   Score de référence (v2.146.2, 2026-10-14) : TOUT à zéro, dans les deux thèmes —
   contraste écran, sous-états, fenêtres, impressions, pavés clairs (hors aperçus papier
   voulus : .ipr-page de la fiche de prêt), champs sans nom, erreurs d'exécution.
   Un résultat différent signale une régression (ou un nouvel écran à examiner).

   Fonctions utilisables séparément :
     __aud(root, label)      contraste WCAG de chaque nœud texte (4,5:1 ; 3:1 grand texte)
     __ovf()                 éléments qui élargissent la page (débordement horizontal)
     __light(root, label)    « pavés clairs » : fonds clairs peu saturés (utile en sombre)
     __unl(root, label)      champs visibles sans nom accessible
     __tabsRun()             les 12 onglets (contraste + champs)
     __staticModalsRun()     toutes les .mo forcées ouvertes (contraste + champs)
     __dynRun(only?)         ~95 fenêtres par leur VRAI ouvreur (contraste, ARIA, focus, largeur, champs)
     __subRun()              ~30 sous-états (appel, contraintes, confidentiel, menus, Config Salle…)
     __printRun()            ~22 chemins d'impression, mesurés dans window.print() bouchonné
     __respRun()             débordements à la taille courante (redimensionner la fenêtre avant)
     __metaTest()            vérifie que l'auditeur détecte bien un texte #ccc sur blanc
   ═══════════════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const closeAll = () => {
  for (let i = 0; i < 6; i++) document.querySelectorAll('.mo.on').forEach(m => { try { closeMod2(m.id); } catch (e) { m.classList.remove('on'); } });
  document.querySelectorAll('.mo.on').forEach(m => m.classList.remove('on'));
  try { closeAllDd(); } catch (e) {}
  const c = document.getElementById('ctx'); if (c) c.style.display = 'none';
};
const TABS = ['classes', 'eleves', 'plan', 'svue', 'config', 'ipads', 'qcmcam', 'reunions', 'notes', 'bilan', 'comp', 'export-pos'];

// ── Neutralise transitions et animations (une puce saisie à mi-transition mesure faux) ──
function noTransitions() {
  if (document.getElementById('__notrans')) return;
  const st = document.createElement('style'); st.id = '__notrans';
  st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
  document.head.appendChild(st);
}

// ── Contraste ────────────────────────────────────────────────────────────────
// Fond effectif = empilement des fonds des ancêtres jusqu'au premier opaque.
// Écarte : <svg> (couleur = fill, fond = <rect> frère), opacité cumulée < 0,95
// (estompages volontaires), éléments cachés, fonds en image (non mesurables).
window.__aud = function (root, label) {
  root = root || document.body; noTransitions();
  const cache = new Map(); const cs = e => { let v = cache.get(e); if (!v) { v = getComputedStyle(e); cache.set(e, v); } return v; };
  const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const blend = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
  const bgOf = el => {
    const stack = []; let e = el;
    while (e && e.nodeType === 1) {
      const s = cs(e); const b = parse(s.backgroundColor);
      if (s.backgroundImage && s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) return null;
      if (b && b[3] > 0) { stack.push(b); if (b[3] >= 0.99) break; }
      e = e.parentElement;
    }
    let c = document.documentElement.dataset.theme === 'dark' && !stack.some(x => x[3] >= .99) ? [19, 24, 31, 1] : [255, 255, 255, 1];
    for (let i = stack.length - 1; i >= 0; i--) c = blend(stack[i], c);
    return c;
  };
  const opac = el => { let o = 1, e = el; while (e && e.nodeType === 1) { o *= parseFloat(cs(e).opacity); e = e.parentElement; } return o; };
  const out = []; const seen = new Set(); const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest('svg')) continue;
    const s = cs(el); if (s.visibility === 'hidden' || s.display === 'none') continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    if (el.offsetParent === null && s.position !== 'fixed') continue;
    if (opac(el) < 0.95) continue;
    const fg = parse(s.color); if (!fg || fg[3] === 0) continue;
    const bg = bgOf(el); if (!bg) continue;
    const f = fg[3] < 1 ? blend(fg, bg) : fg; const L1 = lum(f), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const fs = parseFloat(s.fontSize), fw = parseInt(s.fontWeight);
    const thr = (fs >= 24 || (fs >= 18.66 && fw >= 700)) ? 3 : 4.5;
    if (ratio < thr - 0.01) {
      const id = (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      out.push({ label, el: el.tagName.toLowerCase() + id, txt: t.textContent.trim().slice(0, 40), r: +ratio.toFixed(2), fg: s.color, bg: 'rgb(' + bg.slice(0, 3).map(Math.round).join(',') + ')' });
    }
  }
  return out;
};

// ── Débordement horizontal (⚠️ mesurer avec clientWidth : innerWidth suit la page élargie) ──
window.__ovf = function () {
  const W = document.documentElement.clientWidth; const res = [];
  document.querySelectorAll('body *').forEach(e => {
    const r = e.getBoundingClientRect(); if (r.width === 0 || r.right <= W + 1) return;
    let p = e.parentElement, scroll = false;
    while (p && p !== document.body) { if (/(auto|scroll|hidden)/.test(getComputedStyle(p).overflowX)) { scroll = true; break; } p = p.parentElement; }
    if (!scroll) res.push(e.tagName + (e.id ? '#' + e.id : '') + '.' + (typeof e.className === 'string' ? e.className.split(' ')[0] : '') + ' ' + Math.round(r.right));
  });
  return { sw: document.documentElement.scrollWidth, W, res: res.slice(0, 15) };
};

// ── Pavés clairs (fond clair et peu saturé) — incohérences du thème sombre ──
window.__light = function (root, label) {
  const out = [];
  // L'accent --ink-blue (bleu PÂLE en sombre) sert de fond aux éléments actifs (pastille choisie,
  // onglet de période, lien du favori MBN) : clair par construction, voulu.
  const probe = document.createElement('i'); probe.style.background = 'var(--ink-blue)'; document.body.appendChild(probe);
  const accent = getComputedStyle(probe).backgroundColor; probe.remove();
  (root || document.body).querySelectorAll('*').forEach(e => {
    const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return;
    const r = e.getBoundingClientRect(); if (r.width < 6 || r.height < 6) return;
    if (e.offsetParent === null && s.position !== 'fixed') return;
    if (e.closest('.ipr-page')) return;                     // aperçu papier de la fiche de prêt : blanc voulu
    if (s.backgroundColor === accent) return;
    const m = s.backgroundColor.match(/rgba?\(([^)]+)\)/); if (!m) return;
    const p = m[1].split(/[ ,\/]+/).map(Number); if (p.length > 3 && p[3] < 0.5) return;
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]); const sat = Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]);
    if (L > 0.55 && sat < 40) {
      let o = 1, x = e; while (x && x.nodeType === 1) { o *= +getComputedStyle(x).opacity; x = x.parentElement; }
      if (o < 0.5) return;
      if (e.matches('input[type=color],input[type=range]')) return;   // contrôles natifs : rendu du navigateur
      out.push(label + ' ' + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + (typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' ' + s.backgroundColor + ' "' + (e.textContent || '').trim().slice(0, 25) + '"');
    }
  });
  return out;
};

// ── Champs visibles sans nom accessible ──
window.__unl = function (root, label) {
  const out = [];
  (root || document.body).querySelectorAll('input,select,textarea').forEach(e => {
    if (e.type === 'hidden') return;
    if (e.checkVisibility && !e.checkVisibility()) return;
    if (e.closest('[aria-hidden="true"]')) return;
    const lb = e.getAttribute('aria-labelledby');
    const name = (e.labels && [...e.labels].map(l => l.textContent.trim()).join(' ')) || e.getAttribute('aria-label')
      || (lb && lb.split(' ').map(i => document.getElementById(i)?.textContent || '').join(' ').trim()) || e.title || e.placeholder || '';
    if (name.trim()) return;
    const mo = e.closest('.mo,.tab');
    out.push({ label, where: mo ? mo.id : '?', tag: e.tagName.toLowerCase() + (e.tagName === 'INPUT' ? ':' + e.type : ''), id: e.id,
      handler: (e.getAttribute('onchange') || e.getAttribute('oninput') || e.getAttribute('onkeydown') || '').slice(0, 50),
      parent: (e.parentElement?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) });
  });
  return out;
};

window.__metaTest = function () {
  switchTab('classes');
  const d = document.createElement('div'); d.textContent = 'méta-test faible'; d.style.cssText = 'color:#ccc;background:#fff;position:relative';
  document.getElementById('tab-classes').prepend(d);
  const ok = __aud(document.body, 'meta').some(x => x.txt === 'méta-test faible'); d.remove();
  return ok;
};

// ── Les onglets ──
window.__tabsRun = async function () {
  const out = { contrast: {}, unlabeled: [], light: [] };
  for (const t of TABS) {
    try { switchTab(t); } catch (e) { out.contrast[t] = 'ERR ' + e.message; continue; }
    await sleep(200); closeAll();
    const tab = document.getElementById('tab-' + t);
    const a = __aud(document.body, t); if (a.length) out.contrast[t] = a.slice(0, 6);
    out.unlabeled.push(...__unl(tab, 'tab:' + t));
    out.light.push(...__light(tab, t).slice(0, 4));
  }
  out.light.push(...__light(document.getElementById('topbar') || document.body, 'topbar').slice(0, 4));
  return out;
};

// ── Toutes les modales forcées ouvertes (contenu statique) ──
window.__staticModalsRun = async function () {
  switchTab('plan'); closeAll();
  const out = { n: 0, contrast: [], unlabeled: [], light: [] };
  for (const m of document.querySelectorAll('.mo')) {
    out.n++; m.classList.add('on'); await sleep(10);
    out.contrast.push(...__aud(m, m.id).slice(0, 3));
    out.unlabeled.push(...__unl(m, 'static:' + m.id));
    out.light.push(...__light(m, m.id).slice(0, 3));
    m.classList.remove('on');
  }
  return out;
};

// ── Fenêtres ouvertes par leur VRAI ouvreur ──
// (forcer .on ne pose ni role, ni aria-modal, ni focus : seul l'ouvreur réel les vérifie)
window.__dynRun = async function (only) {
  const cls = S.classes[S.cur]; const sid = cls.eleves[3];
  const evs = Object.values(S.evaluations).filter(e => _evalIncludesClass(e, cls.id)); const evOf = t => evs.find(e => e.type === t);
  const reu = Object.keys(S.reunions || {})[0];
  const ev = { preventDefault() {}, stopPropagation() {}, clientX: 300, clientY: 300, pageX: 300, pageY: 300, target: document.body };
  const calls = [
    ['fiche', () => openFiche(sid)], ['ficheAnnee', () => openRemarkWriter(sid, '')], ['notes', () => openStuNotes(sid)], ['rem', () => openReminders(sid)], ['cmsg', () => openClassMsg()],
    ['remPresets', () => openReminderPresets()], ['tags', () => openTagsModal()], ['vclass', () => openVirtualClassModal()],
    ['vclassEdit', () => openVirtualClassModal(Object.values(S.classes).find(c => c.virtual)?.id)], ['links', () => openUserLinksModal()],
    ['shuffle', () => openShuffleDialog()], ['import', () => openImportStudents()], ['edit', () => openEdit(sid)], ['overview', () => openOverviewModal()],
    ['attStats', () => openAttStats()], ['hist', () => openHist(sid)], ['seat', () => openSeatPicker(ev, sid)],
    ['reset', () => openResetModal('year')], ['resetNuke', () => openResetModal('nuke')], ['resetDemo', () => openResetModal('demo')],
    ['aesh', () => openAeshModal(cls)], ['addSalle', () => openAddSalleToClass()], ['newSalle', () => openNewSalleModal()],
    ['autoIpads', () => openAutoIpads()], ['clearIpads', () => openClearIpadsModal()], ['qcmMarkers', () => openQcmMarkersDialog()],
    ['reunion', () => openReunionModal(reu)], ['reuExport', () => openReuExport()], ['reuMail', () => { openReuExport(); _rexMailOpen(); }],
    ['ipadPrint', () => openIpadPrint()], ['saveAtt', () => openSaveAttendanceModal()], ['att', () => openAttendanceModal()], ['attStu', () => openAttendanceModal('stu')],
    ['snapPos', () => openSnapshotsModal('positions')], ['snapInc', () => openSnapshotsModal('incidents')], ['printAll', () => openPrintAllClasses()],
    ['trombiImp', () => openTrombiImport()], ['memo', () => openMemoGame()], ['trombiView', () => openTrombiView()], ['evac', () => openEvacPrint()],
    ['settings', () => openSettingsMenu()], ['backup', () => openBackupSettings()], ['exportNotes', () => openExportNotes()],
    ['noise', () => openNoiseSettings()], ['timer', () => openTimerSettings()], ['about', () => openAbout()], ['evalPrefs', () => openEvalPrefs()],
    ['newEval', () => openNewEvalModal()], ['evalImport', () => _evalImportOpen()], ['disc', () => openDisciplinesModal()], ['comps', () => openCompetencesManager()],
    ['conseil', () => openConseilMentions()], ['journal', () => openJournal()], ['adjLib', () => openAdjustPresets('prefs')],
    ['comLib', () => openCommentLibrary('prefs')], ['collect', () => openCollectPatternsModal()],
    ['tagBulk', () => { selectedEleves = new Set(cls.eleves.slice(0, 3)); openTagBulkModal(); }],
    ['ipadPick', () => openIpadPicker(Object.keys(cls.seating).find(k => cls.seating[k]), 0)],
    ['late', () => promptLateForStudent(sid)], ['confirm', () => _uiConfirm({ title: 'Titre', message: 'Message', onOk() {} })],
    ['prompt', () => _uiPrompt({ title: 'Titre', label: 'Libellé', onOk() {} })], ['mc', () => openMod('mc')], ['ms', () => openMod('ms')],
    ['editClass', () => editClass(cls.id)], ['viol', () => showViolationsModal(cls)],
  ];
  const rec = Object.values(S.attendance?.[cls.id] || {})[0];
  if (rec) calls.push(['attPlan', () => viewAttRecordOnPlan(rec.id, cls.id)], ['attPlanEdit', () => editAttRecordOnPlan(rec.id, cls.id)]);
  const ctx = { preventDefault() {}, stopPropagation() {}, clientX: 300, clientY: 300 };
  for (const t of ['A', 'B', 'C', 'D']) {
    const e = evOf(t); if (!e) continue; const id = e.id;
    const inTab = f => async () => { _evalOpenTableur(id); await sleep(150); return f(); };
    calls.push(['tableur' + t, () => _evalOpenTableur(id)], ['edit' + t, () => _evalOpenEditor(id)], ['struct' + t, () => openEvalStructure(id)],
      ['rendu' + t, () => _evalOpenRendu(id, 'bilan')], ['renduP' + t, () => _evalOpenRendu(id, 'proj')], ['renduE' + t, () => _evalOpenRendu(id, 'ent')],
      ['detail' + t, () => _evalShowNoteDetail(id, sid)],
      ['com' + t, inTab(() => _evalCommentsOpen(e.miniNotes?.[0]?.id || ((e.passations?.[0]?.id || '') + '|' + (e.passations?.[0]?.competenceIds?.[0] || '')), sid, id))],
      ['adj' + t, inTab(() => _evalAdjustOpen(sid, id))], ['paste' + t, inTab(() => _evalPasteOpen())]);
    if (e.miniNotes?.length) calls.push(['mn' + t, inTab(() => _tableurMnContextMenu(ctx, e.miniNotes[0].id))], ['pick' + t, inTab(() => { _tableurMnContextMenu(ctx, e.miniNotes[0].id); _tableurMnPickCompetences(); })]);
    if (e.exercices?.length) calls.push(['exo' + t, inTab(() => _tableurExoContextMenu(ctx, e.exercices[0].id))]);
    if (t === 'A' || t === 'C') calls.push(['qcm' + t, inTab(() => _evalQcmcamOpen())]);
    if (t === 'B' && e.passations?.length) calls.push(['pass' + t, inTab(() => _tableurPassContextMenu(ctx, e.passations[0].id))], ['passNew', inTab(() => _evalAddPassation())],
      ['planB', inTab(() => _evalPlanOverlayOpen())], ['passSaisie', inTab(() => _evalOpenPassationSaisie(e.passations[0].id))]);
    if (t === 'C') calls.push(['mbn', async () => { _evalOpenRendu(id, 'ent'); await sleep(150); _mbnOpen(); }]);
  }
  calls.push(['cross', () => _bilanOpenCrossTab()], ['bilanExport', () => { switchTab('bilan'); _bilanOpenExport('copy'); }],
    ['meanGran', () => { switchTab('bilan'); _bilanOpenMeanGran(); }], ['mbnBul', () => { switchTab('bilan'); const sel = document.getElementById('bilan-period-filter'); if (sel && !sel.value) { sel.value = [...sel.options].find(o => o.value)?.value || ''; sel.dispatchEvent(new Event('change')); } _mbnBulOpen(); }]);   // « MBN · Bulletin » refuse la période « Toutes » (voulu) : en choisir une
  const results = []; const unlabeled = []; const light = []; const e0 = (window.__planClasseErrors || []).length;
  for (const [name, fn] of calls) {
    if (only && !only.includes(name)) continue;
    closeAll(); let err = null;
    try { await fn(); } catch (e) { err = e.message; }
    await sleep(220);
    const on = [...document.querySelectorAll('.mo.on')]; const ids = on.map(m => m.id);
    const issues = []; on.forEach(m => { issues.push(...__aud(m, name)); unlabeled.push(...__unl(m, 'dyn:' + name)); if (document.documentElement.dataset.theme === 'dark') light.push(...__light(m, 'dyn:' + name).slice(0, 3)); });
    const top = [...on].sort((x, y) => (+getComputedStyle(x).zIndex || 0) - (+getComputedStyle(y).zIndex || 0)).pop();
    const a11y = top ? { role: top.getAttribute('role'), modal: top.getAttribute('aria-modal'), focusIn: top.contains(document.activeElement) } : null;
    let ovf = 0;
    if (top) { const mb = top.querySelector('.mb'); if (mb) { const r = mb.getBoundingClientRect(); if (r.right > document.documentElement.clientWidth + 1 || r.left < -1) ovf = Math.round(r.width); } }
    const bad = err || !ids.length || issues.length || (a11y && (a11y.role !== 'dialog' || a11y.modal !== 'true' || !a11y.focusIn)) || ovf;
    if (bad) results.push({ name, err, ids: ids.join(','), a11y, ovf, issues: issues.slice(0, 4) });
  }
  closeAll();
  return { n: calls.length, bad: results, unlabeled, light, errs: (window.__planClasseErrors || []).slice(e0) };
};

// ── Sous-états des onglets ──
window.__subRun = async function () {
  const out = {}; const unlabeled = []; const light = []; const e0 = (window.__planClasseErrors || []).length;
  const A = (label, root) => { const r = root || document.querySelector('.tab.on') || document.body; const a = __aud(root || document.body, label); if (a.length) out[label] = a.slice(0, 5); unlabeled.push(...__unl(r, 'sub:' + label)); if (document.documentElement.dataset.theme === 'dark') light.push(...__light(r, 'sub:' + label).slice(0, 3)); };
  const cur = S.cur;
  switchTab('plan');
  for (const m of ['groupe', 'tag', 'genre', 'none']) { setPlanColorMode(m); await sleep(120); A('plan-color-' + m); }
  setPlanColorMode('groupe');
  for (const g of [1, 2]) { setGroupFilter(g); await sleep(100); A('plan-g' + g); }
  setGroupFilter(0);
  try { toggleAmHighlight('agr'); toggleAmHighlight('tt'); await sleep(100); A('plan-am'); toggleAmHighlight('agr'); toggleAmHighlight('tt'); } catch (e) { out.amErr = e.message; }
  try {
    toggleAppelMode(); await sleep(200);
    const cls = getCls(); const sids = Object.values(cls.seating).filter(Boolean);
    toggleAbsence(sids[0]); _lateToday.set(sids[1], '08:12'); renderTeacherGrid(); await sleep(150);
    A('plan-appel'); _absentToday.clear(); _lateToday.clear(); toggleAppelMode(); await sleep(150);
  } catch (e) { out.appelErr = e.message; }
  try { togglePlanConstraintMode(); await sleep(200); A('plan-contraintes'); _planCstrExit(); } catch (e) { out.cstrErr = e.message; }
  try { toggleConfMode(); await sleep(150); for (const t of ['eleves', 'plan', 'bilan', 'comp']) { switchTab(t); await sleep(150); A('confidentiel-' + t); } toggleConfMode(); } catch (e) { out.confErr = e.message; }
  for (const t of ['plan', 'eleves', 'svue', 'ipads']) {
    switchTab(t); await sleep(150);
    for (const [i, dd] of [...document.querySelectorAll('#tab-' + t + ' .dd')].entries()) {
      const b = dd.querySelector('button'); if (!b) continue;
      try { toggleDd(b); } catch (e) { b.click(); }
      await sleep(80); const menu = dd.querySelector('.dd-menu'); if (menu) A('menu-' + t + '-' + i, menu); closeAllDd();
    }
  }
  try { document.getElementById('hdr-file')?.click(); await sleep(120); A('menu-fichier'); closeAllDd(); } catch (e) {}
  try {
    switchTab('plan'); const cls = getCls(); const key = Object.keys(cls.seating).find(k => cls.seating[k]);
    showCtxMenu({ preventDefault() {}, stopPropagation() {}, clientX: 400, clientY: 300, pageX: 400, pageY: 300 }, cls, key, cls.seating[key]);
    await sleep(150); A('clic-droit', document.getElementById('ctx')); document.getElementById('ctx').style.display = 'none';
  } catch (e) { out.ctxErr = e.message; }
  switchTab('config');
  for (const m of ['tables', 'ilots', 'groupes', 'tags', 'contraintes']) { try { setCfgMode(m); } catch (e) { out['cfg-' + m + '-err'] = e.message; continue; } await sleep(150); A('cfg-' + m); }
  // Liste « élèves avec places autorisées » : vide dans la démo → une contrainte temporaire, retirée après
  try {
    const cls = getCls(); const room = cls.rooms[cls.activeRoom]; const key = Object.keys(cls.seating).find(k => cls.seating[k]); const s2 = cls.seating[key];
    const had = room.allowedFor[s2]; room.allowedFor[s2] = [key]; setCfgMode('contraintes'); cfgPickAllowedStudent(s2); await sleep(150); A('cfg-contraintes-liste');
    if (had) room.allowedFor[s2] = had; else delete room.allowedFor[s2];
  } catch (e) { out.cfgListErr = e.message; }
  setCfgMode('tables');
  switchTab('comp'); for (const v of ['domain', 'code']) { _compBilanSetDisplayMode(v); await sleep(150); A('comp-' + v); }
  switchTab('bilan');
  for (const p of ['S1', 'S2', '']) { const sel = document.getElementById('bilan-period-filter'); if (sel && [...sel.options].some(o => o.value === p)) { sel.value = p; sel.dispatchEvent(new Event('change')); await sleep(200); A('bilan-' + (p || 'toutes')); } }
  try { switchTab('eleves'); const cls = getCls(); selectedEleves = new Set(cls.eleves.slice(0, 4)); renderStudents(); updateEleveBulkBar(); await sleep(150); A('eleves-selection'); selectedEleves = new Set(); renderStudents(); updateEleveBulkBar(); } catch (e) { out.selErr = e.message; }
  const empty = Object.values(S.classes).find(c => !c.virtual && !Object.values(S.evaluations).some(ev => _evalIncludesClass(ev, c.id)));   // 3e A dans la démo
  if (empty) { switchClass(empty.id); for (const t of ['eleves', 'plan', 'notes', 'bilan', 'comp', 'ipads', 'qcmcam']) { switchTab(t); await sleep(150); A('classe-sans-devoir-' + t); } switchClass(cur); }
  const vc = Object.values(S.classes).find(c => c.virtual);
  if (vc) { switchClass(vc.id); for (const t of ['eleves', 'plan', 'bilan']) { switchTab(t); await sleep(150); A('recomposee-' + t); } switchClass(cur); }
  try { switchTab('reunions'); _reu.id = Object.keys(S.reunions)[0]; for (const v of ['prep', 'soir']) { _reu.view = v; renderReunions(); await sleep(150); A('reunion-' + v); } _reu.view = 'list'; renderReunions(); } catch (e) { out.reuErr = e.message; }
  try { switchTab('ipads'); _ipadSetView('list'); await sleep(150); A('tablettes-liste'); _ipadSetView('plan'); } catch (e) { out.ipErr = e.message; }
  try { switchTab('qcmcam'); _qcmSetView('list'); await sleep(150); A('qcmcam-liste'); _qcmSetView('plan'); } catch (e) { out.qcmErr = e.message; }
  closeAll();
  return { contrast: out, unlabeled, light, errs: (window.__planClasseErrors || []).slice(e0) };
};

// ── Impressions : règles @media print réinjectées, mesure DANS window.print() ──
// (plusieurs fonctions vident leur conteneur juste après l'impression ; le nom du PDF
// — document.title — sert d'identifiant, un chemin peut en imprimer plusieurs.)
window.__printRun = async function () {
  let css = '';
  for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; } for (const r of rules) if (r instanceof CSSMediaRule && /print/.test(r.media.mediaText)) for (const rr of r.cssRules) css += rr.cssText + '\n'; }
  const results = {}; let current = '?'; const origPrint = window.print; const AREAS = ['#pa', '#qcm-plan-print-area', '#am-print', '#__renduPrintArea__'];
  window.print = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); void document.body.offsetHeight;
    const roots = AREAS.map(q => document.querySelector(q)).filter(r => r && r.innerHTML.trim());
    const issues = []; let nodes = 0; for (const r of roots) { nodes += r.querySelectorAll('*').length; issues.push(...__aud(r, document.title)); }
    (results[document.title] = results[document.title] || []).push({ via: current, nodes, n: issues.length, issues: issues.slice(0, 4) });
    st.remove();
  };
  const cls = getCls(); const sid = cls.eleves[2];
  const evC = Object.values(S.evaluations).find(e => _evalIncludesClass(e, cls.id) && e.type === 'C');
  const paths = [
    ['Plan prof', () => { switchTab('plan'); doPrint('t'); }], ['Plan élève', () => { switchTab('svue'); doPrint('s'); }], ['Plan vide', () => doPrintEmpty()],
    ['Plusieurs plans', () => printAllClasses(Object.values(S.classes).filter(c => !c.virtual).slice(0, 2).map(c => ({ cid: c.id, sid: c.activeRoom })))],
    ['Liste élèves', () => { switchTab('eleves'); printElevesList(); }], ['Fiche de prêt', () => { openIpadPrint(); printSuiviPret(); }], ['Effectifs', () => printClassesBilan()],
    ['Plan vide (salle)', () => { switchTab('config'); doPrintEmptyConfigSalle(); }], ['Plans QCMcam', () => printQcmPlans(Object.keys(S.salles).slice(0, 2))],
    ['Marqueurs ArUco', () => { switchTab('qcmcam'); printSalleArucoMarkers(4); }], ['Bilan des notes', () => { switchTab('bilan'); printBilanNotes(); }],
    ['Bilan des compétences', () => { switchTab('comp'); printBilanComp(); }], ['Fiche élève', () => { openFiche(sid); printFiche(); }],
    ["Vue d'ensemble", () => { openOverviewModal(); printOverview(); }], ['Tableau de la classe', () => { switchTab('export-pos'); printPositions(); }],
    ['RDV remplie', () => { switchTab('reunions'); _reu.id = Object.keys(S.reunions)[0]; _reu.view = 'prep'; renderReunions(); printReunion('filled'); }],
    ['RDV alphabétique', () => printReunion('alpha')], ['RDV vierge', () => printReunion('blank')], ['RDV mini bilans', () => printReunionBilans()],
    ['Trombinoscope', () => { openTrombiView(); printTrombi(false); }], ['Évacuation', () => { openEvacPrint(); printEvac(); }],
    ['Résultats projetés', () => { _evalOpenRendu(evC.id, 'proj'); _renduPrint(); }],
  ];
  const errs = {};
  for (const [name, fn] of paths) {
    current = name; AREAS.forEach(q => { const e = document.querySelector(q); if (e) e.innerHTML = ''; });
    try { await fn(); } catch (e) { errs[name] = e.message; }
    await sleep(900); closeAll();
  }
  window.print = origPrint;
  const bad = Object.entries(results).flatMap(([t, v]) => v.filter(x => x.n).map(x => ({ pdf: t, via: x.via, n: x.n, issues: x.issues })));
  const generic = Object.keys(results).filter(t => /^Plan de Classe$/.test(t));
  return { paths: paths.length, pdfs: Object.keys(results).length, bad, errs, genericTitle: generic.length ? results[generic[0]].map(x => x.via) : [] };
};

// ── Débordements à la taille courante ──
window.__respRun = async function () {
  const r = {};
  for (const t of TABS) { switchTab(t); await sleep(250); const o = __ovf(); if (o.sw > o.W + 1 || o.res.length) r[t] = o; }
  const mo = {};
  for (const id of ['msettings', 'mreset', 'mevac', 'mreunion', 'mnotedet', 'mrw', 'me', 'mvc', 'mi', 'mshuffle', 'mtrombiview', 'mjournal', 'mevalprefs', 'mabout']) {
    const m = document.getElementById(id); if (!m) continue; m.classList.add('on'); await sleep(40);
    const mb = m.querySelector('.mb'); const w = mb ? Math.round(mb.getBoundingClientRect().width) : null; const o = __ovf();
    if ((w && w > document.documentElement.clientWidth) || o.sw > o.W + 1) mo[id] = { w, sw: o.sw };
    m.classList.remove('on');
  }
  return { W: document.documentElement.clientWidth, tabs: r, modals: mo, headerRight: Math.round(document.getElementById('hdr-right')?.getBoundingClientRect().width || 0) };
};

// ── Batterie complète, en arrière-plan : résultat dans window.__AUDIT ──
window.__auditStart = function (opts) {
  opts = opts || {};
  window.__AUDIT = null;
  // ⚠️ Panneau d'aperçu masqué au démarrage : fenêtre de 0 × 0 px, toutes les mesures sont vides
  // (tout « déborde », rien n'est visible, le méta-test échoue). Émuler une taille d'abord.
  if (document.documentElement.clientWidth < 320) {
    window.__AUDIT = { crash: 'Fenêtre de ' + document.documentElement.clientWidth + ' px : émuler une taille (ex. 1280 × 800) avant de mesurer.' };
    return window.__AUDIT.crash;
  }
  (async () => {
    const t0 = performance.now(); const R = { version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?', theme: document.documentElement.dataset.theme || 'light' };
    try {
      R.metaTest = __metaTest();
      R.tabs = await __tabsRun();
      R.staticModals = await __staticModalsRun();
      R.dyn = await __dynRun();
      R.sub = await __subRun();
      if (opts.print !== false) R.print = await __printRun();
      R.integrity = _auditState({ repair: false }).issues;
      R.errors = window.__planClasseErrors || [];
      const nContrast = Object.keys(R.tabs.contrast).length + R.staticModals.contrast.length + R.dyn.bad.length + Object.keys(R.sub.contrast).length + (R.print ? R.print.bad.length : 0);
      const nUnl = R.tabs.unlabeled.length + R.staticModals.unlabeled.length + R.dyn.unlabeled.length + R.sub.unlabeled.length;
      const nLight = R.theme === 'dark' ? R.tabs.light.length + R.staticModals.light.length + R.dyn.light.length + R.sub.light.length : 0;
      R.summary = { contraste_et_fenetres: nContrast, champs_sans_nom: nUnl, paves_clairs_en_sombre: nLight, integrite: R.integrity.length, erreurs: R.errors.length,
        metaTest: R.metaTest ? 'ok' : 'ÉCHEC — l\'auditeur ne voit rien', secondes: Math.round((performance.now() - t0) / 1000) };
    } catch (e) { R.crash = e.message + '\n' + e.stack; }
    closeAll();
    window.__AUDIT = R;
  })();
  return 'audit lancé — relire window.__AUDIT (null tant que ce n\'est pas fini), puis window.__AUDIT.summary';
};
})();
