# Modèle de données et classes

> Mémoire détaillée du projet, rangée depuis CLAUDE.md le 2026-10-29 (texte inchangé). Contenu : modèle S (multi-salles, accesseurs, migrations), niveaux, arrivées et départs, transferts (évals orphelines), attributs des élèves, PP et délégué·es, AESH, onglet Classes, Nouvelle / Modifier la classe, niveau d’une classe, classes recomposées.

## Onglet Classes — modernisation v2.96.0 (maquette validée le 2026-10-07)

- **Bandeau** `.cl-synth` (classes réelles seulement — les recomposées recompteraient leurs élèves) : classes (+ recomposées), élèves (présents en classe), aménagés (agrandissements, tiers-temps), à faire (messages à passer + élèves à placer, `_clsUnplaced` : actifs, hors ULIS/UPE2A hors inclusion, sans place dans la salle affichée).
- **Cartes en grille** `.cl-grid` (`minmax(270px,1fr)`), **groupées par niveau** sous un intertitre `.cl-lv` (« 6e · 2 classes · 58 élèves »). ⚠️ Le fond de niveau (`levelBgColor`), la bordure `levelAccentColor` et l'encre `--cc-fg` sont **inchangés** (ne pas diluer). Carte (`_card` dans `renderClasses`) : nom, effectif + ♂/♀ (`.cc-chip`) + PP, salles, délégué·es en forme courte (`.cl-dlg`), barre non aménagés / aménagés (`.cl-bar`, en `currentColor`), ligne présents / non aménagés / aménagés, pastilles 📄 ⏱ 🪑 à placer 📣.
- **Infobulle** de la carte : année, inscrits / placés / présents, aménagés, PP, **délégué·es et suppléant·es**, disciplines.
- **Clic sur la carte = choisir la classe ET ouvrir l'onglet Élèves** (`_clsOpenEleves`, arbitrage de l'utilisateur). Actions en haut à droite : ✏️ (Modifier) et menu ⋯ (`.dd.dd-right` : Élèves, Plan, Modifier, Supprimer) — plus les gros boutons vert / rouge.
- **Classes recomposées** : même carte (`.cc-virtual`, avec « de 6e A 7 · … »), section à part ; « + 🧬 Classe recomposée » remonté dans la barre du titre (titre de l'onglet : « 🏫 Classes »).
- **Récap photocopies** en `<details>` **replié par défaut** (`.cl-recap`, état gardé pour la session dans `_clsRecapOpen`), totaux sur la ligne résumé. Tableau inchangé ; l'impression « 🖨 Effectifs » (`printClassesBilan`) n'est pas touchée.
- Audit : 0 écart en clair et en sombre (cartes, bandeau, récap ouvert, menu ⋯) ; aucun débordement à 375 px.

## Modèle de données (multi-salles)

```js
S = {
  classes:    { id: cls },
  eleves:     { id: stu },
  salles:     { salleId: salle },                         // catalogue global partagé (cf. ci-dessous)
  snapshots:  { id: snap },                               // archives datées (cf. section Snapshots)
  attendance: { classId: { recordId: attRecord } },       // appels enregistrés (cf. section Appels)
  tags:       { tagId: { id, abbr, name, color } },       // tags cumulables sur les élèves (DF, DNL...)
  tabletPools: { poolId: pool },                          // classes mobiles (cf. section Classes mobiles)
  movedHighlights: {                                      // surlignage rose persistant (cf. section dédiée)
    [classId]: { [salleId]: { keys: ['r,c', ...], hidden: bool } }
  },
  cur: classId
}

salle = {
  nom, rows, cols, positions_vides,
  schedule: {
    mon: [ { id, label, start: 'HH:MM', end: 'HH:MM' }, ... ],
    tue: [...], wed: [...], thu: [...], fri: [...], sat: [], sun: []
  },
  shuffleOpts: {                  // règles persistées par salle pour "🔀 Mélanger tout"
    frontFirst: bool,             // remplir d'avant en arrière (défaut true)
    spacing: { 2: 'spread'|'left'|'right'|'center'|'inside'|'outside', 4: ..., 6: ... },
    placeUlisAbsents: bool        // inclure ULIS et UPE2A hors inclusion (défaut false)
  },
  qcmExcluded: ['r,c', ...]       // places explicitement exclues de la numérotation QCMCam
                                  // (utile en Cas 3 séquentiel quand total > ARUCO_MAX — l'utilisateur
                                  // choisit en cliquant sur le plan QCMCam quelles tables n'auront
                                  // pas de marqueur). Stocké sur la salle car les marqueurs sont
                                  // physiquement collés sur les tables et partagés entre classes.
}

cls = {
  id, nom, année, eleves: [...sids],
  rooms: {
    [salleId]: {
      seating,
      groupes,                    // map 'r,c' → 1|2|3 (zone de placement G1/G2/G3)
      posTagId,                   // map 'r,c' → tagId (tag affecté à la place ; mut. excl. avec groupes)
      allowedFor,                 // map sid → ['r,c', ...] (places autorisées pour cet élève)
      ipadsByPool: {              // assignations distinctes par classe mobile
        [poolId]: { ce, g1, g2, g3 }  // ce = classe entière, g1/g2/g3 = groupes 1/2/3
      },
      aeshCount,                  // nombre d'AESH (0..6) — par couple (classe, salle)
      aeshSeating,                // map idx → 'r,c' : placement de chaque AESH (cf. section AESH)
      aeshLinks                   // map idx → [sid, ...] : élèves accompagnés
    }
  },
  activeRoom: salleId,            // salle visible / éditée
  activePool: poolId,              // classe mobile actuellement utilisée (cf. section "Classes mobiles")
  noNeighbors: ['sidA|sidB', ...]  // paires d'élèves à séparer (sids triés alphabétiquement, cf. section Contraintes)
}

stu = {
  id, nom, prenom, classe_id, oublis, non_travail,
  groupe,        // 1 (G1), 2 (G2), 3 (G3) ou null
  civilite,      // 'M' | 'F' | null
  ppre, pap, gevasco, ulis, ulis_incl, upe2a, upe2a_incl, pai,
  notes,         // texte libre affiché « 📋 Informations » (cf. section dédiée) — nom interne figé
  agrandissement, tiers_temps,     // aménagements d'examen, cumulables (suffixes -A / +⅓, cf. Attributs spéciaux)
  tags: [tagId, ...],              // tags cumulables (DF, DNL, etc.)
  history: [{ ts, type: 'oubli' | 'nt' }],
  reminders: [{ id, label, ts }]   // rappels « à vérifier » (cf. section dédiée)
}

attRecord = {
  id, ts, date: 'YYYY-MM-DD',
  slotId,                              // ex. 'M1', 'S2', null si hors créneau
  groupe,                              // 0=tous, 1=G1, 2=G2
  label,
  absents: [...sids],
  retards: { [sid]: 'HH:MM' },         // sid → heure d'arrivée
  eleves:  { [sid]: { nom, prenom } }, // identité minimale, conservée même si élève supprimé
  aeshAbsents: [{ salleId, idx }, ...], // AESH absentes (cf. section AESH — Phase 2)
  aeshSeatingSnap,                     // map idx → 'r,c' : positions AESH au moment de l'appel
  aeshCountSnap,                       // nombre d'AESH au moment de l'appel
  aeshSalleIdSnap                      // salle active au moment de l'appel
}
```

### Accesseurs proxy (compatibilité ascendante)
Pour ne pas réécrire ~150 références au code existant, `setupClassAccessors(cls)` installe via `Object.defineProperty` (non-énumérables) des getters/setters :
- `cls.seating`, `cls.groupes` → `cls.rooms[cls.activeRoom].{seating,groupes}` via `activeRoomData(cls)`
- `cls.ipads`, `cls.ipads_g1`, `cls.ipads_g2` → `cls.rooms[cls.activeRoom].ipadsByPool[cls.activePool].{ce,g1,g2}` via `activePoolData(cls)`
- `cls.configuration` → `S.salles[cls.activeRoom]` (rows, cols, positions_vides, salle)

`activePoolData(cls)` auto-crée `ipadsByPool[poolId]` si absent (lazy). `_ensureActivePool(cls)` choisit le 1er pool de `S.tabletPools` si `cls.activePool` est invalide.

À chaque chargement (init, fichier JSON, undo/redo), `applyAccessorsAll()` réinstalle les proxies.

### Migration auto
Ordre des migrations dans `postLoadHook()` :
1. `migrateToRooms()` — anciennes structures (`cls.configuration` + `cls.seating`) → modèle multi-salles. Crée encore les champs `room.ipads`, `room.ipads_g1`, `room.ipads_g2` (consommés par `migrateTabletAssignments`).
2. `migrateSchedules()` — ajoute `schedule` par défaut à toute salle qui n'en a pas (cf. `defaultSchedule()` : M1-M4 + S1-S3 lun/mar/jeu/ven, M1-M4 le mercredi, sam/dim vides).
3. `migrateTabletPools()` — crée 2 pools par défaut (CM1, CM2) si `S.tabletPools` est vide.
4. `migrateTabletAssignments()` — pour chaque `cls.rooms[salleId]` au format historique (`ipads`, `ipads_g1`, `ipads_g2`) → convertit en `ipadsByPool[<premier pool>].{ce,g1,g2}` puis supprime les champs hérités. Set `cls.activePool` au 1er pool si absent. Idempotent.
5. Migration légère sur `S.eleves` : ajoute `tags = []` et `civilite = null` si absents.
6. Migration légère sur chaque `cls.rooms[salleId]` : ajoute `posTagId = {}` et `allowedFor = {}` si absents.
7. Migration légère sur chaque `cls` : ajoute `noNeighbors = []` si absent ; supprime `cls.pairsStrictness` si présent (champ retiré — règle unique désormais).
8. `applyAccessorsAll()` — installe les proxies sur toutes les classes.

`postLoadHook()` initialise aussi : `S.snapshots`, `S.attendance`, `S.tabletPools`, `S.tags`, `S.userLinks`, `S.seatingSnapshots`, `S.movedHighlights` (tous `{}` ou `[]` si absents).

### Helper `_newRoomTemplate()`

Toutes les créations de room (au runtime — `mvc` save, `mce` ajout salle, duplication de classe, création depuis Config Salle) doivent passer par ce helper pour garantir une structure cohérente avec le modèle courant :

```js
function _newRoomTemplate() {
  return {
    seating: {},
    groupes: {},
    ipadsByPool: {},   // nouveau format (lazy peuplé par activePoolData)
    posTagId: {},
    allowedFor: {},
    aeshCount: 0,
    aeshSeating: {},
    aeshLinks: {},
  };
}
```

⚠️ Ne pas écrire en dur `{ seating:{}, ipads:{}, ipads_g1:{}, ipads_g2:{}, groupes:{} }` (ancien format legacy) — ces champs sont supprimés par `migrateTabletAssignments` au chargement mais pollueront la session courante jusqu'au prochain reload.

## Niveaux reconnus
| Code | Niveau     | Couleur      |
|------|------------|--------------|
| 10   | CP         | rose         |
| 20   | CE1        | orange       |
| 30   | CE2        | jaune        |
| 40   | CM1        | vert clair   |
| 50   | CM2        | vert menthe  |
| 60   | 6e         | bleu ciel    |
| 70   | 5e         | bleu         |
| 80   | 4e         | violet       |
| 90   | 3e         | mauve        |
| 100  | 2nde       | rose vif     |
| 110  | 1ère       | rouge clair  |
| 120  | Terminale  | terracotta   |
| 999  | Inconnu    | gris         |

## Arrivées / départs en cours d'année

Un élève peut arriver ou quitter l'établissement à toute date — pas seulement à la rentrée.

### Modèle (champs ajoutés à `stu`)
- `stu.arrivalDate` — `'YYYY-MM-DD' | null`. `null` = présent depuis la rentrée.
- `stu.departureDate` — `'YYYY-MM-DD' | null`. **Premier jour d'absence** (convention contractuelle). `null` = toujours présent.

Migration auto dans `postLoadHook` (les anciens enregistrements reçoivent `null` pour les deux champs).

### Helpers
- **`_stuActiveOn(stu, ymd?)`** — `true` si l'élève est actif à la date donnée (défaut : aujourd'hui). Règle : actif ssi `arrivalDate <= ymd < departureDate` (champs `null` = absence de borne). Placé juste après `todayKey()`.
- **`_stuDepartedOn(stu, ymd?)`** — `true` si l'élève est **parti** (départ effectif) à la date donnée (`departureDate` non nul ET `ymd >= departureDate`). À distinguer d'un élève « pas encore arrivé » : ce dernier garde sa place réservée, un élève parti voit sa place libérée.
- **`_freeDepartedSeats(ymd?)`** — libère la place des élèves au départ effectif : retire leur `sid` du `seating` de **chaque salle** + nettoie l'affectation tablette de la place (tous pools/modes). L'élève **reste dans la classe** (notes, bilans, historique, absences conservés) — seule sa chaise sur le plan redevient libre. Idempotent. Appelé dans `postLoadHook()` (rattrape les départs devenus effectifs depuis le dernier chargement, y compris via sync depuis une autre machine) et dans `saveEdit()` (libération immédiate dès qu'un départ devient effectif).
- **`_stuHasAnyNoteInPeriod(sid, classId, periode)`** — `true` si l'élève a au moins une saisie (note numérique, A ou NN) sur ≥ 1 éval comptée de la classe + période. Permet aux bilans d'inclure les élèves partis qui ont laissé des notes dans la période (un élève parti en cours de S1 figure quand même au bilan S1).
- **`_periodEndDate(periode)`** — renvoie la date de fin (YYYY-MM-DD) de la période donnée pour l'année scolaire courante. Semestre : S1 → 31/01, S2 → 31/08. Trimestre : T1 → 30/11, T2 → dernier jour de février (gère bissextiles via `new Date(y, 2, 0)`), T3 → 31/08. Période vide (« Toutes ») → fin d'année scolaire (31/08). Logique calquée sur `_currentPeriode` (année scolaire = septembre courant → août suivant).

### Édition
- **Ajout d'élève** (`addStudent`, modale `ms`) : champ optionnel `#ns-arrival` (Date d'arrivée). `departureDate` reste null à l'ajout.
- **Modifier élève** (`openEdit`/`saveEdit`, modale `me`) : deux champs date `#es-arrival` et `#es-departure`. Validation : `arrivalDate < departureDate` strict (toast d'erreur sinon).

### Effets
- **Plan de classe** (`buildCell`, `renderStudentView`) : si `!_stuActiveOn(stu)`, la cellule est rendue comme vide. Deux cas distincts :
  - **Pas encore arrivé** (`arrivalDate` future) : le sid **reste** dans `seating` — la place lui est réservée et le siège le réaccueille dès qu'il devient actif. ⚠️ **La case n'est PAS dessinée vide** (v2.68.1, audit 2026-10-03 § 1.1) : classe `.reserved`, bordure pointillée, « 📅 Prénom NOM — arrive le JJ/MM ». Et `dropOnCell` **demande confirmation** avant d'y poser un autre élève (échange si on déplace un élève placé, place perdue si on pose un non placé). Avant, elle paraissait libre et le dépôt retirait l'élève attendu sans un mot.
  - **Parti** (`departureDate` atteinte) : sa place est **réellement libérée** par `_freeDepartedSeats` (sid retiré du `seating` + tablette nettoyée) — la chaise redevient libre (réutilisable au drag&drop, remplie au mélange). Le masque de `buildCell`/`renderStudentView` ne sert plus que de filet pour le court instant entre le passage de la date de départ et le prochain nettoyage (`postLoadHook` / `saveEdit`).
- **Liste « non placés »** (`renderUnplaced`) : exclut les inactifs (et un sid d'inactif présent dans `seating` ne compte pas comme placé).
- **Compteur `tg-count`** (Plan Prof) : `inFilter` filtré par `_stuActiveOn` → les inactifs ne sont ni placés ni à placer.
- **Onglet Élèves** (`renderStudents`) : ligne italique + opacity 0,55 + badge `📅 DD/MM/YYYY` (futur) ou `🚪 DD/MM/YYYY` (parti).
- **Tableur d'évaluation** (`_evalTableurSortedSids`, fiche `_evalOpenSaisie`) : `refDate = _evalDateFor(ev, cls.id) || todayKey()`. Un élève arrivé après ou parti avant la date de l'éval n'apparaît pas dans le tableur — cohérent avec « il n'était pas là ce jour-là ».
- **Bilan des notes** (`renderBilanTab`, `_bilanBuildRows`, `_bilanCrossTabBuild`) : élève affiché ssi `_stuActiveOn(stu, _periodEndDate(periode))` **OU** `_stuHasAnyNoteInPeriod(sid, cls.id, periode)`. Conséquence : un élève parti en cours de période figure quand même au bilan s'il a laissé des notes (sinon il disparaît). En mode Toutes, réf = fin d'année (31/08).
- **Bilan des compétences** (`renderCompetencesTab`) : même filtre que le Bilan des notes.

### Hors scope (volontairement non filtré)
- Snapshots de positions ou d'incidents : lecture seule de l'état historique, pas de filtre.
- Attendance / appels : les enregistrements passés restent intacts (un élève parti garde ses absences historiques).
- Évaluations existantes : la note d'un élève reste dans `ev.notes[sid].values` même si l'élève est parti après — c'est l'agrégation et l'affichage qui les masquent.

## Transfert d'élève entre classes en cours d'année (évals "orphelines")

Un élève transféré (via la modale Modifier → champ « Classe ») garde toutes ses notes dans `ev.notes[sid]` (indexées par sid, jamais par classe). Pour que ses notes de la classe précédente apparaissent quand même dans le bilan de la nouvelle classe, le système identifie automatiquement les **évals orphelines** : évals non rattachées à la classe courante mais où ≥ 1 élève affiché a une saisie.

### Modèle complémentaire
- `stu.previousClasses = [{classId, leftOn: 'YYYY-MM-DD'}, ...]` — log automatique ajouté par `_moveStudentToClass`. Traçabilité pure (pas utilisé par les calculs).

### Helpers
- **`_studentHasAnyDataInEval(ev, sid)`** — `true` si l'élève a une saisie (note numérique, A, NN pour A/C ; niveau ≥ 1 ou A pour B) dans l'éval, indépendamment de la classe d'attachement. Source de vérité pour détecter les orphelines.
- **`_evalOriginClassLabel(ev, currentClassId)`** — renvoie le nom de la 1re classe encore vivante référencée par l'éval qui n'est pas la classe demandée (pour les tooltips).

### Effets sur les calculs (déjà transparents)
- `_computeStudentMeanForPeriod(classId, sid, periode)` — filtre élargi : `_evalIncludesClass(e, classId) || _studentHasAnyDataInEval(e, sid)`. La moyenne d'un élève transféré inclut donc ses notes des classes précédentes.
- `_aggregateStudentCompetence(classId, sid, cid, periode)` — même filtre élargi pour les niveaux de compétences.
- **Pas d'impact sur les autres élèves de la classe** : les évals orphelines n'ont aucune saisie pour eux, donc n'entrent ni dans leur moyenne ni dans leur agrégation compétence.

### Effets visuels — Bilan des notes
- Collecte des évals affichées = union (`ownEvs` + `orphanEvs`) puis tri standard. `orphanEvs` = évals non attachées avec ≥ 1 sid affiché ayant une saisie.
- En-tête de colonne orpheline : marqueur **⤴** ambre + fond rayé léger (`repeating-linear-gradient`) + tooltip enrichi (« ⤴ Éval venant d'une autre classe : `<nom>` »).
- Cellules pour les élèves NON concernés (pas de saisie) : `·` discret sur fond rayé ambre, tooltip *« Élève non concerné — n'était pas dans la classe pour cette évaluation »*. Distinct de A (gris uni), NN (italique) et `—` (vide hors orpheline).
- Cellules pour l'élève transféré : rendu standard (note + couleur), mêmes tooltips que pour ses propres évals.

### Effets visuels — Bilan des compétences
- Collecte des compétences affichées = union via 2 boucles distinctes (`ownCompIds` puis ajout des compétences orphelines depuis les évals où `sidsForOrphan` a une saisie).
- `orphanCompIds` = `compIds \ ownCompIds`. Marqueur ⤴ + fond rayé en mode `code` ; en mode `domain`, un domaine est orphelin si toutes ses compétences le sont.

### Toggle « ⤴ Évals d'autres classes »
- Bouton dans la toolbar de tri du Bilan des notes ; bandeau au-dessus du tableau du Bilan des compétences.
- Visible uniquement si ≥ 1 orpheline potentiellement détectable (sinon le bouton ne sert à rien), OU si actuellement masqué (pour pouvoir réactiver). Le bandeau est conservé dans le Bilan des compétences même quand toutes les compétences sont orphelines et masquées (sinon l'utilisateur n'aurait pas de moyen de les réafficher).
- Persistance `localStorage.planClasse_bilanHideOrphans` (`'1'` masque, défaut `'0'`).
- Helper `_bilanToggleHideOrphans()` (partagé entre les 2 onglets bilan).

### Hors scope volontaire
- Tableur de saisie d'une éval : reste lié à la classe d'attachement (n'affiche pas les élèves transférés des autres classes).
- Plan de classe, appel, attendance : aucun impact, la classe « active » reste celle de `stu.classe_id` courant.
- Export ENT d'une éval seule : inchangé (ne liste que les élèves de la classe de l'éval).
- Export ENT du bilan compétences / des notes : bénéficie naturellement de la moyenne enrichie (puisque `_computeStudentMeanForPeriod` inclut désormais les orphelines).

## Attributs spéciaux par élève
- **ULIS** : élève ULIS hors inclusion dans la classe (case en transparence en Plan Prof)
- **ULIS inclusion** : élève ULIS inclus régulièrement dans la classe
- **UPE2A** : élève UPE2A (allophone) hors inclusion
- **UPE2A inclusion** : élève UPE2A inclus régulièrement
- **PPRE** : badge orange
- **Gevasco / PPS** : badge bleu
- **PAI** : badge rose `#ec4899` (Projet d'Accueil Individualisé — médical : allergies, asthme, diabète, etc.). **Cumulable avec TOUT le reste** (PPRE, PPS, ULIS, UPE2A…), contrairement aux autres statuts pédagogiques qui sont exclusifs intra-groupe. `STATUS_GROUP_C = ['pai']` (seul dans son groupe). Toggle `toggleStuPai(id)` / `ctxTogglePai()` avec icône ⚕️. Visible dans le tableau Élèves (bouton dédié rose), sur la cellule du plan (badge `.spec-pai`), dans le menu contextuel (sous-menu Aménagements), et dans la modale d'édition élève (checkbox dédiée). Comptabilisé dans le compteur "aménagement" du bilan classe et dans l'impression de la liste.
- **Agrandissement** (`stu.agrandissement`) et **Tiers-temps** (`stu.tiers_temps`) : deux **aménagements d'examen** cumulables avec tout, chacun seul dans son groupe (`STATUS_GROUP_D` / `STATUS_GROUP_E`). Rendus en **SUFFIXE** sur la pastille principale (`_agrPrimaryKey`) : `-A` et `+⅓` (U+2153 — glyphe de fraction minuscule dans la police, donc enveloppé dans `<span class="frac">` agrandi 1,55× en HTML ; `_agrSuffix(stu, key, html=false)` / `_agrExamSuffix(stu, false)` pour le texte brut des exports, cf. `_amenagementsLabel`), dans cet ordre — « PAP-A », « PPRE+⅓ », « PPS-A+⅓ » (`_agrExamSuffix`, `_agrSuffix`). Sans pastille à suffixer, pastille sarcelle `.spec-agr` seule portant le(s) suffixe(s) (`_agrStandalone`, `_agrStandaloneTitle`). Surfaces : cellule du plan, non placés, liste imprimée (`_amBadges`), boutons `📄-A` / `⏱+⅓` de l'onglet Élèves, menu contextuel, modale d'édition, carte de classe (puces `📄 N agrandissements` / `⏱ N tiers-temps` via `_classCounts`), import (colonne « Tiers-temps » ou valeurs `tiers temps` / `1/3` / `+⅓` / `TT` dans « Aménagements » — `_impNormAmen` ramène ces graphies à un jeton unique avant de découper, car `/` et `+` sont des séparateurs ; la forme collée « PAP-A » est aussi acceptée). ⚠️ **Tout nouveau groupe de statut doit être ajouté à `_statusGroup`** : une clé qu'il ne connaît pas est silencieusement ignorée par `_setStudentStatusExclusive`, donc le toggle ne fait rien (vu au premier essai du tiers-temps).
- **Groupes** : G1 (bleu), G2 (orange), G3 (violet) pour demi/tiers-groupes
- **Civilité** : `'M'` ou `'F'` (utilisée pour le mode couleur "genre")
- **Délégué·e de classe** : `stu.delegue` = `'T'` (titulaire, nom souligné) · `'S'` (suppléant·e, pointillé) · `null` — cf. section *👩‍🏫 Professeur·e principal·e & 🗳 délégué·es*
- **Tags cumulables** (`stu.tags = [tagId, ...]`) : DF, DNL, etc. — un élève peut en avoir plusieurs. Définis globalement dans `S.tags` (id, abbr, name, color). Affichés en chips colorés dans Plan Prof. Un tag peut aussi être affecté à une PLACE (`room.posTagId`) — mutuellement exclusif avec `room.groupes` au niveau de la place (une place est soit dans une zone G1/G2/G3, soit dans une zone de tag).

## 👩‍🏫 Professeur·e principal·e & 🗳 délégué·es de classe

Deux informations de « vie de classe », purement déclaratives : l'app les affiche, elle ne légifère pas (pas de limite de nombre, pas de contrôle). Cadrage arrêté avec l'utilisateur le 2026-09-11 (quatre arbitrages, tous sur l'option recommandée).

### Modèle
- **`cls.profPrincipal`** — texte libre (« Mme Dupont ») ou `null`. Migration légère dans `postLoadHook` (bloc par classe, à côté de `noNeighbors`) : tout ce qui n'est pas une chaîne non vide → `null`.
- **`stu.delegue`** — `'T'` (titulaire) · `'S'` (suppléant·e) · `null`. Migration légère dans le bloc par élève (à côté de `tags`/`civilite`) : toute autre valeur → `null`. ⚠️ **Pas d'éco-délégué·e** (arbitrage explicite) — deux styles de soulignement sont déjà à la limite du lisible ; un 3ᵉ rôle passerait par une pastille, pas un 3ᵉ trait.

Les deux voyagent dans le JSON / sync / undo / backups sans rien d'autre. Ni purge (pas indexés par sid/classId), ni section nouvelle dans `_validateImport`. Le rôle est un état **présent** : il n'entre ni dans les snapshots d'incidents ni dans les exports tableur.

### Table des rôles — source unique
`DELEGUE_ROLES = { T: { label, cls: 'dlg-t', short: 'D', hint }, S: { …, cls: 'dlg-s', short: 'S' } }` + helpers `_delegueInfo(stu)`, `_delegueNameCls(stu)` (→ `' dlg-t'` / `' dlg-s'` / `''`), `_delegueBadge(stu)` (pastille « 🗳 D » / « 🗳 S »), `_classDeleguesLine(cls)` (ligne de la carte de classe — noms triés, **élèves partis exclus** via `_stuActiveOn`). Mutation unique **`_setDelegue(id, code)`** (no-op si inchangé, code inconnu ⇒ retrait, `pushUndo` + `save` + re-render plan / liste / cartes) ; `ctxSetDelegue(code)` pour le clic droit.

### Convention visuelle : le NOM est souligné
Classes CSS **génériques** `.dlg-t` (trait plein 2 px) / `.dlg-s` (pointillé 2 px), `text-underline-offset:3px`, `text-decoration-skip-ink:none`. Le trait prend `currentColor` → il suit le thème et la couleur de texte de la cellule (absent, mode genre…) **sans variante sombre dédiée**, et passe tel quel en N&B. Posées sur :
- **Plan Prof** : le `.cn` des deux branches de `buildCell` (appel et normale) — prénom ET nom soulignés (le `<br>` est dans le même bloc). L'infobulle de la cellule commence par « 🗳 Délégué·e » / « 🗳 Suppléant·e ».
- **Plan imprimé** : le `.pn` de `doPrint('t')` et de `buildTeacherPageHTML` (Plusieurs plans). Pas l'impression de la Vue Élève (`doPrint('s')`).
- ⚠️ **Pas la Vue Élève** (le plan projeté) : la v2.96.2 l'y avait mis sur un malentendu (« en vue élève » voulait dire **l'onglet Élèves**), retiré en v2.96.3.
- **Onglet Élèves** : NOM Prénom souligné (`.stu-name-link` reçoit `_delegueNameCls`, v2.96.3 — demande de l'utilisateur : « pas juste la petite vignette » ; le soulignement de survol du lien est coupé sur ces noms, `.stu-name-link:not(.dlg-t):not(.dlg-s):hover`) **et** pastille `.dlg-badge` après le prénom (tokens `--paper-warm` / `--ink-blue` / `--rule-line`, donc thème sombre OK) — **pas de bouton** dans la ligne, déjà chargée.
- **Carte de classe** (v2.96.1) : ligne compacte `.cl-dlg` « 🗳 Ethan G., Robin H. · suppl. Enzo D., … » (prénom + initiale du nom, soulignés `.dlg-t` / `.dlg-s`), noms complets dans l'**infobulle**. La v2.96.0 les avait mis en infobulle seulement : l'utilisateur ne les voyait plus. `_classDeleguesLine` n'est plus appelée par `renderClasses`.
- **Fiche élève** (`renderRemarkWriter`) : « 🗳 Délégué·e » dans l'en-tête, cliquable vers Modifier l'élève.

### Où ça se règle
- **Clic droit sur une cellule** → sous-menu `🗳 Rôle dans la classe ▸ Aucun / Délégué·e / Suppléant·e` (entre 🎓 Aménagements et 🪪 Fiche). `showCtxMenu` pose ● sur l'état courant (`#ctx-role-*-lbl`).
- **Modifier l'élève** (`me`) : `<select id="es-delegue">` sous Groupe (`openEdit` / `saveEdit`).
- **PP** : champ `#ec-pp` dans Modifier la classe (`editClass` / `saveClassEdit` — lu AVANT `_commit`, qui peut tourner après une confirmation) et `#nc-pp` à la création (`createClass`). Pas sur les classes recomposées (`mvc`) : une recomposition n'a pas de PP.

### Bandeau : `_refreshHdrClassInfo(cls)` — source unique
Le `#hdr-yr` (année, mono) est doublé d'un `#hdr-pp` (« · 👩‍🏫 Mme Dupont », sans, `--pencil`, `:empty{display:none}`). **Sept** sites écrivaient `#hdr-yr` à la main (`switchClass`, `saveClassEdit`, `init`, quatre rechargements) : tous passent par ce helper. ⚠️ **Ne plus écrire `hdr-yr.textContent` directement** — le PP ne suivrait pas.

### Démo
`createDemo` pose un PP par classe (`Mme Dupont`, `M. Bernard`…) et 2 titulaires + 2 suppléant·es (indices 4, 9, 14, 19) — pour que le soulignement se voie dès le premier lancement.

Tests : `test/run.test.js` (migration T|S|null et PP, helpers de rendu avec tri et exclusion des partis, `_setDelegue` no-op / code inconnu / compte d'undo).

## AESH — Accompagnant·e·s d'Élèves en Situation de Handicap


### ⚠️ v2.93.0 — les AESH sont un réglage de la CLASSE (refonte demandée le 2026-10-06, maquette validée le 2026-10-07)

Avant : un slot anonyme par couple (classe, salle), réglé dans Config Salle → mode AESH (nombre, case sélectionnée puis « Placer », élèves liés) — à refaire dans chaque salle de la classe. Arbitrages de l'utilisateur : réglage **par classe** ; **nom facultatif** ; **pas de créneaux de présence** (la règle du filtre de groupe reste la seule) ; les classes recomposées ont leurs propres AESH.

- **Modèle** : `cls.aesh = [{ id, nom, sids: [...] }]` — **source de vérité**, l'ordre donne l'index. Chaque salle ne garde en propre que la **position** `room.aeshSeating {idx:'r,c'}`. `room.aeshCount` et `room.aeshLinks` sont des **COPIES** tenues à jour par **`_aeshSyncRooms(cls)`**, pour tout le code historique qui raisonne par salle (rendu, appel, mélange, impressions, QCMcam, instantanés). ⚠️ **Ne jamais écrire `room.aeshLinks` / `aeshCount` directement** : modifier `cls.aesh` (via `_aeshSetLink`, `_aeshRemoveAt`…) puis synchroniser. `activeRoomData` resynchronise si le nombre diverge ; `_attachSalleToClass` synchronise la nouvelle salle.
- **Libellé** `aeshLabel(idx, total, cls?)` : le nom saisi, sinon `AESH` / `AESH1`… (cls omis → `getCls()` ; à passer quand la classe n'est pas la classe affichée : impressions multi-classes, QCMcam, appels). Nom assaini à la saisie par `_aeshSafeName` (sans `<>&"\``, `'` → `’`, 30 car.) : le libellé est injecté à des endroits historiques qui ne l'échappaient pas (il était constant).
- **Conversion** `_aeshMigrateClass` (fin de `postLoadHook`, avant l'audit) : autant d'AESH que la salle qui en avait le plus ; élèves = union des salles (un élève n'a qu'une AESH, la première rencontrée l'emporte ; sids non membres écartés) ; positions conservées salle par salle. Une salle qui n'avait pas d'AESH en reçoit donc, « à placer ».
- **Où ça se règle** : fenêtre **`maesh`** (`openAeshModal(cls)`, `renderAeshModal`, dans `_MODAL_RERENDER`) — nom, élèves (chips ✕ + menu « ＋ élève… », un élève lié ailleurs y est déplacé), état de placement par salle, 🗑 (confirmation s'il y a des élèves ou une place ; positions des suivantes décalées). Enregistrement au fil de l'eau, annulable (nom : `_evalArmUndo`, une entrée par salve). Ouverte depuis : **Modifier la classe** (section 🧑‍🏫 AESH : résumé + « Gérer les AESH… » — fenêtre à part car `mce` est un formulaire dont « Annuler » ne doit pas mentir), **Classe recomposée** (`#mvc-aesh-box`, en modification seulement ; élèves proposés = membres ENREGISTRÉS), **fiche élève** (drapeau « 🤝 accompagné·e par X » et ligne AESH de Place & matériel, via `_rwParenthesis('maesh', …)`), **clic droit** « ⚙ Régler les AESH… », et `setCfgMode('aesh')` (redirection — le chip de Config Salle est masqué, les fonctions `cfgAesh*` / `renderAeshConfigBar` et la barre `#cfg-aesh-bar` ont été supprimées).
- **Modifier l'élève** : menu `#es-aesh` (Aucune / chaque AESH / ＋ Nouvelle AESH), appliqué à la classe où il a été rempli, si l'élève y est toujours (pas après un changement de classe — `_moveStudentToClass` retire l'élève des AESH de l'ancienne classe).
- **Placement sur le Plan** : une AESH non placée dans la salle affichée (et présente pour le filtre de groupe) apparaît en tête des **non placés** (`.us.us-aesh`, `startDragAeshUnplaced`, glisser tactile `_tdAttach` avec `fromKey: null`) ; on la glisse sur une table vide ; posée sur une autre AESH, celle-ci redevient non placée. Déposer une AESH placée dans la liste la retire (`dropToUnplaced`). « 🔀 Mélanger tout » la place toujours à côté de ses élèves.
- **Instantanés** : la restauration ne remet que les **positions** (le nombre et les élèves accompagnés sont des réglages de classe).
- Purge : `_purgeStudentRefs` (sids), `mvcSave` (membres retirés). Tests dans `run.test.js` (conversion, un élève = une AESH, suppression avec décalage, purge, libellé).

- **Fenêtre `maesh` — refonte v2.115.0 (maquette validée le 2026-10-07)** : en-tête « AESH — classe » + ＋ Ajouter ; bandeau `#maesh-synth` (`_bsynthCard` : AESH, élèves accompagnés + élèves PPS / ULIS / PAP **sans** AESH, places posées / attendues) ; **une carte `.aesh-card` par AESH** (initiales `.aesh-av`, nom sur place, groupes de présence déduits des élèves — « présente avec G1 et G2 (et « Tous ») » —, 🗑) ; élèves en pastilles avec aménagements (`_ficheSpecBadges`) et groupe ; « ＋ élève… » met **PPS, ULIS, PAP en tête** (`_aeshPrio`, `<optgroup>`) ; **placement par salle** en pastilles : « placée » (vert) ou **« à placer › »** (`_aeshGoPlace` : ferme les fenêtres ouvertes sans jouer leur retour, passe sur la classe, met cette salle affichée, ouvre le Plan et fait clignoter l'AESH dans les non placés, `.aesh-flash`). **Suggestions** `#maesh-sug` : les élèves PPS / ULIS / PAP sans AESH, **à glisser sur une carte** (`_aeshSugDown` / `_aeshSugMove` / `_aeshSugUp`, Pointer Events écoutés sur `document`, fantôme `.aesh-ghost`, carte visée `.drop-on` ; un simple clic affiche un rappel « glisse »). Audit : 0 écart en clair et en sombre (avec et sans AESH) ; 360 px à 375 ; glisser vérifié au vrai pointeur.

Helpers historiques toujours valables (ils lisent les copies par salle) : `aeshAtKey(cls, key)`, `aeshHelpingSid(cls, sid)`, `aeshIndices(room)`, `_aeshPresentForFilter(cls, idx, filter)`.

### Présence selon le filtre groupe (Phase 4)

Une AESH n'est physiquement en salle que quand un de ses élèves accompagnés y a cours. Conséquence : quand le filtre groupe est actif (G1/G2/G3), une AESH n'apparaît que si **au moins un élève qu'elle accompagne appartient au groupe filtré**.

- **Filtre Tous (0)** : toutes les AESH configurées sont présentes.
- **Filtre G1** : AESH présente ssi ≥ 1 élève lié avec `stu.groupe === 1`.
- **Filtre G2 / G3** : idem avec le groupe correspondant.
- **AESH liée à 2 élèves dans des groupes différents** (ex. un en G1, un en G2) : présente dans **les deux** filtres correspondants (cas mixte légitime).
- **AESH sans aucun élève lié** : absente de tout filtre groupe spécifique (visible uniquement en « Tous »).

Helper central : **`_aeshPresentForFilter(cls, idx, filter)`** — retourne `true` si filter=0 ou si au moins un sid lié a `stu.groupe === filter`.

Effet sur l'UI quand l'AESH n'est pas présente pour le filtre actif :
- **Plan Prof** (`buildCell`) : cellule reçoit la classe `.ghost` (opacity .22, `pointer-events:none` — donc drag/clic/toggle absence inactifs). Titre adapté : `« AESH — pas en salle pour G2 (n'accompagne aucun élève de ce groupe) »`. L'état absent (mode appel/post-appel) est masqué visuellement (pas de 🚫, pas de classe `.absent`).
- **Vue Élève** (`renderStudentView`) : cellule rendue comme vide (`em`) au lieu du fond rose AESH — les élèves ne voient pas le slot inutile.
- **Compteur `tg-count`** : `🧑‍🏫 N/M AESH placée(s)` compte uniquement les AESH présentes pour le filtre. `🚫 X AESH absente(s)` idem.
- **Impressions Plan Prof / Vue Élève** (`doPrint` mode 't' et 's') : AESH ghost rendue comme cellule vide (pas de marqueur 🧑‍🏫, pas de label rose) — un plan imprimé pour G1 ne montre pas une AESH qui ne sera pas là.

**Inchangés** (sciemment hors-scope, parce que la donnée concernée n'est pas dépendante du groupe en cours) :
- **QCMCam export** (`_allQcmLines`, `renderQcmcam`) : les marqueurs ArUco sont physiques sur les tables, indépendants du groupe.
- **Auto-placement / mélange aléatoire** (`_doOneRandomPlacement`) : placement physique de la chaise AESH, ne change pas selon qui a cours.
- **Snapshots de positions** : lecture seule de l'état historique, pas de filtre groupe.
- **Impression « Plusieurs plans »** (`buildTeacherPageHTML`) : utilise effectivement `groupFilter=0` (impression globale toutes classes), donc toutes les AESH apparaissent.
- **Badge 🤝 sur élèves liés** : reste affiché. Quand une AESH est ghost pour un filtre, le ou les élèves liés sont eux-mêmes hors filtre (par construction du critère « présente ssi un élève lié est dans le filtre »), donc leur cellule est aussi ghost — le badge est faded avec le reste, cohérent.

### Plan Prof + Vue Élève
- Cellule AESH : fond rose `.cell.aesh`, icône 🧑‍🏫 + label, **pas de tablette** (exclue du récap et de l'auto-affectation via `_collectSeats`).
- Élèves liés : badge `🤝 AESH/AESH1/AESH2` rose à côté des autres badges (Plan Prof uniquement).
- Vue Élève : cellule `AESH` rose simple sans badge.
- Drag & drop AESH (déplacement / échange avec autre AESH). Drop d'élève sur AESH → toast de refus.
- Glisser tactile (Touch Events) : l'AESH se déplace via `_tdAttach(cell, () => ({srcType:'aesh', aeshIdx, fromKey:key}), {})` — appui maintenu puis glisser (cf. section « Glisser & déposer »).
- Compteur `tg-count` enrichi : `🧑‍🏫 N/M AESH placées` + `🚫 X AESH absentes` (en mode appel).

### Mode appel (Phase 2)
- `_aeshAbsentToday` (Set 'classId|salleId|idx') persisté dans `localStorage.planClasse_attTransient`.
- Reset : minuit, sortie du créneau enregistré, `↺ Tout présent` (clear ciblé sur la classe active uniquement).
- Cellule AESH en mode appel : clic = `toggleAeshAbsence` (style hachuré + 🚫). En post-appel : visuel conservé jusqu'à la fin du créneau (lecture seule, drag réactivé).
- À l'enregistrement : `record.aeshAbsents = [{salleId, idx}, ...]` + snapshot des positions (`aeshSeatingSnap`, `aeshCountSnap`, `aeshSalleIdSnap`) — **figées** comme `seatingHash` pour les élèves.
- En édition explicite (UPDATE) : les snaps de position **ne sont pas** réécrits ; seules les absences sont mises à jour.
- Détail d'un appel (`_attDetailBodyHTML`) : section "🧑‍🏫 AESH absentes" avec libellé selon config actuelle (fallback "AESH#N (config modifiée depuis)" si la salle/AESH a changé).
- Modale "Plan de l'appel" (`mattPlan`) : utilise `aeshSeatingSnap` si dispo + même salle, sinon fallback sur position actuelle.

### Snapshots positions (Phase 2)
- Capture : ajoute `aeshCount`, `aeshSeating`, `aeshLinks` dans `data`.
- Restauration : remet ces 3 champs sur la salle active ; `aeshLinks` filtré pour ne garder que les sids encore dans la classe.
- Consultation read-only (`buildSnapshotCell`) : rend les AESH du snapshot.

### Mélange aléatoire (Phase 3)
Dans `_doOneRandomPlacement`, AVANT le placement standard des élèves :
1. **Auto-placement AESH** sur tables libres avec règles strictes :
   - (a) **Jamais sur un groupe de 1 table** (l'AESH ne peut aider personne)
   - (b) **Jamais en extrémité** d'un groupe ≥ 3 tables (au milieu uniquement, pour accompagner les deux côtés)
   - (c) **Préférence** : groupe de taille ≥ K+1 où K = nb d'élèves liés (assez de voisins côté potentiels). Cascade de fallback si pas dispo.
2. **Éviction collision** : si une AESH atterrit sur une case élève, l'élève est remis dans `studentsToPlace`.
3. **Pré-affectation des élèves liés** sur positions adjacentes via `_aeshAdjacentKeysPriority(salle, key)` — priorités strictes (groupe 1 entièrement consommé avant le 2, etc.). **Règle de l'utilisateur (2026-09-23, v2.59.0)** : à gauche ou à droite ; s'il n'y a pas le choix, devant ou derrière, **diagonales comprises** ; traverser une allée seulement en dernier recours :
   - **1** côté immédiat (r, c±1)
   - **2** derrière (r+1, c) puis (r+1, c±1) · **3** devant (r−1, c) puis (r−1, c±1)
   - **4** dernier recours : la table suivante au-delà d'une allée (≤ 3 cases), même rangée puis derrière puis devant
   ```
   [2][2][2]
   [1][AESH][1]
   [3][3][3]
   ```
   ⚠️ **Avant la v2.59.0, « côté au-delà de l'allée » passait AVANT « derrière »** (ancien schéma `[5][X][3][4] / [2][X][AESH][1]`, remplacé). Mesuré sur la salle ÎlotB (îlots 2×2), avec 2 élèves liés : le 2ᵉ partait sur l'**îlot voisin** 118 fois sur 300, alors que la place derrière l'AESH, dans son îlot, était libre. Avec `{ tiers: true }`, la fonction renvoie `{ side, near, far }`.
   - **Choix de la place de l'AESH (règle d)** : parmi les candidates des règles a–c, on garde celles qui ont au moins K voisins **libres** à côté (K = nombre d'élèves liés) ; à défaut, au moins K voisins à côté + devant/derrière (et parmi elles, le plus de voisins à côté) ; à défaut, celles qui en ont le plus. Sans cela, dans une salle en îlots 2×2 (un seul voisin de côté par table), l'AESH tombait n'importe où. Mesuré après correction sur 150 mélanges × 7 salles de la démo : 100 % à côté ou devant/derrière. Seule exception : plus d'élèves liés que de voisins physiques (4 élèves autour d'une AESH dans un îlot de 4 tables).
4. **Exclusion** : positions AESH retirées du `targetSet` (cibles de blocs) et de `all` (places candidates pour chaque élève).

### Modale "Mélanger tout"
- Toggle **🧑‍🏫 Conserver la place des AESH** (visible si ≥ 1 AESH configurée, défaut `true` — persisté dans `salle.shuffleOpts.keepAeshPlacement`).
  - Coché : seules les AESH non-placées (ou à key invalide) sont auto-placées.
  - Décoché : toutes les AESH vidées puis re-tirées au sort.

### Surlignage rose (post-mélange)
"🔀 Mélanger tout" (reshuffle:true) **ne déclenche pas** `_recordMovesFromDiff` (~100% de la salle bouge → l'info "ce qui vient de bouger" perd son utilité) **et clear** au préalable le bucket `S.movedHighlights[classId][salleId]` (sinon les surlignages d'opérations antérieures restent visibles).

### QCMCam export (Phase 3)
- `_allQcmLines()` : pour chaque salle, AESH placées mêlées aux élèves placés et triées par `seatOrder`. Identité = `aeshLabel(idx, total)`. Identifiant `clsId-salleNom` inchangé.
- `renderQcmcam()` (tableau onglet QCMCam) : AESH placées de la salle active apparaissent comme entrées distinctes (sid pseudo `__aesh_N`).

### Impressions
- `doPrint('t')`, `doPrint('s')`, `buildTeacherPageHTML` rendent les cellules AESH (rose `.pcell.aesh`, icône + label). Plan Prof imprimé : badge `🤝 AESH` sur les élèves liés.
- CSS `@media print` : fond rose préservé en couleurs ; en N&B (`_applyPrintColorMode`), bordure noire forte pour rester reconnaissable.

## Nouvelle classe / Modifier la classe — refonte v2.113.0 (maquette validée le 2026-10-07)

Un seul gabarit pour `mc` et `mce` (`.clf-*`, 900 px, deux colonnes `.ev-cols`) : en tête, un **aperçu de la carte** en direct (`_clfPreview(prefix)`, `prefix` = `'nc'` | `'ec'` : `levelBgColor` / `levelAccentColor` / `_contrastTextColor`, comme `renderClasses`) ; à gauche **Identité** (nom, identifiant en création, année, niveau, PP) ; à droite **Salles** et **Disciplines** en pastilles `.clf-pill` (vraies cases à cocher, `_clfPillHTML`), plus **AESH** en modification.
- **Niveau en boutons par cycle** (arbitrage de l'utilisateur : pas seulement le collège) : `Auto (…)` · École ▾ · Collège ▾ · Lycée ▾ · Autre, puis les niveaux du cycle déplié (`LEVEL_CYCLES`, `_clfRenderLevel`, `_clfShowCycle`, `_clfSetLevel`). La valeur vit toujours dans le `<select>` caché `#nc-niveau` / `#ec-niveau`, lu par `_readLevelSelect` — `createClass` / `saveClassEdit` n'ont pas changé sur ce point.
- **Identifiant déduit du nom pendant la frappe** (`_clfNomInput` → `_impClassIdFromLabel`, tronqué à 10) tant qu'on ne l'a pas touché (`dataset.manual`, pastille « auto ») ; le vider rend la main au calcul. `_impClassIdFromLabel` compacte aussi les niveaux écrits en toutes lettres (« Terminale B » → `TB`, « Seconde 3 » → `23`, « Première A » → `1A`) — vaut pour l'import. En modification, l'identifiant n'est plus qu'un rappel dans le sous-titre (`#ec-sub`).
- **Création** (`_ncPrepare`, appelé par `openMod('mc')`) : salles cochables à plusieurs (défaut : la salle affichée de la classe courante, « ＋ Nouvelle salle » si le catalogue est vide ; la 1re cochée devient `activeRoom`) ; « Reprendre les salles d'une classe » (`_ncCopyFromClass`) coche ses salles et, à la création, en **copie les zones de groupes** (ancien choix `class:` du `<select id="nc-copy">`, supprimé). **Disciplines choisies à la création** (défaut : la principale) → `cls.disciplineIds` (avant : toutes, réglées ensuite dans Modifier).
- **Modification** : pastilles des salles avec le nombre d'élèves placés (salle affichée en premier, ●), des disciplines avec le nombre d'évaluations de la classe. Enregistrement et confirmation unique inchangés (`saveClassEdit`).
- Audit : 0 écart en clair et en sombre sur les deux fenêtres ; 360 px de large à 375, sans débordement.

## Niveau d'une classe (`cls.niveau`, v2.70.0)

Optionnel : code de `LEVEL_CODES` (10 … 120, 999 = Autre). Absent = déduit du nom (`classLevelOrder`), ce qui laissait « Sixième A », « Bilingue 6e », « ULIS » en « Autre ». ⚠️ **Toute lecture de niveau passe par `clsLevel(cls)`**, jamais `classLevelOrder(cls.nom)` : couleur et tri des cartes, sélecteur de classes du jeu de mémorisation et ses propositions, filtre par niveau de la classe recomposée, Comparer classes. Réglé par `<select>` (`_levelSelectHTML`, 1re option « Auto — d'après le nom (6e) ») à la création (`#nc-niveau`) et dans Modifier la classe (`#ec-niveau`). Valeur inconnue supprimée au chargement. **Aussi pour les classes recomposées** depuis v2.147.0 : même rangée de boutons dans la fenêtre `mvc` (`#mvc-niveau` caché + `#mvc-lvl`, préfixe `'mvc'` des helpers `_clf*` ; `_clfPreview('mvc')` renvoie vers `_mvcPreview`, la recomposée ayant son propre aperçu).

**Salles dans Modifier la classe** (`#ec-salle-checks`, `_ecRenderSalleChecks`) : une case par salle du catalogue, appliquées à « Sauvegarder » (pas tout de suite : la modale est un formulaire), au moins une gardée, **une seule confirmation** regroupant disciplines retirées et salles retirées dont le plan serait perdu. La carte de classe liste ses salles (📍, gras = salle affichée quand il y en a plusieurs).

## Classes recomposées (virtual classes)

### Groupes G1/G2/G3 propres à la recomposée (v2.73.0)
`cls.stuGroups = { sid: 1|2|3 }`, **seulement sur une classe recomposée**. Classe réelle : `stu.groupe`, inchangé. Régler un groupe depuis une recomposée (pastille G de l'onglet Élèves, clic droit, actions en lot) ne touche plus la classe d'origine (avant, si — avec un avertissement depuis v2.69).
- ⚠️ **Toute lecture du groupe dans le contexte d'une classe passe par `_grp(stu|sid, cls)`** (cls par défaut = `getCls()`), toute écriture par `_setGrp(stu, g, cls)`. Une soixantaine de sites convertis : plan, Vue Élève, filtres de groupe, compteurs, appel, mélange (zones de groupe), tablettes (modes G1/G2/G3, auto-affectation, plan de débordement), interroger, impressions du plan, Plusieurs plans, liste imprimée, tableau des positions, Vue d'ensemble et stats (par la classe de la ligne), tableurs (filtre, dates par groupe, absents, cases 🚪), exports XLSX/ODS. `stu.groupe` direct ne vaut plus que pour la **classe d'origine** : fiche (qui ajoute « · DNL : G2 » pour chaque recomposée), Modifier l'élève (`#es-grp-hint` le dit quand on l'ouvre depuis une recomposée), import, archives d'instantanés, démo.
- Initialisation : à la création d'une recomposée et pour un membre ajouté ensuite, **copie du groupe d'origine** ; à la migration (fichier antérieur), même copie — l'affichage ne change pas, seule l'indépendance arrive. Entrées hors 1..3 ou d'un non-membre supprimées au chargement ; la table est retirée d'une classe réelle.
- Purge : `_purgeStudentRefs` ; `mvcSave` ne garde que les membres restants. Test dans `run.test.js`.

Une « classe recomposée » est une `cls` avec `cls.virtual = true` créée via l'onglet Classes (bouton **+ Nouvelle classe recomposée**). Elle a son propre roster (sids issus de n'importe quelle(s) classe(s) réelle(s)), sa propre salle/plan, ses propres bilans et disciplines.

### Refonte v2.114.0 (maquette validée le 2026-10-07) — remplace la description ci-dessous là où elle diffère

Même gabarit que Nouvelle classe (`.clf-mb`, élargie à 1000 px, `.mvc-mb`) : aperçu de la carte (`_mvcPreview`, `.clf-prev.cc-virtual` : nom, effectif, « de 6e A 4 · 6e B 3 », salles, disciplines) ; bloc identité (nom, identifiant avec pastille « auto » — le vider rend la main au calcul —, année ; **salles en pastilles, plusieurs possibles** `_mvcRenderSalles`, la 1re cochée = salle affichée ; disciplines en pastilles ; AESH en modification) ; puis **deux colonnes** (arbitrages : a, b, c « actifs », d) :
- **Candidats** (`#mvc-students`) : seulement les NON-membres que la recherche et les filtres laissent voir, groupés par classe (« ＋ tout ajouter ») ; clic sur une ligne = ajout. **Membres** (`#mvc-members`) : tous, groupés par classe d'origine (« ✕ tout retirer »), compte F / G, ✕ par élève.
- **Présence par période = une pastille `<select class="mvc-per-pill">` sur chaque membre** (`_mvcPerPillOptions`, valeur `début|fin`, libellés `_mvcPerLabel` : « toute l'année », « à partir du S2 », « jusqu'au S1 », « T2 seulement », « du T2 au T3 » ; bornes normalisées par `_mvcNormBounds`) + « Pour tous » (`mvcSetAllPeriod`). Le bloc en deux étapes, la seconde case 🗓, « Cochés uniquement » et « Tout cocher » ont été **supprimés** (fonctions `_mvcBulk*`, `mvcBulk*`, `_mvcToggleAdvanced`, `mvcToggleShowOnly` retirées).
- **Filtres : seuls les actifs sont visibles** (`#mvc-fp-active`, clic = retirer le critère via `mvcDropFilter`, puce « tags : OU/ET » dès deux tags) ; les quatre lignes (tags, classes groupées par niveau avec la puce de niveau en gras, civilité, aménagements, clic cyclique exigé / exclu inchangé) sont dans « Filtres ▾ » (`_mvcToggleFilters`, replié à chaque ouverture). Filtre actif → ligne `#mvc-cand-actions` : « N correspondent · M déjà membres », **＋ Ajouter les N**, **− Retirer les M**, ↻.
- `mvcSave` : salles ajoutées / retirées (`_attachSalleToClass` / `_detachSalleFromClass`) ; **une seule confirmation** pour les salles retirées où des élèves étaient placés et pour une classe vide.
- Audit : 0 écart en clair et en sombre (filtres dépliés, exclusion, présence limitée) ; 360 px à 375, sans débordement.

### Modale `mvc` — filtres et présence par période

De haut en bas : nom / année / salle / identifiant, disciplines, **panneau de filtres** (toujours visible), recherche + « 👁 Cochés uniquement » + Tout cocher/décocher, bouton repliable **▸ 🗓 Présence par période**, liste des élèves groupée par classe. Tous les contrôles portent une infobulle ; couleurs en tokens (`.mvc-chip` / `.on` = `--chip-on-bg`, `.mvc-cls-head` = `--info-bg`, `.mvc-per-sel`, `.mvc-per-box`) — audit de contraste : 0 écart en clair et en sombre.

**Panneau 🔎 Filtrer les candidats** (v2.63.x). ET entre les lignes, OU dans une ligne. Quatre lignes, **pas plus** — l'utilisateur a jugé le panneau surchargé et fait retirer les compteurs à facettes, la ligne Groupe et la ligne « pas encore dans une classe recomposée » :
- **Tags** et **Aménagements** : clic cyclique **neutre → exigé → exclu (⊘ barré) → neutre** (`_mvcCycle` ; `tagIds`/`tagExcl`, `amen`/`amenExcl`). OU/ET au choix entre tags exigés ; aménagements exigés = l'un OU l'autre. Liste dans `MVC_AMEN` (PPRE, PAP, PPS, ULIS et UPE2A inclusion comprise, PAI, -A, +⅓, aucun). ⚠️ Un bouton « ⊘ Exclure » a été essayé puis retiré : l'utilisateur le croyait valable pour tout le panneau. Le cycle est annoncé dans l'infobulle du libellé de ligne.
- **Classes regroupées par niveau** : la puce de niveau (gras) coche/décoche toutes ses classes (`mvcSetFilterLevel`) ; bordure pointillée = niveau partiel. Il n'y a plus de dimension « niveau » distincte → plusieurs niveaux possibles.
- **Civilité**.
- ⚠️ Toute nouvelle ligne = une clé dans `_mvcEmptyFilters`, `_mvcHasFilter`, `_mvcStuMatches` et un rendu dans `renderMvcFilterPanel` — mais demander avant : le panneau est à sa limite.

**Les filtres restreignent l'AFFICHAGE de la liste** (`_mvcVisibility()` = filtres + recherche + « Cochés uniquement »). Un élève coché masqué reste membre — une ligne au-dessus de la liste le compte. ⚠️ « Tout cocher / décocher » et « + Tous / − Aucun » n'agissent **que sur les élèves visibles** ; tout retrait passe par `_mvcSetMember(sid, false)` (efface aussi `_mvcMembership` et `_mvcBulkSel`, comme la case individuelle).

**🗓 Présence par période** (repliée par défaut ; état `_mvcAdvancedOn`, `_mvcToggleAdvanced` / `_mvcResetAdvanced` — noms hérités de l'ancien « Options avancées »). Dépliée, elle montre le bloc `.mvc-per-box` en deux étapes, et sur chaque ligne cochée des sélecteurs « de … à … » plus une 2e case 🗓 (`accent-color: var(--disc-accent)`) :
- ① choisir les élèves (case 🗓, `_mvcBulkSel` ; ☑ Tous les membres / ☐ Aucun) ; ② « Présents du … à la … » + ✅ Appliquer / ↻ Toute l'année (`mvcBulkApplyPeriod`, `mvcBulkResetPeriod`). Les boutons de ② sont désactivés tant que ① est vide (l'infobulle dit pourquoi).
- ⚠️ **Seules les bornes qui ont un sens sont proposées** (`_mvcPerSelectOptions`) : « du » = début d'année · début du semestre 2 ; « à la » = fin du semestre 1 · fin d'année (trimestres : début du T2/T3, fin du T1/T2). Début de la 1re période et fin de la dernière valent « pas de limite » (valeur vide) : `_mvcNormBounds` y ramène les anciens `fromPer: 'S1'` / `toPer: 'S2'` à l'ouverture — sans quoi le sélecteur « à » ne trouvait pas l'option et affichait la première, « fin du S1 ». Libellés courts sur les lignes (« début S2 », « fin S1 »).
- Une plage inversée (début du S2 → fin du S1) est refusée, dans la barre comme sur les lignes (le sélecteur revient à sa valeur).

CSS responsive : `@media (pointer: coarse)` agrandit les cases (22px) et sélecteurs (font-size 1em, padding) — Surface / iPad.

### Workflow inverse depuis l'onglet Élèves

Sélection multi-élèves (clic & glisser) dans l'onglet Élèves → barre d'actions en lot → bouton violet **🧬 Classe recomposée** appelle `bulkCreateRecomposee()` qui ouvre `mvc` avec les sids pré-cochés (via `_mvcSelected`) et focus sur le champ Nom. Permet de créer un groupe DNL/Bilingue/Option en 3 clics.

### Appartenance per-période (`cls.membership`)

Pour les classes recomposées dont le roster évolue entre périodes (typique : Devoir Fait), chaque élève peut avoir un intervalle d'appartenance restreint : `cls.membership[sid] = { fromPer, toPer }`. Codes période (S1/S2 ou T1/T2/T3) ou null pour ouvert. Géré dans le bloc repliable **🗓 Présence par période** de la modale (cf. ci-dessus). Cf. section *Appartenance per-période* dans le bloc Disciplines pour les détails.
