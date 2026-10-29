# Plan de Classe — Contexte projet

## Application
PWA mono-fichier de gestion de plans de classe et placement d'élèves.
Utilisée par un enseignant pour gérer ses classes, ses salles et placer ses élèves.

## 📚 Mémoire détaillée — `docs/memoire/` (À LIRE avant de travailler sur un sujet)

Ce fichier ne garde que ce qui vaut partout (design system, contraste, conventions, invariants, git, Nextcloud, version). Le détail de chaque fonction est dans `docs/memoire/`, rangé par thème, **texte d’origine inchangé** (rangement du 2026-10-29). **Avant de modifier une fonction, lire le fichier de son thème** (chercher le nom de la fonction ou de la modale par `grep` dans `docs/memoire/` si le thème n’est pas évident). **Toute nouvelle note sur une fonction va dans le fichier de son thème, pas ici** ; ici seulement une règle qui vaut pour toute l’application.

- `docs/memoire/interface.md` — **Interface générale** : barre des onglets et groupes, bandeau du haut et bouton Fichier, sélecteur de classe, bandeau de contexte, Réglages (msettings) et leurs fenêtres, fonctions activées, démo et fenêtre de bienvenue, fenêtres fichier et système (réinitialiser, conflit, mise à jour), fenêtres d’outils (marqueurs, affecter automatiquement, exporter les notes, versions), lot H de l’audit n° 2.
- `docs/memoire/sauvegarde.md` — **Sauvegarde, synchronisation, stockage** : À propos (mabout) et jauge de la mémoire locale, copie du dernier fichier dans IndexedDB, volumétrie, synchronisation automatique, horloge vectorielle et conflits, sauvegardes horodatées, versions et historique.
- `docs/memoire/donnees-classes.md` — **Modèle de données et classes** : modèle S (multi-salles, accesseurs, migrations), niveaux, arrivées et départs, transferts (évals orphelines), attributs des élèves, PP et délégué·es, AESH, onglet Classes, Nouvelle / Modifier la classe, niveau d’une classe, classes recomposées.
- `docs/memoire/eleves.md` — **Élèves** : fiche élève (mrw) et fiche détachée, remarques du bulletin, onglet Élèves, ajout et import d’élèves, historique (mhist), vue d’ensemble, instantanés, rappels, tableau de la classe, photos (thrombinoscope MBN), trombinoscope, mémoriser, informations.
- `docs/memoire/plan-salles.md` — **Plan de classe et salles** : barre du Plan et Vue Élève (fenêtre de projection), compteur, interroger, cases du plan, étiquette d’une cellule, coloration, surlignages, clic droit, glisser-déposer, mélanger tout, contraintes de placement et paires, Config Salle (modes, horaires, classes de la salle), impressions.
- `docs/memoire/seance.md` — **Séance et vie de classe** : mode appel et appels passés, statistiques d’absence, message à la classe, journal de séance, sonomètre, minuteur, mode confidentiel, listes d’évacuation, fenêtres de la vie de classe (retard, enregistrer l’appel, informations, place, salles, ordres de ramassage, tablettes, impression).
- `docs/memoire/reunions.md` — **Réunions parents-professeurs** : module Réunions (préparer, ce soir, mini bilans, feuille imprimée), sélection qui suit l’élève, fichier autonome pour un collègue et mail.
- `docs/memoire/tablettes-qcmcam.md` — **Tablettes et QCMcam** : onglet Tablettes, picker, modèle par mode et classe mobile, fiche de prêt, réinitialisation du fichier (historique), désaffectation, affectation automatique, QCMcam (numérotation, export, marqueurs ArUco, impression des plans).
- `docs/memoire/evaluations-calculs.md` — **Évaluations — modèle et calculs** : types A/B/C/D, calcul des notes et des niveaux, catalogues (commentaires, motifs d’ajustement), agrégation des compétences, multi-classes, jeux de couleurs, ajustement de la note, codes A/NN, « non faite par cette classe », modèle des dates.
- `docs/memoire/evaluations-tableur.md` — **Évaluations — tableurs de saisie** : tableurs A/B/C/D, absents pré-remplis, calculatrice, import QCMcam des résultats, touche Entrée, ordre de ramassage, mini-plan, plan du type B, croix de saisie, pastilles, filtres, fenêtres de correction.
- `docs/memoire/evaluations-bilans.md` — **Évaluations — création, devoirs, bilans** : projection, export tableur des notes, bilan des notes (photo, mini-plan), vers MBN, fenêtres de consultation (détail de la note, résultats, comparer), disciplines, import d’une évaluation, nouvelle évaluation, liste des devoirs, bilans des notes et des compétences, conseil de classe, exports.
- `docs/memoire/verification.md` — **Vérification : audits et tests** : méthode de vérification du contraste et ses pièges, passes d’audit, méthode d’audit des impressions, scores de référence, détail des suites de tests.

## Design system (Carnet du prof)

L'app utilise un design system "papier d'enseignant" cohérent — paramétré via variables CSS au début du `<style>`.

### Palette "Blueprint" (par défaut, mode clair)
- `--paper` `#f4f6fa` (fond papier bleuté) · `--paper-warm` `#e6ebf2` (surfaces fixes) · `--paper-deep` `#d6dde6`
- `--ink-deep` `#0e1a26` (texte) · `--ink-blue` `#1a252f` (titres, sélections) · `--ink-blue-soft` `#2a3540`
- `--rule-line` `#c8d2e0` (filets) · `--rule-line-soft` `#dde4ee` (lignes Seyès en arrière-plan)
- `--margin-red` `#b03d2e` (filet rouge de marge gauche + accents) · `--margin-red-soft` (rgba)
- `--pencil` `#56697f` (texte secondaire) · `--pencil-soft` `#606f86` (tertiaire — cf. *Contraste* ci-dessous)
- `--maitrise-1..4` (réservés pour le futur volet Évaluation : rouge, orange, vert, bleu profond)
- `--highlighter` `#f5d76e` (jaune surligneur, état post-appel)

### Mode sombre "veillée du dimanche soir"
Activé via `html[data-theme="dark"]` — texte ambre chaud (`#e8d9b8`) sur fond bleu nuit (`#13181f`), filets désaturés. Toggle dans le header (bouton `◐` / `☾`, id `#btn-theme`, fonction `toggleAppTheme()`), persisté dans `localStorage.planClasse_theme` et restauré au chargement via un IIFE en pied de script.

