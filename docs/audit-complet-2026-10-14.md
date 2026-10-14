# Audit complet — v2.144.3 (2026-10-14)

Audit multi-axes rejoué sur la version `2.144.3` (commit `301df24`), données de démonstration
fraîches (8 classes dont 2 recomposées, 174 élèves, 41 évaluations, 4 salles, une réunion
parents), servie en `http://localhost` dans le navigateur d'aperçu (Chromium). Corrections
livrées en **2.146.0**.

**Verdict : l'application est stable et cohérente.** Aucune erreur d'exécution, aucune
anomalie d'intégrité, 213 tests verts, rien au-dessus de 70 ms hors un rendu de 504 lignes.
Les défauts trouvés sont **visuels et localisés** : 3 écarts de contraste à l'écran, 3 à
l'impression en mode nuit, 3 incohérences graphiques du thème sombre, 2 noms de PDF génériques
et une lenteur de calcul. Tous corrigés.

---

## 1. Ce qui a été vérifié, et comment

| Axe | Méthode | Résultat avant → après |
|---|---|---|
| Tests | `npm test` (8 fichiers) | **213/213** |
| Erreurs d'exécution | 12 onglets, 87 modales statiques, ~95 fenêtres par leur vrai ouvreur, 22 chemins d'impression, scénarios d'usage | **0** (`window.__planClasseErrors`) |
| Intégrité | `_auditState({repair:false})` après parcours, puis après gonflement à 20 classes | **0 anomalie** |
| Contraste écran | auditeur WCAG (fond effectif, opacité cumulée, seuils 4,5 / 3,0), **un chargement par thème**, transitions neutralisées ; méta-test d'un texte à 1,61:1 détecté | clair : **2 familles** · sombre : **1** → **0 / 0** |
| Sous-états | 4 modes de couleur du plan, filtres G1/G2, surlignage 📄/⏱, mode appel avec absent et retard, contraintes, mode confidentiel sur 4 onglets, menus déroulants, menu Fichier, clic droit, 5 modes de Config Salle, Bilan des compétences en Codes / Domaines, Bilan des notes S1 / S2 / Toutes, classe vide (3e A), classe recomposée, Réunions (préparation, soir), Tablettes et QCMcam en liste, sélection de lignes | **1 famille** → 0 |
| Contraste impression | règles `@media print` réinjectées, audit dans `window.print()` bouchonné, **les deux thèmes** | clair 0 · sombre **3 familles** → **0** sur 22 chemins |
| Cohérence du thème sombre | détecteur de « pavés clairs » (fond clair et peu saturé) sur tous les écrans et modales | **3** → 0 (hors aperçu papier voulu) |
| Fenêtres : ARIA et clavier | ~95 fenêtres par leur vrai ouvreur : `role=dialog`, `aria-modal`, focus à l'intérieur ; Échap, Ctrl+Z / Ctrl+Y depuis une case à cocher, touches 0/1 | **tout conforme** |
| Responsive | 375×812, 812×375, 768×1024, 1024×768 : débordement de page, largeur des modales | **0 débordement** ; bandeau droit à 316 px |
| Performance | données gonflées à **20 classes, 522 élèves, 125 évaluations, 866 Ko** | tout ≤ 65 ms sauf Vue d'ensemble 200 ms → **~140 ms** (dont ~100 de mise en page) |
| Stockage saturé | `setItem` forcé à lever `QuotaExceededError` | `save()` ne lève pas, bannière rouge, retirée au save suivant |
| Statique | dialogues natifs, ids dupliqués, fonctions redéfinies, gestionnaires inline vers des fonctions inexistantes, ouvertures de modale hors `openMod`, `eval`, tokens sombres absents du bloc d'impression, clés `localStorage` hors préfixe, gris littéraux, boutons-icônes sans infobulle, champs sans étiquette | voir § 3 |

⚠️ **Deux pièges de mesure rencontrés, à retenir.**

