# Plan de classe et salles

> Mémoire détaillée du projet, rangée depuis CLAUDE.md le 2026-10-29 (texte inchangé). Contenu : barre du Plan et Vue Élève (fenêtre de projection), compteur, interroger, cases du plan, étiquette d’une cellule, coloration, surlignages, clic droit, glisser-déposer, mélanger tout, contraintes de placement et paires, Config Salle (modes, horaires, classes de la salle), impressions.

## Compteur enrichi `tg-count` (Plan Prof)

`{X/Y placés} · ✅ Z présents · 🚫 W absents · ⏰ V retards · 🔵 G1 · 🟠 G2 · U ULIS hors classe`
- Présents = placés − absents (les retards sont considérés présents)
- Absents/retards : sous-ensembles des élèves placés et dans le filtre groupe actif
- **`✅ N présents` affiché si :** mode appel actif **OU** post-appel actif (`_isStillInSavedSlot()`) **OU** absentN > 0 **OU** lateN > 0. Permet à l'enseignant de toujours voir le décompte tant qu'il y a une session d'appel active, même à 0/0 (ex. « ✅ 30 présents · 30/30 placés » confirme visuellement que l'appel a bien été enregistré).
- 🚫 et ⏰ n'apparaissent que si > 0 (pas de « 0 absent » ou « 0 retard »).
- ULIS hors classe affiché uniquement si U > 0
- **Note** : l'indicateur de pool actif (`📱 <nom-pool>`) historiquement affiché dans `tg-count` a été **retiré** — il est désormais visible directement dans la toolbar du Plan Prof à côté du sélecteur de salle (cf. `.pool-buttons-container` partagé entre Plan Prof et Tablettes). Évite le doublon.

## 🎲 Interroger — carte flottante qui surgit de la cellule

Lors d'un tirage aléatoire (`pickRandomStudent`), au lieu d'une modale centrée, une **carte flottante** naît aux dimensions de la cellule de l'élève et glisse vers une position adjacente, avec 4 traits SVG en pointillés bleus qui relient les angles cellule → angles carte (effet "écho visuel persistant"). La cellule d'origine reste affichée normalement.

### Composants
- `#pick-overlay` : div invisible plein écran, z-index 4998, **bloque toute interaction** avec le plan tant que la carte est ouverte (drag&drop, compteurs, menu contextuel). Clic dessus = ferme la carte.
- `#pick-svg` : SVG plein écran avec 4 `<line>` qui se tracent en delay 400ms (animation `stroke-dasharray` qui se déplace = effet « flux »).
- `#pick-float` : la carte avec fond `rgba(255,255,255,.85)` + `backdrop-filter: blur(8px) saturate(140%)` (verre dépoli — on devine la grille en arrière-plan).

### Positionnement (`_pickTargetPosition`)
Placement **adjacent** à la cellule (gap 16px), **côté opposé** à celui de la cellule dans le viewport (cellule moitié gauche → carte à droite, et vice-versa). Cascade : droite/gauche selon préférence, puis bas/haut en fallback, puis clamp final.

### Fonctionnement
- **Barre d'espace = élève suivant** tant que la carte est ouverte (v2.98.1) : écouteur `keydown` en **capture** (hors saisie de texte et hors modale), `preventDefault` pour ne pas aussi « recliquer » le bouton qui aurait le focus — un seul tirage par appui, vérifié. Avant, ça ne marchait que si le bouton 🎲 gardait le focus.
- **`_pickShow(result)`** : positionne la carte aux dims de la cellule, opacity 0 → 1 + dimensions cibles via transition 420ms cubic-bezier.
- **Dimensions cibles MESURÉES, pas figées** (`_pickMeasureCard`, `PICK_CARD_MIN_W/H = 300/240` = minimums). L'ancien `cardW = 300, cardH = 240` en dur + `overflow:hidden` **tronquait les boutons** dès que la police rendait plus large que sur la machine de développement (réglage de taille de police du navigateur, écran tactile où le bloc `@media (pointer: coarse)` porte les `.btn-sm` à `.95em` / `9px 13px` → 375 px nécessaires), et le bandeau « ↻ Cycle terminé » poussait déjà les boutons sous le bord bas même en rendu standard (250 px nécessaires). La mesure se fait carte invisible, sans transition, `transform:none` (le `scale(.7)` de repos fausserait `getBoundingClientRect`) : **largeur** = minimum élargi de ce dont la rangée de boutons déborde quand on lui interdit le retour à la ligne — sur les DEUX conteneurs flex (`.pf-actions` ET `.pf-secondary`, sinon le second replie ses propres boutons et rien ne déborde) — et non le max-content de toute la carte (la ligne de compteur l'élargirait alors qu'elle peut passer sur deux lignes) ; **hauteur** = celle du contenu à cette largeur. `+1 px` sur chaque mesure : `scrollWidth` est arrondi à l'entier et 0,4 px de débordement suffisaient à renvoyer un bouton à la ligne. Filet CSS : `.pf-actions` / `.pf-secondary` en `flex-wrap:wrap`, boutons en `white-space:nowrap`. ⚠️ Le bornage au viewport (`innerWidth − 24`) ramène tout au minimum si le viewport vaut 0 — c'est le cas d'un panneau d'aperçu **masqué** (piège de test rencontré, pas un cas réel : émuler une taille de fenêtre avant de mesurer).
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

### Impression d'un écran de consultation (v2.71.0) — `_printConsultation`

Bilans des notes et des compétences (`printBilanNotes` / `printBilanComp`, aussi Ctrl+P sur ces onglets), fiche élève (`printFiche`, nœud `#mrw-body`), Vue d'ensemble (`printOverview`). On **recopie le nœud rendu** (`cloneNode`) plutôt que de reconstruire : l'impression montre ce que l'on voit (tri, colonnes masquées, évals d'autres classes, couleurs). `_printSanitizeClone` transforme champs → texte, retire boutons, compteurs, icônes de la fiche, attributs `onclick`/`title`, neutralise le collant, pose le `tfoot` une seule fois en fin, et respecte **Couleurs / N&B** (`_printColors`). Écrit dans `#pa`, `_setPrintOrientation`, `document.title` = nom du PDF. Ce sont **4 chemins d'impression de plus** pour l'audit des impressions (17 au total). ⚠️ Couleurs : ces tableaux portent des **tokens** et des fonds calculés — sur papier, c'est le bloc de neutralisation `@media print { html[data-theme="dark"] … }` qui les ramène au thème clair. Bloqué en mode confidentiel pour la Vue d'ensemble (comme son CSV).

