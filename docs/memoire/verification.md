# Vérification : audits et tests

> Mémoire détaillée du projet, rangée depuis CLAUDE.md le 2026-10-29 (texte inchangé). Contenu : méthode de vérification du contraste et ses pièges, passes d’audit, méthode d’audit des impressions, scores de référence, détail des suites de tests.

## Contraste : méthode de vérification et passes d’audit (extrait de « Design system » dans CLAUDE.md)

**Méthode de vérification** (à rejouer après toute retouche de couleur — automatisée par `outils/audit-ui.js`, cf. *Fichiers*) : injecter dans la page un auditeur qui parcourt le DOM, calcule le fond effectif (en remontant les parents transparents) et l'opacité cumulée, puis le contraste WCAG de chaque nœud portant du texte propre. Écarter les résultats à `opacity < 0.95` (estompage volontaire : cellules `.ghost`, bouton 💡 au repos, places QCM exclues). Seuil 4,5:1, ramené à 3,0 pour le grand texte (≥ 24 px, ou ≥ 18,66 px en gras).

Quatre conditions sans lesquelles la mesure ne vaut rien, toutes apprises à leurs dépens :
1. ⚠️ **Des DONNÉES PARTOUT.** L'auditeur ne voit que ce qui est rendu ; un onglet vide passe pour un onglet propre. C'est ainsi que les pastilles du Bilan des compétences (2,15:1) ont traversé la passe du 2026-07-30. Monter l'état de démo, puis y ajouter ce qu'il ne contient pas : appels dans **toutes** les classes, AESH placées et liées, zones de groupe et de tag sur les places, contraintes de placement et paires, surlignages roses, tablette indisponible affectée + doublon + orphelin, et une salle assez grande pour faire déborder la numérotation QCMCam (12 × 16 suffit).
2. ⚠️ **Les SOUS-ÉTATS comptent autant que les onglets.** Balayer 25 écrans, pas 11 : les 3 modes de couleur du plan, le filtre de groupe, les 5 modes de Config Salle, les 2 modes du Bilan des compétences, les 2 périodes du Bilan des notes, une classe riche ET une classe vide.
3. ⚠️ **Les MODALES aussi** — 95 statiques (forcer la classe `on`), les ~16 à contenu dynamique par leur vrai ouvreur, et les 4 tableurs d'évaluation. La moitié des défauts trouvés le 2026-09-07 y étaient, dont le bouton principal `.btn-p` de toute l'application (blanc sur `#3498db`, 3,15:1).
5. ⚠️ **UN CHARGEMENT PAR THÈME, jamais une bascule dans la page.** Poser `data-theme` puis
   mesurer — même dans un appel séparé, même après `void document.body.offsetHeight` — renvoie
   pour certaines déclarations la valeur de l'ANCIEN thème : audit du 2026-10-06, la barre
   d'onglets rapportée à **1,69:1** en clair (couleur sombre sur fond clair) puis **1,28:1** en
   sombre (couleur claire sur fond sombre), soit ~24 faux positifs — alors qu'au rechargement,
   et après un vrai clic sur `◐` suivi de 2 s, elle est à 4,6:1. Protocole : écrire
   `localStorage.planClasse_theme`, `location.reload()`, réinjecter la neutralisation des
   transitions, puis mesurer.
6. ⚠️ **Un auditeur DOM lit `color` : il ne sait pas mesurer un `<text>` SVG**, dont la couleur
   est `fill`, et dont le fond est un `<rect>` frère que la remontée des parents ne voit pas.
   Le « 🖥 TABLEAU » du schéma des îlots a été rapporté à 1,40:1 alors qu'il est `fill="#fff"`
   sur un `<rect fill="#1a252f">` (~15:1). Écarter les `<text>` SVG, ou les traiter à part.

4. ⚠️ **Neutraliser les transitions** (`*{transition:none !important;animation:none !important}`) : une puce saisie à mi-parcours mesure 4,48 au lieu de 4,71 et produit de faux écarts intermittents.

