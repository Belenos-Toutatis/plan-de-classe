// Fuzz de fichiers CORROMPUS : à partir d'une fixture réelle, on supprime, remplace par des
// valeurs absurdes ou change le type de 1 à 4 clés au hasard (graine fixe → reproductible),
// puis on rejoue le chemin d'import complet. Attendu : soit _validateImport refuse, soit le
// chargement ABOUTIT sans exception — jamais un plantage à mi-migration, qui laisserait l'app
// sur un état incohérent sans message. Première passe (300 mutations) : 3 familles de
// plantage — S.eleves absent, entrée d'élève null, cls.rooms non-objet — corrigées par
// _sanitizeCoreSections. Ce test rejoue 150 mutations et exige 0 exception.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadApp } = require('./harness');

test('fuzz : 150 fichiers corrompus → refusés ou chargés, jamais de plantage', () => {
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'compat', 'v2026-08-02.json'), 'utf8'));
  let seed = 20260905; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const WEIRD = [null, undefined, 0, -1, 1e9, '', 'x', [], {}, true, NaN, '2026-13-45', '<img onerror=1>'];
  const paths = (o, p = [], out = [], depth = 0) => { if (depth > 5 || out.length > 4000) return out; if (o && typeof o === 'object') for (const k of Object.keys(o)) { out.push([...p, k]); paths(o[k], [...p, k], out, depth + 1); } return out; };
  const allPaths = paths(base);
  const app = loadApp();
  const origWarn = console.warn; console.warn = () => {}; // les réparations journalisent, on ne veut pas 150 lignes
  const origLog = console.log; console.log = () => {};
  const failures = [];
  try {
    for (let i = 0; i < 150; i++) {
      const d = JSON.parse(JSON.stringify(base));
      const desc = [];
      for (let j = 0, n = 1 + Math.floor(rnd() * 4); j < n; j++) {
        const pth = pick(allPaths); let o = d; for (let k = 0; k < pth.length - 1; k++) o = o && o[pth[k]];
        if (!o || typeof o !== 'object') continue;
        const key = pth[pth.length - 1], r = rnd();
        if (r < 0.35) { delete o[key]; desc.push('del ' + pth.join('.')); }
        else if (r < 0.7) { o[key] = pick(WEIRD); desc.push('weird ' + pth.join('.')); }
        else { const v = o[key]; o[key] = Array.isArray(v) ? {} : (v && typeof v === 'object') ? [] : (typeof v === 'number' ? 'n' : 42); desc.push('type ' + pth.join('.')); }
      }
      app.__FUZZ = JSON.stringify(d);
      const res = app.__TESTEVAL(`(() => { try { const data = JSON.parse(globalThis.__FUZZ); if (_validateImport(data)) return 'rejected'; S = data; postLoadHook(); applyAccessorsAll(); _auditState({ repair: true }); JSON.stringify(S); for (const c of Object.values(S.classes)) { c.seating; } return 'ok'; } catch (e) { return 'THROW ' + (e && e.message); } })()`);
      if (res.startsWith('THROW')) failures.push(desc.join(' ; ') + ' → ' + res);
    }
  } finally { console.warn = origWarn; console.log = origLog; }
  assert.deepEqual(failures, []);
});

test('sanitize : sections absentes, entrées null, rooms non-objet → chargement sans exception', () => {
  const app = loadApp();
  const r = JSON.parse(app.__TESTEVAL(`JSON.stringify((() => {
    const w = console.warn; console.warn = () => {};
    try {
      S = { classes: { A: { id: 'A', nom: 'A', eleves: ['e1', 'e2'], rooms: 'x' }, B: null }, eleves: { e1: { id: 'e1', nom: 'X', prenom: 'Y', classe_id: 'A' }, e2: null }, cur: 'A' };
      postLoadHook(); applyAccessorsAll();
      const a = S.classes.A;
      return { classes: Object.keys(S.classes), eleves: Object.keys(S.eleves), roomsOk: typeof a.rooms === 'object' && !!a.rooms[a.activeRoom], seating: a.seating, salles: Object.keys(S.salles).length, inscrits: a.eleves };
    } finally { console.warn = w; }
  })())`));
  assert.deepEqual(r.classes, ['A']);
  assert.deepEqual(r.eleves, ['e1']);
  assert.equal(r.roomsOk, true);
  assert.deepEqual(r.seating, {});
  assert.ok(r.salles >= 1);
  assert.deepEqual(r.inscrits, ['e1'], 'le fantôme e2 est retiré du roster par _auditState');
});
