# Audit du Type D (sommative par compétences) — 2026-08-02

Audité sur `main` @ `6242ba2` (v2.29.2). Méthode : lecture ligne à ligne du cœur de calcul,
balayage systématique des ~130 sites qui branchent sur le type d'éval (pour trouver ceux qui
ont oublié le D), sondes de cas limites dans le harnais de test (`__TESTEVAL`), puis passe
navigateur en interactions réelles (création → structure → saisie → ajustement → bilans →
exports, thèmes clair et sombre). 74/74 tests au vert avant et après.

## Verdict d'ensemble

**Le cœur du Type D est juste.** Cas canonique conforme (14,67 · RAI 4 · COM 3 ; Q3 en NN
→ 15 et COM → 2), A/NN sortent bien du numérateur ET du barème, granulométrie appliquée une
seule fois à la source, ajustements dans l'ordre documenté (set → mul → add → cap → borne),
copie annulée → compétences au plancher 1 sans toucher aux non-évaluées, agrégation de
période = un niveau entier par éval pondéré par coef (vérifié : moyenne 7,82 = (8,4×2+6,67)/3),
navigation par couples (question × compétence) correcte, migration défensive complète
(type dans la liste anti-destruction, scrub barème/poids/ajustements), purge élève couvrante.

**Les défauts sont aux frontières** : les surfaces annexes qui branchent sur le type et ont
oublié le D (export ENT, détail de calcul, auto-remplissage des absents, XLSX), un bouton
mort, et deux bugs transverses découverts à l'occasion (discipline fantôme à la création,
contraste des cellules de saisie en thème sombre).

---

## 🔴 Critiques

### 1. Discipline fantôme à la création — l'éval disparaît sitôt créée (PAS spécifique au D)
`openNewEvalModal()` appelle `_evalRefreshChannelSelect('meval-new')` (l. 33086) **avant**
`_evalRenderNewClassPicker(...)` (l. 33116) qui pré-coche la classe courante. À la première
ouverture, aucune classe n'est encore cochée → le select caché est peuplé avec le repli
`_disciplinePrimaryId()` = `disc_main`. Le refresh n'est rejoué qu'au toggle manuel d'un chip.
`_evalNewSave` fait confiance à toute valeur non vide présente au catalogue (l. 33478-33480)
→ l'éval est rattachée à une discipline que la classe n'enseigne pas → **absente de la liste
Devoirs et des deux bilans immédiatement après création**. Reproduit en réel : DS-D créée sur
6e A (SVT / SVT Bilingue) est sortie avec `disciplineId: 'disc_main'` et a disparu de partout.
L'enseignant croit l'éval perdue ; elle est seulement invisible sous tous les filtres.
- Touche **tous les types**, à la 1re ouverture de la modale par chargement de page (aux
  ouvertures suivantes, les checkboxes du rendu précédent sont encore dans le DOM et le
  refresh initial voit la bonne classe — d'où la non-détection lors des tests précédents).
- Correctif : déplacer l'appel de `_evalRefreshChannelSelect('meval-new')` APRÈS
  `_evalRenderNewClassPicker`. Envisager aussi un garde-fou dans `_evalNewSave` : si
  `_discNew` n'appartient à aucune classe cochée, retomber sur `_clsDefaultDisciplineId`.

### 2. Thème sombre : le texte des cellules de saisie de niveaux est écrasé en ambre (B **et** D)
Le rendu pose une couleur inline choisie par `_contrastTextColor(bg)` sur chaque input de
niveau, mais la **règle globale des inputs** (l. ~1748 : `input[type="text"], … { color:
var(--ink-deep) !important }`) la bat. La règle sombre dédiée exclut bien
`.meval-niveau-input` (`html[data-theme="dark"] input:not(.meval-niveau-input)…`) — la règle
de BASE, elle, ne l'exclut pas, et comme elle passe par `var(--ink-deep)`, elle devient ambre
en mode nuit. Mesuré : ambre `#e8d9b8` sur gris A `#9ca3af` ≈ **1,8:1**, sur vert `#16a34a`
≈ 2,3:1. En clair, l'effet est plus discret mais réel : le blanc choisi pour le bleu niveau 4
(`#2563eb`, 4,5:1) est remplacé par l'encre (3,3:1).
- Même famille que le piège n°1 du design system (CLAUDE.md) : ajouter `:not(.meval-niveau-input)`
  à la règle de base, comme `:not(.counter-input)` l'y est déjà.
- Concerne le tableur B autant que le D (même classe, même mécanisme inline).

---

## 🟠 Importants (fonctionnels, spécifiques D)

### 3. Bouton « + Exo » mort dans le tableur D
Affiché pour D (l. 35534) mais `_tableurAddExo` fait `if (ev.type !== 'C') return;`
(l. 40194). Clic réel : aucun effet, aucun message. S'il est réactivé pour D, créer la
question initiale au **format D** (`compWeights:{}`, pas `max:1`) et enchaîner sur le picker
de compétences, comme `_tableurAddMn` (l. 40155-40173) le fait déjà.

### 4. L'auto-remplissage « A » des absents ne se déclenche jamais en D
`_evalAutoFillAbsentsForMn` gère le D (pose A par (question × compétence) vide, l. 40677-40686)
mais le wrapper `_evalAutoFillAbsentsForEvalClass` ne traite que A/C et B (l. 40740-40748) —
et c'est LUI qu'appellent tous les points d'entrée utiles au D : date/créneau du bandeau
multi-classes du tableur (l. 35669, 35701) et Réglages per-classe (l. 33762). Sondé : 0 rempli
via le wrapper, 4 via ForMn sur le même état. Ajouter la branche D au wrapper.

### 5. Export ENT d'une éval D : compétences absentes, absent muet
- `_evalCompetencesEvaluated` n'a pas de branche D (l. 44300-44308) → « Compétences (0) »,
  case désactivée. Un type dont la raison d'être est la compétence exporte… sans compétences.
  (`_evalListEvaluatedCompetences`, l. 37243, sait faire — deux helpers jumeaux ont divergé.)
- `_evalStudentCompetenceLevel` (l. 44317) lirait `values` → niveaux nuls même si la liste
  était remplie. Déléguer à `_typeDCompLevel` comme `_evalStudentLevelForComp` (l. 37276).
- `_studentNoteAbsenceReason` n'a pas de branche D (l. 38606-38637) → un élève tout-A affiche
  une case **vide** (« — ») au lieu du code A. Vérifié à l'écran (export ENT et Bilan des
  notes). Même conséquence dans le popup bilan comps par éval (colonne Note).

