# Audit d'ergonomie — Plan de Classe v2.20.0

**Date : 29 juillet 2026** · Base : `plan de classe.html` (43 610 lignes, branche main à jour)
**Méthode :** 3 audits de code croisés (interactions/saisie · densité/découvrabilité · tactile/responsive/accessibilité) + inspection en direct de l'app avec mesures (tailles de cibles, densité, persistance).

> Ce document est un **catalogue de constats et de pistes** — rien n'est encore codé. Les numéros de ligne se réfèrent à la version 2.20.0.

---

## Vue d'ensemble

L'app est fonctionnellement très riche et plusieurs fondations UX sont excellentes (modales avec focus-trap et `role="dialog"`, glisser tactile par appui long, tableaux d'éval à en-têtes collants, thème sombre couvert par 234 règles, mode projection abouti pour les notes). Les frictions se concentrent sur **5 axes** :

1. **Le tactile est le parent pauvre** alors que l'usage Surface/iPad est visé : cibles minuscules partout, un seul bloc `pointer: coarse` dans tout le fichier, et des fonctions clés accessibles *uniquement* au clic droit ou au survol (invisibles au doigt).
2. **Le clavier a régressé** : la conversion `confirm()` → `_uiConfirm` a perdu la validation par Entrée sur ~45 confirmations ; 68 modales sur 87 s'ouvrent sans focus ; 8 `prompt()` natifs subsistent.
3. **Les gestes du quotidien ont des frictions saisonnières ou journalières** : saisie de rentrée (modale qui se ferme à chaque élève, année 2025 en dur), mode appel (retard au clic droit + `prompt()`, « Tout présent » non annulable), zoom du plan à re-régler à chaque session.
4. **Densité et incohérences** : 16 contrôles par ligne d'élève, toolbars de 15-19 contrôles, vocabulaire variable (Sauvegarder/Enregistrer, ✕/🗑, Effacer/Supprimer/Retirer), pieds de modale dans des ordres différents.
5. **La Vue Élève — l'écran le plus projeté — n'a pas de mode projection**, ses couleurs de groupe ne s'affichent pas, et son zoom n'est pas persisté.

---

## 🎯 Top 12 prioritaire (fort impact, risque faible)

