// Scénario de synchronisation à DEUX POSTES, de bout en bout sur l'horloge vectorielle.
// Deux instances de l'app (deux sandboxes = deux localStorage = deux _DEVICE_ID) échangent
// le JSON comme le ferait le fichier de sync Nextcloud. On vérifie la classification que
// chaque poste ferait au focus (_versionRelation) à chaque étape :
//   1. B charge le fichier de A                      → B : equal
//   2. B modifie, écrit                              → A : ahead (le disque domine)
//   3. A modifie AUSSI sans avoir rechargé           → A : diverged, B : diverged
//   4. A « garde sa version » (fusion max + bump)    → B : ahead ; A relu : equal
//   5. Ctrl+Z sur A après la résolution              → B toujours behind (jamais de faux diverged)
//   6. Poste vierge (aucune mutation locale) face à un fichier daté → ahead d'office
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadApp } = require('./harness');

const FIX = fs.readFileSync(path.join(__dirname, 'fixtures', 'compat', 'v2026-08-02.json'), 'utf8');
const boot = (app, json) => { app.__J = json; app.__TESTEVAL(`S = JSON.parse(globalThis.__J); postLoadHook(); applyAccessorsAll(); undoStack.length = 0; redoStack.length = 0;`); };
const exportJSON = app => app.__TESTEVAL(`JSON.stringify(S)`);
const relation = (app, json) => { app.__J = json; return app.__TESTEVAL(`_versionRelation(JSON.parse(globalThis.__J))`); };
const mutate = (app, sid) => app.__TESTEVAL(`(() => { pushUndo(); const s = Object.values(S.eleves)[${sid}]; s.oublis = (s.oublis || 0) + 1; save(); return s.id; })()`);

test('sync deux postes : equal → ahead → diverged → résolution → undo sans faux conflit', () => {
  const A = loadApp(), B = loadApp();
  assert.notEqual(A.__TESTEVAL('_DEVICE_ID'), B.__TESTEVAL('_DEVICE_ID'), 'deux appareils distincts');
  boot(A, FIX); mutate(A, 0);            // A part d'un état qui porte SA marque
  const fileA1 = exportJSON(A);
  boot(B, fileA1);                        // 1. B ouvre le fichier de A
  assert.equal(relation(B, fileA1), 'equal');
  assert.equal(relation(A, fileA1), 'equal');
  mutate(B, 1); const fileB2 = exportJSON(B);   // 2. B modifie et écrit
  assert.equal(relation(A, fileB2), 'ahead', 'A voit le disque plus récent → popup de rechargement');
  assert.equal(relation(B, fileA1), 'behind', 'B voit son propre ancien fichier en retard → silence + réécriture');
  mutate(A, 2); const fileA3 = exportJSON(A);   // 3. A modifie sans recharger
  assert.equal(relation(A, fileB2), 'diverged');
  assert.equal(relation(B, fileA3), 'diverged');
  // 4. A « garde ma version » : fusion élément par élément puis bump — comme _conflictKeepMine
  A.__J = fileB2; A.__TESTEVAL(`_clockMergeMax(S.clock, JSON.parse(globalThis.__J).clock); _clockBumpSelf();`);
  const fileA4 = exportJSON(A);
  assert.equal(relation(B, fileA4), 'ahead', 'B doit maintenant recharger, pas re-signaler un conflit');
  assert.equal(relation(A, fileA4), 'equal');
  boot(B, fileA4);
  assert.equal(relation(B, fileA4), 'equal');
  // 5. Ctrl+Z sur A : l'horloge ne doit JAMAIS reculer pour les autres appareils
  A.__TESTEVAL(`undoLast()`);
  const fileA5 = exportJSON(A);
  assert.equal(relation(B, fileA5), 'ahead', "après un undo chez A, B voit toujours A en avance — pas de faux 'diverged'");
  assert.equal(relation(A, fileA4), 'behind');
});

test('sync : un poste vierge face à un fichier daté prend le fichier (ahead d\'office)', () => {
  const A = loadApp(), V = loadApp();
  boot(A, FIX); mutate(A, 0); const fileA = exportJSON(A);
  V.__TESTEVAL(`postLoadHook(); applyAccessorsAll();`); // état de démarrage, aucune mutation
  assert.equal(relation(V, fileA), 'ahead');
});

test('sync : horloge corrompue dans le fichier (chaînes, négatifs) → normalisée, comparaison saine', () => {
  const A = loadApp();
  boot(A, FIX); mutate(A, 0);
  const bad = JSON.parse(exportJSON(A)); bad.clock = { ...bad.clock, zzz: '12', neg: -5, nan: 'abc' };
  const r = JSON.parse(A.__TESTEVAL(`JSON.stringify((() => { const me = _DEVICE_ID; const c = { [me]: S.clock[me] }; const other = JSON.parse(globalThis.__J).clock; const t = { ...c }; _clockMergeMax(t, other); return { t, cmp: _clockCompare(t, c) }; })())`.replace('globalThis.__J', JSON.stringify(JSON.stringify(bad)))));
  assert.equal(r.t.zzz, 12, 'chaîne coercée en nombre');
  // Un compteur négatif ou non numérique n'est pas fusionné : clé absente = 0, ce qui revient au même.
  assert.equal(r.t.neg ?? 0, 0, 'négatif ignoré (absent = 0)');
  assert.equal(r.t.nan ?? 0, 0);
  assert.equal(r.cmp, 'ahead');
});