**Exports ajoutés** : `_bilanNotesExportEnt` (élève, moyenne /20 à la granulométrie `meanGranularity`, remarque — par période en mode « Toutes » ; élèves = lignes affichées), `exportOverviewCSV` (via `_overviewRows`, partagé avec `renderOverview`). Une seule icône **📤** pour l'Export ENT.

## Config Salle — modernisation v2.102.0 (maquette validée le 2026-10-07)

- **Rangée 1** `#cfg-salle-list.cf-row1` : les salles (`renderSalleCatalog`) et ➕ Nouvelle salle. **Rangée 2** `.cf-row2` : Nom, Rangées, Colonnes (mêmes id `cfg-salle` / `cfg-rows` / `cfg-cols`), à droite 🖨 Plan vide, 🗂 Ordres de ramassage et **⋯ → 🗑 Supprimer cette salle** (arbitrage : plus de gros bouton rouge dans la barre).
- **Bandeau** `#cfg-synth` (`_cfgSynthRender`, appelé par `_renderCfgSalleClasses`) : Disposition (tables, rangées × colonnes, cases sans table, îlots) · **Classes dans cette salle** en pastilles `.cf-cls-pill` (ex-cases à cocher ; allumée = la classe a la salle, nombre d'élèves placés, liseré jaune = classe courante ; clic → `_cfgToggleSalleClass(id, on, null)`, la dernière salle d'une classe ne se retire pas) · Horaires (résumé `_cfgSchedResume`, lien qui déplie la section).
- **Modes en sélecteurs** `.ip-seg` (boutons `.cf-mode`, mêmes id `cfg-mode-*` ; `setCfgMode` retire `.on` des `.cf-mode` et non plus des `.gchip`) : Salle (Tables | Îlots) · Classe <nom> (Groupes | Tags | ⛓ Contraintes). **Aide courte** d'une phrase par mode (`_CFG_HINT_SHORT` → `#cfg-hint-short`) ; l'explication complète (les 5 blocs `cfg-hint-*`, toujours affichés selon le mode) et l'exemple dessiné des îlots sont dans **❔ Aide** (`#cfg-help`, `_cfgHelpToggle`, replié).
- **Grille** plus large (150 px par colonne au lieu de 94, `#cfg-board` suit) ; **allées hachurées** comme sur le Plan (`#cfgg .cell.nt`), plus de « ✖ Sans table » ; légende adaptée (« ▨ allée »).
- **Horaires repliés** (`<details id="cfg-schedule-wrap">`, « 📅 Horaires de l'établissement » + résumé `#cfg-sched-resume`) — arbitrage : repliés ici, pas déplacés dans les Réglages.
- Audit : 0 écart en clair et en sombre sur les 5 modes, aide et horaires dépliés (hors `<text>` SVG de l'exemple des îlots, faux positifs connus) ; pas de débordement de page à 375 px.

## Config Salle — portée des modes (v2.70.0)

Les modes sont présentés en **deux groupes** : « Salle (toutes classes) : Tables, Îlots » et « Classe **<nom>** dans cette salle : Groupes, Tags, Contraintes » (le mode AESH a été retiré en v2.93.0 — cf. section AESH) (`_CFG_CLASS_MODES`, nom posé par `_renderCfgClsName`). **La salle affichée suit la classe** : `renderConfigGrid` l'aligne sur `cls.activeRoom` quand la classe diffère de `_cfgSyncedCls` (remis à `null` par `showTab('config')`) — donc à l'entrée dans l'onglet et au changement de classe, mais un choix fait dans l'onglet survit aux re-rendus. Un mode « classe » sur une salle que la classe n'a pas affiche **« ➕ Rattacher cette salle à <classe> »** (`_cfgAttachToCurrent`, annulable) au lieu de l'ancien « Activez-la depuis Plan Prof », impossible à suivre.

## Config Salle — « Classes utilisant cette salle »

Sous la barre de la salle (nom, dimensions), un bloc `#cfg-salle-classes` (`_renderCfgSalleClasses`, appelé par `renderConfigGrid`) affiche **une case par classe**, cochée si la classe a cette salle dans ses `rooms`. C'est le réglage global « quelle classe a quelle salle », placé **là où on nomme la salle** : après un import qui a créé plusieurs classes, on coche celles qui partagent la salle physique sans passer classe par classe par la fenêtre « Ajouter une salle » du Plan Prof (`msalle`, qui ne connaît que la classe courante).

- `_attachSalleToClass(cls, salleId, makeActive)` / `_detachSalleFromClass(cls, salleId)` — helpers **génériques** (n'importe quelle classe), sans `pushUndo` ni `save`, désormais aussi utilisés par `addSalleToClass` et `confirmRemoveSalleFromClass`. Le détachement refuse la **dernière salle** d'une classe (`{ ok:false, reason:'derniere' }` ; la case est désactivée avec l'explication en infobulle) et renvoie le nombre d'élèves placés pour que l'appelant confirme **avant** d'appeler.
- ⚠️ Le conteneur `#cfg-salle-classes` porte son `display:flex` **en ligne** : le re-rendu doit poser `box.style.display = 'flex'`, pas `''` — vider la valeur retire le flex et chaque puce retombe sur sa propre ligne (17 lignes pleine largeur, vu en usage réel).
- `_cfgToggleSalleClass` : cocher rattache (sans changer la salle active de la classe) ; décocher détache, avec `_uiConfirm` si des élèves y sont placés — et **recoche la case** si l'utilisateur annule ou si le retrait est refusé, sinon l'affichage mentirait.

## Config Salles — édition des horaires

**Horaires de l'établissement (v2.73.0)** : bouton **⧉ Appliquer à toutes les salles** (`applyScheduleToAllSalles`, confirmation, annulable) — l'emploi du temps est celui de l'établissement, on ne le ressaisit plus salle par salle. Une nouvelle salle créée sans source reprend les horaires de la salle affichée.

L'onglet Config Salle a une sous-section **"📅 Horaires de la journée"** sous la grille :
- Onglets de jour (Lundi → Dimanche) avec compteur de créneaux par jour
- Édition libellé / heure début / heure fin par créneau
- Boutons + Ajouter / ✕ Supprimer un créneau
- Bouton **"📋 Copier lundi → semaine"** : recopie le planning du lundi sur mardi-vendredi (avec confirmation)

À la création d'une nouvelle salle (modal `msalle`), un sélecteur **"Dupliquer depuis"** permet de reprendre dimensions, places vides et horaires d'une salle existante.

## Config Salle — modes d'édition (6 chips)

L'onglet **Config Salle** propose 6 modes d'édition (chips en haut), tous appliqués à la salle active :

1. **Tables** — clic = bascule table / sans-table (modifie `salle.positions_vides`).
1bis. **Îlots** — regroupe des tables en blocs (`salle.ilots`), avec détection automatique (`cfgIlotsAuto`). Sert à la règle « même îlot = voisins » des paires à séparer. ⚠️ Mode ajouté APRÈS la passe de contraste du 2026-09-07 : c'est lui qui portait 2 des 5 écarts du thème sombre corrigés en 2.79.0 (littéraux `#7d2017` / `#a83a26` posés en encre).
2. **Groupes G1/G2/G3** — sélection multi-cases puis clic sur `🔵 G1` / `🟠 G2` / `🟣 G3` / `— Aucun` (modifie `room.groupes` de chaque classe utilisant la salle). Mutuellement exclusif avec **Tags** au niveau d'une place.
3. **Tags** — (le 5e chip est **Contraintes** ; l'ancien 6e, **🧑‍🏫 AESH**, a été retiré en v2.93.0 — réglage par classe, cf. section AESH) — sélection multi-cases puis clic sur un bouton de tag défini (modifie `room.posTagId`). Bouton `⚙ Gérer les tags` ouvre la modale `mtags`.
   - **Les trois champs d'un tag sont modifiables sur place** dans `mtags` : abréviation (`renameTagAbbr`), nom complet (`renameTagFull`), couleur (`changeTagColor`). ⚠️ L'abréviation ne l'était pas jusqu'à la 2.48.0 — seule anomalie, les classes mobiles et les mentions de conseil laissaient déjà corriger la leur. Une faute de frappe imposait donc de recréer le tag, de réaffecter les élèves **et de repeindre les zones de places**, qui pointent vers l'id.
   - **Renommer l'abréviation est sans cascade** : élèves (`stu.tags`) et places (`room.posTagId`) référencent l'**id**, jamais l'abréviation. Celle-ci ne sert qu'à l'affichage et à la reconnaissance des codes à l'import. Mêmes contrôles qu'à la création (1 à 6 caractères alphanumériques, majuscules, pas de doublon) ; ⚠️ **toute saisie refusée re-rend la liste**, sinon le champ garde à l'écran une abréviation qui n'existe pas dans le modèle.
   - ⚠️ **`_tagsRefreshSurfaces()` centralise les surfaces à rafraîchir** après une mutation de tag : liste des élèves, plan (cellules ET puces de la barre d'outils), barre d'action et grille de Config Salle. Les quatre mutations (abréviation, nom, couleur, suppression, création) y passent — elles ne rafraîchissaient auparavant que les élèves et le plan, donc un changement de couleur laissait la barre de Config Salle périmée. **Toute nouvelle surface affichant un tag s'ajoute là.**
   - ⚠️ **La couleur d'un tag est choisie par l'UTILISATEUR** : le blanc n'y tient pas toujours. Les boutons de tag de la barre d'action de Config Salle et les puces de filtre de la modale Classe recomposée forçaient `color:#fff` — 2,56:1 sur le gris de la palette, 2,85 sur l'orange, 2,87 sur le vert, 3,28 sur le sarcelle. Ils dérivent désormais leur encre par `_contrastTextColor`, comme les pastilles. Toute la palette par défaut passe alors 4,67:1 au minimum.
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
| 3 | **`dc_eff ≤ 1` ET `dr_eff ≤ 2`** | "Col line" — directement devant/derrière (ou une colonne à côté) jusqu'à 2 rangées effectives, plafonné |
| 4 | **`dr_eff ≤ 1` ET `dc_eff ≤ 2` ET `dc_raw == dc_eff`** (pas d'allée verticale traversée) | Voisinage immédiat sans trou de séparation |

**Distance effective** : raw moins le nombre de rangées (resp. colonnes) entièrement vides traversées. ⚠️ **Seuil de la règle 3 passé de 3 à 2 le 2026-09-23** (v2.59.1), à la demande de l'utilisateur : le 3 avait été choisi pour « sauter » la rangée vide qui sépare deux îlots, or `dr_eff` la retire déjà — double emploi, et une paire à 3 rangs de tables d'écart déclenchait une alerte. Règle voulue : **2 rangs, sans compter les rangées de séparation**. Une rangée d'allée vide entre deux îlots est "transparente". Calibrée à 0 mismatch sur un fichier-test de 12 scénarios × 128 cellules-décisions.

### Helpers clés
- `_computeTableGroups(salle)` → `Map<'r,c', { row, startCol, endCol }>` — pour chaque case-table, le groupe 1D contigu auquel elle appartient.
- `_cellGroupInfo(salle, key, ilots, groups)` → `{ cells, set, kind: 'ilot'|'row', tag, ... }` — îlot prioritaire sur le groupe 1D.
- `_countVideRowsInRangeStrict(posVides, r1, r2, cMin, cMax)` / `_countVideColsInRangeStrict` — compte les rangées/colonnes entièrement vides traversées (pour la distance effective).
- `_pairAdjacentKeys(cls, salle, key)` → keys "adjacentes" au sens des paires (jeu de règles unique).
- `getPlacementViolations(cls, sid, key)` / `collectAllViolations(cls)` — utilisés par les alertes UI et la modale `mviolations`.

### Fenêtre `mviolations` — refonte v2.125.0 (même logique que Mélanger tout) — remplace la description ci-dessous là où elle diffère
- **La solution minimale est calculée sans être appliquée** : **`_computeMinimalFix(cls, pins)`** rejoue la boucle d'échanges (`_tryFixOneViolation(cls, sid, key, { simulate: true, pins })` — en simulation les tablettes ne bougent pas, et un élève épinglé n'est ni déplacé ni pris en échange), remet le plan tel quel et renvoie `{ seating, swaps, before, after, iter }`.
- Fenêtre en deux colonnes : **Ce qui ne va pas** (une carte par violation, tokens `--alert-*`) | **Solution proposée** : aperçu avec prénoms (classes `.shf-plan` de Mélanger tout), élèves **déplacés en bleu** (`.mv`), **cadre rouge** sur les élèves encore en faute (`.bad`, les DEUX élèves d'une paire — `collectAllViolations` renvoie désormais `sid2`), bascule **Solution proposée | Plan actuel** (`_violShow`), **🎲 Autre solution** (`_violDraw`), **épingles** (`_violPins`, clic = ne pas déplacer cet élève).
- **« ✓ Appliquer la solution »** (`resolveMinimalConflicts`) applique **exactement** l'aperçu (`_violPreview`) : `pushUndo`, les tablettes suivent les élèves en rejouant `swaps`, surlignage rose par `_recordMovesFromDiff`. Désactivé si aucune amélioration n'a été trouvée. Autres boutons : « ✋ Je m'en occupe », « Garder tel quel » (`dismissViolations`), « 🔀 Mélanger tout… » (ouvre la fenêtre avec aperçu, au lieu de mélanger directement).
- Audit : 0 écart en clair et en sombre ; 363 px à 375. Testé : plan inchangé à l'ouverture, épingle respectée, plan appliqué = aperçu, 0 violation ensuite.
- ⚠️ **Zones de groupe et places taggées respectées** (signalé en usage réel, v2.125.1) : la solution minimale échangeait des élèves sans regarder les zones G1/G2/G3 ni les places taggées — elle pouvait envoyer un élève de G1 dans la zone G2. **`_placeFitFn(cls, room)`** (mêmes règles que `inZone` / `tagOK` du mélange) filtre les échanges de `_tryFixOneViolation` : personne n'est rendu « moins bien placé » qu'au départ (un élève déjà hors zone peut bouger). Les aperçus (Mélanger tout et contraintes) teintent les places de zone (`.z1/.z2/.z3`, tokens `--g*-light`). Vérifié sur 15 solutions successives : aucune ne sort un élève de sa zone.

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

## Mélanger tout — refonte v2.124.0 (maquette validée le 2026-10-08) — remplace la description ci-dessous là où elle diffère
- **Le tirage est calculé sans être appliqué** : **`_computeRandomPlacement(cls, opts)`** (extrait de `_runRandomPlacement`) fait les 30 essais puis **remet l'état de la classe tel quel** et renvoie `{ seating, aeshSeating, violations, toPlace }`. `_runRandomPlacement(opts, afterUndo, preset)` applique `preset` s'il est fourni (sinon calcule) — « Placer les non placés » et les autres appelants sont inchangés.
- Fenêtre en deux colonnes. **Réglages** : interrupteurs `sw-chk` (remplir d'avant en arrière, garder l'AESH, placer les hors inclusion), **cartes illustrées** par taille de rangée (`.shf-card`, aperçu ■□ de `_spacingPreview`, deux aperçus pour intérieur / extérieur), îlots en `.ip-seg` ; ligne « Toujours respectés » chiffrée (paires, places autorisées, zones). Tout changement redessine l'aperçu (`_shufSet`, `_shufSetSpacing`). Les anciens `<select>` et `_updateSpacingPreview` / `_renderIlotPreview` / `_updateIlotPreview` ont été supprimés.
- **Aperçu** `#mshuffle-preview` (`_shufDraw`, `_shufRenderPreview`) : plan en vue prof (tableau en bas) avec les **prénoms**, AESH en rose, allées hachurées ; bilan « ✓ aucune contrainte enfreinte · N élèves changent de place » ; **🎲 Autre tirage**. **Épingles** : clic sur un élève de l'aperçu → `_shufPins[sid] = key`, il garde cette place aux tirages suivants (`opts.pinned`, posé comme seating de départ, l'élève sort de la liste à placer) ; « Retirer les épingles ».
- **« ✓ Appliquer ce plan »** (`confirmShuffle`) applique **exactement** le tirage affiché (`_shufPreview` passé en `preset`), après l'instantané automatique ; mémorise les réglages pour la salle comme avant.
- Audit : 0 écart en clair et en sombre ; 363 px à 375. Testé : épingle conservée sur 5 tirages, plan appliqué identique à l'aperçu, Ctrl+Z.

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
`_recordMovesFromDiff(cls, beforeSeating)` capture un snapshot d'**origine** à la 1re mutation depuis le dernier clear (`bucket.origin = beforeSeating`). À chaque appel, recalcule la liste `bucket.keys` = `{k | origin[k] !== after[k]}`. **Conséquence importante** : si l'utilisateur déplace un élève puis le RAMÈNE à sa case de départ, le surlignage de cette case disparaît automatiquement (la case est revenue à l'origine, plus un changement net). Quand toutes les cases ont retrouvé leur origine, `bucket.origin` est supprimé pour repartir d'un état neuf. Les sites d'appel sont les fonctions de placement (`dropOnCell`, `randomPlacement`/`_runRandomPlacement`, `removeSeat`, `unplaceStu`, `clearAllSeating`, `snapshotRestore`, `onPosBlur`, `onPosPaste`, `resolveMinimalConflicts`).

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

## Surlignage des aménagements d'examen (Plan Prof)

Deux pastilles dans la barre du Plan Prof — **📄 Agrandissement** et **⏱ Tiers-temps** (raccourcis `D` et `T`) — mettent en évidence les élèves concernés. Deux moments distincts d'une évaluation : distribuer les sujets agrandis, puis accorder le temps supplémentaire. Les deux surlignages sont donc **indépendants et cumulables**, et non un mode unique « aménagements ».

- **`_amHighlight = { agr, tt }`**, persisté dans `localStorage.planClasse_amHighlight` (`'agr'` / `'tt'` / `'agr+tt'`) — même raisonnement que le filtre de groupe : une épreuve dure une heure, un F5 ne doit pas faire perdre le repère. Bascule par `toggleAmHighlight(kind)`, état des puces remis par `_updateAmChipsUI()` en tête de `renderTeacherGrid`.
- ⚠️ **Les puces portent la classe `.amchip`, PAS `.gchip`** : `setGroupFilter` fait un `querySelectorAll('.gchip')` puis retire `.on` de toutes — réutiliser la classe éteindrait le surlignage à chaque changement de filtre de groupe.
- **C'est l'estompage qui fait le travail**, pas le liseré : les concernés prennent un contour (`--agr-fg` sarcelle, `--tt-fg` violet, les deux → double anneau), les autres passent à `opacity:.32` (`.am-dim`). Un liseré seul se perd dans un plan déjà coloré. ⚠️ `.am-dim` **n'est pas `.ghost`** : ce dernier coupe aussi `pointer-events`, or les cases estompées doivent rester manipulables (on continue de déplacer un élève, de compter un oubli).
- Les cellules **AESH** sont estompées comme les autres : elles n'ont pas d'aménagement d'examen.
- **`--tt-fg` est un token neuf** (violet du tiers-temps), déclaré dans les trois blocs — `:root`, thème sombre, neutralisation `@media print` — comme l'exige la règle du design system ; un test le vérifie désormais. `--agr-fg` existait déjà.
- ⚠️ **L'encre des puces actives s'inverse avec le thème.** `--agr-fg` et `--tt-fg` sont **foncés en clair et clairs en nuit** : le blanc posé sur la puce active tombait à **1,94 et 2,33:1** sous le mode sombre (mesuré). D'où une surcharge `html[data-theme="dark"] .amchip.…on { color:#1a252f }`. Même famille que `.spec-ppre` et que le bouton **+⅓** du minuteur — tout accent qui sert de FOND à du texte a besoin d'une encre par thème.
- Le compteur `tg-count` annonce `📄 N agrandissements` / `⏱ N tiers-temps` quand le surlignage correspondant est actif — compté sur les élèves du **filtre courant, placés ou non** : un élève encore debout a droit à son sujet.
- **Plan Prof seulement.** Ni Vue Élève (projetée à la classe) ni impression — c'est une information privée à l'enseignant, comme les rappels. Un bloc `@media print` neutralise estompage et liserés au cas où.
- ⚠️ `.moved-cell` (surlignage rose des places qui viennent de bouger) porte `outline … !important` et `z-index:10` : sur une case à la fois déplacée et concernée, **le rose gagne**. Voulu — l'information la plus fraîche prime.

## Cases du Plan allégées (v2.99.0, maquette validée le 2026-10-08)

Arbitrages de l'utilisateur, point par point :
- **Compteurs 📦 / 📝** : à 0, classe `.cctr.zero`, masqués (`visibility:hidden`, la place reste) **seulement avec une souris** — `@media (hover: hover) and (pointer: fine)` — et réaffichés au survol de la case. **Au doigt** (Surface en mode tablette, iPad), aucun survol n'existe : ils restent visibles, sinon on ne pourrait plus noter un oubli en passant dans les rangs (motif explicite de l'utilisateur). Clic = +1 comme avant.
- **Croix ✕ « retirer de sa place »** : même règle (survol à la souris, toujours visible au doigt).
- **Groupe** : pastille G1/G2 et fond coloré INCHANGÉS (option C) — l'utilisateur lit le groupe par son NUMÉRO, pas par une couleur ; une bordure colorée a été écartée.
- **Taille du nom** : ⚙ Réglages → Apparence, « Normal | Grand » (`planClasse_planNameSize`, réglage de la machine, `_planNameSize` / `_setPlanNameSize` / `_applyPlanNameSize` → `body.plan-name-big`). ⚠️ En Grand, **seul le PRÉNOM grossit** (1,55 em, ≈ 18 px) ; le nom de famille est dans `<span class="cn-nom">` (les 3 rendus de `.cn` : case normale, mode appel, trombinoscope) et garde sa taille (0,72 em du prénom ≈ 13 px) — conforme à la maquette (v2.99.1, la v2.99.0 grossissait les deux). Vérifié : aucun débordement de case.
- **Rappels** : la pastille « 🔔 1 rappel » devient **🔔** (ou « 🔔 3 »), le détail reste dans l'infobulle et au clic.
- **Allées** (`#tg .cell.nt`, `#svg .svcell.nt`) : GARDENT la largeur d'une table (une allée fait au moins une table, rappel de l'utilisateur) ; plus de bloc gris avec ✖ mais un contour pointillé (`--pencil-soft`) et des hachures en `--rule-line`, 2 px tous les 10 px (v2.99.1 : plus marquées, à la demande de l'utilisateur — `--rule-line-soft` ne se voyait presque pas). ⚠️ Config Salle garde « ✖ Sans table » (`.cgrid .cell.nt`), c'est là qu'on les règle.
- **Panneau de droite** (`_tpSideUpdate`, enveloppes posées sur `renderUnplaced` / `renderAttendanceSide`) : « Élèves non placés » se replie quand il n'y a personne à placer ; la **liste alphabétique des absents / retardataires** (l'utilisateur s'en sert pour les reporter dans MBN) garde sa place ; la colonne entière disparaît seulement si les deux sont vides, et le plan récupère la largeur. Conséquence assumée : sans panneau, on retire un élève de sa place par ✕ ou par le clic droit (plus de dépôt dans la liste).
- **Colonne de droite repliable (v2.99.2, élargie en v2.100.5)** : une **barre verticale** `#tp-rail` à droite de la colonne (structure `.tp-side` > `.tp-side-body` [#unpl + #att-side] + `#tp-rail`) compte ce qu'elle contient — « 🪑 N non placés », « 🚫 N absents ⏰ N retards » (`#att-side` pose `data-abs` / `data-ret`) — et **replie toute la colonne** d'un clic (26 px, « ◀ ») ; un clic la rouvre. Choix mémorisé sur la machine (`planClasse_attSideCollapsed`, `_attSideCollapsed` / `_attSideToggle`), classe `.side-collapsed` posée par `_tpSideUpdate`. En v2.99.2 la barre ne valait que pour la liste d'appel et disparaissait dès qu'un élève était à placer (un ULIS hors inclusion non placé, par exemple) : signalé par l'utilisateur. Repliée, on ne peut plus déposer un élève dans la liste : retirer d'une place par ✕ ou par le clic droit.
- Audit : 0 écart en clair et en sombre sur la grille et le réglage.

## Étiquette d'une cellule (Plan Prof) — bandeau d'en-tête réservé (v2.145.0)

Le `N°` (à gauche) et le `✕` « retirer de sa place » (à droite) sont en `position:absolute`
dans les coins, alors que **la rangée de puces ET le nom** sont dans le flux et centrés
verticalement (`.cell{justify-content:center}`). Conséquence : dès que le contenu grandit,
il remonte **sous** eux. Ce n'est pas un défaut de repli — `.spec-badges` porte `flex-wrap`
depuis toujours ; c'est que rien ne protégeait le haut de la cellule.

⚠️ **Le masquage au survol de la v2.99.0 ne dispense PAS du bandeau** : `opacity:0` laisse la
boîte du `✕` dans la mise en page, et au doigt (`pointer: coarse`) il reste visible en
permanence — c'est précisément le cas de la Surface, d'où est venu le signalement.

Mesuré le 2026-10-12 sur la v2.144.3, 6e A avec un élève chargé (rappel, 3 tags, PPS-A+⅓,
PAI, 📋) : **4 chevauchements** à cellules de 185 px (le pire : le `✕` par-dessus une puce,
254 px²) et **40** à cellules de 110 px, le nom passant alors sous `N°`/`G`/`✕`. Après
correction : **0** à 185 px, 0 à 110 px, 0 à la souris, en mode appel, en consultation
d'instantané, avec le nom en « Grand », sous les filtres G1/G2 et dans les quatre modes de
couleur.

Deux changements :

- **`--cell-head` réserve une ligne d'en-tête** que rien ne peut occuper
  (`#tg:not(.tg-trombi) .cell.oc{padding-top:var(--cell-head);justify-content:safe center}`).
  `safe center` : si le contenu déborde malgré tout, il s'ancre en haut au lieu de remonter
  dans le bandeau.
  - ⚠️ **La valeur est calibrée sur le `✕`, pas sur le `N°`** : le bloc
    `@media (pointer: coarse)` lui donne `padding:4px 9px;font-size:1.1em`, ce qui le fait
    passer de 10,4 px de haut à **20,7**. D'où `13px` à la souris et `22px` au doigt.
    **Toute retouche de `.cell-unplace` se reporte sur `--cell-head`, aux deux endroits.**
  - **Le coût est tactile, pas universel** : à la souris le plan mesure 495 px contre 494
    avant (les 13 px de bandeau tiennent dans l'espace déjà libre) ; au doigt il grandit de
    11 % à cellules larges et de 19 % à cellules étroites. L'alternative — des gouttières
    horizontales, pour que les puces se replient avant d'atteindre les coins — a été
    écartée : sur une cellule étroite, 44 px de gouttière ne laissent pas la place d'une
    seule puce, qui déborderait alors de sa ligne et chevaucherait de nouveau.
- **Le badge de groupe (`.gbadge`) est redevenu une puce ordinaire de `.spec-badges`**, en
  1re position, au lieu d'un élément épinglé (`top:2px;left:3px;margin-top:13px`). Épinglé,
  il occupait la colonne de gauche de la première ligne de puces et la chevauchait, et il
  aurait fallu porter le bandeau à 28 px pour le dégager. Les trois sites d'émission
  (branche normale et branche appel de `buildCell`, `buildSnapshotCell`) le construisent
  désormais dans la rangée ; en mode appel il y est accompagné de l'heure d'arrivée
  `.late-time`. Ses couleurs ne changent pas (blanc sur `--g1/--g2/--g3`, non redéfinis en
  thème sombre : 5,97 / 4,91 / 5,87:1 dans les deux thèmes).

Choix de l'utilisateur, demandés avant de coder : groupe **dans** la rangée (plutôt
qu'épinglé) et puces qui **se replient autant qu'il faut** (plutôt qu'un plafond à 2 lignes
avec une pastille « +N »).

Hors périmètre, vérifié : la **Vue Élève** n'a pas de `.gbadge`, les **impressions** passent
par `.pcell`/`.pgb` (balisage distinct), le **mode trombinoscope** est exclu par
`:not(.tg-trombi)` — sa propre règle `#tg.tg-trombi .cell{padding:4px 4px 5px}` reste
gagnante —, les cellules **AESH** ne portent pas `.oc`, et `#mse-grid` n'est pas sous `#tg`.

Un lint dans `test/run.test.js` garde les trois invariants (bandeau réservé, `--cell-head`
présent dans le bloc tactile, `.gbadge` ni `position:absolute` ni émis hors de la rangée) ;
il a été vérifié contre les quatre régressions correspondantes, dont une qu'une première
version laissait passer — son contexte de recherche remontait au-delà du `cell.innerHTML =`
et attrapait le `const specBadges = … "spec-badges" …` qui le précède.

### Méthode : auditer les chevauchements d'une cellule (à rejouer)

Injecter dans la page un auditeur qui, pour chaque `#tg .cell.oc`, relève la boîte de
`.cpos`, `.cell-unplace`, du `.gbadge`, de chaque enfant de `.spec-badges`, de `.cn`,
`.cell-ctrs` et `.cipad`, puis calcule l'aire d'intersection de **toutes les paires**. Un
chevauchement se voit mal à l'œil (deux pastilles colorées qui se touchent paraissent
normales) et se compte en px² sans ambiguïté. Balayer **deux largeurs de cellule** — une
fenêtre large (185 px par cellule) et une étroite (110 px), qui fait passer les noms sur
trois lignes — et les sous-états : souris et doigt, mode appel, instantané, taille de nom,
filtres de groupe, modes de couleur.

Trois pièges de mesure, tous rencontrés le 2026-10-12 :
1. ⚠️ **Le volet d'aperçu du navigateur intégré est `pointer: coarse`.** Les mesures qu'on y
   fait sont donc déjà celles de la Surface de l'utilisateur, pas celles d'une souris — pour
   obtenir l'autre géométrie, neutraliser le bloc tactile par un `<style>` injecté.
2. ⚠️ **Le navigateur intégré ne sait pas ouvrir `file://`** : servir le dossier par
   `python -m http.server`. Mais alors **le service worker et le cache HTTP resservent
   l'ancienne version** après une modification — une première passe a conclu « le correctif
   ne s'applique pas » alors que la page affichée datait d'avant. Purger
   (`getRegistrations().unregister()` + `caches.delete`) **et** changer la query string ; le
   plus simple est de servir deux copies, `avant.html` et `apres.html`, depuis un dossier
   temporaire.
3. ⚠️ Une affectation à une variable de haut niveau depuis la console (`tgZoom = 1.4`) crée
   une propriété de `window` que le script, qui la déclare en `let`, ne lit jamais. Passer
   par les fonctions de l'app (`tgZoomIn()`).

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

## Menu du clic droit — refonte v2.126.0 (maquette validée le 2026-10-08) — remplace la description ci-dessous là où elle diffère
`#ctx` est **une petite fiche de l'élève**, construite à chaque ouverture par **`_ctxRender()`** (le HTML statique et les sous-menus ont disparu) : en-tête (photo ou initiales, prénom NOM, classe, n° de place QCMcam, pastilles d'aménagement) · **alerte rouge** si l'élève enfreint une contrainte (`getPlacementViolations`, clic = `ctxShowViolations`) · **compteurs − / ＋** oublis et non faits (`setOubli` / `setNT`) · **pastilles** Groupe (`_setGroupe`), Rôle (`_setDelegue`), Tags (`ctxToggleTag`, ⚙ = gérer), Aménagements (les 10, `_ctxToggleStatus` — exclusivité par famille inchangée), AESH (`ctxSetAesh`, ⚙ = régler) · **actions en icônes** Fiche, Modifier, Infos (● s'il y en a), Rappels (nombre) · pied « ↩ Annuler » (`#ctx-undo`) **et « ↪ Rétablir »** (`#ctx-redo`, v2.136.2), tous deux tenus à jour par `updateUndoRedoUI`, et « Retirer de sa place ». ⚠️ Règle de l'utilisateur : **partout où il y a un bouton Annuler, il y a un bouton Rétablir** à côté.
- **Une pastille agit sans fermer le menu** : `_ctxKeep(fn)` joue l'action (les fonctions `ctx*` historiques ferment le menu), puis rouvre la fiche au même endroit (`_ctxPos`), à jour. ⚠️ Le gestionnaire « clic ailleurs = fermer » teste `e.composedPath()` et non `menu.contains(e.target)` : la pastille cliquée a été remplacée par le re-rendu et n'est plus dans le DOM au moment du clic global.
- Contraste : initiales en `--ink-deep` (le `--pencil` sur `--paper-deep` tombait à 4,12:1). 0 écart en clair et en sombre ; tient dans 375 px.

## Menu contextuel cellule (clic droit)

`showCtxMenu(e, cls, key, sid)` populate les libellés dynamiques + positionne le menu pour ne pas déborder.

**Items conditionnels** :
- ⚠️ **Contraintes non respectées (N)** : visible UNIQUEMENT si `getPlacementViolations(cls, sid, key)` renvoie ≥ 1. Handler `ctxShowViolations()` → ouvre `showViolationsModal(cls)` (modale `mviolations`).
- 🪪 Fiche complète : ouvre la fiche élève `mrw` (cf. section dédiée).
- **👥 Groupe ▸ Aucun / G1 / G2 / G3**, **🏷 Tags ▸** (liste du catalogue, ● = porté ; « ⚙ Gérer les tags… »), **🤝 AESH ▸** (AESH de la salle active, ● = liée ; « ⚙ Régler les AESH… » → Config Salle, mode AESH) et **✏️ Modifier l'élève…** — v2.69.0, audit 2026-10-03 § 2.2 : le plan est l'écran du cours, on n'y pouvait régler ni groupe ni tags ni AESH. Groupe via `_setGroupe(sid, g)` (aussi utilisé par `cycleGroupe`), qui **avertit** quand on règle le groupe depuis une classe recomposée : `stu.groupe` est unique, il change aussi dans la classe d'origine. `ctxSetAesh(idx)` refuse une AESH inexistante dans la salle.
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


## Barre du Plan et Vue Élève (extrait de « Conventions de développement » dans CLAUDE.md)

- **Barre du Plan (Prof) en trois rangées (v2.97.0, maquette validée le 2026-10-07)** : ① contexte `.pl-row1` (`#tg-salle-row`) — 📍 Salle + « ＋ », 📱 Tablettes, et à droite le compteur `#tg-count` en **pastilles** `.tgc-pill` (les deux sites qui l'écrivent posent `parts.map(…tgc-pill…)`, plus `parts.join(' · ')`) ; ② actions `.pl-row2` — Séance : **🔄 Vue Élève** puis **🎲 Interroger** en tête (v2.97.1, demande de l'utilisateur), puis **🙋 Faire l'appel** en bouton principal (`btn-p`), 📅 Appels passés en icône, 📣 Message · Placement : menu **🪑 Placer ▾** (v2.97.3, choisi parmi six propositions : la chaise = la place de l'élève ; 🔀 reste dans le menu, devant « Mélanger tout » et « Placer les non placés ») (non placés, mélanger, retirer toutes les positions), ⛓ Contraintes, 🔖 Instantanés en icône, ↩ ↪ · à droite 🖨 ▾, et **⋯ pour les tablettes** (affecter / désaffecter, `.ff-tablettes`) ; (le ⋯ des tablettes et le sélecteur 📱 Tablettes de la rangée 1 ont été retirés en v2.100.4) ; ③ affichage `.pl-row3`, **toujours visible** — Tous/G1/G2/G3, tags, 📄 ⏱ 📷, 💡, puis à droite Couleur en sélecteur `#tg-color-seg` (le `<select id="tg-color-mode">` est gardé caché : `renderTeacherGrid` le synchronise et pose `.on` sur le bouton du mode) et le zoom. ⚠️ **Appel en cours** : le code pose un fond en ligne `#3b82f6` que le `!important` de `.btn-p` écrase ; l'état se voit par un anneau `--highlighter`, ciblé sur l'attribut **sérialisé** `[style*="59, 130, 246"]` (le navigateur réécrit `#3b82f6` en `rgb(59, 130, 246)` — un sélecteur sur la valeur hexadécimale ne matche jamais), avec `!important` (une règle de thème annule le `box-shadow` des boutons). Audit : 0 écart en clair et en sombre (menus ouverts, mode appel, 4 modes de couleur) ; pas de débordement à 375 ni à 768 px.
  - **« 🔄 Vue Élève » / « 🔄 Vue prof » sont des boutons SECONDAIRES** (`btn-g`, v2.146.0) : avec `btn-p`, ils faisaient deux boutons principaux côte à côte avec « Faire l'appel », qui reste la seule action principale de la Séance.
  - ⚠️ **« 🔄 Vue Élève » (Plan) et « 🔄 Vue prof » (Vue Élève) sont au MÊME pixel**, suivis de 🎲 Interroger (v2.97.1) : on passe de l'un à l'autre sans bouger la souris. La Vue Élève reprend le même gabarit — rangée 1 `.pl-row1` (`min-height:40px` sur les deux, sinon la rangée du Plan, plus chargée, est 2 px plus haute), puis un groupe « Séance » qui commence par le bouton `.pl-vtoggle` (largeur minimale commune, les deux libellés n'ont pas la même longueur). Mesuré : (122, 145) dans les deux vues. ⚠️ Tout ajout AVANT ce bouton dans l'une des deux barres le décale : le faire dans les deux.
  - **Même menu 🖨 ▾ au même endroit** dans la Vue Élève (v2.97.2, à la place de « 🖨 Imprimer Vue Élève ») : copie du menu du Plan, à droite (`.pl-right`), avec « (Ctrl+P) » sur Plan Élève puisque c'est ce que Ctrl+P imprime là. Un **⋯ invisible** (`visibility:hidden`, classe `ff-tablettes` comme le vrai) tient la place du menu des tablettes du Plan, pour que 🖨 tombe au même pixel. ⚠️ Les deux menus sont des COPIES : une entrée d'impression ajoutée à l'un s'ajoute à l'autre.
  - **Largeur réduite (≤ 1280 px, écran en portrait)** (v2.98.1) : les mots secondaires sont dans des `<span class="pl-txt">` masqués (Message, Contraintes, Couleur, Salle, Tablettes) et les intitulés de groupe (`.tb-grp-lbl`) aussi ; l'icône et l'infobulle restent. Puces d'aménagement TOUJOURS courtes, comme dans l'onglet Élèves : **📄-A** (agrandissement) et **⏱+⅓** (tiers-temps) ; photos : **📷** / « 📷 Vign. » / « 📷 Trombi » (`_PLAN_PHOTO_LABELS`, infobulle par état `_PLAN_PHOTO_TIPS`). Mesuré à 1 080 px : rangées 2 et 3 sur une ligne ; la rangée 1 (compteur en pastilles) peut passer sur deux lignes, et alors « Vue Élève » / « Vue prof » ne sont plus au même pixel (sans effet dans la fenêtre de projection, qui n'a pas cette rangée).
  - **Onglet Élèves à largeur réduite (≤ 1280 px)** (v2.117.1, demande de l'utilisateur) : même règle `.pl-txt` étendue à `#tab-eleves` — « 🖼 Trombi », « 🧠 Mémo », « 📊 » seul pour la Vue d'ensemble, « ⋯ ▾ » pour le menu Plus.
  - **Vue Élève : UNE seule barre** (v2.98.0, demande de l'utilisateur) — Séance (🔄 Vue prof au même pixel que « Vue Élève » du Plan, 🎲 Interroger) · Afficher (Tous/G1/G2/G3, tags, 💡) · à droite zoom `.pl-seg` (`#sv-zoom-lbl` conservé), ⛶ (fenêtre de projection seulement), menu 🖨 ▾ (copie de celui du Plan — une entrée ajoutée à l'un s'ajoute à l'autre).
  - **« 🔄 Vue Élève » ouvre une FENÊTRE de projection** (`openStudentWindow`, `?projection=1`, nom `planClasse_vueEleve` ; un second clic la remet au premier plan ; fenêtre bloquée → toast et Vue Élève dans la fenêtre courante). La fenêtre prof reste en vue prof. Dans la fenêtre de projection (`_isProj()`, classe `body.proj-mode`) : en-tête, navigation, rangée des salles, widgets masqués ; bouton **⛶** plein écran (`_projToggleFullscreen`) ; **🔄 Vue prof la ferme** (`_svueBackToProf` : `window.close()`, repli sur la page normale si la fenêtre n'a pas été ouverte par le bouton). `init()` s'arrête à `_projInit()` (pas de dossier de sync, pas de vérification de mise à jour, pas de bienvenue).
    - ⚠️ **La fenêtre de projection est en LECTURE SEULE** : `save()` et `_saveAttTransient()` sortent tout de suite si `_isProj()`, et `showTab` n'y mémorise pas l'onglet. Sans cela, son `save()` de fermeture (`beforeunload`) écraserait avec son état ancien les modifications faites entre-temps dans la fenêtre prof. Tout nouveau chemin d'écriture de `S` hors `save()` doit respecter la même garde.
    - **Elle suit la fenêtre prof par l'événement `storage`** (déclenché dans les AUTRES fenêtres de la même origine à chaque écriture) : `LS_KEY` → `S` relu + `postLoadHook` ; `planClasse_attTransient` → absents / retards de l'appel en cours ; `planClasse_groupFilter` → filtre de groupe. Re-rendu groupé par `requestAnimationFrame` (`_projRerender`). Vérifié : un prénom modifié et un filtre G1 posés dans la fenêtre prof apparaissent aussitôt dans la projection.
    - La fenêtre prof ferme la projection en se fermant (`beforeunload`), sinon elle resterait figée sans source. ⚠️ Le panneau d'aperçu de l'app ne sait pas ouvrir de seconde fenêtre (il charge la page de projection à la place) : tester la projection en ouvrant `?projection=1` dans un second onglet.
