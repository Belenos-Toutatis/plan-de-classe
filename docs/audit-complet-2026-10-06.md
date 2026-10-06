# Audit complet — v2.78.1 (2026-10-06)

Audit multi-axes de l'application, rejoué sur la version `2.78.1` (commit `2af85a5`),
données de démonstration installées (8 classes dont 2 recomposées, 174 élèves,
41 évaluations, 4 salles), servie en `http://127.0.0.1` dans un Chromium.

**Verdict général : l'application est saine.** Les tests passent, aucune erreur
d'exécution, aucune anomalie d'intégrité, l'impression est irréprochable, les
performances sont confortables à l'échelle d'une année complète. Les défauts trouvés
sont **12 écarts de contraste**, **1 régression responsive**, **2 modales qui
contournent `openMod`** et **du code mort**. Tous sont localisés et corrigeables
indépendamment.

---

## 1. Ce qui a été vérifié, et comment

| Axe | Méthode | Résultat |
|---|---|---|
| Tests | `npm test` (8 fichiers) | **195/195** |
| Erreurs d'exécution | 11 onglets, 42 modales par leur vrai ouvreur, 4 tableurs, 11 chemins d'impression | **0** (`window.__planClasseErrors`) |
| Intégrité du modèle | `_auditState({repair:false})` après tout le parcours | **0 anomalie** |
| Contraste écran | auditeur WCAG injecté (fond effectif, opacité cumulée, seuils 4,5 / 3,0), **chargement frais par thème**, transitions neutralisées | **1 écart en clair, 5 en sombre** sur 11 onglets + 25 sous-états |
| Contraste modales | 96 modales statiques forcées + 42 ouvertes par leur vrai ouvreur + 4 tableurs + menus par groupe | **5 familles** |
| Contraste impression | règles `@media print` réinjectées en règles d'écran, audit dans un `window.print()` bouchonné, **thème sombre actif** | **0 écart** sur 10 chemins |
| Clavier / ARIA des modales | `openMod` sur 96 modales : `role`, `aria-modal`, focus initial (après 150 ms), Échap | 96/96 **sauf 2 ouvreurs qui court-circuitent `openMod`** |
| Responsive | 375×812, 812×375, 768×1024, 1024×768 — débordement = élément dont le bord droit dépasse sans ancêtre défilant | **2 gabarits en défaut** |
| Performance | montée en charge à 20 classes / 522 élèves / 123 évals (871 Ko) | tout ≤ 104 ms |
| Stockage | jauge ⓘ, `localStorage`, IndexedDB | 310 Ko / 2,9 Go, régime « quota » |
| Statique | 13 batteries (dialogues natifs, branches `ev.type`, tokens sombres vs impression, littéraux de couleur, ids dupliqués, fonctions redéfinies, TDZ, clés `localStorage`, handlers morts, `eval`, CSP…) | voir § 4 |

⚠️ **Deux pièges de mesure rencontrés, à retenir pour les prochains audits.**

1. **Basculer le thème dans la page fausse la mesure.** Mesurer après
   `data-theme = dark` (même dans un appel séparé, même après un reflow) renvoyait pour
   `.nb` la couleur de l'ancien thème — d'où ~24 faux positifs à 1,28 / 1,69:1 sur toute
   la barre d'onglets. **Le seul protocole fiable est un rechargement complet par thème**
   (`localStorage.planClasse_theme` puis `location.reload()`), transitions neutralisées
   après chargement. Vérifié : au rechargement, et après un vrai clic sur `◐` suivi de 2 s,
   la barre d'onglets est correcte (4,6:1) — c'était bien l'instrument, pas l'application.
2. **Un auditeur DOM lit `color`, pas `fill` : il ne sait pas mesurer un `<text>` SVG.**
   Le « 🖥 TABLEAU » du schéma des îlots a été rapporté à 1,40:1 alors qu'il est
   `fill="#fff"` sur un `<rect fill="#1a252f">`, soit ~15:1. Écarter les `<text>` SVG ou
   leur faire un traitement propre. (Les 9 étiquettes `Î1`…`Î9` du même schéma ont été
   vérifiées géométriquement : elles tombent toutes sur une table claire, donc lisibles.)

---

## 2. Défauts à corriger

### 2.1 Contraste — sévères

