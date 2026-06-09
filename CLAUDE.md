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
- `plan de classe.html.bak` — copie de sécurité locale de l'app avant modifications lourdes (créée manuellement par l'utilisateur). Gitignoré via `*.bak`, non publié sur GitHub Pages.
- `index.html` — page de redirection servie à la racine `belenos-toutatis.github.io/plan-de-classe/`. Meta refresh + `<script>location.replace(...)</script>` vers `./plan%20de%20classe.html`. Mini design "carnet du prof" en fallback si la redirection traîne. Permet d'utiliser une URL courte au lieu de l'URL longue avec `%20`.
- `.nojekyll` — fichier vide. Désactive le pipeline Jekyll de GitHub Pages (sinon Jekyll prend `README.md` comme index automatique et ignore `index.html`). **Indispensable** pour que la redirection fonctionne.
- `manifest.json` — manifeste PWA (thème #1a252f, bleu foncé)
- `sw.js` — service worker (utilisation hors-ligne, network-first)
- `README.md` — documentation utilisateur (orientée GitHub)
- `LICENSE` — double licence : MIT (code de l'app) + CC BY-NC-SA 4.0 (composants ArUco — algorithme, mapping des 125 patterns, layout d'impression — dérivés de QCMcam par Sébastien COGEZ)
- `CREDITS.md` — remerciements détaillés à Sébastien COGEZ (QCMcam), à la communauté enseignante, et aux polices embarquées (Fraunces, IBM Plex Sans, JetBrains Mono — toutes sous SIL Open Font License)
- `.gitignore` — exclut les sauvegardes locales (`plan-classe-*.json`, `*.bak`, `*.tmp`)
- `plan-classe-AAAA-MM-JJ-HHhMMmSS.json` — exports manuels horodatés (non versionnés)
- `plan-classe-auto.json` — fichier de sync auto (écrasé en continu, non versionné)
- `plan-classe-bk-AAAA-MM-JJ-HHhMMm.json` — backups horodatés (rétention par paliers, non versionnés)

## Données de démo (1er lancement)
`createDemo()` (fin du fichier, juste avant `init()`) génère des données fictives au tout premier lancement, conditionné par `localStorage.planClasse_demoInstalled !== '1'` :
- **6 classes fictives** : 6e A (30, 2 salles), 6e B (28, 2 salles), 5e A (32, 2 salles), 5e B (29, 2 salles îlots), 4e A (30, 3 groupes G1/G2/G3), 3e A (25, sans groupes — démontre chips désactivés)
- **Évaluations** (`_seedDemoEvaluations`) : ~10 évaluations réparties sur 5 classes — 6A en a 4 (Type A "Mesures" S1, Type B "Démarche" 3 passations S1+S2, Type C "DS Vol/Masse" S1 avec compétences inline, Type A "Éval finale" S2), 6B en a 3 (dont 1 Type C noté /40), 5A en a 3 (dont Type B 3 passations + Type C "DST" coef 3), 5B en a 2, 4A en a 1. 3A reste sans évaluation (état vide démontré). Couvre : valeurs A/NN, commentaires, exclusions, `dateIndiv` (rattrapage), `studentRemarks`, coef variés, noteMax variés (10/20/40), compétences inline Type C.
- **Bulletin** : `bulletinRemarques` par (élève × période) sur 6A/6B/5A/5B, `bulletinClassRemarques` S1+S2 sur 6A/6B/5A, `bulletinWorkedItems` S1+S2 sur 6A/6B/5A/5B.
- **4 salles** : Salle 102 (5×8 avec allée centrale), Salle 105 (4×9 avec allée centrale), Salle ÎlotA (8 îlots mixtes 2×2 + 2×3), Salle ÎlotB (9 îlots 2×2 en grille 3×3)
- **3 classes mobiles** customisées : CM1 et CM2 à 32 tablettes (2 lots chacune), Pack ENT 15 tablettes (1 lot)
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

### Groupe 2 — "Évaluations" (3 onglets actifs)
1. **📊 Devoirs** (`tab-notes`) — création/édition d'évaluations Type A (mini-notes /20), Type B (compétences par passations), Type C (sommative avec exercices). Saisie en tableur ou en fiche par élève. Multi-classes. Tableau d'évaluations avec stats.
2. **🎯 Bilan des compétences** (`tab-comp`, ex « Bilan par compétences ») — vue transverse classe : niveau moyen par élève sur chaque compétence évaluée. Sticky header + remarque classe et éléments travaillés synchronisés avec l'onglet Bilan des notes.
3. **📜 Bilan des notes** (`tab-bilan`, ex « Bilan des évaluations ») — agrégation période : moyenne /20 par élève, rang, remarque bulletin (par élève × période). Sticky thead/tfoot via `position:sticky` dans `.bilan-table-scroll` (max-height calc(100vh - 220px)), masquage individuel de colonnes (Moy/Rang/Rem) en multi-période via `_bilanHiddenCols` (Set mémoire seule), paste multi-lignes depuis tableur (`_onBilanRemarquePaste`). Bouton **🔀 Comparer classes** : ouvre la modale `mbilan-crosstab` (tableau croisé classes × civilité — moy · σ · médiane — sur la période entière ou un sous-ensemble d'évals).

Le label porte une infobulle *« Volet fonctionnel mais encore en cours de finalisation »* — les types A/B/C de saisie + les deux vues d'agrégation sont opérationnels. **Type D (sommative par compétence sans questions intermédiaires) à venir.**

### Bulletin — remarques et éléments travaillés
- **`S.bulletinRemarques[classId][sid][periode] = "texte"`** : brouillon de remarque bulletin par (élève × période). Partagé entre Bilan des compétences et Bilan des notes.
- **`S.bulletinClassRemarques[classId][periode] = "texte"`** : remarque générale classe par période. Synchronisée entre les 2 onglets bilan via `_renderBilanBottomSection`.
- **`S.bulletinWorkedItems[classId][periode] = [item1, item2, …]`** : liste des éléments travaillés sur la période. Synchronisée idem.

### Contraste texte sur fond coloré (`_contrastTextColor`)
Pour les cellules à fond inline (`background:#hex` ou `background:hsl(...)`), `_contrastTextColor` renvoie une couleur **littérale** (`#1a252f` ou `#fff`) et non `var(--ink-deep)` — ce dernier devient clair en thème sombre, donc texte clair sur pastel clair = invisible. À utiliser dès qu'on pose un fond coloré inline (cellules tableur, badges, chips, bilan note /20, rang).

Le design système supporte ce volet :
- Primitive `.gridtable` (préparée dans l'onglet Élèves, réutilisée dans le tableur d'éval)
- Variables `--maitrise-1..N` (palette de couleurs adaptée à `nbLevels`, mode auto disponible)
- Police mono `JetBrains Mono` pour chiffres tabulaires, codes de compétences, codes mini-notes

Onglets sortis de la navigation principale (accessibles via bouton) :
- **Vue Élève** — bouton **"🔄 Vue Élève"** dans Plan Prof (et inversement)
- **Export positions** (`tab-export-pos`, renommé depuis `tab-notes` libéré par Évaluation) — bouton **"📊 Export positions"** dans la toolbar de l'onglet Élèves. Tableau triable Position · Groupe · Nom · Prénom + bouton 💾 Export CSV. Le bouton **"↩ Retour Élèves"** dans le header de l'onglet ramène à Élèves. Au démarrage, si `localStorage.planClasse_tab === 'notes'` ou `'export-pos'`, on retombe sur `'eleves'`.

**Filtre de groupe persistant** : `groupFilter` (0=Tous, 1=G1, 2=G2) est sauvegardé dans `localStorage.planClasse_groupFilter` à chaque appel de `setGroupFilter()`. Restauré dans `init()` avant le 1er render, et le chip correspondant est activé. Évite de devoir re-cliquer sur G1/G2 après un F5 en plein cours.

**Désactivation visuelle des chips G1/G2** (`_updateGroupChipsState()`) : si la classe courante n'a aucun élève dans le groupe G1 (resp. G2), le chip correspondant reçoit la classe `.disabled` (opacity .35 + cursor:not-allowed + tooltip explicatif). Empêche le piège « grille entièrement fantôme » qui survenait quand le filtre persisté G1 atterrissait sur une classe sans élève en G1 (toutes les cellules `.ghost`, click handlers non attachés, mode appel inopérant). Appelée au début de `renderTeacherGrid()` et `renderStudentView()`. Le clic sur un chip désactivé est ignoré dans `setGroupFilter()` (early return) et dans le raccourci clavier `1`/`2`.

## Activation des fonctions (Réglages → 🧩 Fonctionnalités)

Permet à l'enseignant de **n'activer que les fonctions dont il a besoin**. 4 interrupteurs (tout activé par défaut → aucun changement pour les fichiers existants), dans une section « 🧩 Fonctionnalités » en tête de la modale ⚙ Réglages (`msettings`) :
- **📱 Tablettes** · **📷 QCMCam** · **🙋 Appel** · **📊 Évaluations**

### Modèle
`S.featureFlags = { tablettes, qcmcam, appel, evaluation }` (booléens). **Synchronisé dans le fichier** (sauvegarde JSON, sync auto, undo/redo). Migration dans `postLoadHook()` : crée l'objet et force `true` pour toute clé absente.

### Mécanisme
`_applyFeatureFlags()` pose des classes sur `<body>` (`ff-no-tablettes` / `ff-no-qcmcam` / `ff-no-appel` / `ff-no-eval`) ; le CSS masque tout ce qui s'y rapporte. Helper `_featureEnabled(key)` (défaut = activé). Appelé : fin de `postLoadHook()`, `undoLast`/`redoLast`, début d'`init()` (avant restauration de l'onglet), et `_toggleFeature(key, on)` (depuis les cases à cocher).

`_toggleFeature` : `pushUndo()` → set flag → si on désactive l'onglet actif, repli sur Classes (via `FEATURE_TABS`) + quitte le mode appel le cas échéant → `save()` → `_applyFeatureFlags()` → refresh des libellés.

### Masquage « complet » (sélecteurs masqués par fonction)
- **Tablettes** : onglet nav `#nb-ipads`, sélecteur de classe mobile dans Plan Prof (`.ff-tablettes`), items « Affecter/Désaffecter » du menu Actions, pastilles `.cipad` dans les cellules, récap tablettes des impressions (`doPrint('t')`, `buildTeacherPageHTML` : conditionnés par `_featureEnabled('tablettes')`).
- **QCMCam** : onglet nav `#nb-qcmcam`. (La numérotation de position dans Élèves reste — c'est l'ordre des sièges.)
- **Appel** : boutons `#btn-appel-mode` + `#btn-appels-passes`, colonnes 🚫/⏰ (classe `.ff-appel`) dans Élèves, Vue d'ensemble, Export positions et liste imprimée (`printElevesList`), raccourci clavier `A` neutralisé.
- **Évaluations** : groupe nav `#nav-group-eval` (3 onglets), bouton 🎓 Disciplines (en-tête Classes), 📤 Exporter les notes (menu Données) — classe `.ff-eval`.

Au démarrage, un onglet persisté d'une fonction désactivée retombe sur Classes (garde-fou dans `init()`).

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
  - **Pas encore arrivé** (`arrivalDate` future) : le sid **reste** dans `seating` — masque d'affichage, la place lui est réservée et le siège le réaccueille dès qu'il devient actif.
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
- Glisser tactile (Touch Events) : l'AESH se déplace via `_tdAttach(cell, () => ({srcType:'aesh', aeshIdx, fromKey:key}), {})` — appui maintenu puis glisser (cf. section « Glisser & déposer »).
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

## 🎙 Sonomètre — surveillance du niveau sonore

Bouton **🎙** dans le header (entre 💾 Données et ⓘ, id `#btn-noise`, `toggleNoiseMeter()`) — donc accessible **sur tous les onglets**. Active la mesure du bruit ambiant via le micro (Web Audio API) et alerte quand le niveau est trop élevé de façon soutenue.

### Confidentialité & contraintes
- **Analyse 100 % locale, en temps réel** : aucun son enregistré ni transmis. Mentionné dans la modale ⓘ → Vie privée et dans la modale de réglages.
- `getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}})` — on désactive les traitements pour mesurer le niveau **brut** (l'AGC normaliserait le volume et fausserait le sonomètre).
- **Contexte sécurisé requis** : HTTPS (GitHub Pages) ou `localhost`. Échoue en `file://` → toast explicite. Toutes les erreurs (refus, indispo) sont catchées en toast, jamais d'exception non gérée.

### Niveau (relatif, pas des dB calibrés)
`_noiseRawDb()` : RMS du signal temporel (`getByteTimeDomainData`) → dBFS brut (`20·log10(rms + 1e-7)`, ~ −140 .. 0). `_noiseComputeLevel()` mappe ce dBFS sur **0–100** : `(db − floor) / (0 − floor) · 100` clampé, où `floor = _noiseSettings.silenceDb` (= le dBFS qui doit correspondre au niveau 0). 0 dBFS (plein échelle) reste mappé à 100. `_noiseFrame()` (boucle `requestAnimationFrame`) applique un lissage exponentiel (`smooth = smooth·0.75 + raw·0.25`). Pas de vrais décibels → l'utilisateur **calibre le plancher de silence ET le seuil** pour sa salle.

#### Plancher de silence réglable (`_noiseSettings.silenceDb`, défaut −60)
Le plancher (= niveau 0) était figé à −60 dBFS ; il est désormais **réglable** dans la modale `mnoise` (fieldset « 🤫 Plancher de silence (niveau 0) », inséré juste après l'encart « Niveau actuel », avant le seuil d'alerte) pour calibrer le silence réel de la salle — le bruit de fond ventilation/couloir ne descend jamais à −60 dBFS, donc la jauge ne retombait jamais vraiment à 0. Borné par `NOISE_SILENCE_MIN = -80` / `NOISE_SILENCE_MAX = -25` (le span ne peut pas devenir nul). Clampé au chargement dans `_noiseLoadSettings`. Persisté dans `localStorage.planClasse_noiseSettings` comme les autres réglages.
- **Bouton « 🤫 Calibrer le silence »** (`noiseCalibrateSilence()`) : échantillonne `_noiseRawDb()` toutes les 60 ms pendant ~1,5 s, écarte les 20 % d'échantillons les plus forts (ignore un bruit ponctuel), prend la moyenne − 2 dB de marge → fixe `silenceDb`. Désactivé (avec indice rouge `#noise-calib-hint`) si le sonomètre n'est pas actif (`_noise.active`). Garde-fou anti double-clic via `btn.dataset.busy` ; s'interrompt proprement si le micro est coupé en cours de mesure.
- **Curseur de réglage fin** (`#noise-silence-range`, −80..−25, `noiseSetSilence`) + bouton **↺ Défaut** (`noiseResetSilence`). `_noiseSyncSilenceUI()` synchronise curseur + valeur affichée ; appelé par `openNoiseSettings`, la calibration et le reset.

### Logique d'alerte (anti-fausses-alertes)
Alerte déclenchée seulement si le niveau lissé **≥ seuil pendant ≥ `sustainS`** (défaut 3 s) **ET** que la **temporisation `cooldownS`** (défaut 15 s) depuis la dernière alerte est écoulée. `overSince` (début du dépassement continu) remis à 0 dès que le niveau repasse sous le seuil. `_noiseTriggerAlert()` pose l'état visuel (4 s via `alertClearTimer`) + joue le son ; `cooldownS` empêche le re-déclenchement avant expiration.

### Affichages
- **Petit widget flottant** (`#noise-widget`, `position:fixed` bas-droite, z 985 < modales) : barre de niveau à 3 zones 🟢 calme / 🟠 animé / 🔴 trop fort (`_noiseZone` : loud si ≥ seuil, warn si ≥ seuil−18, sinon calm), marqueur de seuil, n° de niveau, état texte. Boutons 🔔/🔕 (couper/réactiver le son — `_noiseWidgetToggleSound`) · ⚙ (réglages) · 🪟 (fenêtre déplaçable) · ✕ (arrêt). L'état `soundOn` est synchronisé entre les 3 surfaces (widget, case de la modale, bouton de la popup) via `_noiseSyncSoundUI()`. **Alerte visuelle par défaut = le widget passe au rouge** (classe `.alert`, halo pulsant). Pendant que le sonomètre est actif, `startNoiseMeter`/`stopNoiseMeter` posent/retirent `body.noise-widget-on` → règle CSS qui **remonte les toasts** (`#toast` à `bottom:112px`) pour qu'ils ne recouvrent pas le widget (même coin bas-droite).
- **Fenêtre flottante projetable** (`noiseOpenWindow()`, async) : ouvre une fenêtre séparée déplaçable sur un 2e écran / vidéoprojecteur. **Deux mécanismes, dans l'ordre :**
  1. **Picture-in-Picture « document »** (`documentPictureInPicture.requestWindow`) si disponible (Chromium/Edge) → fenêtre **toujours au premier plan** (au-dessus des autres fenêtres/applis). C'est la seule manière fiable d'obtenir l'always-on-top depuis le web — `window.open` ne le permet pas.
  2. **Repli `window.open`** (popup `sonometre_classe`) si PiP indisponible (Firefox/Safari) → fenêtre déplaçable **mais pas toujours au-dessus**. Si bloquée → toast.
  - Le contenu est rempli par `_noiseFillWindow(win, thr)` (styles inline + IDs `npw-emoji` / `npw-fill` / `npw-thr` / `npw-num` / `npw-msg`, `body.alert` pour le flash) — partagé entre les deux mécanismes (`document.body.innerHTML` + `<style>` injecté, fonctionne sur l'`about:blank` de window.open comme sur le document PiP).
  - **3 contrôles dans la fenêtre** (`#npw-ctrl`, handlers attachés depuis la fenêtre principale via `addEventListener`) : **🔔/🔕 son** (`_noisePopupToggleSound` → bascule `_noiseSettings.soundOn` + persiste + sync la case de la modale réglages), **⊟ compact** (`_noisePopupToggleCompact` → strip horizontal minimal `body.compact` + `resizeTo(300,130)`), **⛶ agrandir** (`_noisePopupToggleMax` → remplit l'écran via `resizeTo(availWidth,availHeight)` + `moveTo`). État de taille dans `body.dataset.size` ('compact'|'normal'|'max'), helpers `_noisePopupSetSize` / `_noisePopupCurSize`.
  - ⚠️ **Le vrai plein écran (API Fullscreen / F11) n'est PAS autorisé dans une fenêtre Picture-in-Picture** (limite Chromium). D'où « ⛶ agrandir » par **redimensionnement** (remplit l'écran tout en restant au premier plan) plutôt que `requestFullscreen`. `resizeTo`/`moveTo` fonctionnent sur PiP comme sur window.open.
  - **L'analyse audio reste dans la fenêtre principale** ; `_noiseRenderMeters` pousse les mises à jour dans `_noise.popup.document` à chaque frame — il **toggle uniquement la classe `alert`** (pas `body.className =`, qui écraserait `.compact`). Re-clic sur 🪟 = `focus()`. Fermeture (`pagehide`) → `_noise.popup = null`. Remplace l'ancienne grande jauge plein écran (choix utilisateur). ⚠️ La boucle rAF de la fenêtre principale ralentit si celle-ci est **minimisée** ; en usage normal (app visible sur l'écran 1, fenêtre sur l'écran 2) elle tourne normalement.
- Bouton header : `.noise-on` (vert, actif) / `.noise-alert` (rouge pulsant, en alerte).

### Alerte sonore (`noisePlayAlert` + `_noiseBuildPattern`)
Sonneries générées localement aux oscillateurs Web Audio (aucun échantillon). `noisePlayAlert(isTest)` crée un **gain maître** = `volume/100` connecté à `destination`, puis délègue à **`_noiseBuildPattern(type, blip)`** qui programme la série de `blip(freq, start, dur, peak, type?)` du motif choisi et renvoie sa durée totale (sert à fermer l'`AudioContext` éphémère du bouton **▶ Tester**). Réutilise l'`AudioContext` live si présent.

**Catalogue (`_NOISE_SOUND_TYPES`, 10 types) — 2 groupes dans le `<select>`** :
- **Sons classiques** : `bell` (cloche claire, ding-dong B5+E6 ×3 — défaut), `beep` (4 bips), `chime` (carillon descendant), `alarm` (sirène 2 tons, onde carrée), `digital` (bips numériques carrés), `gong` (fondamentale grave + quinte, triangle), `cuckoo` (tierce sol/mi ×3)
- **Jeux vidéo rétro** (couplet complet qui se résout, ondes carrées) : `pacman` (jingle d'intro complet ≈ 3 s), `mario` (phrase principale complète ≈ 5 s), `tetris` (Korobeiniki, phrase A résolue sur la tonique ≈ 4,8 s — domaine public). Les thèmes vont **jusqu'au bout de leur couplet** (pas coupés en plein milieu). Le minuteur (cf. section dédiée) en a des versions plus longues distinctes.

**Bascule + arrêt du son** : `noisePlayAlert(isTest)` mémorise le son en cours dans `_noise.curSound = { ctx, master, oscs, temp, closeTimer }`. Un second clic sur **▶ Tester** appelle `_noiseStopSound()` (ramp master → 0 + `osc.stop()` ; ferme le ctx seulement si `temp`, jamais le ctx live de l'analyseur). `_noiseStopSound()` est aussi appelé à la **fermeture de la fenêtre flottante** (handlers `pagehide` PiP + window.open), à la **fermeture des réglages** (`_modalReturnTo['mnoise']`) et dans `stopNoiseMeter()` — couper le son n'arrête jamais l'analyse micro.

**Calibrage saturation** : les pics par `blip` sont réglés pour qu'à **volume 100 %** le motif frôle 0 dBFS (limite de saturation, pics mesurés ~0.8–0.92 en rendu offline), sans clipping > 1.0 ; le gain maître met tout à l'échelle linéairement (volume 0 → silence, pas de son généré). Les ondes carrées/triangle utilisent des pics un peu plus bas que les sinus (plus d'énergie harmonique).

**Helpers d'écriture des motifs** : table `_NOTE_HZ` (nom de note → fréquence, La4=440) + `seq([[freq|nom, dur], …], peak, wave)` interne à `_noiseBuildPattern` (joue chaque note staccato à 90 % du créneau ; `0`/`''` = silence). Les motifs simples appellent `blip` directement.

### Réglages (modale `mnoise`, `openNoiseSettings()`)
Plancher de silence (calibration + curseur −80..−25, cf. ci-dessus) · curseurs seuil (10–100) · durée (1–10 s) · temporisation (5–60 s) + son on/off + **type (menu groupé)** + **volume (0–100)** + test. Changer le type **ou** bouger le curseur de volume **rejoue un aperçu** (`onchange="… noisePlayAlert(true)"`). « Niveau actuel » mis à jour en direct par `_noiseRenderMeters` quand la modale est ouverte. Persistance `localStorage.planClasse_noiseSettings` (`_noiseLoadSettings` au chargement du script, `_noiseSaveSettings` à chaque modif). Défauts `NOISE_DEFAULTS = { threshold:60, sustainS:3, cooldownS:15, soundOn:true, soundType:'bell', volume:70, silenceDb:-60 }`. `_noiseLoadSettings` **normalise** `soundType` : une valeur devenue invalide (son retiré depuis) retombe sur `'bell'`. `noiseSetVolume(v)` clampe 0–100 ; `noiseSetSoundType(t)` valide contre `_NOISE_SOUND_TYPES`.

### État & cycle de vie
État runtime dans `_noise` (active, starting, popup, ctx, analyser, source, stream, buf, raf, smooth, overSince, lastAlert, alerting, alertClearTimer). `_noise.starting` garde-fou contre un double-clic pendant la demande d'autorisation micro. `stopNoiseMeter()` coupe le flux (`stream.getTracks().stop()`), ferme le ctx, **ferme la popup** si ouverte, cache le widget, reset le bouton. Un `beforeunload` ferme aussi la popup (elle ne serait plus pilotée après un reload). La surveillance **ne survit pas à un reload** (getUserMedia exige un geste utilisateur) ; seuls les réglages persistent. La boucle rAF se met en pause quand la fenêtre principale est en arrière-plan/minimisée (acceptable : l'app est la fenêtre active en classe).

## ⏲ Minuteur — compte à rebours

Bouton **⏲** dans le header (à gauche du sonomètre, id `#btn-timer`, `openTimerSettings()`) — accessible sur tous les onglets. Réutilise le moteur de sonneries rétro du sonomètre (`_noiseBuildPattern`, `_NOTE_HZ`, `_NOISE_SOUND_TYPES`) **et** la synthèse vocale du navigateur. Module JS situé juste après le module sonomètre (avant les raccourcis clavier).

### État & réglages
- `TIMER_DEFAULTS = { soundOn:true, soundType:'mario', volume:80, speechOn:false, announces:[600,300,60], lastDurationS:600 }`. Persisté dans `localStorage.planClasse_timerSettings` (`_timerLoadSettings`/`_timerSaveSettings`). `_timerLoadSettings` normalise `soundType` (repli `'mario'`) et `announces` (entiers > 0, triés desc).
- `_timer` (état runtime éphémère, **ne survit pas à un reload**) : `running, paused, finished, endTime, remainingMs, totalMs, interval, finalTimer, finalCtx, previewCtx, popup, announced (Set)`.
- Le décompte est basé sur l'**horloge murale** (`endTime = Date.now() + totalMs`) via `setInterval(_timerTick, 250)` — robuste au throttling d'arrière-plan. Pause : stocke `remainingMs`, clear l'interval ; reprise : recalcule `endTime`.

### Réglages (modale `mtimer`, `openTimerSettings()`)
- **Durées prédéfinies** : 11 boutons 5→55 min (`timerSetDurationPreset(min)` ferme la modale + démarre aussitôt).
- **Durée libre** : inputs `#timer-min` / `#timer-sec` + bouton ▶ Démarrer (`timerStartFromInputs()`).
- **Annonce vocale** : checkbox `#timer-speech-on` + checkboxes des moments (`#timer-announce-opts`, valeurs en secondes 900/600/300/180/120/60/30/10, `timerToggleAnnounce(secs, on)`). Bouton « Tester la voix » (`_timerSpeak`). Avertissement si `speechSynthesis` indisponible.
- **Sonnerie de fin** : checkbox `#timer-sound-on` + `<select>` type (même catalogue groupé que le sonomètre) + ▶ Tester + volume. Le `<select>` et le volume rejouent un **aperçu court** (`_timerPlaySound`) ; ▶ Tester joue/coupe la sonnerie de fin **réelle** (`_timerTestSound`, bascule).
- Fermer les réglages (`_modalReturnTo['mtimer']`) coupe tout aperçu/test/voix en cours.

### Annonces vocales (`_timerSpeak`, `_timerAnnounceText`)
À chaque tick, pour chaque point `p` de `announces`, si `restant ≤ p` et `!announced.has(p)` → marque + `_timerSpeak('Il reste X minutes/secondes')` (si `speechOn`). Au démarrage, les points `≥ durée` sont **pré-amorcés** dans `announced` (pas de « il reste 10 min » sur un minuteur de 10 min). À la fin : `_timerSpeak('Temps écoulé')`. Voix `fr-FR`, `speechSynthesis.cancel()` avant chaque énoncé.

### Sonnerie de fin (`_timerPlayFinal`)
- **Thèmes** (`_TIMER_THEME_TYPES = ['pacman','mario','tetris']`) → **mélodie longue complétée jouée une seule fois** (`_timerBuildExtendedTheme(type, blip)`, ≈ 10 s pour mario/tetris, ≈ 4,5 s pour pacman) — distincte des couplets plus courts du sonomètre. **On ne répète pas** un fragment.
- **Sons non-thématiques** → motif court de `_noiseBuildPattern` répété pour couvrir ≈ **6 s**.
- L'`AudioContext` est mémorisé dans `_timer.finalCtx` → `_timerStopFinalSound()` le ferme pour **couper le son** (fermeture de la fenêtre via `_timerOnPopupClosed`, ✕ via `timerStop`/`_timerStopInternals`). `_timerPlayFinal` coupe une sonnerie précédente avant d'en lancer une nouvelle.
- `_timerMakeBlip(ctx, master, t0, off)` : fabrique un `blip` décalé de `off` (permet de séquencer les répétitions des sons non-thématiques).

### Surfaces d'affichage
- **Widget replié** (`#timer-widget`, bas-droite, z 986) : titre déplaçable (`_timerInitWidgetDrag`, glisser par `.tw-head`), grand chiffre `MM:SS` (ou `H:MM:SS`) **cliquable = pause/reprise** (`timerTogglePause`, pas de bouton pause dédié), barre de progression, état (« En cours » / « ⏸ En pause » / « ⏰ Terminé ! »). Boutons : 🗣 voix · 🔔 son · ⚙ réglages · 🪟 fenêtre flottante · ✕.
- **Fenêtre flottante** (`timerOpenWindow`, `_timerFillWindow`) : Picture-in-Picture prioritaire (toujours au premier plan, Chromium/Edge) ; repli `window.open` sinon ; le widget reste comme secours. Ouverte automatiquement au démarrage (geste utilisateur actif). Contrôles dans la fenêtre (`#tpw-ctrl`) : 🗣 · 🔔 · ⚙ (focus fenêtre principale + `openTimerSettings`) · ⛶ (remplir l'écran via `resizeTo`) · ✕. **Clic n'importe où dans la fenêtre (hors `#tpw-ctrl`) = pause/reprise**. L'analyse/le décompte tournent dans la fenêtre principale ; `_timerRender` pousse les mises à jour vers le document de la fenêtre à chaque tick.
- **Bascules synchronisées** sur les 3 surfaces via `_timerSyncToggleUI()` (widget, modale, popup). `soundOn`/`speechOn` sont les réglages persistés ; les boutons les togglent directement.
- Bouton header : `.timer-on` (bleu, en cours) / `.timer-alert` (rouge pulsant, terminé).

### Cycle de vie
`timerStart(totalSec)` → reset interne, calcule `endTime`, pré-amorce les annonces, affiche le widget (`body.timer-widget-on` remonte les toasts), ouvre la fenêtre flottante, lance l'interval. `timerStop()` → tout couper (interval, son, popup, voix), cacher le widget. `_timerFinish()` → stoppe l'interval, marque `finished`, voix « Temps écoulé », sonnerie de fin. Un `beforeunload` ferme la popup. Fermer **uniquement** la fenêtre flottante (`_timerOnPopupClosed`) coupe son + voix mais **laisse le décompte continuer** dans le widget.

## Projection des bilans (modale `mrendu`, mode plein écran)
La modale de rendu d'un bilan (`#mrendu`) a un bouton **📽 Projeter** (`_renduStartProject`) qui passe en plein écran grands caractères (classe `body.rendu-projecting`). Deux panneaux flottants apparaissent alors : la **barre de zoom** (`#mrendu-zoom-bar` : 🔍− / 100% / 🔍+) et le bouton **❌ Quitter la projection** (`#mrendu-exit-project`).

**Panneaux déplaçables** (`_renduMakeDraggable(el)`) : on peut les glisser n'importe où (Pointer Events + `setPointerCapture`, `touch-action:none`, `cursor:move`) pour dégager le contenu en dessous. Un **seuil de 5 px** distingue clic et glissé ; après un glissé, le flag `_renduDragMoved` neutralise le clic synthétique du bouton via le garde `_renduClickAllowed()` (présent dans chaque `onclick` : `_renduClickAllowed()&&_renduZoom(...)` / `&&_renduExitProject()`) — sinon zoomer/quitter se déclencherait en fin de glissé. Le glissé bascule le panneau de `right:…` vers `left/top` (borné au viewport). Positions conservées dans la session (styles inline sur l'élément), réinitialisées au reload. Attaché une seule fois via `el.dataset.dragInit`. Raccourcis projection (`_renduProjectEscHandler`, capture) : Échap quitte, Ctrl±/0 zoom.

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

### Indicateur de statut & reprise sur échec (`#autosync-ind`)
`_showAutoSyncStatus(msg, title?)` met à jour l'indicateur du header (texte + info-bulle `title`). Après une écriture réussie : `💾 HH:MM` (info-bulle vidée). En cas d'échec de `autoSaveDoIt` (exception sur permission / `createWritable` / `write` / `close`) : `⚠️ écriture KO` avec une **info-bulle détaillée** (`_autoSaveErrLabel(e)` traduit `e.name` en libellé lisible : verrou, fichier introuvable, autorisation à ré-accorder, disque plein…). La vraie erreur est aussi loggée (`console.warn('Auto-save échoué :', e)`).

**Reprise automatique unique** : un échec « normal » programme **une seule** nouvelle tentative ~6 s plus tard (`_autoSaveRetryTimer`, `autoSaveDoIt(true)`) — utile car ces KO sont le plus souvent transitoires (verrou Nextcloud pendant la synchro). Si la reprise échoue aussi, on n'insiste pas (la prochaine modif relancera une écriture via `autoSaveSchedule`). Toute nouvelle modif annule la reprise en attente (la prochaine écriture la couvre), une écriture réussie ou la désactivation de la sync l'annulent aussi. Les données restent de toute façon dans `localStorage` (le `save()` y écrit indépendamment, avant la sync).

## Sauvegardes / chargement
- **Export JSON manuel** : fichier horodaté dans le dossier choisi via "📂 Recharger" (File System Access API, mode `readwrite`). Fallback : téléchargement classique.
- **Recharger** : modal listant les fichiers `.json` du dossier (les autoSave + backups + exports manuels).
- **Import JSON** : fichier local quelconque, avec confirmation.

## Export tableur des notes (XLSX + ODS) — module `_NotesExport`

Sauvegarde lisible des évaluations dans un format pérenne hors-app, **un fichier par classe**, mis en forme avec couleurs. Accessible via le **menu Données → 📤 Exporter les notes**. Ouvre la modale `mexport-notes` : sélection multi-classes (chips avec compteurs élèves/évals, classe active pré-cochée, ☑ Tout / ☐ Aucune) + radio XLSX/ODS (XLSX par défaut). Génération séquentielle (espace 200 ms entre fichiers), toast récap à la fin.

**Choix du dossier de destination** : la modale propose un sélecteur `📂 Choisir un dossier…` (File System Access API — Chromium). Quand un dossier est choisi, les fichiers sont écrits directement dedans via `dirHandle.getFileHandle(..., {create:true}).createWritable()` ; sinon, fallback `downloadBlob` vers le dossier de téléchargement du navigateur. Le handle est persisté en IndexedDB sous la clé `'notes-export-dir'` via `idbSaveHandleKey` / `idbLoadHandleKey` (mêmes helpers que la sync auto et le picker QCMcam). Bouton `↻ Téléchargement` pour repasser au mode classique. Permission revalidée au moment du run (re-demande si besoin après reload).

### Architecture
Module IIFE `_NotesExport` situé juste avant `createDemo()` (~ligne 21663). 3 couches :

1. **ZIP writer "stored"** (`zipBlob(files, mimeType)`) : ~150 lignes, méthode 0 (sans compression — supportée par XLSX et ODS), CRC32 via table de lookup pré-calculée (256 entrées). Format PKZip standard avec bit 11 pour les noms de fichier UTF-8. Headers locaux + central directory + end-of-central-directory.

2. **Modèle abstrait** (`buildWorkbookForClass(classId)`) : structure format-indépendante :
   ```js
   { sheets: [{ name, rows: [[ {v, t:'s'|'n', bg, color, bold, italic, align, border, merge}, ... ]], cols: [{width}, ...] }] }
   ```
   Helpers de cellules pré-stylées : `T(v)` (titre), `H(v)` (header), `S0(v, opts)` (cellule normale), `N0(v, opts)` (numérique), `EMPTY()`. Helpers couleurs : `noteCellBg(score20)` (lit `S.evalPrefs.noteThresholds` + auto), `levelCellBg(level)` (lit `S.evalPrefs.maitriseColors`), `textOnHex(hex6)` (formule YIQ pour lisibilité).

3. **Émetteurs format-spécifiques** :
   - **`emitXLSX(wb)`** : produit `[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`, `xl/styles.xml` (fonts + fills + borders + cellXfs dédoublonnés via Map), `xl/sharedStrings.xml`, et 1 `xl/worksheets/sheet{N}.xml` par feuille. Cells numériques → `<c><v>n</v></c>`, strings → `<c t="s"><v>idx</v></c>` via SST.
   - **`emitODS(wb)`** : produit `mimetype` (en 1er fichier, non-compressé — requis ODS), `content.xml` (avec `<office:automatic-styles>` pour les ce/co styles), `styles.xml` (minimal), `META-INF/manifest.xml`. Cells = `<table:table-cell office:value-type="float|string">`, fusion via `table:number-columns-spanned` + `<table:covered-table-cell/>`.

### Contenu par classe
1. **Synthèse** : récap N° · Nom · Prénom · Groupe · Moy S1/S2 · Conseil S1/S2 · Moy annuelle · Remarques · Compétences (moy /4 toutes Type B confondues).
2. **Bilan S1 / Bilan S2 (ou T1/T2/T3)** : 1 colonne par éval (libellé court + pastille type A/B/C + date + /noteMax + ★ si facultative), notes /20 colorées par seuils, codes A/NN préservés, Moyenne /20 + Rang + Remarque bulletin + Conseil F/E/AT/AC. Footer : moyenne classe, min, max, écart-type, remarque classe, éléments travaillés.
3. **Compétences** : 1 colonne par compétence Type B évaluée, niveau moyen 1-4 coloré, moyenne ligne, moyenne par compétence en footer.
4. **Eval ‹nomCourt›** (1 par éval incluant la classe) :
   - Type A : élèves × mini-notes, total /noteMax + niveau 1-4 + Commentaires + Remarque élève.
   - Type C : idem A, mini-notes groupées par exercice (label exercice dans le header), bloc compétences inline à droite.
   - Type B : élèves × (passation × compétence), niveau coloré ou A, Note /noteMax + Niveau + Remarque.

### Helpers existants réutilisés
`_computeStudentEvalNote`, `_computeStudentEvalNoteB`, `_computeStudentMeanForPeriod`, `_computeStudentCompetenceLevel`, `_noteToLevel`, `_evalIncludesClass`, `_evalDateFor`, `_evalPrimaryAliveClassId`, `_autoNoteThresholds` (si présent). Tri élèves : `localeCompare('fr')` sur nom puis prénom (indépendant de `evalPrefs.defaultSort`).

### Validation
XLSX testé avec openpyxl + LibreOffice headless conversion PDF — aucune erreur. ODS idem. Cas limite "classe sans évaluation" produit un classeur minimal valide (Synthèse + Bilans vides + Compétences vide + aucune feuille Eval). Couleurs de fond appliquées via patternFill solid (XLSX) et table-cell-properties fo:background-color (ODS). Texte clair/foncé adapté au fond via formule YIQ.

### Dimensions typiques (6e A démo, 30 élèves, 4 évals)
- XLSX : ~140 Ko, 8 feuilles, 30 lignes × 11-17 colonnes par feuille.
- ODS : ~380 Ko (plus de verbosité XML).

### Noms de fichiers
`<nomClasse-sanitized>-notes-YYYYMMDD.<xlsx|ods>` via `safeFilename()` qui retire `[\\/:*?"<>|]` et remplace les espaces par `_`.

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

Bouton **🆕 Maj** dans le header → `checkForUpdate()` qui interroge l'API publique GitHub (`/repos/<user>/<repo>/commits/main`, sans auth, limite 60 req/h/IP) et compare la date du dernier commit avec la constante **`APP_BUILD_DATE`** (format ISO `'YYYY-MM-DDTHH:MM:SSZ'`, à incrémenter manuellement avant chaque push). La version **affichée** à l'utilisateur est un **semver** dans `APP_VERSION` (ex. `'1.0.0'`) — découplée de la détection.

Constantes en haut du `<script>` :
```js
const APP_VERSION    = '2.12.1';                // semver affiché (PATCH/MINOR/MAJOR) — exemple, valeur réelle en tête du <script>
const APP_BUILD_DATE = '2026-06-09T22:11:00Z';  // date ISO — sert UNIQUEMENT à la détection MAJ
const APP_UPDATE_TOLERANCE_MS = 10 * 60 * 1000; // marge avant de crier « MAJ dispo »
const APP_REPO_USER  = 'Belenos-Toutatis';
const APP_REPO_NAME  = 'plan-de-classe';
```

**Comparaison robuste** : la détection (`checkForUpdate`, `_passiveUpdateCheck`) fait `(Date.parse(latestCommit) - Date.parse(APP_BUILD_DATE)) > APP_UPDATE_TOLERANCE_MS` → MAJ dispo. **Numérique via `Date.parse`** (pas une comparaison de chaînes) car GitHub renvoie la date AVEC décalage (`…T07:05:39+02:00`, pas normalisée en `Z`) → une comparaison textuelle serait faussée par le fuseau. La **tolérance** (10 min) absorbe le délai entre « je fige `APP_BUILD_DATE` » et « le commit s'horodate » (sinon faux positif « MAJ dispo » sur sa propre version, cf. incident 2026-05-30 où une date de build estimée 1 h 35 trop tôt déclenchait l'alerte).

⚠️ **À bumper à chaque push** : `APP_BUILD_DATE` (toujours — la régler sur l'**heure UTC réelle** via `date -u +"%Y-%m-%dT%H:%M:%SZ"`, pas une estimation) et `APP_VERSION` quand la release le mérite. L'affichage (header chip `v X.Y.Z`, modales, `about-version-disp`) utilise `APP_VERSION`.

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

### Mode Contraintes in-situ depuis le Plan Prof (`_planCstrMode`)

Bouton **🔒 Contraintes** dans la toolbar Plan Prof (à côté de 🎲 Interroger) → `togglePlanConstraintMode()`. Permet d'éditer les contraintes **pendant la séance** sans aller dans Config Salle. Édite les mêmes modèles : `room.allowedFor[sid]` (places autorisées) et `cls.noNeighbors` (paires à séparer).

Quand actif (`_planCstrMode`), `renderTeacherGrid` route le rendu des cellules vers **`_buildConstraintCell`** (prénom + nom uniquement, sans badges/tablette/compteurs ; AESH et cases vides inertes). Le `#tg` reçoit la classe `.cstr-grid`. Mutuellement exclusif avec le mode appel (entrer dans Contraintes coupe l'appel) et bloqué en consultation snapshot. Quitter via le bouton **✓ Terminer** du bandeau, le bouton toolbar, `Échap`, un changement d'onglet (`showTab`) ou de classe (`switchClass`) — tous appellent `_planCstrExit()` (qui annule un sous-mode non validé).

**Trois états** (`_planCstrSub`) :
- **`base`** — cliquer un élève → sous-mode `allowed` · glisser un élève sur un autre → sous-mode `pairs`. Les paires existantes (élèves tous deux placés) sont reliées par des **traits SVG pointillés rouges** (surcouche `#cstr-svg` fixe plein écran, `_planCstrDrawPairs`, redessinés au scroll/resize via `_planCstrRedrawLines` en rAF). Les élèves d'une paire ont un liseré rouge (`.cstr-paired`).
- **`allowed`** (`_planCstrEnterAllowed(sid)`) — peinture clic-glisser des places autorisées de l'élève courant : vert = autorisée (`.cstr-allow`), gris = interdite (`.cstr-forbid`), liseré bleu sur sa place actuelle (`.cstr-current`). Les traits de paires sont **masqués** (gestes cloisonnés). `_planCstrApplyAllowed` + `_planCstrRepaintAllowedStates` (toggle de classes en place, pas de rebuild). Bandeau : **✗ Aucune contrainte** (`_planCstrClearAllowed`) / **↩ Annuler** (`_planCstrCancelAllowed`) / **✓ Valider** (`_planCstrValidateAllowed`).
- **`pairs`** (`_planCstrTogglePair(cls, a, b)`) — chaque glisser élève→élève crée/retire (toggle) la paire ; on enchaîne. Bandeau : **↩ Annuler** / **✓ Valider**.

**Undo propre** : pendant un sous-mode on mute `S` en direct **sans `save()` ni `pushUndo()`**. À l'entrée, un backup JSON est pris (`_planCstrAllowedBackup` / `_planCstrPairsBackup`). **Valider** = rétablir le backup → `pushUndo()` → appliquer l'état final → `save()` (1 seule entrée d'undo). **Annuler** = restaurer le backup (rien committé).

**Entrées pointer (souris + tactile + stylet) via Pointer Events** — handlers globaux `pointermove`/`pointerup`/`pointercancel` installés une fois (early-return hors mode). `.cstr-grid .cell { touch-action:none }` pour permettre le glisser au doigt sans défilement. Distinction :
- `pointerdown` sur cellule élève (base/pairs) → `_cstrPtr` ; relâché sans bouger (`!moved`) = **clic** → `allowed` ; relâché après glisser (`moved`, seuil 6px) sur un autre élève placé = **paire**. Un trait orange « pending » (`#cstr-pending`) suit le pointeur pendant le glisser, la cible reçoit `.cstr-pair-target`.
- `pointerdown` sur cellule en sous-mode `allowed` → `_cstrPaint` ('add'/'remove' selon l'état initial de la case) ; `pointermove` peint les cases survolées (`elementFromPoint`, anti-double via `_cstrPaintLast`).

⚠️ Le ressenti tactile (Surface/iPad) reste à valider sur l'appareil ; la logique (clic, glisser-paire, peinture, annulation) est vérifiée via Pointer Events synthétiques dans l'aperçu desktop.

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

### Comparaison à l'ORIGINE (pas au "précédent")
`_recordMovesFromDiff(cls, beforeSeating)` capture un snapshot d'**origine** à la 1re mutation depuis le dernier clear (`bucket.origin = beforeSeating`). À chaque appel, recalcule la liste `bucket.keys` = `{k | origin[k] !== after[k]}`. **Conséquence importante** : si l'utilisateur déplace un élève puis le RAMÈNE à sa case de départ, le surlignage de cette case disparaît automatiquement (la case est revenue à l'origine, plus un changement net). Quand toutes les cases ont retrouvé leur origine, `bucket.origin` est supprimé pour repartir d'un état neuf. Les sites d'appel sont les fonctions de placement (`dropOnCell`, `randomPlacement`/`_runRandomPlacement`, `removeSeat`, `unplaceStu`, `clearAllSeating`, `mseBulkApply`, `placeStudentAtEntry`, `snapshotRestore`, `onPosBlur`, `onPosPaste`, `resolveMinimalConflicts`).

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

## Évaluations (Types A / B / C)

Volet ouvert via les 3 onglets du groupe 2 de la nav. Le modèle vit dans `S.evaluations`, `S.competences`, `S.competenceDomains`, `S.evalPrefs`, `S.evalCommentLibrary`. Les prefs sont initialisées dans `DEFAULT_EVAL_PREFS` (haut du `<script>`) et migrées par `migrateEvalDefaults()`.

### Types d'évaluation
- **Type A** — somme de mini-notes, total proportionné à `ev.noteMax` (souvent /20). Saisie au tableur `meval-tableur` ou en fiche `meval-saisie`. Modèle : `ev.miniNotes[] = { id, label, max, name?, date?, dates? }`, `ev.notes[sid] = { values: { [mnId]: number | 'NN' | 'A' | null }, comments?, excluded?, dateIndiv?, remarque? }`.
- **Type B** — suivi de compétences par passations. Modèle : `ev.passations[] = { id, code, date|dates, competenceIds[], niveaux: { [sid]: { [cid]: niveau|0|'A' } } }`. Pas de mini-notes ; le bilan agrège les niveaux via `S.evalPrefs.meanRule` (override possible par éval via `ev.meanRule`). Voir aussi *Calcul Note /20 (Type B)* ci-dessous.

### Calcul Note /20 (Type B)
Helper `_computeStudentEvalNoteB(ev, sid)`. Trois modes de pondération via `ev.weighting` :
- **`equal`** (« Compétences pondérées ») — pour CHAQUE saisie `(passation × compétence)` valide, conversion `niveau → points` via `S.evalPrefs.maitrisePoints` (`[5,8,15,20]` par défaut), puis moyenne arithmétique des points sur toutes les entrées. Une compétence vue 3 fois pèse 3×. `coef` est identique avec pondération par `p.coef`.
- **`perCompetence`** (« Compétences à égalité ») — pour CHAQUE compétence : convertit chaque saisie en points, applique la règle de moyenne (`ev.meanRule` ou `S.evalPrefs.meanRule` : `arithmetic`/`last`/`best`/`weightedRecency`) sur les **POINTS** (pas les niveaux), puis moyenne arithmétique des compétences. Toutes les compétences pèsent autant, peu importe le nombre de saisies.
  - Convertir au niveau de l'entrée préserve la non-linéarité de la grille. Exemple : C3 saisie deux fois N1 puis N2 → avec grille `[5,8,15,20]`, la valeur compétence est `(5+8)/2 = 6,5` pts ≠ `niveauToPts(avg(1,2)) = niveauToPts(1,5) = 6,5` (coïncidence ici par linéarité 5→8) mais avec N1+N4 → `(5+20)/2 = 12,5` ≠ `niveauToPts(2,5) = 11,5`.

Une infobulle au survol de la cellule **Note /20** dans le tableur explique le calcul ligne à ligne (helper `_evalNoteTipB`).

`_computeStudentCompetenceLevel(ev, sid, cid)` reste sur les NIVEAUX (pour l'affichage du niveau atteint, ex. bilan compétences) — c'est uniquement le calcul de la note /20 qui a basculé sur la conversion à l'entrée.
- **Type C** — sommative avec exercices + questions. Comme Type A mais les `miniNotes` sont regroupées par `exerciceId`. `ev.exercices[] = { id, label, name? }`. Le bilan compétences inline (colonnes à droite du tableur) calcule automatiquement le niveau atteint sur chaque compétence évaluée.
- **Type D (à venir)** — sommative par compétence sans questions intermédiaires.

### Multi-classes
`ev.classIds[]` (liste) prime sur `ev.classId` (legacy). Dates et créneaux peuvent être par classe : `ev.dates[classId]`, `ev.slotIds[classId]` (de même `mn.dates[classId]`, `pass.dates[classId]`). Helpers :
- `_evalClassIds(ev)` — renvoie toujours un tableau, fallback `[ev.classId]`
- `_evalIncludesClass(ev, classId)` — appartenance
- **`_evalPrimaryAliveClassId(ev)`** — 1re classe encore présente dans `S.classes`. À utiliser à la place de `S.classes?.[ev.classId]` direct (évite undefined si la classe primaire a été supprimée)
- `_evalTableurActiveCls(ev)` — résout la classe affichée dans le tableur

### Undo pendant la saisie (commit f3e1371)
Saisir une note ne fait PAS `pushUndo()` à chaque frappe (la pile saturerait). À la place, utiliser **`_evalArmUndo()`** : capture un snapshot une seule fois par salve, puis libère le verrou 2 s après la dernière mutation → 1 entrée d'undo par salve de frappe. `_evalFlushUndo()` force la fermeture d'une salve (appelé par `undoLast`/`redoLast`).

**Convention** :
- Saisie continue de note/niveau/code/date inline → `_evalArmUndo()`
- Mutation ponctuelle (suppression mn, ajout passation, toggle classe…) → `pushUndo()` direct

Cf. les ~15 callsites dans `_evalTableurUpdate`, `_evalSaisieUpdateNote`, `_evalTableurBUpdate`, `_evalPassSaisieSetLevel`, `_tableurEditMn`, `_evalTableurEditPass`, `_evalEditUpdateMiniNote/UpdateExo`, `_evalSetStudentRemark`, `_evalSaisieToggleExcluded/SaveAmen`, `_evalEditPerClass`.

### Prefs : couleurs niveaux et seuils note (commit c8e2139)
`S.evalPrefs.maitriseColors[]` (palette N1..Nn) et `S.evalPrefs.noteThresholds[]` (couleurs de fond pour la colonne Total) ont chacun un **toggle "Mode auto"** dans Réglages :
- `maitriseColorsAuto` → palette `_defaultColorsForNb(nb)` regénérée à chaque save (suit `nbLevels`)
- `noteThresholdsAuto` → seuils = midpoints entre `maitrisePoints`, couleurs = palette niveau

Helper `_autoNoteThresholds(prefs)` renvoie le tableau dérivé. En mode auto, les pickers UI sont désactivés et un encart `↳` explique la dérivation.

### Contraste texte / fond
Helper **`_contrastTextColor(bg)`** (formule YIQ, threshold 150) renvoie `'var(--ink-deep)'` ou `'#fff'` selon la luminance. À utiliser dès qu'on pose un fond coloré (cellules tableur, badges, chips, total) pour rester lisible quel que soit la palette.

### Sécurité (commit 8c881de)
- `_validateImport` couvre désormais les sections `evaluations`, `competences`, `competenceDomains`, `evalCommentLibrary` + rejette explicitement `__proto__`, `constructor`, `prototype` (évite prototype pollution via JSON.parse).
- `autoReloadCheck` passe le JSON rechargé depuis disque par `_validateImport` avant d'écraser `S` (cohérent avec l'import manuel).
- `_deleteStudentInternal` nettoie `ev.notes[id]`, `ev.studentRemarks[id]` et `pass.niveaux[id]` dans toutes les évals → plus de saisies orphelines.

### Fiabilité saisie
- `migrateEvalDefaults` scrub chaque `ev` : type ∈ {A,B,C}, `miniNotes`/`passations`/`exercices` array, `notes` objet (évite crash 1er render sur JSON corrompu).
- `beforeunload` flush les timers debouncés d'éval (`_evalTableurSaveTimer`, `_evalSaisieSaveTimer`, `_evalRemarkSaveTimer`, `_evalEditPerClassSaveTimer`, `_evalTableurPassEditTimer`) avant `save()`.
- `autoReloadCheck` flush ces mêmes timers si `_evalTableurDirty || _evalSaisieDirty` AVANT de mesurer le pendingWarn.

### A11y modales (commit 8c881de)
`openMod` installe automatiquement `role="dialog"`, `aria-modal="true"` et un focus trap (Tab/Shift+Tab boucle sur les éléments focusables visibles de la modale). `closeMod`/`closeMod2` démontent le trap. Les inputs de saisie (tableur Type A/C/B), badges 💬, boutons icônes de la toolbar tableur ont un `aria-label` explicite.

### Hors barème (commit f3e1371)
Plus de `confirm()` bloquant : une note hors `[0, max]` est conservée d'office avec fond rose persistant + toast non-bloquant. Ctrl+Z l'annule grâce au système d'undo armé. `_evalTableurConfirmIfOutOfRange` est désormais un no-op (gardé pour compat HTML rendu).

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
7. `_tableurPassMenuSavePerGroup` — modale clic droit sur en-tête passation (`meval-pass-menu`)

Aussi déclenché lors de l'**import CSV QCMcam** quand la date OU le créneau détectés sont appliqués (cf. section *Import CSV QCMcam*).

Quand `filled > 0`, le tableur est re-rendu via `_evalTableurRender()` pour faire apparaître les A immédiatement.

### Clic sur le nom dans les bilans → historique élève

Dans le **Bilan des notes** et le **Bilan des compétences**, la cellule du nom (1re colonne sticky) est cliquable et appelle `openHist(sid)` — la même modale 🕓 que le bouton historique dans l'onglet Élèves. Évite d'avoir à naviguer vers Élèves pour consulter incidents/notes/absences d'un élève. Curseur pointer + tooltip explicatif.

### Mini-calculatrice dans les cellules (Type A / C, tableur)

L'enseignant peut taper une expression arithmétique dans une cellule de note (`1+2+4`, `0,5*3`, `(8+7)/2`, `=5+3`…) ; au commit (blur, déclenché aussi par Tab/Enter via `_evalTableurKey` qui appelle `focus()` sur la cellule suivante), l'expression est évaluée et la cellule affiche le résultat formaté FR (virgule décimale, arrondi 2 décimales, zéros de queue retirés via `_fmtNote`).

- **`_evalArithExpr(s)`** — parser récursif descendant, **jamais `eval` / `Function`**. Liste blanche stricte : chiffres, point décimal, `+ - * /`, parenthèses uniquement. Supporte signes unaires, virgule ou point décimal, et un `=` initial style tableur. Retourne `null` si la chaîne ne contient pas d'opérateur (laisse alors `parseFloat` habituel agir) OU si le parsing échoue (division par 0 → null, parenthèses déséquilibrées → null, double point dans un nombre → null, etc.).
- **`_hasArithOperator(raw)`** — détecte la présence d'un opérateur AU-DELÀ d'un signe initial (sinon `-5` ou `+5` seraient pris pour des expressions).
- **`_evalTableurMaybeApplyExpr(inputEl)`** — appelé en tête de `_evalTableurConfirmIfOutOfRange` (le handler onblur). Si l'input contient un opérateur ET que l'évaluation réussit → remplace `inputEl.value` par `_fmtNote(v)` puis rejoue `_evalTableurUpdate(inputEl)` pour persister la valeur, recolorer la cellule, et rafraîchir total + Σ exo + brut + compétences inline + footer stats. Si l'expression est mal formée (`1++2-`, `(1+2`…) → toast non bloquant `⚠ Expression invalide` sans rien écraser, le prof voit sa saisie et corrige.

Limité au tableur (Type A / C). La fiche par élève (Type A) n'a pas d'onblur dédié donc reste inchangée — scope volontairement restreint.

### Auto-scroll quand la cellule focusée passe sous le thead/tfoot sticky

Le tableur d'éval a un `<thead>` sticky-top et `<tfoot>` sticky-bottom dans le conteneur de scroll `#meval-tableur-wrap`. Naïvement, le focus sur une cellule en bord de viewport (au ras du haut ou du bas) laisse la cellule **cachée derrière** la zone figée : le curseur clignote dans le vide. Le `.focus()` du navigateur considère l'élément « in viewport » même s'il est couvert.

- **`_evalTableurEnsureInputVisible(inputEl)`** — mesure `theadH` et `tfootH` (sticky), mesure la largeur de la colonne « Élève » sticky-left de la même ligne, calcule `wrapRect` et `inpRect`, puis ajuste `wrap.scrollTop` / `wrap.scrollLeft` si la cellule est masquée. Padding de 4px pour ne pas coller pile contre la zone sticky. Limité aux inputs/selects/textareas situés dans `tbody` ou `tfoot` du tableur — les contrôles du thead (date, code, max…) sont exclus pour ne pas scroller à tort quand on modifie l'en-tête.
- **Listener `focusin` délégué** : posé une seule fois sur `#meval-tableur-wrap` via une IIFE auto-installante (`wrap.dataset.scrollFixInstalled`). Le wrap statique survit aux re-render du tableur (seul l'innerHTML est remplacé), donc le listener persiste. Couvre clic, Tab/Enter (via `target.focus()` → `focusin`), et tout focus programmatique.

### Commentaires d'éval — fermeture auto sur ajout + refresh modales sur undo/redo

- **Auto-close** : `_evalCommentsAddFreeText` (Enter ou « + Ajouter ») et `_evalCommentsAddFromLib` (chip de la bibliothèque) appellent `closeMod2('meval-comments')` en fin d'exécution → un commentaire = une action terminée, retour direct au tableur. Le hook `_modalReturnTo['meval-comments']` (cf. `_evalCommentsOpen`) re-render le tableur pour rafraîchir le badge 💬 sur la cellule. Pour ajouter plusieurs commentaires, le prof rouvre la modale. `_evalCommentsRemove` (✕ sur un commentaire existant) reste sans fermeture — pour pouvoir nettoyer plusieurs entrées à la suite.
- **Refresh undo/redo** : `_refreshOpenEvalModals()` appelé en fin d'`undoLast` et `redoLast`. Si `meval-tableur` ou `meval-qcmcam` sont ouverts, appelle `_evalTableurRender()` / `_evalQcmcamRenderPreview()` pour mettre à jour le badge 💬 / les notes / les stats / l'aperçu d'import affichés au-dessus. Sans ça, Ctrl+Z annulait bien en mémoire mais le DOM des modales restait figé jusqu'à la prochaine navigation.

### Import CSV QCMcam (Type A / C, tableur)

Bouton **📂** dans la toolbar du tableur (à côté du 📥 « coller des notes »), visible uniquement pour Type A et C. Ouvre la modale `meval-qcmcam` qui importe un fichier `resultats.csv` exporté depuis qcmcam.net (« Exporter liste élèves.csv »).

**Format CSV attendu** : TSV (séparateur tabulation), guillemets droits optionnels, CRLF. Header `id / Nom / Q1..Qn / Score`. Ligne « Bonne réponse » (id vide) après le header. Une ligne par élève ensuite.

**Détection du score** : dernière cellule numérique non vide après la colonne Nom — le score peut être padé loin à droite quand toutes les questions n'ont pas été soumises.

**Détection absent** : si toutes les colonnes Q* de l'élève sont vides → `score = 'A'` (exclu du total, comme la saisie manuelle) au lieu de `0`.

**Détection du barème** (`_qcmcamExtractRows`) : prio (1) max de réponses non vides par élève (= ce que la classe a réellement vu) > (2) nb de « Bonne réponse » renseignées > (3) `qIdx.length`. Le prof peut avoir oublié de saisir les bonnes réponses dans qcmcam, donc on ne s'y fie pas en priorité.

**3 modes proposés** (radio dans l'aperçu, seulement si barème détecté ≠ `mn.max`) :
- `update` — modifie `mn.max` de la mini-note sélectionnée
- `create` — crée une nouvelle mini-note avec le bon barème (label suffixé `bis`/`ter`/…, copie `exerciceId` + `competenceIds`, insertion juste après l'originale). **Utile si la mini-note a déjà été utilisée pour d'autres classes** — on garde l'historique intact.
- `keep` — laisse `mn.max` inchangé, clampe les scores hors limite

**Date** : motif `AAAA-MM-JJ` cherché dans le nom du fichier via `_qcmcamExtractDate`. Si trouvée, checkbox « 📅 Appliquer à la mini-note » (cochée par défaut sauf si identique). Toujours appliquée à la nouvelle mini-note en mode `create`.

**Créneau** (`_qcmcamExtractSlot`) : scanne la queue du nom de fichier APRÈS la date détectée (avant l'extension) et tente de matcher un id de créneau du planning de la salle active de la classe pour le jour de la date. Ex. `resultats_2026-05-26_M2.csv` → détecte le créneau `M2`. Match insensible à la casse, borné par caractères non-alphanumériques (séparateurs `-`, `_`, espaces…). Slots triés par longueur décroissante pour ne pas matcher `M1` avant `M10`. Affiché dans l'aperçu en bloc 🕒 avec checkbox « Appliquer à la mini-note » (cochée par défaut sauf si identique au créneau actuel). Appliqué à `mn.slotIds[cls.id]` au save, comme la date. Quand date OU créneau sont appliqués, déclenche `_evalAutoFillAbsentsForMn` (cf. section *Auto-fill « A »*).

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

### Bug fix : commentaires d'éval stockés comme string

Bug historique du seed démo : `ev.notes[sid].comments[mnId] = 'foo'` (string) au lieu de `['foo']` (tableau). Conséquence : `nbCom = comments.length` retournait le nombre de caractères (ex. `💬 35`), et `_evalCommentsGetList().list.forEach(...)` plantait à l'ouverture de la modale → clics sur le badge sans effet.

Corrigé sur 3 plans :
1. Démo : `_seedDemoEvaluations` stocke maintenant `['foo']`
2. Migration : `migrateEvalDefaults()` parcourt `S.evaluations[*].notes[*].comments` et ré-emballe les strings en tableaux à chaque chargement (idempotent)
3. Garde-fou dans `_evalCommentsGetList` (compat live)

### Modèle de dates 100 % per-classe

Plus de date globale sur l'éval. Toutes les dates et créneaux passent par des maps per-classe :
- `ev.dates[cid]` — date pour cette classe (au lieu de `ev.date`)
- `ev.slotIds[cid]` — créneau pour cette classe (au lieu de `ev.slotId`)
- `ev.datesManual[cid]` — `true` si la classe est en mode manuel (saisie utilisateur figée) ; sinon mode auto (date recalculée depuis la dernière mn/passation)

**Helpers** :
- `_evalNormalizeDates(ev)` — canonicaliseur : propage les legacy `ev.date` / `ev.dateManual` vers les maps per-classe, nettoie les entrées orphelines (classes plus dans `classIds`). Appelé dans `postLoadHook`, `_evalEditToggleClass`, `_evalEditSave`, `_evalNewSave`.
- `_evalAutoUpdateDate(ev)` — itère sur les classes, skip celles `datesManual`, écrit `ev.dates[cid] = max(sous-dates per-classe)`. Pour Type A : `mn.dates[cid] || mn.date`. Pour Type B : idem passations.
- `_evalDateFor(ev, classId, group?)` / `_evalSlotIdFor(ev, classId)` — cascade per-groupe → per-classe → fallback sub-dates (mn/passations) → ancien `ev.date`.

**UI Réglages** : champ « Date » global toujours masqué (`_evalEditAdjustGlobalDateVisibility` est un masque inconditionnel). Dans la section « Classes concernées », chaque classe cochée affiche son input date + bouton **↻ Auto** (si manuel) ou hint **(auto)** (si auto). Éditer le champ bascule en manuel ; cliquer Auto efface le flag et recalcule.

### Granularité par mn et par passation

Chaque mini-note (Type A/C) peut porter en plus de sa date :
- `mn.slotIds[cid]` — créneau per-classe (rendu dans l'en-tête tableur à côté de la date, options régénérées selon planning de la salle / jour de la semaine)
- `mn.datesByGroup[cid][g]` / `mn.slotIdsByGroup[cid][g]` — overrides per-groupe (G1/G2/G3) au sein d'une classe. Édité via la modale clic droit (`meval-mn-menu`) avec checkbox « Distinguer par groupe ». Pictogramme 👥 sur l'en-tête de colonne quand des données per-groupe existent.

Chaque passation (Type B) — idem : `pass.datesByGroup[cid][g]`, `pass.slotIdsByGroup[cid][g]`. Édité via le clic droit `meval-pass-menu` (nouveau bouton ✓ Enregistrer en bas + section Distinguer par groupe). En-tête de colonne : date + select créneau côte à côte (au lieu d'un libellé statique).

### Date vide explicite sur une mini-note / passation (éval multi-classes)

La date d'une mini-note (Type A) ou d'une passation (Type B) **peut rester vide** pour les classes qui ne l'ont pas faite — sans aucun impact ailleurs : le rattachement à la **période** vient de `ev.periode` (pas de la date), et la **moyenne / les bilans** se calculent sur les notes + la période, jamais sur ces dates. La date ne sert qu'à l'affichage, au filtre « élève présent » (arrivées/départs — fallback sur date d'éval puis aujourd'hui), et au déclenchement de l'auto-remplissage des absents (qui ne se produit qu'en **posant** une vraie date+créneau).

**Sentinelle de vidage (multi-classes)** : `_mnDateFor` / `_passDateFor` lisent désormais `dates[classId]` **par présence de clé** (`hasOwnProperty`), pas par truthy. Vider la date d'une classe sur une éval **multi-classes** stocke une **sentinelle `''`** (`dates[cid] = ''`) au lieu de `delete` → la colonne reste vide pour cette classe **sans retomber** sur la date « globale » `mn.date`/`pass.date` (= max des autres classes). Sur une éval **mono-classe**, on `delete` toujours (comportement legacy inchangé). La sentinelle `''` est filtrée par `Object.values(...).filter(Boolean)` partout (recalcul de `mn.date`/`pass.date`, `_evalAutoUpdateDate`, `_evalRefDatesForClass`) → aucun effet de bord. Sites de vidage gérés : tableur inline (`_tableurEditMn` champ date, `_evalTableurEditPass` champ date) + clic droit (`_tableurMnMenuSave`). ⚠️ Les dates **déjà vidées avant cette version** (clé supprimée) gardent le fallback legacy → il faut les re-vider une fois pour poser la sentinelle. (Type C exclu : date sommative unique par classe, pas de colonne date par question.)

### Tableur Type A/C — frontière exo + saisie en temps réel

- **Frontière entre exercices** (Type C) : la 1re colonne de chaque nouvel exo (header + cellule de saisie + footer stats) reçoit un `border-left:2px solid var(--ink-blue-soft)`. Set d'indices via `exoBoundarySet` calculé à partir de `exoGroups.colStart`.
- **Type C en-tête vertical** : code / barème / pastille compétence empilés sur 3 lignes (au lieu de code + max côte à côte) → colonnes peuvent rester serrées à 70px.
- **Saisie en temps réel** : `_evalTableurUpdate` met à jour la couleur de fond de la cellule + la couleur du texte à chaque frappe (plus besoin de refresh). Helpers `_evalTableurRefreshFooterStats`, `_evalTableurRefreshRowDerived`, `_evalTableurRefreshFooterStatsB` recalculent toutes les stats footer + colonnes dérivées (Σ exo, brut, comps inline) en place sans toucher au focus.
- **Confirmation hors barème** : `_evalTableurConfirmIfOutOfRange` (au blur) → confirm() bloquant si la note finale est hors `[0, mn.max]`. Refus = restaure la valeur d'avant focus (capturée dans `dataset.prevValue` à l'`onfocus`).
- **Code/barème serrés** Type A : `maxlength="5"` sur le code, `max=99` + largeur réduite (54px / 40px) pour le barème. Type C garde les dimensions historiques (60px / 40px, max=100).

### Affectation de compétences en lot (Type C)

Modale `meval-pick-comp` enrichie d'une section « 📋 Aussi appliquer à » qui liste les autres questions de l'éval, groupées par exercice, avec checkbox + boutons « Tout cocher / Tout décocher ». À l'apply, les compétences cochées sont écrites sur toutes les questions cibles d'un coup. Le picker accepte désormais un index unique (rétro-compat) OU un tableau. Bouton **🎯 Compétences…** ajouté dans la modale contextuelle d'une mini-note du tableur (clic droit).

### Création / duplication d'évaluation — panneau unique

Plus de modale Réglages intermédiaire. La modale `meval-new` (création + duplication) contient désormais toutes les sections :
1. **Type** (radio A/B/C, verrouillé en duplication)
2. **Informations** (nom court · nom long · descriptif · période · note max · coef · granulométrie)
3. **Classes concernées** : chips compacts en haut (clic = toggle), lignes per-classe en dessous **uniquement pour les classes cochées** (input date + select créneau). État local `_evalNewState = { dates, slotIds }`.
4. **Options avancées** : countsForMean, facultative + 3 modes, weighting (Type B), meanRule (Type B/C — caché Type A)

À ✓ Créer → bascule directement sur le tableur (ouvre Structure si la mini-note/passation initiale manque, puis revient au tableur via `_modalReturnTo['meval-structure']`). Le bouton ⚙ dans la toolbar du tableur permet d'ajuster les options avancées plus tard.

### Bilan des notes — toolbar et colonnes

- **Tri des devoirs** : sélecteur avec 4 modes (Date · Nom · Type+date · Type+nom), boutons d'inversion indépendants (Type A→C / C→A en modes groupés). Persistance via `localStorage.planClasse_bilanSortMode` + `planClasse_bilanSortReverse` + `planClasse_bilanSortReverseType` (clés dédiées, indépendantes de la liste Devoirs). Défaut : Date asc (chronologique, oldest gauche). Toolbar dans le header `.sh` à côté du titre (placeholder `#bilan-sort-toolbar` peuplé par `renderBilanTab`).
- **Toggle « Grouper par période »** : visible uniquement quand le sélecteur de période est sur **Toutes** ET qu'il existe ≥ 2 périodes. Quand actif (défaut), les évaluations sont d'abord triées par ordre canonique des périodes (S1 puis S2, ou T1/T2/T3) avant d'appliquer le tri sélectionné, et un trait vertical `border-left: 3px solid var(--ink-blue-soft)` est posé sur la 1ʳᵉ colonne de chaque nouveau bloc période (header, cellule data, footer stats). Persistance `localStorage.planClasse_bilanGroupByPeriod` ('1'/'0').
- **Tooltip cellule note** : enrichi de la **remarque saisie au devoir pour l'élève** quand elle existe (lue dans `ev.studentRemarks[sid]` avec fallback `ev.notes[sid].remarque`), sur une seconde ligne préfixée 📝.
- **Pastille type** (`A`/`B`/`C`) dans chaque en-tête de colonne d'éval (classe `eval-type-badge`).
- **Clic gauche** sur l'en-tête de colonne ouvre la saisie en mode tableur (au lieu d'un clic droit). Tooltip de survol : type + nom + nom long + date + /noteMax + mention facultative + descriptif. Aucune mention « clic droit pour ouvrir ».
- **Tri des évaluations** : date croissante (plus anciennes à gauche), tri secondaire par nom court en cas d'égalité, évals sans date en fin de tableau.
- **Évaluations facultatives** :
  - Badge **★** (étoile orange) dans l'en-tête de colonne, tooltip explicite le mode (improveOnly / bonus / over10).
  - **Cellules non comptées** pour un élève : `opacity:.55` + hachures renforcées (alpha .42, pas 10px) superposées à la couleur de barème. Lisible même sur fond foncé (vert, rouge soutenu). Tooltip : `★ Facultative — NON comptée pour cet élève (mode : X)`. Calcul via `_computeStudentFacultativeCounted(classId, sid, periode)` qui miroie la logique de moyenne pour tracker les facultatives effectivement comptées.
- **Séparateur vertical entre colonnes d'éval** : classe CSS `.bilan-evalcell` (border-right `1px solid var(--rule-line-soft)`) appliquée aux cellules d'éval des deux bilans (Notes + Compétences). Aide à distinguer les valeurs quand un élève a la même note/niveau sur plusieurs colonnes consécutives. Discret par construction (couleur Seyès du design system).
- **Colonne 🎓 Conseil** (par période) à droite de Remarque : 4 boutons-pastilles `F` (vert) · `E` (bleu) · `AT` (orange) · `AC` (rouge). F et E mutuellement exclusifs. AT et AC cumulables entre eux et avec F/E. Storage `S.conseilClasse[classId][sid][periode] = { F, E, AT, AC }`. Footer du tableau : totaux par période sous forme de pastilles. `_toggleConseilClasse` préserve la position de scroll de `.bilan-table-scroll` lors du re-render.
- **Préservation du scroll au save de remarque élève** : `_bilanStuRemSave` (modale `mbilan-stuRem`, ouverte via clic sur une note dans le tableau) capture `scrollTop`/`scrollLeft` de `.bilan-table-scroll` avant le re-render et les restaure après — sinon le tableau saute en haut à chaque validation, pénible sur une grande classe quand on annote en bas. Même pattern que `_toggleConseilClasse`.

### Export Copier / CSV — modale de sélection des colonnes (`mbilan-export`)

Les boutons **📋 Copier tout** et **💾 CSV** du Bilan des notes ouvrent désormais une modale intermédiaire qui liste **toutes les colonnes du tableau affiché** (en-têtes scrapés depuis le DOM) avec checkbox. L'utilisateur coche/décoche, puis confirme → export filtré dans l'ordre du tableau.

- État : `_bilanExportState = { mode: 'copy'|'csv', data, checked: boolean[] }`. Reset à chaque ouverture (toutes cochées par défaut).
- Source de vérité = `_bilanScrapeTableForExport()` : scrape head/body/foot du `#bilan-tbl` rendu, gère les textareas (remarques → `.value`), les pastilles Conseil (extrait F/E/AT/AC actifs séparés par `+`), les en-têtes d'éval (libellé + `(×coef)` depuis l'input numéro). Garantit que l'export reflète EXACTEMENT ce que l'utilisateur voit (tri, groupement par période, colonnes masquées, orphelines incluses ou non).
- `_bilanCopyAll()` / `_bilanDownloadCsv()` sont devenus des wrappers vers `_bilanOpenExport('copy'|'csv')`.
- Confirmation (`_bilanExportConfirm`) construit les lignes filtrées et copie au clipboard ou télécharge `bilan-<classe>-<période>.csv`.
- Toast d'avertissement si 0 colonne cochée.

### Comparer classes — modale `mbilan-crosstab`

Accessible depuis le bouton **🔀 Comparer classes** de la toolbar du Bilan des notes. Désactivé si moins de 2 classes ont des notes pour la période courante.

État local `_bilanXState = { periode, selectedEvalId }`. `selectedEvalId === null` → mode « Moyenne période ».

- **Période** : sélecteur S1/S2 (ou T1/T2/T3) + « Toutes ». Initialisé sur la période active du bilan. Changer la période re-render la rangée de pastilles ; si l'éval sélectionnée n'appartient plus à la nouvelle période, retombe automatiquement sur Moyenne.
- **Pastilles devoirs** : une chip par éval comptée éligible (`_bilanCollectEligibleEvals(periode)`, toutes classes confondues, triées date asc puis nomCourt), label `[type] nomCourt` en mono. **Pastille finale `📊 Moyenne`** (séparateur visuel avant) sélectionne le mode moyenne période pondérée. Sélection unique (radio-style).
- **Classes lignes** automatiques selon la pastille active :
  - Mode Moyenne → toutes les classes ayant ≥ 1 éval comptée pour la période.
  - Devoir précis → classes vivantes incluses dans l'éval (`_evalClassIds`).
- **Tableau croisé** : ligne `Classe` + 3 colonnes `👧 Filles · 👦 Garçons · Total`. Cellule = `moy (n) · σ · méd` (helper `_evalCrossTabCellHTML` partagé avec le tableau croisé per-éval). Ligne footer **Toutes classes** = pool unique (pas moyenne des moyennes).
  - Mode Moyenne : note utilisée = `_computeStudentMeanForPeriod(classId, sid, periode)` (coef + facultatives `improveOnly`/`bonus`/`over10`, évals diagnostiques exclues).
  - Devoir précis : note utilisée = `_computeStudentEvalNote(ev, sid)` ramenée /20 via `(raw / (ev.noteMax || 20)) * 20`.
- **📋 Copier** → `_bilanCrossTabCopy()` : TSV 13 colonnes (Classe + 3 stats × 4 valeurs : moy / n / σ / méd).

État UI seulement — aucune mutation `S`, donc pas de `pushUndo`. Le sélecteur de classes (initialement prévu) a été retiré : les classes lignes sont déjà la dimension principale du tableau, choisir lesquelles afficher n'apportait rien.

### Tableau croisé per-éval — médiane

Le tableau croisé `meval-crosstab` (accessible depuis le bouton 🔀 d'une éval multi-classes — liste Devoirs, tableur, modale Bilan compétences) affiche désormais la médiane dans chaque cellule (`moy (n) · σ · méd`). La copie TSV inclut les colonnes correspondantes (`F méd`, `M méd`, `Total méd`).

### Boutons par devoir (liste Devoirs)

Dans la liste `#evals-list-wrap`, chaque ligne `.bsg-row` propose : `⚙ Réglages · 📋 Dupliquer · 📊 Bilan compétences? · 🔀 Comparer classes? · 💾 Export ENT · ✕ Supprimer`.

- **📊** visible si `_evalListEvaluatedCompetences(ev, 'code').length > 0` (l'éval évalue ≥ 1 compétence). Wrapper `_evalOpenBilanCompsForEval(evalId)` qui force `meval-tableur-evalid` puis appelle `_evalOpenBilanComps()`.
- **🔀** visible si `_evalClassIds(ev)` ∩ classes vivantes ≥ 2. Wrapper `_evalOpenCrossTabForEval(evalId)` symétrique.

Le sélecteur de classe (`#meval-bilan-class`) est intégré au header de la modale `meval-bilan-comps` : peuplé par `_evalOpenBilanComps()` avec les classes vivantes de l'éval, défaut `S.cur` si l'éval la couvre, sinon `_evalPrimaryAliveClassId(ev)`. Caché si éval mono-classe. `_evalTableurActiveCls(ev)` consulte ce select en priorité quand `meval-bilan-comps` est ouverte — ainsi la modale fonctionne même ouverte directement depuis la liste Devoirs sans passer par le tableur.

### Bilan des compétences — toolbar

- Sélecteur d'affichage : `🧩 Codes compétences` (défaut) / `🏛 Domaines du socle`. En mode domaine, 1 colonne par domaine, niveau = moyenne arithmétique des compétences évaluées du domaine. Tooltip détaillé.
- Toggle `🎯 Arrondir aux entiers` : affiche `Math.round(niveau)` au lieu de la décimale. Pris en compte par `📋 Copier`, `💾 CSV` et `📤 Export ENT`. Préférence persistée.
- En-tête de la colonne Moyenne : unité visuelle `/4` ajoutée pour éviter la confusion avec une note /20.

### Onglets Évaluation — mode d'emploi pliable

Les 3 onglets du volet Évaluation (Devoirs, Bilan des notes, Bilan des compétences) ont chacun un paragraphe descriptif en haut. Boutons :
- **✕** en haut à droite du paragraphe pour le masquer.
- **?** à gauche de Période (initialement caché) qui réapparaît quand le paragraphe est masqué, pour le ré-afficher.

État persisté par onglet : `planClasse_evhelp_notes`, `planClasse_evhelp_bilan`, `planClasse_evhelp_comp`. Restauration via `_evhelpApply(key)` appelé en début de chaque renderer.

### Liste des Devoirs — tri configurable

Barre de tri au-dessus de la liste, 4 modes :
- 📅 Date (plus récent en premier, défaut)
- 🔤 Nom (A→Z, tri naturel français)
- 📂 Type, puis date
- 📂 Type, puis nom

Bouton « ↓ ordre normal / ↑ inversé » pour basculer dans chaque mode. Persistance via `localStorage.planClasse_evalListSort` + `planClasse_evalListReverse`. En modes regroupés, un en-tête mono / dashed marque les blocs TYPE A / TYPE B / TYPE C.

**Sens du type indépendant du tri secondaire** (modes groupés uniquement) : un 2e bouton **`Type : A→C / C→A`** apparaît à côté du bouton d'inversion secondaire (`Date : ↓/↑` ou `Nom : ↓/↑`). Permet d'avoir par exemple Type C → B → A en haut, et au sein de chaque type un tri par date croissante. Persistance via `localStorage.planClasse_evalListReverseType`. Le comparateur applique `rt = reverseType ? -1 : 1` au résultat du compare des types, et `rs = reverse ? -1 : 1` au compare secondaire ; les deux sont composés indépendamment dans la même closure.

**Toolbar de tri** intégrée au header `.sh` à côté du titre via le placeholder `#eval-sort-toolbar` (peuplé par `renderEvalNotes`, vidé en début de render).

**Cycle 3 états du groupement par période** (Devoirs, mode Toutes, ≥ 2 périodes) — bouton avec libellés explicites qui cycle au clic :
- `S1 → S2` (asc — défaut) — ordre canonique
- `S2 → S1` (desc) — ordre inverse
- `⊘ Non groupé` (off)

Pour le mode trimestre : `T1 → T2 → T3` et `T3 → T2 → T1` (concat de toutes les périodes). Persistance via `localStorage.planClasse_evalListPeriodGroup` (`'asc' | 'desc' | 'off'`), avec fallback de migration depuis l'ancienne clé booléenne `planClasse_evalListGroupByPeriod`. En modes regroupés par type, l'en-tête de type est ré-imbriqué sous chaque période.

**Bilan des notes — toggle 2 états seulement** : `S1 → S2` ↔ `⊘ Non groupé`. Pas de mode inversé car les colonnes se lisent toujours dans le sens naturel (oldest gauche). Stocké dans `planClasse_bilanPeriodGroup` (`'asc' | 'off'`, avec migration ancienne valeur `'desc'` → traitée comme `'asc'`).

**Labels concis** : tous les boutons d'inversion utilisent uniquement la flèche `↑` / `↓` (sans « inversé » / « normal ») ; le bouton type type utilise `A→C` / `C→A` (sans préfixe « Type : »).

### Affichage compact des noms (`_compactNameMode` + `_buildAbbrMap`)

Toggle global (persisté `localStorage.planClasse_compactNameMode` : `'full' | 'auto'`) qui change l'affichage des noms dans **5 tableaux d'éval** : tableur de saisie Type A/C (`_evalTableurRender`), tableur Type B (`_evalTableurRenderB`), bilan compétences popup tableur (`_evalRenderBilanComps`), Bilan des notes (`renderBilanTab`), Bilan des compétences (`renderCompetencesTab`).

- **`'full'`** (défaut) : `<strong>NOM</strong> Prénom`
- **`'auto'`** : pour chaque groupe d'élèves avec le même prénom dans la classe, calcule le **plus petit k** tel que `nom[:k]` soit unique au sein du groupe. Si prénom unique → juste le prénom. Sinon → `Prénom <strong>Nn.</strong>`. Ex. 3 « Léo MARTIN / MERCIER / MARCHAND » → `Léo MART. / Léo MERC. / Léo MARC.` (k=4 minimum).

**Toggle au clic gauche sur l'en-tête `<th>Élève`** via `_NAME_HEAD_ATTRS()` injecté dans 8 `<th>`. Fonction (et non `const`) car ce bloc est situé après l'appel `init()` ligne ~24159 — un `const` top-level serait en TDZ au 1er render. Idem `var _CUR_ABBR_MAP` (Map<sid, k> du contexte de rendu courant, set par chaque renderer via `_setCurAbbrMap(students)` juste avant sa boucle).

L'algo normalise les prénoms via NFD + suppression des combining marks `/[̀-ͯ]/g` + lowercase pour comparer sans tenir compte des accents.

### Filet rouge — masqué quand une modale est ouverte

`body:has(.mo.on)::before { display: none; }` — règle CSS pure. Évite que le filet rouge (`body::before`, z-index 9990) passe au-dessus du tableur d'éval en mode plein écran (99vw).

## Disciplines (catalogue global)

Permet d'enseigner **plusieurs disciplines** à une même classe (ex. SVT + SVT Bilingue). Refonte mai 2026 : au lieu de stocker 2 noms par classe (`discNamePrimary`/`discNameSecondary`), on a désormais un **catalogue global** `S.disciplines` et chaque classe coche les disciplines qui la concernent. Plus de limite à 2 — une classe peut être enseignée dans 3, 4, N disciplines.

Pour les **classes recomposées** (élèves d'une ou plusieurs classes regroupés autour d'une discipline particulière — ex. Bilingue 6ᵉ, Option DP3), on utilise toujours la feature **virtual classes** (`cls.virtual = true`) — créées via l'onglet Classes → ➕ Nouvelle classe recomposée. La virtual class porte ses propres `disciplineIds` + bilans, indépendamment des classes parentes.

### Modèle

```js
// Catalogue global (au moins une discipline marquée isPrimary)
S.disciplines = {
  'disc_main':    { id: 'disc_main',    nom: 'Discipline principale', isPrimary: true },
  'disc_svt':     { id: 'disc_svt',     nom: 'SVT',                   isPrimary: false },
  'disc_svt_bil': { id: 'disc_svt_bil', nom: 'SVT Bilingue',          isPrimary: false },
}

// Par classe : 1 ou plusieurs disciplines (jamais vide)
cls.disciplineIds = ['disc_svt', 'disc_svt_bil']

// Par évaluation : la discipline d'appartenance (toujours set après migration)
ev.disciplineId = 'disc_svt_bil'

// Bulletins : clés = disciplineId
S.bulletinRemarques[classId][disciplineId][sid][periode]      = "texte"
S.bulletinClassRemarques[classId][disciplineId][periode]      = "texte"
S.bulletinWorkedItems[classId][disciplineId][periode]         = [items]
S.conseilClasse[classId][disciplineId][sid][periode]          = { F, E, AT, AC }
```

### Helpers principaux

- `_disciplineLabel(id)` — renvoie le nom (fallback « (discipline inconnue) »)
- `_disciplinePrimary()` / `_disciplinePrimaryId()` — discipline marquée `isPrimary`
- `_clsDisciplineIds(cls)` — liste filtrée des ids valides (jamais vide ; fallback principale)
- `_clsHasMultipleDisciplines(cls)` — true si ≥ 2 disciplines
- `_clsDefaultDisciplineId(cls)` — la 1re discipline de la classe
- `_evalDisciplineId(ev)` — l'id de l'éval (fallback : 1re discipline de la classe primaire)
- `_evalMatchesDiscipline(ev, discId)` — filtre
- `_currentDiscipline(classId)` / `_setCurrentDiscipline(classId, discId)` — discipline active, persistance via `localStorage.planClasse_currentDiscipline` (JSON `{classId: discId}`)
- `_renderDisciplineToolbar(tabKey)` — peuple `#disc-channel-{notes,bilan,comp}` ; caché si mono-discipline

Les anciens noms `_clsPrimaryName`, `_clsSecondaryName`, `_clsHasTwoChannels`, `_evalChannelOf`, `_evalMatchesChannel`, `_currentDiscChannel`, `_setDiscChannel`, `_renderDiscChannelToolbar`, `_evalRefreshChannelSelect` existent encore comme **shims rétrocompat** au-dessus du nouveau modèle (utilisés par les callsites historiques pour ne pas tout réécrire). `_clsHasTwoChannels` est ainsi un alias de `_clsHasMultipleDisciplines`.

### UI

- **Bouton 🎓 Disciplines** dans le header de l'onglet Classes (à gauche de 🗑 Réinitialiser) → ouvre la modale `mdisciplines` :
  - Liste : un input nom + badge « Principale »/compteurs d'usage + bouton ✕ Supprimer (désactivé si principale ou si utilisée)
  - Bouton « + Ajouter une discipline »
  - Pour éviter le bug 895917a (perte de focus lors de la frappe) : oninput → `_evalArmUndo()` + save debounced (500 ms), **pas de re-render de la liste pendant la frappe**.
- **Modale Modifier classe** (`mce`) : si ≥ 2 disciplines au catalogue, section « 🎓 Disciplines enseignées » avec checkboxes (au moins une obligatoire). Lien « + Créer une nouvelle discipline… » → ouvre `mdisciplines`. Warning à l'enregistrement si on retire une discipline qui a des évals attachées.
- **Modale Classe recomposée** (`mvc`) : idem.
- **Modale Nouvelle classe** (`mc`) : sans champ discipline (toutes les disciplines actives par défaut pour une classe vierge). L'utilisateur peut les ajuster ensuite via Modifier.
- **Modale Nouvelle/Modifier éval** (`meval-new`, `meval-edit`) : sélecteur de discipline (caché si 1 seule option possible parmi les classes cochées) construit dynamiquement depuis l'union des `cls.disciplineIds` des classes cochées.
- **Sélecteur Discipline** dans les toolbars des 3 onglets eval (Devoirs / Bilan notes / Bilan compétences) : visible uniquement si la classe courante a ≥ 2 disciplines. Persistance par classe.
- **Pastille discipline** (`_evalChannelPillHTML`) : affichée si la discipline de l'éval n'est pas la 1re de sa classe.

### Migration (postLoadHook, idempotente)

1. **Catalogue** : crée `S.disciplines` avec `disc_main` (isPrimary) si absent ou vide. Garantit qu'au moins une discipline est `isPrimary`.
2. **Classes** : si `cls.disciplineIds` absent, construit depuis les legacy fields (`discNamePrimary` / `discNameSecondary` / `discPrimaryDisabled`) en trouvant / créant les disciplines au catalogue par nom (matching case-insensitive trim). Supprime les legacy fields. Garantit `disciplineIds.length >= 1`.
3. **Évaluations** : si `ev.disciplineId` absent ou invalide, dérive depuis `ev.discChannel` ('primary' → `cls.disciplineIds[0]`, 'secondary' → `cls.disciplineIds[1] || [0]`). Supprime `ev.discChannel`.
4. **Bulletins** (`_bulletinWrapAll`) : si le `[classId]` contient encore des clés `primary` / `secondary` (anciennes données) OU des clés orphelines (sids/periodes à la racine), migre vers la structure `[disciplineId]` en utilisant `cls.disciplineIds`. Idempotent : skip si toutes les clés sont des disciplineIds connus.

### Démo

`_seedDemoEvaluations` configure pour la 6A : crée 2 disciplines au catalogue (« SVT » + « SVT Bilingue »), affecte les deux à la 6A, réassigne les évals existantes de la 6A à `disc_svt`, et crée une éval bilingue rattachée à `disc_svt_bil` avec sa remarque bulletin séparée. La discipline principale du catalogue (`disc_main`) reste utilisée par les autres classes (5A, 5B, 6B, 4A).

### Filtrage

Sites filtrés par discipline (callsites direct, via `_currentDiscipline` + `_evalMatchesDiscipline`) :
- `renderEvalNotes` (liste Devoirs)
- `renderBilanTab` (ownEvs + orphanEvs)
- `renderCompetencesTab` (compIds + orphan)
- `_bilanCollectEligibleEvals`
- `_computeStudentMeanForPeriod` (paramètre `channelFilter` étendu : accepte un disciplineId, ou `'primary'`/`'secondary'` legacy normalisé)

**Important** : le filtre est appliqué **systématiquement**, même quand la classe n'a qu'une seule discipline (mono-flux). Cela permet d'exclure correctement les évaluations orphelines (provenant d'autres classes d'élèves transférés ou inhérentes au modèle multi-classes) qui n'appartiennent pas à la discipline courante. Le sélecteur de flux dans la toolbar reste caché en mono-discipline (pas de choix utile pour l'utilisateur), mais le filtre est toujours actif en arrière-plan.

**Pas filtrés** (volontaire) : tableur d'éval, calcul intra-éval, cross-tab d'une éval — ces vues sont focalisées sur une éval précise.

### Appartenance per-période (`cls.membership`)

Pour les classes recomposées dont le roster évolue entre périodes (typique : Devoir Fait), chaque élève peut avoir un intervalle d'appartenance restreint :

```js
cls.membership = { [sid]: { fromPer, toPer } }
// fromPer / toPer : code période (S1/S2 ou T1/T2/T3) ou null pour ouvert
// sid absent du dict → présent sur toutes les périodes (défaut)
```

Helper : `_stuActiveInClassForPeriod(cls, sid, periode)`. En mode « Toutes » → toujours actif (union). En période spécifique → vérifie l'inclusion dans [fromPer..toPer].

Appliqué dans : `renderBilanTab`, `_bilanBuildRows`, `renderCompetencesTab` (sids + sidsForOrphan).

**Migration auto** : si l'utilisateur change `S.evalPrefs.periodMode` (semestre ↔ trimestre), tous les `cls.membership` sont effacés (les codes ne correspondent plus). Toast d'avertissement avec compte des restrictions effacées.

UI : dans la modale 🔀 Classe recomposée (`mvc`), deux mini-sélecteurs « de [—] à [—] » par élève coché + barre d'action en lot avec sélection secondaire (case droite distincte de la case d'appartenance gauche) pour appliquer en bulk : `mvcBulkApplyPeriod()` / `mvcBulkResetPeriod()` / `mvcBulkSelAll()`.

### Suppression d'une discipline

Refusée si la discipline est utilisée par ≥ 1 classe ou ≥ 1 éval (toast d'avertissement, bouton ✕ désactivé). Pas de cascade automatique — l'utilisateur doit retirer la discipline des classes / évals d'abord. La discipline principale (`isPrimary`) n'est jamais supprimable (peut être renommée).

### Affectation rapide depuis l'onglet Devoirs

Bouton **🎓 Disciplines** dans la toolbar de l'onglet **Devoirs** (uniquement — pas Bilans, qui sont des vues de consultation) → ouvre `mdisciplines` via `openDisciplinesFromTab()` avec un panneau supplémentaire **« 📚 Disciplines enseignées à [classe active] »** (id `mdisc-class-assign`). Checkboxes pour cocher/décocher les disciplines de la classe sans passer par « Modifier classe ». Helper `_discToggleClassAssign(discId, on)` : `pushUndo()` + mute `cls.disciplineIds` + garantit ≥ 1 discipline (retombe sur `_disciplinePrimaryId()` si vide). Re-render auto des toolbars eval.

## Classes recomposées (virtual classes)

Une « classe recomposée » est une `cls` avec `cls.virtual = true` créée via l'onglet Classes (bouton **+ Nouvelle classe recomposée**). Elle a son propre roster (sids issus de n'importe quelle(s) classe(s) réelle(s)), sa propre salle/plan, ses propres bilans et disciplines.

### Modale `mvc` — mode pliable

Pour réduire la densité visuelle dans le cas simple (cocher quelques élèves), la modale a deux niveaux :

- **Mode simple (par défaut)** : seule la liste d'élèves avec **une case par ligne** (= membre de la classe). Le panneau de filtres (Tags / Classes / Niveau), la barre bulk période, la 2e case (sélection bulk) et les sélecteurs « de [..] à [..] » par élève sont **cachés**.
- **Mode avancé** : déplié via le bouton **▸ Options avancées** (en haut de la modale, à côté de la liste). Reveille tous les outils + un mini-header de colonnes « 👤 Membre | 🗓 Sélection bulk ▶ » au-dessus de la liste pour clarifier les 2 cases.

État : variable globale `_mvcAdvancedOn` (booléen, reset à chaque ouverture via `_mvcResetAdvanced()`). Toggle : `_mvcToggleAdvanced()` qui synchronise visibilité du wrap, libellé du bouton (▸ vs ▾), header de colonnes et re-render de la liste.

CSS responsive : `@media (pointer: coarse)` agrandit les cases (22px) et sélecteurs (font-size 1em, padding) — meilleure ergonomie sur Surface / iPad. La case bulk droite utilise `accent-color: var(--disc-accent)` pour la distinguer visuellement.

### Workflow inverse depuis l'onglet Élèves

Sélection multi-élèves (clic & glisser) dans l'onglet Élèves → barre d'actions en lot → bouton violet **🔀 Classe recomposée** appelle `bulkCreateRecomposee()` qui ouvre `mvc` avec les sids pré-cochés (via `_mvcSelected`) et focus sur le champ Nom. Permet de créer un groupe DNL/Bilingue/Option en 3 clics.

### Appartenance per-période (`cls.membership`)

Pour les classes recomposées dont le roster évolue entre périodes (typique : Devoir Fait), chaque élève peut avoir un intervalle d'appartenance restreint : `cls.membership[sid] = { fromPer, toPer }`. Codes période (S1/S2 ou T1/T2/T3) ou null pour ouvert. Géré dans le mode avancé (sélecteurs « de [..] à [..] » par élève + barre bulk violette). Cf. section *Appartenance per-période* dans le bloc Disciplines pour les détails.

## Mode de coloration des cellules (Plan Prof)

Sélecteur **🎨 Couleur** dans la toolbar Plan Prof (`#tg-color-mode`). 4 modes :
- **Groupe** : couleur G1/G2/G3 (bleu/orange/violet)
- **Tag** : couleur du tag (de l'élève ou de la place)
- **Genre** : bleu (M) / rose (F)
- **Aucune** : pas de coloration

**Priorité** (code dans `buildCell` ligne ~14238) :
1. Attribut de l'ÉLÈVE : `stu.groupe` (1/2/3) | premier `stu.tags[0]` | `stu.civilite` (M/F)
2. Fallback : attribut de la PLACE : `seatG` (zone configurée via Config Salle → mode Groupes) | `seatTag` (via mode Tags) — utile pour visualiser la configuration des places en l'absence d'élève

CSS : les classes colorées `.cell.oc.cg1`, `.cell.oc.cgen-m`, etc. portent toutes `!important` pour battre la règle `.cell.oc { background:var(--paper) !important }` du design system « papier » (ligne ~1596).

Persistance : `localStorage.planClasse_planColorMode`. Setter : `setPlanColorMode(mode)` qui appelle `renderTeacherGrid()`.

## Menu contextuel cellule (clic droit)

`showCtxMenu(e, cls, key, sid)` populate les libellés dynamiques + positionne le menu pour ne pas déborder.

**Items conditionnels** :
- ⚠️ **Contraintes non respectées (N)** : visible UNIQUEMENT si `getPlacementViolations(cls, sid, key)` renvoie ≥ 1. Handler `ctxShowViolations()` → ouvre `showViolationsModal(cls)` (modale `mviolations`).
- 🔔 Rappels (N) : libellé enrichi avec compteur si > 0 actifs.
- 📦 / 📝 −1 : grisés si compteur à 0.
- ↩ Annuler : grisé si `undoStack` vide.
- 🎓 Aménagements (sous-menu) : labels « Marquer X » / « Retirer X » selon l'état actuel de chaque statut.

## Glisser & déposer (placement des élèves)

Deux mécanismes coexistent, selon le type de pointeur :

- **Souris / stylet** → drag&drop **HTML5 natif** (`draggable="true"` + `dragstart`/`dragover`/`drop`). Inchangé. Les handlers `dragstart` posent l'objet global `drag = { type:'placed'|'unplaced'|'unplaced-batch'|'aesh', sid?|sids?|aeshIdx?, fromKey? }`, puis `dropOnCell(cls, key)` / `dropAeshOnCell` / `dropToUnplaced` consomment `drag`.
- **Tactile (doigt, Apple Pencil)** → glisser **maison via Touch Events** (le DnD HTML5 ne marche pas au doigt sur iOS Safari). Remplace l'ancien « tap-tap » (`_tapMode`, supprimé) qui provoquait des déplacements accidentels (tap raté près d'un bouton 📦 → sélection → déplacement au tap suivant).

### Contrôleur tactile `_tdAttach(el, getDesc, opts)`
Défini juste après la déclaration de `let drag` (~ligne 5430). État global `_tdState` (saisie en cours) + `_tdGhost` (carte fantôme) + `_tdRecentDrag` (neutralise le click synthétique post-glisser).
- **`getDesc()`** → `{ srcType:'placed'|'unplaced'|'aesh', sid?, aeshIdx?, fromKey? }` (lazy, lu au moment du drop).
- **`opts.onHold(x,y)`** → callback si saisie PUIS relâché sans bouger (cellules élève : ouvre `showCtxMenu` — remplace l'ancien appui-long 600 ms).
- Constantes : `_TD_PICKUP_MS=180` (appui maintenu avant saisie), `_TD_MOVE_CANCEL_PX=12` (bouger avant la saisie = défilement → annule), `_TD_DRAG_PX=6` (bouger après la saisie = glisser).
- Listeners `touchstart/touchmove/touchend/touchcancel` **non passifs** (`{passive:false}`) pour pouvoir bloquer le défilement pendant le glisser (`e.preventDefault()` uniquement une fois la saisie faite).
- `_tdHitTarget(x,y)` : `elementFromPoint` (fantôme masqué le temps du test) → `.cell[data-key]` de `#tg` ou la zone `#unpl`.
- `_tdDescToDrag(desc)` → objet `drag` ; respecte la multi-sélection des non-placés (`unplaced-batch`). `_tdDrop(desc,x,y)` pose `drag` puis appelle `dropOnCell`/`dropToUnplaced`.
- CSS : `.td-ghost` (carte qui suit le doigt), `.td-src` (source estompée), `.td-over` (case survolée).

### Comportements clés
- **Tap rapide → RIEN** côté placement (corrige le bug du tap-tap : rater un bouton ne déplace plus personne).
- **Swipe rapide → défilement natif** conservé (le glisser ne démarre qu'après l'appui maintenu de 180 ms).
- **Appui maintenu + glisser → placement/échange** ; **appui maintenu + relâché sans bouger → menu contextuel** (cellules élève).
- Points d'entrée câblés : cellules occupées Plan Prof (`buildCell`, branche `if(!isGhost)`), cellules AESH, items « non placés » (`renderUnplaced`, attache JS sur `.us` après render). La **Vue Élève** n'est PAS draggable (projection lecture seule).
- Garde anti-double : `dragstart` (souris) fait `if (_tdState) { e.preventDefault(); return; }` pour ne pas déclencher un drag natif pendant un glisser tactile (Android émet un drag natif sur appui-long de `draggable=true`).
- `switchClass` et la touche `Échap` appellent `_tdCancel()` (annule une saisie tactile en cours).
- ⚠️ Non testable en aperçu desktop sur le ressenti réel iPad — validation finale sur l'appareil. Les `TouchEvent` synthétiques permettent toutefois de vérifier la logique (saisie, échange, annulation, menu contextuel) automatiquement.

## Conventions de développement
- Tout le code reste dans le fichier HTML unique — ne pas éclater en plusieurs fichiers
- CSS dans le `<style>`, JS dans le `<script>` en fin de body
- Pas de dépendances externes (pas de CDN, fonctionne hors-ligne)
- Pile d'undo/redo basée sur `JSON.stringify(S)` (sérialisation complète) ; les accesseurs proxy étant non-énumérables, ils sont exclus de la sérialisation et ré-installés via `applyAccessorsAll()` après `JSON.parse()`
- IndexedDB pour persister les handles de répertoire (sync auto) et QCMCam — clés `'dir'` et `'qcm-dir'`
- Toute action mutante doit appeler `pushUndo()` AVANT la mutation, sinon l'undo capture le mauvais état
- Pour les développements longs : travailler sur une copie `plan de classe new.html`, puis remplacer une fois validé (convention demandée par l'utilisateur)
- Modals empilés (par ex. mhist par-dessus moverview) : utiliser `_modalReturnTo[id]` pour enregistrer un callback à la fermeture, ou bien laisser le modal parent ouvert et bumper le `z-index` du modal enfant à 1010+
- **Jamais de `confirm()` natif** : toujours utiliser le helper `_uiConfirm(...)` (cf. section dédiée). Le navigateur peut bloquer les dialogues natifs → boutons muets. Les `alert()`/`prompt()` natifs subsistent par endroits (à convertir au besoin via `appAlert` / un champ dans une modale).

## Fiabilité & sécurité — invariants à respecter

- **Suppression d'un élève = `_purgeStudentRefs(id)`** (source unique de vérité). Retire TOUTES les références à un sid (roster, sièges, tablettes legacy `ipads*` + `ipadsByPool`, `allowedFor`, `aeshLinks`, `noNeighbors`, `membership`, `ev.notes/studentRemarks/passations.niveaux`, `conseilClasse`, `bulletinRemarques`) dans toutes les classes. `_deleteStudentInternal` = `_purgeStudentRefs` + `delete S.eleves[id]`. **Tout nouveau champ indexé par sid DOIT être purgé là.**
- **Suppression d'une classe réelle (`deleteClass`)** route chaque élève via `_deleteStudentInternal`, puis purge les stores indexés par classe (`attendance`, `snapshots`, `movedHighlights`, `bulletinRemarques`/`ClassRemarques`/`WorkedItems`, `conseilClasse`) et supprime les évals devenues orphelines (plus aucune classe vivante via `_evalPrimaryAliveClassId`).
- **`_auditState({repair})`** lancé en fin de `postLoadHook` : détecte/répare (conservateur) les références orphelines — élèves fantômes (sid hors `S.eleves`), `activeRoom`/`activePool`/`S.cur` invalides. Réutilise `_purgeStudentRefs`. Journalise dans la console + `window.__planClasseErrors`.
- **Gestionnaire d'erreurs global** (`window.error` + `unhandledrejection` → `_logRuntimeError`) : surface un toast discret + garde un journal `window.__planClasseErrors` (50 derniers). Rend visibles les pannes que les `catch{}` avalaient.
- **CSP** (balise `<meta>` en `<head>`) : `connect-src` limité à `'self' + api.github.com` et `img-src 'self' data: blob:` (PAS `*`) bloquent l'exfiltration de données élèves en cas de XSS résiduelle. ⚠️ **`font-src 'self' data:` est INDISPENSABLE** : les 3 polices du design system sont embarquées en `data:font/woff2;base64` — sans cette directive, `default-src 'self'` les bloque et l'app retombe en silence sur les polices système.
- **Échappement au rendu** : toute donnée utilisateur (nom/prénom, libellés, remarques, libellés de créneaux…) injectée en `innerHTML` doit passer par `_escName`/`_escAttr`. `_validateImport` ne nettoie PAS les valeurs (seulement les clés, dont un scan récursif anti prototype-pollution `__proto__`/`constructor`/`prototype`) → la défense est à l'affichage.

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

**Patterns de conversion** :
- Cas simple `if (!confirm(msg)) return; <body>` → mettre `<body>` dans `onOk: () => { ... }`.
- Confirmation au milieu d'une fonction avec du code commun après → extraire le code commun dans un worker (`const _finish = () => {...}` / `_commit` / `_proceed`), brancher : `if (cond) { _uiConfirm({..., onOk: _commit}); return; } _commit();`.
- Confirmation avec branche `else` (ex. rechargement fichier qui note un timestamp au refus) → utiliser `onCancel`.
- `_uiConfirm` n'est PAS bloquant au sens JS (pas de valeur de retour) : tout ce qui suivait le `confirm()` doit passer dans `onOk`/`onCancel`, pas après l'appel.

**Cas particulier — note hors barème** (`_evalTableurConfirmIfOutOfRange`, tableur d'éval) : utilise `_uiConfirm` avec **Conserver** (`onOk`, garde la valeur) / **Annuler** (`onCancel`, restaure la valeur précédente capturée au focus + recolore). Fenêtre bloquante voulue (choix explicite de l'enseignant).
