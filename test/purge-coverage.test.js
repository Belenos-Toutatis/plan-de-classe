// Couverture des purges — test « balayant ».
//
// Les tests de `run.test.js` sont ÉNUMÉRATIFS : ils listent les purges attendues, donc
// ils sont aveugles à tout NOUVEAU champ indexé par sid ou classId. Ici on prend le
// problème dans l'autre sens : on construit un état MAXIMAL, on supprime, puis on
// parcourt l'état sérialisé à la recherche du moindre reste. Toute référence survivante
// doit être justifiée par la liste d'exceptions ci-dessous — sinon le test échoue en
// donnant le chemin exact.
//
// Conséquence : une fonctionnalité future qui ajoute un store indexé par sid/classId
// sans l'ajouter à `_purgeStudentRefs` / `_purgeClassRefs` fera échouer ce test sans
// qu'on ait eu à y penser. C'est l'invariant de CLAUDE.md rendu exécutable.
//
// ⚠️ Quand on ajoute une structure indexée par sid ou classId, il faut soit la purger,
// soit l'ajouter aux exceptions AVEC sa justification. Pas de troisième voie.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

const app = loadApp();
const ev = c => app.__TESTEVAL(c);

// Neutralise les effets de bord UI (fonctions hoistées → réassignables).
ev(`pushUndo=function(){}; save=function(){}; refreshSelector=function(){};
    renderClasses=function(){}; renderStudents=function(){}; renderTeacherGrid=function(){};
    renderTab=function(){}; toast=function(){}; _updateDirtyIndicator=function(){};
    _uiConfirm=function(o){ o && o.onOk && o.onOk(); };`);

function setState(obj) {
  ev('S = ' + JSON.stringify(obj) + '; if (typeof applyAccessorsAll === "function") applyAccessorsAll();');
}
const get = c => JSON.parse(ev('JSON.stringify(' + c + ')') ?? 'null');

// Parcours récursif : renvoie les chemins où `needle` apparaît — comme clé d'objet,
// comme valeur chaîne, ou comme membre d'une paire « a|b » (cf. cls.noNeighbors).
function findRefs(node, needle, path = 'S', out = []) {
  if (node === null || node === undefined) return out;
  if (typeof node === 'string') {
    if (node === needle || node.split('|').includes(needle)) out.push(path);
    return out;
  }
  if (typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((v, i) => findRefs(v, needle, path + '[' + i + ']', out));
    return out;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === needle) out.push(path + '.' + k + ' «clé»');
    findRefs(v, needle, path + '.' + k, out);
  }
  return out;
}

const SID = 'sid_VICTIME';
const CLS = 'cls_VICTIME';

