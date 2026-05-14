# Plan de Classe — Contexte projet

## Application
PWA mono-fichier de gestion de plans de classe et placement d'élèves.
Utilisée par un enseignant pour gérer ses classes, ses salles et placer ses élèves.

## Design system (Carnet du prof)

L'app utilise un design system "papier d'enseignant" cohérent — paramétré via variables CSS au début du `<style>`.

### Palette "Blueprint" (par défaut, mode clair)
- `--paper` `#f4f6fa` (fond papier bleuté) · `--paper-warm` `#e6ebf2` (surfaces fixes) · `--paper-deep` `#d6dde6`
- `--ink-deep` `#0e1a26` (texte) · `--ink-blue` `#1a252f` (titres, sélections) · `--ink-blue-soft` `#2a3540`
- `--rule-line` `#c8d2e0` (filets) · `--rule-line-soft` `#dde4ee` (lignes Seyès en arrière-plan)
- `--margin-red` `#b03d2e` (filet rouge de marge gauche + accents) · `--margin-red-soft` (rgba)
- `--pencil` `#56697f` · `--pencil-soft` `#92a1b5`
- `--maitrise-1..4` (réservés pour le futur volet Évaluation : rouge, orange, vert, bleu profond)
- `--highlighter` `#f5d76e` (jaune surligneur, état post-appel)

### Mode sombre "veillée du dimanche soir"
Activé via `html[data-theme="dark"]` — texte ambre chaud (`#e8d9b8`) sur fond bleu nuit (`#13181f`), filets désaturés. Toggle dans le header (bouton `◐` / `☾`, id `#btn-theme`, fonction `toggleAppTheme()`), persisté dans `localStorage.planClasse_theme` et restauré au chargement via un IIFE en pied de script.

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

### Hints en pastilles `?`
Les anciens textes d'astuce `<span class="tb-hint">…</span>` sont visuellement convertis en **pastilles rondes grises** avec leur contenu transformé en infobulle native (`title=`). Conversion faite au runtime par `_initHints()` (parcourt les `.tb-hint`, déplace le textContent dans `title`, vide le texte visible). Appelé à `init()` puis re-déclenché après chaque `renderStudents()` via un wrapper sur la fonction d'origine. Pastille stylée via `.tb-hint::after { content: "?" }`.

### Impressions
Le filet rouge et les lignes Seyès sont **cachés à l'impression** via `@media print` (`body::before { display:none }`, `background-image: none`). Les couleurs des cellules sont gérées par `_applyPrintColorMode` (existant) pour le mode N&B.

