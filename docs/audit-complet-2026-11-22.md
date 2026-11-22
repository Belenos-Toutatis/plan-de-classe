# Audit complet — v2.167.1 (2026-11-22)

Audit de non-régression rejoué sur la version `2.167.1` (commit `eeede5b`), partie par partie.
Question posée : les mises à jour faites depuis le dernier audit complet (2026-10-14, v2.146.2 —
une cinquantaine de commits, 2 800 lignes changées dans `plan de classe.html`) ont-elles apporté
des bugs de fonctionnement ou d'affichage ?

Données de démonstration fraîches (8 classes dont 2 recomposées, 174 élèves, 41 évaluations,
4 salles, une réunion parents), servies en `http://localhost` dans le navigateur d'aperçu.
**Aucune donnée réelle d'élève n'a été lue.** Les sections 1 à 5 décrivent l'état trouvé
(v2.167.1) ; les corrections, livrées en **2.168.0**, sont en § 6.

---

## 1. Ce qui a été vérifié, et comment

| Partie | Méthode | Résultat |
|---|---|---|
| Tests automatiques | `npm test` (8 fichiers) | **245 / 245** |
| Erreurs d'exécution | 12 onglets, 88 modales statiques, 127 fenêtres par leur vrai ouvreur, 23 chemins d'impression, parcours d'usage | **0** (`window.__planClasseErrors`) |
| Intégrité des données | `_auditState({repair:false})` après tous les parcours, puis à 21 classes | **0 anomalie** |
| Contraste écran | `outils/audit-ui.js`, un chargement par thème, transitions neutralisées, méta-test passé | clair **0** (1 faux positif de l'outil, § 4) · sombre **0** |
| Sous-états | couleurs du plan, groupes, appel, contraintes, confidentiel, menus, clic droit, 5 modes de Config Salle, bilans, classe vide, classe recomposée, réunions (préparation, soir, écran parent), recherche d'élève | **0** |
| Impressions | 23 chemins, 22 PDF, mesurés dans `window.print()` bouchonné, deux thèmes | **0** |
| Thème sombre : pavés clairs | détecteur de fonds clairs, tous écrans et fenêtres | **0** |
| Champs sans nom accessible | onglets, sous-états, fenêtres | **0** |
| Fenêtres : ARIA et focus | 127 fenêtres par leur vrai ouvreur (`role`, `aria-modal`, focus à l'intérieur, largeur) | **toutes conformes** |
| Responsive | 375×812, 812×375, 768×1024, 1024×768 : débordement de page, largeur des fenêtres | **0 débordement** ; bandeau droit à 291 / 316 px |
| Surfaces ajoutées depuis le dernier audit | trombinoscope agrandi, grande photo des tableurs, fenêtre « dossier à choisir de nouveau », recherche d'élève, raccourcis H et P, mini-plans de la fiche, fusion de versions, horloge des réunions | voir § 2 |
| Tableurs d'évaluation, **case active** | 4 types × pastilles / cases pleines × sobriété, 6 cases par état, deux thèmes (l'outil ne posait pas le curseur) | **3 défauts**, § 2 |
| Parcours d'usage | nouvelle classe, ajout de deux élèves (dont « en saisir un autre »), modification, Ctrl+Z / Ctrl+Y, dépôt et échange sur le plan, appel avec absent et retard puis changement de classe, saisie au clavier dans les 4 tableurs (Tab, Entrée, flèche), note hors barème, fusion d'une version, raccourcis 0–3 / A / D / + / = / H / P | **tout conforme** |
| Performance | données gonflées à 21 classes, 524 élèves, 121 évaluations, 784 Ko | tout ≤ 60 ms ; Vue d'ensemble ~110 ms (507 lignes, dont 27 ms de calcul) — conforme à la référence |
| Stockage saturé | `setItem` forcé à lever `QuotaExceededError` | `save()` ne lève pas, bannière rouge, retirée au save suivant |
| Statique | fonctions définies deux fois, gestionnaires inline vers une fonction absente, `id` en double, `openMod` sur une fenêtre inconnue, `var(--x)` jamais défini, dialogues natifs | **0** partout |
| Relecture du code des mises à jour | diff de chaque commit depuis la v2.146.2, relu par partie, anomalies confirmées par exécution quand c'était possible | voir § 3 |

Non vérifié, à dire clairement : le ressenti au doigt sur la Surface, l'ouverture en `file://`,
le favori « Vers MBN » sur le vrai MBN, le dossier de sauvegarde réel (API fichiers de Chrome),
et tout ce qui demande l'affichage réel du panneau (animations, captures) — le panneau d'aperçu
était masqué pendant l'audit.

---

## 2. Défauts d'affichage trouvés dans le navigateur

Tous **confirmés par mesure** dans la page. Aucun n'empêche de travailler ; A1 et A2 rendent un
texte illisible en thème sombre.

| # | Où | Mesure | Cause | Origine |
|---|---|---|---|---|
| **A1** | Fenêtre d'alerte de l'app (`appAlert`, `#appDialog-msg`) en **thème sombre** : le texte du message | **1,27:1** (illisible) | `color:#333` écrit en dur dans la balise (l. 8217), sans variante sombre | ancien (2026-05-14), passé entre les mailles : l'outil d'audit ouvrait la fenêtre **vide**. Plus visible depuis que la v2.166.1 (« 📂 Dossier à choisir de nouveau ») et la v2.167.0 (« Récupération impossible ») s'en servent. 23 appels dans l'app (erreurs de fichier surtout) |
| **A2** | Tableurs A / B / C / D, **thème sombre**, sobriété cochée (menu 🎨) : la moyenne au pied de la colonne où se trouve le curseur | **1,63:1** (ambre sur jaune) | la pastille devient transparente avec `color: var(--ink-deep) !important` (l. 3318), ambre en sombre, alors que la case du pied est passée au jaune surligneur ; la règle qui pose l'encre fixe exclut exprès les pastilles (l. 95) | **v2.148.0** (`15e4591`, croix de saisie) |
| **A3** | Tableurs A et C : la mention « disp. » (élève dispensé) quand elle tombe sur la colonne du curseur | **3,77:1** en sombre · 4,48 en clair | `td.meval-cell-disp` garde `var(--pencil)`, calibré sur le papier, sur le jaune de la croix (`--cross-hl`) | **v2.148.0** (`15e4591`) |
| **A4** | Tableurs B et D (et A / C après un « hors barème » refusé, et le champ « max ») : l'infobulle **« Valeur invalide… »** reste sur une case **corrigée**, dès qu'on l'a survolée une fois pendant l'erreur | infobulle fausse (fonctionnement) | depuis la v2.150.1, au survol le `title` est déplacé dans `data-tip` ; le code qui efface ensuite l'erreur fait `inputEl.title = ''` (l. 50868, 52630, 53059, 53443), ce qui ne touche plus `data-tip`. Le gestionnaire (l. 43881) retire bien le `title` vide, mais laisse l'ancien texte | **v2.150.1** (`5c28cf3`, infobulles dans `#gtip`) |
| A5 | Menu 🎨 des tableurs : le bouton ne montre pas qu'un mode de sobriété est actif | cosmétique | `_evalTableurSobrApply` pose un fond et une encre **en ligne** (l. 49640), écrasés par `.btn-g { background … !important }` — dans les deux thèmes | ancien |

Reproduire A4 : tableur d'un devoir de type D → taper `9` dans une case (elle rougit) → passer la
souris dessus → taper `3` → repasser la souris : la bulle dit toujours « Valeur invalide ».

Corrections envisagées (non faites) :
- **A1** — `color: var(--ink-deep)` à la place de `#333` ; ajouter à `outils/audit-ui.js` un
  ouvreur `appAlert('Titre', 'Message', …)` pour chaque type, la fenêtre vide ne mesurant rien.
- **A2** — ajouter les pastilles en sobriété à la règle d'encre fixe du pied actif
  (`td.meval-active-foot .stat-pill-note/.stat-pill-comp { color:#1a252f !important }` sous
  `body.tableur-sobr-*`), le jaune étant le même dans les deux thèmes.
- **A3** — sur la croix, `td.meval-cell-disp.meval-active-col { color: var(--cell-meta) }` (le
  token prévu pour une case teintée), à mesurer dans les deux thèmes.
- **A4** — dans le gestionnaire `mouseover` de `_setupGlobalTooltip` : un `title` **vide**
  retire aussi `data-tip` (`else t.removeAttribute('data-tip')`). Un seul point à corriger, qui
  couvre les quatre sites et tout futur `el.title = ''`.
- **A5** — une classe (`.on`) plutôt qu'un style en ligne, ou retirer ces deux lignes mortes.

---

## 3. Anomalies trouvées à la relecture du code des mises à jour

Chaque commit depuis la v2.146.2 a été relu, par partie. Légende de la colonne **Preuve** :
**app** = rejoué dans l'application (navigateur, démo) · **exéc.** = confirmé par exécution hors
navigateur (harnais de test, ou mini-DOM pour le fichier du collègue et le favori MBN) ·
**lu** = établi à la lecture du code · **plausible** = mécanisme lu, effet non rejoué.

### 3.1 Réunions parents-professeurs

| # | Gravité | Anomalie | Où | Origine | Preuve |
|---|---|---|---|---|---|
| **R1** | **haute** | **Fichier du collègue, « ＋ Parent sans rendez-vous »** : un commentaire `// il est là : déjà vu` inséré au milieu d'une ligne rend mort tout ce qui suit (`r.pauses = …; touched();`). (a) Le rendez-vous ajouté ne marque pas le fichier « à enregistrer » : si c'est la dernière saisie avant de fermer, **il est perdu**, sans alerte ni copie de secours. (b) Posé sur une pause, la pause reste : l'élève est invisible dans la préparation et sur la feuille imprimée. Le logiciel, lui, est correct (deux lignes, l. 30376-30377). **Tous les fichiers produits depuis la v2.157.0 portent le défaut.** | `wkPick`, l. 9535 | v2.157.0 (`a1e7b8c`) | exéc. + lu |
| **R2** | moyenne | **Fiche détachée (🗗)** : un clic sur une pastille de vie de classe (📦 Oublis, 📝 Travail non fait, 🚫 Absences, ⏰ Retards) **ferme la fenêtre**. Le filtre `_FW_ALLOW` ne regarde que le début du code (`_rwHideTip(`), alors que la suite (`_ficheGo('hist', …)`) appelle `closeMod2('mrw')`, qui vaut `window.close()` dans cette fenêtre | l. 58920, 58578, 17848 | v2.154.0 (`afc780b`) | exéc. + lu |
| **R3** | moyenne | **Choisir un rendez-vous change de classe en silence** (voulu), mais avec ses effets de bord : un **appel commencé et non enregistré est vidé** sans confirmation ni « ↩ Rétablir l'appel effacé » ; un sous-mode Contraintes non validé est annulé ; la Vue Élève projetée bascule sur l'autre classe. Se déclenche aussi par « ▶ Ouvrir » du bandeau du Plan, le premier rendez-vous étant choisi d'office | `_reuFocusStudent`, l. 30302 ; `switchClass`, l. 18254 | v2.150.0 (`874e112`) | exéc. (appel) · lu (reste) |
| R4 | moyenne | **Historique, ✏️ corriger une entrée** : chaque `change` du champ date ou heure redessine la ligne sans rendre le focus — la saisie **au clavier** est coupée après le premier chiffre (le calendrier et les boutons de créneau marchent) | `_histEditSet`, l. 20937 | v2.153.0 (`7e520d5`) | plausible |
| R5 | faible | ↩ Annuler ramène la classe du bandeau, pas le rendez-vous affiché dans « Ce soir » : H et P visent alors la mauvaise classe jusqu'au prochain clic | `_reuSoirAfter`, l. 30582 | v2.150.0 | exéc. |
| R6 | faible | Historique, ligne d'édition : **Entrée sur le bouton « Annuler » enregistre** (le `keydown` du conteneur intercepte Entrée) | `_histEditKey`, l. 20939 | v2.153.0 | lu |
| R7 | faible | « Ce soir » sans aucun rendez-vous : le menu de suggestions du parent sans rendez-vous est rogné par la liste (environ deux suggestions visibles) | `.reu-soir-list`, l. 2088 | v2.153.0 | plausible |
| R8 | faible | Fiche détachée inutilisable quand l'app est ouverte en `file://` (origines distinctes) ; sans effet en https | `_ficheWinStart`, l. 58544 | v2.150.0 | plausible |

Sain : assemblage du fichier autonome (noms contenant `</script>`, apostrophes — `node --check`
passe), horloge et minuteurs (un seul, arrêt hors de la vue), élève supprimé ou transféré,
réunion sans créneau, parité logiciel / fichier hors R1, plusieurs réunions, thème sombre,
impressions. Hors périmètre : dans le fichier du collègue, les réglages redessinent la fenêtre à
chaque frappe dans un champ d'heure (même mécanisme que R4, v2.136.0, plausible).

### 3.2 Sauvegarde, synchronisation, fusion de versions (🔀 Récupérer ce qui manque)

Le cœur tient : rien d'ici n'est remplacé, « A » → note et jamais l'inverse, Ctrl+Z / Ctrl+Y,
horloge (l'autre poste voit `ahead`), clés `__proto__`, textes échappés, 1 500 fichiers malformés
sans plantage. Les défauts sont des **oublis de périmètre**, tous de la v2.167.0 (`182752e`).

| # | Gravité | Anomalie | Où | Preuve |
|---|---|---|---|---|
| **S1** | moyenne | **Deux appels « Hors créneau » du même jour sont pris pour des doublons** : un seul est proposé, l'autre part en pied de fenêtre avec « un appel du même créneau existe déjà ici » (faux) et ne peut pas être repris. `_findExistingAttendance`, la règle de référence, ne détecte volontairement rien sans créneau | `_mergeRun`, l. 38892 | app |
| **S2** | moyenne | **Devoir étendu à une autre classe sur l'autre appareil** : les notes sont reprises (« 5 saisies à reprendre »), mais `classIds` et les dates par classe ne sont pas fusionnés — le devoir **n'apparaît pas** pour cette classe, les notes sont là mais invisibles | `_mergeRun`, l. 38922-38953 | app |
| **S3** | moyenne | **« Rien à récupérer : tout est déjà dans la version actuelle » est faux** hors appels, devoirs et remarques de bulletin : oublis, travaux non faits, historique, notes d'élève, messages à la classe, mentions de conseil, réunions ne sont ni repris ni signalés. Même message pour un `.json` qui n'est pas une sauvegarde | `_mergeOpen`, l. 39000 | app |
| **S4** | moyenne | **« Récupérer » sur la ligne « Sync auto » d'une version distante laissée en attente** : après la fusion l'horloge locale domine, la relation passe de `diverged` à `behind`, et l'écriture suivante **écrase le fichier distant sans l'archiver** — ce que la fusion ne reprend pas (S3, élèves ajoutés là-bas) est perdu sans copie. Le chemin par la fenêtre de conflit, lui, archive d'abord | `_mergeApply`, l. 39026 ; `autoSaveDoIt`, l. 37966 | exéc. (relation) · lu (écrasement) |
| S5 | faible | Devoir « absent d'ici » ajouté avec une discipline ou des compétences créées là-bas : références inconnues ici, non signalées (colonnes probablement vides) | l. 38911-38920 | exéc. |
| S6 | faible | Même devoir créé séparément sur les deux appareils : ajouté en double, coché par défaut | l. 38911 | lu |
| S7 | faible | Barème réduit ici : une note de l'autre version est reprise hors barème, sans avertissement | `_mgFill`, l. 38863 | exéc. |
| S8 | faible | Remarques de bulletin d'un élève absent d'ici copiées quand même ; expression de la calculatrice reprise alors que la valeur d'ici est gardée (« 🧮 2+1 = 4 ») | l. 38961 | exéc. · lu |
| S9 | faible | Fichier forgé : une clé de classe `toString` / `hasOwnProperty` est acceptée (résolue par la chaîne de prototypes). Pas de XSS, pas d'effet fonctionnel | l. 38888-38901 | exéc. |

Sain : dossier de sauvegarde qui ne répond plus (v2.166.1 — minuteur annulé, réponse tardive
ignorée, pas d'écriture pendant l'attente).

### 3.3 Interface générale, élèves, photos

| # | Gravité | Anomalie | Où | Origine | Preuve |
|---|---|---|---|---|---|
| **I1** | moyenne | **Raccourcis H et P actifs en Vue Élève et dans la fenêtre de projection** : « h » y ouvre 📅 Appels passés (absents et retards) **à l'écran projeté**. A, D et T sont justement limités au Plan Prof pour cette raison | `keydown` global, l. 43530 | v2.163.0 (`1bd77b8`) | lu |
| I2 | faible | Infobulle périmée quand le code vide un `title` — c'est **A4** (§ 2). Même mécanisme pour l'`aria-label` posé au premier survol d'un bouton-icône, qui ne suit plus un `title` dynamique (🗖/🗗, 🔔/🔕) | l. 43881 | v2.150.1 | app |
| I3 | faible | Après une frappe, les infobulles ne reviennent pas si la souris bouge **lentement** : le seuil « > 3 px » porte sur chaque événement et non sur un cumul | l. 43910 | v2.163.0 | lu · gêne plausible |

Sain : recherche d'un élève dans toutes les classes, mini-plans cliquables de la fiche, récap
photocopies, trombinoscope agrandi / plein écran, photo au survol dans les fenêtres à plan, lot H.

### 3.4 Tableurs d'évaluation et calculs

Aucune anomalie ne fausse un calcul de note.

| # | Gravité | Anomalie | Où | Origine | Preuve |
|---|---|---|---|---|---|
| **T1** | moyenne | **Type A : une question ajoutée sans date reçoit des « A »** d'après la date d'une AUTRE séance, à chaque ouverture du tableur. Une mini-note sans date retombe sur la date du devoir, qui en type A vaut la dernière mini-note passée. Élève absent le 17/01 (I2) : il reçoit « A » en I2 (juste) **et en I3**, qui n'a pas eu lieu ; dater ensuite I3 ne retire pas ce « A ». Avant, ce repli ne jouait que sur un changement manuel de date | `_evalTableurSyncAbsents`, l. 55202 ; repli l. 55093 | v2.157.3 (`ebb9e3b`) | exéc. · mécanisme rejoué dans l'app |
| T2 | moyenne | **Grande photo flottante** : relâcher un glisser hors de la photo (butée du bord, coin d'agrandissement au maximum) peut **fermer le tableur** — le clic remonte au fond de la fenêtre, qui porte `closeMod`. Pas de perte (la fermeture enregistre) | `_mnpBigDrag`, l. 44150 | v2.162.0 (`fa4e799`) | plausible, à tester à la souris |
| **T3** | faible | **Cases pleines + sobriété : la croix de saisie disparaît des cases** (ligne et colonne transparentes) ; restent le nom, l'en-tête, le pied et l'anneau. La règle de sobriété (spécificité 1,2,1) bat celles de la croix (1,1,2). En pastilles, la croix reste | l. 61-68 contre l. 3308 | v2.148.0 (`15e4591`) | app |
| T4 | faible | Cases pleines + jeu de couleurs pastel : sur la croix, le gris de « A » et de « NN » **devient bleu**, presque identique au niveau 4 (`#2b67cd` contre `#2b70cc`) — le garde de saturation laisse passer `#9ca3af` | `_crossColor`, l. 49542 | v2.149.0 (`bdb8b04`) | exéc. |
| T5 | faible | **Copie annulée (triche), type B : le classeur XLSX / ODS garde les niveaux d'avant** — les feuilles Synthèse et Compétences appellent `_computeStudentCompetenceLevel` sans `_evalCompsVoided` (cinquième chemin, hors du test qui en impose quatre) | `_exnotesRun`, l. 40044 et 40202 | oubli de la v2.151.1 (`c1647c4`) | exéc. (fonctions) · lu |
| T6 | faible | Type B : un **« 0 » tapé** (vu, non évalué) devient « A » à l'ouverture suivante pour un élève absent à l'appel ; le type D, lui, garde le 0 | `_evalAutoFillAbsentsForPass`, l. 55164 | v2.157.3 (`ebb9e3b`) | exéc. |
| T7 | faible | Mode confidentiel : la grande photo reste affichée après avoir re-masqué l'élève, jusqu'au prochain changement de ligne | `_confRefresh`, l. 13771 | v2.162.0 | lu |
| T8 | faible | Grande photo jamais déplacée + fenêtre redimensionnée tableur fermé : à la réouverture, seuls 24 px en sont visibles à droite | `_mnpBigPlace`, l. 44106 | v2.162.0 | lu, cas rare |

Sain : case cachée par le pied Stats, note hors barème (Annuler, Conserver, Échap), Tab et
Entrée sur les cases « A », clic droit sur le plan du type B, les quatre fonctions de niveau
alignées sur la copie annulée.

### 3.5 Export ENT, Vers MBN, bilans

Aucune régression de **données** dans les cinq commits « 0 non évalué / absent / arrivé en cours
d'année / sous motif » : tableau, copie, CSV et favori sortent de la même fonction et donnent les
mêmes cases (types A / B / C / D, démo complète). Empreinte du favori : aucun faux « favori
périmé ». Bilans et conseil de classe : non touchés.

| # | Gravité | Anomalie | Où | Origine | Preuve |
|---|---|---|---|---|---|
| **M1** | moyenne | **Favori « Notes du devoir » : le réessai peut redéclencher le refus qu'il rattrape.** Pour un élève sous motif, le réessai renvoie le motif ; si MBN enchaîne et refuse la même requête à chaque fois, les trois essais s'épuisent (~13 s par élève sous motif). Si le **dernier** élève est sous motif, le bilan finit en **fausse alerte rouge** alors que tout est enregistré | `resave`, l. 8507 ; boucle l. 8662 | v2.165.2 (`e5eff75`) | exéc. sur modèle · plausible sur le vrai MBN |
| M2 | moy.-faible | Refus persistants (session expirée, MBN en panne) : trois essais **par élève** avant le bilan — 6 à 7 minutes pour 26 élèves, sans abandon anticipé | l. 8662 | v2.165.2 | exéc. sur modèle |
| M3 | moyenne si l'hypothèse est vraie | La ligne grise « rien n'est perdu » repose sur « n'importe quel POST réussi ensuite » : si MBN ouvre un élève par un POST, un refus réel passe pour rattrapé ; un refus applicatif (200 + `status:false`) tombe dans la même ligne grise, son message n'est plus affiché | l. 8490, 8684 | v2.165.2 | plausible (hypothèse sur MBN) · lu |
| M4 | moy.-faible | Type C, règle « Compétence évaluée plusieurs fois » (Dernier / Meilleur) : elle ne change que l'**Export ENT et Vers MBN** ; le Bilan des compétences et 📊 Résultats font toujours la moyenne. 4/4, 4/4, 0/4 → MBN reçoit 1 ou 4, le bilan affiche 3. Avec la règle par défaut : 0 écart sur 2 760 cases | l. 60438 contre l. 58084 | ancien (2026-07-30) | exéc. |
| M5 | faible | **« ⧉ Copier tout » de l'Export ENT ne passe pas par `_csvCellGuard`** : une remarque commençant par `=`, `+` ou `-` part telle quelle (invariant « tout export tabulaire ») | `_evalExportToTSV`, l. 60906 | ancien (mai) | lu |
| M6 | faible | CSV de l'Export ENT d'un devoir commun : le **nom du fichier** porte la première classe et sa date, le contenu est celui de la classe affichée | l. 60964 | ancien | lu |

---

## 4. L'outil d'audit lui-même

- **Faux positif** (thème clair, 4 lignes, une seule cause) : le bouton 🔒 du mode confidentiel,
  mesuré blanc sur papier à 1,08:1. Son rouge vient d'une ombre intérieure **animée**
  (`confBlink`) que l'outil coupe avec toutes les animations. À excepter dans `__aud`.
- **Trous de couverture révélés par cet audit**, à ajouter à `outils/audit-ui.js` :
  `appAlert` avec un message (A1) ; les tableurs **avec le curseur posé**, en pastilles et en
  cases pleines, avec et sans sobriété (A2, A3, T3) ; les fenêtres hors `.mo` (grande photo,
  fiche détachée).
- Les 245 tests ne couvrent pas le fichier du collègue : un `node --check` et un scénario
  « parent sans rendez-vous » sur le bloc `rdv-standalone-js` auraient attrapé R1. Un lint
  « pas de code après `//` sur une ligne qui contient `;` » dans ce bloc suffirait.

---

## 5. Par quoi commencer

1. **R1** — une ligne à couper en deux ; prévenir les collègues qui ont reçu un fichier depuis
   la v2.157.0 (le régénérer).
2. **T1** et **T6** — les faux « A » posés à l'ouverture du tableur.
3. **S1 à S4** — la fusion, toute récente : appels hors créneau, classes d'un devoir, message
   « Rien à récupérer », archive avant écrasement.
4. **I1** — H et P coupés en Vue Élève et en projection.
5. **A1, A2, A4** — lisibilité en thème sombre et infobulle périmée.
6. **R2, R3** — fiche détachée qui se ferme, appel effacé par le changement de classe.
7. **M1 à M3** — le réessai du favori MBN, à valider sur le vrai MBN avant de toucher.
8. Le reste (gravité faible) au fil de l'eau, avec les ajouts à l'outil d'audit (§ 4).

---

## 6. Corrections (v2.168.0)

Vérifié après correction : **255 tests** (10 nouveaux, `audit 2026-11-22 : …`), outil d'audit à
**0 partout dans les deux thèmes** — avec ses nouveaux états (130 fenêtres, tableurs avec le
curseur posé) —, et chaque scénario en défaut rejoué dans l'app.

| # | État | Ce qui a été fait |
|---|---|---|
| R1 | ✅ corrigé | la ligne est coupée en deux, commentaire en `/* … */` ; test qui refuse du code après un `//` dans les blocs embarqués. **Les fichiers déjà distribués (v2.157.0 à 2.167.1) restent à régénérer.** |
| R2 | ✅ | chaque instruction du `onclick` doit être de la consultation ; `_ficheGo` renvoie à la fenêtre principale (clic et Entrée) |
| R3 | ✅ | la classe du bandeau ne suit plus un rendez-vous pendant un appel ou une saisie de contraintes (`_reuClassBusy`, toast une fois). La Vue Élève projetée suit toujours la classe : inchangé |
| R4, R6 | ✅ | la ligne d'édition n'est plus recréée à chaque `change` ; Entrée sur un bouton joue ce bouton. Saisie réelle au clavier **non rejouée** (panneau masqué) : mécanisme vérifié, le champ n'est plus remplacé |
| R5 | ✅ | ↩ / ↪ recalent la classe du bandeau sur le rendez-vous affiché |
| R7 | ✅ | liste vide : hauteur minimale de 300 px |
| R8 | ◐ | impossible à lever (origines distinctes en `file://`) : la fenêtre dit maintenant pourquoi elle est vide |
| S1 à S4 | ✅ | appels hors créneau distincts ; classes et dates d'un devoir étendu reprises ; « diffère aussi sur… » en pied et fin du faux « tout est déjà ici » ; archive avant fusion depuis la ligne « Sync auto » (ce dernier point **non rejoué** : il demande un vrai dossier de sauvegarde) |
| S5 à S9 | ✅ | compétences / domaine / discipline repris avec le devoir ; doublon de devoir décoché ; note hors barème signalée ; remarques d'élève fantôme et expression incohérente écartées ; clés héritées refusées |
| I1 | ✅ | H et P coupés en Vue Élève et dans la fenêtre de projection |
| I2 = A4 | ✅ | un `title` vidé retire l'infobulle ; l'`aria-label` suit un `title` qui change |
| I3 | ✅ | déblocage sur le cumul du déplacement (12 px) |
| A1 | ✅ | `var(--ink-deep)` |
| A2, A3, T3 | ✅ | règles de la croix complétées (mesurées par l'outil, deux thèmes) |
| A5 | ✅ | le bouton 🎨 passe en bouton principal quand une sobriété est active |
| T1, T6 | ✅ | question sans date : plus de date empruntée quand d'autres sont datées ; 0 tapé conservé en type B. **Les faux « A » déjà posés restent** : rien ne les distingue d'un « A » juste |
| T2, T7, T8 | ✅ | clic avalé après un glisser (à confirmer à la souris) ; photo rafraîchie en mode confidentiel ; pas de placement tableur fermé |
| T4 | ✅ | les gris restent gris sur la croix (seuil de saturation 0,2) |
| T5 | ✅ | classeur : copie annulée au minimum en type B |
| M1, M2 | ◐ | réessais **bornés** et bilan en trois cas (rattrapé / enregistré puis requête enchaînée refusée / perdu). Sur simulation seulement : **à valider sur le vrai MBN**. Le favori glissé avant la 2.168.0 s'annoncera « plus à jour » (son code a changé) : le reglisser |
| M3 | ◐ | le message d'un refus dit par MBN est montré même rattrapé. **Non corrigé** : « rien n'est perdu » repose toujours sur « un POST réussi a suivi » — à observer sur le vrai MBN (👁 Observer MBN) avant de resserrer |
| M4 | ✅ (v2.168.1) | arbitrage de l'utilisateur : **la moyenne fait foi**. L'Export ENT et Vers MBN font la moyenne des questions en types A et C, comme les bilans ; l'option « Compétence évaluée plusieurs fois » n'est plus proposée que pour le type B. Vérifié sur la démo : 0 écart sur 954 cases, règles « Dernier » et « Meilleur » forcées |
| M5, M6 | ✅ | copie gardée contre les formules (nom, remarque) ; nom du CSV = classe affichée |
| § 4 | ✅ | outil d'audit : faux positif du 🔒 excepté, ouvreurs `appAlert`, tableurs avec le curseur |

Au passage : les toasts de ↪ disent « rétablir » (le mot « refaire » y traînait encore).
