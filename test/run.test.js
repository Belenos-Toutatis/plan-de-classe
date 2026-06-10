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
