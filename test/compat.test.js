// Rétrocompatibilité : la version COURANTE doit charger sans perte les fichiers exportés
// par les versions PASSÉES (test/fixtures/compat/*.json — cf. gen-compat-fixture.js) et
// un fichier au tout premier modèle (legacy-v1-pre-rooms.json, écrit à la main).
//
// C'est le risque le plus grave de l'app : un fichier d'année qui ne s'ouvre plus en juin.
// Pour chaque fixture on rejoue exactement le chemin d'un import : _validateImport → S =
// data → postLoadHook (toutes les migrations) → applyAccessorsAll, puis on vérifie :
//   - aucune exception, et l'audit d'intégrité ne trouve RIEN à réparer ;
//   - les comptes (classes, élèves, évals, salles, appels) sont conservés ;
//   - chaque élève inscrit existe, chaque sid placé existe et est inscrit dans sa classe ;
//   - les accesseurs proxy fonctionnent (cls.seating), chaque classe a une salle active valide ;
//   - postLoadHook est IDEMPOTENT : le rejouer ne change plus rien (hors horloge) ;
//   - le résultat repasse _validateImport (ce qu'on exporte se ré-importe).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadApp } = require('./harness');

const DIR = path.join(__dirname, 'fixtures', 'compat');
const fixtures = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort();
assert.ok(fixtures.length >= 2, 'au moins une fixture historique + la legacy');

function strip(json) { // enlève l'horloge et l'horodatage, seuls champs qui bougent légitimement
  const o = JSON.parse(json); delete o.clock; delete o.savedAt; return JSON.stringify(o);
}

for (const file of fixtures) {
  test(`rétrocompat : ${file} se charge sans perte dans la version courante`, () => {
    const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
    const before = JSON.parse(raw);
    const app = loadApp();
    const get = c => app.__TESTEVAL(c);
    app.__FIX = raw;
    const r = JSON.parse(get(`JSON.stringify((() => {
      const data = JSON.parse(globalThis.__FIX);
      const invalid = _validateImport(data);
      if (invalid) return { invalid };
      S = data;
      postLoadHook();
      applyAccessorsAll();
      const audit = _auditState({ repair: false });
      const snap1 = JSON.stringify(S);
      postLoadHook(); applyAccessorsAll();
      const snap2 = JSON.stringify(S);
      const problems = [];
      for (const c of Object.values(S.classes)) {
        if (!c.rooms || !c.activeRoom || !c.rooms[c.activeRoom]) problems.push('salle active invalide : ' + c.id);
        if (!S.salles[c.activeRoom]) problems.push('salle absente du catalogue : ' + c.activeRoom);
        let seating; try { seating = c.seating; } catch (e) { problems.push('accesseur seating KO : ' + c.id); }
        for (const sid of (c.eleves || [])) if (!S.eleves[sid]) problems.push('inscrit inconnu ' + sid);
        for (const room of Object.values(c.rooms || {})) for (const sid of Object.values(room.seating || {})) {
          if (!S.eleves[sid]) problems.push('placé inconnu ' + sid + ' dans ' + c.id);
          else if (!(c.eleves || []).includes(sid) && !c.virtual) problems.push('placé non inscrit ' + sid + ' dans ' + c.id);
          if ('ipads' in room || 'ipads_g1' in room) problems.push('champs tablette legacy non migrés : ' + c.id);
        }
        // Les accesseurs proxy (configuration, seating…) sont des get/set : seule une propriété
        // de DONNÉE ('value' dans le descripteur) trahit un champ pré-rooms non migré.
        for (const k of ['configuration', 'seating', 'ipads', 'ipads_g1', 'ipads_g2', 'groupes']) {
          const d = Object.getOwnPropertyDescriptor(c, k);
          if (d && 'value' in d) problems.push('champ pré-rooms non migré : ' + c.id + '.' + k);
        }
      }
      for (const s of Object.values(S.eleves)) {
        if (!S.classes[s.classe_id]) problems.push('élève sans classe : ' + s.id);
        for (const k of ['tags', 'reminders']) if (k in s && !Array.isArray(s[k])) problems.push(k + ' non tableau : ' + s.id);
      }
      for (const ev of Object.values(S.evaluations || {})) {
        if (!['A','B','C','D'].includes(ev.type)) problems.push('type éval inconnu : ' + ev.id);
        if (!ev.disciplineId || !S.disciplines[ev.disciplineId]) problems.push('éval sans discipline valide : ' + ev.id);
      }
      const invalidAfter = _validateImport(JSON.parse(snap2));
      return {
        audit: audit && audit.issues ? audit.issues : audit,
        counts: { classes: Object.keys(S.classes).length, eleves: Object.keys(S.eleves).length, evals: Object.keys(S.evaluations || {}).length,
                  salles: Object.keys(S.salles).length, appels: Object.values(S.attendance || {}).reduce((n, o) => n + Object.keys(o || {}).length, 0),
                  snapshots: Object.keys(S.snapshots || {}).length, tags: Object.keys(S.tags || {}).length },
        idempotent: snap1 === snap2, problems, invalidAfter, hasDisciplines: !!S.disciplines && Object.keys(S.disciplines).length > 0,
        featureFlags: S.featureFlags, cur: S.cur,
      };
    })())`));
    assert.equal(r.invalid, undefined, `fixture refusée par _validateImport : ${r.invalid}`);
    assert.deepEqual(r.problems, [], 'incohérences après migration');
    const issues = Array.isArray(r.audit) ? r.audit : (r.audit && r.audit.issues) || [];
    assert.deepEqual(issues, [], "l'audit d'intégrité ne doit rien trouver après migration");
    assert.equal(r.idempotent, true, 'postLoadHook doit être idempotent');
    assert.equal(r.invalidAfter, null, 'l\'état migré doit repasser _validateImport');
    assert.ok(r.hasDisciplines, 'catalogue de disciplines créé');
    assert.deepEqual(r.featureFlags, { tablettes: true, qcmcam: true, appel: true, evaluation: true });
    // Comptes conservés (les salles peuvent AUGMENTER en legacy : une salle créée par classe)
    assert.equal(r.counts.classes, Object.keys(before.classes || {}).length);
    assert.equal(r.counts.eleves, Object.keys(before.eleves || {}).length);
    assert.equal(r.counts.evals, Object.keys(before.evaluations || {}).length);
    assert.equal(r.counts.appels, Object.values(before.attendance || {}).reduce((n, o) => n + Object.keys(o || {}).length, 0));
    assert.equal(r.counts.snapshots, Object.keys(before.snapshots || {}).length);
    assert.ok(r.counts.salles >= Object.keys(before.salles || {}).length);
    if (before.cur) assert.equal(r.cur, before.cur);
  });
}