### 6. « Détail du calcul » (historique élève → clic sur la note) cassé pour D
`_evalShowNoteDetail` route D vers la branche A/C (l. 15144+ : `values`, `mn.max`) →
« Barème **/undefined** » affiché tel quel, colonnes Saisi/Effectif vides. Vérifié à l'écran.
La section « Bilan compétences évaluées » de la même modale fonctionne (elle passe par le
helper D-aware). Il faudrait une table (question × compétence × niveau × poids), et au passage
mentionner un ajustement actif (la ligne « Note : 6,67/20 » n'explique pas le ×0,5).

---

## 🟡 Modérés

### 7. Export XLSX/ODS : le D est un angle mort complet
- `buildSheetEval` : D ne matche ni A/C ni B → feuille réduite au titre (l. 28133). Gap connu.
- Mais aussi : la **Synthèse** et la feuille **Compétences** n'agrègent que le Type B
  (l. 27771, 27777, 27909, 27931) → les niveaux D (et C inline d'ailleurs) sont absents du
  classeur. Les notes D apparaissent, elles, dans les feuilles Bilan S1/S2 (chemin générique).

### 8. « Projeter les notes » (mrendu) : colonnes questions mortes pour D
`_renduListCols` liste les mini-notes en colonnes `values` (l. 14706+) → toutes à « — » pour
D, et pas de Σ exercice (C-only). La sélection par défaut (Note /20 + compétences + remarque)
fonctionne — le D-aware `_evalStudentLevelForComp` est utilisé pour les comps. Soit proposer
des colonnes (question × compétence), soit ne pas proposer les colonnes questions en D.

### 9. Duplication d'une éval D : l'éditeur de barème affiché est inerte
En mode duplication, la branche `isDuplicate` de `_evalNewSave` copie l'éval source (donc son
`pointsParNiveau` — correct) mais **ne lit pas** les inputs du barème ni la case « bilan par
exercice » (le bloc D, l. 33459-33471, est dans la branche création uniquement). L'utilisateur
peut modifier des champs sans aucun effet.

### 10. Mode « date auto » proposé pour D alors qu'il ne peut rien calculer
`_autoAllowed = (type !== 'C')` aux deux endroits (création l. 33221, Réglages l. 33639) →
le bouton « ↻ Auto » s'affiche pour D, mais `_evalAutoUpdateDate.collectFor` renvoie null
pour D (l. 40106-40121) : cliquer efface le verrou manuel, la date ne bougera plus jamais et
la ligne affichera « (auto) » mensonger. Le D est une sommative : traiter comme C (manuel).

### 11. Suppression de question / d'exercice : les saisies D survivent en orphelines
`_evalEditRemoveMiniNote` (l. 34916-34918) et `_evalEditRemoveExo` (l. 34277-34281) nettoient
`values` mais pas `notes[sid].levels[mnId]`. Conséquences : le compteur « N saisie(s)
perdue(s) » de la confirmation lit `values` → annonce 0 pour une question D pourtant notée ;
et les restes font dire à `_studentHasAnyDataInEval` (l. 22388 : itère les clés de `levels`)
que l'élève « a des données » → compteur « saisis » de la liste et détection d'éval orpheline
faussés. Idem `_tableurMnDelete`/`_tableurExoDelete` si un jour câblés en D.

### 12. Barème non monotone accepté sans un mot → note > noteMax
`_computeStudentEvalNoteDInfo` prend `ptsMax = table[nb-1]` (le **dernier**, pas le max,
l. 32393). Sondé : barème [0,3,2,1] → note **60/20**. Barème constant [2,2,2,2] → 20/20
partout. Aucun garde-fou dans l'éditeur (création ni Réglages) alors qu'un barème décroissant
est forcément une erreur de saisie. Deux options cumulables : valider « strictement croissant »
à la saisie, et/ou `ptsMax = Math.max(...table)` en défense.

---

## ⚪ Mineurs / cosmétiques

13. **Bandeau d'aide de l'onglet Devoirs pas à jour** : « **Trois** types d'évaluations
    disponibles … *Prochainement : évaluation sommative par compétence* » — le D est en prod.
14. **Toast de pré-condition** : « Ajoute d'abord au moins une **mini-note** avant de saisir »
    sur une éval D (vocabulaire A ; en D ce sont des questions).
15. **Texte du picker de compétences** (partagé avec C) : « son niveau de maîtrise sera dérivé
    du score obtenu à cette question (voir Conversion note → niveau) » — faux en D, où le
    niveau est saisi directement.
16. **Pastille type dans « Comparer classes »** : ternaire A/B/C (l. 37558) → une éval D
    s'affiche `[A]`.
17. **Clamp couleur à 4 niveaux** dans le popup bilan comps par éval (l. 37849
    `Math.min(3, …)`) et mrendu (l. 14888) : avec 5-6 niveaux configurés, les niveaux 5/6
    prennent la couleur du 4. Préexistant (pas D-only), visible en D. La conversion C de
    `_evalStudentLevelForComp` (seuils 25/50/75 → 1..4, l. 37292-37296) a la même limite.
18. **Niveaux stockés > nbLevels** (réglage réduit après saisie) : affichés (« 5 », couleur du
    max) mais exclus du calcul — divergence affichage/calcul silencieuse. Et la migration
    régénère `pointsParNiveau` sans avertissement quand `nbLevels` change (alors qu'elle
    toaste pour les commentaires C). Cas rare, mais silencieux.
19. **Infobulle de compétence agrégée** (bilan de période) : les `entries` D (l. 43034) ne
    mentionnent pas le poids — une saisie ×2 s'affiche comme une saisie simple.
20. **Pas d'éval D dans la démo** (`_seedDemoEvaluations` couvre A/B/C) : un nouvel
    utilisateur ne voit jamais le type D en exemple.
21. **CLAUDE.md périmé sur deux points** : l'éditeur de barème EST dans meval-edit (la note
    « modifiable à la création seulement » ne tient plus), et la liste des gaps D peut
    intégrer les points ci-dessus.

## Constats de conformité (vérifiés, rien à faire)

- Saisie tableur D : validation dynamique, couleurs en direct, footer recalculé, `_evalArmUndo`
  par salve, resynchronisation des poids au blur, largeur des poids mesurée à l'exécution.
- Ajustement de note : modale complète (calculée → finale, presets, motif obligatoire,
  voidComps), clic droit réel OK, pastilles de compétence intactes après ×0,5, moyenne de
  classe sur la note sanctionnée.
- Bilans de période (notes + compétences) : colonne D badgée, moyenne pondérée par coef
  exacte, niveaux D en pastilles, orphelines/discipline filtrées comme les autres types.
- Navigation clavier : Tab/Entrée/flèches OK en interactions réelles (une fausse alerte levée
  pendant l'audit venait de l'outillage : `key "Return"` synthétique envoie `e.key` vide —
  avec une vraie touche Entrée tout est conforme).
- Sécurité : échappement systématique dans le rendu D (`_esc`/`_escAttr`/`_escJsAttr` sur les
  libellés), pas d'`eval`, `_csvCellGuard` sur les chemins d'export partagés.
- QCMcam masqué pour D (volontaire), fiche de saisie par élève inaccessible pour D (le bouton
  n'existe plus dans l'UI — pas de piège).