| # | Où | Mesure | Cause | Correction |
|---|---|---|---|---|
| **C1** | `mclear-ipads` (🗑 Désaffecter les tablettes) — les 2 descriptions sous les boutons | **1,05:1** en clair · 2,28 en sombre | `#mclear-info-1` et `-2` : `color:var(--pencil)` **en ligne** sur le fond orange du `.btn-w` | classe **`.btn-desc`** (déjà créée, 4 usages) ; `#mclear-info-3` porte en plus `color:#fff;opacity:.85` → même traitement, **sans opacité** |
| **C2** | Puce sélectionnée des modales **Projeter un bilan** et **Comparer classes** | **1,34:1** en sombre | `background:var(--ink-blue);color:#fff` — en sombre `--ink-blue` devient un bleu **pâle** | `color:var(--paper)` (ce que fait déjà `.pass-code-chip`) — 3 sites : l. 18174, 44414, 44419 |
| **C3** | Pastilles **G1 / G2** des menus « Distinguer par groupe » (clic droit sur un en-tête de colonne, types A/C et B) | **3,15** (G1) · **2,85** (G2), dans les deux thèmes | `const colorMap = { 1:'#3498db', 2:'#e67e22', 3:'#9b59b6' }` + `color:#fff` figé — l. 46719 et 46994 | tokens `--g1/--g2/--g3` + `_contrastTextColor()` |

### 2.2 Contraste — thème sombre, littéraux clairs posés en encre

Même famille que les défauts du 2026-09-07 : **une valeur littérale posée pour le mode
clair, sans variante sombre**. Toutes concernent des surfaces ajoutées depuis.

| # | Où | Mesure | Ligne |
|---|---|---|---|
| **C4** | Config Salle → **Îlots** : « 🟥 Îlot actif : » | **1,60:1** | l. 3295, `style="color:#7d2017"` |
| **C5** | Config Salle → **AESH**, état vide : « Aucune AESH dans cette salle… » | **1,50:1** | l. 22195, `color:#7d2017` dans l'`innerHTML` |
| **C6** | Plan Prof → **Contraintes**, bandeau : « Traits rouges = paires existantes. » | **1,86:1** | l. 20332, `<span style="color:#922b21">` — le bandeau a sa variante sombre (l. 2787) mais l'**inline du `span` enfant** la contourne |
| **C7** | Config Salle → Îlots : « cases bordées de rouge foncé » | **2,52:1** | l. 3452, `style="color:#a83a26"` |

Correction type : passer par `var(--danger-fg)` (ou un token dédié) plutôt que le littéral.

### 2.3 Contraste — mineurs

| # | Où | Mesure | Note |
|---|---|---|---|
| C8 | Bouton **« 🪄 Auto-îlots »** | **3,28:1** (clair et sombre) | `#fff` sur `#16a085` — même famille que `.btn-s/.btn-w/.btn-d`, qui ont leur fond assombri propre |
| C9 | `mlinks`, état vide « Aucun lien configuré… » | 3,40:1 | `color:#888` sur `#fafafa` (l. 12769) — reste de la conversion des gris |
| C10 | Mode appel, « Aucun retard. » | 4,17:1 | `--pencil` sur le fond ambre du bandeau — `--cell-meta` conviendrait |
| C11 | `meval-bilan-comps`, pastille « /29 » | 3,49 – 3,73 | `rgba(255,255,255,.75)` sur les couleurs de compétence |
| C12 | Tag **LV2** de la démo | 4,47:1 | `createTag('LV2',…,'#7f8c8d')` l. 34867 — `TAG_COLORS` a bien été éclairci en `#95a5a6`, **le seed de démo est resté sur l'ancienne valeur** |

### 2.4 Accessibilité — deux modales contournent `openMod`

`editClass()` (l. 15931) et `listAndShowFiles()` (l. 32670) ouvrent par
`document.getElementById(id).classList.add('on')`. Conséquence mesurée sur **mce** :
`role` absent, `aria-modal` absent, focus laissé sur `<body>`, donc **pas de piège de
focus** (Échap ferme quand même, le handler global agit sur `.mo.on`). Comparaison
immédiate avec `msettings` ouverte par `openMod` : `role=dialog`, `aria-modal=true`,
focus dans la boîte.

C'est aussi pourquoi l'audit du 2026-09-05 annonçait 90/90 : il ouvrait **tout** par
`openMod`, ce qui masque exactement ce défaut-là. Correction : `openMod('mce')` /
`openMod('mfiles')` après le remplissage des champs.

### 2.5 Responsive — régression entre 761 px et ~843 px

`#hdr-right` (la barre 🔗 ⚙ · Sync · ● Non exporté · 📂 Ouvrir · 💾 Données · 🔒 ⏲ 🎙 ⓘ ◐)
demande **774 px** et n'est replié que par `@media (max-width: 760px)`.

| Gabarit | Largeur de mise en page | `scrollWidth` | Débordement |
|---|---|---|---|
| 375 × 812 | 375 | 375 | — |
| **768 × 1024** (iPad / Surface portrait) | 768 | **844** | **+ 91 px sur tous les onglets** |
| **812 × 375** (téléphone paysage) | 812 | **844** | **+ 47 px** |
| 1024 × 768 | 1009 | 1009 | — |