test('rétrocompat legacy pré-rooms : fusion des salles homonymes et tablettes migrées par pool', () => {
  const app = loadApp();
  app.__FIX = fs.readFileSync(path.join(DIR, 'legacy-v1-pre-rooms.json'), 'utf8');
  const r = JSON.parse(app.__TESTEVAL(`JSON.stringify((() => {
    S = JSON.parse(globalThis.__FIX); postLoadHook(); applyAccessorsAll();
    const a = S.classes['6A'], b = S.classes['5B'];
    const room = a.rooms[a.activeRoom];
    const pool = Object.keys(room.ipadsByPool)[0];
    return { sameSalle: a.activeRoom === b.activeRoom, salleNom: S.salles[a.activeRoom].nom, vides: S.salles[a.activeRoom].positions_vides,
             seat: a.seating['0,0'], ce: room.ipadsByPool[pool].ce, g1: room.ipadsByPool[pool].g1, groupes: room.groupes,
             pools: Object.keys(S.tabletPools).length, activePool: a.activePool === pool, ppre: S.eleves.e1.ppre, tags: S.eleves.e1.tags };
  })())`));
  assert.equal(r.sameSalle, true, 'deux classes avec la même salle B12 partagent UNE salle du catalogue');
  assert.equal(r.salleNom, 'B12');
  assert.deepEqual(r.vides, ['1,1']);
  assert.equal(r.seat, 'e1');
  assert.deepEqual(r.ce, { '0,0': 1, '0,1': 2 });
  assert.deepEqual(r.g1, { '0,0': 5 });
  assert.deepEqual(r.groupes, { '0,0': 1, '0,1': 2 });
  assert.ok(r.pools >= 2 && r.activePool);
  assert.equal(r.ppre, true);
  assert.deepEqual(r.tags, []);
});