## Fichiers
- `plan de classe.html` — application complète (HTML + CSS + JS dans un seul fichier)
- `index.html` — page de redirection servie à la racine `belenos-toutatis.github.io/plan-de-classe/`. Meta refresh + `<script>location.replace(...)</script>` vers `./plan%20de%20classe.html`. Mini design "carnet du prof" en fallback si la redirection traîne. Permet d'utiliser une URL courte au lieu de l'URL longue avec `%20`.
- `.nojekyll` — fichier vide. Désactive le pipeline Jekyll de GitHub Pages (sinon Jekyll prend `README.md` comme index automatique et ignore `index.html`). **Indispensable** pour que la redirection fonctionne.
- `manifest.json` — manifeste PWA (thème #1a252f, bleu foncé)
- `sw.js` — service worker (utilisation hors-ligne, network-first)
- `README.md` — documentation utilisateur (orientée GitHub)
- `LICENSE` — double licence : MIT (code de l'app) + CC BY-NC-SA 4.0 (composants ArUco — algorithme, mapping des 125 patterns, layout d'impression — dérivés de QCMcam par Sébastien COGEZ)
- `CREDITS.md` — remerciements détaillés à Sébastien COGEZ (QCMcam), à la communauté enseignante, et aux polices embarquées (Fraunces, IBM Plex Sans, JetBrains Mono — toutes sous SIL Open Font License)
- `.gitignore` — exclut les sauvegardes locales (`plan-classe-*.json`)
- `plan-classe-AAAA-MM-JJ-HHhMMmSS.json` — exports manuels horodatés (non versionnés)
- `plan-classe-auto.json` — fichier de sync auto (écrasé en continu, non versionné)
- `plan-classe-bk-AAAA-MM-JJ-HHhMMm.json` — backups horodatés (rétention par paliers, non versionnés)

## Données de démo (1er lancement)
`createDemo()` (fin du fichier, juste avant `init()`) génère des données fictives au tout premier lancement, conditionné par `localStorage.planClasse_demoInstalled !== '1'` :
- **4 classes fictives** : 6e A (30 élèves, 2 salles), 6e B (28, Salle 105), 5e A (32, 2 salles), 5e B (29, Salle 102)
- **2 salles** : Salle 102 (5×7 avec 3 places vides → 32 utilisables), Salle 105 (4×9 avec 4 vides → 32)
- **2 classes mobiles** customisées à 32 tablettes (CM1 et CM2)
- Tous les élèves placés dans leur(s) salle(s), n° de tablette CM1 affectés
- Quelques élèves PPRE / PPS / ULIS+, et compteurs d'oublis pré-remplis
- Une tablette indisponible dans CM2 (#7) pour démontrer la fonctionnalité
- Listes de noms : `_DEMO_PRENOMS` (~80) × `_DEMO_NOMS` (~50) avec génération pseudo-aléatoire déterministe (seed différent par classe)

À la fin de `createDemo()` : `localStorage.setItem('planClasse_demoInstalled', '1')` → ne se réinstalle jamais. La fonction de reset (totale ou partielle) ne touche pas ce flag, donc l'utilisateur ne revoit pas la démo après reset volontaire.

## Modal de bienvenue (`mwelcome`)
Affiché 300ms après init() si `createDemo()` vient d'installer les données fictives (renvoie `true`). Explique :
- Le contenu de la démo
- Comment partir d'un fichier vierge (Classes → 🗑 Réinitialiser → 🔥 Tout effacer)
- L'état localStorage / sync auto

Le bouton de fermeture **"👍 Compris, je découvre"** déclenche `closeWelcomeAndOpenAbout()` qui ferme mwelcome ET enchaîne automatiquement sur `mabout` (cf. section suivante) — pour que l'utilisateur voit les crédits et la licence dès le 1er lancement.

## Modale À propos (`mabout`)

Modale centralisée accessible **à tout moment** via le bouton **ⓘ** dans le header (à droite des boutons Sync/Export/Maj, fonction `openAbout()`). Anciennement plusieurs informations éparpillées (RGPD en bannière, crédits ArUco dans QCMCam, version dans `mupdate`, licence dans LICENSE seulement). 5 sections homogènes (classe CSS `.about-section` : fond `paper-warm`, bordure gauche `ink-blue`, h3 serif) :

1. **📦 Version & mises à jour** : `APP_VERSION` affiché dans `<code id="about-version-disp">`, bouton **🆕 Vérifier les MAJ** (appelle `checkForUpdate()` après avoir fermé `mabout`), liens GitHub repo + issues
2. **🙏 Crédits & remerciements** : Sébastien COGEZ (QCMcam) avec lien et licence CC BY-NC-SA 4.0, mention communauté enseignante, renvoi vers `CREDITS.md`
3. **⚖️ Licence** : MIT pour l'app + section CC BY-NC-SA 4.0 pour les composants ArUco (algorithme + mapping + layout d'impression), lien vers `LICENSE`
4. **🔒 Vie privée (RGPD)** : explique localStorage + fichiers JSON, recommandation **Nextcloud académique nuage03.apps.education.fr** (Apps Education de l'Éducation nationale, hébergement souverain conforme RGPD) avec **🔄 Sync auto**, mention des données sensibles à déclarer au DPO (PPRE/PPS/PAI/ULIS/UPE2A/absences récurrentes)
5. **⌨️ Raccourcis clavier** : table avec `<kbd>` stylé (font-mono, ombre)

À cause de cette consolidation, le bouton **🆕 Maj** du header a été **retiré** (la vérif MAJ est désormais accessible depuis `mabout`, plus de doublon).

## Onglets de navigation (à 2 niveaux)

La nav `#nav` est structurée en **deux groupes** séparés par un filet vertical (`.tab-group` + `.group-label`), pour anticiper le futur volet Évaluation :

### Groupe 1 — "Vie de classe" (6 onglets actifs)
1. **Classes** — gestion des classes (créer / supprimer / dupliquer)
2. **Élèves** — liste avec tri, sélection multi (clic & glisser), édition de position en ligne, historique des incidents, actions en lot
3. **Plan (Prof)** — placement drag & drop, sélecteur multi-salles + sélecteur de classe mobile à côté, zoom, filtres groupes
4. **Config Salle** — gestion globale du catalogue de salles
5. **Tablettes** — récap tablettes avec sélecteur de salle + bouton "Affecter automatiquement", génération PDF "Fiche de prêt"
6. **QCMCam** — plan visuel vue prof + export CSV multi-salles avec identifiant `classe-salle`

### Groupe 2 — "Évaluation · bientôt" (placeholders, désactivés)
- 📊 **Notes** · 🎯 **Compétences** · 📜 **Bilan** — onglets `disabled` qui annoncent le 2e volet de l'app. Aucune logique métier derrière, ce sont des boutons inactifs avec tooltips explicatifs.

Le design système anticipe ce 2e volet :
- Primitive `.gridtable` (préparée dans l'onglet Élèves) — fondations pour la saisie type tableur (sélection multi-cellules, copier-coller)
- Variables `--maitrise-1..4` réservées (4 niveaux du référentiel cycle 4)
- Police mono `JetBrains Mono` pour chiffres tabulaires et codes courts de compétences

Onglets sortis de la navigation principale (accessibles via bouton) :
- **Vue Élève** — bouton **"🔄 Vue Élève"** dans Plan Prof (et inversement)
- **Export positions** (`tab-notes`) — bouton **"📊 Export positions"** dans la toolbar de l'onglet Élèves. Tableau triable Position · Groupe · Nom · Prénom + bouton 💾 Export CSV. Le bouton **"↩ Retour Élèves"** dans le header de l'onglet ramène à Élèves. Au démarrage, si `localStorage.planClasse_tab === 'notes'`, on retombe sur 'eleves'.

**Filtre de groupe persistant** : `groupFilter` (0=Tous, 1=G1, 2=G2) est sauvegardé dans `localStorage.planClasse_groupFilter` à chaque appel de `setGroupFilter()`. Restauré dans `init()` avant le 1er render, et le chip correspondant est activé. Évite de devoir re-cliquer sur G1/G2 après un F5 en plein cours.

**Désactivation visuelle des chips G1/G2** (`_updateGroupChipsState()`) : si la classe courante n'a aucun élève dans le groupe G1 (resp. G2), le chip correspondant reçoit la classe `.disabled` (opacity .35 + cursor:not-allowed + tooltip explicatif). Empêche le piège « grille entièrement fantôme » qui survenait quand le filtre persisté G1 atterrissait sur une classe sans élève en G1 (toutes les cellules `.ghost`, click handlers non attachés, mode appel inopérant). Appelée au début de `renderTeacherGrid()` et `renderStudentView()`. Le clic sur un chip désactivé est ignoré dans `setGroupFilter()` (early return) et dans le raccourci clavier `1`/`2`.

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
                                  // (utile en Cas 3 séquentiel quand total > 125 — l'utilisateur
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
  ppre, gevasco, ulis, ulis_incl, upe2a, upe2a_incl, notes,
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

## Attributs spéciaux par élève
- **ULIS** : élève ULIS hors inclusion dans la classe (case en transparence en Plan Prof)
- **ULIS inclusion** : élève ULIS inclus régulièrement dans la classe
- **UPE2A** : élève UPE2A (allophone) hors inclusion
- **UPE2A inclusion** : élève UPE2A inclus régulièrement
- **PPRE** : badge orange
- **Gevasco / PPS** : badge bleu
- **PAI** : badge rose `#ec4899` (Projet d'Accueil Individualisé — médical : allergies, asthme, diabète, etc.). **Cumulable avec TOUT le reste** (PPRE, PPS, ULIS, UPE2A…), contrairement aux autres statuts pédagogiques qui sont exclusifs intra-groupe. `STATUS_GROUP_C = ['pai']` (seul dans son groupe). Toggle `toggleStuPai(id)` / `ctxTogglePai()` avec icône ⚕️. Visible dans le tableau Élèves (bouton dédié rose), sur la cellule du plan (badge `.spec-pai`), dans le menu contextuel (sous-menu Aménagements), et dans la modale d'édition élève (checkbox dédiée). Comptabilisé dans le compteur "aménagement" du bilan classe et dans l'impression de la liste.
- **Groupes** : G1 (bleu), G2 (orange), G3 (violet) pour demi/tiers-groupes
- **Civilité** : `'M'` ou `'F'` (utilisée pour le mode couleur "genre")
- **Tags cumulables** (`stu.tags = [tagId, ...]`) : DF, DNL, etc. — un élève peut en avoir plusieurs. Définis globalement dans `S.tags` (id, abbr, name, color). Affichés en chips colorés dans Plan Prof. Un tag peut aussi être affecté à une PLACE (`room.posTagId`) — mutuellement exclusif avec `room.groupes` au niveau de la place (une place est soit dans une zone G1/G2/G3, soit dans une zone de tag).

## AESH — Accompagnant·e·s d'Élèves en Situation de Handicap

Une AESH est un slot **anonyme** (pas de nom) configuré par couple **(classe, salle)**. Le label affiché dépend du nombre total dans la salle :
- N=1 → `AESH`
- N≥2 → `AESH1`, `AESH2`…

Stockage : `cls.rooms[salleId] = { ..., aeshCount, aeshSeating: {idx:'r,c'}, aeshLinks: {idx:[sid,...]} }`. Migration auto dans `postLoadHook()` + `activeRoomData()`. Helpers : `aeshLabel(idx, total)`, `aeshAtKey(cls, key)`, `aeshHelpingSid(cls, sid)`, `aeshIndices(room)`, `_aeshPresentForFilter(cls, idx, filter)`.

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

### Configuration (Config Salle → mode 🧑‍🏫 AESH)
- 5e chip rose dans la barre de modes. Active la toolbar AESH sous la grille :
  - **Compteur ±** (max 6) — `cfgAeshSetCount(delta)`
  - Pour chaque AESH : badge `📍 r,c` ou `⚠️ non placée`, bouton **✕ Retirer** (`cfgAeshUnplace`), chips d'élèves cliquables pour lier/délier (un élève = UNE seule AESH max — délier des autres en lien automatique)
- **Placement** : sélectionne UNE case → bouton **📍 Placer AESH N** dans la barre bulk (`cfgAeshPlaceSelection`). Si un élève occupe la case, il est retiré (sera replacé via "non placés"). Si une autre AESH y est, elle est éjectée.

### Plan Prof + Vue Élève
- Cellule AESH : fond rose `.cell.aesh`, icône 🧑‍🏫 + label, **pas de tablette** (exclue du récap et de l'auto-affectation via `_collectSeats`).
- Élèves liés : badge `🤝 AESH/AESH1/AESH2` rose à côté des autres badges (Plan Prof uniquement).
- Vue Élève : cellule `AESH` rose simple sans badge.
- Drag & drop AESH (déplacement / échange avec autre AESH). Drop d'élève sur AESH → toast de refus.
- Tap-to-place tactile (Surface, iPad) : `_tapMode` étendu — `{aeshIdx, fromKey}` aux côtés de `{sid, fromKey}` ; helpers `_tapSelectAesh` / `_tapTryPlaceAesh`.
- Compteur `tg-count` enrichi : `🧑‍🏫 N/M AESH placées` + `🚫 X AESH absentes` (en mode appel).

### Mode appel (Phase 2)
- `_aeshAbsentToday` (Set 'classId|salleId|idx') persisté dans `localStorage.planClasse_attTransient`.
- Reset : minuit, sortie du créneau enregistré, `↺ Tout présent` (clear ciblé sur la classe active uniquement).
- Cellule AESH en mode appel : clic = `toggleAeshAbsence` (style hachuré + 🚫). En post-appel : visuel conservé jusqu'à la fin du créneau (lecture seule, drag réactivé).
- À l'enregistrement : `record.aeshAbsents = [{salleId, idx}, ...]` + snapshot des positions (`aeshSeatingSnap`, `aeshCountSnap`, `aeshSalleIdSnap`) — **figées** comme `seatingHash` pour les élèves.
- En édition explicite (UPDATE) : les snaps de position **ne sont pas** réécrits ; seules les absences sont mises à jour.
- Modale détail (`mattDet`) : section "🧑‍🏫 AESH absentes" avec libellé selon config actuelle (fallback "AESH#N (config modifiée depuis)" si la salle/AESH a changé).
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
3. **Pré-affectation des élèves liés** sur positions adjacentes via `_aeshAdjacentKeysPriority(salle, key)` — priorités strictes (groupe 1 entièrement consommé avant le 2, etc.) :
   - **P1** côté immédiat (r, c±1) — sans X traversé
   - **P2** côté étendu — saute un sans-table jusqu'à 3 cellules pour atteindre la table suivante
   - **P3** derrière même col (r+1, c)
   - **P4** derrière col±1 (r+1, c±1)
   - **P5** derrière étendu (traverse un X dans la rangée r+1)
   - **P6-8** devant (r-1) selon le même schéma
   
   Schémas validés par l'utilisateur :
   ```
   2 tables de 3 :         2 tables de 2 (X = sans-table) :
   [3][2][3]               [5][X][3][4]
   [1][AESH][1]            [2][X][AESH][1]
   ```
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

## Tablettes — picker unifié (cellule + récap)

### Note "obligation légale de traçabilité"
Bandeau bleu pédagogique inséré dans l'onglet Tablettes (entre la barre des classes mobiles et le récap des affectations) qui explique le **but légal** de cette fiche :
- Les tablettes prêtées en classe ne demandent généralement pas à l'élève de s'identifier dessus (prêt physique par le prof)
- En cas d'incident (perte, casse, contenu inapproprié, accès non autorisé à un compte) → l'établissement doit pouvoir reconstituer qui avait quel appareil et quand — **obligation légale** (responsabilité matériel public + traçabilité accès numériques)
- La fiche d'affectation + la fiche de prêt PDF répondent à cette exigence (registre nominatif de séance, exportable à la vie scolaire si besoin)

### Picker unifié
Pour éviter le doublon historique « `<span class="cipad">Tab. N</span>` ET `<select class="isel">` dans la même cellule de Plan Prof », l'affectation des tablettes passe désormais par **une modale unique `mipad-picker`** :

- **Trigger** : clic sur le pavé `Tab. N` (ou `Tab. —` quand non assigné) — visible à la fois **dans les cellules Plan Prof** ET **dans le récap de l'onglet Tablettes** (le `<select>` du récap a été remplacé par un span cliquable identique).
- **Helper d'ouverture** : `openIpadPicker(key, gf)` → liste toutes les tablettes du pool actif avec leur statut :
  - ✓ libre (vert)
  - ◉ tablette actuelle de l'élève
  - 🟦 utilisée par un autre élève (clic = échange)
  - 🚫 indisponible (HS, marquée dans `pool.unavailable`)
- **Swap automatique** via `changeIpadAssign` existant. **Confirmation native (`confirm()`) demandée seulement si la tablette est occupée par un autre élève** ; si le siège est vide (assignation orpheline d'un élève supprimé), on prend la tablette sans demander.
- **Bouton "🗑 Retirer la tablette de cet élève"** affiché en bas de la modale si une tablette est actuellement affectée.
- Variable globale `_ipickCtx` (cls, key, gf, sid, currentN) — réinitialisée à chaque ouverture.

L'affectation auto est aussi accessible **directement depuis l'onglet Tablettes** (bouton **📱 Affecter automatiquement** à côté du sélecteur de classe mobile) — plus besoin de naviguer dans le menu Actions de Plan Prof.

Le sélecteur de classe mobile est partagé entre les onglets Plan Prof (à côté du sélecteur de salle) et Tablettes — `renderClassPoolRow()` alimente **tous les conteneurs `.pool-buttons-container`** présents dans le DOM, donc switching de pool est cohérent partout.

## Tablettes — modèle multi-mode et multi-pool
Chaque salle stocke ses affectations de tablettes dans `room.ipadsByPool[poolId] = { ce, g1, g2 }`. Trois maps indépendantes :
- `ce` : classe entière (anciennement `ipads`)
- `g1` : groupe 1 (anciennement `ipads_g1`)
- `g2` : groupe 2 (anciennement `ipads_g2`)

La sélection du mode se fait via le filtre groupe en Plan Prof. La détection des doublons est par mode dans le pool actif.

Une **classe possède des affectations distinctes par classe mobile** (pool). Cas d'usage : tu utilises CM2 d'habitude mais quand il est réservé tu prends CM1 — chacun a ses propres numéros (différents indisponibles, différents counts). Tu bascules le pool actif via les boutons dans l'onglet Tablettes ; les numéros affichés dans Plan Prof / récap reflètent le pool actif. Auto-affectation et impression basculent automatiquement le pool actif sur celui choisi dans leur modal.

**Note de nommage** : côté UI on parle de **"tablettes"** (terme générique, abrégé en **"Tab."** dans les cellules Plan Prof à l'écran et à l'impression). Côté code (variables, fonctions, champs JSON, IDs, classes CSS) le nom historique **"ipad"** est conservé pour ne pas casser la compatibilité des fichiers JSON existants : `cls.ipads`, `cls.ipads_g1`, `cls.ipads_g2`, `ipadGet()`, `ipadSet()`, `openAutoIpads()`, `printSuiviPret()`, `buildIpadTable()`, `.cipad`, `#mip`, `#mipad-print`, etc.

## Classes mobiles — paramétrage de la fiche de prêt

`S.tabletPools = { [poolId]: pool }` — paramétrage des "classes mobiles" (ensembles physiques de tablettes prêtables) utilisé par la fiche de prêt PDF.

```js
pool = {
  id, nom,                  // ex. "CM1", "Pack ENT"
  prefix,                   // texte avant le numéro dans l'étiquette (ex. "CM1 - ELV")
  digits,                   // padding du numéro : 1, 2 ou 3 (défaut 2 → "01", "02"…)
  count,                    // nombre total de tablettes
  lots: [                   // sous-ensembles de réservation, plages contiguës
    { nom, from, to }       // ex. { nom: '3', from: 1, to: 15 }
  ],
  unavailable: [n°,...]     // tablettes hors-service (réparation, perdues) — exclues de l'auto-assign,
                            // affichées grisées + "🚫 indisponible" dans la fiche de prêt
}
```

### Migration auto
`migrateTabletPools()` (appelée dans `postLoadHook()`) crée 2 pools par défaut si `S.tabletPools` est vide, pour préserver le comportement historique :
- `pool_cm1` : "CM1" / préfixe `"CM1 - ELV"` / 31 / lots `{3: 1-15, 4: 16-31}`
- `pool_cm2` : "CM2" / préfixe `"CM2 - ELV"` / 31 / lots `{1: 1-15, 2: 16-31}`

### UI de configuration
Sous le récap dans l'onglet **Tablettes**, section **"⚙️ Configuration des classes mobiles"** : édition par pool (nom, préfixe, nb chiffres, nb tablettes, lots avec plages). Bouton **"+ Nouvelle classe mobile"** propose une duplication d'une classe existante via prompt. Aperçu d'étiquette en direct (`<code>` à côté des champs).

### Fonctions clés
- `poolLabel(pool, n)` → `prefix + padded(n)` — étiquette d'une tablette
- `findPoolLot(pool, n)` → renvoie le lot dont `from ≤ n ≤ to`, ou `null`
- `poolLotsSummary(pool)` → "1 & 2", "1, 2 & 3" pour les libellés de boutons
- `poolUnavailableSet(pool)` → Set des numéros indisponibles
- `poolAvailableNumbers(pool)` → liste des numéros 1..count moins les indisponibles
- `parseUnavailableInput(text, maxN)` → parse "1, 7, 15" → tableau trié dédupé filtré

### Fiche de prêt
- Modal `mipad-print` : **boutons dynamiques** générés par `renderIprintPoolPicker()` (variable `iprintState.type` contient l'ID du pool sélectionné). Si nb pools > `IPRINT_POOL_BUTTONS_THRESHOLD` (= 4), bascule en `<select>`.
- **Pré-sélection à l'ouverture** : `openIpadPrint()` priorise `currentCls.activePool` (le pool actif de la classe courante), puis `iprintState.type` mémorisé, puis le 1er pool de `S.tabletPools`.
- Choisir un pool dans cette modal **bascule aussi `cls.activePool`** → la fiche imprime l'assignation correspondant à ce pool (ex. CM1 imprime les n° de CM1, CM2 ceux de CM2, chacun stocké dans son `ipadsByPool[id]`).
- `printSuiviPret()` itère `pool.count` lignes, étiquette via `poolLabel()`, lot via `findPoolLot()`. Les numéros dans `pool.unavailable` apparaissent grisés avec mention "🚫 indisponible" en colspan sur les colonnes Élève/Remarque (le prof voit qu'elles sont HS au moment du prêt).

### Réinitialisation du fichier (modal `mreset`)
Bouton **🗑 Réinitialiser…** dans le header de l'onglet **Classes** (en danger, à droite). Ouvre la modale `mreset` qui affiche un récap des compteurs actuels et propose 2 options :

- **🏫 Réinitialiser en conservant les salles** (`resetKeepingRooms()`) :
  - Vide : `S.classes`, `S.eleves`, `S.snapshots`, `S.attendance`, `S.cur`
  - Conserve : `S.salles` (dimensions, places vides, horaires), `S.tabletPools` (config des classes mobiles)
  - Confirmation par `confirm()` simple, `pushUndo()` avant
- **🔥 Tout effacer (fin d'année définitive)** (`resetEverything()`) :
  - Vide tout : classes, élèves, salles, classes mobiles, snapshots, attendance
  - **Confirmation par saisie obligatoire** : l'utilisateur doit taper exactement `EFFACER TOUT`
  - `postLoadHook()` est rappelé après → recrée les pools par défaut (CM1/CM2) — l'utilisateur peut les supprimer ensuite s'il veut vraiment partir vierge
  - `pushUndo()` avant : reste annulable via Ctrl+Z dans la session courante

Les deux actions appellent ensuite `save()`, ferment la modale, `refreshSelector()` et re-render l'onglet courant. Toast de confirmation à la fin.

### Désaffectation des tablettes (modal `mclear-ipads`)
Accessible depuis :
- **Plan Prof** : menu **⚙ Actions ▾** → **🗑 Désaffecter les tablettes…**
- **Tablettes** : bouton **🗑 Désaffecter…** dans la toolbar (à côté de 🖨 Fiche de prêt PDF)

Trois étendues proposées (1 bouton chacune, avec compteur d'affectations actuelles) :
1. **Cette classe mobile · Cette salle** : `room.ipadsByPool[activePool] = { ce:{}, g1:{}, g2:{} }`
2. **Toutes les classes mobiles · Cette salle** : `room.ipadsByPool = {}` (toutes les pools de la salle active)
3. **Toutes les classes mobiles · Toutes les salles de cette classe** : `room.ipadsByPool = {}` pour chaque room de la classe

`clearIpads(scope)` demande confirmation, fait `pushUndo()`, applique la suppression, sauvegarde, re-render, toast. Helper `_countAssign()` compte les n° non nuls dans `{ ce, g1, g2 }` pour afficher le total dans la modale avant action.

### Sélection / bascule de classe mobile active
- Bande de boutons dans l'onglet **Tablettes** (`#ipad-pool-buttons`) générée par `renderClassPoolRow()` — un bouton par pool, le pool actif en bleu, tooltip détaillé (nom, count, indispo, lots).
- `setActivePool(poolId)` : `pushUndo()`, change `cls.activePool`, sauvegarde, re-render onglet courant, toast.
- Indicateur dans `tg-count` (Plan Prof) : `📱 <nom-pool>` ajouté seulement si `Object.keys(S.tabletPools).length >= 2`.

### Suppression d'un pool
`deleteTabletPool(id)` :
1. Compte les usages (assignations stockées dans n'importe quelle classe/room) → message d'avertissement
2. Confirmation utilisateur
3. `pushUndo()` puis suppression du pool
4. Pour chaque classe : si `cls.activePool === id`, bascule sur le 1er pool restant
5. Pour chaque room : `delete room.ipadsByPool[id]`
6. Re-render onglet courant

### Auto-affectation des tablettes (modal `mip`) — file d'attente
- Sélecteur de **classe mobile** + champ d'exclusion d'étiquettes de tables.
- **Étendue** (deux checkboxes) :
  - `ipm-all-pools` : Affecter aussi aux autres classes mobiles
  - `ipm-all-rooms` : Affecter aussi aux autres salles de cette classe
- L'algorithme utilise les **numéros disponibles** du pool (`poolAvailableNumbers(pool)`) au lieu de 1..N. Les indisponibles sont sautés.
- Mode CE : assigne à **toutes** les tables non-`positions_vides` et non-exclues (même tables vides — pour faciliter la distribution physique fixe). Modes G1/G2 : seulement les sièges occupés par des élèves du groupe.
- `autoIpads(scope)` construit une **file d'attente** (`_ipovfQueue`) de toutes les combinaisons (room × pool) sélectionnées, fait `pushUndo()` une seule fois au début, puis appelle `_processNextCombination()` qui itère :
  - Pour chaque combinaison, calcule le besoin selon le scope (CE/G1/G2/all)
  - Si `needed ≤ available` → `_applyAssignmentFor()` directement, passe à la suivante
  - Si `needed > available` → ouvre `mipovf` (modale plan visuel) avec **bandeau de contexte** "📍 Combinaison X/Y — Salle ... × Classe mobile ..." (affiché si la file contient ≥ 2 combinaisons via flag `multi`).
  - À la fin de la file : `_finishAutoIpads()` restaure `cls.activeRoom`/`cls.activePool` d'origine, save, render, toast récap (`N affectations effectuées (dont M avec choix de tables)`).

### Modale plan visuel `mipovf` (sélection des tables à équiper)
- Rendu par `_renderIpovfPlan()` : grille de la salle active (rows × cols), affichée dans `#mipovf-grid-wrap`.
- **Cellules** :
  - `positions_vides` → case grisée non-cliquable
  - Non-candidate (ex. siège non-G1 en mode G1) → ghost (semi-transparent, dashed border, non-cliquable)
  - Candidate cochée → fond bleu clair `#d6eaf8`, bordure `#3498db`, ✓ vert en haut à droite
  - Candidate décochée → fond gris `#f5f5f5`, opacité .55, ✗ rouge
  - Chaque cellule affiche : N° de position, nom (ou "vide"), badge G1/G2 si applicable
- Toggle au clic via `ipovfToggle(key)` qui modifie `_ipovfState.checkedKeys` (Set).
- Boutons rapides : `ipovfToggleAll(true/false)`, `ipovfUncheckEmpty()` (décoche les sièges sans élève — priorise les tables occupées).
- Compteur dynamique (`ipovfUpdateCount`) :
  - rouge si `checked > available` ("Décochez encore X")
  - gris si `checked === 0`
  - vert sinon ("✅ X cochée(s) sur Y disponible(s)")
- Bouton **Affecter avec ces tables** désactivé tant que `checked > available` ou `checked === 0`.
- Toutes cochées par défaut : l'utilisateur décoche les excédentaires (UX directe : "qui ne devra pas avoir de tablette").
- **Annulation** : le bouton Annuler de la modale (ou Esc / clic sur le fond noir) déclenche `_cancelAutoIpadsBatch()` qui pop l'undo (sans polluer redoStack) et reset les states. Le hook est installé via `_modalReturnTo['mipovf']` pour capter toutes les voies de fermeture. `ipovfConfirm()` neutralise ce hook avant `closeMod2()` pour qu'une confirmation ne déclenche pas l'annulation.
- État `_ipovfQueue` : `{ cls, scope, exclSet, oldRoom, oldPool, pending: [...], summary: {combos, withOverflow}, multi }`.
- État `_ipovfState` (par modale) : `{ cls, scope, pool, allSeats, exclSet, available, queueMode: true, currentRoom, currentPool, candidates }`.
- Le helper `_applyAssignmentFor(cls, scope, allSeats, exclSet, available, keepKeys)` factorise l'application pour CE / G1 / G2 / all selon le scope (ne fait pas de pushUndo — c'est fait en amont par autoIpads).

### Récap tablettes (onglet Tablettes, fonction `renderIpads`)
- En-têtes séparés en deux zones cliquables : **texte** (clic = tri asc/desc, état dans `_ipadSort[idx]`) et **icône 📋** (clic = copie de la colonne via `copyIpadCol()`).
- Chaque cellule "Tablette n°" est un `<select>` éditable (1..max). `changeIpadAssign(gf, key, n)` :
  - Si le numéro est déjà utilisé sur un autre siège dans le même mode, **échange automatique** (l'autre siège récupère l'ancien n° ou rien).
  - `pushUndo()` avant mutation, `save()` + `renderIpads()` + `renderTeacherGrid()` après.
- **Mode visible** : un mode (CE/G1/G2) est affiché s'il a au moins 1 élève placé pertinent OU une affectation existante. Ainsi le récap CE apparaît dès qu'on a placé des élèves (même sans tablette affectée).
- **Élèves sans tablette** (orphelins) : tous les élèves placés selon le mode (CE = tous, G1/G2 = ceux du groupe) qui n'ont pas d'entrée dans la map sont ajoutés en fin de tableau, ligne au **fond jaune clair**, n° remplacé par `—` dans le `<select>`, icône `⚠️` en suffixe. Triés en bas indépendamment du tri actif. Permet d'en affecter une via le dropdown.
- **Tablette indisponible affectée** : si le n° d'une affectation est dans `pool.unavailable` du pool actif, ligne au **fond rouge clair**, n° en rouge, icône `🚫` en suffixe, tooltip explicatif. Permet de repérer et corriger.
- **Dropdown** : les n° indisponibles sont suffixés ` 🚫` ; les n° déjà attribués ailleurs dans le même mode sont exclus (sauf le n° courant). La borne max prend le `pool.count` (ou max-utilisé si plus grand).
- **Bandeaux d'alerte** en tête du récap (si applicable) :
  - 🚫 *N tablettes indisponibles affectées*
  - ⚠️ *N élèves sans tablette affectée*
  - ⚠️ *Tablettes en doublon dans Mode X : a, b, c*

## Snapshots — sauvegardes nommées et datées

Deux types de snapshots, stockés dans `S.snapshots[id]` (inclus dans la sauvegarde JSON, sync auto et backups) :

```js
snap = {
  id, type: 'positions' | 'incidents',
  nom, ts,                           // timestamp de création
  classId,
  salleId,                           // type='positions' uniquement
  data: {
    seating: { 'r,c': sid },         // type='positions'
    eleves:  { [sid]: { nom, prenom, groupe,
                        oublis?, non_travail?, history? } }  // compteurs uniquement pour 'incidents'
  }
}
```

### Type `positions` — onglet Plan Prof
- Capture le `seating` de la salle active + identité minimale des élèves placés (pour pouvoir consulter même si supprimés depuis)
- Bouton **"📸 Snapshots"** dans la toolbar Plan Prof
- Actions : 👁 Consulter / **↻ Restaurer** / ✏️ Renommer / 🗑 Supprimer
- Restauration : `pushUndo()`, ne replace que les élèves qui existent encore dans la classe ; les nouveaux élèves restent en "non placés" ; sort automatiquement du mode consultation

### Type `incidents` — onglet Élèves
- Capture pour chaque élève de la classe : `oublis`, `non_travail`, `history`, `groupe`, `nom`, `prenom`
- Bouton **"📸 Snapshots"** dans la barre d'actions Élèves
- Actions : 👁 Consulter / ✏️ Renommer / 🗑 Supprimer (**pas de restauration**, par choix)

### Mode consultation (read-only)
- Variable globale `_viewingSnapshot` non `null` quand actif
- `renderTab()` route vers `renderTeacherGridFromSnapshot()` (positions) ou `renderStudentsFromSnapshot()` (incidents)
- Bandeau jaune en haut de l'onglet : *« Consultation du snapshot ‹nom› (date) — Lecture seule »* + bouton **↩ Quitter** (et **↻ Restaurer** pour les positions)
- Drag&drop, clic droit, boutons d'édition (incl. +/−), saisie de positions, sélection multi : tous désactivés
- Élèves supprimés depuis affichés en italique avec badge `supprimé` (visibles en consultation, ignorés à la restauration)
- Sortie automatique si on change de classe ou si on bascule sur un onglet incompatible avec le type du snapshot

## Mode appel & enregistrement des appels

### Marquage transient (en mémoire)
- Variables globales : `_appelMode` (bool), `_absentToday` (Set de sids), `_lateToday` (Map sid → 'HH:MM'), `_absentDate` (YYYY-MM-DD pour reset auto), `_editingAttendanceId` (id de l'appel en cours d'édition ou null), `_appelSavedSlot` (cf. *État « post-appel »* ci-dessous)
- **Reset auto à minuit** : `_absencesAutoReset()` compare `todayKey()` à `_absentDate` et vide les sets si différent ; clear aussi `_appelSavedSlot`.
- **Bouton 🙋 Mode appel** dans la toolbar Plan Prof — `toggleAppelMode()` :
  - Active/désactive le mode (bouton se met en bleu)
  - À l'activation, **2 pré-marquages automatiques** :
    - `autoMarkUlisAbsent()` : ULIS hors-inclusion (`stu.ulis && !stu.ulis_incl`) + UPE2A hors-inclusion
    - `autoMarkUnplacedAbsent()` : tous les élèves de la classe qui ne sont pas dans `cls.seating` (non placés sur le plan)
    - Toast récap : `Pré-marqués absents : N ULIS + M non placés`. Décochable manuellement.
  - **Esc en mode appel** quitte le mode (équivalent du bouton ↩ Quitter). Si en édition d'appel passé → `cancelEditAttendance`.
  - Désactivé si `_viewingSnapshot` actif
- **Bandeau bleu** (jaune en mode édition) au-dessus de la grille via `updateAppelBanner()` : compteur, boutons **📌 Enregistrer** / **↺ Tout présent** / **↩ Quitter**
- **Cellule en mode appel** : clic gauche = toggle absent (`toggleAbsence`), clic droit = prompt heure d'arrivée pour retard (`promptLateForStudent`). Drag&drop, +/-, isel désactivés. CSS `.cell.absent` (gris hachuré + 🚫 + nom barré), `.cell.late` (jaune + ⏰ HH:MM).

### Enregistrement (`S.attendance[classId][recordId]`)
- Bouton **📌 Enregistrer cet appel** dans le bandeau → modal `msaveatt` :
  - Date éditable (défaut : aujourd'hui)
  - Créneau pré-sélectionné via `findCurrentSlot()` (le créneau qui contient l'heure courante si la date = aujourd'hui ; sinon vide)
  - Groupe pré-rempli avec `groupFilter`
  - Libellé auto-suggéré `<slotId> — <date>` ou `Appel — <date>`, suffixé par `· G1/G2` si groupe ≠ 0
- **Toggle édition** : bouton ✏️ Éditer dans la liste des appels passés → recharge les sets dans `_absentToday/_lateToday`, active mode appel, set `_editingAttendanceId`. Au save, le record est mis à jour en place (id, ts d'origine préservés). Bouton ❌ Annuler la modification revient sans sauver.

### État « post-appel » : visuel persistant jusqu'à la fin du créneau
Variable globale `_appelSavedSlot = { date: 'YYYY-MM-DD', slotId, classId, label }` (ou `null`).

**Set après création** d'un record dans `saveAttendanceConfirm` SI `slotId` est défini ET `dateStr === todayKey()`. Sinon (date passée/future, ou pas de slot identifié), reset immédiat comme historiquement (`_absentToday.clear()` + `_lateToday.clear()`).

**Effet quand `_appelSavedSlot` est actif et l'heure courante tombe dans ce slot** (helper `_isStillInSavedSlot()`) :
- `_absentToday` / `_lateToday` sont **conservés** (pas clear après save).
- Dans `buildCell()`, hors mode appel : on applique `.cell.absent` / `.cell.late` (lecture seule — pas de toggle au clic, mais drag/menu contextuel restent disponibles). Tooltip enrichi avec « 🚫 Absent (appel ‹label›) » ou « ⏰ En retard, arrivé(e) à HH:MM ».
- Le compteur `tg-count` (✅ présents / 🚫 absents / ⏰ retards) reste juste automatiquement (il lit `_absentToday`/`_lateToday`).

**Reset automatique** dans `_absencesAutoReset()` (appelé en début de chaque `renderTeacherGrid()`) :
- À minuit (changement de `todayKey()`)
- Quand on quitte le slot enregistré (heure courante hors `[slot.start, slot.end[`) **et** qu'on n'est pas en mode appel actif
- Quand la classe active change (`cls.id !== _appelSavedSlot.classId`)

**Reset explicite** :
- Bouton **↺ Tout présent** (`clearAbsences()`) clear aussi `_appelSavedSlot`.

**Pourquoi `slotId` requis** : sans créneau identifié (ex. un appel hors horaires), il n'y a pas de notion de « fin de créneau » → on retombe sur l'auto-clear historique. Évite que le visuel reste bloqué.

**Persistance dans `localStorage`** : l'état transient (`_absentToday`, `_lateToday`, `_absentDate`, `_appelSavedSlot`) est sauvegardé sous la clé dédiée `planClasse_attTransient` à chaque mutation (`_saveAttTransient()`) et restauré à `init()` via `_loadAttTransient()`. Ainsi un F5 / redémarrage du navigateur en plein cours préserve le visuel hachuré et le compteur juste. La clé est volontairement séparée de `S` (donc absente de la sauvegarde JSON, sync auto, undoStack) — c'est de l'état UI éphémère.

Sites de mutation où `_saveAttTransient()` est appelé : `toggleAbsence`, `promptLateForStudent`, `clearAbsences`, `autoMarkUlisAbsent` (si n>0), `cancelEditAttendance`, `saveAttendanceConfirm` (les 2 branches : update et create), `_absencesAutoReset` (après auto-clean).

### Modal "📅 Appels passés" (avec filtres)
- Bouton dans toolbar Plan Prof
- Filtres : classe (dropdown avec "Toutes les classes"), date du / au, cases "avec absents" / "avec retards", bouton ↺ reset
- **Tri** : date desc (le record le plus récent en haut), puis `slotId` desc en tie-breaker (S3 > S2 > S1 > M4…), puis `ts` desc en fallback. **Indépendant de la date de saisie**.
- Quand "Toutes" est sélectionné : badge bleu avec nom de classe sur chaque ligne
- **Actions par record** : **👁 Liste** (sous-modal `mattDet`) / **🖼 Plan** (sous-modal `mattPlan` directement sur la grille) / ✏️ Éditer / 📝 Renommer / 🗑 Supprimer
- **Bascule Liste ↔ Plan** : depuis `mattDet`, bouton **🖼 Vue plan** → ouvre `mattPlan` sur le même record. Inversement depuis `mattPlan`, bouton **📝 Liste** → `switchMattPlanToDet()` ouvre `mattDet`. Permet d'alterner sans repasser par la liste générale.
- **Détail (`mattDet`)** : sections séparées 🚫 Absents et ⏰ Retards (avec heure d'arrivée), bouton 📋 Copier la liste. Badge gris discret **"(non placé)"** après le nom des absents qui n'avaient pas de place au moment de l'appel (détecté via `seatingHash` du record).
- **Plan de l'appel (`mattPlan`)** : grille en lecture seule basée sur le seating snapshot. Section "🚫 Absents non placés (N)" sous la grille listant les élèves absents qui n'avaient pas de place. AESH placées positionnées via `aeshSeatingSnap` (ou état actuel si record antérieur).

### Reconstitution de l'état post-appel après sync sur une autre machine

L'état transient (`_absentToday`, `_lateToday`, `_aeshAbsentToday`, `_appelSavedSlot`) vit dans `localStorage` (clé `planClasse_attTransient`) — **pas synchronisé** entre machines via le fichier JSON. Sur une 2e machine qui charge le fichier sync pendant le créneau d'un appel, `S.attendance` contient bien le record mais le visuel hachuré « post-appel » sur le plan ne se déclencherait pas.

**Fix** : helper **`_restorePostAppelFromAttendance()`** qui, si :
- mode appel inactif ET pas déjà en post-appel pour la classe active,

cherche dans `S.attendance[cls.id]` un record dont `r.date === todayKey()` et `r.slotId === currentSlot.id` (via `getSalleSchedule + findCurrentSlot`). Si trouvé, restaure :
- `_absentToday` ← `r.absents`
- `_lateToday` ← `r.retards`
- `_aeshAbsentToday` ← `r.aeshAbsents` (filtré sur la classe active)
- `_appelSavedSlot` ← `{ date, slotId, classId, salleId, label }`
- Persiste via `_saveAttTransient()`

Appelé à 3 endroits : `init()` (après `_loadAttTransient`), `autoReloadCheck()` (après reload sync), `switchClass()` (bascule vers une classe à appel actif non encore restauré).

## Vue d'ensemble — tous les élèves toutes classes

Bouton **📊 Vue d'ensemble** dans la toolbar de l'onglet Élèves → modal `moverview` :
- Tableau triable : Classe · Élève · Grp · 📦 · 📝 · 🚫 (cumul absences) · ⏰ (cumul retards)
- Filtres : classe (dropdown avec "Toutes"), Min. 🚫 (entier), Min. ⏰ (entier), bouton ↺
- Tri par défaut : 🚫 desc (les plus absents en haut)
- Badges colorés via `oubliColor()` (palette identique à 📦/📝)
- Tooltips natifs `title=""` sur les en-têtes et cellules pour expliquer les icônes
- Bouton 🕓 par ligne → `overviewOpenHist(classId, sid)` : bascule la classe si nécessaire, ouvre l'historique de l'élève **par-dessus** la vue d'ensemble (z-index 1010)

## Stats absences/retards par élève sur une période (modal `mattStats`)

Vue cross-élèves filtrable par période, accessible depuis la modal **📅 Appels passés** (`matt`) via le bouton **📊 Stats par élève** dans la barre de filtres. À la fermeture, retour automatique à `matt` via `_modalReturnTo['mattStats']`.

### Filtres
- **Période** :
  - Boutons rapides **Semaine** (lundi → dimanche de la semaine en cours) et **Mois** (1er → dernier jour du mois en cours). Le bouton actif passe en bleu.
  - Date pickers **Du** / **Au** (toujours éditables ; toute modif manuelle déshighlight les boutons rapides).
  - Bouton **📅 Aujourd'hui** à côté de **Au** : ramène la date de fin à `todayKey()`.
- **Classe** : dropdown avec « — Toutes les classes — ». Pré-sélectionne la classe courante (`getCls()?.id`). En mode "Toutes", la colonne **Classe** apparaît dans le tableau.
- **0/0 masqués** : checkbox pour cacher les élèves sans absence ni retard sur la période (utile pour focaliser).
- Bouton **↺** : reset → semaine en cours, classe courante, hidezero off.

### Tableau (sortable)
- Colonnes : (Classe?) · Élève · Grp · 🚫 Absences · ⏰ Retards · Total
- Tri par défaut : 🚫 desc (les plus absents en haut). Clic sur en-tête = bascule asc/desc.
- Badges colorés par `oubliColor()` (cohérence visuelle avec les autres tableaux de stats).
- Bandeau d'info en haut à droite : `N élèves · 🚫 X · ⏰ Y · DD/MM/YY → DD/MM/YY`.

### Fonctions clés
- `_ymd(d)` : Date → 'YYYY-MM-DD' en heure locale
- `_statsWeekRange()` / `_statsMonthRange()` : `{from, to}` calculés à la volée
- `getStudentAttendanceStatsInRange(classId, sid, fromYMD, toYMD)` : variante de `getStudentAttendanceStats` filtrée par plage de dates inclusive (utilise la comparaison lexicographique des strings 'YYYY-MM-DD')
- `openAttStatsFromMatt()` : ferme matt, programme le retour, ouvre mattStats
- `openAttStats()`, `renderAttStats()`, `setStatsPeriod(p)`, `setStatsTodayEnd()`, `resetStatsFilters()`, `sortAttStats(col)`, `_highlightStatsPeriodBtn(period)`

### Mécanisme de retour modal → modal
- Variable `_modalReturnTo = { modalId: callback }`
- `closeMod`, `closeMod2`, et le handler Esc déclenchent `_afterModalClose(id)` qui invoque le callback enregistré et le supprime
- Utilisé pour : à la fermeture de mhist depuis la vue d'ensemble, rafraîchir `renderOverview()` (au cas où l'historique a été modifié)

## Onglet Élèves — historique enrichi

Le modal **🕓 Historique** d'un élève a deux onglets :
- **📦 Incidents** : compteurs vivants `s.oublis` / `s.non_travail` dans le summary + liste détaillée des entrées de `s.history`. Si compteurs > 0 mais hist vide (legacy / import) : message expliquant. Suppression d'une entrée → décrémente le compteur.
- **🚫 Absences & retards** : aggrège **toutes les classes** via `Object.entries(S.attendance)`, filtre les records mentionnant cet sid (`absents.includes(sid)` ou `retards[sid]`). Affichage par date desc avec classe / créneau / groupe / badge 🚫 ou ⏰ HH:MM. Lecture seule (pour modifier, on passe par 📅 Appels passés → ✏️ Éditer).

## Compteur enrichi `tg-count` (Plan Prof)

`{X/Y placés} · ✅ Z présents · 🚫 W absents · ⏰ V retards · 🔵 G1 · 🟠 G2 · U ULIS hors classe`
- Présents = placés − absents (les retards sont considérés présents)
- Absents/retards : sous-ensembles des élèves placés et dans le filtre groupe actif
- **`✅ N présents` affiché si :** mode appel actif **OU** post-appel actif (`_isStillInSavedSlot()`) **OU** absentN > 0 **OU** lateN > 0. Permet à l'enseignant de toujours voir le décompte tant qu'il y a une session d'appel active, même à 0/0 (ex. « ✅ 30 présents · 30/30 placés » confirme visuellement que l'appel a bien été enregistré).
- 🚫 et ⏰ n'apparaissent que si > 0 (pas de « 0 absent » ou « 0 retard »).
- ULIS hors classe affiché uniquement si U > 0
- **Note** : l'indicateur de pool actif (`📱 <nom-pool>`) historiquement affiché dans `tg-count` a été **retiré** — il est désormais visible directement dans la toolbar du Plan Prof à côté du sélecteur de salle (cf. `.pool-buttons-container` partagé entre Plan Prof et Tablettes). Évite le doublon.

## QCMCam — numérotation et marqueurs ArUco

### Stratégie de numérotation (`_qcmNumbering(cls, salleId)`)

QCMCam utilise des marqueurs ArUco 4×4 limités à **1–125**. La fonction `_qcmNumbering` retourne `{ keyToNum, numToKey, strategy, step, isSequential, max, overflowCount, total, userExcluded }` et choisit automatiquement la stratégie la plus lisible :

- **Cas 1 — `strategy: 'lisible-10'` (pas = 10)** — si `cols ≤ 10 ET rows ≤ 12`
  - `n = rangée × 10 + position` (position = 1 à gauche, cols à droite en vue prof)
  - Max possible : `11×10 + 10 = 120` ≤ 125
  - Numéros parlants : `23` = rangée 2, place 3 depuis la gauche

- **Cas 2 — `strategy: 'lisible-20'` (pas = 20)** — si `cols ≤ 15 ET rows ≤ 6` (et hors Cas 1)
  - `n = rangée × 20 + position`
  - Max possible : `5×20 + 15 = 115` ≤ 125
  - Trou de 5 numéros entre rangées (16-20, 36-40… non utilisés) pour préserver la lisibilité "dizaines = rangée"
  - Numéros parlants : `23` = rangée 1, place 3 depuis la gauche

- **Cas 3 — `strategy: 'sequential'`** — pour toute salle au-delà de ces deux cas
  - Numérotation `1..N` dans l'ordre vue prof (rangée la plus proche du prof `r=0` d'abord, puis vers le fond ; gauche → droite dans chaque rangée), en sautant les `positions_vides` ET les `salle.qcmExcluded` (cf. ci-dessous)
  - Si encore > 125 après exclusion : tronqué (`overflowCount`)
  - Plus de signification rangée/place dans le numéro lui-même

**Priorité Cas 1 vs Cas 2** : quand les deux s'appliquent (ex. 5×8 entre dans les deux), **Cas 1 gagne** (numéros plus serrés, plus dense visuellement).

### Cohérence avec la saisie position (Élèves)
- `seatQCMToKey(input, cls)` utilise désormais `_qcmNumbering(cls, cls.activeRoom).numToKey` pour parser le numéro tapé — le nombre saisi correspond exactement à celui affiché dans l'onglet QCMCam et imprimé sur le marqueur ArUco.
- Helper `qcmNumForCell(cls, salleId, r, c)` pour les lookups one-off (utilisé dans `renderStudents`, `exportNotesCsv`, etc.).
- `seatLabelQCM` (formule simple `r*10+pos`) reste comme fallback quand aucune salle active n'est connue du contexte.

### Exclusion interactive de places (Cas 3 uniquement)
Quand la salle est en stratégie séquentielle (Cas 3), **chaque cellule du plan visuel de l'onglet QCMCam devient cliquable** (cursor: pointer, hover bleu encre, classe `.qcm-pcell-clickable`). Un clic toggle l'inclusion :
- Cliquer une place non exclue → ajoute sa clé à `salle.qcmExcluded` (la table n'aura pas de marqueur)
- Cliquer une place exclue → la retire de `qcmExcluded`
- Fonction `toggleQcmExclusion(salleId, key)` — `pushUndo()` + `save()` + `renderQcmcam()` + toast

Les places exclues sont rendues avec un **fond hachuré orange/rouge** (`repeating-linear-gradient`), bordure dashed `--margin-red`, et un 🚫 à la place du numéro. Le bandeau d'overflow invite explicitement à cliquer : *« Clique sur les places à exclure directement dans le plan ci-dessous »*.

### Plan visuel — `_buildQcmPlanHTML(cls, salleId, opts)`
Helper qui construit le HTML d'une grille vue prof (orientation : `r=rows-1` en haut du plan = fond de salle, `c=cols-1` à gauche en vue prof, comme `renderTeacherGrid`). Chaque cellule affiche :
- Le **numéro QCMCam** (mono, gras, `--ink-blue`) — ou `—` si overflow / `🚫` si exclu
- Le **prénom de l'élève** placé (italique gris) — sauf si `opts.hideNames` (passé à true à l'impression)
- Un **badge stratégie** en pied de titre : "Lisible (pas 10)" / "Lisible (pas 20)" / "Séquentielle"

Le plan est rendu **au-dessus du tableau** des élèves dans l'onglet QCMCam (juste après le bandeau d'avertissement éventuel). `cls = null` autorisé (utile pour l'impression — plan détaché de toute classe).

### Impression multi-salles — modale `mqcm-plan-print` + fonction `printQcmPlans(salleIds)`
Accessible via la modale **🎯 Marqueurs ArUco** (`Ctrl+P` sur l'onglet QCMCam), 4e carte orange "🗺 Imprimer le plan QCMCam (vue prof)" :
- Un seul bouton **📋 Choisir les salles…** → ouvre `mqcm-plan-print`
- Sous-modale : liste les **salles uniques** du catalogue `S.salles` (pas de doublons classe·salle — un plan est identique pour toutes les classes qui utilisent la salle, puisque les marqueurs sont physiques sur les tables), salle active pré-cochée, boutons ☑/☐ pour tout cocher/décocher
- À l'impression : `printQcmPlans(salleIds)` construit un `_buildQcmPlanHTML(null, salleId, { hideNames: true })` par salle dans `#qcm-plan-print-area`, injecte un `<style>` temporaire `@page A4 landscape + body > * { display:none } + body > #qcm-plan-print-area { display:block }`, appelle `window.print()`, puis nettoie tout.
- **Pas de prénoms** sur les plans imprimés (le plan papier vaut pour toutes les classes occupant cette salle).
- Les places **exclues** apparaissent avec leur hachuré + 🚫 sur l'impression — utile à coller au bureau du prof comme rappel.

### Bandeaux d'avertissement
- Rouge (`overflowCount > 0`) : "*N places au-delà de la 125e — ces places n'ont pas de numéro QCMCam et n'apparaissent pas dans l'export.*" + invitation à cliquer.
- Orange (`isSequential` sans overflow) : "*Numérotation séquentielle — la formule habituelle dépasserait 125, les numéros ne correspondent plus à la position physique.*"

### Crédits Sébastien COGEZ
Pied du bandeau d'info de l'onglet QCMCam (italique, 0.78em, séparé par un filet dashed) : remerciements à Sébastien COGEZ + mention licence CC BY-NC-SA 4.0 pour les marqueurs ArUco distribués par QCMcam. Présent aussi dans la zone "papier à jeter" des impressions de marqueurs ArUco générés localement.

### Modale "🎯 Marqueurs ArUco" (`mqcmmarkers`)

Accessible via le bouton **🎯 Marqueurs ArUco** dans l'onglet QCMCam OU par **Ctrl+P** sur cet onglet. 3 cartes :

1. **📥 Planche officielle** — lien direct vers le PDF 50 marqueurs de qcmcam.net
2. **🛠 Générateur en ligne** — lien vers le générateur personnalisable qcmcam.net (numéros 1-125, marqueurs nominatifs depuis un CSV)
3. **🎯 Générateur intégré local** (carte verte) — voir ci-dessous

### Générateur ArUco intégré (`printSalleArucoMarkers`)

Génère localement uniquement les marqueurs correspondant aux places utiles de la salle active. Un jeu par salle, réutilisable entre classes.

**Algo** (extrait de `markers4x4.js` de qcmcam.net) :
- Mapping `_ARUCO_N_TO_RAW[n]` (inversion du `p4` source — 125 patterns valides)
- `id_raw` → 4 chiffres base 4 → 4 lignes via `_ARUCO_OPTS = [[0,0,1,0],[0,0,1,1],[1,1,1,0],[1,0,1,1]]`
- Matrice 6×6 : bordure noire + 4×4 data au centre
- Lettres **A/B/C/D** + numéro côte à côte sur les 4 côtés, tous en **10pt physique** (calibré par calcul `numFs_px = 3.528 × W / sizeMm`). Anti-triche : illisible depuis la place du voisin.
- Marqueur central = 82% du canvas (gros gain de surface utile après passage de la lettre à 10pt)

**Layout d'impression** (CSS `@media print` + `@page { margin: 0 }`) :

| `perPage` | Carré découpé | Position | Traits de découpe | Crédit |
|---|---|---|---|---|
| **1** | 210×210 mm | en haut, plein largeur, appuyé sur 3 bords | **1 trait** horizontal à y=210 | Pied de page (y=215→295, 80mm) |
| **2** | 148.5×148.5 mm | empilés à gauche, appuyés sur bords gauche/haut/bas | **2 traits** : horizontal à y=148.5 + vertical à x=148.5 | Bande droite (x=150→208) tournée -90° |
| **4** | 105×105 mm | grille 2×2 en haut, appuyés sur bords gauche/droite/haut | **3 traits** : horizontal à y=105, vertical à x=105, horizontal à y=210 | Pied de page (y=215→295) |

Crédit licence CC BY-NC-SA des marqueurs Sébastien COGEZ — **hors zone à découper** (papier à jeter).

**Recto-verso (bord long)** : pour chaque chunk de `perPage` numéros, génération de 2 pages physiques (recto puis verso). Le verso a ses zones marqueur **miroir-inversées horizontalement** via CSS `.am-back` pour qu'à l'impression, le n° N tombe au DOS exact du marqueur N :
- 1/page : symétrie centrale (pas de miroir)
- 2/page : `left:61.5mm` au verso (décalé à droite)
- 4/page : swap des colonnes (pos-1 ↔ pos-2, pos-3 ↔ pos-4)

**Verso** : numéro géant centré dans la zone marqueur. **Font-size calculée dynamiquement** en JS pour que le chiffre tienne dans le carré quel que soit le nombre de chiffres (1, 2 ou 3) :
```js
const maxByWidth  = (zoneSizeMm * 0.85) / (0.6 * digits);
const maxByHeight = (zoneSizeMm * 0.85) / 0.72;
const fs = Math.min(maxByWidth, maxByHeight); // appliqué via style.fontSize = fs + 'mm'
```

**Réimpression de numéros perdus** : sous-section "🔁 Réimprimer des n° précis" avec champ texte qui accepte un format flexible (`5, 12-15, 23`). Parsé par `_parseArucoNumberList(text, max)` (gère virgules/espaces/point-virgules, plages avec tiret). Passé à `printSalleArucoMarkers(perPage, { customNums: [...] })`.

**Toast d'impression** rappelle de désactiver les marges du navigateur (« Marges : Aucune ») — les marges UI par défaut peuvent contrer le `margin:0` CSS.

## 🎲 Interroger — carte flottante qui surgit de la cellule

Lors d'un tirage aléatoire (`pickRandomStudent`), au lieu d'une modale centrée, une **carte flottante** naît aux dimensions de la cellule de l'élève et glisse vers une position adjacente, avec 4 traits SVG en pointillés bleus qui relient les angles cellule → angles carte (effet "écho visuel persistant"). La cellule d'origine reste affichée normalement.

### Composants
- `#pick-overlay` : div invisible plein écran, z-index 4998, **bloque toute interaction** avec le plan tant que la carte est ouverte (drag&drop, compteurs, menu contextuel). Clic dessus = ferme la carte.
- `#pick-svg` : SVG plein écran avec 4 `<line>` qui se tracent en delay 400ms (animation `stroke-dasharray` qui se déplace = effet « flux »).
- `#pick-float` : la carte avec fond `rgba(255,255,255,.85)` + `backdrop-filter: blur(8px) saturate(140%)` (verre dépoli — on devine la grille en arrière-plan).

### Positionnement (`_pickTargetPosition`)
Placement **adjacent** à la cellule (gap 16px), **côté opposé** à celui de la cellule dans le viewport (cellule moitié gauche → carte à droite, et vice-versa). Cascade : droite/gauche selon préférence, puis bas/haut en fallback, puis clamp final.

### Fonctionnement
- **`_pickShow(result)`** : positionne la carte aux dims de la cellule, opacity 0 → 1 + dimensions cibles via transition 420ms cubic-bezier.
- **`_pickHide(onComplete)`** : rétrécit + fade les traits, exécute `onComplete` après le setTimeout (clé pour éviter conflits transition).
- **`doPickNext()`** : si carte déjà visible → `_pickHide(() => _pickShow(...))` pour enchaîner les tirages proprement.
- **`_pickComputeCellRect(cls, sid)`** : détecte l'onglet actif (Plan Prof `#tg .cell` vs Vue Élève `#svg .svcell` — les `.svcell` ont aussi `data-key`).
- **Esc** ferme la carte en priorité sur Plan Prof / Vue Élève.
- Resize listener : recalcule position cible + traits en temps réel.

### Filtrage des éligibles (`pickRandomStudent`)
Tirage uniquement parmi les élèves : placés + dans le filtre groupe actif + non-ULIS/UPE2A + non absents (`_absentToday`).

## Impressions
- **Plan Prof** (mode 't') : grille avec noms, n° de tablette ("Tab. N"), badges G1/G2, couleurs de groupe sur les sièges, récap tablettes (CE + G1 + G2 en colonnes) en bas. Format **paysage**.
- **Plan Élève** (mode 's') : grille avec prénoms en grand. Paysage.
- **Plan vide** (`doPrintEmpty`) : grille de cases vides (hauteur 90px) pour écriture manuelle. Paysage.
- **Plusieurs plans (Prof)** (`printAllClasses`) : modal de sélection (cocher / décocher) puis impression d'une page par couple (classe, salle) sélectionné. Paysage.
- **Liste Élèves** (`printElevesList`) : table portrait — Élève · Groupe · 📦 · 📝, badges colorés selon `oubliColor()`. Lit le snapshot si en mode consultation incidents (sinon état vivant). Date du snapshot ou date du jour selon le contexte. Respecte le tri actif de l'onglet Élèves.
- **Fiche de prêt tablettes** (`printSuiviPret`) : tableau noms/n° tablettes avec date/horaire/salle. **Portrait**.

L'orientation est imposée via une règle `@page` injectée dynamiquement avant chaque appel à `window.print()`.

### Toggle "🎨 Couleurs / N&B"
- Persisté dans `localStorage.planClasse_printColors` (défaut : ON)
- Item dans le menu **🖨 Imprimer ▼** du Plan Prof
- En N&B, `_applyPrintColorMode()` injecte un `<style>` qui force tous les fonds colorés en blanc (cellules `.oc`, badges `.pgb.g1/g2`, `.pinc`). Les cases "sans table" `.nt` restent grisées (info structurelle).
- Les badges incidents 📦/📝 utilisent la classe `.pinc` (qui force `print-color-adjust:exact` pour Chrome/Edge) — fonctionne sur les cellules de plan ET sur les cellules de tableau (liste Élèves).

## Sync auto + backups
- Bouton **"🔄 Sync ON/OFF"** dans le header (persisté localStorage `planClasse_autoSync`)
- Quand activé :
  - Après chaque `save()` (debounce 5s), écriture du fichier principal `plan-classe-auto.json`
  - Au focus de la fenêtre, vérification de `lastModified` du fichier ; si modifié à l'extérieur, popup pour recharger
  - Création périodique (max 1 / 10 min) d'un backup horodaté `plan-classe-bk-*.json`
  - Rotation par paliers (plus c'est ancien, plus c'est espacé) :

| Âge | Granularité | Backups conservés |
|---|---|---|
| < 1 heure | 1 toutes les 10 min | ~6 |
| < 48 heures | 1 par heure | ~47 |
| < 14 jours | 1 par jour | ~12 |
| < 120 jours | 1 par semaine | ~15 |
| > 120 jours | supprimés | 0 |

Total max : ~80 backups sur 4 mois.

## Sauvegardes / chargement
- **Export JSON manuel** : fichier horodaté dans le dossier choisi via "📂 Recharger" (File System Access API, mode `readwrite`). Fallback : téléchargement classique.
- **Recharger** : modal listant les fichiers `.json` du dossier (les autoSave + backups + exports manuels).
- **Import JSON** : fichier local quelconque, avec confirmation.

## Raccourcis clavier
| Raccourci | Action |
|---|---|
| `Esc` | Fermer modals / désélectionner élèves |
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` ou `Ctrl+Maj+Z` | Refaire |
| `Ctrl+P` | Imprimer selon l'onglet actif (Plan, Vue Élève, Tablettes, Config, Élèves, Classes) ou ouvrir la modale "🎯 Marqueurs ArUco" sur l'onglet QCMCam |
| `+` / `-` / `=` | Zoom in / out / reset |
| `0` / `1` / `2` / `3` | Filtre groupe : Tous / G1 / G2 / G3 |
| `A` | Toggle mode appel (en Plan Prof) |

## Onglet Élèves — fonctionnalités spécifiques
- **Tri par colonne** : Nom, 📦 Matériel oublié, 📝 Travail non fait, 🚫 Absences cumulées, ⏰ Retards cumulés
- **Colonnes 🚫 / ⏰** : cumuls calculés à la volée par `getStudentAttendanceStats(classId, sid)` qui parcourt `S.attendance[classId]` et compte les apparitions dans `r.absents` / `r.retards`. Badge coloré via `oubliColor()`.
- **Édition de position en ligne** (champ texte par élève) avec collage multi-lignes type tableur (Enter passe au champ suivant + sélectionne). Le numéro affiché et accepté est le **numéro QCMCam** (cohérent avec l'onglet QCMCam et les marqueurs imprimés — cf. `qcmNumForCell` / `seatQCMToKey`).
- **Sélection multiple par clic & glisser** sur les lignes (sans case à cocher)
- **Barre d'actions en lot** : Affecter G1 / G2 / Aucun, Réinitialiser compteurs, Supprimer
- **Saisie directe des compteurs 📦/📝** : input numérique cliquable au lieu des anciens boutons +/−. Helpers `setOubli(id, v)` / `setNT(id, v)` → `_setCounter(id, field, type, newVal)` qui ajuste `history` proprement (push/pop selon le delta). Focus auto-select pour remplacer la valeur par frappe directe. Fond coloré via `oubliColor(n)` préservé pour l'oeil. La classe CSS partagée `.counter-input` retire les spinners du navigateur.
- **Bug Notes corrigé** : `openStuNotes` ne référence plus les champs `mn-ppre / mn-gevasco / mn-ulis-incl / mn-upe2a / mn-upe2a-incl` qui n'existent plus dans la modale `mnotes` simplifiée — seuls `mn-sid`, `mnotes-name` et `mn-notes` sont accédés. Ces statuts pédagogiques se règlent désormais via les boutons dédiés dans la ligne Élèves ou le menu contextuel.
- **Bouton 🕓 Historique** : modal à 2 onglets — Incidents (📦/📝) et Absences & retards (toutes classes confondues). Cf. section "Onglet Élèves — historique enrichi".
- **Bouton 📸 Snapshots** : sauvegarder / consulter l'état des incidents à une date (cf. section Snapshots)
- **Bouton 📊 Vue d'ensemble** : modal cross-classe avec filtres et tri (cf. section dédiée)
- **Bouton 📊 Export positions** : ouvre l'onglet caché `tab-notes` (tableau triable Position · Groupe · Nom · Prénom + export CSV). Bouton ↩ Retour Élèves dans le header de l'onglet ramène ici.
- **Bouton 🖨 Imprimer la liste** : impression portrait (Élève · Groupe · 📦 · 📝)

## Config Salles — édition des horaires

L'onglet Config Salle a une sous-section **"📅 Horaires de la journée"** sous la grille :
- Onglets de jour (Lundi → Dimanche) avec compteur de créneaux par jour
- Édition libellé / heure début / heure fin par créneau
- Boutons + Ajouter / ✕ Supprimer un créneau
- Bouton **"📋 Copier lundi → semaine"** : recopie le planning du lundi sur mardi-vendredi (avec confirmation)

À la création d'une nouvelle salle (modal `msalle`), un sélecteur **"Dupliquer depuis"** permet de reprendre dimensions, places vides et horaires d'une salle existante.

## Rappels / À vérifier (par élève)

Petites tâches mémo attachées à un élève — visibles directement sur sa cellule en Plan Prof pour rappeler à l'enseignant qu'il y a quelque chose à faire la prochaine fois qu'il voit l'élève (faire signer un mot, distribuer un document, vérifier un travail rattrapé, féliciter…).

### Modèle
`stu.reminders = [{ id, label, ts }]` (défaut `[]` — rétrocompatible, pas de migration nécessaire).

### UI sur la cellule (Plan Prof, `buildCell`)
- Si `stu.reminders.length > 0` : badge orange `<span class="crem-badge">🔔 N rappel(s)</span>` ajouté en tête de la zone `.spec-badges` + classe `.crem` ajoutée à la cellule (bordure orange).
- **Animation** : `@keyframes cremPulse` — halo orange pulsant (2.2s) pour attirer le regard. Désactivée au hover et à l'impression.
- **Tooltip** (`title`) : liste tous les rappels (1 par ligne), précédés de "•".
- **Click** (avec `event.stopPropagation()`) → `openReminders(sid)` qui ouvre la modale `mreminders`.
- **Vue Élève** (`renderStudentView`) : ne rend ni badges ni rappels — info privée au prof, jamais projetée aux élèves.
- **Impression** (`doPrint('t')`) : la fonction d'impression construit son propre HTML sans appeler `buildCell`, donc le badge n'apparaît pas sur le plan imprimé. Choix volontaire pour ne pas surcharger le papier.

### Menu contextuel
Item **🔔 Rappels / À vérifier…** ajouté dans `#ctx` entre Notes et Retirer. Label dynamique : `Rappels (N)…` si N > 0, sinon `Rappels / À vérifier…`. Mis à jour dans `showCtxMenu()`.

### Modale `mreminders`
- Titre : `🔔 Rappels — <prénom nom>`
- **Liste des rappels actifs** : pour chaque rappel, ligne fond crème + bordure gauche orange, label + date d'ajout, bouton **✓ Fait** (= supprime).
- **Boutons motifs prédéfinis** (constante `REMINDER_PRESETS`, 9 motifs courants) : clic = **pré-remplit le champ texte** (curseur en fin), à éditer si besoin puis valider via Enter ou bouton "Ajouter". Pas d'ajout direct — chaque rappel passe systématiquement par le champ pour pouvoir être personnalisé (ex. ajouter " — page 12" ou un nom).
  ```js
  const REMINDER_PRESETS = [
    '✍️ Faire signer un mot dans le carnet',
    '✍️ Faire signer une absence dans le carnet',
    '✍️ Faire signer un retard dans le carnet',
    '📤 Distribuer un document',
    '📥 Récupérer un document signé',
    '📚 Récupérer un livre / matériel prêté',
    '📞 Appeler / contacter les parents',
    '🌟 Penser à féliciter / encourager',
    '👀 Surveiller (placement, comportement)',
  ];
  ```
- **Champ texte libre** : Enter ou bouton "Ajouter" → rappel personnalisé (max 120 caractères). Auto-focus sur le champ à l'ouverture.

### Fonctions clés
- `openReminders(sid)` — ouvre la modale, peuple le sid caché, render
- `ctxOpenReminders()` — version pour le menu contextuel (ferme ctx, ouvre modale)
- `renderRemindersModal()` — rend liste + boutons preset
- `addReminderPreset(idx)` / `addReminderFromInput()` → `_addReminder(label)` → `pushUndo()` puis push, save, re-render Plan Prof + Élèves
- `removeReminder(rid)` — supprime + `pushUndo()`, save, re-render
- `_escAttr(s)` — helper d'échappement HTML/attribut (utilisé pour les tooltips et les labels affichés)

### Sérialisation, undo, snapshots
- Inclus naturellement dans `JSON.stringify(S)` → présent dans sauvegarde JSON, sync auto, backups, undo/redo.
- **Snapshots** d'incidents : NE capturent PAS `reminders` (les rappels sont des to-do du présent, pas un état historique à figer). Les snapshots de positions n'ont jamais touché aux infos élèves.

### Démo
`createDemo()` ajoute des rappels d'exemple sur quelques élèves de chaque classe (indices 2, 5, 10, 15) pour que la fonctionnalité soit visible dès le 1er lancement.

## Vérification des mises à jour (modal `mupdate`)

Bouton **🆕 Maj** dans le header → `checkForUpdate()` qui interroge l'API publique GitHub (`/repos/<user>/<repo>/commits/main`, sans auth, limite 60 req/h/IP) et compare la date du dernier commit avec la constante `APP_VERSION` (format ISO `'YYYY-MM-DDTHH:MM:SSZ'`, à incrémenter manuellement avant chaque push qu'on veut considérer comme nouvelle version).

Constantes en haut du `<script>` :
```js
const APP_VERSION   = '2026-05-04T22:30:00Z';
const APP_REPO_USER = 'Belenos-Toutatis';
const APP_REPO_NAME = 'plan-de-classe';
```

Comportement :
- ✅ **À jour** : message vert + version locale + date du dernier commit GitHub avec lien vers le commit (SHA tronqué).
- 🆕 **MAJ disponible** : message orange avec date locale, date GitHub, message du dernier commit, et boutons d'action adaptés au contexte :
  - **Détection en ligne / local** : `window.location.hostname.endsWith('github.io')` → en ligne (GitHub Pages) sinon local.
  - **En ligne** : bouton **🔄 Recharger maintenant** (`window.location.reload(true)` pour forcer le bypass cache + service worker).
  - **Local** : bouton **📥 Télécharger le ZIP** (`<repo>/archive/refs/heads/main.zip`) + bouton **🌐 Ou utiliser en ligne** (vers GitHub Pages).
- ⚠️ **Erreur** (offline / rate limit / timeout) : message rouge avec causes possibles et lien vers le repo pour vérification manuelle.

Helper `_formatRelDate(isoDate)` : convertit une date ISO en `JJ/MM/AAAA (il y a Xh / Xj / Xmois / Xan)` pour affichage human-friendly.

## Config Salle — modes d'édition (4 onglets)

L'onglet **Config Salle** propose 4 modes d'édition (chips en haut), tous appliqués à la salle active :

1. **Tables** — clic = bascule table / sans-table (modifie `salle.positions_vides`).
2. **Groupes G1/G2/G3** — sélection multi-cases puis clic sur `🔵 G1` / `🟠 G2` / `🟣 G3` / `— Aucun` (modifie `room.groupes` de chaque classe utilisant la salle). Mutuellement exclusif avec **Tags** au niveau d'une place.
3. **Tags** — sélection multi-cases puis clic sur un bouton de tag défini (modifie `room.posTagId`). Bouton `⚙ Gérer les tags` ouvre la modale `mtags`.
4. **Contraintes** — règles de placement par classe (cf. section ci-dessous).

Le mode actif est dans la variable globale `cfgMode`. Les fonctions `setCfgMode(mode)`, `_renderCfgBulkBar()` et `renderConfigGrid()` adaptent la grille et la barre d'actions en lot.

## Contraintes de placement (mode "Contraintes" de Config Salle)

Deux types de contraintes par classe :

### 1. Places autorisées par élève (`room.allowedFor[sid]`)
- Map `sid → ['r,c', ...]`. Une liste vide ou absente = aucune contrainte (peut s'asseoir partout).
- UI dans le mode Contraintes :
  - Bandeau jaune avec sélecteur d'élève + compteur "→ N/M places autorisées" + bouton **↻ Aucune contrainte**.
  - **Liste des élèves avec contraintes dans la salle** sous le sélecteur (chips cliquables qui basculent l'élève actif). Affiche `Nom Prénom (N)` avec compteur de cases. L'élève sélectionné a son chip en vert plein.
  - Sur la grille : 🟢 vert = case autorisée explicite · ⬛ gris = interdite (s'il existe une liste) · ⬜ blanc = libre.
  - Sélection multi-cases puis bouton **✓ Autoriser** ou **✗ Interdire**.
- Helpers : `isPlaceAllowedForStudent(room, sid, key)`, `studentHasPlaceConstraint(room, sid)`.

### 2. Paires d'élèves à séparer (`cls.noNeighbors`)
Tableau de strings `'sidA|sidB'` (sids triés alphabétiquement). UI :
- Section sous la grille (déplacée APRÈS la grille pour ne pas couper la vue de l'élève sélectionné).
- **Drag & drop** : on glisse un nom d'élève sur un autre pour créer la paire. UX validée par l'utilisateur, ne pas modifier.
- Toggle d'affichage **📋 Liste / 📊 Diagramme** (persisté `localStorage.planClasse_pairsView`).
- Mode **Diagramme** : SVG inline, un cluster (composante connexe du graphe des paires) par bloc. Layout en cercle pour clusters ≥ 3, ligne horizontale pour clusters de 2. Couleur des nœuds graduée par degré (1 paire = rose clair, 2 = rouge, 3+ = rouge foncé). Toolbar zoom : 🔍+ / 🔍− / 100% / ↔ Adapter ; molette = zoom centré curseur ; drag = pan. Zoom persisté `localStorage.planClasse_pairsDiagZoom`.

### Règle de séparation des paires (un seul niveau, calibrée sur vérité-terrain)
Plus de sélecteur 1..4 — règle unique pour toute classe. Un candidat à `(r2, c2)` est INTERDIT pour un élève déjà à `(r, c)` si **l'une de ces 4 conditions** est vraie :

| # | Condition | Couvre |
|---|---|---|
| 1 | **Même îlot** | Tables groupées physiquement → toujours interdit, peu importe la distance dans l'îlot |
| 2 | **Même rangée 1D contiguë** (sans `positions_vides` entre) **ET `dc_raw ≤ 3`** | Rangée de tables collées : 3 voisins de chaque côté |
| 3 | **`dc_eff ≤ 1` ET `dr_eff ≤ 3`** | "Col line" — directement devant/derrière jusqu'à 3 rangées effectives, plafonné |
| 4 | **`dr_eff ≤ 1` ET `dc_eff ≤ 2` ET `dc_raw == dc_eff`** (pas d'allée verticale traversée) | Voisinage immédiat sans trou de séparation |

**Distance effective** : raw moins le nombre de rangées (resp. colonnes) entièrement vides traversées. Une rangée d'allée vide entre deux îlots est "transparente". Calibrée à 0 mismatch sur un fichier-test de 12 scénarios × 128 cellules-décisions.

### Helpers clés
- `_computeTableGroups(salle)` → `Map<'r,c', { row, startCol, endCol }>` — pour chaque case-table, le groupe 1D contigu auquel elle appartient.
- `_cellGroupInfo(salle, key, ilots, groups)` → `{ cells, set, kind: 'ilot'|'row', tag, ... }` — îlot prioritaire sur le groupe 1D.
- `_countVideRowsInRangeStrict(posVides, r1, r2, cMin, cMax)` / `_countVideColsInRangeStrict` — compte les rangées/colonnes entièrement vides traversées (pour la distance effective).
- `_pairAdjacentKeys(cls, salle, key)` → keys "adjacentes" au sens des paires (jeu de règles unique).
- `getPlacementViolations(cls, sid, key)` / `collectAllViolations(cls)` — utilisés par les alertes UI et la modale `mviolations`.

### Modale d'alerte (`mviolations`)
Apparaît automatiquement après tout placement créant des violations (drag, paste position, mélange, restauration snapshot…). Helper `_maybeShowViolationsModal(cls)` avec dédoublonnage par hash (`_violationsHashStr`). 4 options :
- **✋ Résoudre manuellement** — ferme la modale, l'utilisateur drag&drop
- **🔁 Solution minimale** — `resolveMinimalConflicts()` : algo greedy de swaps (max 200 itérations). Pour chaque sid en violation, `_tryFixOneViolation` cherche un swap qui réduit le nombre total de violations. Les cellules touchées sont ajoutées au surlignage rose.
- **🎲 Replacer tout aléatoirement** — ouvre la modale `mshuffle` (cf. ci-dessous)
- **✓ Garder & supprimer les alertes** — `dismissViolations()` met le hash dans `_violationsAcceptedFor` ; tant que le seating ne change pas, plus d'alerte visuelle. Le tooltip mentionne toujours la violation.

## Mélange aléatoire — modale "🔀 Mélanger tout" (`mshuffle`)

Remplace le simple `confirm()` historique. Permet d'ajuster les **règles de répartition spatiale** avant placement, sans toucher aux contraintes (toujours respectées en arrière-plan).

### Options
- **Remplir d'avant en arrière** (toggle) — défaut ON. Trie les groupes de tables par rangée croissante puis colonne croissante.
- **Placer aussi les élèves hors inclusion (ULIS / UPE2A)** (toggle) — défaut OFF. Visible uniquement si la classe contient au moins un élève avec `(ulis && !ulis_incl)` ou `(upe2a && !upe2a_incl)`.
- **Stratégie d'espacement par taille de groupe** (sélecteur par taille présente dans la salle) — défaut `spread` :
  - `spread` — Espacer (positions équidistantes via `round(i * (N-1) / (K-1))`, K=1 → milieu)
  - `left` — Compact à gauche (côté visuel gauche en Plan Prof = indices [N-K..N-1] data)
  - `right` — Compact à droite (côté visuel droit en Plan Prof = indices [0..K-1] data)
  - `center` — Centré (compact contigu au milieu) — uniquement pour N ≥ 3
  - `inside` — Vers l'intérieur de la salle (résolu par groupe selon sa position : groupe sur la moitié gauche du plan → `right`, groupe sur la moitié droite → `left`)
  - `outside` — Vers l'extérieur de la salle (opposé d'`inside`)

**Aperçu visuel** : à côté de chaque sélecteur, un mini-aperçu Unicode (■ = élève, □ = vide) en orientation **Plan Prof** (col 0 à droite). Pour `inside` / `outside`, deux aperçus côte à côte (groupe sur la gauche du plan / sur la droite du plan) car la stratégie est symétrique selon la position du groupe.

### Persistance
Les options sont persistées dans `S.salles[salleId].shuffleOpts` — donc **par salle**, partagées entre toutes les classes qui utilisent cette salle. Présent dans le JSON (sauvegarde manuelle, sync auto, backups). Bandeau bleu *« 💾 Réglages mémorisés pour cette salle »* à la 2e ouverture et au-delà.

### Algorithme (`_doOneRandomPlacement`)
1. Identifie les groupes de tables (via `_computeRoomGroupsSorted(salle, frontFirst)`).
2. **Round-robin** sur les groupes : 1 élève dans chaque, puis 2, puis 3, etc., jusqu'à épuisement → l'avant est rempli en premier quand la classe est sparse.
3. Pour chaque groupe avec `K` élèves cibles, sélectionne `K` positions via `_selectGroupPositions(N, K, strategy)`. `inside`/`outside` sont résolus par groupe via `_resolveDirectionalStrategy`.
4. **Affecte les élèves aux places cibles** avec relâchement progressif (7 niveaux de filtres) :
   - cible + zone G1/G2/G3 + autorisée + pas de paire
   - … jusqu'à : n'importe quelle place libre (dernier recours).
5. Tente `NB_TRIES = 30` essais, garde le meilleur via `_countPlacementViolations(cls)`. Sortie anticipée si 0 violation.

### Filtre ULIS/UPE2A
Avant placement, `_runRandomPlacement` filtre `studentsToPlace` pour exclure les élèves avec `(ulis && !ulis_incl) || (upe2a && !upe2a_incl)` si `placeUlisAbsents === false`.

## Surlignage rose des places modifiées (`S.movedHighlights`)

Quand un placement modifie une ou plusieurs cases (drag&drop, mélange, "🔁 Solution minimale", retrait, paste de positions, restauration snapshot…), les cases touchées sont **mises en évidence en rose clignotant** (animation CSS `cellMovedPulse`, classe `.moved-cell`). Visible en Plan Prof ET en Vue Élève (pour que les élèves voient qui doit changer de place).

### Stockage persistant
`S.movedHighlights[classId][salleId] = { keys: ['r,c', ...], hidden: bool }` — par classe + salle. Présent dans le JSON, donc **traverse les sessions et les machines** (un placement préparé chez soi le soir est retrouvé surligné le lendemain en classe).

### Accumulation
Chaque placement **fusionne** les nouvelles keys dans le bucket via `_recordMovesFromDiff(cls, beforeSeating)` — accumulation de tous les changements jusqu'à effacement explicite. Les sites d'appel sont les fonctions de placement (`dropOnCell`, `randomPlacement`/`_runRandomPlacement`, `removeSeat`, `unplaceStu`, `clearAllSeating`, `mseBulkApply`, `placeStudentAtEntry`, `snapshotRestore`, `onPosBlur`, `onPosPaste`, `resolveMinimalConflicts`).

### Bouton 💡 dans la toolbar (Plan Prof + Vue Élève)
Toujours visible (même si aucun surlignage actif → opacité .35 + grayscale). 3 états :
- **Idle** (aucune case rose) : bouton grisé, tooltip explicatif. Clic = sans effet.
- **Actif visible** : bouton normal. Clic gauche = masque (passe en *hidden*). Clic droit = `_clearMovedHighlight()` (vide le bucket, irréversible pour cette classe + salle).
- **Actif masqué** : bouton semi-grisé. Clic gauche = réaffiche. Clic droit = efface.

À côté du bouton, un petit texte gris italique d'aide (classe `.moved-help-text`) s'affiche **uniquement quand un surlignage est actif** : *« ← cases roses : clic ici pour les masquer · clic droit pour les effacer »* (texte adapté à l'état). Sert aux nouveaux utilisateurs qui ne maîtrisent pas encore le bouton.

### Helpers
- `_getHighlightBucket(cls, autoCreate?)` — récupère/crée le bucket pour la classe + salle active.
- `_recordMovesFromDiff(cls, beforeSeating)` — calcule le diff seating et merge les keys changées.
- `toggleMovedHighlight()` (clic gauche), `moveHighlightContextMenu(event)` (clic droit), `_clearMovedHighlight()`.
- `_updateMovedHighlightBtnUI()` — appelé en fin de `renderTeacherGrid` et `renderStudentView`.

### CSS
`.moved-cell` (sélecteur générique, fonctionne sur `.cell` ET `.svcell`) : `outline: 5px solid #ff1493 !important; z-index: 10; animation: cellMovedPulse 0.9s ease-in-out infinite`. Le `!important` sur l'outline-color est nécessaire pour battre les autres animations CSS qui surchargent `outline-color` (rappels, violations).

## Conventions de développement
- Tout le code reste dans le fichier HTML unique — ne pas éclater en plusieurs fichiers
- CSS dans le `<style>`, JS dans le `<script>` en fin de body
- Pas de dépendances externes (pas de CDN, fonctionne hors-ligne)
- Pile d'undo/redo basée sur `JSON.stringify(S)` (sérialisation complète) ; les accesseurs proxy étant non-énumérables, ils sont exclus de la sérialisation et ré-installés via `applyAccessorsAll()` après `JSON.parse()`
- IndexedDB pour persister les handles de répertoire (sync auto) et QCMCam — clés `'dir'` et `'qcm-dir'`
- Toute action mutante doit appeler `pushUndo()` AVANT la mutation, sinon l'undo capture le mauvais état
- Pour les développements longs : travailler sur une copie `plan de classe new.html`, puis remplacer une fois validé (convention demandée par l'utilisateur)
- Modals empilés (par ex. mhist par-dessus moverview) : utiliser `_modalReturnTo[id]` pour enregistrer un callback à la fermeture, ou bien laisser le modal parent ouvert et bumper le `z-index` du modal enfant à 1010+
