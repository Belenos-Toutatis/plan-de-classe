// Suite de tests — logique pure de « plan de classe.html ».
// Lancer : node --test   (ou : npm test)
//
// Couvre les chemins à risque : suppression en cascade (la classe de bugs trouvée
// à l'audit), audit d'intégrité, dates/périodes, parseurs, validation d'import.
// Charge l'app une fois (harnais vm) et réinitialise S par test.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

const app = loadApp();
const ev = c => app.__TESTEVAL(c);

// Neutralise les effets de bord UI une fois pour toutes (les fonctions sont des
// déclarations hoistées → réassignables dans la portée du script).
ev(`pushUndo=function(){}; save=function(){}; refreshSelector=function(){};
    renderClasses=function(){}; renderStudents=function(){}; renderTeacherGrid=function(){};
    renderTab=function(){}; toast=function(){}; _updateDirtyIndicator=function(){};
    _uiConfirm=function(o){ o && o.onOk && o.onOk(); };`);

function setState(obj) {
  ev('S = ' + JSON.stringify(obj) + '; if (typeof applyAccessorsAll === "function") applyAccessorsAll();');
}
const get = c => JSON.parse(ev('JSON.stringify(' + c + ')') ?? 'null');

// ─────────────────────────────────────────────────────────────────────────────
// Calculatrice de cellule (_evalArithExpr) — parser maison, jamais d'eval JS.
// ─────────────────────────────────────────────────────────────────────────────
test('_evalArithExpr : opérations valides', () => {
  assert.equal(ev('_evalArithExpr("1+2*3")'), 7);
  assert.equal(ev('_evalArithExpr("(8+7)/2")'), 7.5);
  assert.equal(ev('_evalArithExpr("=5+3")'), 8);     // style tableur
  assert.equal(ev('_evalArithExpr("0,5*4")'), 2);    // virgule décimale FR
});
test('_evalArithExpr : cas invalides → null', () => {
  assert.equal(ev('_evalArithExpr("5/(2-2)")'), null); // division par zéro
  assert.equal(ev('_evalArithExpr("1++2-")'), null);   // mal formé
  assert.equal(ev('_evalArithExpr("(1+2")'), null);    // parenthèses déséquilibrées
  assert.equal(ev('_evalArithExpr("5")'), null);       // pas d'opérateur → laisse parseFloat agir
});

// ─────────────────────────────────────────────────────────────────────────────
// Dates / périodes
// ─────────────────────────────────────────────────────────────────────────────
test('_periodEndDate : semestres', () => {
  ev('S.evalPrefs = S.evalPrefs || {}; S.evalPrefs.periodMode = "semestre";');
  assert.match(ev('_periodEndDate("S1")'), /-01-31$/);
  assert.match(ev('_periodEndDate("S2")'), /-08-31$/);
});
test('_periodEndDate : T2 = dernier jour de février (gère bissextiles)', () => {
  ev('S.evalPrefs.periodMode = "trimestre";');
  assert.match(ev('_periodEndDate("T2")'), /-02-(28|29)$/);
  assert.match(ev('_periodEndDate("T1")'), /-11-30$/);
});

