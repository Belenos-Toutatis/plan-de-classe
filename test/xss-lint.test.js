// Lint anti-XSS (statique) — garde-fou contre les régressions.
//
// Échoue si une donnée utilisateur à HAUTE confiance (prénom / nom d'élève,
// nomCourt / nomLong / descriptif / remarque d'évaluation, abbr / name de tag,
// prefix de classe mobile) est interpolée EN CLAIR dans un fragment HTML (ligne
// contenant `<tag`) sans passer par un échappeur (`_esc`, `_escAttr`, `_escName`)
// ni par le tagged template `_html`.
//
// Heuristique volontairement PRÉCISE (peu de faux positifs) :
//   - la ligne contient un tag HTML `<lettre` ;
//   - l'interpolation est un accès DIRECT à un champ (`${a.b.prenom}`), pas un
//     appel de fonction (segment sans `(` → exclut `_esc(...)`, `buildPicker(...)`) ;
//   - le segment ne mentionne pas `_esc`.
//
// Limite assumée : ne couvre que les champs à haute confiance d'être de la donnée
// utilisateur. Les libellés génériques `.label` et `.code` (souvent portés par des
// constantes internes : palette de rappels, stratégies de backup, codes de période…)
// ne sont pas lintés ici pour éviter le bruit ; l'échappement y reste assuré par
// revue + le helper `_html` pour le code neuf.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('XSS-lint : aucun champ élève/éval interpolé en clair dans un fragment HTML', () => {
  const file = path.join(__dirname, '..', 'plan de classe.html');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const SEG = /\$\{[^}()]*\.(prenom|nom|nomCourt|nomLong|descriptif|remarque|abbr|prefix|name)\b[^}()]*\}/g;
  // Variante avec appel : `.nom` / `.prenom` suivi de `.toUpperCase()` dans la même
  // interpolation (ex. `${(stu.nom||'').toUpperCase()}`) — le SEG principal exclut
  // les parenthèses et raterait ce motif.
  const SEG_UPPER = /\$\{[^}]*\.(nom|prenom)\b[^}]*\.toUpperCase\(\)[^}]*\}/g;
  const findings = [];
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (/^\s*(\/\/|\*|<!--)/.test(L)) continue; // ligne de commentaire (JS // ou * , ou HTML) → ignorée
    if (!/<[a-zA-Z]/.test(L)) continue;       // doit ressembler à un fragment HTML
    let m;
    for (const RE of [SEG, SEG_UPPER]) {
      RE.lastIndex = 0;
      while ((m = RE.exec(L))) {
        if (/_esc/.test(m[0])) continue;        // déjà échappé
        findings.push(`L${i + 1}: ${m[0].trim()}  →  ${L.trim().slice(0, 120)}`);
      }
    }
  }
  assert.deepEqual(
    findings, [],
    `Interpolation de donnée utilisateur non échappée dans un fragment HTML ` +
    `(utiliser _escName/_escAttr ou le tagged template _html) :\n` + findings.join('\n')
  );
});
