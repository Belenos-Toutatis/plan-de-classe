# Évaluations — tableurs de saisie

> Mémoire détaillée du projet, rangée depuis CLAUDE.md le 2026-10-29 (texte inchangé). Contenu : tableurs A/B/C/D, absents pré-remplis, calculatrice, import QCMcam des résultats, touche Entrée, ordre de ramassage, mini-plan, plan du type B, croix de saisie, pastilles, filtres, fenêtres de correction.

## Fenêtres de correction — refonte v2.129.0 (maquette validée le 2026-10-08)

Les douze fenêtres ouvertes autour du tableur. Gabarits repris des lots précédents : en-tête `.lst-head` (titre + sous-titre classe · devoir), bandeau `_bsynthCard`, listes `.lst-box` / `.lst-row` / `.lst-add`, interrupteurs `sw-chk`, sélecteurs `.ip-seg` / `.seg-radio`. CSS dans le bloc « Fenêtres de correction (v2.129.0) ».
- **Deux helpers génériques** : **`_slotPillsApply(root)`** double chaque `<select class="slot-pills-src">` du conteneur d'une rangée de pastilles de créneaux (« journée », M1…, tirées de l'emploi du temps du jour) ; **`_selPillsApply(sel, short?)`** fait de même pour un `<select class="sel-pills-src">` quelconque, groupé par `<optgroup>`. ⚠️ **Le `<select>` reste la source de vérité** (caché) : les fonctions d'enregistrement le lisent, une pastille le règle et déclenche son `change`. Toute fonction qui reconstruit les options doit rappeler le helper (déjà fait dans les sept constructeurs de créneaux).
- **💬 Commentaires** (`meval-comments`) : titre « Q3 · Prénom NOM », sous-titre classe · devoir · **valeur de la case** (`_evalCommentsHead`) ; **◀ ▶ = élève voisin sur la même case**, dans l'ordre et le filtre du tableur affiché (`_evalCommentsOrder` lit `#meval-tableur tbody tr[data-sid]:not(.bf-hide)`) ; liste modifiable sur place (`_cmEditIdx`, `_evalCommentsEdit` / `_evalCommentsEditDone`) ; ligne d'ajout ; puces de la bibliothèque (clic = ajouté, la fenêtre se ferme, comme avant) ; dispense en interrupteur ; aide d'une ligne selon le type.
- **⚖ Ajuster la note** (`meval-adjust`) : bandeau calculée → finale ; motifs en puces `.adj-chip` (**clic = remplit, double-clic = ajouté**, `_evalAdjustAddPreset`) ; opération en boutons `#meval-adjust-opseg` (`_evalAdjustSetOp`, le `<select id="meval-adjust-op">` reste caché, c'est lui que lit `_evalAdjustAdd`) ; **aperçu en direct** de la note finale (`_evalAdjustPreview`, même calcul que l'enregistrement : `_applyFinalAdjust` puis granulométrie).
- **📝 En-tête d'une question** (`meval-mn-menu`, types A, C **et D**) : bandeau Saisis · Moyenne · Commentés de la colonne (`_hmColSynthHTML`, aussi pour une passation) ; deux colonnes Question | Quand + Classes ; points masqués en D ; compétences en pastilles (`_tableurMnMenuRenderComps`) avec « ✏️ Choisir… » qui **enregistre d'abord** la fenêtre (`_tableurMnPickCompetences` → `_tableurMnMenuSave`) ; en C/D la date renvoie aux Réglages de l'évaluation ; pied : 🏗 Structure (`_tableurMnToStructure`) et ⋯ (question avant / après, supprimer).
- **📚 En-tête d'un exercice** (`meval-exo-menu`, C **et D**) : code, descriptif, ses questions en pastilles avec le total, « ＋ Question dans cet exercice » (`_tableurExoAddQuestion`, ouvre la nouvelle question), ⋯ (exercice avant / après, supprimer).
- **🎯 Passation** : **le menu `meval-pass-menu` a été SUPPRIMÉ et fondu dans `meval-pass-new`**, qui sert désormais à créer ET à régler une passation (clic droit sur son en-tête → `_tableurPassContextMenu` → `_evalAddPassation(passId)`) : bandeau de la colonne, deux colonnes Passation + Quand + groupes + classes | Compétences (pastilles par domaine, recherche — `_compPillsHTML`, partagé avec le choix des compétences), ⋯ (🧑 saisir élève par élève, passation avant / après, supprimer). Les id `meval-pass-menu-pergroup*` / `-skip-*` ont été gardés et déplacés dedans ; l'ancien `meval-pass-menu-passid` est devenu `meval-pass-new-passid`. Bouton « ✓ Créer et saisir » quand le tableur n'est pas ouvert (ouvre le tableur après création).
- ⚠️ **Défaut antérieur corrigé** : `_tableurPassMenuRenderPerGroupRows` calculait la couleur de groupe AVANT sa boucle, en lisant `g` hors de portée → ReferenceError, **les lignes « par groupe » d'une passation ne s'affichaient jamais**.
- **🏗 Structure** (`meval-structure`) : bandeau Exercices · Questions · Barème · Sans compétence (`_structSynthRender`) ; **une seule liste** `.st-exo` > `.st-qs` > `.st-q` ; **glisser par ⠿ en Pointer Events** (`_structSortableInit`, `_structDragMove`, `_structDragEnd`) : une question va n'importe où, **y compris dans un autre exercice** (son `exerciceId` change), un exercice se déplace avec ses questions ; l'ordre est relu dans le DOM au relâchement (une entrée d'undo). Remplace le glisser HTML5, qui ne partait pas au doigt et refusait de changer d'exercice. Passations (type B) en lignes `.lst-row` réordonnables (`_makeSortable` → `_evalStructPassMoveTo`) avec 🧑 / ✏️ / 🗑. ⚠️ **La Structure enregistre désormais à chaque modification** (`save()` dans les fonctions d'édition) : elle ne le faisait pas, les changements ne partaient qu'au prochain `save()` d'ailleurs. Ctrl+Z la redessine (`_refreshOpenEvalModals`).
- **🎯 Choisir les compétences** (`meval-pick-comp`) : recherche, Par domaine | Par code, pastilles `clf-pill` ; « Aussi pour » en pastilles groupées par exercice avec « tout » (`_competencePickerAlsoExo`), **types C et D** ; résumé « C2 + C3 → Ex.1 Q2 et Ex.2 Q1 » (`_competencePickerSummary`).
- **📥 Coller des notes** (`meval-paste`) : cible en pastilles, bandeau (lignes / élèves, à vérifier, cases remplacées), **aperçu élève par élève** à côté de la zone de collage (valeur, « remplace X », hors barème, illisible).
- **📂 Importer QCMcam** (`meval-qcmcam`) : deux colonnes Fichier | aperçu, cible en pastilles, groupe / QCM / nombre de questions en puces, bandeau Reconnus · À choisir · Absents · Ignorés, barème en trois boutons, date et créneau en interrupteurs. ⚠️ Cinq fonds clairs **codés en dur** (`#fff8e1`, `#fde8e7`, `#fffaeb`, `#dbeafe`, `#fff`) remplacés par les tokens `--caution-*`, `--alert-*`, `--info-bg`, `--paper-warm`.
- **🧑 Saisie élève par élève** (`meval-pass-saisie`) : ⚠️ **elle était devenue injoignable** (aucun appelant de `_evalOpenPassationSaisie`) — rouverte depuis la Structure (🧑) et le ⋯ d'une passation. Avatar (photo ou initiales), progression, niveaux **1..`nbLevels`** + A + 0 (plus de 4 niveaux figés ni de blanc sur couleur), **touches 1–n / A / 0 qui avancent seules** (compétence suivante, puis élève suivant ; ↑ ↓, Entrée), « Suivant sans saisie ». Élèves = ceux du tableur s'il est ouvert. ⚠️ L'écouteur clavier (capture) ne joue que si la fenêtre est **au premier plan = plus grand z-index** (`openMod` empile par +10), pas « dernière du DOM » — le tableur, plus bas dans le DOM, aurait gagné.
- **🪑 Plan du type B ajusté à la LARGEUR de l'écran** (v2.130.0, demande de l'utilisateur) : `_evpFit` rend la grille `#evp-plan` à sa taille naturelle puis la réduit avec la propriété CSS **`zoom`** (qui réduit aussi les zones cliquables, contrairement à `transform`) juste assez pour ne plus défiler en largeur, plancher 0,3. Recalculé à chaque rendu, après l'ouverture (`setTimeout`, ⚠️ pas `requestAnimationFrame` : il ne joue pas onglet masqué), par un `ResizeObserver` sur la zone et par l'événement `resize`.
- **🪑 Plan du type B — prénom et nom à la largeur de la case** (v2.130.1, demande de l'utilisateur) : `_evpFitNames` (appelé par `_evpFit`, AVANT le zoom) donne à chaque ligne `.evp-fit` la taille qui la fait tenir dans la largeur de sa case, entre 11 et 60 px (plafond : un prénom court ne devient pas démesuré). ⚠️ `.evp-fit` porte `width:0; min-width:100%` : elle remplit la case **sans peser dans la largeur de la grille** — sinon un nom long, mesuré à la taille de référence, élargissait sa colonne avant d'être ajusté.
- **🪑 Plan du type B — « Colonnes vides étroites »** (v2.130.2, demande de l'utilisateur) : interrupteur dans l'en-tête du plan (`#meval-plan-overlay-narrow`, affiché seulement s'il existe une colonne sans élève ni AESH), réglage mémorisé sur la machine `planClasse_evpNarrowEmpty` (désactivé par défaut, `_evpNarrow` / `_evpSetNarrow`). Une colonne vide (allée, tables inoccupées) passe à 66 px, environ le tiers d'une colonne normale, dans `grid-template-columns` (v2.130.3 : à 22 px, on ne distinguait plus les rangs — retour de l'utilisateur) ; le zoom d'ajustement à l'écran en profite. Un élève hors du filtre de groupe compte comme présent (son nom est affiché, estompé).
- **🪑 Plan du type B** (`meval-plan-overlay`) : passations en pastilles, filtre de groupe du tableur (`_evpGroupRender`), **pinceau** (`_evpBrush` : une compétence et un niveau, puis un clic sur un élève pose le niveau — `_evpCellClick`) ; pastilles 1..`nbLevels` avec encre `_contrastTextColor` (`_evpButtons`, était du blanc figé sur 4 niveaux) ; chaque clic est annulable (`_evalArmUndo`, il n'y en avait pas) ; cases vides en tokens.
- **📚 Bibliothèque de commentaires** et **⚖ Motifs d'ajustement** (`mcomlib`, `madjlib`) : gabarit des listes (deux colonnes Positifs | Négatifs pour la bibliothèque), modification sur place (`_comLibEdit`, `_adjLibEdit`), **nombre d'utilisations** (cases qui portent le texte ; ajustements qui portent le libellé), bascule « annule » d'un motif (`_adjLibToggleVoid`), opération en boutons (`_adjLibSetOp`). ⚠️ `_adjLibOwnList` lit `S.evalPrefs.adjustPresets` en direct, jamais `_adjustPresets()` (qui peut renvoyer la constante des défauts).
- Audit : 0 écart en clair et en sombre sur 19 états (les 12 fenêtres, en A, C, D et B, sous-états compris) ; 363 px de large à 375, sans débordement. Glisser de la Structure vérifié au vrai pointeur (question passée d'un exercice à l'autre).


## Évaluations — tableurs de saisie (extrait de « Évaluations (Types A / B / C) » dans CLAUDE.md)

### Auto-fill « A » sur les absents quand on change la date/le créneau d'un devoir

Quand l'enseignant change la date ou le créneau d'une évaluation, le système cherche dans `S.attendance[classId]` les appels enregistrés ce jour-là à ce créneau, et **pré-remplit `'A'` sur les cellules vides** des élèves marqués absents. N'écrase JAMAIS une saisie existante (note, A, NN). Toast récap : `🚫 N cellule(s) pré-remplie(s) avec « A » (élève(s) absent(s) à l'appel)`.

**Helpers** (autour de `_evalSetSlotIdFor`) :
- `_evalCollectAbsentsForDateSlot(classId, dateYMD, slotId, groupFilter)` — Set de sids absents. Match : `r.date === dateYMD`. Slot : si `slotId` ET `r.slotId` sont définis, doivent être égaux ; sinon on accepte. Group : pareil — un appel `groupe=0` (toute la classe) matche n'importe quel filtre groupe.
- `_evalAutoFillAbsentsForMn(ev, mn, classId)` — pour Type A/C. Lit date/slot effectifs en cascade `mn.dates[cid] || ev.dates[cid] || mn.date || ev.date` (idem pour slot) — robuste aux différences de niveau entre Type A (per-mn) et Type C (per-eval avec propagation parfois partielle). Respecte la granularité per-groupe (`mn.datesByGroup[cid][g]` / `mn.slotIdsByGroup[cid][g]`) et le filtre `_stuActiveOn` (arrivée/départ).
- `_evalAutoFillAbsentsForPass(ev, pass, classId)` — pour Type B. Itère `pass.competenceIds` ; remplit `pass.niveaux[sid][cid] = 'A'` pour chaque comp vide (cur `== null`, `''` ou `0`).
- `_evalAutoFillAbsentsForEvalClass(ev, classId)` — wrapper qui itère toutes les mn ou passations.

**Points d'entrée hookés** (7) :
1. `_evalTableurChangeDate` — input date global en haut du tableur
2. `_evalTableurChangeSlot` — select créneau global en haut du tableur
3. `_tableurEditMn` (champs `date` et `slot`) — inline header de mini-note dans le tableur (Type A surtout ; Type C propage déjà l'edit à ev.dates)
4. `_evalTableurEditPass` (champs `date` et `slot`) — inline header de passation Type B
5. `_evalEditPerClass` — édition date/slot per-classe dans la modale Réglages d'éval
6. `_tableurMnMenuSave` — modale clic droit sur en-tête mn (`meval-mn-menu`)
7. `_tableurPassApplyPerGroup` — fenêtre d'une passation (`meval-pass-new`, ouverte par le clic droit sur son en-tête)

Aussi déclenché lors de l'**import CSV QCMcam** quand la date OU le créneau détectés sont appliqués (cf. section *Import CSV QCMcam*).

Quand `filled > 0`, le tableur est re-rendu via `_evalTableurRender()` pour faire apparaître les A immédiatement.

### Clic sur le nom → fiche complète, partout (v2.69.0)

Bilans (v2.63.6), puis les **4 tableurs de saisie**, la **Vue d'ensemble**, les **statistiques d'absence** et l'onglet **Tablettes** (`_confNameClick(sid)||openFiche(sid)`). Ouverte depuis le tableur, la fiche passe au-dessus (empilement de `openMod` par z-index croissant).

### Clic sur le nom dans les bilans → fiche complète de l'élève

Dans le **Bilan des notes** et le **Bilan des compétences**, la cellule du nom (1re colonne sticky) ouvre la **🪪 fiche** (v2.63.6 — c'était l'historique `openHist` avant ; l'historique reste à un clic depuis la fiche, via les 🕓). ⚠️ Depuis la v2.87.2, **sur la période du bilan affiché** (« Toutes » → vue Année) et en parcourant **les élèves du bilan** : `_bilanOpenSheet(sid, periode, reveal)` → `openRemarkWriter`. Avant, `openFiche` ouvrait sur la période EN COURS — le bilan S1 consulté en février ouvrait une fiche S2. Même montage que l'onglet Élèves : le **texte du nom** (`span.stu-name-link`, `reveal = true`) ouvre la fiche même en mode confidentiel (l'élève devient l'élève affiché) ; le **reste de la cellule** fait `_confNameClick(sid)||_bilanOpenSheet(…)` (en mode confidentiel : afficher / masquer l'élève).

### Mini-calculatrice dans les cellules (Type A / C, tableur)

L'enseignant peut taper une expression arithmétique dans une cellule de note (`1+2+4`, `0,5*3`, `(8+7)/2`, `=5+3`…) ; au commit (blur, déclenché aussi par Tab/Enter via `_evalTableurKey` qui appelle `focus()` sur la cellule suivante), l'expression est évaluée et la cellule affiche le résultat formaté FR (virgule décimale, arrondi 2 décimales, zéros de queue retirés via `_fmtNote`).

- **`_evalArithExpr(s)`** — parser récursif descendant, **jamais `eval` / `Function`**. Liste blanche stricte : chiffres, point décimal, `+ - * /`, parenthèses uniquement. Supporte signes unaires, virgule ou point décimal, et un `=` initial style tableur. Retourne `null` si la chaîne ne contient pas d'opérateur (laisse alors `parseFloat` habituel agir) OU si le parsing échoue (division par 0 → null, parenthèses déséquilibrées → null, double point dans un nombre → null, etc.).
- **`_hasArithOperator(raw)`** — détecte la présence d'un opérateur AU-DELÀ d'un signe initial (sinon `-5` ou `+5` seraient pris pour des expressions).
- **`_evalTableurMaybeApplyExpr(inputEl)`** — appelé en tête de `_evalTableurConfirmIfOutOfRange` (le handler onblur). Si l'input contient un opérateur ET que l'évaluation réussit → remplace `inputEl.value` par `_fmtNote(v)` puis rejoue `_evalTableurUpdate(inputEl)` pour persister la valeur, recolorer la cellule, et rafraîchir total + Σ exo + brut + compétences inline + footer stats. Si l'expression est mal formée (`1++2-`, `(1+2`…) → toast non bloquant `⚠ Expression invalide` sans rien écraser, le prof voit sa saisie et corrige.

Limité au tableur (Type A / C) — qui est désormais la seule saisie (la fiche par élève a été retirée en 2.79.0).

### Auto-scroll quand la cellule focusée passe sous le thead/tfoot sticky

Le tableur d'éval a un `<thead>` sticky-top et `<tfoot>` sticky-bottom dans le conteneur de scroll `#meval-tableur-wrap`. Naïvement, le focus sur une cellule en bord de viewport (au ras du haut ou du bas) laisse la cellule **cachée derrière** la zone figée : le curseur clignote dans le vide. Le `.focus()` du navigateur considère l'élément « in viewport » même s'il est couvert.

- **`_evalTableurEnsureInputVisible(inputEl)`** — mesure `theadH` et `tfootH` (sticky), mesure la largeur de la colonne « Élève » sticky-left de la même ligne, calcule `wrapRect` et `inpRect`, puis ajuste `wrap.scrollTop` / `wrap.scrollLeft` si la cellule est masquée. Padding de 4px pour ne pas coller pile contre la zone sticky. Limité aux inputs/selects/textareas situés dans `tbody` ou `tfoot` du tableur — les contrôles du thead (date, code, max…) sont exclus pour ne pas scroller à tort quand on modifie l'en-tête.
- **Listener `focusin` délégué** : posé une seule fois sur `#meval-tableur-wrap` via une IIFE auto-installante (`wrap.dataset.scrollFixInstalled`). Le wrap statique survit aux re-render du tableur (seul l'innerHTML est remplacé), donc le listener persiste. Couvre clic, Tab/Enter (via `target.focus()` → `focusin`), et tout focus programmatique.

### Commentaires d'éval — fermeture auto sur ajout + refresh modales sur undo/redo

- **Auto-close** : `_evalCommentsAddFreeText` (Enter ou « + Ajouter ») et `_evalCommentsAddFromLib` (chip de la bibliothèque) appellent `closeMod2('meval-comments')` en fin d'exécution → un commentaire = une action terminée, retour direct au tableur. Le hook `_modalReturnTo['meval-comments']` (cf. `_evalCommentsOpen`) re-render le tableur pour rafraîchir le badge 💬 sur la cellule. Pour ajouter plusieurs commentaires, le prof rouvre la modale. `_evalCommentsRemove` (✕ sur un commentaire existant) reste sans fermeture — pour pouvoir nettoyer plusieurs entrées à la suite.
- **Refresh undo/redo** : `_refreshOpenEvalModals()` appelé en fin d'`undoLast` et `redoLast`. Si `meval-tableur` ou `meval-qcmcam` sont ouverts, appelle `_evalTableurRender()` / `_evalQcmcamRenderPreview()` pour mettre à jour le badge 💬 / les notes / les stats / l'aperçu d'import affichés au-dessus. Sans ça, Ctrl+Z annulait bien en mémoire mais le DOM des modales restait figé jusqu'à la prochaine navigation.

### Import CSV QCMcam (Type A / C, tableur)

Bouton **📂** dans la toolbar du tableur (à côté du 📥 « coller des notes »), visible uniquement pour Type A et C. Ouvre la modale `meval-qcmcam` qui importe le fichier de résultats exporté depuis QCMcam.

**Deux formats acceptés, détectés automatiquement** (le séparateur est déduit du contenu : celui de TAB / `;` qui apparaît le plus) :

| | QCMcam **v2** (`Session-N-resultats.csv`) | QCMcam **v1** (`resultats.csv`) |
|---|---|---|
| Séparateur | `;` | TAB |
| Avant les colonnes | bloc `Session` / `Date` / `Groupe` / `QCM` | rien |
| Ligne de colonnes | `Participant;Q1;…;Qn;Scores` | `id / Nom / Q1..Qn / Score` |
| Ligne de corrigé | `Bonnes réponses;D;C;…;--` | 1re cellule vide |
| Pas de réponse | `-` | cellule vide |
| Score | `1/6` | nombre |

⚠️ **QCMcam 2 est MULTILINGUE (fr/en/de/es/it) et ses en-têtes sont TRADUITS** — nouveauté de la v2, la v1 était francophone seule. `Q{n}` devient `F{n}` (de), `P{n}` (es), `D{n}` (it) ; `Participant` devient `Teilnehmer` / `Partecipante` ; `Scores` devient `Punktzahlen` / `Puntuaciones` ; « Bonnes réponses » devient « Correct answers » / « Richtige Antworten ». Seuls le **`--`** du score du corrigé et le **`-`** des non-réponses sont écrits en dur dans son code. Le parseur en tient compte :
- colonnes de questions reconnues par `_QCM_QCOL_RE` = 1 ou 2 lettres suivies d'un nombre (pas `/^q\d+$/`) ;
- colonne des noms : quelques traductions listées, sinon repli sur la 1re colonne (juste en v2) ;
- colonne du score : repli sur la dernière colonne nommée qui ne soit ni les noms ni une question ;
- ligne du corrigé : libellé français **ou** score valant exactement `--` — le seul test indépendant de la langue. Sans lui le corrigé apparaissait comme un élève inconnu de plus.

Un test couvre un export allemand complet. Ce n'est pas théorique pour un usage partagé : il suffit qu'un collègue exporte depuis une interface dans une autre langue.

⚠️ **La ligne de colonnes n'est PAS à un rang fixe** (1 en v1, 5 en v2) : `_qcmcamHeaderRowIndex` la trouve comme la 1re ligne contenant une cellule `Q<n>`, pour que le bloc d'en-tête de v2 puisse gagner ou perdre une ligne sans rien casser.

**Détection du score** : colonne `Score`/`Scores` si elle existe, sinon repli v1 sur la dernière cellule exploitable après la colonne des noms (le score pouvait être padé loin à droite quand toutes les questions n'avaient pas été soumises). `_qcmcamParseScore` accepte les deux écritures et renvoie `{value, denom}`.

**Détection absent** : si toutes les colonnes Q* de l'élève sont vides → `score = 'A'` (exclu du total, comme la saisie manuelle) au lieu de `0`. ⚠️ « Vide » = cellule vide **ou `-` / `--`** (`_qcmcamAnswerEmpty`) : en v2 une non-réponse s'écrit `-`, donc sans ce test tout le monde paraîtrait présent.

**Détection du barème** (`_qcmcamExtractRows`) : prio (0) **dénominateur du score v2** > (1) max de réponses non vides par élève > (2) nb de « Bonnes réponses » renseignées > (3) `qIdx.length`.

⚠️ **Le dénominateur passe AVANT le max de réponses**, contrairement à la logique v1. Si personne n'a répondu à une question (carte non détectée, question passée trop vite), le max de réponses la fait disparaître du barème alors qu'elle a bien été posée. Cas réel rencontré : un fichier de 6 questions dont la Q1 n'a été scannée pour aucun élève sortait `/5` au lieu de `/6`. Le dénominateur est écrit par QCMcam, il fait foi. En v1 il n'existe pas, donc la cascade historique s'applique inchangée (couvert par un test).

**3 modes proposés** (radio dans l'aperçu, seulement si barème détecté ≠ `mn.max`) :
- `update` — modifie `mn.max` de la mini-note sélectionnée
- `create` — crée une nouvelle mini-note avec le bon barème (label suffixé `bis`/`ter`/…, copie `exerciceId` + `competenceIds`, insertion juste après l'originale). **Utile si la mini-note a déjà été utilisée pour d'autres classes** — on garde l'historique intact.
- `keep` — laisse `mn.max` inchangé, clampe les scores hors limite

**Bloc d'en-tête v2** (`_qcmcamExtractMeta`) : lit `Date` (`JJ/MM/AAAA hh:mm:ss`), `Groupe` et `QCM` dans les lignes qui précèdent la ligne de colonnes. Le **groupe** est l'identifiant `classe-salle` que NOUS avons exporté : l'aperçu s'en sert pour vérifier qu'on n'importe pas les résultats d'une classe dans une autre (bandeau d'avertissement si aucune salle de la classe active ne correspond).

**Date** : celle du bloc d'en-tête v2 en priorité, sinon le motif `AAAA-MM-JJ` cherché dans le nom du fichier (`_qcmcamExtractDate`, v1). ⚠️ **Si les deux existent et divergent, l'aperçu le SIGNALE** (`dateAlt`, idem `slotAlt` pour le créneau) au lieu de trancher en silence : l'utilisateur nomme ses fichiers à la main pour ses archives, un écart veut donc dire fichier renommé ou réexporté depuis une autre séance. ⚠️ Indispensable : l'export v2 s'appelle `Session-10-resultats.csv` et **ne porte plus aucune date dans son nom**. `_qcmcamState.dateSrc` mémorise la provenance pour que l'aperçu ne mente pas sur l'origine du chiffre. Checkbox « 📅 Appliquer à la mini-note » (cochée par défaut sauf si identique). Toujours appliquée à la nouvelle mini-note en mode `create`.

**Créneau** : en v2, déduit de l'**heure** du bloc d'en-tête confrontée au planning de la salle active pour le jour de la date (`_qcmcamSlotFromTime` → `getSalleSchedule` + `findCurrentSlot`) — bien plus fiable que de supposer que le prof a écrit le code du créneau dans le nom du fichier. Repli v1 (`_qcmcamExtractSlot`) : scanne la queue du nom de fichier APRÈS la date détectée (avant l'extension) et tente de matcher un id de créneau du planning de la salle active de la classe pour le jour de la date. Ex. `resultats_2026-05-26_M2.csv` → détecte le créneau `M2`. Match insensible à la casse, borné par caractères non-alphanumériques (séparateurs `-`, `_`, espaces…). Slots triés par longueur décroissante pour ne pas matcher `M1` avant `M10`. Affiché dans l'aperçu en bloc 🕒 avec checkbox « Appliquer à la mini-note » (cochée par défaut sauf si identique au créneau actuel). Appliqué à `mn.slotIds[cls.id]` au save, comme la date. Quand date OU créneau sont appliqués, déclenche `_evalAutoFillAbsentsForMn` (cf. section *Auto-fill « A »*).

**Normalisation** (`_qcmcamNorm`) : NFD → suppression des accents → minuscules → traits d'union `-`, apostrophes droite `'` ou courbe `’`, ET points `.` remplacés par espace → écrasement des espaces multiples. Le point couvre le format d'export désambiguïsé `getDisplayName` (`« Léo MART. »`), sinon `'martin'.startsWith('mart.')` échouait. Un prénom composé comme `Lou-Anna` devient ainsi `'lou anna'` (et non `'louanna'`).

**Matching élève → ligne CSV** (`_qcmcamMatchStudent`) — 3 étages, du plus strict au plus permissif. Indispensable pour ne pas confondre `Lou-Anna` (prénom composé) avec `Louanne` (autre prénom proche) :

1. **Match EXACT sur le prénom complet normalisé** (incluant les tirets convertis en espaces). `'lou anna'` du CSV → matche directement l'élève dont le prénom normalise à `'lou anna'`. Si 1 candidat → `ok`. Si plusieurs → `ambig`. **Ce niveau ne descend PAS au fallback** : si exactement un élève s'appelle vraiment `Lou-Anna`, on le renvoie immédiatement sans ouvrir la porte au prefix-match qui aurait aussi capturé `Louanne`.
2. **Découpe `prénom + préfixe nom`** (cas `Léo MART.` ou saisie manuelle `Léo M`). On exige un match EXACT sur le prénom (pas de startsWith), puis on filtre par préfixe de nom. Si 1 candidat après filtre → `ok` ; si plusieurs ou aucun match nom + plusieurs prénoms → `ambig`.
3. **Fallback `startsWith`** sur le prénom (pour les raccourcis manuels type `Léa` qu'on veut bien matcher avec `Léa-Marie` quand il n'y a pas d'autre `Léa` exact). Désambiguïsation par préfixe nom si dispo.

Tests de régression (12 cas dans une seed démo classique) : Lou-Anna ≠ Louanne, Léo MART. / MER. désambigués correctement, Léa (exact) ≠ Léa-Marie, prénom unique ok, etc.

**UI de désambiguïsation** : pour chaque ligne `ambig` ou `none`, le preview affiche un `<select>` permettant de choisir manuellement l'élève (ou « ✗ Ignorer cette ligne ») :
- 1er optgroup **« Candidats détectés »** = les sids renvoyés par le matcher (pour `ambig`)
- 2e optgroup **« Autres élèves de la classe »** = tous les autres élèves de la classe (pour corriger si le matcher s'est trompé sur le set initial ; pour `none`, seule cette liste est présentée)
- Option `__skip__` = ignore explicite (la ligne ne sera pas appliquée, comptabilisée séparément dans le récap)
- Options marquées **« (déjà pris) »** si l'élève est déjà attribué à une autre ligne (info uniquement, n'empêche pas la sélection — l'utilisateur reste maître)
- Les lignes résolues manuellement gardent leur picker (✎ vs → pour signaler) afin de pouvoir changer d'avis

Choix persistés dans `_qcmcamState.userPicks = { [rawCsvName]: sid | '__skip__' }`. Reset à chaque ouverture de modale et à chaque changement de fichier (le picker manuel ne traverse pas les fichiers).

**Chargement unifié** (`_qcmcamIngest`) : les deux chemins d'entrée (dossier mémorisé et fichier choisi à la main) passent par la même fonction — parse, bloc d'en-tête, lignes, barème, date et créneau. ⚠️ Avant, chacun refaisait le travail de son côté et une correction n'était appliquée qu'à l'un des deux.

**Picker fichier** :
- Handle du **dossier d'import** stocké dans IndexedDB sous la clé `'qcmcam-import-dir'`. Au 1er import → bouton « 📂 Choisir le dossier… ». Aux suivants → liste directe.
- Liste les `.csv`/`.tsv` du dossier, triable :
  - **🕐 Plus récents en premier** (défaut, basé sur `lastModified`)
  - **🔤 Nom (A→Z)** (tri naturel français, `numeric: true`)
  - Préférence persistée dans `localStorage.planClasse_qcmcamImportSort`
- **Champ de filtre 🔍** (`_qcmcamSetFilter` → `_qcmcamState.filter`) : input texte au-dessus de la liste, filtre par sous-chaîne du nom de fichier (insensible à la casse). Compteur `N / M` à droite quand un filtre est actif. Bouton `✕` et touche `Échap` pour effacer (avec `stopPropagation` pour ne pas fermer la modale). Restauration automatique du focus + position curseur après chaque re-render (sans ça, taper rapidement viderait le focus à chaque caractère).
- Boutons « ↻ changer » (re-pick dossier), « ↻ » (refresh), « 📄 Ou un fichier ailleurs… » (fallback `<input type="file">`).
- Fallback navigateur : si `showDirectoryPicker` indisponible (Safari/Firefox), seul l'input natif est affiché.

**Application** (`_evalQcmcamApply`) : `pushUndo()` une fois, applique `'A'` ou `clamp(score, 0, mn.max)` UNIQUEMENT pour les lignes `match.status === 'ok'` (donc ni les `ambig` non résolus, ni les `none` non résolus, ni les `skip`). Met à jour `mn.max` selon les choix, save, toast récap.

**Date appliquée per-classe** (corrige un bug où la date ne « prenait » pas) : le modèle de dates est per-classe (`_mnDateFor(mn, classId)` lit `mn.dates[classId]` **en priorité**, puis `mn.date`). L'import écrit donc `mn.dates[_clsActive.id] = dateDétectée` et recale `mn.date` globale = max des dates per-classe (cascade fallback). L'aperçu (« remplace … » / « déjà appliquée ») lit aussi `_mnDateFor(mn, cls.id)` — sinon écrire la date globale était sans effet visible quand une date per-classe existait déjà.

### Date de rattrapage (Types C et D, v2.70.0)

`ev.notes[sid].dateIndiv` — date individuelle d'un élève qui a composé plus tard. **Affichage seul** : aucun calcul ne la lit. Colonne « 📅 Rattrapage » en fin de tableur C **et D** (cellule commune `_rattrapCellHTML`, calendrier maison `_evalRattrapOpen`, borné à l'écran). Pas en A ni en B : plusieurs dates par évaluation (une par mini-note ou passation), une date individuelle n'y aurait pas de sens unique. En Type D, **pas de dispense** par question : le code NN sort déjà la cellule du barème et des niveaux (arbitrage de l'utilisateur).

### Dispense d'une question (Types A et C, v2.69.0)

`ev.notes[sid].excluded = [mnId…]` : la question sort du barème de l'élève (déjà appliqué par les calculs). ⚠️ **Ne se réglait plus nulle part** depuis le retrait de la fiche de saisie `meval-saisie` (code mort : `_evalOpenSaisie`, `_evalSaisieToggleExcluded`) — audit 2026-10-03 § 1.4. Désormais : **clic droit sur la cellule** → la modale des commentaires porte une case **« 🚫 Dispensé·e de cette question »** (`_evalCommentsToggleDisp`, seulement A/C et clé simple) ; la cellule dispensée est rendue **hachurée « disp. »** (`td.meval-cell-disp`, sans champ, comptée par `_tableurBlockAt` comme les cases repliées), clic droit pour retirer. Types B et D : sans objet (pas de modèle de dispense par question). La date de rattrapage existe en Types C et D (cf. ci-dessus).

### Tableur — tri des élèves et touche Entrée : une seule règle (v2.68.2)

Le choix fait **dans le tableur** est retenu sur la machine (`planClasse_evalTableurSort`, `planClasse_evalTableurEnter`) ; la valeur des **Paramètres d'évaluation** (`defaultSort`, `defaultEnterBehavior`) sert de **départ**, et **l'enregistrer avec une nouvelle valeur efface le choix local** (`_evalPrefsSave`) pour qu'elle s'applique. Avant : le tri des Paramètres était réimposé à chaque ouverture (le choix du tableur n'était jamais retenu) et, à l'inverse, le défaut Entrée n'avait plus aucun effet dès qu'on avait touché au tableur (audit 2026-10-03, § 1.9). Un pattern de ramassage retenu mais absent de la salle courante retombe sur le défaut.

### Tableur — comportement de la touche Entrée (`#meval-tableur-enter`)

Trois modes (`ENTER_BEHAVIORS`), gérés dans `_evalTableurKey`. `Tab` et les flèches ne changent jamais. Une **colonne** est une question en A/C, un couple (passation × compétence) en B, (question × compétence) en D.

| Mode | Déplacement | Usage |
|---|---|---|
| `question` | cellule à droite, puis élève suivant | saisie au fil de la copie |
| `byquestion` | remplit la **question** pour un élève, puis descend ; question épuisée pour la classe → question suivante, 1ᵉʳ élève | corriger question par question sur tout le paquet |
| `byexo` | idem avec l'**exercice entier** comme bloc | corriger exercice par exercice |

⚠️ **`student` et `column` ont été retirés** (jugés sans usage) : `column` descendait la colonne puis remontait en haut de la suivante — soit exactement `byquestion` dès qu'une question tient sur une colonne ; `student` s'arrêtait au dernier élève au lieu d'enchaîner. **`_normalizeEnterBehavior` convertit les valeurs enregistrées** (`localStorage.planClasse_evalTableurEnter` et `S.evalPrefs.defaultEnterBehavior`) vers `byquestion`, sans quoi le `<select>` afficherait une valeur vide. ⚠️ `ENTER_BEHAVIORS` est déclaré **avant `init()`**, comme `ADJUST_OPS` : la garde de `migrateEvalDefaults` le lit pendant `init()`.

- **`_tableurBlockAt(ev, ci, byExo)`** donne les bornes du bloc. ⚠️ **Lu depuis le DOM** (`input[data-ci]` de la 1ʳᵉ ligne, attribut `data-mnid` / `data-passid`), pas recalculé depuis `ev.miniNotes` : l'ordre des colonnes vient du rendu (regroupement par exercice), et le modèle donnerait un ordre différent dès qu'un exercice réordonne ses questions.
- **En descendant à l'élève suivant** (`byquestion` / `byexo`), le curseur se pose sur la **première cellule VIDE du bloc** de cet élève, à défaut sur le début du bloc (v2.76.0, demandé pour le Type B : des compétences de la passation déjà saisies ne doivent pas arrêter la saisie).
- **En Type B, `byexo` devient « ↩ Séance par séance »** (v2.76.1, demandé en usage réel : « a2 q2 » puis « a2 q4 », deux passations le même jour, saisies d'affilée) : dans `_tableurBlockAt`, la clé de bloc d'une passation est `date|créneau` de la classe (`_passDateFor` / `_passSlotIdFor`, niveau classe, pas groupe) ; les passations **consécutives** de même clé forment un bloc ; sans date, la passation est seule. L'option est donc visible en Type B.
- **En Type B, `byquestion` s'affiche « ↩ Passation par passation »** (`_evalTableurUpdateHelpForType`) : le bloc y est la passation entière (clé `data-passid`). Avec le libellé « Question par question », l'utilisateur ne savait pas que ce mode existait.
- L'option **« Exercice par exercice » est masquée** quand l'éval n'a pas d'exercices (A, B) : le bloc s'y réduirait à la question et ferait doublon. Si elle était sélectionnée, on retombe sur `byquestion`.
- Le libellé de `question` suit le type (cf. section Type D).

### Tri « pattern de ramassage » — quel placement fait foi (2.49.0 → 2.51.0)

`salle.collectPatterns = [{ id, nom, order: ['r,c', …] }]` est une suite de **TABLES**, pas d'élèves : c'est l'ordre dans lequel on circule. C'est `_evalPatternSeatingFor(ev, classId)` qui dit **quel placement** convertit ces tables en élèves, et là est tout le sujet.

Un devoir sur copies se ramasse un jour et se corrige un autre : l'ordre de la pile suit le plan **du jour du devoir**, qu'il faut donc reconstituer. **Trois sources, de la meilleure à la moins bonne** :

1. **l'appel enregistré ce jour-là** (même date, même créneau, même salle) — la photo la plus fidèle ;
2. **la photo prise le jour même** à l'ouverture du tableur (`_evalCaptureTodaySeating`, cf. plus bas) ;
3. **le seating enregistré sur l'éval** — à défaut de mieux, celui figé à sa création.

La suite de cette section raconte comment chacune de ces trois marches a été posée, et pourquoi les deux premières manquaient.

⚠️ **Mais ces photos ne valent QUE pour une éval déjà PASSÉE.** Une éval **datée d'aujourd'hui, sans date, ou à venir** se saisit pendant qu'on circule dans les rangs : le placement en vigueur, c'est celui qu'on a sous les yeux, et **toute photo est par construction plus ancienne que lui**. `_evalPatternSeatingFor` sort donc immédiatement (`return null` → le seating courant) dès que `!date || date >= todayKey()`.

Sans cette garde, la photo prise à la **création** de l'éval gagnait — c'est-à-dire un plan qui n'a aucun rapport avec le jour du devoir (une éval créée en septembre pour un contrôle de décembre). Déplacer des élèves ensuite laissait le tri sur l'ancien plan : **on saisissait le niveau d'un élève sur la ligne de son voisin.** Signalé en usage réel le 2026-09-09, Type B en saisie au fil des rangs. Trois tests fixent les trois cas (aujourd'hui, sans date, passée).

💡 Ce défaut ne pouvait pas se voir sur l'écran : les deux ordres sont plausibles, et rien ne signale que la liste suit un plan périmé. **Le seul indice était le décalage entre l'écran et la salle** — donc uniquement détectable en classe. Quand une fonction choisit entre plusieurs sources de vérité, écrire un test par source.

**Deuxième source du même défaut : le CHANGEMENT DE SALLE** (corrigé en 2.50.0, trouvé en vérifiant les autres consommateurs). Le pattern est cherché dans la salle **active** de la classe, la photo pouvait venir d'une **autre**. Or `'r,c'` est une coordonnée dans une géométrie : mesuré sur la démo, **26 des 30 clés du pattern de la Salle 105 (4 × 9) existent aussi dans une photo prise en Salle 102 (5 × 8)**. Le tri ne plantait donc pas — il sortait un ordre qui n'était **ni celui d'une salle ni celui de l'autre**. Deux garde-fous dans `_seatingFitsRoom(snap, ev, classId, roomId)`, appliqué aux DEUX photos consultées (celle de l'appel et celle enregistrée sur l'éval) :

- **`ev.seatingRoomIds[cid]`**, écrit en même temps que `seatingHashes[cid]` — **quatre** sites depuis la 2.51.0 : création de l'éval, ajout d'une classe dans Réglages, seed de démo, et la capture du jour. Si la salle mémorisée diffère de la salle courante → photo écartée. ⚠️ **Les deux champs DOIVENT s'écrire ensemble** : un hash posé sans sa salle retombe sur le seul contrôle des bornes, qui ne rattrape pas tout (une photo d'une salle plus petite y passe). Aucun des quatre ne pose de hash orphelin : les trois premiers gardent l'écriture par `if (activeRoom)`, et la capture du jour sort avant si la salle manque.
- **Contrôle des bornes** pour les fichiers antérieurs, qui n'ont pas ce champ : une clé hors des `rows`/`cols` de la salle courante prouve que la photo vient d'ailleurs. ⚠️ **Sens unique** — une photo prise dans une salle plus petite passe le test — mais **aucun faux rejet**, ce qui est la propriété qui compte pour un repli.

⚠️ **`seatingRoomIds` est une map d'éval keyée par classId : elle est donc dans `_forEachEvalPerClassMap`** (renommage et purge de classe en héritent), comme l'exige l'invariant plus bas. Un test vérifie que les 5 maps de niveau éval y sont visitées.

**La photo est prise LE JOUR de l'éval** (`_evalCaptureTodaySeating`, 2.51.0), depuis `_evalTableurRender` — donc pour les quatre types, et aussi au changement de classe d'une éval multi-classes. Motif : sans appel enregistré, la seule photo d'une éval passée était celle de sa **création**, un plan sans rapport avec le jour du devoir. L'appel donne mieux, mais **on oublie de le prendre** — c'est exactement ce qui s'était produit le 2026-09-09. On saisit donc la vérité au seul moment où elle est disponible : le jour même. Ramasser les copies jeudi et corriger mardi retrouve alors le bon ordre.

- ⚠️ **STRICTEMENT aujourd'hui**, ni hier ni demain : c'est le seul jour où « plan courant » et « plan en vigueur à la date de l'éval » désignent le même objet. Une éval datée de la semaine prochaine verrait son plan changer d'ici là.
- ⚠️ **Une salle VIDE ne remplace jamais une photo existante** — ouvrir le tableur depuis une salle où personne n'est placé effacerait une photo correcte.
- ⚠️ **Pas de `pushUndo()`** : c'est de la tenue de registre, pas un geste de l'utilisateur ; une entrée d'annulation pour avoir ouvert un tableur serait incompréhensible. La fonction renvoie `true` seulement si quelque chose a changé, et **l'appelant seul sauvegarde** — à photo identique on ne réécrit rien. Mesuré : 1 sauvegarde à la première ouverture après un changement de plan, 0 aux suivantes, 0 sur un re-rendu.
- 💡 L'ordre des sources est donc, du meilleur au moins bon : appel du jour → photo prise le jour même à l'ouverture du tableur → photo de création. La dernière ne sert plus que pour une éval passée jamais ouverte le jour J.

**Les deux seuls points d'entrée du pattern** sont le sélecteur de tri du tableur (`_evalTableurSortedSids`) et celui de l'export ENT (`_evalExportBuildRows`). Tous deux passent par `_evalPatternSeatingFor`, donc une correction faite là les couvre ensemble — avec, dans le sillage du premier, `_evalTableurRender`, `_evalTableurRenderB`, `_evalRenderBilanComps`, `_evalBilanCopy`, `_evalNoteTipD` et `_evalPasteOpen`. ⚠️ **Tout nouvel écran qui propose un tri par pattern doit résoudre son placement par `_evalPatternSeatingFor`, jamais lire `cls.seating` directement.**

### Élève parti (ou pas encore arrivé) à la date d'une colonne — case 🚪 / 📅 (v2.61.3)

Un élève figure au tableur s'il était actif à AU MOINS UNE date de l'éval (`_stuActiveOnAnyEvalRef`) — donc un élève parti entre deux passations y reste. Sur les colonnes datées **après son départ** (ou avant son arrivée), les tableurs **A** (mini-notes) et **B** (passations) ne proposent plus de saisie : case hachurée `.meval-cell-out` avec 🚪 (ou 📅) et une infobulle datée, **hors calcul** (une case vide ne compte pas). `_stuOutOnSubDate(stu, sub, classId, isPass)` lit la date par groupe de l'élève puis par classe (`_passDateFor` / `_mnDateFor`) ; `_stuOutCellHTML` rend la case. Demandé en usage réel : on proposait un niveau à deux élèves déjà partis. Garde : seulement si la case (en B : toutes les compétences de la passation) est **vide** — une saisie existante reste visible et éditable. Les cases portent `data-ci` + `data-mnid`/`data-passid` : la navigation clavier les enjambe (pas d'input) et `_tableurBlockAt` les compte (sinon un bloc se scinderait quand le 1er élève est parti). C et D non concernés : une seule date par classe, déjà filtrée par la présence.

### Mini-plan « où est assis l'élève corrigé » (tableurs A/B/C/D, v2.74.0)

Deux surfaces, à l'essai (l'utilisateur peut en supprimer une après usage) :
- **Encart `#meval-miniplan`** dans l'en-tête du tableur : photo (si disponible) + mini-plan + « Prénom NOM · salle · place n° ». Suit la **ligne qui a le curseur** (`_mnpFocus`, appelé par le `focusin` du wrap), remis à zéro quand on change de devoir (`_mnpEvId`). Repliable (✕ / 🗺, `localStorage.planClasse_evalMiniPlan`). Rendu par `_mnpRender`, appelé depuis `_evalTableurRenderCtx`.
- **Bulle photo `#photo-pop`, PARTOUT** (v2.75.0) : au survol d'un nom, **un mini-plan par salle** de la classe s'ajoute sous la photo (`_mnpAllRooms` : salle active d'abord ; classe = celle du tableur, sinon la classe affichée si l'élève en fait partie — recomposée —, sinon sa classe d'inscription). La bulle s'affiche donc **même sans photo**. Dans le tableur (`_photoPop.plan`), **une seule salle, celle du devoir**, comme l'encart (v2.75.2). Sur un **plan** (Plan Prof, Vue Élève — non placés compris —, plan de l'onglet Tablettes, plan QCMcam), la bulle ne montre **que la photo**, aucun mini-plan (`_photoPopSkipRoom` renvoie `'*'`, v2.100.2, demande de l'utilisateur : on a déjà le plan sous les yeux ; avant, seule la salle affichée était omise). Numéro de place par `qcmNumForCell(cls, roomId, …)` (pas `_qcmDisplayLabel`, qui ne connaît que la salle active). Plusieurs salles : séparées par un filet discret (`#photo-pop .mnp-rooms>div+div`, v2.88.0, demande de l'utilisateur).
- **Salle et plan du devoir : `_mnpEvalSeating(ev, cls)`** (v2.75.2). Éval passée : la salle enregistrée `ev.seatingRoomIds[cid]` si la classe l'a encore, sinon la salle active ; plan = appel du jour pris dans cette salle, puis photo `seatingHashes`, puis plan courant. ⚠️ `_evalPatternSeatingFor` ne sert que si la salle du devoir EST la salle active (il raisonne sur la salle active et écarterait la photo). Éval du jour / à venir / sans date : salle active et plan courant.
- `_mnpBuild(ev, cls, sid, maxW, roomId?, seating?)` : avec `ev` seul, salle et plan du devoir, orientation Plan Prof (r décroissant, c décroissant), place de l'élève en vert `.mnp-c.me` (vert fixe, lisible dans les deux thèmes), places occupées grisées, places sans table transparentes, trait de bureau en bas. Taille de case calculée pour tenir dans `maxW`. Masqué pour un élève caché en mode confidentiel.

### Plan de classe du Type B (`meval-plan-overlay`, bouton 🪑) — deux pièges

`_evalPlanOverlayOpen` regroupe les passations par **date per-classe** (`_passDateFor(p, cls.id)`) et `_evalPlanOverlayRender` ne montre que celles de la date choisie.
- ⚠️ **La date présélectionnée doit être lue par `_passDateFor`, pas `activePass.date`** (v2.54.1) : la date globale ne matchait aucune clé dès qu'une passation portait une date par classe (édition dans l'en-tête du tableur, éval multi-classes) — le plan s'ouvrait **vide sans un mot**, signalé en usage réel. Repli sur la date la plus récente si la clé n'existe pas.
- **Le rendu ne sort plus en silence** : `_emptyStateHTML` pour « aucune passation à cette date », « aucune salle active », « aucun élève placé dans <salle> », « aucune compétence sur cette passation ». Les passations « ⊘ non faites par cette classe » et le filtre de groupe du tableur y sont appliqués (hors groupe : estompés, `pointer-events:none`).

### En-tête des tableurs A/B — sélecteur de créneau `select.tableur-slot-sel` (v2.55.1)

⚠️ La règle globale des `<select>` (~l. 1946) impose `padding:6px 10px !important` : posé en ligne avec `max-width:48px`, il restait ~26 px moins la flèche — « M1 » s'affichait « M ». Le remplissage se bat **en feuille de style** (classe dédiée, 2 px, largeur au contenu bornée 34–72 px). Même famille que les champs de poids du Type D : sur toute case étroite, c'est le remplissage imposé par la règle globale qu'il faut d'abord neutraliser.

### Tableur B — descriptif de la passation au survol du code (v2.106.1)

La ligne du code court d'une passation (en-tête du tableur Type B) porte un `data-tip` (bulle globale `#gtip`, ~0,5 s) : « code — descriptif » (`p.name`), ou « aucun descriptif (clic droit sur l'en-tête pour en ajouter un) ». ⚠️ **Aucun `title` natif sur l'en-tête ni sur le champ** (v2.106.2) : le `title` du `<th>` (« … clic droit pour les autres options ») s'affichait en même temps que la bulle — signalé par l'utilisateur ; son texte est passé dans la bulle. `#gtip` passe en `white-space:pre-line` (les `\n` d'un `data-tip` sont rendus).

### Tableur — filtre de groupe Tous / G1 / G2 / G3 (v2.56.0)

Puces `#meval-tableur-gfilter` dans la barre du tableur (rendues par `_evalTableurRenderGroupChips` à chaque `_evalTableurRender`, cachées si la classe n'a aucun élève en groupe). Demandé pour les **passations par demi-groupe** : ne voir que les élèves présents. Le filtre agit dans `_evalTableurSortedSids` — donc sur les quatre tableurs, le collage, les stats du pied et le bilan compétences ouvert depuis le tableur (ils montrent ce qui est affiché) — et sur le plan de classe du Type B (élèves hors groupe estompés à leur place, `pointer-events:none`). Persisté dans `localStorage.planClasse_evalTableurGroup` comme le filtre du Plan Prof ; `_evalTableurGroup(cls)` retombe sur « Tous » si le groupe n'a personne dans la classe, et la puce d'un groupe vide est grisée (`_evalTableurSetGroup` l'ignore). ⚠️ Classe CSS **`.tgchip`**, pas `.gchip` : `setGroupFilter` éteint toutes les `.gchip` du document (même piège que `.amchip`). Test dans `run.test.js`.

### Tableur Type A/C — frontière exo + saisie en temps réel

- **Frontière entre exercices** (Type C) : la 1re colonne de chaque nouvel exo (header + cellule de saisie + footer stats) reçoit un `border-left:2px solid var(--ink-blue-soft)`. Set d'indices via `exoBoundarySet` calculé à partir de `exoGroups.colStart`.
- **Type C en-tête vertical** : code / barème / pastille compétence empilés sur 3 lignes (au lieu de code + max côte à côte) → colonnes peuvent rester serrées à 70px.
- **Saisie en temps réel** : `_evalTableurUpdate` met à jour la couleur de fond de la cellule + la couleur du texte à chaque frappe (plus besoin de refresh). Helpers `_evalTableurRefreshFooterStats`, `_evalTableurRefreshRowDerived`, `_evalTableurRefreshFooterStatsB` recalculent toutes les stats footer + colonnes dérivées (Σ exo, brut, comps inline) en place sans toucher au focus.
- **Confirmation hors barème** : `_evalTableurConfirmIfOutOfRange` (au blur) → `_uiConfirm` si la note finale est hors `[0, mn.max]`. Annuler = restaure la valeur d'avant focus (capturée dans `dataset.prevValue` à l'`onfocus`).
- **Code/barème serrés** Type A : `maxlength="5"` sur le code, `max=99` + largeur réduite (54px / 40px) pour le barème. Type C garde les dimensions historiques (60px / 40px, max=100).

### Affectation de compétences en lot (Type C)

Modale `meval-pick-comp` enrichie d'une section « 📋 Aussi appliquer à » qui liste les autres questions de l'éval, groupées par exercice, avec checkbox + boutons « Tout cocher / Tout décocher ». À l'apply, les compétences cochées sont écrites sur toutes les questions cibles d'un coup. Le picker accepte désormais un index unique (rétro-compat) OU un tableau. Bouton **🎯 Compétences…** ajouté dans la modale contextuelle d'une mini-note du tableur (clic droit).

### Tableurs — croix de saisie (v2.148.0, maquettes validées le 2026-10-15)
**Les quatre types** (avant : Type C seulement). La ligne et la colonne de la case en cours (focusin, `tr.meval-active-row`, `td.meval-active-col`) n'ont plus de filets ROUGES : les deux traits verticaux se confondaient avec une séparation d'exercice (signalé par l'utilisateur). Repères dans les marges, dans les deux modes, en `--highlighter` avec encre fixe `#1a252f` : nom de l'élève (`td.meval-active-name`), en-tête de la colonne (`th.meval-active-head`) et moyenne du pied (`td.meval-active-foot`) — ces deux derniers trouvés **par position** (cellule de la dernière ligne d'en-tête et de la 1re ligne du pied sous le centre de la case), car en B et D une passation ou une question porte une colonne par compétence. **Mode pastilles** (« E2 ») : la croix est surlignée en jaune (token `--cross-hl`, décliné en sombre et dans le bloc d'impression), case en cours cerclée d'encre. **Mode cases pleines** (v2.149.0, « inversion d'intensité », choisie après G2 puis G1) : sur la croix, chaque case garde la couleur de sa note, **pâlie si le jeu de couleurs est intense, avivée s'il est pastel**. `_tlSync` (déjà appelé par l'observateur pour `--lis`) pose aussi `--lis-x` (couleur transformée, `_crossColor`) et `--lis-ink` (encre, `_contrastTextColor`) ; le CSS ne les lit que sur la croix en cases pleines, hors Sobriété. Pâlir = mélange vers le papier (blanc à 62 % le jour, bleu nuit à 55 % la nuit) ; aviver = même teinte, saturation ×1,5 (≥ 0,65), clarté multipliée par 0,55 (0,75 la nuit). ⚠️ **Clarté proportionnelle, jamais fixe** (v2.149.1) : ramenée à une valeur fixe, elle rendait les 4 niveaux du Dégradé bleu identiques sur la croix — un dégradé d'une seule teinte ne se lit que par sa clarté. Le Dégradé bleu est avivé le jour (luminance moyenne 0,33) et pâli la nuit (0,28) : les deux gardent l'ordre des niveaux. Le caractère pastel est jugé **par palette affichée** (`_crossPaletteIsPastel(kind)` : `'levels'` pour les cases de compétence B/D, `'notes'` pour les notes A/C, qui suivent le jeu des notes s'il diffère) : id contenant « pastel » → pastel ; Classique, Livret scolaire, Daltonisme → intense ; sinon (Dégradé bleu, Personnalisé) luminance moyenne > 0,30. Case vide sur la croix : le jaune `--cross-hl`. G2 (liseré jaune) et G1 (pastille sur jaune) ont été essayés en v2.148.0 / 2.148.1 puis écartés. Retrait par `_tableurCrossClear(wrap)`. Audit : 0 écart dans les deux modes et les quatre types — en clair comme en sombre, sur les jeux Classique, Classique pastel et Dégradé bleu.

### Tableur de saisie — liseré, bandeau d'avancement, filtres (v2.90.0)
⚠️ **v2.92.0 : le liseré a été REMPLACÉ par une pastille** devant la valeur (`td::before`, 8 px, `left: max(3px, calc(50% - 2.1em))` pour se coller à la valeur centrée sans sortir d'une case étroite). Le liseré à gauche, même à 4 px, a été jugé pas assez visible ; l'utilisateur a choisi la pastille parmi six variantes maquettées (case pleine, fond teinté, liseré épais + teinte, barre en bas, cadre, pastille). Même mécanisme `--lis` ; valeur stockée `'bar'` inchangée (= pastille), classe `body.tableur-lisere` conservée. Le bouton « ● Pastilles / ■ Cases pleines » de la barre a été **retiré en v2.144.2** (demande de l'utilisateur : doublon du menu 🎨, qui porte le même choix). Ce qui suit décrit le mécanisme, toujours valable.
- **Couleur des cases : liseré à gauche (défaut) ou case pleine** — choix dans le menu 🎨 (le bouton visible `#meval-tableur-cellstyle-btn`, ajouté en v2.91.0, a été retiré en v2.144.2) (`input[name="tableur-cellstyle"]`), `localStorage.planClasse_tableurCellStyle`, classe `body.tableur-lisere`. ⚠️ **Mécanisme : un `MutationObserver` sur `#meval-tableur-wrap`** recopie le fond EN LIGNE de chaque `td.meval-cell-note` / `td.meval-cell-comp` dans la variable `--lis` (`_tlSync` ; fond `var(...)` → transparent), que le CSS dessine en `box-shadow: inset 4px` en neutralisant le fond. Choisi plutôt que de modifier la trentaine de sites qui posent un fond (rendus ET rafraîchissements en place des 4 types) : tout nouveau site est couvert sans y penser, **à condition de poser le fond en style inline sur le `<td>` portant l'une de ces deux classes**. Sobriété annule aussi le liseré.
- **Bandeau d'avancement** `#meval-tableur-synth` (`_tableurSynthRender`) : saisis / présents (barre), moyenne · médiane · σ, absents, commentés — sur les lignes affichées (filtre de groupe compris). Re-rendu par l'observateur après chaque rendu du tableau (`_tableurPostRender`) et, débouncé 400 ms, à la frappe.
- **Filtres** Tous · Non saisis · Absents · Commentés (`_tableurSetFilter`, `_tableurRowFlags`) : mémoire de SESSION, remis à « Tous » quand on change d'évaluation ; ils **masquent** les lignes (`tr.bf-hide`), le pied reste celui de la classe. ⚠️ `_evalTableurKey` **enjambe** les lignes masquées. Coupés en mode confidentiel.
- **Compétences en carrés** (v2.91.0) : `_compPillHTML` dessine un carré arrondi (comme `.lvsq` de la carte de maîtrise) — partout où il sert (tableurs B/C/D, bilan de compétences de l'éval, fiche). Classe `comp-pill` conservée pour la Sobriété.
- **Commentaire de cellule = coin rouge** (`.tcom-corner`) dans les 4 types — le badge 💬 des types A/C chevauchait la note ; il reste un élément cliquable (Entrée / clic) avec le nombre de commentaires dans son `aria-label` et son infobulle. En mode liseré le coin est `--margin-red`.
- ⚠️ Défaut antérieur corrigé : une case sans fond (NN, vide) n'avait AUCUNE couleur de texte et prenait le noir du navigateur — **1,18:1 en thème sombre** en mode case pleine. Règle de base `input.meval-niveau-input { color: var(--ink-deep) }`, **sans `!important`** (la couleur en ligne d'une case colorée doit garder la main).
- Audit : 0 écart, 4 types × 2 modes × 2 thèmes.

**Bandeau : bouton 🔗 de configuration des liens** masqué dès qu'au moins un lien existe (`renderUserLinks`) — il ne sert qu'à créer le premier ; ensuite ⚙ Réglages → 🔗 Liens (demande de l'utilisateur, v2.89.0).