⚠️ **Deux pièges du design system « papier » à connaître pour toute nouvelle couleur de cellule/input** :
1. La règle globale `.cell { background: var(--paper) !important }` (~l. 1615) écrase toute règle de fond **sans `!important`** — les fonds des modes Config Salle (`callow`/`cforbid`/`cilot`/`ctag`) portent un `!important` pour cette raison. De même, la règle globale inputs `input[...] { background: var(--paper) !important }` (~l. 1594) porte un `:not(.counter-input)` pour laisser vivre l'échelle de couleurs inline (`oubliColor`) des compteurs 📦/📝 de l'onglet Élèves, **et un `:not(.meval-niveau-input)` sur `input[type="text"]`** pour laisser vivre la couleur de texte calculée par `_contrastTextColor` dans les cellules de saisie des tableurs d'éval (B/D et notes A/C) — sans lui, le `color: var(--ink-deep) !important` de la règle battait la couleur inline (un inline ne bat JAMAIS un `!important`) et le thème sombre posait de l'ambre sur les fonds rouge/vert/gris (1,8:1 mesuré sur une case Absent). ⚠️ La règle sombre dédiée (~l. 1424) excluait déjà la classe : quand on exclut un composant d'une règle de thème, vérifier que la règle de BASE (qui passe par `var()` donc suit aussi le thème) l'exclut de même.
2. Toute couleur de fond claire posée pour le mode clair doit avoir sa **variante sombre** (sinon texte ambre sur pastel = illisible) : les variables `--g1/g2/g3-light/-em` sont redéfinies dans le bloc `html[data-theme="dark"]`, et des surcharges dédiées existent pour `cgen-m/f` (genre), `.cell.absent/.late` (appel, miroir des `.mp-cell`), `.svcell.oc.absent/.late`, `callow`/`cforbid`/`cilot` et `#tg .cstr-allow/forbid`.
3. ⚠️ **Ne jamais regrouper dans un même sélecteur des éléments qui portent leur propre fond et des éléments qui héritent du fond parent.** La règle sombre couvrait `.cctr`, `input.counter-input` ET `.cipad` en une seule déclaration `color:#0e1a26` ; changer la couleur pour `.cipad` (qui hérite d'un fond de cellule **sombre**) a cassé les deux autres (fond **clair** inline `oubliColor` → ambre sur vert pâle à 1,1:1). Les deux familles sont désormais séparées, avec un commentaire sur place.

### Contraste — invariants et tokens sémantiques

Toute couleur de **texte** doit passer par un token qui se décline par thème. Ne jamais écrire un gris ou un accent en dur dans une déclaration `color:` (le thème sombre inverse le fond, pas la valeur littérale).

- **Gris de texte** → `var(--pencil)` (texte secondaire, 5,2:1 clair / 6,2:1 sombre) ou `var(--pencil-soft)` (tertiaire : compteurs de caractères, tirets de valeur vide). Les ~300 `color:#555/#666/#777/#888/#999/#bbb/#ccc` historiques ont été convertis. **Exceptions volontairement conservées** : les fonctions qui construisent du HTML d'**impression** (`doPrint`, `printSuiviPret`, `printElevesList`, `buildTeacherPageHTML`, `printQcmPlans`, `printSalleArucoMarkers`, `printAllClasses`, `doPrintEmpty`, `_applyPrintColorMode`) et de **fenêtre flottante** (`_noiseFillWindow`, `_timerFillWindow`) — documents séparés ou papier blanc, où un token du thème serait faux. Idem `@media print`.
- **Accents sémantiques** : `--civ-m` / `--civ-f` (♂/♀), `--agr-fg` (📄 agrandissements), `--warn-fg` (alertes ambre), `--disc-accent` (violet discipline, désormais décliné en sombre), `--chip-on-bg` (fond d'une puce active sans variante `gc-*`).
- **Texte sur fond coloré** → toujours `_contrastTextColor(bg)`, jamais `color:#fff` en dur. Vaut aussi pour les fonds **choisis par l'utilisateur** (couleurs de tags : `_contrastTextColor(_safeColor(t.color))`).
- **`_contrastTextColor` choisit par contraste WCAG réel**, plus par seuil YIQ. L'ancien test `YIQ >= 150` mettait du blanc sur les accents saturés de luminance moyenne (orange PPRE `#e67e22` à 2,85:1, vert ULIS `#27ae60` à 2,87:1) ; et sa branche `hsl` décidait sur la *lightness*, ce qui donnait du blanc sur les jaunes/verts du dégradé de la colonne **Rang** (1,6:1). La branche `hsl` convertit maintenant en RGB, et le choix se fait via le helper `_wcagContrast(r1,g1,b1,r2,g2,b2)`.
### Familles de tokens ajoutées le 2026-09-07

Presque tous les défauts trouvés venaient de la même faute : **une valeur littérale posée pour le mode clair, sans variante sombre**. D'où quatre familles de tokens, chacune déclinée dans `:root`, dans `html[data-theme="dark"]` et dans la neutralisation `@media print`.

| Token | Sert à | Remplaçait |
|---|---|---|
| `--alert-bg/-bd/-fg` | indisponible, absent, élève parti | `#fee2e2` + `#991b1b` (1,14:1 en nuit) |
| `--caution-bg/-bd/-fg` | liste des non placés | `#ffeeba` (1,21) |
| `--notice-bg/-bd/-fg` | bandeau RGPD, rappels, cartes d'information | `#fef9e7` + `#7d3c00` (1,57) |
| `--aesh-bg/-bd/-fg` | AESH, plan et Vue Élève | `#fde2f3` + `#880e4f` (1,38) |
| `--info-bg/-bd` | surfaces bleutées d'information | `#eaf4ff` (1,25) |
| `--link-fg`, `--ok-fg`, `--danger-fg` | liens et titres de carte | `#3498db` (3,15), `#1b5e20`, `#7d2017` |
| `--danger-bg` / `--danger-on` | pastilles rouges pleines (💬, incompatibilité) | `var(--margin-red)` + `#fff` figé (3,87) |
| `--cell-meta` | n° de place, pastille tablette, croix, sur une cellule TEINTÉE | `--pencil` (3,88 sur un pastel de tag) |
| `--g1-fg/--g2-fg/--g3-fg` | couleurs de groupe utilisées en ENCRE | `--g1/2/3` (2,35 en nuit) |
| `--st-*-fg` (8) | dispositifs en encre (cases de Modifier élève) | accents des pastilles (2,33–3,28) |

⚠️ **Un accent utilisé en FOND et en TEXTE a besoin de deux valeurs** — déjà noté pour `.spec-ppre`, vérifié à nouveau à ses dépens : éclaircir le `--margin-red` du thème sombre a rendu lisibles l'astérisque « champ obligatoire » et les indices, **et fait tomber à 3,24:1** les pastilles qui s'en servent de fond. D'où le retour à la valeur d'origine plus un `--danger-fg` distinct pour l'encre.

⚠️ **`--pencil` est calibré sur `--paper`, pas sur les autres surfaces** : 5,2:1 sur le papier, mais 4,26 sur `--paper-warm`, 4,12 sur `--paper-deep` et 3,88 sur un pastel de tag. `--pencil-soft` est passé de `#606f86` à `#5b6a80` pour tenir sur `--paper-warm` ; sur une cellule teintée ou un pied de tableau, utiliser `--cell-meta`.

⚠️ **Un gris de luminance moyenne ne porte NI l'encre sombre NI le blanc** : `#7f8c8d` plafonnait à 4,47 des deux côtés dans `TAG_COLORS`. `_contrastTextColor` ne peut rien y faire — c'est la teinte qu'il faut changer (éclaircie en `#95a5a6`). Même raisonnement pour le **dégradé de rang** du Bilan des notes, qui traverse une bande d'oranges et de bleus où la clarté fixe échouait des deux côtés : `_rankGradientColor` corrige désormais la **clarté** (jamais la teinte, qui porte le sens) dans le sens le moins coûteux, et laisse `_contrastTextColor` choisir l'encre.

⚠️ **Une couleur posée en JS et reconnue par sa VALEUR dans une règle de thème doit changer aux deux endroits** : la bascule Liste/Diagramme des paires est ciblée par `#cfg-pairs-view-list[style*="2176b8"]`.

💡 Deuxième cas du même mécanisme, et son piège : le sarcelle `#16a085` posé **en ligne** sur
quelques boutons (Auto-îlots, « 🖼 Plan » des appels passés) est ciblé par
`button[style*="background:#16a085"]` — une règle sombre, doublée en 2.79.0 d'une règle claire
(le blanc n'y tenait que 3,28:1). ⚠️ Elle porte `:not(.btn-p)` : sur un bouton qui a cette
classe, le fond en ligne est de toute façon écrasé par `background: var(--ink-blue) !important`,
et lui poser l'encre sombre donnait **de l'encre sur l'encre (1:1)** — mesuré sur « 🖼 Plan »
pendant la correction. Un sélecteur calé sur une valeur doit donc vérifier que cette valeur
gagne vraiment la cascade.

- ⚠️ **Le blanc figé sur une couleur de niveau est un défaut récurrent** — trouvé le 2026-09-06 sur les quatre pastilles de l'onglet **Bilan des compétences** (`renderCompetencesTab`) : niveau 2 orange à **2,15:1**, niveau 3 vert à **3,30**. Le blanc ne tient que sur le bleu du niveau 4, et la palette étant **réglable**, aucune valeur figée ne peut être sûre. Deux lints y veillent désormais (`test/run.test.js`) : `color:#fff` interdit dans la même déclaration qu'un `background:${colors[…]}`, et **index de palette jamais figé à 4** (`Math.min(4, Math.round(…))` — `nbLevels` va de 2 à 6 : quatre sites dans cet onglet, plus un dans `_evalShowNoteDetail`). Après correction : 4,72 à 7,25 dans les deux thèmes.
  - 💡 **Un auditeur qui parcourt le DOM ne voit que ce qui est RENDU.** Ces pastilles ont échappé à la passe du 2026-07-30 ; l'onglet doit porter des données pour être audité, donc la méthode de vérification n'est valable que jouée sur un état où **chaque onglet a de quoi s'afficher** — un tableau vide passe pour un tableau propre.
- **Cartes de classe (onglet Classes)** — `levelBgColor` garde un **aplat saturé** : une teinte par niveau + une variation de luminosité par classe au sein du niveau. ⚠️ **Ne pas diluer ce fond** : repérer le niveau d'un coup d'œil est sa fonction première (une tentative de fond très pâle a été rejetée par l'utilisateur — « toutes les classes sont très similaires quel que soit leur niveau »). Comme aucune couleur de texte **fixe** ne tient 4,5:1 sur toute la gamme (max 5,4:1 en clair, 3,8:1 en sombre ; 1,4–2,6:1 pour des accents comme ♂/♀), la lisibilité vient de la **dérivation du texte depuis le fond de chaque carte** : `renderClasses` pose `--cc-fg:${_contrastTextColor(bg)}` en inline, et `.cc` / `.cc-name` / `.cc-meta` lisent `var(--cc-fg, …)` (7,9–11,3:1 mesurés). Les compteurs ♂/♀ et 📄 gardent leur code couleur (bleu / rose / sarcelle, tokens `--civ-m` / `--civ-f` / `--agr-fg`) grâce à la classe **`.cc-chip`** : une pastille à **fond opaque `var(--paper)`**, qui isole la couleur du fond de niveau et la rend indépendante de la carte (5,1–6,3:1 en clair, 8,3–9,3:1 en sombre). Un bloc `@media print` repose les valeurs du thème clair sur ces pastilles — sinon un thème sombre actif à l'écran imprimerait un bleu ciel délavé sur papier blanc. `levelAccentColor` ajoute une bordure gauche saturée **identique pour toutes les classes d'un même niveau** — le niveau se lit sur la bordure, la classe sur la nuance du fond.
  - **Récap photocopies** (bas de l'onglet Classes, et « Bilan des classes » imprimé — `printClassesBilan`, tableau par classe ET récap par niveau) : deux familles de colonnes à ne pas confondre. Les **élèves** (« Non aménagés » / « Aménagés » = PPRE, PAP, PPS, ULIS+, UPE2A+, PAI parmi les présents) et les **documents à tirer** (« 📄 Docs non aménagés » = présents sans agrandissement, `docStd` · « 📄 Docs aménagés » = agrandissements, ex-colonne « Agrandissements », renommée le 2026-09-21 à la demande de l'utilisateur). `_classCounts` expose `agrPresent` (agrandissements parmi les présents) et `docStd = present − agrPresent`. ⚠️ Les docs aménagés restent comptés sur **tous** les inscrits, hors-inclusion compris (un ULIS/UPE2A hors classe qui a un agrandissement en a besoin quand il vient) : les deux colonnes peuvent donc dépasser les présents d'une unité, c'est voulu et dit dans l'infobulle. Les puces `📄 N agrandissements` des cartes décrivent l'attribut élève et gardent leur nom.
  - Deux pièges de cascade sur ces cartes : la règle sombre `.cc { border-color: … !important }` écrasait la bordure gauche inline (elle ne cible plus que les 3 autres côtés), et `.cc.on` marque la sélection par un `box-shadow` en anneau car le fond et la bordure inline gagnent sur `border-color`.
- **Boutons `.btn-s` / `.btn-w` / `.btn-d`** ont un fond assombri **propre à eux** (`#1a7442` / `#a85312` / `--margin-red`) — ils ne réutilisent plus `--maitrise-2/3` ni le rouge clair du thème sombre, qui ne portaient pas le texte clair. Les variables `--maitrise-*` restent inchangées pour les niveaux de maîtrise.
  - **Texte SECONDAIRE dans un bouton coloré → classe `.btn-desc`**, qui pose `color: inherit`. Le bouton a déjà choisi son encre selon le thème (`var(--paper)` en clair, `var(--ink-deep)` en sombre) ; la figer la fait diverger du libellé qu'elle accompagne. La description du bouton « Réinitialiser en conservant les salles » portait `var(--pencil)` — un gris **de papier** posé sur l'orange du bouton, à **1,55:1**, illisible ; ses deux voisines, elles, forçaient `#fff`, ce qui tenait en clair mais divergeait en sombre.
  - ⚠️ **Pas d'opacité sur `.btn-desc`** : le fond orange du thème sombre (`#8a4f1c`) ne porte l'encre ambre qu'à **4,68:1**, donc le moindre estompage passait sous 4,5:1 (mesuré 4,39 à `opacity:.88`). La hiérarchie vient de la taille et de la graisse, qui ne coûtent aucun contraste. Mesures finales — clair 4,96 / 5,46 / 7,07 · sombre 4,68 / 5,09 / 7,07.
  - 💡 **Piège de mesure rencontré** : `getComputedStyle` juste après `setAttribute('data-theme', …)` dans le **même appel** renvoyait les valeurs de l'ancien thème — d'où deux thèmes mesurés identiques, et un faux « tout va bien ». Forcer un reflow (`void document.body.offsetHeight`) ou mesurer dans un appel séparé.
- **Un accent utilisé en fond ET en texte a besoin de deux valeurs** : `.spec-ppre` prend un texte sombre en clair (orange vif) et **blanc** en sombre (orange assombri) — l'arbitrage s'inverse avec le thème.

**Méthode de vérification du contraste** (auditeur DOM, `outils/audit-ui.js`, ses sept pièges de mesure), passes d’audit et scores de référence : `docs/memoire/verification.md`.

### Polices embarquées (base64 woff2, sous-set Latin)
Encodées en `data:font/woff2;base64,...` via 3 blocs `@font-face` en tête du `<style>` (~180 Ko pour les 3 fontes, assumé pour préserver le mono-fichier hors-ligne) :
- **Fraunces** (serif variable, opsz 9–144) — `--font-serif` : titres, noms de famille dans le tableau Élèves, h2 de sections
- **IBM Plex Sans** (variable) — `--font-sans` : corps de texte, UI, boutons, badges
- **JetBrains Mono** (variable) — `--font-mono` : chiffres tabulaires (n° de tablette, dates), codes courts, étiquettes uppercase

### Composition spatiale
- **Filet rouge vertical** sur toute la hauteur (`body::before`, 2 px, `--margin-red`, gauche à `--margin-w: 56px`) — métaphore "marge du cahier", `z-index: 9990`
- **Lignes Seyès** très pâles en arrière-plan du body (`repeating-linear-gradient` tous les 32 px, `background-attachment: fixed`)
- **Nav à 2 niveaux** matérialisée par un séparateur vertical (`border-right` sur `.tab-group:not(:last-child)`)
- Variables d'espacement `--sp-1..8` (4 → 64 px), radius `--radius-sm/md/lg` (3, 5, 8 px), ombres `--shadow-card` et `--shadow-pop`

### Aides repliables (`data-help`, v2.73.0)
Tout bloc d'aide marqué `data-help="clé"` reçoit un ✕ et un bouton « ❔ Aide » (inséré avant le premier bloc de la clé) le réaffiche ; mémorisé dans `localStorage.planClasse_help_<clé>` (`_helpInit` après `init()`, `_helpSet`, `_helpApplyAll`). Le pliage passe par la classe `.help-folded` (`display:none !important`) : Config Salle affiche ses aides par `style.display` selon le mode, une classe les masque toutes sans se battre avec lui. Clés : aucune aujourd'hui — `qcm`, `ipads` puis `cfg` ont été remplacées par des aides repliées propres à leur onglet (v2.100–2.102) ; le mécanisme reste disponible. Les onglets Évaluations gardent leur mécanisme `evhelp` historique. **Pastilles `?` au toucher** : un clic ou un toucher sur `.tb-hint` affiche son texte dans une bulle `#help-bubble` (l'infobulle native est invisible au doigt).

### Infobulles : toutes dans la bulle `#gtip` (v2.150.1)
Les infobulles natives (`title`) sont dessinées par le navigateur d'après le thème du **système**, pas celui de l'app : système en sombre + app en clair = texte blanc sur fond clair (signalé sous Linux). Le gestionnaire `mouseover` de la bulle globale (`_setupGlobalTooltip`) déplace donc, au survol, tout `title` dans `data-tip` et l'affiche dans `#gtip` (fond `#2c3e50`, texte blanc, lisible dans les deux thèmes). Un `title` reposé plus tard par le code reprend la main au survol suivant. Un élément sans autre nom (champ, bouton-icône : texte ≤ 2 caractères) reçoit le texte en `aria-label`, pour ne pas perdre son nom accessible. On peut continuer d'écrire `title=` partout.

### Hints en pastilles `?`
Les anciens textes d'astuce `<span class="tb-hint">…</span>` sont visuellement convertis en **pastilles rondes grises** avec leur contenu transformé en infobulle native (`title=`). Conversion faite au runtime par `_initHints()` (parcourt les `.tb-hint`, déplace le textContent dans `title`, vide le texte visible). Appelé à `init()` puis re-déclenché après chaque `renderStudents()` via un wrapper sur la fonction d'origine. Pastille stylée via `.tb-hint::after { content: "?" }`.

### Impressions
Le filet rouge et les lignes Seyès sont **cachés à l'impression** via `@media print` (`body::before { display:none }`, `background-image: none`). Les couleurs des cellules sont gérées par `_applyPrintColorMode` (existant) pour le mode N&B.

#### ⚠️ Le thème sombre doit être neutralisé pour le papier

**Le papier est toujours blanc — le thème sombre n'a donc rien à y faire.** Défaut mesuré le 2026-07-30 : `body { color: var(--ink-deep) }` valait `#e8d9b8` (ambre) en thème sombre, `#pa` en **héritait**, et le bloc `@media print` ne remettait la couleur à zéro nulle part (il ne forçait que `background:#fff`). Imprimer en mode nuit posait donc de l'ambre sur blanc à **1,40:1** sur tout le texte sans couleur explicite — noms d'élèves, cellules de tableau, titres. **244 écarts** relevés sur 4 chemins.

Corrigé par un bloc **`@media print { html[data-theme="dark"] { … } }`** (juste après la définition du thème sombre) qui rétablit les valeurs du thème clair pour les **40 tokens** que le mode nuit redéfinit. Agir sur les tokens plutôt que sur des sélecteurs couvre d'un coup tout ce qui passe par `var(--…)`, y compris les règles qu'on n'aurait pas songé à énumérer. Les 7 tokens qui n'existent QUE dans le bloc sombre (`--cell-occupied*`, `--cell-drop-ok*`, `--warn-bg/-bd`) sont remis à `initial` : le custom property devient invalide, donc le repli `var(--x, littéral)` reprend la main — exactement le comportement du thème clair. **Si un token est ajouté au thème sombre, l'ajouter aussi à ce bloc.**

⚠️ **Ce bloc n'atteint PAS les surcharges sombres écrites en LITTÉRAL** (`html[data-theme="dark"] .spec-ppre { color:#fff }`,
`.eval-type-C { background:#3b5a8c }`) : le token redevient clair, le littéral reste — blanc sur l'orange PPRE
redevenu clair à 2,85:1 dans la Vue d'ensemble et le Tableau de la classe imprimés en mode nuit (audit du
2026-10-14). Des blocs `@media print` dédiés rétablissent les `.spec-*` et `.eval-type-*` du clair, et
`color-scheme` y est remis à `light`. **Toute nouvelle surcharge sombre littérale sur une surface qui
s'imprime (pages recopiées de l'écran par `_printConsultation`) doit avoir sa remise au clair.**

#### Convention : les constructeurs d'impression écrivent des couleurs LITTÉRALES

Un token suit le thème de l'écran. Les fonctions qui produisent du HTML imprimé posent donc des valeurs littérales (`#56697f` pour `--pencil`, `#606f86` pour `--pencil-soft`, `#b03d2e` pour `--margin-red`). Le bloc de neutralisation ci-dessus rend cette convention redondante, mais elle est conservée : explicite, auto-documentée, et indépendante de l'existence du bloc global.

⚠️ **`_buildQcmPlanHTML` est l'exception** : elle sert l'onglet QCMCam **à l'écran** *et* l'impression multi-salles. Elle reçoit un drapeau **`opts.print`** (posé par `printQcmPlans`) et choisit entre littéral et token. Tout constructeur à double usage doit faire de même — pas de littéral inconditionnel, il casserait l'écran en mode nuit.

#### Pastilles d'aménagement — UNE seule palette, celle de l'écran

⚠️ Les mêmes statuts (PPRE, PPS, ULIS, UPE2A…) s'affichaient avec **trois palettes différentes** selon la surface : cellule du plan (classes `.spec-*`), liste des non placés (couleurs en style *inline*), liste imprimée (littéraux dans `_amBadges`). Dérive classique de valeurs dupliquées — ULIS y était tantôt gris, tantôt vert, tantôt violet. **Arbitrage de l'utilisateur : la palette de référence est celle de l'écran** (les `.spec-*`).

Les trois surfaces sont désormais alignées, par deux mécanismes distincts :

- **`renderUnplaced`** utilise les classes **`.spec-badge spec-*`**, plus aucune couleur inline. Une seule source pour les deux surfaces d'écran, et ces pastilles deviennent sensibles au thème (elles ne l'étaient pas). Seule la marge reste inline (`.spec-badge` n'en pose pas, le panneau est étroit).
- **`_amBadges`** (impression) est un **miroir littéral** des `.spec-*` en valeurs du thème clair. Un constructeur d'impression ne peut pas utiliser les tokens — ils suivent le thème de l'écran — donc la duplication est inévitable **ici seulement**. ⚠️ **À tenir synchronisée : toute retouche d'une pastille `.spec-*` se reporte dans `_amBadges`, et réciproquement.**

La couleur de **texte** reste dérivée du fond par **`_contrastTextColor(b.bg)`**, jamais `#fff` en dur (le blanc tombait à 2,19:1 sur l'ancien orange PPRE `#f39c12`).

Contrastes mesurés sur papier avec la palette d'écran — meilleurs que ceux de l'ancienne palette d'impression : ULIS+/UPE2A+ 6,92:1 · PAP 6,87 · PPS 6,69 · ULIS/UPE2A 5,64 · PPRE 5,46 · -A 4,52 · **PAI 4,41** (seule sous la cible). PAI est conservée à `#ec4899` par fidélité à l'écran, où elle est jugée suffisamment visible par l'utilisateur malgré 3,53:1 — le papier est donc meilleur que l'écran sur ce point. Ne pas « corriger » l'une sans l'autre.

💡 **ULIS et UPE2A partagent volontairement le gris `--pencil`** (idem ULIS+/UPE2A+ en violet `#6f4a8c`) : elles ne se distinguent que par leur libellé. Conséquence assumée du choix de palette, signalée avant décision. Ne pas y « rétablir » un vert et un sarcelle sans changer aussi les `.spec-*` — c'est exactement comme les palettes avaient divergé.

De même, `.pcell .pgb.g2` était resté sur `#d35400` (4,17:1) alors que le token d'écran `--g2` valait déjà `#bf4d00` (4,91:1).
**Méthode d’audit des impressions** : `docs/memoire/verification.md`.

## Fichiers
- `plan de classe.html` — application complète (HTML + CSS + JS dans un seul fichier)
- `plan de classe.html.bak` — copie de sécurité locale de l'app avant modifications lourdes (créée manuellement par l'utilisateur). Gitignoré via `*.bak`, non publié sur GitHub Pages.
- `index.html` — page de redirection servie à la racine `belenos-toutatis.github.io/plan-de-classe/`. Meta refresh + `<script>location.replace(...)</script>` vers `./plan%20de%20classe.html`. Mini design "carnet du prof" en fallback si la redirection traîne. Permet d'utiliser une URL courte au lieu de l'URL longue avec `%20`.
- `.nojekyll` — fichier vide. Désactive le pipeline Jekyll de GitHub Pages (sinon Jekyll prend `README.md` comme index automatique et ignore `index.html`). **Indispensable** pour que la redirection fonctionne.
- `manifest.json` — manifeste PWA (thème #1a252f, bleu foncé)
- `sw.js` — service worker (utilisation hors-ligne, network-first)
  - 💡 **Bruit de console attendu en `file://`, à ne pas re-diagnostiquer** : ouvert en fichier local, l'origine vaut `null` et Chrome refuse d'aller chercher le manifeste (`blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, …, http, https`), d'où un `ERR_FAILED` sur `manifest.json`. Le service worker échoue pour la même raison, silencieusement (`.catch(() => {})`). **Inoffensif** : le manifeste ne sert qu'à l'installation et au thème de fenêtre, pas au fonctionnement de l'app. Absent en `https`. Volontairement **non corrigé** : le `<link rel="manifest">` est statique en tête de `<head>` et récupéré pendant l'analyse, avant tout script — le faire taire imposerait de l'injecter en JS, donc de toucher au mécanisme d'installation (qui, lui, sert vraiment) pour un gain limité à la propreté de la console dans un mode où la PWA est inerte.
- `README.md` — documentation utilisateur (orientée GitHub)
- `LICENSE` — double licence : MIT (code de l'app, layout d'impression des marqueurs compris) + Apache 2.0 (dictionnaire ArUco `QCMCAM_4X4_157h3`, repris du dépôt de QCMcam 2 par Sébastien COGEZ). ⚠️ La partie 2 était CC BY-NC-SA 4.0 jusqu'à la 2.38.0, du temps de l'ancien dictionnaire de 125 motifs de qcmcam.net v1 ; celui-ci a été retiré en 2.39.0.
- `CREDITS.md` — remerciements détaillés à Sébastien COGEZ (QCMcam), à la communauté enseignante, et aux polices embarquées (Fraunces, IBM Plex Sans, JetBrains Mono — toutes sous SIL Open Font License)
- `.gitignore` — exclut les sauvegardes locales (`plan-classe-*.json`, `*.bak`, `*.tmp`)
- `outils/analyse-mbn.html` — outil annexe : deux favoris actifs (🔎 Analyser MBN, 👁 Observer MBN) qui décrivent la page de saisie des notes de MBN et observent une saisie, en rapport **anonymisé** (textes remplacés par leur forme, mots d'interface en clair, noms techniques contenant un mot affiché → Ⓧ). Sert à adapter le favori « Remplir MBN » si MBN change. ⚠️ Pas de commentaire `//` dans les fonctions converties en favori.
- `outils/audit-ui.js` — **outil d'audit de l'interface** (non chargé par l'app) : injecté à la main dans la page servie en local, il rejoue l'audit complet — contraste écran (12 onglets, ~35 sous-états, 87 modales statiques, 126 fenêtres par leur vrai ouvreur, avec ARIA, focus et largeur), impressions (22 chemins), pavés clairs du thème sombre, champs sans nom, intégrité, erreurs — et rend un bilan dans `window.__AUDIT.summary`. Mode d'emploi en tête du fichier. Score de référence : **tout à 0 dans les deux thèmes** (v2.146.2). ⚠️ Panneau d'aperçu masqué = fenêtre de 0 px : l'outil refuse de mesurer tant qu'on ne lui a pas donné une taille ; son **méta-test** (texte #ccc sur blanc qui doit être détecté) garde contre une mesure vide de sens. **Tout nouvel écran ou nouvelle fenêtre s'ajoute à ses listes** (`TABS`, ouvreurs de `__dynRun`, sous-états de `__subRun`, chemins de `__printRun`) — sinon il passe pour propre.
- `outils/diagnostic-pdf.html` — outil annexe (non lié à l'app) : rapport anonymisé de la mise en page d'un PDF de thrombinoscope, cf. section *📷 Photos des élèves*.
- `docs/format-import-evaluation.md` — format du fichier d'import d'une évaluation Type C ou D, à donner à une IA (copie exacte embarquée dans la page, cf. section *Import de la structure d'une évaluation*).
- `docs/` — audits et notes de conception, **versionnés** : `audit-complet-2026-10-14.md` (audit multi-axes de la v2.144.3 : contraste écran/impression dans les deux thèmes, cohérence du thème sombre, modales, responsive, perf à 522 élèves, statique — corrigé en 2.146.0), `audit-complet-2026-10-06.md` (audit multi-axes de la v2.78.1 : contraste écran et impression, a11y des modales, responsive, perf, code mort — ses conclusions sont corrigées en 2.79.0), `audit-ergonomie-2026-07-29.md` (catalogue Top 12 / six axes / lots A–F sur la v2.20.0 — tout réalisé ou arbitré : saisie de rentrée faite (« Ajouter et en saisir un autre », année déduite de la date, civilité et groupe gardés — v2.116.0), couleurs de groupe en Vue Élève écartées, projection et accessibilité clavier écartées), `audit-type-d-2026-08-02.md`, `audit-ergonomie-2026-10-03.md` (audit n° 2, architecture de l'information : où trouver / où régler / comment comprendre, sur la v2.68.0 — 15 priorités, plan d'action en lots A–G, rien de codé à sa rédaction ; lots A–G faits en v2.68–2.73, lot H en v2.147.0 — ce qui reste est listé en fin de document), `screenshots/`. Toute note d'audit va là, pas dans un worktree.
⚠️ **Les fichiers de données ne sont PAS dans ce dossier** — ils vivent dans le dossier
VOISIN `../Plan de classe json/` (88 fichiers au 2026-09-10). La distinction n'est pas
cosmétique : c'est elle qui rend possible l'exclusion Nextcloud ci-dessous. Le code est
transporté par git, les données par Nextcloud, et les deux ne se croisent jamais.
Les motifs restent dans `.gitignore` par sécurité, au cas où un export atterrirait ici.
- `plan-classe-AAAA-MM-JJ-HHhMMmSS.json` — exports manuels horodatés (non versionnés)
- `plan-classe-auto.json` — fichier de sync auto (écrasé en continu, non versionné)
- `plan-classe-bk-AAAA-MM-JJ-HHhMMm.json` — backups horodatés (rétention par paliers, non versionnés)

## ⚠️ Ce dossier ne doit PAS être synchronisé par Nextcloud

Il est dans une arborescence Nextcloud, mais c'est un **dépôt git**, et git assure déjà le
transport entre les machines via `github.com/Belenos-Toutatis/plan-de-classe`.

**Ce n'est pas une précaution théorique : la collision a déjà eu lieu ici, trois fois.**

1. Une copie de conflit Nextcloud a été **commitée par erreur** — d'où la règle
   `*.sync-conflict-*` du `.gitignore` (commit `e4798e6`).
2. Le **2026-06-19, entre 17h15 et 17h21**, cinq fichiers **internes de git** sont entrés en
   conflit : `.git/index`, `COMMIT_EDITMSG`, `logs/HEAD`, `logs/refs/heads/main`,
   `logs/refs/remotes/origin/main`. Nextcloud a livré le `.git` d'une machine pendant que git
   écrivait sur l'autre.
3. Le même jour, une copie de conflit de `plan de classe.html` lui-même.

Ce jour-là on s'en est tirés : la collision a touché l'index et les **journaux** de
références. Si elle avait touché `refs/heads/main` ou un fichier d'objet, la perte aurait été
réelle — et découverte des semaines plus tard. `git fsck` ne montre d'ailleurs **aucune
corruption** : les « objets fantômes » qu'il liste sont du résidu normal de `git stash` et de
`commit --amend`, datés de mai et juin, sans rapport avec le 19 juin. ⚠️ Ne pas confondre les
deux — un fantôme n'est pas un dégât.

### Où se pose l'exclusion — et où elle ne sert à RIEN

⚠️ **Le client ne lit qu'UN fichier d'exclusion « dans l'arbre » : `~/Nextcloud/.sync-exclude.lst`,
à la RACINE du dossier synchronisé.** Un `.sync-exclude.lst` déposé dans un sous-dossier
comme celui-ci est **inerte** : il n'est pas lu, il est synchronisé comme un fichier
ordinaire. (Erreur commise puis corrigée le 2026-09-10 — le nom apparaît dans le binaire du
client, ce qui dit qu'il est connu, pas où il est cherché.)

La règle est donc, à la racine, un chemin relatif :

```
gestion élèves/Plan de classe
```

💡 Ce fichier étant lui-même synchronisé, il atteint les autres machines tout seul. Le client
l'a relu **sans redémarrage**.

⚠️ **Le dossier de DONNÉES n'est pas visé** : `gestion élèves/Plan de classe json/`
(88 fichiers) est un dossier VOISIN, pas un sous-dossier. Le motif ne l'atteint pas et sa
synchronisation continue — vérifié par un témoin déposé dedans, qui est bien parti.

### Comment le VÉRIFIER — deux pièges de mesure

⚠️ **Compter les entrées du journal de sync ne prouve rien** : la table `metadata` enregistre
ce qui a été synchronisé par le passé, elle ne se vide pas quand on exclut.

⚠️ **Lire ce journal avec `immutable=1` renvoie un instantané périmé** — SQLite ignore alors
le WAL. Copier les trois fichiers (`.db`, `-wal`, `-shm`) et interroger la copie.

**Le seul test valable est une SONDE avec son TÉMOIN** : un fichier déposé dans le dossier
censé être exclu, un autre dans un dossier certainement synchronisé, et on regarde lequel
arrive. Sans témoin, « rien n'est arrivé » peut vouloir dire que le client ne tournait pas.

⚠️ **Corollaire** : ce dossier n'est plus sauvegardé par Nextcloud. Le filet, c'est GitHub —
donc **le travail non commité n'est protégé par rien**. (`plan de classe.html.bak`, la copie
manuelle avant modification lourde, reste locale et non sauvegardée : c'est son rôle.)

💡 Le même dispositif couvre le projet voisin **Suivi PP**, par un second motif dans le même
fichier racine.

## Git — branches, worktrees, fins de ligne

État de référence au **2026-09-11** : une seule branche locale, `main`, alignée sur `origin/main` ; aucun worktree. Les branches `claude/*` locales (`jovial-goldberg-54e463`, `eval-type-d`, `print-contrast`) ont été supprimées après vérification `git merge-base --is-ancestor <branche> main`. Reste sur GitHub seulement `origin/claude/qcm-cam-marker-generator-e29kzq` : **un commit non fusionné** du 2026-07-21, *« docs : note de suivi migration marqueurs QCMCam (nouvelle biblio js-aruco2) »* — à récupérer dans `docs/` ou à supprimer, décision non prise.

### Un worktree se périme vite — vérifier avant de coder
Le fichier réel est celui du dépôt principal (`main`, servi par GitHub Pages). Un worktree ouvert par l'app peut être **très en retard** : le 2026-09-11, `jovial-goldberg` était à la v2.27.2 quand `main` était à la v2.51.0 (66 commits), et portait un brouillon Type D non commité **déjà présent sur `main` en version corrigée** (`7ab434c`, `509fcc8`…). Coder là aurait fait régresser. Réflexe : comparer `APP_VERSION` du worktree et de `plan de classe.html` à la racine, ou `git log --oneline <branche>..main | wc -l`.

Voie propre quand le worktree est périmé ET porte du travail d'une autre session : ne pas y toucher ; `git worktree add ../<nom> -b claude/<nom> main`, coder, tester, commiter, puis `git -C <racine> merge --ff-only claude/<nom>`, puis `git worktree remove` + `git branch -D`. ⚠️ `git branch -d` depuis un worktree compare à la **branche courante**, pas à `main` → « not fully merged » trompeur ; trancher avec `merge-base --is-ancestor`. ⚠️ On ne peut pas supprimer le dossier d'un worktree **depuis une session qui y a son répertoire de travail** (« Permission denied » / « resource busy ») : git purge les fichiers et l'enregistrement, le dossier vide tombe à la fermeture de la session.

### Fusion refusée à cause d'un fichier modifié dans le dépôt principal
`merge --ff-only` échoue si le checkout principal a une modification non commitée sur un fichier que le commit touche (cas vécu : `CLAUDE.md`). Procédure validée par l'utilisateur : `git diff > patch` + `git checkout -- <fichier>`, fast-forward, `git apply --3way patch`, `git reset <fichier>` pour le laisser **non indexé** comme avant. Vérifier d'abord que la modification n'est pas déjà commitée ailleurs — le 2026-09-11, le « WIP » local de `CLAUDE.md` était le brouillon exact de `c2cf87e`, déjà sur GitHub et remplacé par `4cb9b13` : il a été écarté, pas réappliqué.

### Fins de ligne : le dépôt et TOUTES les copies sur disque sont en LF
`core.autocrlf=true` vient du **gitconfig système** (`C:/Program Files/Git/etc/gitconfig`), pas du projet. Conséquences : un `git worktree add` ou un `git checkout`/`merge` qui réécrit un fichier le sort en **CRLF**, alors que les fichiers de travail sont en LF (les outils d'édition les réécrivent ainsi). Après toute opération git qui réécrit `plan de classe.html` / `CLAUDE.md` / `test/*.js`, repasser en LF (`s.replace('\r\n','\n')`), puis `git add <fichier>` pour rafraîchir l'entrée d'index — sinon `git status` marque le fichier modifié alors que `git diff` est vide. ⚠️ Un script de patch qui cherche des ancres textuelles **ne matche rien** sur une copie CRLF : mesurer avec `s.count('\r\n')` en Python, pas avec `grep -c $'\r'` (peu fiable ici).

### Détection de MAJ et rebase
L'app compare `APP_BUILD_DATE` à la **date d'auteur** du dernier commit GitHub (`commit.author.date`, préservée par un rebase) — pas à la date de committer. Un rebase avant push ne crée donc pas de fausse alerte « MAJ disponible » tant que `APP_BUILD_DATE` a été posée à l'heure UTC réelle du commit d'origine (`date -u`).

## Raccourcis clavier
| Raccourci | Action |
|---|---|
| `Esc` | Fermer modals / désélectionner élèves |
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` ou `Ctrl+Maj+Z` | Rétablir (mot fixé : jamais « Refaire » ; tout bouton ↩ Annuler a son ↪ Rétablir à côté) |
| `Ctrl+P` | Imprimer selon l'onglet actif (Plan, Vue Élève, Tablettes, Config, Élèves, Classes) ou ouvrir la modale "🎯 Marqueurs ArUco" sur l'onglet QCMCam |
| `+` / `-` / `=` | Zoom in / out / reset |

**Ctrl+Z / Ctrl+Y depuis n'importe quel écran ou modale.** Le gestionnaire clavier global ne laisse la main au navigateur que si la cible est une **saisie de texte** (`_isTextEntryTarget` : input texte/nombre/date…, textarea, contenteditable) — là, Ctrl+Z est l'annulation native de la frappe. ⚠️ Cases à cocher, radios, curseurs, boutons et `<select>` gardent le focus après un clic sans avoir d'undo natif : l'ancien garde « `tag === 'INPUT'` » y rendait Ctrl+Z **muet** (cocher un aménagement dans Modifier puis Ctrl+Z ne faisait rien — trouvé à l'audit). Après undo/redo, l'onglet courant est re-rendu ET les **modales de consultation ouvertes** le sont aussi via `_MODAL_RERENDER` / `_refreshOpenConsultModals` (fiche, historique, rappels, tags, liens, vue d'ensemble, stats d'appel, appels passés, snapshots, mentions de conseil, disciplines, compétences) — sans ça le modèle revient mais la fenêtre reste figée sur l'ancien état. Les modales **à formulaire** (`me`, `ms`, `meval-new`…) n'y sont volontairement pas : les re-rendre effacerait la saisie en cours. **Tout nouveau panneau de consultation s'ajoute à `_MODAL_RERENDER`.**

Le zoom du Plan Prof et de la Vue Élève est **persisté** (`localStorage.planClasse_tgZoom` / `planClasse_svZoom`, restauré au chargement via `svApplyZoom()`/`tgApplyZoom()` appelés en fin de définition du module zoom) — un F5 en classe ne remet plus le plan à 100 %.
| `0` / `1` / `2` / `3` | Filtre groupe : Tous / G1 / G2 / G3 |
| `A` | Toggle mode appel (en Plan Prof) |
| `D` / `T` | Surligne les élèves à sujet agrandi / à tiers-temps (en Plan Prof) |

## Vérification des mises à jour (modal `mupdate`)

Bouton **🆕 Maj** dans le header → `checkForUpdate()` qui interroge l'API publique GitHub (`/repos/<user>/<repo>/commits/main`, sans auth, limite 60 req/h/IP) et compare la date du dernier commit avec la constante **`APP_BUILD_DATE`** (format ISO `'YYYY-MM-DDTHH:MM:SSZ'`, à incrémenter manuellement avant chaque push). La version **affichée** à l'utilisateur est un **semver** dans `APP_VERSION` (ex. `'1.0.0'`) — découplée de la détection.

Constantes en haut du `<script>` :
```js
const APP_VERSION    = '2.12.1';                // semver affiché (PATCH/MINOR/MAJOR) — exemple, valeur réelle en tête du <script>
const APP_BUILD_DATE = '2026-06-09T22:11:00Z';  // date ISO — sert UNIQUEMENT à la détection MAJ
const APP_UPDATE_TOLERANCE_MS = 10 * 60 * 1000; // marge avant de crier « MAJ dispo »
const APP_REPO_USER  = 'Belenos-Toutatis';
const APP_REPO_NAME  = 'plan-de-classe';
```

⚠️ **La détection interroge les commits qui touchent `plan de classe.html`**, pas le dernier commit du dépôt (`?path=<fichier>&sha=main&per_page=1`, qui renvoie un **tableau**). Sans ce filtre, un commit de documentation, de tests ou de `package-lock.json` devient « le dernier commit sur main », sa date dépasse `APP_BUILD_DATE` de plus que la tolérance, et **l'app s'annonce périmée à elle-même**. Constaté en usage réel juste après la 2.39.0 : un commit de verrou npm poussé 36 min plus tard a déclenché l'alerte sur une version pourtant à jour. Le cache de la pastille porte un numéro (`_UPDATE_BADGE_CACHE_V`) pour que les entrées écrites par l'ancienne logique ne fassent pas survivre la fausse alerte pendant les 6 h de TTL.

**Comparaison robuste** : la détection (`checkForUpdate`, `_passiveUpdateCheck`) fait `(Date.parse(latestCommit) - Date.parse(APP_BUILD_DATE)) > APP_UPDATE_TOLERANCE_MS` → MAJ dispo. **Numérique via `Date.parse`** (pas une comparaison de chaînes) car GitHub renvoie la date AVEC décalage (`…T07:05:39+02:00`, pas normalisée en `Z`) → une comparaison textuelle serait faussée par le fuseau. La **tolérance** (10 min) absorbe le délai entre « je fige `APP_BUILD_DATE` » et « le commit s'horodate » (sinon faux positif « MAJ dispo » sur sa propre version, cf. incident 2026-05-30 où une date de build estimée 1 h 35 trop tôt déclenchait l'alerte).

⚠️ **À bumper à chaque push** : `APP_BUILD_DATE` (toujours — la régler sur l'**heure UTC réelle** via `date -u +"%Y-%m-%dT%H:%M:%SZ"`, pas une estimation) et `APP_VERSION` quand la release le mérite. ⚠️ **Poser `APP_BUILD_DATE` dans la MÊME commande que le `git commit`**, pas à la fin du code : la tolérance de 10 min est vite dépassée si on attend entre les deux (relecture, CLAUDE.md, accord de l'utilisateur). Incident du 2026-09-27 (v2.61.3) : date posée 10 min 05 s avant le commit → l'app en ligne se disait « pas à jour » malgré les rechargements, corrigé par `7b21e26` qui ne recale que la date. Un commit pushé ne se réécrit pas : on corrige par un nouveau commit, pas par `--amend` + force push. L'affichage (header chip `v X.Y.Z`, modales, `about-version-disp`) utilise `APP_VERSION`.

Comportement :
- ✅ **À jour** : message vert + version locale + date du dernier commit GitHub avec lien vers le commit (SHA tronqué).
- 🆕 **MAJ disponible** : message orange avec date locale, date GitHub, message du dernier commit, et boutons d'action adaptés au contexte :
  - **Détection en ligne / local** : `window.location.hostname.endsWith('github.io')` → en ligne (GitHub Pages) sinon local.
  - **En ligne** : bouton **🔄 Recharger maintenant** (`window.location.reload(true)` pour forcer le bypass cache + service worker).
  - **Local** : bouton **📥 Télécharger le ZIP** (`<repo>/archive/refs/heads/main.zip`) + bouton **🌐 Ou utiliser en ligne** (vers GitHub Pages).
- ⚠️ **Erreur** (offline / rate limit / timeout) : message rouge avec causes possibles et lien vers le repo pour vérification manuelle.

Helper `_formatRelDate(isoDate)` : convertit une date ISO en `JJ/MM/AAAA (il y a Xh / Xj / Xmois / Xan)` pour affichage human-friendly.

**Pastille rouge passive sur le bouton ⓘ** (`#btn-about`, classe `.has-update`) : posée par `_passiveUpdateCheck()` appelé 2 s après `init()`.
- En ligne (`window.location.hostname.endsWith('github.io')`) : pastille dès qu'une version plus récente existe sur GitHub.
- En local : pastille seulement si la version locale est ≥ 7 jours plus ancienne que le dernier commit (constantes `_UPDATE_BADGE_LOCAL_MS`).
- Résultat de l'appel GitHub mis en cache 6 h (`localStorage.planClasse_updateCheck = {ts, latestDate}`) pour éviter de saturer la limite 60 req/h/IP.
- CSS : `.hdr-btn.has-update::after` affiche un disque rouge `#e74c3c` 9 px en haut à droite, animation `hdrPulse` 2.2 s. Tooltip enrichi (« 🆕 Mise à jour : votre version a plus d'une semaine (X jours)… »).
- Si offline ou rate-limit : pas de pastille (échec silencieux, on retentera au prochain démarrage).

## Conventions de développement
- Barre du Plan en trois rangées, Vue Élève et fenêtre de projection : `docs/memoire/plan-salles.md`.
- **Instantanés : 🔖** (v2.98.1) au lieu de 📸, qu'on confondait avec 📷 Photos — partout (barres, menus, fenêtres, glossaire).
- **Barres d'outils groupées (v2.73.0)** : `.tb-grp` (filet gauche) + `.tb-grp-lbl` (petit libellé mono). Élèves (v2.94.0) : Élèves (**+ Ajouter ▾** depuis v2.116.0 : Un élève · Plusieurs élèves = l'import · Une classe — le bouton « ⬆ Importer » a disparu) · Photos · Suivi (📊 Vue d'ensemble, v2.117.0 — « 📍 Saisir les positions » a été **retiré** : doublon de la colonne Position, de son clic droit et du Plan ; modale `mse` et fonctions `startSeatingEntry` / `mse*` supprimées), tout le reste dans **⋯ Plus ▾** à droite (Tags, Tableau des positions, Instantanés, Vue d'ensemble, Imprimer, remises à zéro) — seules Positions et Photos restent visibles, arbitrage de l'utilisateur ; « 📊 Export » → **🗒 Tableau de la classe**. Plan : Plan · Séance · Placement · ↩ ↪ · Zoom / Afficher. Classes : « 🖨 Bilan » → **🖨 Effectifs**. Un nouveau bouton s'ajoute DANS le groupe qui lui correspond.
- **Ton et vocabulaire (v2.72.0, arbitrage de l'utilisateur)** : **tutoiement partout** (« Clique », « Tu peux »), jamais de vouvoiement dans un nouveau texte. Mots fixés (glossaire dans ⓘ → « 📖 Les mots de l'application ») : ⚙ *Réglages* (toute l'app) · ⚙ *Réglages des évaluations* (communs) · ⚙ *Réglages de l'évaluation* (un devoir) ; *Arrondi* (pas « granulométrie ») ; bouton **✓ Enregistrer** (pas « Sauvegarder ») ; **✏️ Modifier** (pas « Éditer ») ; *Instantané* (pas « snapshot ») ; *Ordre de ramassage* (pas « pattern ») ; **QCMcam** (graphie officielle, nom de l'onglet compris). ⚠️ Les noms INTERNES (`snapshots`, `collectPatterns`, `meanGranularity`, `qcm*`) ne changent pas — seul le texte visible. ⚠️ Une apostrophe ajoutée dans une chaîne JS entre `'…'` casse tout le script (« l'instantané » → `l\'instantané`) : `node --check` sur le script extrait, ou `npm test`, le détecte.
- **Une icône par concept** : 🔖 **seulement** Instantanés (📸 retiré : trop proche de 📷 Photos) · 🆚 **seulement** Comparer les classes · icône des classes recomposées **réglable** (v2.139.0, demande de l'utilisateur) : ⚗️ Alambic par défaut, au choix dans ⚙ Réglages → Réglages rapides parmi ⚗️ 🧺 🪆 🍇 🪢 🫂 🐝 🍱 🧬 (`_recompIcons`, `_recompIcon`, `_setRecompIcon`, réglage de la machine `planClasse_recompIcon`) ; ⚠️ **toute mention d'une classe recomposée passe par `_recompIcon()`** ou par une `<span class="rc-ico">` dans le HTML statique (remplie par `_applyRecompIcon`), jamais un émoji écrit en dur — et aucun de ces émojis ne doit servir à autre chose (v2.86–2.88 : 🧬 remplaçait 🔀, partagé avec le mélange) · ⧉ Copier / Dupliquer · 📋 **seulement** Informations · 📥 Coller · 🗑 supprimer un objet (✕ = retirer une ligne / fermer) · ⛓ Contraintes · 🔒 **seulement** mode confidentiel · 🔀 placement aléatoire / mélange · 🎲 **seulement** Interroger · 📤 Export ENT · 🗂 Ordres de ramassage.
- **Palette des statuts** : une seule, celle des `.spec-*` (cf. *Pastilles d'aménagement*). Toute surface d'écran qui colore un statut lit ces classes — par la classe elle-même, ou par **`_specColors(cls)`** (fond + encre calculés, cache par thème) quand il faut une couleur en style inline (boutons de l'onglet Élèves) ; pastilles `.ctx-sw` dans le menu clic droit.
- ⚠️ **L'app n'est PAS prévue pour un usage 100 % clavier** — décision explicite de l'utilisateur. L'interaction centrale est **spatiale** (glisser un élève sur une table), à la souris, au doigt ou au stylet. Ne pas proposer de rendre focusables les ~150 éléments cliquables de la grille, et ne pas présenter cela comme une lacune. En revanche les **raccourcis existants** (`Échap`, `Ctrl+Z/Y/P`, `+`/`-`/`=`, `0`/`1`/`2`/`3`, `A`) et la validation à `Entrée` dans les modales sont des accélérateurs pour un enseignant en cours : **ne pas les casser**.
- Tout le code reste dans le fichier HTML unique — ne pas éclater en plusieurs fichiers
- CSS dans le `<style>`, JS dans le `<script>` en fin de body
- Pas de dépendances externes (pas de CDN, fonctionne hors-ligne)
- Pile d'undo/redo basée sur `JSON.stringify(S)` (sérialisation complète) ; les accesseurs proxy étant non-énumérables, ils sont exclus de la sérialisation et ré-installés via `applyAccessorsAll()` après `JSON.parse()`
- IndexedDB pour persister les handles de répertoire (sync auto) et QCMCam — clés `'dir'` et `'qcm-dir'`
- Toute action mutante doit appeler `pushUndo()` AVANT la mutation, sinon l'undo capture le mauvais état
- Pour les développements longs : travailler sur une copie `plan de classe new.html`, puis remplacer une fois validé (convention demandée par l'utilisateur)
- Modals empilés (par ex. mhist par-dessus moverview) : utiliser `_modalReturnTo[id]` pour enregistrer un callback à la fermeture, ou bien laisser le modal parent ouvert et bumper le `z-index` du modal enfant à 1010+
- **Jamais de dialogue natif (`alert` / `confirm` / `prompt`)** : utiliser `_uiConfirm(...)`, `_uiPrompt(...)`, `appAlert(...)` ou `toast(msg, 'warn')` (cf. sections dédiées « Zéro dialogue natif »). Le navigateur peut bloquer les dialogues natifs → boutons muets. Il n'en reste AUCUN dans l'app — toute nouvelle fonctionnalité doit respecter cette règle.
- **Tests (`test/`, `npm test`)** : harnais Node (`test/harness.js`) qui extrait le gros `<script>` inline, le charge dans un contexte `vm` avec un DOM stubé, neutralise `init()` et expose un pont `__TESTEVAL(code)` exécutant du code dans la portée lexicale du script (accès à `S` + toutes les fonctions hoistées). `test/run.test.js` (`node:test`) couvre la logique pure à risque : suppression en cascade (`_purgeStudentRefs`/`_deleteStudentInternal`/`deleteClass`), audit d'intégrité (`_auditState`), dates/périodes, parseurs (`_evalArithExpr`, `parseUnavailableInput`), validation d'import. **Aucune dépendance** (Node ≥ 18) ; le harnais n'est PAS livré avec l'app. Lancer `npm test` avant chaque push touchant cette logique.
  - Détail des suites `compat`, `fuzz`, `sync`, `purge-coverage` : `docs/memoire/verification.md`.
  - ⚠️ **Quand tu ajoutes une structure indexée par sid ou classId** : soit tu la purges dans `_purgeStudentRefs` / `_purgeClassRefs` (ou `_forEachEvalPerClassMap` pour une map d'éval keyée par classe), soit tu l'ajoutes aux exceptions avec la raison. Pas de troisième voie — le test donne le chemin exact du reste et le remède dans son message d'échec. Ajouter une section à `S` impose aussi de l'ajouter au tableau `sections` de `_validateImport`, **après avoir vérifié que ses clés légitimes respectent `ID_RE`** (sinon des imports valides seraient rejetés).
  - Chaque famille de balayage porte un **méta-test** qui injecte un cas volontairement non purgé et vérifie que le détecteur le voit. Sans lui, une régression du parcours rendrait la suite silencieusement vacuante — pire que pas de test.

## Fiabilité & sécurité — invariants à respecter

- **Suppression d'un élève = `_purgeStudentRefs(id)`** (source unique de vérité). Retire TOUTES les références à un sid (roster, sièges, tablettes legacy `ipads*` + `ipadsByPool`, `allowedFor`, `aeshLinks`, `noNeighbors`, `membership`, `ev.notes/studentRemarks/passations.niveaux`, `conseilClasse`, `bulletinRemarques`) dans toutes les classes. `_deleteStudentInternal` = `_purgeStudentRefs` + `delete S.eleves[id]`. **Tout nouveau champ indexé par sid DOIT être purgé là.**
- **Suppression d'une classe = `_purgeClassRefs(id)`** (source unique de vérité, **les deux** branches de `deleteClass` — réelle ET recomposée — l'appellent) : purge `attendance`, `snapshots`, `movedHighlights`, `bulletinRemarques`/`ClassRemarques`/`WorkedItems`, `conseilClasse`, `violationsAccepted`, et retire la classe des évals (suppression de l'éval si plus aucune classe vivante via `_evalPrimaryAliveClassId`). La branche réelle supprime d'abord chaque élève via `_deleteStudentInternal`. **Tout nouveau store keyé par classId va dans `_purgeClassRefs`.** Le **rename** d'une classe recomposée (`mvcSave`) migre symétriquement les mêmes structures. Les **maps per-classe des évals** (niveau éval : `dates`/`slotIds`/`datesManual`/`seatingHashes`/`seatingRoomIds` ; niveau mini-note et passation : `dates`/`slotIds`/`datesByGroup`/`slotIdsByGroup`) sont couvertes des deux côtés via le helper **`_forEachEvalPerClassMap(ev, fn)`** — tout nouveau champ d'éval keyé par classId s'ajoute LÀ (purge ET rename en héritent). Le pool `S.seatingSnapshots` est GC à chaque chargement (`_gcSeatingSnapshots` en fin de `postLoadHook` : seuls les hashes référencés par un appel ou une éval sont conservés).
- **`migrateEvalDefaults`** : `nbLevels` (2..6) est déterminé EN PREMIER ; `maitriseColors`/`maitrisePoints` (taille `nbLevels`) et `thresholdPercents` (taille `nbLevels-1`) ne sont régénérés que si leur taille ne correspond PAS (ne JAMAIS forcer `=== 4` → détruisait les configs non-4). Les couleurs (`maitriseColors`, `noteThresholds[].color`) sont passées par `_safeColor` au chargement (anti-XSS sur JSON forgé).
- **`_escJsAttr(s)`** pour tout texte libre passé à un handler inline (`onclick="fn('${...}')"`) : le navigateur HTML-décode l'attribut AVANT de parser le JS, donc `_escAttr` (`'`→`&#39;`) est INSUFFISANT (re-décodé en `'` → breakout). `_escJsAttr` échappe au niveau JS (`\`, `'`, retours-ligne). Utilisé pour les noms de fichiers / `row.nom` CSV du flux d'import QCMcam.
- **`_csvCellGuard(v)`** dans tout échappement de cellule d'export CSV/TSV, AVANT le quoting : une cellule commençant par `=` `+` `-` `@` TAB ou CR est interprétée comme FORMULE par Excel/LibreOffice à l'import (le quoting CSV ne protège pas) → préfixée d'une apostrophe. Branché sur les exports CSV fichier (positions, bilan des notes, notes d'une éval, bilan des compétences) ET les copies presse-papier TSV (Export ENT compétences, copie du bilan par éval) — tout nouveau chemin d'export/copie tabulaire doit passer par ce helper, quel que soit le séparateur.
- **`_auditState({repair})`** lancé en fin de `postLoadHook` : détecte/répare (conservateur) les références orphelines — élèves fantômes (sid hors `S.eleves`), `activeRoom`/`activePool`/`S.cur` invalides, dimensions de salle invalides (`rows`/`cols` non entiers ou hors [1, 40] → valeurs par défaut, `positions_vides` non-array → `[]`). Réutilise `_purgeStudentRefs`. Journalise dans la console + `window.__planClasseErrors`.
- **Gestionnaire d'erreurs global** (`window.error` + `unhandledrejection` → `_logRuntimeError`) : surface un toast discret + garde un journal `window.__planClasseErrors` (50 derniers). Rend visibles les pannes que les `catch{}` avalaient.
- **CSP** (balise `<meta>` en `<head>`) : `connect-src` limité à `'self' + api.github.com` et `img-src 'self' data: blob:` (PAS `*`) bloquent l'exfiltration de données élèves en cas de XSS résiduelle. ⚠️ **`font-src 'self' data:` est INDISPENSABLE** : les 3 polices du design system sont embarquées en `data:font/woff2;base64` — sans cette directive, `default-src 'self'` les bloque et l'app retombe en silence sur les polices système.
- **Échappement au rendu** : toute donnée utilisateur (nom/prénom, libellés, remarques, libellés de créneaux…) injectée en `innerHTML` doit passer par `_escName`/`_escAttr`. `_validateImport` ne nettoie PAS les valeurs (seulement les clés, dont un scan récursif anti prototype-pollution `__proto__`/`constructor`/`prototype`) → la défense est à l'affichage.
- **Tagged template `_html` (code neuf)** : `_html\`<td>${x}</td>\`` échappe automatiquement chaque interpolation ; envelopper un fragment HTML déjà sûr dans `_rawHtml(frag)` pour l'injecter tel quel. À préférer aux concaténations manuelles pour ne plus oublier d'`_esc`.
- **Lint anti-XSS (`test/xss-lint.test.js`)** : échoue si un champ à haute confiance d'être de la donnée utilisateur (`prenom`/`nom`/`nomCourt`/`nomLong`/`descriptif`/`remarque`/`abbr`/`prefix`/`name`) est interpolé en clair (sans `_esc*`, accès direct sans appel de fonction) dans une ligne contenant un fragment HTML. Garde-fou anti-régression — lancé par `npm test`. (`label`/`code` exclus volontairement : aujourd'hui portés uniquement par des constantes internes — les ajouter créerait du bruit sans site utilisateur à protéger.)
- **Moyenne — facultatives `improveOnly`** : `_computeStudentMeanForPeriod` ET son miroir `_computeStudentFacultativeCounted` (hachuré « non comptée » du Bilan) appliquent d'abord les modes déterministes (`over10`/`bonus`), puis les `improveOnly` **triées par note décroissante** (ordre optimal ET déterministe : on inclut exactement les notes au-dessus de la moyenne finale). Les **deux** fonctions DOIVENT rester alignées.
- **Tri des passations Type B** (`last`/`weightedRecency`) : utilise la date PER-CLASSE de l'élève (`_passDateFor(p, S.eleves[sid].classe_id)`, ou `classId` direct dans `_aggregateStudentCompetence`/`_evalDateFor`), pas la date globale `p.date` (= max des classes sur une éval multi-classes → ordre faux).
- **Match import CSV QCMcam** (`_qcmcamMatchStudent`, étage 2) : si le préfixe de nom du CSV contredit le candidat prénom (`filt.length === 0`), on renvoie **`ambig`** (jamais `ok` auto, même candidat unique) → l'utilisateur tranche, pas de note au mauvais élève.
- **Affichage n° de position** : `_qcmDisplayLabel(cls, r, c, cols)` renvoie **`🚫`** pour une place sans numéro QCM (overflow > `ARUCO_MAX` / exclue) au lieu d'un numéro legacy `r*10+pos` trompeur (non re-saisissable, risque de collision). Sans salle active → fallback legacy. Utilisé partout où on affiche un n° de position (`refreshPosInputs`/`onPosBlur` cohérents, liste Élèves, export, plan d'appel).
- **`switchClass` purge l'état d'appel de la classe QUITTÉE** : si on change de classe en mode appel, en édition d'un appel passé, **OU en état post-appel** (`_appelSavedSlot` non null même avec `_appelMode` false — condition élargie, une garde limitée à `_appelMode || _editingAttendanceId` ratait ce 3ᵉ cas), `_absentToday`/`_lateToday`/`_aeshAbsentToday`/`_editingAttendanceId`/`_appelMode`/`_appelSavedSlot` sont vidés AVANT de changer `S.cur` (sinon les absents « fuyaient » sur la nouvelle classe). **Défense en profondeur** dans `_doSaveAttendance` : `absents`/`retards` sont filtrés par appartenance à la classe (`cls.eleves.includes(sid)`, avec repli sur l'identité du record précédent pour les élèves supprimés depuis) avant écriture — un sid étranger ne peut plus s'enregistrer même si un appel de la logique amont était contourné. `editAttendance` (bascule de classe depuis « Appels passés ») passe par `switchClass()` plutôt que de muter `S.cur` directement, pour bénéficier de la même purge. `renderStudentView` appelle aussi `_absencesAutoReset()` (comme `renderTeacherGrid`) pour ne pas laisser le visuel d'absence figé en Vue Élève après la fin du créneau.
- **Détection de doublon d'appel** (`_findExistingAttendance`) inclut le **groupe** : un appel G1 puis un appel G2 sur le même créneau sont des records DISTINCTS (le 2nd n'écrase plus le 1er).
- **Mélange aléatoire** (`_runRandomPlacement`) : la boucle des 30 essais restaure `room.aeshSeating` ET passe une **copie fraîche** de `studentsToPlace` à chaque essai, et capture `aeshSeating` dans `best`. Sinon : collision élève/AESH (positions AESH du dernier essai avec le seating d'un essai antérieur) et élèves liés à une AESH laissés non placés.
- **`pushUndo()` dans `addStudent` et `saveEdit`** : ajout et édition d'élève (y compris changement de classe) sont annulables — la modale d'édition promet « Ctrl+Z ».
- **`_applyReloadedData` vide `undoStack`/`redoStack`** : un rechargement disque (sync d'un autre appareil) n'est pas une action annulable de la session → évite qu'un Ctrl+Z ramène l'ancien état local par-dessus les données distantes.

## Confirmations in-app (`_uiConfirm` / modale `mconfirm2`)

Tous les `confirm()` natifs ont été remplacés par une **modale interne bloquante** `mconfirm2`, pilotée par le helper :

```js
_uiConfirm({
  title,            // titre de la modale
  message,          // texte (les \n sont rendus via white-space:pre-line)
  okLabel,          // libellé du bouton de validation (défaut « Confirmer »)
  okClass,          // classe du bouton OK : 'btn-p' (défaut) | 'btn-d' (danger) | 'btn-w' (warning)
  onOk,             // callback exécuté à la validation
  onCancel,         // callback exécuté si fermeture sans valider (Annuler / Échap / clic fond)
  closeFirst,       // id d'une modale à fermer d'abord (ex. 'mreset') avant d'afficher mconfirm2
});
```

**Pourquoi** : un `confirm()` natif bloqué par l'anti-popup du navigateur (case « empêcher cette page d'ouvrir des boîtes de dialogue ») renvoie `false` silencieusement → l'action ne se déclenche jamais, le bouton paraît cassé. La modale interne n'est jamais bloquée.

**Clavier** : `_uiConfirm` pose le focus sur le bouton principal (`#mconfirm2-ok`) 60 ms après ouverture → **Entrée confirme** (parité avec `confirm()` natif), Échap annule, et le focus trap de la modale devient effectif (il exige un focus initial à l'intérieur de la modale pour intercepter Tab).

⚠️ **Une modale s'ouvre par `openMod(id)`, JAMAIS par `classList.add('on')`** — c'est `openMod`
qui pose `role="dialog"`, `aria-modal="true"`, le piège de focus et l'autofocus. Deux ouvreurs
contournaient la fonction jusqu'en 2.79.0 (`editClass` → `mce`, `listAndShowFiles` → `mfiles`) :
mesuré sur `mce`, ni `role`, ni `aria-modal`, focus laissé sur `<body>`, donc **aucun piège de
focus** (Échap fermait quand même, le handler global agit sur `.mo.on`). 💡 L'audit du
2026-09-05 annonçait pourtant 90/90 : il ouvrait **tout** par `openMod`, ce qui masque
exactement ce défaut-là. Pour le détecter, il faut appeler le **vrai ouvreur** de chaque modale.

**Auto-focus générique des modales** : `openMod(id)` focalise le premier élément portant l'attribut **`data-autofocus`** dans la modale (60 ms après ouverture, sans voler un focus déjà posé par l'appelant). **Sans champ `data-autofocus`, le focus est posé sur la boîte `.mb` elle-même** (`tabindex="-1"`, `.mb:focus{outline:none}`) : l'audit du 2026-09-05 a montré que **85 modales sur 90** laissaient le focus DERRIÈRE la modale — Tab parcourait la page masquée, le focus trap ne s'enclenchait jamais et le lecteur d'écran n'annonçait pas le dialogue. Focaliser la boîte plutôt que le premier bouton évite un bouton « pré-appuyé » à l'ouverture. Vérifié : 90/90 modales reçoivent le focus et se ferment à Échap. Posé sur : `nc-id` (mc), `ns-nom` (ms), `es-nom` (me), `nsl-nom` (msalle), `msaveatt-label` (msaveatt). Ces mêmes modales valident à **Entrée** (handlers inline `onkeydown` sur leurs inputs texte/number/date → bouton principal). Pour toute nouvelle modale à formulaire : poser `data-autofocus` sur le premier champ utile + Entrée = action principale.

**Échap hors modale** : le handler clavier global ignore les sorties de mode (appel, contraintes, sélection) quand le focus est dans un champ HORS modale — cas particulier : Échap dans `#unpl-search` (filtre 🔍 des non-placés) vide le champ et rafraîchit la liste. Échap dans un champ DANS une modale ferme la modale (comportement historique conservé).

**Modale ⏰ Retard (`mlate`)** : remplace le `prompt()` natif du clic droit en mode appel — `promptLateForStudent(sid)` ouvre une modale avec `<input type="time">` pré-rempli à l'heure courante (ou l'heure du retard existant), Entrée = enregistrer, bouton « ↺ Retirer le retard » visible seulement si l'élève est déjà marqué en retard. Helpers `_lateConfirm()` / `_lateRemove()`, sid courant dans `_lateSid`.

**Année scolaire par défaut** : `_defaultSchoolYear()` (bascule au 1er août — août-décembre → année civile courante, janvier-juillet → année précédente). Utilisée par `openMod('mc')` pour pré-remplir `#nc-yr` (plus de `2025` codé en dur) et comme fallback de `createClass`.

## Saisie in-app (`_uiPrompt` / modale `mprompt2`)

Pendant « saisie de texte » de `_uiConfirm` — remplace les `prompt()` natifs (même risque anti-popup). `_uiPrompt({ title, label, value, placeholder, maxlength, okLabel, required, onOk, onCancel })` → `onOk(valeurTrimée)`. `required` (défaut true) : un champ vide ne valide pas (toast + focus). Entrée = valider, champ pré-sélectionné à l'ouverture, s'empile au-dessus de la modale appelante. Utilisée par : renommage d'appel (`renameAttendance`), renommage de snapshot (`snapshotRename`).

Conversions apparentées (plus AUCUN `prompt()` dans l'app) :
- **Nouvelle classe mobile** : modale `mpool-new` (`addTabletPool` → `confirmNewTabletPool`) — `<select>` « Partir de » (vierge ou duplication d'un pool) + nom avec suggestion auto « X (copie) » (`_mpoolNewDupChange`, ne remplace jamais une saisie manuelle via `dataset.suggested`).
- **Édition d'un lien perso** : le formulaire d'ajout de la modale `mlinks` bascule en mode édition (`editUserLinkPrompt` pré-remplit les 3 champs, `_mlinksEditIdx` non-null, bouton « ✓ Modifier » + « ✕ Annuler ») ; `addUserLinkFromInputs` met à jour en place si `_mlinksEditIdx != null`. `_resetMlinksAddForm` sort du mode édition ; suppression/réordonnancement d'un lien pendant une édition la réinitialise (index non fiable).

## États vides actionnables

Helper **`_emptyStateHTML(icon, title, hintHTML)`** (classe CSS `.empty-state` — patron du bandeau îlots : fond paper-warm, bordure dashed, centré) : tout état vide doit dire QUOI faire, pas juste « c'est vide ». Variante **`_needClassHTML(pour)`** (« Aucune classe sélectionnée » + pointeur vers le sélecteur du bandeau), partagée par les onglets Élèves / Plan / Vue Élève / Tablettes / QCMCam / Export / Devoirs / Bilans. Cas notables : « Aucun élève » pointe vers ⬆ Importer / + Ajouter ; le Bilan des notes gère « classe sans évaluation » (early return avant construction du tableau) ; les listes vides des modales (disciplines, compétences, commentaires, patterns) nomment leur action de création.

## Zéro dialogue natif

Plus AUCUN `alert()` / `confirm()` / `prompt()` natif dans l'app (blocables par l'anti-popup). Conventions :
- **Préconditions & résultats vides** (« Sélectionnez une classe », « Aucun élève à imprimer »…) → `toast('⚠️ …', 'warn')` non bloquant.
- **Validations de formulaire** → `toast(…, 'warn')` + `focus()` sur le champ fautif.
- **Erreurs de fichier** (lecture/parse/corruption JSON) → `appAlert(titre, message, 'error')` (modale stylée, multi-ligne).
- Confirmations → `_uiConfirm` · saisies → `_uiPrompt` · retard → modale `mlate`.

## Tactile (`@media (pointer: coarse)`)

⚠️ **Ce bloc s'applique réellement sur la Surface de l'utilisateur** (vérifié le 2026-09-11) : Chrome y déclare le pointeur principal « coarse » (écran tactile, mode tablette / sans souris), donc tous les boutons y sont rendus plus larges — pas seulement sur iPad. Conséquence : **toute largeur figée en dur autour de boutons `.btn-sm` casse là-bas** et seulement là-bas (cas vécu : la carte 🎲 Interroger à 300 px tronquait son 3ᵉ bouton — corrigé par une mesure du contenu réel, cf. `_pickMeasureCard`). Réflexe pour tout défaut « uniquement sur cet ordinateur » : `matchMedia('(pointer: coarse)').matches` dans la console, et tester avec un `<style>` injecté qui reproduit `.btn-sm{padding:9px 13px;font-size:.95em}` (l'émulation tactile du panneau d'aperçu est instable, cf. la note du 🎲 Interroger).

Bloc en **fin de `<style>`** (doit battre le bloc COMPACTION à spécificité égale) : n'affecte QUE les écrans tactiles (Surface/iPad/Android), rien ne change à la souris. Agrandit : header/nav (annule la compaction), `.btn-sm`/`.gchip`/`.tagchip` des toolbars, contrôles internes des cellules du plan (`.cctr`, `.cell-unplace`, `.isel`, `.cipad`), inputs du tableur d'éval, `.counter-input`, cases à cocher/radios. ⚠️ Ressenti réel à valider sur l'appareil.

**Retard en mode appel — appui long maison** : les cellules du mode appel (buildCell, branche appel) portent un timer `touchstart` 550 ms → `promptLateForStudent` (iOS/iPadOS n'émet JAMAIS `contextmenu` au doigt, contrairement à Windows/Android qui le synthétisent). Garde anti-double-ouverture dans `promptLateForStudent` (modale `mlate` déjà ouverte → no-op) car sur Surface/Android l'appui long déclenche l'OS ET le timer. `touchend` avale le click synthétique après déclenchement (sinon toggle absent par-dessus).

## Responsive — téléphone et tablette (bloc CSS en fin de `<style>`, après le bloc tactile)

⚠️ **Le bandeau de droite du header a son PROPRE point de rupture (900 px), pas celui du reste.**
`#hdr-right` (🔗 ⚙ · Sync · ● Non exporté · 📂 Ouvrir · 💾 Données · 🔒 ⏲ 🎙 ⓘ ◐) mesurait 676 px
quand le repli a été calé sur 760 ; le minuteur et le sonomètre l'ont porté à **774 px**, et il
débordait donc de la page entre 761 et ~843 px — mesuré le 2026-10-06 : **844 px de `scrollWidth`
pour un viewport de 768** (iPad / Surface en portrait) et de 812 (téléphone en paysage), soit un
défilement horizontal sur TOUS les onglets. La passe du 2026-09-05 testait pourtant 768×1024 et
relevait 0 : c'est une **régression** apportée par les boutons ajoutés depuis. Corrigé en 2.79.0
par un `@media (max-width: 900px)` dédié (header + nav), les autres règles restant à 760.
**Tout bouton ajouté au header impose de re-mesurer `#hdr-right.getBoundingClientRect().width`**
et, si besoin, de remonter ce 900.

Audit du 2026-09-05 sur 4 gabarits (375×812, 812×375, 768×1024, 1024×768), via un auditeur injecté qui mesure `scrollWidth − clientWidth` et liste les éléments dont le bord droit dépasse l'écran sans ancêtre défilant. **Invariant : aucun élément ne doit élargir la page.** Sur un téléphone, un seul débordement (le bandeau d'onglets, 403 px : `.tab-group` est un flex sans `wrap`) faisait grandir le viewport de mise en page à 778 px — et **tout** se dimensionnait alors sur cette largeur fantôme, les modales `position:fixed` comprises (`.mb` de 778 px sur un écran de 375). Corriger le débordement racine a réglé les modales sans les toucher.

- **Conteneurs qui défilent en interne** (toutes tailles, `overflow-x:auto`) : `#stl` (table Élèves, 1 218 px — débordait même sur tablette paysage), `.recap-photocopies` (bilan des classes), `#cfg-slots-list` (horaires), `.qcm-plan-wrap`, `#tg-zoom-wrap` / `#sv-zoom-wrap`.
- **`@media (max-width: 760px)`** : `.tab-group` et `#hdr-right` passent à la ligne · `.sh > div/span` perdent leur `margin-left:auto` et wrappent · `.cc > div`, chips de Config Salle, `.bsg-row` wrappent · `.mb` bornée à `calc(100vw − 12px)` · `.tp{align-items:stretch}` + `.tp-main{width:100%}` (sinon, en colonne, le plan prend sa largeur de contenu et ne peut pas défiler dans son conteneur) · `#tg-count` en `white-space:normal !important` (posé en ligne) · **`#topbar` collé en haut sauf s'il prend plus du tiers de l'écran** (v2.143.5, `_topbarFit` → `body.topbar-free`, d'après la hauteur RÉELLE du bandeau) : la règle « largeur ≤ 760 px → static » faisait défiler le bandeau dans une fenêtre étroite d'ordinateur (signalé par l'utilisateur) ; sur un téléphone en portrait (≈ 280 px sur 812) il défile toujours avec la page.
- **Cibles tactiles** ajoutées au bloc `pointer: coarse` : mentions de conseil du Bilan des notes, croix ✕ des modes d'emploi, icônes 📋 de copie de colonne (mesurées 24×20, 24×19, 26×18).
- 💡 `window.innerWidth` **ment** dès que la page déborde (il suit le viewport de mise en page élargi) : mesurer avec `document.documentElement.clientWidth`. Un premier passage de l'auditeur avec `innerWidth` sous-détectait tous les débordements sauf le plus large.
- Score après la passe : **0 débordement sur les 9 onglets × 4 gabarits**, 11 modales à 363 px de large sur un écran de 375. Non vérifié : le ressenti au doigt sur l'appareil réel.

## Garde-fous destructifs

- **`setCfgDimensions`** (Config Salle, champs Rangées/Colonnes) : une RÉDUCTION qui détruirait des places occupées (élèves ou AESH, toutes classes de la salle confondues) affiche un `_uiConfirm` chiffré par classe AVANT d'appliquer ; Annuler restaure les valeurs des champs. Zone vide → application directe sans friction. `pushUndo` déplacé dans le worker `_apply` (plus de pushUndo sur no-op).
- **« ↺ Tout présent »** (`clearAbsences`) : l'état d'appel étant transient (hors undoStack), l'effacement sauvegarde d'abord dans `_appelUndoBackup` (mémoire seule, non persisté) → bouton **« ↩ Rétablir l'appel effacé »** dans le bandeau du mode appel (`restoreClearedAppel`). Invalidé à : sortie/entrée du mode appel, changement de classe, annulation d'édition, minuit/fin de créneau (`_absencesAutoReset`). La confirmation mentionne explicitement la non-annulabilité par Ctrl+Z.

**Patterns de conversion** :
- Cas simple `if (!confirm(msg)) return; <body>` → mettre `<body>` dans `onOk: () => { ... }`.
- Confirmation au milieu d'une fonction avec du code commun après → extraire le code commun dans un worker (`const _finish = () => {...}` / `_commit` / `_proceed`), brancher : `if (cond) { _uiConfirm({..., onOk: _commit}); return; } _commit();`.
- Confirmation avec branche `else` (ex. rechargement fichier qui note un timestamp au refus) → utiliser `onCancel`.
- `_uiConfirm` n'est PAS bloquant au sens JS (pas de valeur de retour) : tout ce qui suivait le `confirm()` doit passer dans `onOk`/`onCancel`, pas après l'appel.

**Cas particulier — note hors barème** (`_evalTableurConfirmIfOutOfRange`, tableur d'éval) : utilise `_uiConfirm` avec **Conserver** (`onOk`, garde la valeur) / **Annuler** (`onCancel`, restaure la valeur précédente capturée au focus + recolore). Fenêtre bloquante voulue (choix explicite de l'enseignant).
