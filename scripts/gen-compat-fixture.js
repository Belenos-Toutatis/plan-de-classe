// Générateur de fixtures de RÉTROCOMPATIBILITÉ.
//   node scripts/gen-compat-fixture.js <commit> <label>
// Extrait « plan de classe.html » au commit donné, le charge dans le harnais, rejoue SON
// createDemo() (le jeu de démo de l'époque, donc le modèle de données de l'époque), puis
// écrit JSON.stringify(S) dans test/fixtures/compat/<label>.json. Ces fichiers sont ce
// qu'un utilisateur de cette version aurait exporté : test/compat.test.js vérifie que la
// version COURANTE les charge sans perte. Ne pas régénérer une fixture existante sans
// raison : elle fige un état historique, c'est sa valeur.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadApp } = require('../test/harness');

const [commit, label] = process.argv.slice(2);
if (!commit || !label) { console.error('usage : node scripts/gen-compat-fixture.js <commit> <label>'); process.exit(2); }
const root = path.join(__dirname, '..');
const html = execFileSync('git', ['show', `${commit}:plan de classe.html`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const tmp = path.join(os.tmpdir(), `plan-de-classe-${commit}.html`);
fs.writeFileSync(tmp, html);
const app = loadApp(tmp);
const json = app.__TESTEVAL(`(() => {
  // init() est neutralisé par le harnais : on rejoue à la main l'amorçage dont createDemo
  // dépend (pools par défaut, prefs…), comme le fait init() dans l'app.
  if (typeof postLoadHook === 'function') postLoadHook();
  createDemo();
  if (typeof postLoadHook === 'function') postLoadHook();
  return JSON.stringify(S, null, 1);
})()`);
const out = path.join(__dirname, '..', 'test', 'fixtures', 'compat', `${label}.json`);
fs.writeFileSync(out, json);
const S = JSON.parse(json);
console.log(`${label} ← ${commit} : ${Object.keys(S.classes||{}).length} classes, ${Object.keys(S.eleves||{}).length} élèves, ${Object.keys(S.evaluations||{}).length} évals, ${Math.round(json.length/1024)} Ko → ${path.relative(root, out)}`);
fs.unlinkSync(tmp);
