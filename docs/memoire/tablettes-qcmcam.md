# Tablettes et QCMcam

> Mémoire détaillée du projet, rangée depuis CLAUDE.md le 2026-10-29 (texte inchangé). Contenu : onglet Tablettes, picker, modèle par mode et classe mobile, fiche de prêt, réinitialisation du fichier (historique), désaffectation, affectation automatique, QCMcam (numérotation, export, marqueurs ArUco, impression des plans).

## Onglet Tablettes — modernisation v2.100.0 (maquette validée le 2026-10-07)

- **Barre de contexte** `.ip-row1` (`#ipad-pool-row`) : 📍 Salle · 📱 Classe mobile · **Pour** (`#ipad-mode-seg`, `.ip-seg`) = Classe entière / G1 / G2 / G3 (seulement les modes présents) / **Tous** (arbitrage : un sélecteur qui permet aussi de tout afficher). Choix mémorisé `planClasse_ipadMode` (`_ipadModeSel`, `_ipadSetMode`) ; un mode absent de la classe retombe sur le premier présent. Rangée d'actions `.ip-row2` : 📱 Affecter automatiquement (principal), 🗑 Désaffecter…, à droite 🖨 Fiche de prêt.
- **Bandeau** (`.bsynth`, cartes `_bsynthCard`) : affectées / élèves placés · sans tablette (clic = `_ipadToggleMissing`, filtre de session `_ipadOnlyMissing` : en Plan les autres cases s'estompent, en Liste seules ces lignes restent) · problèmes (hors service affectées + doublons) · chariot (disponibles, par lot). Remplace les trois bandeaux d'alerte. Les élèves partis / pas encore arrivés ne comptent pas (`_stuActiveOn`).
- **Plan par défaut / Liste** (`planClasse_ipadView`, `_ipadSetView`) : `_ipadPlanHTML` dessine la salle vue prof (r et c décroissants, comme le Plan), une pastille `.ip-tab` par mode affiché (préfixe CE/G1… en mode Tous) → `openIpadPicker(key, gf)` ; place libre = case **vide**, sans texte ni numéro (v2.100.1, demande de l'utilisateur) ; allées hachurées, AESH en rose. `_ipadListHTML` : un tableau par mode affiché (`ipad-tbl-<gf>`, tri `_ipadSort[gf]`, copie ⧉), état en **pastille** `.ip-dot` (orange = sans tablette, rouge = HS ou doublon) au lieu des lignes colorées. `_ipadTabChip` est commun aux deux vues.
- **Affectation manuelle au clic (v2.100.3, demande de l'utilisateur)** : sur le plan (et sur les pastilles de la liste), **clic gauche** sur une place sans tablette = la **tablette suivante du lot choisi** (`_ipadClickAssign` → `_ipadNextNum` : plus petit numéro disponible du lot, hors service exclus, pas déjà pris dans ce mode) ; clic gauche sur une place équipée = la retirer (toast, Ctrl+Z) ; **clic droit = la liste complète** (`openIpadPicker`, échange automatique). En mode simple, toute la case est cliquable (`.ip-click`) ; en mode Tous, chaque pastille agit sur son mode. Choix du lot dans la barre de vue (`_ipadLotBarHTML` : Tout / Lot …, avec « prochaine : n° N »), mémorisé par chariot dans `planClasse_ipadLot` (`_ipadLotSel`, `_ipadSetLot`).
- **Le Plan ne montre plus les tablettes (v2.100.4, demande de l'utilisateur : l'onglet Tablettes remplace tout ça)** : plus de pastille « Tab. N » dans les cases (`buildCell`, `_confBuildHiddenCell`), plus de menu ⋯ (affecter / désaffecter) dans la barre, plus de sélecteur de classe mobile (`#tg-pool-buttons`) dans la rangée 1. 🖨 ▾ est donc le dernier bouton de la rangée 2, comme en Vue Élève. Inchangé : l'impression « Plan Prof » garde les numéros de tablette et le récap ; le picker `openIpadPicker` et les règles CSS `.cipad` restent (onglet Tablettes, impressions).
- **Rappel légal** replié en une ligne (`<details id="ipad-legal">` « pourquoi ? ») — la clé d'aide `ipads` n'existe plus.
- **Classes mobiles** : en-tête par chariot avec la **bande des numéros** (`_poolStripHTML`, `.ip-strip` : une couleur par lot `.ipl0..3` avec variantes sombres, hors service barré `.iphs`) ; **clic sur un numéro = hors service / disponible** (`togglePoolUnavailableNum`, annulable, re-rend l'onglet). Réglages complets (nom, préfixe, chiffres, nombre, indisponibles au clavier, lots) dans un `<details>` « ✏️ Réglages », état gardé pour la session (`_poolEditOpen`).
- Audit : 0 écart en clair et en sombre (Plan, Liste, HS affectée, réglages dépliés) ; aucun débordement à 375 px (le plan défile dans `.ip-plan-wrap`).

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
- **Swap automatique** via `changeIpadAssign` existant. **Confirmation (`_uiConfirm`) demandée seulement si la tablette est occupée par un autre élève** ; si le siège est vide (assignation orpheline d'un élève supprimé), on prend la tablette sans demander.
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
Sous le récap dans l'onglet **Tablettes**, section **"⚙️ Configuration des classes mobiles"** : édition par pool (nom, préfixe, nb chiffres, nb tablettes, lots avec plages). Bouton **"+ Nouvelle classe mobile"** ouvre la modale `mpool-new` (sélecteur « Partir de » : vierge ou duplication d'un pool existant + nom suggéré automatiquement). Aperçu d'étiquette en direct (`<code>` à côté des champs).

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
- `printSuiviPret()` itère `pool.count` lignes, étiquette via `poolLabel()`, lot via `findPoolLot()`. Les numéros dans `pool.unavailable` apparaissent grisés avec mention "🚫 indisponible" en colspan sur les colonnes Élève/Remarque (le prof voit qu'elles sont HS au moment du prêt). **Nom du fichier PDF** (`document.title`, repris comme nom par défaut à l'impression) : `Suivi_Pret_Tablettes-<pool>-<classe+G?>-<AAAA-MM-JJ>-<horaire>`, parties vides omises (`.filter(Boolean)`), chaque morceau assaini (`[\\/:*?"<>|]` retirés, espaces → `_`). La date utilise `dateVal` (format ISO, tri chronologique).

### Fenêtre de la fiche de prêt — refonte v2.127.0 (maquette validée le 2026-10-08)
⚠️ **La fiche IMPRIMÉE n'a pas changé d'un octet** (arbitrage : elle doit avoir la forme de la fiche vierge rangée avec les tablettes, remplie à la main sinon ; pas de colonne « Rendue » — rendre la tablette n'est pas optionnel, sinon c'est un incident ; toutes les lignes, pour pouvoir corriger à la main). Vérifié en comparant l'ancienne fonction (version précédente) et la nouvelle sur 4 cas (salles, classe entière, G1, G2) : HTML identique.
- Le HTML de la fiche est construit par **`_iprintBuildHTML()`**, **sans rien modifier** (lit `cls.rooms[salle].ipadsByPool[pool][ce|g1|g2|g3]` directement, au lieu de basculer la salle et la classe mobile actives) ; `printSuiviPret` l'imprime puis, comme avant, met la salle et la classe mobile de la fiche en salle / pool actifs de la classe.
- Fenêtre en deux colonnes : classes mobiles en pastilles (avec leur nombre), date (Aujourd'hui, −1 j, +1 j, vide), **créneaux tirés de l'emploi du temps de la salle pour le jour de la date** (`_iprintSlots` → `getSalleSchedule`, avec l'heure de début ; créneau en cours présélectionné par `_iprintAutoSlot` si la date est aujourd'hui ; « vide » possible), classe, salle et groupe en pastilles (**groupe présélectionné d'après « Pour » de l'onglet Tablettes**, v2.144.3 : G1/G2/G3 s'il existe dans la classe, sinon classe entière — « Tous » donne la classe entière), professeur ; à droite **aperçu de la vraie fiche** réduite (`.ipr-page`, page blanche dans les deux thèmes) et total (affectées, libres, indisponibles).
- Audit : 0 écart en clair et en sombre ; 363 px à 375.

### Réinitialisation du fichier (modal `mreset`)
Entrée **🗑 Réinitialiser le fichier…** du menu **💾 Données ▾** (v2.73.0 — avant, bouton de l'onglet Classes : il agit sur tout le fichier, pas sur les classes). Ouvre la modale `mreset` (récap des compteurs actuels + 3 options). Refondue le 2026-08-02 : les deux premières options n'étaient ni cohérentes ni utiles — « conserver les salles » ne conservait QUE les salles et les classes mobiles, en jetant les disciplines, le référentiel, les commentaires types et les motifs d'ajustement, c'est-à-dire précisément ce qu'un enseignant paramètre une fois pour toutes.

- ⚠️ **Depuis v2.133.0, une seule fenêtre `mreset`** (les fenêtres `mresetyear` et `mresetnuke` ont été supprimées) : cf. *Fenêtres fichier et système*.
- **🎓 Fin d'année scolaire** (`resetEndOfYear()` → `openResetModal('year')` → `_doResetEndOfYear(exportFirst)`) :
  - ⚠️ **La frontière est : indexé par élève ou par classe → part ; paramétré une fois pour toutes → reste.** **Toute nouvelle section de `S` doit être rangée dans l'un des deux camps** — une section oubliée SURVIT par défaut, ce qui est le mauvais côté pour une donnée d'année. Un test (`run.test.js`) monte un état maximal et vérifie les deux camps.
  - **Vidé** : `classes` (les recomposées avec), `eleves`, `evaluations`, `snapshots`, `attendance`, `seatingSnapshots`, `movedHighlights`, `bulletinRemarques`/`ClassRemarques`/`WorkedItems`, `conseilClasse` (les **attributions**), `cur`.
  - **Conservé** : `salles` (dimensions, places vides, horaires, patterns de ramassage, options de mélange, places exclues QCMCam), `tabletPools`, `tags` (le **catalogue**), `disciplines`, `competences`, `competenceDomains`, `evalPrefs` (dont `adjustPresets`), `evalCommentLibrary`, `conseilMentions`, `conseilIncompat`, `userLinks`, `featureFlags`.
  - ⚠️ **La confirmation propose « 💾 Exporter puis effacer » comme action principale**, pas un simple rappel de sauvegarder — un rappel s'ignore d'un clic, l'effacement ne se rattrape plus une fois l'onglet fermé. **Si l'export échoue, RIEN n'est effacé** (même règle que l'archivage avant résolution de conflit) : toast d'erreur, bouton réarmé, modale laissée ouverte.
  - Les classes sont bien **effacées**, pas conservées vides — arbitrage de l'utilisateur. Conséquence assumée, écrite dans la modale : les zones de groupes peintes sur les places et le placement des AESH partent avec les classes (ils vivent dans `cls.rooms[salleId]`, pas dans `S.salles`).
- **🔥 Tout effacer** (`resetEverything()`) : le fichier redevient ce qu'il était au tout premier lancement, **réglages et personnalisations compris**. La fenêtre (mode « Tout effacer ») les énumère et renvoie explicitement vers « Fin d'année scolaire » pour qui voulait les garder — c'est la seule différence entre les deux options, elle doit être lisible avant le geste. **Confirmation par saisie** de `EFFACER TOUT`. `postLoadHook()` rappelé après → recrée les défauts (pools CM1/CM2, référentiel C1–C8, prefs, mentions, pack de commentaires).
- **🧪 Charger les données de démo** (`loadDemoOnDemand()`) : cf. section *Données de démo*.

Toutes appellent ensuite `save()`, ferment la modale, `refreshSelector()` et re-render l'onglet courant. `pushUndo()` avant : annulable par Ctrl+Z **tant que l'onglet reste ouvert** — la formulation « dans la session courante » a été remplacée partout, elle laissait croire à une durabilité qu'un F5 dément.

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
- **Modes à affecter** (`#ipm-modes`, `_renderIpmModes`) : cases à cocher **Classe entière / Groupe 1 / 2 / 3**, cumulables. `_ipmSelectedModes()` renvoie un tableau d'entiers (`0` = classe entière).
  - ⚠️ **Avant, le mode était déduit de `groupFilter`** — le filtre groupe du Plan Prof. Depuis l'onglet **Tablettes** ce filtre n'est ni visible ni modifiable : on ne pouvait donc y affecter que le mode hérité du dernier passage dans Plan Prof, sans le savoir. Le filtre ne sert plus qu'à **pré-cocher**.
  - Un groupe **sans aucun élève dans la classe** est proposé désactivé (compté sur le roster, pas sur les places de la salle active — l'affectation peut porter sur d'autres salles).
  - Le bouton d'action est unique (`#ipm-btn-go`), désactivé tant qu'aucun mode n'est coché. Les deux anciens boutons (« Mode actif uniquement » / « Tous les modes ») ont disparu : ils sont devenus « CE cochée seule » et « les quatre cochées ».
  - Le champ d'exclusion de tables ne concerne **que** la classe entière (rappelé dans le libellé et dans la ligne d'info).
- **Étendue** (deux checkboxes) :
  - `ipm-all-pools` : Affecter aussi aux autres classes mobiles
  - `ipm-all-rooms` : Affecter aussi aux autres salles de cette classe
- L'algorithme utilise les **numéros disponibles** du pool (`poolAvailableNumbers(pool)`) au lieu de 1..N. Les indisponibles sont sautés.
- Mode CE : assigne à **toutes** les tables non-`positions_vides` et non-exclues (même tables vides — pour faciliter la distribution physique fixe). Modes G1/G2 : seulement les sièges occupés par des élèves du groupe.
- ⚠️ **En classe entière, le numéro est une propriété de la TABLE, pas de son occupant.** `_ceTargets` attribue un `rank` à chaque table et c'est lui qui indexe `availableNums` — les tablettes restant physiquement posées d'une classe à l'autre, la table 3 doit porter la même tablette pour toutes les classes qui occupent la salle.
  - **Une place occupée par une AESH consomme son rang** sans recevoir de tablette. Sinon la numérotation se compacte et tout décale derrière elle : une salle avec une AESH en 2ᵉ place donnait 1, 2, 3 aux tables 1, 3, 4, alors que la classe suivante — sans AESH — donnait 1, 2, 3, 4 aux mêmes tables. La tablette posée sur la table 3 aurait dû être à la fois la 2 et la 3. **Signalé en usage réel**, pas détecté par les tests, qui ne regardaient que le nombre d'affectations.
  - **Les tables du champ d'exclusion, elles, ne consomment rien** : le champ les sort de la disposition, ce qui est son but (libérer des tablettes). Distinction volontaire, couverte par deux tests.
  - Le **besoin** d'une combinaison en CE n'est donc pas le nombre de tables servies mais **le rang de la dernière + 1** : il faut assez de numéros pour l'atteindre.
  - ⚠️ **Exception : les tables choisies à la main** dans `mipovf` (débordement). Là on distribue à la suite (`positional = keepKeys == null`) : par définition il n'y a pas assez de numéros pour couvrir tous les rangs, et l'utilisateur vient précisément de désigner les tables à servir. Le rang deviendrait un piège — une table cochée pourrait ne rien recevoir.
- `autoIpads()` (sans argument — les modes viennent des cases) construit une **file d'attente** (`_ipovfQueue`) de toutes les combinaisons (room × pool) sélectionnées, fait `pushUndo()` une seule fois au début, puis appelle `_processNextCombination()` qui itère :
  - Pour chaque combinaison, le besoin est le **plus gourmand des modes cochés** — chaque mode a sa propre numérotation, ils se partagent le stock sans s'additionner
  - `_applyAssignmentFor(cls, modes, …)` boucle sur les modes ; `mipovf` propose les cibles de la classe entière si elle est cochée (elles couvrent toutes les tables), sinon l'**union** des groupes cochés (disjointe : un élève n'a qu'un groupe)
  - Si `needed ≤ available` → `_applyAssignmentFor()` directement, passe à la suivante
  - Si `needed > available` → ouvre `mipovf` (modale plan visuel) avec **bandeau de contexte** "📍 Combinaison X/Y — Salle ... × Classe mobile ..." (affiché si la file contient ≥ 2 combinaisons via flag `multi`).
  - À la fin de la file : `_finishAutoIpads()` restaure `cls.activeRoom`/`cls.activePool` d'origine, save, render, toast récap (`N affectations effectuées (dont M avec choix de tables)`).

#### Restriction à un ou plusieurs lots

Le chariot est souvent partagé : on n'a parfois qu'un lot sous la main et il faut équiper la classe entière avec. La modale `mip` propose donc des cases à cocher **par lot** (`#ipm-lot-row`, rendues par `_renderIpmLots` à chaque changement de classe mobile ; masquées si le pool n'a pas de lots). **Aucune case cochée = toute la classe mobile.**

- `_ipmSelectedNumbers(pool)` — les numéros disponibles ∩ les plages des lots cochés (les indisponibles restent exclus).
- `_ipmSelectedLotLabel()` — libellé pour les bandeaux (`null` si toute la classe mobile).
- `_updateIpmLotInfo()` — compteur en direct sous les cases, qui annonce l'ouverture du plan si le compte ne suffit pas.

⚠️ **La restriction ne s'applique qu'à la classe mobile CHOISIE dans le sélecteur.** Si « affecter aussi aux autres classes mobiles » est coché, les autres pools gardent toutes leurs tablettes : un lot est une plage de numéros propre à son pool, la notion n'a aucun sens transposée à un autre chariot. `autoIpads` porte `lotLabel` sur chaque combinaison, et seule celle du pool choisi le reçoit.

💡 **Aucun mécanisme nouveau n'était nécessaire pour le cas « pas assez de tablettes »** : `_processNextCombination` ouvre déjà `mipovf` dès que `needed > available.length`. Réduire `available` à un lot déclenche donc le plan visuel tout seul. Le lot est rappelé dans le bandeau de contexte et dans la phrase d'explication.

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

## QCMCam — numérotation et marqueurs ArUco

### Onglet — modernisation v2.101.0 (maquette validée le 2026-10-07)

- **Rangée 1** `#qcm-salle-row` : 📍 Salle, et à droite `#qcm-num-info` (numérotation de la salle, nombre de places, plage de n°). **Rangée 2** `.qc-row2` en groupes `.tb-grp` : Liste élèves (💾 Exporter pour QCMcam en principal, ⧉ Copier = `copyQcmAllClasses`, puis le **bouton du dossier de destination** `#qcm-dir-info` → `pickQcmDir` : « 📂 Choisir le dossier… » tant qu'aucun n'est choisi, « 📂 nom » ensuite, masqué sans `showDirectoryPicker` — v2.101.1, demande de l'utilisateur qui ne trouvait pas le réglage) · Marqueurs (🎯 Marqueurs et plans — le bouton « 🗺 Plans des salles » a été retiré en v2.128.1, la fenêtre des marqueurs imprime aussi les plans) · Résultats (📂 Importer…) · à droite ❔ Comment ça marche ?
- **Largeur réduite (≤ 1280 px)** (v2.101.3, demande de l'utilisateur) : « 💾 Exporter », « 🗺 Plans », « ❔ » — la fin des libellés est dans `.pl-txt`, masqué par la même règle que le Plan et la Vue Élève.
- ⚠️ **Le dossier QCMcam n'est plus oublié au démarrage** (v2.101.1) : `tryRestoreQcmDirHandle` gardait le handle seulement si l'autorisation était déjà « granted » — or après un redémarrage du navigateur elle est en général « prompt », donc il fallait rechoisir le dossier à chaque session. On le garde (sauf « denied ») ; `exportQcmCsv` redemande l'autorisation au moment d'écrire.
- **Aide regroupée et repliée par défaut** (`#qcm-help`, `_qcmHelpToggle`, non mémorisé) : principe de QCMcam, usage un marqueur par place, format des noms, règles de numérotation, incompatibilité avec QCMcam 1. La clé d'aide `qcm` (`data-help`) n'existe plus. **Remerciements** à Sébastien Cogez : une ligne `.qcm-credits` en pied d'onglet, toujours visible.
- **Bandeau** (`.bsynth`) : Export (lignes, classes, salles, identifiants classe-salle — calculé par `_allQcmLines`) · Cette classe (élèves avec un n° / total, sans place NA…, au-delà de 157) · Marqueurs (plage à coller dans la salle, places exclues) · **« Remplacer » dans QCMcam 2** en carte permanente (`.qcm-card-warn`, arbitrage de l'utilisateur).
- **Plan par défaut / Liste** (`planClasse_qcmView`, `_qcmSetView`, mêmes boutons `.ip-seg` que l'onglet Tablettes). Plan = `_buildQcmPlanHTML` avec les numéros agrandis par CSS **limité à `#qcm-sum`** (l'impression des plans écrit ailleurs, `#qcm-plan-print-area`), puis les élèves **sans place** en puces (`.qcm-na-chip`, NA1…). Liste = l'ancien tableau, avec « ⧉ Copier cette classe (sans en-tête) » (`copyQcmAll`).
- Audit : 0 écart en clair et en sombre (Plan, Liste, aide dépliée) ; aucun débordement à 375 px.

### Stratégie de numérotation (`_qcmNumbering(cls, salleId)`)

QCMCam utilise des marqueurs ArUco 4×4 limités à **1–`ARUCO_MAX`** (157 depuis QCMcam 2 ; 125 auparavant). La fonction `_qcmNumbering` retourne `{ keyToNum, numToKey, strategy, step, isSequential, max, overflowCount, total, userExcluded }` et choisit automatiquement la stratégie la plus lisible :

- **Cas 1 — `strategy: 'lisible-10'` (pas = 10)** — si `cols ≤ 10 ET rows ≤ 15`
  - `n = rangée × 10 + position` (position = 1 à gauche, cols à droite en vue prof)
  - Max possible : `14×10 + 10 = 150` ≤ 157
  - Numéros parlants : `23` = rangée 2, place 3 depuis la gauche

- **Cas 2 — `strategy: 'lisible-20'` (pas = 20)** — si `cols ≤ 15 ET rows ≤ 8` (et hors Cas 1)
  - `n = rangée × 20 + position`
  - Max possible : `7×20 + 15 = 155` ≤ 157
  - Trou de 5 numéros entre rangées (16-20, 36-40… non utilisés) pour préserver la lisibilité "dizaines = rangée"
  - Numéros parlants : `23` = rangée 1, place 3 depuis la gauche

- **Cas 3 — `strategy: 'sequential'`** — pour toute salle au-delà de ces deux cas
  - Numérotation `1..N` dans l'ordre vue prof (rangée la plus proche du prof `r=0` d'abord, puis vers le fond ; gauche → droite dans chaque rangée), en sautant les `positions_vides` ET les `salle.qcmExcluded` (cf. ci-dessous)
  - Si encore > `ARUCO_MAX` après exclusion : tronqué (`overflowCount`)
  - Plus de signification rangée/place dans le numéro lui-même

**Priorité Cas 1 vs Cas 2** : quand les deux s'appliquent (ex. 5×8 entre dans les deux), **Cas 1 gagne** (numéros plus serrés, plus dense visuellement).

### Export de la liste d'élèves (`_allQcmLines` + `QCM_EXPORT_HEADER`)

TSV `Marqueur ⇥ Prénom ⇥ Groupe`, précédé d'une **ligne d'en-tête** (`QCM_EXPORT_HEADER`), une ligne par élève de chaque couple classe × salle. Ajouté au fichier ET à la copie presse-papier par les deux appelants (`exportQcmCsv`, `copyQcmAllClasses`) — `_allQcmLines()` ne renvoie que les lignes de données, pour que les compteurs des toasts restent justes.

- **L'en-tête est auto-reconnu par l'assistant d'import de QCMcam 2** (`ModalImportGroups.svelte` : `normalizeHeader` met en minuscules, retire les accents, et compare à `{ prenom, nom, groupe, marqueur }`). Vérifié sur `q2.qcmcam.net` : les trois `<select>` se pré-remplissent en vert et la ligne d'en-tête est cochée « ignorer » automatiquement. Sans lui, il faut mapper les colonnes à la main à chaque import.
- ⚠️ **Le nom affiché part dans « Prénom », jamais dans « Nom »** — c'est un libellé unique (`getDisplayName`, prénom désambiguïsé par un préfixe de nom si besoin), pas un couple. Peu importe laquelle des deux colonnes, mais il faut que ce soit toujours **la même** : QCMcam apparie ses élèves sur (nom, prénom).
- ⚠️ **Les non-placés gardent `NA1`, `NA2`…** C'est délibéré et vérifié en conditions réelles. QCMcam fait `Number(marqueur)` puis `markerId > 0 ? markerId : 0` : `NA1` → `NaN` → **0**, c'est-à-dire « pas de carte », exactement leur statut. Les deux alternatives sont pires, testées sur `q2` :
  - **`0` écrit explicitement** → le garde-fou anti-doublon d'`addStudent` compare *avant* la coercition, `0 === 0` est vrai, donc seul le **premier** non-placé est importé et les autres disparaissent **sans message** ;
  - **colonne vide** → QCMcam renumérote à partir de 1 par groupe **sans regarder les numéros déjà pris**, ce qui entre en collision avec les élèves placés et fait perdre les doublons, toujours en silence.
  Avec `NaN`, le test de doublon échoue (`NaN === NaN` est faux) et **tous** les non-placés passent. À ne pas « corriger ».
- ⚠️ **À l'import, choisir « Remplacer », pas « Mettre à jour ».** `Group.syncStudents` n'ajoute que les élèves absents et ne retire que les partis (appariement sur nom + prénom) : un élève déjà présent n'est **jamais** modifié, numéro de carte compris. Après un mélange de plan, « Mettre à jour » ne change donc rien (mesuré : « 0 groupe(s) et 0 élève(s) »). Rappel dans l'infobulle du bouton d'export.

### Cohérence avec la saisie position (Élèves)
- `seatQCMToKey(input, cls)` utilise désormais `_qcmNumbering(cls, cls.activeRoom).numToKey` pour parser le numéro tapé — le nombre saisi correspond exactement à celui affiché dans l'onglet QCMCam et imprimé sur le marqueur ArUco.
- Helper `qcmNumForCell(cls, salleId, r, c)` pour les lookups one-off (utilisé dans `renderStudents`, `exportNotesCsv`, etc.).
- `seatLabelQCM` (formule simple `r*10+pos`) reste comme fallback quand aucune salle active n'est connue du contexte.

### Bandeau des exclusions devenues sans effet (`_qcmClearExclusions`)

⚠️ **Ne concerne QUE `salle.qcmExcluded`** (« cette table n'aura pas de marqueur », posé au clic sur le plan QCMCam), **jamais `positions_vides`** (« il n'y a pas de table ici »), qui sert à ménager les allées et l'espace entre les groupes et n'a aucun rapport avec la limite du dictionnaire. Les deux se ressemblent à l'écrit, pas à l'usage.

L'élargissement des bornes (125 → 157) rend certaines exclusions caduques, dans deux situations toutes deux **silencieuses** :
- **la salle n'est plus en séquentiel** — `_qcmNumbering` ne lit `qcmExcluded` que dans la branche Cas 3, donc les places ont retrouvé un numéro toutes seules et la liste dort. Et comme le clic d'exclusion n'est proposé **qu'en** séquentiel, elles ne sont ni visibles ni modifiables depuis le plan — elles se réappliqueraient sans prévenir si la salle y repassait (ajout de colonnes) ;
- **la salle est encore en séquentiel mais ne déborde plus** — l'exclusion continue de s'appliquer alors qu'il y a désormais la place.

Un bandeau dans l'onglet QCMCam signale les deux cas, avec un bouton **↺ Réintégrer ces places** (`_qcmClearExclusions` : `_uiConfirm` + `pushUndo` + vidage + rappel de réimprimer, la numérotation des autres places pouvant se décaler).

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
- Rouge (`overflowCount > 0`) : "*N places au-delà de la 157e — ces places n'ont pas de numéro QCMCam et n'apparaissent pas dans l'export.*" + invitation à cliquer.
- Orange (`isSequential` sans overflow) : "*Numérotation séquentielle — la formule habituelle dépasserait 157, les numéros ne correspondent plus à la position physique.*"

### Crédits Sébastien COGEZ
Pied du bandeau d'info de l'onglet QCMCam (italique, 0.78em, séparé par un filet dashed) : remerciements à Sébastien COGEZ + mention licence CC BY-NC-SA 4.0 pour les marqueurs ArUco distribués par QCMcam. Présent aussi dans la zone "papier à jeter" des impressions de marqueurs ArUco générés localement.

### Modale "🎯 Marqueurs ArUco" (`mqcmmarkers`)

Accessible via le bouton **🎯 Marqueurs ArUco** dans l'onglet QCMCam OU par **Ctrl+P** sur cet onglet. 3 cartes :

1. **📥 Planches officielles** — lien vers la page « Cartes » de QCMcam 2 (`?view=marker&action=download`) : PDF prêts à imprimer en A5/A4 par tranches de 30 (1-30, 31-60, 61-90), dictionnaire `4x4_157h3`. ⚠️ Les anciennes planches de `qcmcam.net` (dictionnaire 125) ne conviennent plus — leurs URL renvoient d'ailleurs 404 sur `q2`, ne pas se contenter de réécrire le domaine.
2. **🛠 Générateur en ligne** — lien vers le générateur personnalisable de QCMcam 2 (`q2.qcmcam.net/?view=marker&action=generate`, numéros 1-157, marqueurs nominatifs depuis un CSV)
3. **🎯 Générateur intégré local** (carte verte) — voir ci-dessous

### Générateur ArUco intégré (`printSalleArucoMarkers`)

Génère localement uniquement les marqueurs correspondant aux places utiles de la salle active. Un jeu par salle, réutilisable entre classes.

**Algo** — dictionnaire **`QCMCAM_4X4_157h3`** de QCMcam 2 (`src/lib/js/aruco.js`), miroir de son `AR.Dictionary.generateCANVAS` :
- `_ARUCO_CODES[n - 1]` — 157 entiers de 16 bits (`ARUCO_MAX = 157`), le marqueur n° n est l'entrée `n-1`
- code → binaire sur 16 bits, lu **en ligne** (`bits[y*4 + x]`) ; bit à **1 = case BLANCHE**
- Matrice 6×6 : bordure noire + 4×4 data au centre

⚠️ **Rupture avec l'ancien dictionnaire** (`markers4x4.js` de qcmcam.net v1, 125 motifs encodés en base 4 via `_ARUCO_N_TO_RAW` / `_ARUCO_OPTS`, supprimés en 2.39.0) : les 125 anciennes matrices ont été comparées une à une aux 157 nouvelles, **rotations comprises — aucune ne correspond**. Passer à QCMcam 2 impose donc de **réimprimer tous les marqueurs collés sur les tables**, et les nouveaux ne sont pas lus par l'ancien qcmcam.net. Un bandeau `.al-w` le dit dans l'onglet QCMCam.

💡 **Méthode de vérification de l'encodage** (à rejouer si le dictionnaire rechange) : ouvrir le générateur officiel (`q2.qcmcam.net/?view=marker`), lire les pixels du canvas 720×720 au centre de chaque module (quiet zone 90 px, bordure 90 px, cellules de 90 px à partir de 180) et comparer la chaîne de 16 bits à `_ARUCO_CODES[n-1].toString(2)`. Fait sur les n° 1, 2, 42, 100 et 157 : identiques. Un test complémentaire exécute `_arucoDrawMarker` sur un canvas bouchon et vérifie la matrice 6×6 réellement peinte — la comparaison de chaînes seule ne verrait pas une transposition ligne/colonne.
- Lettres **A/B/C/D** + numéro côte à côte sur les 4 côtés, tous en **10pt physique** (calibré par calcul `numFs_px = 3.528 × W / sizeMm`). Anti-triche : illisible depuis la place du voisin.
- Marqueur central = 82% du canvas (gros gain de surface utile après passage de la lettre à 10pt)

**Orientation des cartes — anti-copie** (`_arucoRotationsForRoom`, `_arucoSeatHash`) :

Le verso porte le numéro en grand. Sans rotation, un élève voit le verso de son voisin et en déduit « haut du verso = A au recto », donc sa réponse. Chaque recto est donc tourné d'un quart de tour (la matrice ArUco est invariante par rotation, la détection reste correcte).

⚠️ **Le tirage est CONTRAINT, pas simplement aléatoire** : avec 4 orientations indépendantes, deux voisins de rangée tombent sur la même **une fois sur quatre** — or c'est justement le voisin de gauche ou de droite qu'on recopie, et même orientation = la position de la carte levée donne directement sa réponse. Places séparées par une allée traitées comme voisines — plus strict que nécessaire, sans coût.

**On ne tire pas l'orientation, on tire l'ÉCART** avec la place précédente (90 / 180 / 270, jamais 0), **par triplets** : chaque groupe de trois pas consécutifs utilise les trois écarts une fois chacun dans un ordre tiré au sort, et le premier écart d'un triplet ne répète jamais le dernier du précédent. Donc écarts exactement équilibrés **et** jamais deux pas de suite au même écart.

⚠️ **`_arucoSeatHash` termine par un brassage d'avalanche (murmur3 fmix32), ce n'est pas décoratif.** Avec FNV-1a seul, deux places voisines ne diffèrent que par le dernier caractère de la clé et le `% 3` en aval était biaisé : **mesuré sur 7 000 paires, 180° à 38,5 % et 270° à 26 %** au lieu de 33,3 %. Le tirage était uniforme *sur le papier* — le défaut a été **signalé en usage réel** (« celles qui suivent sont souvent juste à 180° »), pas trouvé au raisonnement. Un test mesure désormais la distribution sur ~1 900 paires et échoue au-delà de 3 points d'écart. **Leçon générale : un `% n` sur une empreinte faiblement brassée n'est pas uniforme, quelle que soit la propreté de l'argument théorique.**

⚠️ **DÉTERMINISTE** (empreinte FNV-1a de `salleId|r,c`), surtout pas `Math.random()` : une carte perdue doit se réimprimer **à l'identique**, sinon le nouveau tirage peut tomber sur l'orientation d'une voisine restée sur la table et rouvrir le trou qu'on vient de boucher, sans que rien ne le signale. Le motif reste imprévisible (empreinte, pas suite régulière) et l'orientation d'une carte collée sur une table est de toute façon figée pour l'année. Corollaire : `printSalleArucoMarkers` calcule les orientations sur **toute la salle**, même en réimpression d'un sous-ensemble — d'où le `_qcmNumbering` désormais fait dans les deux branches. Repli sur l'empreinte du seul numéro si la place est inconnue.

Deux tests couvrent ces deux propriétés (aucune collision de voisinage sur une salle à allée + place manquante ; deux appels identiques, et motif différent d'une salle à l'autre).

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

**Verso** : numéro géant centré dans la zone marqueur, **souligné pour les seuls huit numéros retournables** (`<span class="am-back-num">`, `border-bottom: .07em`).

⚠️ **Le souligné est un repère de SENS DE LECTURE, pas une décoration.** Sans lui, un carré découpé portant un `6` se lit `9` selon le sens où on le prend — marqueur collé sur la mauvaise table, donc réponses QCMCam attribuées au mauvais élève.

**`_ARUCO_ROT_AMBIGU = {6, 9, 66, 68, 86, 89, 98, 99}`.** Dérivation, **à rejouer si la plage (1–`ARUCO_MAX`), la police du verso (Arial) ou la convention d'écriture changent** — rejouée au passage à 157 : de 100 à 157 tous les numéros contiennent un `1`, donc s'orientent seuls, **ensemble inchangé** :
- Chiffres qui restent des chiffres après rotation à 180° : `0→0`, `6→9`, `8→8`, `9→6`.
- Le `1` se retourne en `1` mais **l'Arial le trahit** (empattement en haut à gauche, base plate) : sa présence révèle l'orientation, donc tout numéro contenant un `1` s'oriente seul. Inutile de le souligner.
- Les marqueurs s'écrivent **sans zéro de tête** : `60`/`80`/`90` deviennent `09`/`08`/`06`, qui n'existent pas → le sens se déduit là aussi.
- Restent les nombres faits de `{0,6,8,9}` : `8`, `88`, `69`, `96` sont **identiques** après rotation (rien à signaler) ; les huit autres sont ambigus deux à deux (`6↔9`, `66↔99`, `68↔89`, `86↔98`).

Les 117 numéros restants gardent un chiffre **plus grand** (124 mm contre 105 mm en 4/page pour un chiffre unique), puisque la place du trait n'est réservée que quand il est présent. Le **recto** n'a jamais eu ce problème : préfixe `n°` + lettre A/B/C/D sur les 4 côtés lèvent déjà l'ambiguïté.

**Font-size calculée dynamiquement** en JS pour que le chiffre tienne dans le carré quel que soit le nombre de chiffres (1, 2 ou 3), le dénominateur réservant la place du trait seulement s'il y en a un :
```js
const maxByWidth  = (zoneSizeMm * 0.85) / (0.6 * digits + (ambigu ? 0.16 : 0));
const maxByHeight = (zoneSizeMm * 0.85) / (ambigu ? 0.85 : 0.72);
const fs = Math.min(maxByWidth, maxByHeight); // appliqué via style.fontSize = fs + 'mm'
```
Occupation mesurée (4/page) : `6` souligné 98 % de hauteur, `8` nu 100 %, `66` souligné 61 %, `118` nu 100 % — aucun débordement.

**Réimpression de numéros perdus** : sous-section "🔁 Réimprimer des n° précis" avec champ texte qui accepte un format flexible (`5, 12-15, 23`). Parsé par `_parseArucoNumberList(text, max)` (gère virgules/espaces/point-virgules, plages avec tiret). Passé à `printSalleArucoMarkers(perPage, { customNums: [...] })`.

**Toast d'impression** rappelle de désactiver les marges du navigateur (« Marges : Aucune ») — les marges UI par défaut peuvent contrer le `margin:0` CSS.