// État couvrant toutes les structures indexées par sid / classId connues à ce jour.
function stateMaximal() {
  setState({
    cur: CLS,
    savedAt: '2026-07-30T00:00:00Z',
    classes: {
      [CLS]: {
        id: CLS, nom: '6A', 'année': 2025, eleves: [SID, 'sTemoin'],
        activeRoom: 'r1', activePool: 'p1',
        rooms: { r1: {
          seating: { '0,0': SID, '0,1': 'sTemoin' },
          groupes: { '0,0': 1 }, posTagId: { '0,1': 't1' },
          allowedFor: { [SID]: ['0,0'], sTemoin: ['0,1'] },
          aeshCount: 1, aeshSeating: { 0: '1,1' },
          aeshLinks: { 0: [SID, 'sTemoin'] },
          // formats legacy ET courant (tous keyés par 'r,c', donc liés au siège)
          ipads: { '0,0': 1 }, ipads_g1: { '0,0': 2 }, ipads_g2: { '0,0': 3 }, ipads_g3: { '0,0': 4 },
          ipadsByPool: { p1: { ce: { '0,0': 5, '0,1': 6 }, g1: { '0,0': 7 }, g2: {}, g3: {} } },
        } },
        noNeighbors: [SID + '|sTemoin', 'sTemoin|' + SID],
        membership: { [SID]: { fromPer: 'S1', toPer: null } },
        disciplineIds: ['disc1'],
      },
      cAutre: {
        id: 'cAutre', nom: '5A', 'année': 2025, eleves: ['sAilleurs'],
        activeRoom: 'r1', activePool: 'p1',
        rooms: { r1: { seating: {}, groupes: {}, posTagId: {}, allowedFor: {},
                       aeshCount: 0, aeshSeating: {}, aeshLinks: {}, ipadsByPool: {} } },
        noNeighbors: [], disciplineIds: ['disc1'],
      },
    },
    eleves: {
      [SID]: { id: SID, nom: 'Victime', prenom: 'Va', classe_id: CLS, tags: ['t1'],
               reminders: [{ id: 'rm1', label: 'faire signer' }],
               history: [{ ts: 1, type: 'oubli' }], previousClasses: [] },
      sTemoin:   { id: 'sTemoin', nom: 'Temoin', prenom: 'Te', classe_id: CLS, tags: [] },
      sAilleurs: { id: 'sAilleurs', nom: 'Ailleurs', prenom: 'Ai', classe_id: 'cAutre', tags: [] },
    },
    evaluations: {
      e1: {
        id: 'e1', type: 'A', classId: CLS, classIds: [CLS, 'cAutre'], periode: 'S1',
        disciplineId: 'disc1', noteMax: 20, coef: 1,
        // maps per-classe de niveau ÉVAL
        dates: { [CLS]: '2026-01-10', cAutre: '2026-01-11' },
        slotIds: { [CLS]: 'M1', cAutre: 'M2' },
        datesManual: { [CLS]: true },
        seatingHashes: { [CLS]: 'h1' },
        // maps per-classe de niveau MINI-NOTE
        miniNotes: [{ id: 'mn1', label: 'Q1', max: 5,
                      dates: { [CLS]: '2026-01-10' }, slotIds: { [CLS]: 'M1' },
                      datesByGroup: { [CLS]: { 1: '2026-01-10' } },
                      slotIdsByGroup: { [CLS]: { 1: 'M1' } } }],
        notes: { [SID]: { values: { mn1: 4 } }, sTemoin: { values: { mn1: 3 } } },
        studentRemarks: { [SID]: 'remarque victime' },
        // maps per-classe de niveau PASSATION
        passations: [{ id: 'ps1', code: 'P1',
                       dates: { [CLS]: '2026-01-12' }, slotIds: { [CLS]: 'S1' },
                       datesByGroup: { [CLS]: { 1: '2026-01-12' } },
                       slotIdsByGroup: { [CLS]: { 1: 'S1' } },
                       niveaux: { [SID]: { comp1: 3 }, sTemoin: { comp1: 2 } } }],
      },
    },
    conseilClasse:          { [CLS]: { disc1: { [SID]: { S1: { cm_fel: true } }, sTemoin: {} } } },
    bulletinRemarques:      { [CLS]: { disc1: { [SID]: { S1: 'rem eleve' }, sTemoin: {} } } },
    bulletinClassRemarques: { [CLS]: { disc1: { S1: 'rem classe' } } },
    bulletinWorkedItems:    { [CLS]: { disc1: { S1: ['item'] } } },
    movedHighlights:        { [CLS]: { r1: { keys: ['0,0'], hidden: false } } },
    // Archives datées — conservées par choix (cf. exceptions ci-dessous)
    attendance: { [CLS]: { rec1: {
      id: 'rec1', ts: 1, date: '2026-01-09', slotId: 'M1', groupe: 0, label: 'M1',
      absents: [SID], retards: { sTemoin: '08:15' },
      eleves: { [SID]: { nom: 'Victime', prenom: 'Va' } },
      seatingHash: 'h1',
    } } },
    snapshots: { snap1: { id: 'snap1', type: 'positions', nom: 'avant', ts: 1,
                          classId: CLS, salleId: 'r1',
                          data: { seating: { '0,0': SID },
                                  eleves: { [SID]: { nom: 'Victime', prenom: 'Va' } } } } },
    seatingSnapshots: { h1: { '0,0': SID, '0,1': 'sTemoin' } },
    salles: { r1: { nom: 'Salle', rows: 5, cols: 6, positions_vides: [] } },
    tabletPools: { p1: { id: 'p1', nom: 'CM1', count: 10, lots: [], unavailable: [] } },
    tags: { t1: { id: 't1', abbr: 'DF', name: 'Devoirs Faits', color: '#123456' } },
    disciplines: { disc1: { id: 'disc1', nom: 'SVT', isPrimary: true } },
    competences: {}, competenceDomains: {}, evalCommentLibrary: {},
    conseilMentions: { cm_fel: { id: 'cm_fel', abbr: 'F', nom: 'Felicitations', color: '#2563eb', ord: 0 } },
    conseilIncompat: [],
  });
}