test('_stuActiveOn / _stuDepartedOn : bornes arrivée / départ', () => {
  // Pas encore arrivé
  assert.equal(ev('_stuActiveOn({arrivalDate:"2099-01-01",departureDate:null},"2026-06-09")'), false);
  // Parti (departureDate = 1er jour d\'absence, exclusif)
  assert.equal(ev('_stuActiveOn({arrivalDate:null,departureDate:"2026-01-01"},"2026-06-09")'), false);
  assert.equal(ev('_stuDepartedOn({arrivalDate:null,departureDate:"2026-01-01"},"2026-06-09")'), true);
  // Présent (sans bornes)
  assert.equal(ev('_stuActiveOn({arrivalDate:null,departureDate:null},"2026-06-09")'), true);
  // Le jour du départ = absent
  assert.equal(ev('_stuActiveOn({arrivalDate:null,departureDate:"2026-06-09"},"2026-06-09")'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Parseurs
// ─────────────────────────────────────────────────────────────────────────────
test('parseUnavailableInput : tri, dédup, filtre hors borne', () => {
  assert.deepEqual(get('parseUnavailableInput("1, 7, 15, 7, 200", 20)'), [1, 7, 15]);
  assert.deepEqual(get('parseUnavailableInput("", 20)'), []);
});

test('_newRoomTemplate : structure complète', () => {
  const keys = get('Object.keys(_newRoomTemplate())');
  for (const k of ['seating', 'groupes', 'ipadsByPool', 'posTagId', 'allowedFor', 'aeshCount', 'aeshSeating', 'aeshLinks']) {
    assert.ok(keys.includes(k), `clé manquante : ${k}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation d'import (prototype pollution récursive + clés + URL)
// ─────────────────────────────────────────────────────────────────────────────
test('_validateImport : données saines acceptées', () => {
  app.__OK = JSON.parse('{"classes":{"c1":{}},"eleves":{"s1":{}}}');
  assert.equal(ev('_validateImport(globalThis.__OK)'), null);
});
test('_validateImport : __proto__ en profondeur rejeté (vecteur JSON.parse)', () => {
  app.__PP = JSON.parse('{"eleves":{"s1":{"rooms":{"r":{"__proto__":1}}}}}');
  assert.match(ev('_validateImport(globalThis.__PP)'), /interdite|prototype/i);
});
test('_validateImport : clé d\'id invalide rejetée', () => {
  app.__BK = JSON.parse('{"classes":{"bad key!":{}}}');
  assert.match(ev('_validateImport(globalThis.__BK)'), /invalide/i);
});
test('_validateImport : URL javascript: rejetée', () => {
  app.__JU = { userLinks: [{ id: 'a', label: 'x', url: 'javascript:alert(1)' }] };
  assert.match(ev('_validateImport(globalThis.__JU)'), /refus|schéma/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suppression en cascade — _purgeStudentRefs (source unique de vérité)
// ─────────────────────────────────────────────────────────────────────────────
function stateWithStudent() {
  setState({
    cur: 'c1',
    classes: { c1: {
      id: 'c1', nom: '6A', eleves: ['s1', 's2'], activeRoom: 'r1', activePool: 'p1',
      rooms: { r1: {
        seating: { '0,0': 's1', '0,1': 's2' },
        allowedFor: { s1: ['0,0'], s2: ['0,1'] },
        aeshLinks: { 0: ['s1', 's2'] },
        ipadsByPool: { p1: { ce: { '0,0': 3, '0,1': 4 }, g1: {}, g2: {} } },
        groupes: {}, posTagId: {}, aeshCount: 1, aeshSeating: { 0: '1,1' },
      } },
      noNeighbors: ['s1|s2'], membership: { s1: { fromPer: 'S1', toPer: null } },
    } },
    eleves: {
      s1: { id: 's1', nom: 'A', prenom: 'Al', classe_id: 'c1' },
      s2: { id: 's2', nom: 'B', prenom: 'Bo', classe_id: 'c1' },
    },
    evaluations: { e1: {
      id: 'e1', classIds: ['c1'], notes: { s1: { values: {} }, s2: { values: {} } },
      studentRemarks: { s1: 'note s1' }, passations: [{ id: 'p', niveaux: { s1: {}, s2: {} } }],
    } },
    conseilClasse: { c1: { disc1: { s1: { S1: { F: true } }, s2: {} } } },
    bulletinRemarques: { c1: { disc1: { s1: { S1: 'rem' }, s2: {} } } },
    salles: { r1: { nom: 'Salle', rows: 5, cols: 6, positions_vides: [] } },
    tabletPools: { p1: { id: 'p1', nom: 'CM1' } },
    attendance: {}, snapshots: {}, movedHighlights: {},
  });
}

test('_purgeStudentRefs : retire TOUTES les références sans supprimer l\'élève', () => {
  stateWithStudent();
  ev('_purgeStudentRefs("s1")');
  assert.deepEqual(get('S.classes.c1.eleves'), ['s2']);
  assert.deepEqual(get('S.classes.c1.rooms.r1.seating'), { '0,1': 's2' });
  assert.deepEqual(get('S.classes.c1.rooms.r1.ipadsByPool.p1.ce'), { '0,1': 4 });
  assert.equal(ev('"s1" in S.classes.c1.rooms.r1.allowedFor'), false);
  assert.deepEqual(get('S.classes.c1.rooms.r1.aeshLinks["0"]'), ['s2']);
  assert.deepEqual(get('S.classes.c1.noNeighbors'), []);
  assert.equal(ev('"s1" in S.classes.c1.membership'), false);
  assert.equal(ev('"s1" in S.evaluations.e1.notes'), false);
  assert.equal(ev('"s1" in S.evaluations.e1.studentRemarks'), false);
  assert.equal(ev('"s1" in S.evaluations.e1.passations[0].niveaux'), false);
  assert.equal(ev('"s1" in S.conseilClasse.c1.disc1'), false);
  assert.equal(ev('"s1" in S.bulletinRemarques.c1.disc1'), false);
  // _purgeStudentRefs NE supprime PAS l\'enregistrement élève (c\'est le rôle du caller)
  assert.equal(ev('"s1" in S.eleves'), true);
  // s2 intact
  assert.equal(ev('"s2" in S.eleves'), true);
  assert.deepEqual(get('S.evaluations.e1.passations[0].niveaux'), { s2: {} });
});

test('_deleteStudentInternal : purge + supprime l\'enregistrement', () => {
  stateWithStudent();
  ev('_deleteStudentInternal("s1")');
  assert.equal(ev('"s1" in S.eleves'), false);
  assert.equal(ev('"s2" in S.eleves'), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suppression de classe réelle — cascade + évals orphelines
// ─────────────────────────────────────────────────────────────────────────────
test('deleteClass : purge stores indexés par classe + éval orpheline supprimée, multi-classes conservée', () => {
  setState({
    cur: 'c1',
    classes: {
      c1: { id: 'c1', nom: '6A', eleves: ['s1'], activeRoom: 'r1', activePool: 'p1',
            rooms: { r1: { seating: { '0,0': 's1' }, ipadsByPool: {}, allowedFor: {}, aeshLinks: {}, groupes: {}, posTagId: {} } } },
      c2: { id: 'c2', nom: '6B', eleves: ['s3'], activeRoom: 'r1', activePool: 'p1',
            rooms: { r1: { seating: {}, ipadsByPool: {}, allowedFor: {}, aeshLinks: {}, groupes: {}, posTagId: {} } } },
    },
    eleves: { s1: { id: 's1', nom: 'A', prenom: 'Al', classe_id: 'c1' }, s3: { id: 's3', nom: 'C', prenom: 'Ce', classe_id: 'c2' } },
    evaluations: {
      e1: { id: 'e1', classIds: ['c1'], notes: { s1: { values: {} } } },                    // orpheline après suppression
      e2: { id: 'e2', classIds: ['c1', 'c2'], notes: { s1: { values: {} }, s3: { values: {} } }, dates: { c1: '2026-01-01', c2: '2026-01-02' } },
    },
    attendance: { c1: { rec1: { id: 'rec1' } }, c2: {} },
    snapshots: { snap1: { id: 'snap1', classId: 'c1' }, snap2: { id: 'snap2', classId: 'c2' } },
    movedHighlights: { c1: {}, c2: {} },
    conseilClasse: { c1: { disc1: {} } }, bulletinRemarques: { c1: { disc1: {} } },
    bulletinClassRemarques: { c1: {} }, bulletinWorkedItems: { c1: {} },
    salles: { r1: { nom: 'Salle', rows: 5, cols: 6, positions_vides: [] } },
    tabletPools: { p1: { id: 'p1' } },
  });
  ev('deleteClass("c1")'); // _uiConfirm stubé → onOk immédiat

  assert.equal(ev('"c1" in S.classes'), false);
  assert.equal(ev('"c2" in S.classes'), true);
  assert.equal(ev('"s1" in S.eleves'), false, 'élève de la classe supprimé');
  assert.equal(ev('"s3" in S.eleves'), true);
  assert.equal(ev('"c1" in S.attendance'), false);
  assert.equal(ev('"snap1" in S.snapshots'), false);
  assert.equal(ev('"snap2" in S.snapshots'), true);
  assert.equal(ev('"c1" in S.movedHighlights'), false);
  assert.equal(ev('"c1" in S.conseilClasse'), false);
  assert.equal(ev('"c1" in S.bulletinRemarques'), false);
  // e1 (rattachée à c1 seule) supprimée ; e2 (multi) conservée sans c1
  assert.equal(ev('"e1" in S.evaluations'), false, 'éval orpheline supprimée');
  assert.equal(ev('"e2" in S.evaluations'), true);
  assert.deepEqual(get('S.evaluations.e2.classIds'), ['c2']);
  assert.equal(ev('"c1" in S.evaluations.e2.dates'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit d'intégrité — détection + réparation des références orphelines
// ─────────────────────────────────────────────────────────────────────────────
test('_auditState : répare élève fantôme + pointeurs invalides', () => {
  setState({
    cur: 'CLASSE_MORTE',
    classes: { c1: {
      id: 'c1', nom: '6A', eleves: ['s1', 'FANTOME'],
      activeRoom: 'SALLE_MORTE', activePool: 'POOL_MORT',
      rooms: { r1: { seating: { '0,0': 's1', '0,1': 'FANTOME' }, ipadsByPool: {}, allowedFor: { FANTOME: ['0,1'] }, aeshLinks: {}, groupes: {}, posTagId: {} } },
    } },
    eleves: { s1: { id: 's1', nom: 'A', prenom: 'Al', classe_id: 'c1' } },
    salles: { r1: { nom: 'Salle', rows: 5, cols: 6, positions_vides: [] } },
    tabletPools: { p1: { id: 'p1' } },
    evaluations: {}, attendance: {}, snapshots: {}, movedHighlights: {},
  });
  const res = get('_auditState({ repair: true })');
  assert.ok(res.issues.length >= 1, 'des problèmes doivent être détectés');
  assert.ok(res.repaired >= 1, 'des réparations doivent être appliquées');
  // Fantôme purgé du seating + allowedFor + roster
  assert.deepEqual(get('S.classes.c1.rooms.r1.seating'), { '0,0': 's1' });
  assert.equal(ev('"FANTOME" in S.classes.c1.rooms.r1.allowedFor'), false);
  assert.deepEqual(get('S.classes.c1.eleves'), ['s1']);
  // activeRoom pointe une salle existante, S.cur une classe existante
  assert.equal(ev('S.salles[S.classes.c1.activeRoom] ? true : false'), true);
  assert.equal(ev('S.classes[S.cur] ? true : false'), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Régressions de la passe d'audit exhaustif
// ─────────────────────────────────────────────────────────────────────────────
test('migrateEvalDefaults : préserve une config nbLevels≠4 (pas de reset destructeur)', () => {
  setState({
    classes: {}, eleves: {}, evaluations: {},
    evalPrefs: {
      nbLevels: 6,
      maitriseColors: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666'],
      maitrisePoints: [3, 6, 9, 12, 16, 20],
    },
  });
  ev('migrateEvalDefaults()');
  assert.equal(ev('S.evalPrefs.nbLevels'), 6);
  assert.equal(ev('S.evalPrefs.maitriseColors.length'), 6);
  assert.equal(ev('S.evalPrefs.maitrisePoints.length'), 6);
  assert.deepEqual(get('S.evalPrefs.maitrisePoints'), [3, 6, 9, 12, 16, 20], 'config utilisateur conservée');
});

test('migrateEvalDefaults : assainit une couleur forgée (anti-XSS)', () => {
  setState({
    classes: {}, eleves: {}, evaluations: {},
    evalPrefs: { nbLevels: 2, maitriseColors: ['#fff"><img onerror=alert(1)>', '#00ff00'], maitrisePoints: [10, 20] },
  });
  ev('migrateEvalDefaults()');
  const c0 = ev('S.evalPrefs.maitriseColors[0]');
  assert.ok(!/[<">]/.test(c0), 'couleur dangereuse neutralisée : ' + c0);
});

test('deleteClass (recomposée) : purge bulletins/conseil/évals SANS supprimer les élèves réels', () => {
  setState({
    cur: 'v1',
    classes: {
      v1: { id: 'v1', nom: 'DNL', virtual: true, eleves: ['s1'], activeRoom: 'r1', activePool: 'p1',
            rooms: { r1: { seating: {}, ipadsByPool: {}, allowedFor: {}, aeshLinks: {}, groupes: {}, posTagId: {} } } },
      c1: { id: 'c1', nom: '6A', eleves: ['s1'], activeRoom: 'r1', activePool: 'p1',
            rooms: { r1: { seating: {}, ipadsByPool: {}, allowedFor: {}, aeshLinks: {}, groupes: {}, posTagId: {} } } },
    },
    eleves: { s1: { id: 's1', nom: 'A', prenom: 'Al', classe_id: 'c1' } },
    evaluations: { ev1: { id: 'ev1', classIds: ['v1'], notes: { s1: { values: {} } } } },
    bulletinRemarques: { v1: { d1: {} } }, conseilClasse: { v1: { d1: {} } },
    salles: { r1: { nom: 'S', rows: 5, cols: 6, positions_vides: [] } }, tabletPools: { p1: { id: 'p1' } },
    attendance: {}, snapshots: {}, movedHighlights: {},
  });
  ev('deleteClass("v1")');
  assert.equal(ev('"v1" in S.classes'), false);
  assert.equal(ev('"s1" in S.eleves'), true, 'élève réel NON supprimé');
  assert.equal(ev('"c1" in S.classes'), true);
  assert.equal(ev('"v1" in S.bulletinRemarques'), false);
  assert.equal(ev('"v1" in S.conseilClasse'), false);
  assert.equal(ev('"ev1" in S.evaluations'), false, 'éval orpheline de la recomposée supprimée');
});

test('_escJsAttr : neutralise le breakout de chaîne JS dans un attribut inline', () => {
  app.__q = "x');alert(1)//";
  const out = ev('_escJsAttr(globalThis.__q)');
  // Aucune apostrophe non précédée d\'un backslash (sinon elle refermerait la chaîne JS)
  assert.ok(!/(^|[^\\])'/.test(out), 'apostrophe non échappée subsiste : ' + out);
});

// ─────────────────────────────────────────────────────────────────────────────
// Régressions — points traités après l'audit exhaustif
// ─────────────────────────────────────────────────────────────────────────────
test('improveOnly : déterministe et optimal (indépendant de l\'ordre des évals)', () => {
  // Isole la logique improveOnly en stubant le calcul de note (renvoie e.__note).
  ev('_evalNoteSur20Rounded = function(e){ return e.__note; }');
  const oblig = { e0: { id: 'e0', classIds: ['c1'], periode: 'S1', coef: 1, __note: 10 } };
  const facA  = { eA: { id: 'eA', classIds: ['c1'], periode: 'S1', coef: 10, facultative: { active: true, mode: 'improveOnly' }, __note: 11 } };
  const facB  = { eB: { id: 'eB', classIds: ['c1'], periode: 'S1', coef: 1,  facultative: { active: true, mode: 'improveOnly' }, __note: 10.5 } };
  const run = (evals) => {
    setState({ classes: { c1: { id: 'c1' } }, eleves: { s1: { id: 's1', classe_id: 'c1' } }, evalPrefs: {}, evaluations: evals });
    return ev('_computeStudentMeanForPeriod("c1","s1","S1",null)');
  };
  const r1 = run({ ...oblig, ...facA, ...facB });
  const r2 = run({ ...oblig, ...facB, ...facA });
  assert.ok(Math.abs(r1 - r2) < 1e-9, `dépend de l'ordre : ${r1} vs ${r2}`);
  // Optimal = inclure A (11, coef 10) seul : (10 + 11*10) / 11 = 120/11
  assert.ok(Math.abs(r1 - (120 / 11)) < 1e-9, `non optimal : ${r1}`);
});

test('_qcmcamMatchStudent : préfixe de nom contredisant → ambig (pas de match auto)', () => {
  app.__students = [{ id: 's1', prenom: 'Léo', nom: 'Martin' }];
  const res = get('_qcmcamMatchStudent("Léo DUR.", globalThis.__students)');
  assert.equal(res.status, 'ambig', 'doit demander confirmation, pas matcher Léo Martin');
});

test('_qcmDisplayLabel : place exclue (Cas 3) → 🚫 (pas de numéro legacy trompeur)', () => {
  setState({
    classes: { c1: { id: 'c1', activeRoom: 'r1' } }, eleves: {},
    salles: { r1: { nom: 'S', rows: 8, cols: 15, positions_vides: [], qcmExcluded: ['0,0'] } }, // 8×15 → séquentiel (Cas 3)
  });
  assert.equal(ev('_qcmDisplayLabel(S.classes.c1, 0, 0, 15)'), '🚫', 'place exclue → marqueur');
  assert.match(ev('_qcmDisplayLabel(S.classes.c1, 0, 1, 15)'), /^\d+$/, 'place numérotée → numéro');
});

// ─────────────────────────────────────────────────────────────────────────────
// Régressions — 2e passe d'audit (injection CSV, maps per-classe, GC, salles)
// ─────────────────────────────────────────────────────────────────────────────
test('_csvCellGuard : neutralise les préfixes de formule, laisse le reste intact', () => {
  app.__f = '=cmd|\'/c calc\'!A1';
  assert.equal(ev('_csvCellGuard(globalThis.__f)'), "'" + "=cmd|'/c calc'!A1");
  assert.equal(ev('_csvCellGuard("+2+5")'), "'+2+5");
  assert.equal(ev('_csvCellGuard("-2+5")'), "'-2+5");
  assert.equal(ev('_csvCellGuard("@SUM(A1)")'), "'@SUM(A1)");
  assert.equal(ev('_csvCellGuard("\\tpayload")'), "'\tpayload");
  // Valeurs normales inchangées
  assert.equal(ev('_csvCellGuard("Dupont")'), 'Dupont');
  assert.equal(ev('_csvCellGuard("12,5")'), '12,5');
  assert.equal(ev('_csvCellGuard("")'), '');
  assert.equal(ev('_csvCellGuard(null)'), '');
});

test('_forEachEvalPerClassMap : visite éval + mini-notes + passations', () => {
  app.__ev = {
    dates: { c1: '2026-01-01' }, slotIds: { c1: 'M1' }, datesManual: { c1: true },
    seatingHashes: { c1: 'h1' },
    miniNotes: [{ id: 'm1', dates: { c1: '2026-01-02' }, slotIds: { c1: 'M2' },
                  datesByGroup: { c1: { 1: '2026-01-03' } }, slotIdsByGroup: { c1: { 1: 'S1' } } }],
    passations: [{ id: 'p1', dates: { c1: '' }, slotIds: { c1: 'M3' },
                   datesByGroup: { c1: {} }, slotIdsByGroup: { c1: {} } }],
  };
  const n = ev('(() => { let i = 0; _forEachEvalPerClassMap(globalThis.__ev, () => i++); return i; })()');
  assert.equal(n, 12, '4 maps éval + 4 maps mn + 4 maps passation');
});

test('_purgeClassRefs : nettoie les maps per-classe mn/pass + seatingHashes + violationsAccepted', () => {
  setState({
    cur: 'c2',
    classes: { c2: { id: 'c2', nom: '6B', eleves: [], rooms: {} } },
    eleves: {},
    evaluations: { e1: {
      id: 'e1', classIds: ['c1', 'c2'],
      dates: { c1: '2026-01-01', c2: '2026-01-02' },
      seatingHashes: { c1: 'h1', c2: 'h2' },
      miniNotes: [{ id: 'm1', dates: { c1: '2026-01-05', c2: '2026-01-06' },
                    slotIds: { c1: 'M1' }, datesByGroup: { c1: { 1: '2026-01-07' } } }],
      passations: [{ id: 'p1', dates: { c1: '2026-01-08' }, slotIdsByGroup: { c1: { 2: 'S2' } } }],
    } },
    violationsAccepted: { c1: 'hashA', c2: 'hashB' },
    attendance: {}, snapshots: {}, movedHighlights: {}, salles: {}, tabletPools: {},
  });
  ev('_purgeClassRefs("c1")');
  assert.equal(ev('"e1" in S.evaluations'), true, 'éval multi-classes conservée');
  assert.deepEqual(get('S.evaluations.e1.classIds'), ['c2']);
  assert.equal(ev('"c1" in S.evaluations.e1.dates'), false);
  assert.equal(ev('"c1" in S.evaluations.e1.seatingHashes'), false);
  assert.equal(ev('"c1" in S.evaluations.e1.miniNotes[0].dates'), false);
  assert.equal(ev('"c1" in S.evaluations.e1.miniNotes[0].slotIds'), false);
  assert.equal(ev('"c1" in S.evaluations.e1.miniNotes[0].datesByGroup'), false);
  assert.equal(ev('"c1" in S.evaluations.e1.passations[0].dates'), false);
  assert.equal(ev('"c1" in S.evaluations.e1.passations[0].slotIdsByGroup'), false);
  assert.equal(ev('"c1" in S.violationsAccepted'), false);
  // c2 intact partout
  assert.equal(ev('S.evaluations.e1.dates.c2'), '2026-01-02');
  assert.equal(ev('S.evaluations.e1.seatingHashes.c2'), 'h2');
  assert.equal(ev('S.evaluations.e1.miniNotes[0].dates.c2'), '2026-01-06');
  assert.equal(ev('S.violationsAccepted.c2'), 'hashB');
});

test('_gcSeatingSnapshots : conserve les hashes référencés, supprime les orphelins', () => {
  setState({
    classes: {}, eleves: {}, salles: {}, tabletPools: {},
    attendance: { c1: { rec1: { id: 'rec1', seatingHash: 'hAtt' } } },
    evaluations: {
      e1: { id: 'e1', classIds: ['c1'], seatingHash: 'hEv' },
      e2: { id: 'e2', classIds: ['c1'], seatingHashes: { c1: 'hEvC' } },
    },
    seatingSnapshots: {
      hAtt: { '0,0': 's1' }, hEv: { '0,1': 's2' }, hEvC: { '0,2': 's3' },
      hOrphelin1: {}, hOrphelin2: { '1,1': 'sX' },
    },
    snapshots: {}, movedHighlights: {},
  });
  ev('_gcSeatingSnapshots()');
  assert.deepEqual(get('Object.keys(S.seatingSnapshots).sort()'), ['hAtt', 'hEv', 'hEvC']);
});

test('_auditState : répare des dimensions de salle invalides (NaN / 0 / hors borne)', () => {
  setState({
    cur: 'c1',
    classes: { c1: { id: 'c1', nom: '6A', eleves: [], activeRoom: 'r1', rooms: { r1: { seating: {}, ipadsByPool: {}, allowedFor: {}, aeshLinks: {}, groupes: {}, posTagId: {} } } } },
    eleves: {},
    salles: {
      r1: { nom: 'OK', rows: 5, cols: 6, positions_vides: [] },
      r2: { nom: 'Cassée', rows: null, cols: 0, positions_vides: 'pas-un-tableau' },
    },
    tabletPools: {}, evaluations: {}, attendance: {}, snapshots: {}, movedHighlights: {},
  });
  const res = get('_auditState({ repair: true })');
  assert.ok(res.issues.some(i => /Cassée/.test(i)), 'salle invalide détectée');
  assert.equal(ev('Number.isInteger(S.salles.r2.rows) && S.salles.r2.rows >= 1'), true);
  assert.equal(ev('Number.isInteger(S.salles.r2.cols) && S.salles.r2.cols >= 1'), true);
  assert.equal(ev('Array.isArray(S.salles.r2.positions_vides)'), true);
  // La salle saine n'est pas touchée
  assert.equal(ev('S.salles.r1.rows'), 5);
  assert.equal(ev('S.salles.r1.cols'), 6);
});

// ─────────────────────────────────────────────────────────────────────────────
// Conseil de classe — mentions configurables (catalogue + incompatibilités).
// Migration legacy {F,E,AT,AC} → {cm_*:true}, règles d'incompatibilité par paires,
// purge en cascade d'une mention supprimée.
// ─────────────────────────────────────────────────────────────────────────────
function _seedConseil() {
  setState({
    classes: {}, eleves: {}, salles: {}, tabletPools: {}, evaluations: {},
    attendance: {}, snapshots: {}, movedHighlights: {},
    conseilMentions: {
      cm_fel: { id: 'cm_fel', nom: 'Félicitations', abbr: 'F', color: '#2563eb', ord: 0 },
      cm_enc: { id: 'cm_enc', nom: 'Encouragements', abbr: 'E', color: '#16a34a', ord: 1 },
      cm_avt: { id: 'cm_avt', nom: 'Avertissement travail', abbr: 'AT', color: '#d97706', ord: 2 },
      cm_avc: { id: 'cm_avc', nom: 'Avertissement comportement', abbr: 'AC', color: '#dc2626', ord: 3 },
    },
    conseilIncompat: ['cm_enc|cm_fel', 'cm_avt|cm_enc', 'cm_avc|cm_enc'],
    conseilClasse: {},
  });
}

test('conseil : _migrateConseilValues remappe le legacy {F,E,AT,AC} et est idempotent', () => {
  _seedConseil();
  ev(`S.conseilClasse = { C1: { disc_main: { s1: { S1: { F: true, AT: true }, S2: { E: true } } } } };
      _migrateConseilValues();`);
  assert.deepEqual(get("S.conseilClasse.C1.disc_main.s1.S1"), { cm_fel: true, cm_avt: true });
  assert.deepEqual(get("S.conseilClasse.C1.disc_main.s1.S2"), { cm_enc: true });
  const before = get("S.conseilClasse.C1.disc_main.s1.S1");
  ev("_migrateConseilValues();");
  assert.deepEqual(get("S.conseilClasse.C1.disc_main.s1.S1"), before); // idempotent
});

test('conseil : incompatibilités par paires (E retire F et les avertissements ; AT+AC cumulables)', () => {
  _seedConseil();
  // F puis E → E retire F
  ev("_toggleConseilClasse('C1','sX','S1','cm_fel','disc_main'); _toggleConseilClasse('C1','sX','S1','cm_enc','disc_main');");
  assert.deepEqual(get("Array.from(_getConseilActive('C1','sX','S1','disc_main')).sort()"), ['cm_enc']);
  // AT + AC cumulables
  ev("_toggleConseilClasse('C1','sY','S1','cm_avt','disc_main'); _toggleConseilClasse('C1','sY','S1','cm_avc','disc_main');");
  assert.deepEqual(get("Array.from(_getConseilActive('C1','sY','S1','disc_main')).sort()"), ['cm_avc', 'cm_avt']);
  // E retire AT ET AC (défauts E⊗AT, E⊗AC)
  ev("_toggleConseilClasse('C1','sY','S1','cm_enc','disc_main');");
  assert.deepEqual(get("Array.from(_getConseilActive('C1','sY','S1','disc_main')).sort()"), ['cm_enc']);
  // Retrait du dernier marqueur → feuillet supprimé
  ev("_toggleConseilClasse('C1','sX','S1','cm_enc','disc_main');");
  assert.equal(ev("!!(S.conseilClasse.C1 && S.conseilClasse.C1.disc_main && S.conseilClasse.C1.disc_main.sX)"), false);
});

test('conseil : _conseilPurgeMention retire la mention partout + nettoie les paires', () => {
  _seedConseil();
  ev(`S.conseilClasse = { C1: { disc_main: { a: { S1: { cm_fel: true, cm_enc: true } }, b: { S1: { cm_fel: true } } } } };
      _conseilPurgeMention('cm_fel');`);
  assert.deepEqual(get("S.conseilClasse.C1.disc_main.a.S1"), { cm_enc: true });
  assert.equal(ev("!!(S.conseilClasse.C1.disc_main.b && S.conseilClasse.C1.disc_main.b.S1)"), false); // feuillet vidé
  assert.deepEqual(get("S.conseilIncompat"), ['cm_avt|cm_enc', 'cm_avc|cm_enc']); // cm_enc|cm_fel retiré
});

test('conseil : _conseilIncompatKey trié + _conseilAreIncompat symétrique', () => {
  _seedConseil();
  assert.equal(ev("_conseilIncompatKey('cm_fel','cm_enc')"), 'cm_enc|cm_fel');
  assert.equal(ev("_conseilAreIncompat('cm_fel','cm_enc')"), true);
  assert.equal(ev("_conseilAreIncompat('cm_enc','cm_fel')"), true);
  assert.equal(ev("_conseilAreIncompat('cm_fel','cm_avt')"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Horloge de version (socle multi-postes — étape 1). deviceId + horloge
// vectorielle monotone, base de chargement, classification disque/mémoire.
// ─────────────────────────────────────────────────────────────────────────────
test('clock : _clockBumpSelf incrémente mon compteur', () => {
  setState({ classes: {}, eleves: {}, salles: {}, clock: {} });
  const k = JSON.stringify(ev('_DEVICE_ID'));
  ev('_clockBumpSelf()'); assert.equal(get(`S.clock[${k}]`), 1);
  ev('_clockBumpSelf()'); assert.equal(get(`S.clock[${k}]`), 2);
});

test('clock : _clockBumpForward ne recule jamais (monotonie de l\'undo)', () => {
  const k = JSON.stringify(ev('_DEVICE_ID'));
  setState({ classes: {}, eleves: {}, salles: {}, clock: { [ev('_DEVICE_ID')]: 5 } });
  ev('_clockBumpForward(5)'); assert.equal(get(`S.clock[${k}]`), 6);
  // Simule un undo qui restaure un S.clock antérieur (sans mon entrée) :
  ev('S.clock = {}');
  ev('_clockBumpForward(6)'); assert.equal(get(`S.clock[${k}]`), 7, 'avance depuis le compteur pré-undo');
});

test('clock : _clockMergeMax fusionne élément par élément (max)', () => {
  assert.deepEqual(
    JSON.parse(ev('(function(){const t={A:2,B:1};_clockMergeMax(t,{A:1,B:5,C:3});return JSON.stringify(t)})()')),
    { A: 2, B: 5, C: 3 });
});

test('clock : _clockOnLoad init l\'horloge + mémorise la base, garde les autres', () => {
  const me = ev('_DEVICE_ID');
  const k = JSON.stringify(me);
  setState({ classes: {}, eleves: {}, salles: {}, clock: { [me]: 3, autreposte: 4 } });
  ev('_clockOnLoad()');
  assert.equal(get(`S.clock[${k}]`), 3, 'mon compteur inchangé');
  assert.equal(get('S.clock.autreposte'), 4, 'horloge des autres appareils préservée');
  assert.deepEqual(get('_baseClock'), get('S.clock'), '_baseClock = copie de l\'horloge chargée');
});

test('clock : _clockCompare classe equal / ahead / behind / diverged', () => {
  assert.equal(ev('_clockCompare({A:2,B:3},{A:2,B:3})'), 'equal');
  assert.equal(ev('_clockCompare({A:3,B:3},{A:2,B:3})'), 'ahead');
  assert.equal(ev('_clockCompare({A:2,B:3},{A:2,B:4})'), 'behind');
  assert.equal(ev('_clockCompare({A:3,B:2},{A:2,B:3})'), 'diverged');
  assert.equal(ev('_clockCompare({},{})'), 'equal');
  assert.equal(ev('_clockCompare({A:1},{})'), 'ahead');
  assert.equal(ev('_clockCompare({},{A:1})'), 'behind');
});

// ─────────────────────────────────────────────────────────────────────────────
// Détection de conflit (étape 2) — classification disque vs mémoire.
// ─────────────────────────────────────────────────────────────────────────────
test('versionRelation : chemin horloge (les deux ont une horloge)', () => {
  setState({ classes: {}, eleves: {}, salles: {}, clock: { A: 2, B: 3 } });
  assert.equal(ev('_versionRelation({clock:{A:2,B:3}})'), 'equal');
  assert.equal(ev('_versionRelation({clock:{A:3,B:3}})'), 'ahead');    // le disque domine
  assert.equal(ev('_versionRelation({clock:{A:2,B:2}})'), 'behind');   // je domine
  assert.equal(ev('_versionRelation({clock:{A:3,B:2}})'), 'diverged'); // divergence
});

test('versionRelation : fallback legacy (un côté sans horloge → savedAt + contenu)', () => {
  setState({ classes: {}, eleves: {}, salles: {}, clock: {}, savedAt: 5 });
  // Contenu identique (savedAt/clock ignorés) → equal, même si savedAt diffère :
  assert.equal(ev('_versionRelation({classes:{},eleves:{},salles:{},savedAt:9})'), 'equal');
  // Contenu différent + savedAt disque plus récent → ahead :
  assert.equal(ev('_versionRelation({classes:{c1:{}},eleves:{},salles:{},savedAt:9})'), 'ahead');
  // Contenu différent + savedAt disque plus ancien → behind :
  assert.equal(ev('_versionRelation({classes:{c1:{}},eleves:{},salles:{},savedAt:1})'), 'behind');
});

test('versionRelation : poste vierge (mémoire sans horloge) vs disque avec horloge → ahead', () => {
  // Un 2ᵉ poste fraîchement ouvert (démo/vierge, savedAt frais, aucun pushUndo) ne doit
  // JAMAIS écraser un fichier de sync réel : le disque porte une horloge, pas la mémoire.
  setState({ classes: {}, eleves: {}, salles: {}, clock: {}, savedAt: 9999999999999 });
  assert.equal(ev('_versionRelation({classes:{c1:{}},eleves:{},salles:{},savedAt:1,clock:{A:7}})'), 'ahead');
});

test('periodeForDate : bornes alignées sur _periodEndDate (S1→31/01, T1→30/11, T2→fin fév.)', () => {
  assert.equal(ev("_periodeForDate('2026-09-15','semestre')"), 'S1');
  assert.equal(ev("_periodeForDate('2026-01-31','semestre')"), 'S1');
  assert.equal(ev("_periodeForDate('2026-02-01','semestre')"), 'S2');
  assert.equal(ev("_periodeForDate('2026-11-30','trimestre')"), 'T1');
  assert.equal(ev("_periodeForDate('2026-12-01','trimestre')"), 'T2');
  assert.equal(ev("_periodeForDate('2026-01-15','trimestre')"), 'T2', 'janvier est en T2, pas T1');
  assert.equal(ev("_periodeForDate('2026-03-01','trimestre')"), 'T3');
  assert.equal(ev("_periodeForDate('','trimestre')"), null);
});

test('clock : valeurs string (JSON forgé/corrompu) normalisées, pas de concaténation', () => {
  const me = ev('_DEVICE_ID');
  const k = JSON.stringify(me);
  setState({ classes: {}, eleves: {}, salles: {}, clock: { [me]: '5', autreposte: 'x' } });
  ev('_clockBumpSelf()');
  assert.equal(get(`S.clock[${k}]`), 6, '"5"+1 doit donner 6, pas "51"');
  ev('_clockOnLoad()');
  assert.equal(get('S.clock.autreposte'), 0, 'valeur non numérique → 0 au chargement');
});

// ─────────────────────────────────────────────────────────────────────────────
// Dédup des backups + robustesse conflit (étape 3a).
// ─────────────────────────────────────────────────────────────────────────────
test('contentFingerprint : ignore savedAt/clock, distingue le contenu', () => {
  assert.equal(
    ev('_contentFingerprint({classes:{c1:{}},savedAt:1,clock:{A:1}})'),
    ev('_contentFingerprint({classes:{c1:{}},savedAt:999,clock:{A:5}})'),
    'même contenu, métadonnées différentes → même empreinte');
  assert.notEqual(
    ev('_contentFingerprint({classes:{c1:{}}})'),
    ev('_contentFingerprint({classes:{c2:{}}})'),
    'contenu différent → empreinte différente');
});

test('versionRelation : contenu identique → equal même si horloges divergentes', () => {
  setState({ classes: {}, eleves: {}, salles: {}, clock: { A: 3, B: 2 } });
  // Horloges divergentes ({A:2,B:3} vs {A:3,B:2}) MAIS contenu identique → equal :
  assert.equal(ev('_versionRelation({classes:{},eleves:{},salles:{},clock:{A:2,B:3}})'), 'equal');
  // Même horloge divergente mais contenu RÉELLEMENT différent → diverged :
  assert.equal(ev('_versionRelation({classes:{c1:{}},eleves:{},salles:{},clock:{A:2,B:3}})'), 'diverged');
});

// ─────────────────────────────────────────────────────────────────────────────
// Historique / checkpoints nommés (étape 3b).
// ─────────────────────────────────────────────────────────────────────────────
test('fileKind : catégorise auto / backup / checkpoint (label) / conflit / export', () => {
  assert.equal(get("_fileKind('plan-classe-auto.json').label"), 'Sync auto');
  assert.equal(get("_fileKind('plan-classe-bk-2026-06-17-14h30m.json').label"), 'Backup');
  assert.equal(get("_fileKind('plan-classe-checkpoint-avant_conseil_T2-2026-06-17-14h30m15s.json').label"), 'Point « avant conseil T2 »');
  assert.equal(get("_fileKind('plan-classe-conflit-autre-2026-06-17-14h30m15s.json').label"), 'Archive conflit');
  assert.equal(get("_fileKind('mon-export.json').label"), 'Export');
});

test('fmtBytes : o / Ko / Mo', () => {
  assert.equal(ev("_fmtBytes(500)"), '500 o');
  assert.equal(ev("_fmtBytes(2048)"), '2 Ko');
  assert.equal(ev("_fmtBytes(1572864)"), '1,5 Mo');
});

test('checkpointSafeLabel : nettoie les caractères de chemin + espaces, borne, défaut', () => {
  assert.equal(ev(`_checkpointSafeLabel('avant conseil/T2')`), 'avant_conseilT2');
  assert.equal(ev(`_checkpointSafeLabel('')`), 'point');
  assert.equal(ev(`_checkpointSafeLabel('a'.repeat(60)).length`), 40);
});

// ─────────────────────────────────────────────────────────────────────────────
// Résumé de version + copies de conflit Nextcloud (étape 3 — fin).
// ─────────────────────────────────────────────────────────────────────────────
test('versionSummary : compte classes/élèves/évals/salles/appels', () => {
  const s = get(`_versionSummary({classes:{a:{},b:{}},eleves:{s1:{}},evaluations:{},salles:{r:{}},attendance:{c1:{r1:{},r2:{}},c2:{r3:{}}},savedAt:123})`);
  assert.equal(s.classes, 2);
  assert.equal(s.eleves, 1);
  assert.equal(s.evaluations, 0);
  assert.equal(s.salles, 1);
  assert.equal(s.attendance, 3);  // somme des records sur toutes les classes
  assert.equal(s.savedAt, 123);
});

test('fileKind : distingue NOS archives conflit des copies Nextcloud', () => {
  assert.equal(get(`_fileKind('plan-classe-conflit-autre-2026-06-17-14h30m15s.json').label`), 'Archive conflit');
  assert.equal(get(`_fileKind('plan-classe-auto (conflicted copy 2026-06-17).json').label`), 'Conflit Nextcloud');
  assert.equal(get(`_fileKind('plan-classe-auto (copie en conflit 2026-06-17).json').label`), 'Conflit Nextcloud');
});

// ─────────────────────────────────────────────────────────────────────────────
// Niveaux configurables (nbLevels 2..6) — _noteToLevel généralisé.
// ─────────────────────────────────────────────────────────────────────────────
test('_noteToLevel : comportement inchangé pour nb=4 (défauts)', () => {
  setState({ evalPrefs: { nbLevels: 4, maitrisePoints: [5, 8, 15, 20], thresholdMode: 'midpoint' } });
  // Seuils midpoint : 6,5 / 11,5 / 17,5 (sur 20)
  assert.equal(ev('_noteToLevel(5, 20)'), 1);
  assert.equal(ev('_noteToLevel(7, 20)'), 2);
  assert.equal(ev('_noteToLevel(12, 20)'), 3);
  assert.equal(ev('_noteToLevel(18, 20)'), 4);
  setState({ evalPrefs: { nbLevels: 4, thresholdMode: 'percent', thresholdPercents: [40, 60, 85] } });
  assert.equal(ev('_noteToLevel(7, 20)'), 1);   // 35 %
  assert.equal(ev('_noteToLevel(10, 20)'), 2);  // 50 %
  assert.equal(ev('_noteToLevel(14, 20)'), 3);  // 70 %
  assert.equal(ev('_noteToLevel(18, 20)'), 4);  // 90 %
});

test('_noteToLevel : nb=2, nb=3 et nb=6 (percent et midpoint)', () => {
  // nb=2, percent : 1 seul seuil
  setState({ evalPrefs: { nbLevels: 2, thresholdMode: 'percent', thresholdPercents: [50] } });
  assert.equal(ev('_noteToLevel(9, 20)'), 1);
  assert.equal(ev('_noteToLevel(11, 20)'), 2);
  // nb=3, midpoint : pts [5, 12, 20] → seuils 8,5 / 16
  setState({ evalPrefs: { nbLevels: 3, thresholdMode: 'midpoint', maitrisePoints: [5, 12, 20] } });
  assert.equal(ev('_noteToLevel(8, 20)'), 1);
  assert.equal(ev('_noteToLevel(10, 20)'), 2);
  assert.equal(ev('_noteToLevel(17, 20)'), 3);
  // nb=6, percent : 5 seuils
  setState({ evalPrefs: { nbLevels: 6, thresholdMode: 'percent', thresholdPercents: [20, 40, 60, 80, 90] } });
  assert.equal(ev('_noteToLevel(2, 20)'), 1);   // 10 %
  assert.equal(ev('_noteToLevel(10, 20)'), 3);  // 50 %
  assert.equal(ev('_noteToLevel(17, 20)'), 5);  // 85 %
  assert.equal(ev('_noteToLevel(19, 20)'), 6);  // 95 %
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteTag : purge complète (élèves + posTagId des places).
// ─────────────────────────────────────────────────────────────────────────────
test('deleteTag : purge stu.tags ET room.posTagId', () => {
  setState({
    tags: { t1: { id: 't1', abbr: 'DF' }, t2: { id: 't2', abbr: 'DNL' } },
    eleves: { s1: { id: 's1', tags: ['t1', 't2'] } },
    classes: {
      c1: {
        id: 'c1', eleves: ['s1'],
        rooms: { r1: { seating: {}, groupes: {}, posTagId: { '0,0': 't1', '0,1': 't2' } } },
      },
    },
  });
  ev("deleteTag('t1')");
  assert.equal(get('S.tags.t1'), null);
  assert.deepEqual(get('S.eleves.s1.tags'), ['t2']);
  assert.deepEqual(get("S.classes.c1.rooms.r1.posTagId"), { '0,1': 't2' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Type D — sommative par compétences. Cas CANONIQUE arrêté avec l'utilisateur
// (2026-07-30) : Ex1(Q1: RAI×1=N3 ; Q2: RAI×2=N4 + COM×1=N2), Ex2(Q3: COM×1=N3),
// barème 1→0/2→1/3→2/4→3 → Ex1 9/12, Ex2 2/3, note 14,67/20, RAI→4, COM→3.
// Ces chiffres FONT FOI : un écart ici est une régression du moteur, pas du test.
// ─────────────────────────────────────────────────────────────────────────────
function seedTypeD() {
  setState({
    // Palette et seuils complets (tailles = nbLevels) : sans eux, migrateEvalDefaults
    // régénérerait les couleurs via _defaultColorsForNb, qui lit le thème du DOM —
    // absent du harnais vm. Artefact de test, pas un besoin du moteur D.
    evalPrefs: { nbLevels: 4, typeDPoints: [0, 1, 2, 3],
                 maitriseColors: ['#dc2626', '#f59e0b', '#16a34a', '#2563eb'],
                 maitrisePoints: [5, 8, 15, 20], thresholdPercents: [40, 60, 85],
                 maitriseColorsAuto: false, noteThresholdsAuto: false,
                 noteThresholds: [{ max: null, color: '#2563eb' }] },
    competences: { cmp_rai: { id: 'cmp_rai', code: 'RAI' }, cmp_com: { id: 'cmp_com', code: 'COM' } },
    eleves: { s1: { id: 's1', nom: 'A', prenom: 'a', classe_id: 'c1' } },
    classes: { c1: { id: 'c1', nom: '6e T', eleves: ['s1'] } },
    evaluations: {
      evd: {
        id: 'evd', type: 'D', nomCourt: 'TD', classIds: ['c1'], classId: 'c1',
        periode: 'S1', coef: 1, noteMax: 20, countsForMean: true,
        pointsParNiveau: [0, 1, 2, 3],
        exercices: [{ id: 'ex1', label: 'Ex1' }, { id: 'ex2', label: 'Ex2' }],
        miniNotes: [
          { id: 'q1', label: 'Q1', exerciceId: 'ex1', competenceIds: ['cmp_rai'], compWeights: {} },
          { id: 'q2', label: 'Q2', exerciceId: 'ex1', competenceIds: ['cmp_rai', 'cmp_com'], compWeights: { cmp_rai: 2 } },
          { id: 'q3', label: 'Q3', exerciceId: 'ex2', competenceIds: ['cmp_com'], compWeights: {} },
        ],
        notes: { s1: { levels: { q1: { cmp_rai: 3 }, q2: { cmp_rai: 4, cmp_com: 2 }, q3: { cmp_com: 3 } } } },
      },
    },
  });
}

test('Type D : cas canonique — note, sous-totaux par exercice, niveaux entiers', () => {
  seedTypeD();
  const info = get("_computeStudentEvalNoteDInfo(S.evaluations.evd, 's1')");
  assert.equal(info.perExo.ex1.brut, 9);
  assert.equal(info.perExo.ex1.max, 12);
  assert.equal(info.perExo.ex2.brut, 2);
  assert.equal(info.perExo.ex2.max, 3);
  // 11/15 × 20 = 14,666… (granulométrie par défaut : aucune)
  assert.ok(Math.abs(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')") - 14.6667) < 0.001);
  // Niveaux ENTIERS : RAI (3×1+4×2)/3 = 3,67 → 4 ; COM (2+3)/2 = 2,5 → 3 (arrondi au demi vers le haut)
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')"), 4);
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_com')"), 3);
  // Par exercice (informatif) : COM restreint à Ex1 = 2, à Ex2 = 3
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_com', 'ex1')"), 2);
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_com', 'ex2')"), 3);
});

test('Type D : A/NN sortent du barème — l\'exercice non noté disparaît', () => {
  seedTypeD();
  ev("S.evaluations.evd.notes.s1.levels.q3.cmp_com = 'NN'");
  const info = get("_computeStudentEvalNoteDInfo(S.evaluations.evd, 's1')");
  assert.equal(info.perExo.ex2, undefined);       // plus dans le barème
  assert.equal(info.brut, 9); assert.equal(info.max, 12);
  assert.ok(Math.abs(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')") - 15) < 0.001);
  // COM ne repose plus que sur Q2 (niveau 2)
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_com')"), 2);
  // Tout en A → aucune note (élève non évalué), mais _studentHasAnyDataInEval le voit
  ev("S.evaluations.evd.notes.s1.levels = { q1: { cmp_rai: 'A' } }");
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), null);
  assert.equal(ev("_studentHasAnyDataInEval(S.evaluations.evd, 's1')"), true);
});

test('Type D : agrégation de période — niveau entier par éval, pondéré par coef', () => {
  seedTypeD();
  // 2e éval D, coef 3, RAI = niveau 1 → période RAI = (4×1 + 1×3) / 4 = 1,75 → 2
  ev(`S.evaluations.evd2 = { id:'evd2', type:'D', nomCourt:'TD2', classIds:['c1'], classId:'c1',
      periode:'S1', coef:3, noteMax:20, countsForMean:true, pointsParNiveau:[0,1,2,3],
      exercices:[{id:'x',label:'X'}],
      miniNotes:[{ id:'qa', label:'QA', exerciceId:'x', competenceIds:['cmp_rai'], compWeights:{} }],
      notes:{ s1:{ levels:{ qa:{ cmp_rai:1 } } } } }`);
  const agg = get("_aggregateStudentCompetence('c1', 's1', 'cmp_rai', 'S1', 'all')");
  assert.equal(agg.levelMean, 2);
  assert.equal(agg.entries.length, 3);   // 2 saisies evd + 1 saisie evd2 (détail infobulle)
});

test('Type D : la garde de migration conserve le type et reconstruit le barème', () => {
  seedTypeD();
  ev('delete S.evaluations.evd.pointsParNiveau; S.evaluations.evd.miniNotes[0].compWeights = null;');
  ev('migrateEvalDefaults()');
  assert.equal(get('S.evaluations.evd.type'), 'D');            // pas converti en A
  assert.deepEqual(get('S.evaluations.evd.pointsParNiveau'), [0, 1, 2, 3]);
  assert.deepEqual(get('S.evaluations.evd.miniNotes[0].compWeights'), {});
  // Le calcul survit à la migration
  assert.ok(Math.abs(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')") - 14.6667) < 0.001);
});

test('Type D : question sans compétence ne compte nulle part', () => {
  seedTypeD();
  ev(`S.evaluations.evd.miniNotes.push({ id:'q4', label:'Q4', exerciceId:'ex2', competenceIds:[], compWeights:{} })`);
  // Aucun changement sur la note ni les niveaux
  assert.ok(Math.abs(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')") - 14.6667) < 0.001);
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_com')"), 3);
});

// ── Ajustement de la note finale (sanction / bonification, tous types) ──
// Remplace le bonus/malus par cellule, qui ne vaut plus que pour le Type A.

test('Ajustement : ×0,5 pour triche divise la note, sans toucher aux niveaux', () => {
  seedTypeD();
  const base = ev("_computeStudentEvalNoteRaw(S.evaluations.evd, 's1')");
  assert.ok(Math.abs(base - 14.6667) < 0.001, 'note calculée inchangée');
  const nivAvant = ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')");
  ev(`S.evaluations.evd.notes.s1.adjust = [{ id:'a1', op:'mul', v:0.5, label:'Triche' }]`);
  assert.ok(Math.abs(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')") - 7.3333) < 0.001);
  // ⚠️ invariant central : la sanction porte sur la note, jamais sur les compétences
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')"), nivAvant);
});

test('Ajustement : ordre fixe set → mul → add → cap, puis bornage', () => {
  seedTypeD();
  // set 10, puis ×2 = 20, puis −3 = 17, plafonné à 12
  ev(`S.evaluations.evd.notes.s1.adjust = [
    { id:'a1', op:'add', v:-3, label:'Retard' },
    { id:'a2', op:'cap', v:12, label:'Plafond' },
    { id:'a3', op:'set', v:10, label:'Base négociée' },
    { id:'a4', op:'mul', v:2,  label:'Double' }]`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), 12);
  // L'ordre ne dépend pas de la saisie : liste inversée, même résultat
  ev(`S.evaluations.evd.notes.s1.adjust.reverse()`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), 12);
});

test('Ajustement : la note reste bornée à [0, noteMax]', () => {
  seedTypeD();
  ev(`S.evaluations.evd.notes.s1.adjust = [{ id:'a1', op:'add', v:-99, label:'Malus' }]`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), 0);
  ev(`S.evaluations.evd.notes.s1.adjust = [{ id:'a1', op:'add', v:99, label:'Bonus' }]`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), 20);
});

test('Ajustement : sans note calculée (tout A/NN), rien à ajuster', () => {
  seedTypeD();
  ev(`S.evaluations.evd.notes.s1.levels = { q1:{cmp_rai:'NN'}, q2:{cmp_rai:'NN',cmp_com:'NN'}, q3:{cmp_com:'NN'} }`);
  ev(`S.evaluations.evd.notes.s1.adjust = [{ id:'a1', op:'mul', v:0.5, label:'Triche' }]`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), null);
});

test('Ajustement : la migration écarte les entrées invalides', () => {
  seedTypeD();
  ev(`S.evaluations.evd.notes.s1.adjust = [
    { id:'ok', op:'mul', v:0.5, label:'Triche' },
    { op:'inconnu', v:2, label:'X' },
    { op:'add', v:'abc', label:'Y' }]`);
  ev(`migrateEvalDefaults()`);
  assert.equal(ev("S.evaluations.evd.notes.s1.adjust.length"), 1);
  assert.equal(ev("S.evaluations.evd.notes.s1.adjust[0].op"), 'mul');
  // Liste vide ou non-tableau : le champ disparaît
  ev(`S.evaluations.evd.notes.s1.adjust = 'nawak'`);
  ev(`migrateEvalDefaults()`);
  assert.equal(ev("S.evaluations.evd.notes.s1.adjust"), undefined);
});

test('Bonus/malus par commentaire : ne vaut plus que pour le Type A', () => {
  seedTypeD();
  // Une éval Type C dont un commentaire porte « -1 pt » : la note ne doit PAS bouger
  ev(`S.evaluations.evc = { id:'evc', type:'C', nomCourt:'C1', periode:'S1', classIds:['c1'],
      noteMax:20, coef:1, countsForMean:true, exercices:[{id:'x1',label:'Ex1'}],
      miniNotes:[{id:'m1',label:'Q1',exerciceId:'x1',max:10,competenceIds:[]}],
      notes:{ s1:{ values:{m1:10}, comments:{ m1:['présentation, -1 pt'] } } } }`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evc, 's1')"), 20);
  // La même chose en Type A garde le comportement historique
  ev(`S.evaluations.evc.type = 'A'; delete S.evaluations.evc.exercices;`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evc, 's1')"), 18);
});

test('Copie annulée : les compétences tombent au minimum, pas la note seule', () => {
  seedTypeD();
  const nivAvant = ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')");
  assert.ok(nivAvant > 1, 'le cas canonique part d\'un niveau > 1');
  ev(`S.evaluations.evd.notes.s1.adjust = [{ id:'a1', op:'set', v:0, label:'Triche', voidComps:true }]`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), 0);
  // ⚠️ minimum = 1, PAS null : la compétence reste visible au bilan, sanctionnée
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')"), 1);
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_com')"), 1);
  assert.equal(ev("_evalCompetenceLevel(S.evaluations.evd, 's1', 'cmp_rai')"), 1);
  assert.equal(ev("_evalStudentLevelForComp(S.evaluations.evd, 's1', 'cmp_rai')"), 1);
});

test('Copie annulée : sans le drapeau, les niveaux ne bougent pas', () => {
  seedTypeD();
  const nivAvant = ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')");
  // Un malus de retard qui met la note à 0 ne doit PAS effacer les acquis
  ev(`S.evaluations.evd.notes.s1.adjust = [{ id:'a1', op:'add', v:-99, label:'Retard' }]`);
  assert.equal(ev("_computeStudentEvalNote(S.evaluations.evd, 's1')"), 0);
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')"), nivAvant);
});

test('Copie annulée : une compétence non évaluée reste absente', () => {
  seedTypeD();
  ev(`S.evaluations.evd.notes.s1.adjust = [{ id:'a1', op:'set', v:0, label:'Triche', voidComps:true }]`);
  // cmp_zzz n'est évaluée par aucune question : rien à sanctionner
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_zzz')"), null);
});

test('Copie annulée : le drapeau survit à la migration', () => {
  seedTypeD();
  ev(`S.evaluations.evd.notes.s1.adjust = [{ op:'set', v:0, label:'Triche', voidComps:true }]`);
  ev(`migrateEvalDefaults()`);
  assert.equal(ev("S.evaluations.evd.notes.s1.adjust[0].voidComps"), true);
  assert.equal(ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')"), 1);
});

// ─── Audit Type D (2026-08-02) : surfaces annexes branchées sur le D ────────────

test('Type D : _studentNoteAbsenceReason distingue A / NN / none', () => {
  seedTypeD();
  // Tout-A → 'A' (avant le correctif : branche A/C lisait `values` → 'none' → « — »)
  ev(`S.evaluations.evd.notes.s1 = { levels: { q1:{cmp_rai:'A'}, q2:{cmp_rai:'A',cmp_com:'A'}, q3:{cmp_com:'A'} } }`);
  assert.equal(ev("_studentNoteAbsenceReason(S.evaluations.evd, 's1')"), 'A');
  assert.equal(ev("_studentNoteDisplay(S.evaluations.evd, 's1').kind"), 'A');
  // Tout-NN → 'NN'
  ev(`S.evaluations.evd.notes.s1 = { levels: { q1:{cmp_rai:'NN'}, q2:{cmp_rai:'NN',cmp_com:'NN'}, q3:{cmp_com:'NN'} } }`);
  assert.equal(ev("_studentNoteAbsenceReason(S.evaluations.evd, 's1')"), 'NN');
  // Une saisie numérique → null (note calculable)
  ev(`S.evaluations.evd.notes.s1 = { levels: { q1:{cmp_rai:3} } }`);
  assert.equal(ev("_studentNoteAbsenceReason(S.evaluations.evd, 's1')"), null);
  // Aucune saisie → 'none'
  ev(`S.evaluations.evd.notes.s1 = { levels: {} }`);
  assert.equal(ev("_studentNoteAbsenceReason(S.evaluations.evd, 's1')"), 'none');
});

test('Type D : export ENT — compétences listées et niveaux délégués', () => {
  seedTypeD();
  // _evalCompetencesEvaluated (jumeau export) doit voir les compétences du D…
  const codes = ev("_evalCompetencesEvaluated(S.evaluations.evd).map(c => c.code).sort().join(',')");
  assert.equal(codes, 'COM,RAI');
  // …et rester ALIGNÉ sur _evalListEvaluatedCompetences (les deux avaient divergé)
  const codes2 = ev("_evalListEvaluatedCompetences(S.evaluations.evd, 'code').map(c => c.code).sort().join(',')");
  assert.equal(codes, codes2);
  // Niveau par élève : délégué à _typeDCompLevel (avant : lecture de `values` → null)
  assert.equal(ev("_evalStudentCompetenceLevel(S.evaluations.evd, 's1', 'cmp_rai')"),
               ev("_typeDCompLevel(S.evaluations.evd, 's1', 'cmp_rai')"));
});

test('Type D : barème décroissant borné par le max réel de la table', () => {
  seedTypeD();
  // Barème pathologique [0,3,2,1] : niveau 2 rapporte 3 pts. Avant le correctif,
  // ptsMax = dernière case (1) → note 60/20. Désormais max réel (3) → note ≤ noteMax.
  ev(`S.evaluations.evd.pointsParNiveau = [0, 3, 2, 1]`);
  ev(`S.evaluations.evd.notes.s1 = { levels: { q1: { cmp_rai: 2 } } }`);
  const note = ev("_computeStudentEvalNote(S.evaluations.evd, 's1')");
  assert.ok(note <= 20, `note ${note} doit rester ≤ noteMax`);
  assert.equal(note, 20); // 3 pts / max 3 → 20
});

test('Type D : l\'auto-remplissage des absents passe par le wrapper per-classe', () => {
  seedTypeD();
  ev(`S.attendance = { c1: { r1: { id:'r1', date:'2026-05-01', slotId:'M1', groupe:0,
      absents:['s1'], retards:{}, eleves:{} } } }`);
  ev(`S.evaluations.evd.dates = { c1: '2026-05-01' }; S.evaluations.evd.slotIds = { c1: 'M1' };`);
  ev(`S.evaluations.evd.notes = {}`);
  // Avant : le wrapper ne traitait que A/C et B → 0 rempli pour une éval D.
  const filled = ev("_evalAutoFillAbsentsForEvalClass(S.evaluations.evd, 'c1')");
  assert.equal(filled, 4); // 4 couples (question × compétence)
  assert.equal(ev("S.evaluations.evd.notes.s1.levels.q1.cmp_rai"), 'A');
  assert.equal(ev("S.evaluations.evd.notes.s1.levels.q2.cmp_com"), 'A');
});

test('Type D : un niveau stocké au-delà de nbLevels reste neutre à l\'affichage', () => {
  seedTypeD();
  // Niveau 5 hérité d'un réglage à 6 niveaux réduit à 4 : exclu du calcul, donc
  // la cellule ne doit PAS porter la couleur du niveau max (fausse impression de comptage).
  assert.equal(ev("_typeDCellBg(5, 4)"), '');
  // Sans le paramètre nb (pastilles alimentées par _typeDCompLevel ≤ nb) : comportement inchangé
  assert.notEqual(ev("_typeDCellBg(4, 4)"), '');
  assert.notEqual(ev("_typeDCellBg(4)"), '');
});