Passe du **2026-10-06** (audit complet, cf. `docs/audit-complet-2026-10-06.md`) : **12 écarts**
trouvés et corrigés en 2.79.0, tous sur des surfaces ajoutées depuis — dont **1,05:1** (les
descriptions du bouton orange de « Désaffecter les tablettes », qui avaient échappé à la règle
`.btn-desc`), **1,34:1** (la puce `.chip.on` de « Projeter » et « Comparer classes » :
`background:var(--ink-blue)` + `color:#fff`, or `--ink-blue` devient PÂLE en sombre — l'encre
correcte est `var(--paper)`, comme le fait `.pass-code-chip`) et **2,85:1** (pastilles G1/G2 des
menus « Distinguer par groupe », `colorMap` littéral + blanc figé → tokens `--g1/--g2/--g3` dont
l'encre est dérivée par `_contrastTextColor`). Après correction : **0 écart** dans les deux
thèmes sur 11 onglets, 25 sous-états et les modales ouvertes par leur vrai ouvreur.

Passe du **2026-10-14** (cf. `docs/audit-complet-2026-10-14.md`, corrigée en 2.146.0) : 3 écarts écran
(compteurs des listes d'évacuation à 2,22:1 — `.lst-use` dans une `.clf-pill` cochée, la convention y est
`.n` ; ligne **sélectionnée** de l'onglet Élèves à 4,34:1, et **sélection invisible en sombre** → token
`--row-sel-bg` + liseré gauche), 3 à l'impression en mode nuit (cf. *Le thème sombre doit être
neutralisé*), et 3 incohérences du thème sombre : `color-scheme: dark` manquait (calendriers, curseurs,
défilement restaient clairs ; icône calendrier invisible), étiquettes « Civ »/« Grp » de la barre en lot,
sélecteur `.pl-seg` non stylé dans ⚙ Compétences. En rangeant l'outil d'audit (v2.146.2), deux de plus,
invisibles jusque-là faute de données ou de détecteur : la **palette des motifs de rappel**
(`REMINDER_COLOR_PALETTE`, posée en ligne) n'avait pas de variante nuit — chaque couleur porte désormais `d:
[fond, bordure, encre]`, appliqué par `_reminderColorById` selon le thème ; et les puces « élèves avec places
autorisées » de Config Salle (`#fff` figé, puce active blanc sur `#27ae60` à 2,87:1) passent aux tokens. ⚠️ **`.pl-seg` n'est stylé que par conteneur**
(`#tab-plan`, `#tab-svue`, `#msettings`, `#mcompmgr`) : tout nouvel usage ailleurs doit ajouter le sien,
sinon il s'affiche en boutons natifs gris.