function report(orphelins, remede) {
  return 'Références non purgées :\n  - ' + orphelins.join('\n  - ') + '\n→ ' + remede;
}

// ─────────────────────────────────────────────────────────────────────────────
// Méta-test : prouve que le balayage DÉTECTE réellement un oubli.
// Sans lui, une régression de `findRefs` (ou une liste d'exceptions trop large)
// rendrait les tests ci-dessous silencieusement vacuants — ils passeraient sans
// rien vérifier, ce qui est pire que pas de test du tout.
// ─────────────────────────────────────────────────────────────────────────────
test('le balayage détecte un store keyé par sid qu\'aucune purge ne connaît', () => {
  // Simule une fonctionnalité future : un « carnet de liaison » indexé par élève,
  // ajouté à S mais oublié dans _purgeStudentRefs.
  setState({
    classes: {}, eleves: { [SID]: { id: SID, nom: 'V', prenom: 'V' } },
    carnetDeLiaison: { [SID]: [{ date: '2026-01-01', mot: 'à faire signer' }] },
  });
  ev('_deleteStudentInternal(' + JSON.stringify(SID) + ')');
  const orphelins = findRefs(get('S'), SID)
    .filter(p => !SID_EXCEPTIONS.some(e => e.re.test(p)));
  assert.deepEqual(orphelins, [`S.carnetDeLiaison.${SID} «clé»`],
    'Le balayage ne repère plus un store non purgé → les tests de couverture sont devenus vacuants.');
});

// ─────────────────────────────────────────────────────────────────────────────
// Élève
// ─────────────────────────────────────────────────────────────────────────────

// Références qui SURVIVENT volontairement : les archives datées sont de la mémoire
// historique — un appel enregistré garde qui était absent ce jour-là, même si l'élève
// a été supprimé depuis. Idem pour les snapshots, consultables en lecture seule.
const SID_EXCEPTIONS = [
  { re: /^S\.attendance\./,       why: 'appels enregistrés — mémoire historique' },
  { re: /^S\.snapshots\./,        why: 'snapshots archivés — consultation lecture seule' },
  { re: /^S\.seatingSnapshots\./, why: 'placements figés, référencés par un appel ou une éval' },
];

test('_deleteStudentInternal : aucune référence résiduelle au sid (balayage de S)', () => {
  stateMaximal();
  ev('_deleteStudentInternal(' + JSON.stringify(SID) + ')');
  const dump = get('S');
  const orphelins = findRefs(dump, SID)
    .filter(p => !SID_EXCEPTIONS.some(e => e.re.test(p)));
  assert.deepEqual(orphelins, [], report(orphelins,
    'ajoute le nettoyage dans _purgeStudentRefs, ou déclare l\'exception dans SID_EXCEPTIONS avec sa justification.'));

  // Le témoin de la même classe et l'élève d'une autre classe sont intacts.
  assert.equal(dump.eleves.sTemoin.id, 'sTemoin');
  assert.equal(dump.eleves.sAilleurs.id, 'sAilleurs');
  assert.deepEqual(dump.classes[CLS].rooms.r1.seating, { '0,1': 'sTemoin' });
  assert.deepEqual(dump.evaluations.e1.notes.sTemoin, { values: { mn1: 3 } });
  // La tablette du siège libéré part avec lui, celle du témoin reste.
  assert.deepEqual(dump.classes[CLS].rooms.r1.ipadsByPool.p1.ce, { '0,1': 6 });
  // L'exception est réelle, pas un oubli : les archives ont bien gardé la trace.
  assert.ok(findRefs(dump.attendance, SID).length > 0, 'les appels doivent garder la trace');
});

// ─────────────────────────────────────────────────────────────────────────────
// Classe
// ─────────────────────────────────────────────────────────────────────────────

const CLS_EXCEPTIONS = [
  { re: /previousClasses/, why: 'journal de transfert d\'élève — traçabilité pure' },
];