1. **Le panneau d'aperçu masqué ne donne pas le focus au document** (`document.hasFocus()`
   faux) : `focus()` / `blur()` programmés ne déclenchent pas `onblur`. Un test de la
   mini-calculatrice du tableur (« 1+0,5 ») semblait la montrer en panne ; appelée directement,
   elle marche (2+0,5 → 2,5). Les captures d'écran y arrivent aussi **avec un temps de retard**
   (elles montraient l'onglet précédent). Les minuteurs sont ralentis : découper les longues
   batteries et lire le résultat dans un second appel.
2. **Un élément retiré du DOM garde un `display` calculé non nul** : la bannière d'erreur de
   sauvegarde paraissait rester affichée alors qu'elle avait été supprimée. Tester
   `document.getElementById(…)`, pas `getComputedStyle` sur une référence gardée.

---

## 2. Défauts trouvés et corrigés (2.146.0)

### 2.1 Contraste écran

| # | Où | Mesure | Cause | Correction |
|---|---|---|---|---|
| **C1** | 🚨 Listes d'évacuation : effectif à côté de chaque classe cochée | **2,22:1** clair · **2,47** sombre | `<span class="lst-use">` (gris `--pencil`) sur la pastille cochée `--chip-on-bg` | classe `.n` (convention des compteurs dans `.clf-pill`, couleur héritée) |
| **C2** | Onglet Élèves, **ligne sélectionnée** : ♂, compteurs « 0 », « ＋ aménagement » | **4,34–4,45:1** | fond de sélection `#d4e7f7` trop soutenu pour `--pencil-soft` et `--civ-m` | token **`--row-sel-bg`** (`#e1edf8` → 4,63 / 4,72) + liseré gauche `--ink-blue` pour garder la sélection visible |
| **C3** | Même ligne, **thème sombre** | — | **sélection invisible** : `.stbl td { background: transparent !important }` écrasait le fond | même token, `#1b2a3c` en sombre (≥ 4,62:1 pour tous les gris), règle `!important` |

### 2.2 Impression en mode nuit

| # | Où | Mesure | Cause | Correction |
|---|---|---|---|---|
| **P1** | Pastilles **PPRE** — Vue d'ensemble, Tableau de la classe (et toute page recopiée de l'écran) | **2,85:1** | `html[data-theme="dark"] .spec-ppre { color:#fff }` est un **littéral** : la neutralisation des tokens ramène l'orange au clair mais laisse le blanc | bloc `@media print` qui rétablit les couleurs claires de toutes les surcharges sombres `.spec-*` |
| **P2** | Pastille de type **C** — Bilan des notes, Fiche élève | **2,53:1** | `html[data-theme="dark"] .eval-type-C` : fond littéral `#3b5a8c` + encre `--ink-deep` (redevenue sombre) | même traitement pour `.eval-type-A/B/C/D` |
| **P3** | `.spec-ulis/upe2a`, `-incl`, PAI, -A, PAP | (non rendus dans les données imprimées, même mécanisme) | idem | couverts par le même bloc |

💡 C'est la limite du bloc de neutralisation par tokens : **une surcharge sombre écrite en
littéral lui échappe.** Toute nouvelle règle `html[data-theme="dark"] … { background:#… }` ou
`{ color:#… }` sur une surface qui s'imprime doit avoir sa remise au clair dans `@media print`.

### 2.3 Cohérence graphique du thème sombre

| # | Où | Constat | Correction |
|---|---|---|---|
| **G1** | Contrôles natifs (calendrier des champs date, curseurs du sonomètre et du minuteur, barres de défilement, listes déroulantes, sélecteur de couleur) | restaient en clair — et l'**icône calendrier sombre sur fond sombre était invisible** | `color-scheme: dark` dans le thème sombre, remis à `light` dans la neutralisation d'impression |
| **G2** | Barre d'actions en lot de l'onglet Élèves : étiquettes « Civ » / « Grp » | pavés clairs `#eaf2fa` dans la barre de nuit | surcharge sombre `--paper-deep` / `--ink-deep` |
| **G3** | ⚙ Compétences : « Par domaine \| Par code » | boutons **natifs gris** (dans les deux thèmes) : le sélecteur `.pl-seg` n'est stylé que dans le Plan, la Vue Élève et les Réglages | styles de `#msettings .pl-seg` étendus à `#mcompmgr` |

### 2.4 Impressions — nom du PDF

`printQcmPlans` et `_renduPrint` ne posaient pas `document.title` : le PDF s'appelait
« Plan de Classe ». Désormais « Plan QCMcam - Salle 102 » / « Plans QCMcam - N salles » et
« Résultats - <devoir · classe · date> » (barres obliques changées en tirets). Les 20 autres
chemins nommaient déjà leur fichier.

### 2.5 Performance — Vue d'ensemble