💡 **Champs de formulaire : tous ont un nom accessible** (v2.146.1). Un balayage des onglets, sous-états et ~130
fenêtres ouvertes par leur vrai ouvreur ne trouve plus aucun `input`/`select`/`textarea` VISIBLE sans nom
(`labels`, `aria-label`, `aria-labelledby`, `title` ou `placeholder`). Règle pour tout champ nouveau : une
`<label for>` si le libellé est juste avant, sinon un `aria-label` — y compris dans les gabarits générés
(créneau par classe : `aria-label="Créneau — ${classe}"`, colonnes de l'import). Les `<select>` cachés qui
ne servent que de support de valeur (`cls-sel`, `tg-color-mode`, `ipm-pool`…) n'en ont pas besoin : un
`display:none` les retire aussi de l'arbre d'accessibilité. `_uiPrompt` sans `label` donne son titre comme
`aria-label` au champ.

7. ⚠️ **Le panneau d'aperçu MASQUÉ fausse les tests d'interaction** : `document.hasFocus()` est faux,
   donc `focus()`/`blur()` programmés ne déclenchent pas `onblur` (la mini-calculatrice du tableur
   paraissait en panne) ; les captures d'écran arrivent avec un temps de retard ; les minuteurs sont
   ralentis (découper les batteries longues, lire le résultat dans un second appel). Et un élément
   retiré du DOM garde un `display` calculé : tester sa présence par `getElementById`.

Score de référence après la passe du **2026-09-07** : **0 écart**, en clair comme en sombre, sur 25 écrans + 95 modales statiques + ~42 modales dynamiques + 4 tableurs. La passe précédente (2026-07-30) annonçait 13 / 9 sur 11 onglets sans données ; à périmètre et données réels, le point de départ du 2026-09-07 était de **~23 familles de défauts**, dont 8 sous 2:1 en thème sombre.


## Impressions : méthode d’audit (extrait de « Design system » dans CLAUDE.md)


#### Méthode d'audit des impressions (à rejouer)

1. **Découverte automatique** des chemins : toute fonction de premier niveau qui écrit dans `#pa` / `#qcm-plan-print-area` / `#am-print` ou appelle `window.print()`, **plus les constructeurs auxiliaires qu'elles appellent** (`buildTeacherPageHTML`, `_buildQcmPlanHTML` ne touchent aucun conteneur — une liste écrite à la main en avait raté trois : `printClassesBilan`, `doPrintEmptyConfigSalle`, `_renduPrint`). Compte de référence : **13 chemins**.
2. **Émulation du média print** : réinjecter les règles `@media print` comme règles d'écran (dernier `<style>` du `<head>`), sinon `getComputedStyle` renvoie le rendu écran.
3. **Auditer à l'intérieur du `window.print()` stubé** — c'est le seul instant où le DOM est en état d'impression ; plusieurs fonctions vident leur conteneur juste après.
4. ⚠️ **Ne pas se fier au libellé du chemin** : certaines fonctions appellent `print()` deux fois, ou via un minuteur qui retombe sous le chemin suivant. Utiliser le `document.title` que chaque fonction pose (= nom du PDF) comme identifiant intrinsèque, et vider les conteneurs entre deux chemins.
5. **Mettre `getComputedStyle` en cache** et restreindre la racine auditée : sur « Plusieurs plans » (13 pages, 4 745 éléments) l'auditeur non optimisé dépasse 30 s. Le balisage étant identique d'une page à l'autre, auditer la première suffit.

Score de référence après la passe du 2026-07-30 : **1 écart sur les 10 chemins, dans les deux thèmes** — la pastille **PAI à 4,41:1**, seul reliquat, conservée sciemment par fidélité à l'écran (cf. ci-dessus). Contre **244 en sombre et 9 en clair** avant la passe. Un audit qui renvoie autre chose que ce seul écart signale une régression.


## Tests automatiques : détail des suites (extrait de « Conventions de développement » dans CLAUDE.md)

  - **`test/compat.test.js` — rétrocompatibilité des fichiers JSON.** Pour chaque fixture de `test/fixtures/compat/`, rejoue le chemin d'un import (`_validateImport` → `S = data` → `postLoadHook` → `applyAccessorsAll`) et vérifie : aucune incohérence (inscrits/placés existants, salle active valide, champs pré-rooms et tablettes legacy disparus, types d'éval connus, discipline valide), audit d'intégrité vide, **`postLoadHook` idempotent** (second passage sans effet hors horloge), comptes conservés, état migré ré-importable. Les fixtures **historiques** sont générées par `node scripts/gen-compat-fixture.js <commit> <label>` : le script extrait le fichier au commit donné, rejoue **son** `createDemo()` dans le harnais et exporte `S` — c'est ce qu'un utilisateur de cette version aurait sauvegardé (v2026-05-14 sans évaluations · v2.0.0 · v2.12.2 · v2026-07-02 · v2026-08-02 avec 41 évals). `legacy-v1-pre-rooms.json` est écrit à la main au tout premier modèle (`cls.configuration` + `cls.seating` + `ipads*`, deux classes sur la même salle « B12 » → une seule salle au catalogue). ⚠️ **Ne pas régénérer une fixture existante** : elle fige un état historique, c'est sa valeur ; **ajouter une fixture à chaque changement de modèle** (nouvelle section de `S`, nouveau champ migré). Première prise : `createSalle` ne posait pas `ilots` / `collectPatterns` — une salle créée pendant `postLoadHook` (migration pré-rooms) ne les recevait qu'au chargement suivant. ⚠️ Le script vit dans `scripts/`, pas dans `test/` : `node --test` exécute **tout** `.js` sous `test/`, un utilitaire y passerait pour un test en échec. Les résultats sortis du `vm` transitent en **JSON** : un tableau d'un autre realm échoue à `deepStrictEqual` sur son prototype.
  - **`test/fuzz.test.js` — fichiers corrompus.** 150 mutations reproductibles (graine fixe) d'une fixture réelle : clés supprimées, valeurs absurdes (`null`, `'x'`, `[]`, `NaN`…), types changés ; le chemin d'import doit **refuser ou aboutir**, jamais lever. La première passe (300 mutations) a trouvé trois plantages à mi-migration — `S.eleves` absent, une entrée d'élève `null`, `cls.rooms = 'x'` — corrigés par **`_sanitizeCoreSections`** (appelée en tête de `postLoadHook` : sections `classes`/`eleves`/`salles` recréées si non-objet, entrées non-objet supprimées avec `console.warn`, `rooms` invalide réinitialisé) et par `_isPlainObj` dans `activeRoomData`. ⚠️ Une exception dans `postLoadHook` interrompt le chargement et laisse l'app sur un état à moitié migré, sans message : tout accès à une section de `S` dans une migration doit supposer qu'elle peut manquer ou être du mauvais type.
  - **`test/sync.test.js` — deux postes de bout en bout.** Deux sandboxes (= deux `localStorage`, deux `_DEVICE_ID`) échangent le JSON comme le fichier Nextcloud, et on vérifie la classification `_versionRelation` à chaque étape : `equal` → `ahead` (B écrit) → `diverged` (A écrit sans recharger) → résolution « garder ma version » (fusion max + bump) → B voit `ahead`, plus un Ctrl+Z chez A qui ne doit pas faire reculer l'horloge (B reste `behind`). Plus : poste vierge → `ahead` d'office ; horloge corrompue (chaînes, négatifs) fusionnée sans erreur — un compteur négatif n'est pas fusionné (clé absente = 0).
  - **`test/purge-coverage.test.js` — tests « balayants », à distinguer des précédents.** Ceux de `run.test.js` sont *énumératifs* : ils listent les purges attendues, donc ils sont aveugles à tout NOUVEAU champ. Celui-ci prend le problème à l'envers — état **maximal** (toutes les structures indexées par sid / classId), suppression, puis parcours récursif de `JSON.stringify(S)` à la recherche du moindre reste. Chaque référence survivante doit être couverte par une exception **déclarée avec sa justification** (`SID_EXCEPTIONS` : `attendance`, `snapshots`, `seatingSnapshots` — mémoire historique volontaire ; `CLS_EXCEPTIONS` : `previousClasses` — journal de transfert). Le même principe garde la liste blanche de `_validateImport` alignée sur les sections réelles de `S`.