La passe du 2026-09-05 testait 768×1024 et relevait 0 : c'est donc une **régression**,
cohérente avec l'ajout des boutons ⏲ et 🎙 au bandeau. Remonter le point de rupture
à ~860 px (ou faire passer `#hdr-right` en `flex-wrap:wrap` au-delà) suffit.

### 2.6 Code mort

- **Module « fiche de saisie par élève » entièrement mort** — `_evalOpenSaisie` et ses
  11 fonctions (`_evalSaisieRender`, `…UpdateNote`, `…Prev/Next`…), **l. 41686 → 41999,
  ~314 lignes**. La modale `meval-saisie` **n'existe plus dans le HTML** (ses ~20 ids sont
  introuvables) et **aucun bouton n'appelle l'ouvreur** : la fonction lèverait sur
  `document.getElementById('meval-saisie-evalid').value`. Seuls `_evalSaisieDirty` et
  `_evalSaisieSaveTimer` sont encore lus par les chemins de flush (inoffensif, toujours
  faux). ⚠️ CLAUDE.md annonce toujours « Saisie en tableur **ou en fiche par élève** ».
- **Modale `mpick` morte** (l. 6782–6795) : `openPickModal()` ouvre désormais la carte
  flottante (`#pick-float`), plus cette modale.
- **Règles `.spec-*` des l. 148–163 : leurs `background` sont tous écrasés** par le bloc
  design system (l. 2232–2238, `!important`) — seules leurs déclarations `color` servent
  encore, donc **ne pas les supprimer**. Elles trompent le lecteur : c'est en les lisant que
  cet audit a cru un instant que les palettes écran et impression avaient divergé (elles sont
  **parfaitement synchronisées**, vérifié valeur par valeur : `--maitrise-2` = `#e67e22` = le
  littéral de `_amBadges`).
- `typeof X !== 'undefined'` posé sur des `let` (timers d'éval) : **ne protège pas**
  d'une TDZ (`typeof` lève sur une liaison non initialisée). Sans conséquence ici — tous
  ces accès sont dans des fonctions ou des handlers, donc après l'évaluation du script,
  et deux des trois sites sont dans un `try`. À ne pas prendre pour un garde-fou.

---

## 3. Dérive de la documentation

| CLAUDE.md dit | Réalité mesurée |
|---|---|
| Config Salle : **4** modes d'édition | **6** (Tables, **Îlots**, Groupes, Tags, Contraintes, AESH) |
| 90 modales statiques | **96** |
| Démo : 6 classes | **8** (dont 2 recomposées : DNL Groupe 1, 6e A — DF) |
| « Saisie en tableur ou en fiche par élève » | la fiche par élève n'existe plus (§ 2.6) |
| Scores de référence des audits (0 écart écran, 1 écart impression) | toujours vrais **pour le périmètre d'alors** ; les écarts trouvés ici sont tous sur des surfaces ajoutées depuis |

---

## 4. Ce qui est sain — vérifié, pas supposé

- **0 dialogue natif** (`alert`/`confirm`/`prompt`) : les 18 occurrences textuelles sont
  toutes des commentaires.
- **0 `console.log`, 0 `debugger`, 0 TODO/FIXME, 0 `eval`, 0 `new Function`.** Un seul
  `document.write`, dans la fenêtre d'historique ouverte par `window.open` (son propre
  document), avec `_escAttr` sur le nom de l'élève.
- **CSP** présente ; `font-src 'self' data:` toujours là (les 3 polices embarquées).
- **79 tokens redéfinis en thème sombre, 79 neutralisés dans `@media print`** — aucun
  oubli. C'est ce qui explique le 0 écart à l'impression en mode nuit.
- **0 handler inline** (`onclick`, `onchange`, …) pointant vers une fonction inexistante,
  sur ~1 500 attributs analysés. **0 id HTML réellement dupliqué.** La seule fonction
  définie deux fois (`buildSheetXml`) l'est dans deux portées distinctes (`emitXLSX` /
  `emitODS`).
- **Impression : 0 écart de contraste** sur 10 chemins (Plan Prof, Plan Élève, Plan vide,
  Liste élèves, Bilan des classes, Plans QCMCam, Marqueurs ArUco, Config vide,
  Trombinoscope, Projection) — **en thème sombre**, c'est-à-dire sur le chemin qui valait
  244 écarts avant la passe du 2026-07-30.
- **Photos du trombinoscope : sur le disque** (sous-dossier `photos/` via File System
  Access), pas en `localStorage` — seuls deux drapeaux (`planClasse_planPhotos`,
  `planClasse_photosKnown`) y sont écrits. Le risque de saturation n'existe pas.