| # | Amélioration | Pourquoi | Où |
|---|---|---|---|
| 1 | **`_uiConfirm` : focus auto sur le bouton principal + Entrée = confirmer** | Régression vs `confirm()` natif, ressentie sur ~45 confirmations. Débloque aussi le focus-trap. | l. 16718, 4969 |
| 2 | **Corriger l'ordre du handler Échap** : le garde-fou « input/textarea » (l. 30110) doit passer *avant* la branche Escape (l. 30062) | Aujourd'hui, Échap dans le champ 🔍 du Plan peut **quitter le mode appel en cours** au lieu de vider le champ. Quasi-bug. | l. 30060-30111 |
| 3 | **Saisie de rentrée** : la modale « Ajouter un élève » reste ouverte après ajout (refocus sur Nom), année scolaire dérivée de la date (bascule en août), groupe/civilité rémanents | 30 élèves = 30 réouvertures + correction manuelle de « 2025 » à chaque classe. **À faire avant septembre.** | l. 13085, 2924, 13082 |
| 4 | **Auto-focus à l'ouverture des 5 modales fréquentes** (`ms`, `mc`, `msalle`, `me`, `msaveatt`) + **Entrée valide** dans `ms`/`mtags`/`msalle`/`msaveatt` | Le patron existe déjà (`msnapNew`, `mconseil-mentions`) — c'est une généralisation. | l. 12283 + modales |
| 5 | **Remplacer les 8 `prompt()` restants** — en priorité le **retard en mode appel** (→ `input type="time"` pré-rempli + boutons rapides) et « tapez le nom exact » des classes mobiles (→ `select`) | Geste quotidien sur tablette ; un `prompt()` bloqué par l'anti-popup rend la fonction muette (même raison que la conversion des `confirm()`). | l. 22583, 21242, 10137-42, 23626, 23884, 21253 |
| 6 | **Persister le zoom** Plan Prof / Vue Élève dans `localStorage` | À chaque F5 en classe, le zoom repart à 100 % (vérifié en live : aucune clé de zoom). Le filtre de groupe est déjà persisté — même patron. | l. 17312-17332 |
| 7 | **Couleurs de groupe en Vue Élève** : étendre les sélecteurs `cg1/cg2/cg3` à `.svcell` | Les classes sont posées sur les cellules mais aucune règle CSS ne les cible → distinction G1/G2/G3 invisible sur la projection. Quasi-bug. | l. 17371 vs 541-557 |
| 8 | **Thème sombre : variantes sombres des cellules colorées du plan** (`--gN-light/-em`, `.cgen-m/f`, états Contraintes/Îlots de Config Salle) | Texte ambre sur pastel clair ≈ contraste 1,2:1 — illisible dans le mode de coloration *par défaut* du Plan. | l. 541-557, 692-695, 620-627 |
| 9 | **`thead` sticky + conteneur scrollable sur le tableau Élèves** | Les en-têtes sont les boutons de tri et disparaissent au défilement ; les tableaux d'éval ont déjà le bon modèle. | l. 347-355, 15066 |
| 10 | **`setCfgDimensions()` : confirmation avant troncature** quand réduire Rangées/Colonnes détruit des places occupées | Chaque cran du spinner tronque silencieusement des placements. | l. 19400 |
| 11 | **« ↺ Tout présent » : avertir que c'est non annulable** (état transient hors undo) — ou sauvegarder l'état avant clear pour permettre un « rétablir » | Un appel de 30 élèves perdu sur un clic, Ctrl+Z inopérant. | l. 22221 |
| 12 | **États vides actionnables** : « Aucun élève. » → « Aucun élève. Cliquez sur **+ Ajouter** ou **⬆ Importer**… » ; même passe sur les 8 autres états vides muets | Premier contact d'un nouvel utilisateur. Le bandeau îlots (l. 2528) est le bon patron. | l. 14915, 17001, 39655… |

---

## 🖐 Axe 1 — Tactile (Surface / iPad)