## Audits rejoués le 2026-09-05 — scores de référence

- **Performance à volume de fin d'année** (13 classes · 323 élèves · 160 évals · 858 appels · 1,08 Mo) : `JSON.stringify(S)` 6 ms · `pushUndo` 7 · `save` 13 · changement d'onglet ≤ 64 ms (Bilan des compétences le plus lourd) · glisser-déposer 27 · undo 30 · ouverture du tableur 82 · frappe dans une cellule 8. Rien au-dessus de 100 ms — aucune action nécessaire. À rejouer si une opération dépasse ~150 ms.
- **Saturation du stockage** : `localStorage.setItem` forcé à lever `QuotaExceededError` → `save()` ne lève pas, la bannière rouge `#save-error-banner` apparaît, les données précédentes restent lisibles, et la bannière disparaît au premier `save()` réussi.
- **Impression** : 7 chemins audités en contraste (Prof, Élève, Plan vide, Liste élèves, Bilan des classes, Plans QCMCam, Marqueurs ArUco) → **0 écart** < 4,5:1. Non couverts par l'automate : `printSuiviPret`, `doPrintEmptyConfigSalle` (impriment via un état de modale), `printAllClasses`, `_renduPrint`.
- **Clavier des modales** : 90/90 focalisées à l'ouverture, 90/90 fermées à Échap, 90/90 avec `role=dialog` + `aria-modal`.
- **Responsive** et **rétrocompatibilité** : cf. sections dédiées ; **fuzz** et **sync** : cf. tests.