test('deleteClass : aucune référence résiduelle au classId (balayage de S)', () => {
  stateMaximal();
  ev('deleteClass(' + JSON.stringify(CLS) + ')'); // _uiConfirm stubé → onOk immédiat
  const dump = get('S');
  const orphelins = findRefs(dump, CLS)
    .filter(p => !CLS_EXCEPTIONS.some(e => e.re.test(p)));
  assert.deepEqual(orphelins, [], report(orphelins,
    'ajoute le nettoyage dans _purgeClassRefs — ou, s\'il s\'agit d\'une map d\'éval keyée par classe, dans _forEachEvalPerClassMap (purge ET renommage en héritent).'));

  // Les élèves de la classe supprimée partent avec elle ; ceux d'ailleurs restent.
  assert.equal(dump.eleves[SID], undefined);
  assert.equal(dump.eleves.sTemoin, undefined);
  assert.equal(dump.eleves.sAilleurs.id, 'sAilleurs');
  // L'éval survit (elle couvre encore cAutre) mais ne mentionne plus la classe morte.
  assert.deepEqual(dump.evaluations.e1.classIds, ['cAutre']);
  assert.equal(dump.evaluations.e1.classId, 'cAutre');
  assert.equal('cAutre' in dump.evaluations.e1.dates, true);
});

test('deleteClass : éval mono-classe supprimée avec sa dernière classe', () => {
  stateMaximal();
  ev('S.evaluations.e1.classIds = [' + JSON.stringify(CLS) + ']');
  ev('deleteClass(' + JSON.stringify(CLS) + ')');
  assert.equal(ev('"e1" in S.evaluations'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Même logique appliquée à la validation d'import : la liste des sections
// contrôlées par `_validateImport` avait dérivé de S (5 sections ajoutées depuis
// n'étaient plus vérifiées). Ce test la garde alignée automatiquement.
// ─────────────────────────────────────────────────────────────────────────────
test('_validateImport : toute section objet de S est sous contrôle du format des clés', () => {
  // `postLoadHook` crée toutes les sections par défaut. Il lève en fin de course sur
  // un accès DOM absent du harnais — sans conséquence, les sections sont déjà peuplées ;
  // l'assertion de comptage ci-dessous détecte le cas où il lèverait plus tôt.
  ev('S = { classes:{}, eleves:{}, salles:{}, cur:null };');
  ev('try { postLoadHook(); } catch (_) {}');
  const sections = get('Object.keys(S).filter(function(k){ return S[k] && typeof S[k] === "object"; })');
  assert.ok(sections.length >= 20,
    `postLoadHook n'a peuplé que ${sections.length} sections — il lève probablement trop tôt, le test ne prouverait rien.`);

  // Une clé au format interdit (caractères hors [A-Za-z0-9_-:.]) doit être rejetée
  // dans CHAQUE section — sinon la section échappe au contrôle.
  ev(`globalThis.__probeSection = function (sec) {
        var d = { classes: {}, eleves: {} };
        d[sec] = JSON.parse('{"cle<script>":1}');
        return !!_validateImport(d);
      };`);
  const nonControlees = sections.filter(sec => !ev('__probeSection(' + JSON.stringify(sec) + ')'));
  assert.deepEqual(nonControlees, [],
    'Sections de S absentes de la liste blanche de _validateImport :\n  - ' + nonControlees.join('\n  - ') +
    '\n→ ajoute-les au tableau `sections` de _validateImport, après avoir vérifié que leurs clés' +
    ' légitimes respectent ID_RE (sinon des imports valides seraient rejetés).');
});

test('deleteClass (recomposée) : purge la classe SANS supprimer les élèves réels', () => {
  stateMaximal();
  // Modèle réel d'une classe recomposée : ses membres restent rattachés à leur classe
  // RÉELLE (`stu.classe_id`), la recomposée ne fait que les lister dans son roster.
  ev('S.classes[' + JSON.stringify(CLS) + '].virtual = true');
  ev('S.eleves[' + JSON.stringify(SID) + '].classe_id = "cAutre"; S.eleves.sTemoin.classe_id = "cAutre";');
  ev('S.classes.cAutre.eleves = [' + JSON.stringify(SID) + ', "sTemoin", "sAilleurs"];');
  ev('deleteClass(' + JSON.stringify(CLS) + ')');
  const dump = get('S');
  const orphelins = findRefs(dump, CLS)
    .filter(p => !CLS_EXCEPTIONS.some(e => e.re.test(p)));
  assert.deepEqual(orphelins, [], report(orphelins,
    'la branche « recomposée » de deleteClass doit appeler _purgeClassRefs comme la branche réelle.'));
  // Les élèves appartiennent à leur classe réelle : ils survivent.
  assert.equal(dump.eleves[SID].id, SID);
  assert.equal(dump.eleves.sTemoin.id, 'sTemoin');
});