`_overviewRows` appelait `getStudentAttendanceStats` **élève par élève**, chaque appel
reparcourant tous les appels de la classe, et le rendu calculait les lignes **deux fois**
(bandeau puis tableau). Nouveau `_attTallyForClass(classId, range)` : un passage par classe ;
`_overviewRows({ base })` réutilise les lignes du bandeau. Équivalence vérifiée sur 2 088
élève × période (année, mois, mois précédent, période) : **0 écart**. Calcul : ~90 ms → ~1 ms ;
il reste ~100 ms de mise en page pour 504 lignes.

### 2.6 Accessibilité (mineur)

- 28 étiquettes `<label>` suivies de leur champ n'étaient pas reliées (`for=`) : un lecteur
  d'écran annonçait un champ sans nom, et cliquer l'étiquette ne plaçait pas le curseur.
  Reliées (Nouvelle classe, Modifier la classe, Ajouter un élève, Réglages d'une évaluation,
  Réglages des évaluations, classe recomposée, filtres de période des trois onglets
  d'évaluation…).
- « −1 j » / « +1 j » de la fiche de prêt : infobulles « La veille » / « Le lendemain ».

---

## 3. Contrôles statiques — résultats

| Contrôle | Résultat |
|---|---|
| `alert` / `confirm` / `prompt` natifs | **0** dans l'app (les occurrences sont dans des commentaires, le favori MBN — qui tourne dans la page de MBN — et le fichier autonome des réunions) |
| ids en double (HTML statique) | 0 |
| fonctions redéfinies | 0 (le second `save` est dans le code du fichier autonome des réunions) |
| gestionnaires inline vers une fonction inexistante | 0 |
| modales ouvertes sans `openMod` | 0 |
| `eval` / `new Function` | 0 |
| tokens du thème sombre absents de la neutralisation d'impression | 0 / 80 (81 avec `--row-sel-bg`) |
| clés `localStorage` hors `planClasse*` / `iprint-*` | 0 |
| `TODO` / `console.log` | 0 / 0 |
| gris littéraux `color:#555…#ccc` | 6, tous dans des règles d'impression ou des cases « sans table » — sauf `.bulk-lbl` (corrigé, G2) et `.ipovf-*` (CSS mort, supprimé, cf. § 4) |

---

## 4. Observations, et suite donnée

1. **Deux boutons « principaux » côte à côte** dans le groupe Séance du Plan : « 🔄 Vue Élève »
   et « 🙋 Faire l'appel » portaient tous deux `btn-p`. **Fait (arbitrage de l'utilisateur)** :
   « Vue Élève » et son jumeau « Vue prof » passent en bouton secondaire (`btn-g`), toujours au
   même pixel (122, 218 mesuré dans les deux vues) ; « Faire l'appel » reste l'action principale.
2. **CSS mort** `.ipovf-*` (~25 lignes, ancienne grille de « Pas assez de tablettes »,
   « conservées pour mémoire » depuis la v2.132.0) : **supprimé** (arbitrage de l'utilisateur).
   Seule la règle sombre de `#mipovf-grid-wrap`, toujours utilisé, est gardée.
3. **Champs sans nom accessible restants** : le compte de ~50 incluait les `<select>` cachés
   (support de valeur, hors de l'arbre d'accessibilité). Mesurés sur les champs VISIBLES de tous
   les onglets, sous-états et ~130 fenêtres : **23 champs** (tris des devoirs, sons du sonomètre
   et du minuteur, dates et créneaux des fenêtres d'évaluation et d'appel, heure de retard, nom
   d'un instantané, discipline, longueur maximale d'une remarque, créneau par classe, colonnes
   de l'import d'élèves, saisie générique). **Tous nommés en v2.146.1** ; balayage final : 0.
4. **Vue d'ensemble** : ~100 ms de mise en page pour 504 lignes. Imperceptible à l'ouverture ;
   une pagination ou un rendu progressif ne se justifierait qu'au-delà de ~1 500 élèves.

---

## 5. Score de référence après 2.146.0

**0 écart de contraste**, en clair comme en sombre, sur 12 onglets, ~30 sous-états, 87 modales
statiques, ~95 fenêtres dynamiques et 22 chemins d'impression ; 0 débordement sur 4 gabarits ;
0 erreur d'exécution ; 213/213 tests. Un audit qui renvoie autre chose signale une régression.