Mesures en live : **51 cibles < 32 px** de haut sur le Plan Prof ; compteurs 📦/📝 des cellules à **31×15 px** ; **401 cibles < 28 px** sur l'onglet Élèves ; inputs du tableur d'éval **46×30 px** (150 à l'écran).

- **Compaction globale inconditionnelle** (l. 1741-1784) : `.hdr-btn` ≈19 px de haut, `.nb`, `#cls-sel` réduits *hors de toute media query*. À réserver au pointeur fin.
- **`@media (pointer: coarse)` n'existe qu'une fois** (modale Classe recomposée, l. 430-434). Étendre à : `.btn-sm` (≥40 px effectifs), `.gchip`, `.hdr-btn`, `.cctr`, `.cell-unplace`, `.isel`, inputs du tableur, cases à cocher des Réglages.
- **Fonctions accessibles uniquement au clic droit** — inexistantes au doigt :
  - saisie d'un **retard** en mode appel (l. 16445) → ajouter une petite action ⏰ visible sur la cellule en mode appel ;
  - **−1** sur les compteurs 📦/📝 (l. 5682 vs 16533) → exposer au survol/appui long ;
  - le **menu de cellule à 14 actions** (l. 5679-5705) → bouton kebab au survol/focus, ou conserver l'appui long (déjà câblé) mais le documenter ;
  - retirer une salle (clic droit sur le bouton de salle) : l'astuce n'est écrite que sur 2 onglets sur 6 (l. 18618).
- **598 `title=` comme unique libellé** : jamais visibles au doigt. Prioritairement sur la toolbar du tableur (11 boutons icône-seule muets), afficher un libellé court ou une infobulle sur appui long.
- **Gestes cachés du tableur** (clic droit en-têtes/cellules, collage multi-colonnes) documentés uniquement dans une aide masquable persistée : une fois repliée, plus aucune trace. Marquer les zones à menu contextuel (curseur + petite flèche au survol).

## ⌨️ Axe 2 — Clavier & saisie

- **Focus-trap inerte** tant qu'aucun `focus()` n'est posé (l. 12345-71) : le premier Tab part dans la page d'arrière-plan sur 68 modales. L'auto-focus (Top 4) corrige les deux problèmes d'un coup.
- **22 modales à formulaire sans validation Entrée** (liste complète dans l'audit détaillé) — incohérent avec `msnapNew`/`mconseil-mentions` qui l'ont.
- **`meval-edit` : « Annuler » n'annule qu'à moitié** — les mini-notes sont écrites en direct dans `S`, l'en-tête seulement au ✓. Le flag `_evalEditDirty` est positionné mais jamais lu (l. 31954, 37940). Restaurer un backup à l'annulation (patron `_planCstrBackup` existant).
- **Perte de focus en tapant un coefficient** au Bilan (debounce 600 ms → re-render du `<th>` contenant l'input, l. 40271-86). Le correctif existe ailleurs (`_evalEditUpdateMiniNote` ne re-rend que le total).
- **87 `alert()` restants**, 4 familles : validations de formulaire (→ message inline + focus sur le champ), préconditions (→ `toast` non bloquant), résultats vides (→ `toast`), erreurs fichier (→ `appAlert`, déjà utilisé juste à côté dans la même fonction, l. 26065).
- **Aucun élément non natif focusable** : ~150 `div/span onclick` (chips de groupe, 6 chips de mode Config Salle, cartes de classe, items de menus, en-têtes de tri). Conversion progressive en `<button>` ou `tabindex`+rôle. `aria-label` : 37 occurrences seulement, concentrées sur 3 zones.
- **Vue Élève sans bouton de nav ni raccourci** : accessible uniquement via le bouton du Plan, et rétrogradée à la restauration de session.

## 📽 Axe 3 — Vue Élève & projection

- **Pas de mode projection** alors que le mécanisme complet existe pour « Projeter les notes » (`body.rendu-projecting`, chrome masqué, zoom, panneaux déplaçables — l. 652-680, 14337-14427). Le réutiliser pour la Vue Élève est le chantier au meilleur ratio réutilisation/gain.
- Prénoms projetés ≈ 21 px par défaut (mesuré 14,4 px sur la démo), zoom non persisté (Top 6), toolbar hors zone de zoom.
- **5 animations `infinite`** (surlignage rose, violations, rappels, alerte sonomètre) peuvent clignoter sur l'écran projeté ; `prefers-reduced-motion` absent du fichier. Couper les clignotements en mode projection.
- Pastels G1/G2/G3 peu discriminants projetés (et pour daltoniens) : renforcer la saturation en projection + doubler d'un repère non chromatique.

## 🗜 Axe 4 — Densité & cohérence

- **Ligne d'élève à 16 contrôles** (7 boutons de statut toujours visibles × 30 lignes ≈ 210 boutons) : afficher les statuts *actifs* en badges et regrouper l'édition derrière un bouton « Aménagements » ; actions de fin de ligne au survol/focus.
- **Toolbars** : Plan Prof 19 contrôles (regrouper zoom+undo+💡 en « Affichage », Snapshots+Appels passés+Contraintes en « Séance ») ; tableur d'éval 15 contrôles dans une barre scrollable sans indicateur (→ menu « ⋯ » pour Export/Projeter/Sobriété/Comparer) ; header 13 boutons (Minuteur/Sonomètre/Thème/À propos peuvent vivre sous ⚙).
- **Vocabulaire à normaliser** (passe transverse peu risquée) : un seul verbe de validation (« Enregistrer »), 🗑 = destruction de donnée / ✕ = fermer ou retirer d'une sélection, « Supprimer » vs « Retirer » vs « Remettre à zéro » selon la sémantique, « Fermer » toujours secondaire, ordre fixe [destructif] … [Annuler][Primaire] (aujourd'hui 4 ordres différents), un pictogramme par famille d'action (📊 désigne 5 fonctions différentes, 📋 5, 💾 3, 🎲 3).
- **Chaînes de modales à 3-4 niveaux** dans le volet Évaluation (Tableur → menu clic droit → sélecteur de compétences ; Structure qui « rebondit » sur le Tableur) : à défaut de refonte, afficher « ‹ Retour à [parent] » dans les modales filles. `msettings` qui se ferme/rouvre en clignotant (l. 25354) : empiler au lieu de fermer.
- **Modales longues sans en-tête/pied collants** (Réglages ~150 lignes de formulaire : le ✓ Enregistrer exige de tout dérouler). Rendre `h2` et `.ma` sticky dans `.mb` — modèle déjà présent dans `meval-tableur`.

## 📣 Axe 5 — Feedback & annulabilité

- **Suppressions silencieuses** : tag propagé sur N élèves, incidents, exercice, discipline, compétence, mention… → toast récapitulatif systématique après suppression.
- **Mention « Ctrl+Z » incohérente** : 21 confirmations destructives annulables ne le disent pas ; 2 toasts sur 348 le mentionnent. Et sur iPad sans clavier, « Ctrl+Z » ne veut rien dire → mentionner aussi le bouton ↩. Idéalement : toast avec bouton « Annuler » intégré.
- **Toast invisible aux lecteurs d'écran** : ajouter `role="status"`/`aria-live="polite"` sur `#toast` (1 ligne).
- **Opérations longues sans indicateur** : mélange aléatoire (30 essais synchrones), impression multi-classes, chargement de la démo — afficher « ⏳ … » comme le fait déjà `checkForUpdate`.
- `loadFromHandle` vide `undoStack` sans le dire dans sa confirmation.

## 📐 Axe 6 — Responsive

- **Une seule media query de largeur** (700 px, dont une règle vide). Introduire un palier ~1100 px (replier les libellés de boutons) et ~820 px (panneau non-placés repliable). Bon point vérifié en live : pas de débordement horizontal à 768 px.
- Grilles en `repeat(cols, 1fr)` sans `minmax()` : cellules écrasées plutôt que défilables sur salle large.
- `--margin-w: 56px` (filet rouge décoratif) jamais réduit : ~8 % de largeur perdue sur Surface en portrait.
- ~40 surcharges sombres par sélecteur `[style*="#hex"]` : fragile — toute nouvelle modale à hex inline échappera au thème. Migration progressive vers variables.

---

## Points forts à préserver

Focus-trap + `role="dialog"` sur les modales · glisser tactile par appui long (annulation, fantôme, seuils) · tableaux d'éval sticky 3 axes (thead/tfoot/1re colonne) · mode projection des notes (chrome masqué, panneaux déplaçables) · thème sombre étendu · bandeau d'état vide des îlots (l. 2528, à ériger en patron) · pré-marquages automatiques du mode appel · `_uiConfirm` lui-même (le fond est bon, seul le clavier manque).

## Hors ergonomie, signalé séparément (pastilles de tâche)

- Fichier de conflit Nextcloud de 38 000 lignes versionné par erreur (`plan de classe.sync-conflict-20260619-….html`).
- ~300 lignes de code mort : la modale `meval-saisie` n'existe plus dans le HTML mais `_evalOpenSaisie()` et ses satellites subsistent (vérifié : jamais appelée, aucun `id="meval-saisie"`).

---

## Proposition de découpage en lots

| Lot | Contenu | Effort | Quand |
|---|---|---|---|
| **A — Avant la rentrée** | Top 3 (saisie de rentrée) + Top 1-2 (clavier `_uiConfirm`, Échap) + Top 4-5 (autofocus, prompts) | 1 session | Août |
| **B — Confort quotidien** | Top 6-11 (zoom persisté, Vue Élève couleurs, sombre, thead sticky, garde-fous) + toasts sur suppressions | 1-2 sessions | Août-sept. |
| **C — Tactile** | Passe `pointer: coarse` globale + alternatives visibles au clic droit (retard, −1, kebab) | 2 sessions | Selon usage Surface |
| **D — Projection** | Mode 📽 pour la Vue Élève + reduced-motion + saturation projecteur | 1 session | — |
| **E — Cohérence** | Vocabulaire, pieds de modale, pictogrammes, états vides, densité Élèves/toolbars | Passes successives | Fil de l'eau |
| **F — Accessibilité** | Focusables, aria-labels, navigation clavier du plan | Fond de tâche | Fil de l'eau |
