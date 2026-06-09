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