- **Performance** (ce poste de travail) :

  | | démo (310 Ko) | montée en charge (871 Ko · 20 classes · 522 élèves · 123 évals) |
  |---|---|---|
  | `JSON.stringify(S)` | 2,8 ms | 6,7 ms |
  | `pushUndo()` | 2,6 ms | 8,3 ms |
  | `save()` | 4,2 ms | 14,7 ms |
  | onglet le plus lourd | Élèves 139 ms | Bilan des compétences 98 ms |
  | `undoLast()` | 26 ms | 104 ms |
  | frappe dans une cellule de tableur | 0,2 ms | — |

  Rien au-dessus de ~100 ms. À 2,3 Mo (fin d'année réelle), l'extrapolation linéaire donne
  ~18 ms de `stringify` et ~270 ms d'annulation : confortable.
- **Jauge de stockage**, **drapeaux de fonctionnalités** (les 4), **aperçu d'import
  d'élèves** (détection du séparateur, de l'en-tête, des colonnes) : tous opérationnels.
- **Palettes d'aménagement écran ↔ impression : synchronisées** (7 statuts vérifiés un à un).

---

## 5. Limites de cet audit

Non couvert, faute de pouvoir le faire depuis un navigateur piloté :

- le **ressenti tactile** réel (Surface, iPad) — glisser-déposer, appui long ;
- la **chaîne photos** de bout en bout (import d'un PDF de trombinoscope réel, affichage
  sur le plan, jeu de mémorisation) : seules les fonctions d'analyse sont couvertes par
  `test/trombi.test.js` ;
- les chemins **File System Access** (dossier de sync, dossier d'import QCMcam, dossier
  d'export des notes) ;
- l'**impression réelle** sur papier (marges du navigateur, recto-verso des marqueurs) ;
- la **synchronisation entre deux machines** en conditions réelles (couverte par
  `test/sync.test.js` en bac à sable).

---

## 6. Comment rejouer

1. `npm test`
2. Servir le dossier (`python -m http.server 8787`) et ouvrir `plan de classe.html`.
3. Pour le contraste : **un chargement par thème** (`localStorage.planClasse_theme`,
   puis `location.reload()`), injecter `*{transition:none !important;animation:none !important}`,
   puis l'auditeur WCAG (fond effectif en remontant les parents transparents, opacité
   cumulée < 0,95 écartée, seuil 4,5 ramené à 3,0 pour le grand texte). Écarter les
   `<text>` SVG. Balayer les 11 onglets, les 25 sous-états, les 96 modales statiques et
   les ~42 modales à contenu dynamique **par leur vrai ouvreur**.
4. Pour l'impression : recopier les règles `@media print` en règles d'écran, bouchonner
   `window.print()` et auditer à l'intérieur, en thème sombre.
5. Pour le responsive : comparer `document.documentElement.scrollWidth` à `clientWidth`
   (ne **pas** se fier à `window.innerWidth`, qui suit le viewport élargi).


---

## 7. Suite donnée — v2.79.0 (même jour)

Les trois lots ont été appliqués et vérifiés dans la foulée.

| Lot | Contenu | Vérification |
|---|---|---|
| **A** | les 12 écarts de contraste (C1 → C12), plus un 13ᵉ trouvé en corrigeant : un second bouton au sarcelle `#16a085` | nouvelle passe complète, **0 écart** en clair comme en sombre (11 onglets, 25 sous-états, modales par leur vrai ouvreur, menus par groupe) |
| **B** | point de rupture dédié à 900 px pour `#hdr-right` ; `editClass` et `listAndShowFiles` passent par `openMod` | 375×812, 768×1024, 812×375, 1024×768 : **`scrollWidth` = `clientWidth` partout** ; `mce` a désormais `role`, `aria-modal` et le focus dans la boîte |
| **C** | suppression du module « fiche par élève » (316 lignes) et de la modale `mpick` (19 lignes) ; nettoyage des 3 chemins de flush ; mise à jour de CLAUDE.md | 195/195 tests, 0 erreur d'exécution, `_evalOpenSaisie` et `mpick` absents du document |

⚠️ **Deux pièges rencontrés pendant la correction, instructifs en eux-mêmes :**

1. Il y avait **deux** boutons au sarcelle `#16a085`, pas un ; et le troisième site
   (« 🖼 Plan » des appels passés) porte `.btn-p`, dont le `background: var(--ink-blue)
   !important` **écrase le fond en ligne**. Lui poser l'encre sombre a donc produit de
   l'encre sur l'encre — **1:1** — jusqu'à ce que la règle soit restreinte par `:not(.btn-p)`.
   Un sélecteur calé sur une valeur doit vérifier que cette valeur gagne la cascade.
2. La correction du tag **LV2** ne change que les **nouvelles** installations : une démo déjà
   posée garde sa couleur, qui est une donnée utilisateur (modifiable dans ⚙ Gérer les tags).
   Vérifié en rejouant `_seedDemoTags()` sur un `S.tags` vide → `#95a5a6`.
