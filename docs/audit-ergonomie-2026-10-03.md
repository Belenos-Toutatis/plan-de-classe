# Audit d'ergonomie n° 2 — où trouver, où régler, comment comprendre

**Date : 3 octobre 2026** · Base : `plan de classe.html` v2.68.0 (52 357 lignes)
**Angle :** architecture de l'information. Chaque information est-elle là où l'enseignant la cherche ? Peut-on la régler depuis les endroits où on la voit ? Se présente-t-elle de façon compréhensible, s'édite-t-elle de façon logique, et est-elle disposée pour qu'on identifie tout clairement ?

**Méthode :**
1. **Quatre inventaires de code**, en lecture seule et en parallèle. Pour chaque donnée (élève · classe, salle, classes mobiles · évaluations et bilans · réglages, commandes, impressions), on relève où elle s'affiche, sous quel nom, et où elle se modifie, avec quel geste.
2. **Parcours en direct** des 9 onglets, du tableur de saisie et des Réglages, sur les données de démo, en 1440 × 900.
3. **Vérification dans le code** de chaque défaut classé 🔴 avant de l'inscrire ici. Les constats non revérifiés portent la mention *(à confirmer)*.

> Ce document est un **catalogue de constats et de pistes** : rien n'est encore codé.
> L'audit du 29 juillet (tactile, clavier, densité) est en grande partie réalisé. **Points encore ouverts de cet audit-là :**
> - les couleurs de groupe en Vue Élève, encore constaté en direct : G1 et G2 y ont le même bleu ;
> - la saisie de rentrée.
>
> Le `thead` collant de l'onglet Élèves est fait (v2.63.5).
> Rappel : l'app n'est **pas** visée pour un usage 100 % clavier (choix de l'utilisateur), et rien ici ne le propose.

---

## Vue d'ensemble

L'app est très riche et la plupart des données sont **accessibles quelque part**. Les frictions viennent de six familles de problèmes :

1. **Des défauts qui trompent ou font perdre quelque chose**, sans message (§ 1) :
   - une place réservée écrasée ;
   - un historique effacé par une remise à zéro ;
   - une info confidentielle montrée à la place d'un statut ;
   - une dispense devenue impossible à voir et à retirer.
2. **Des fiches et des écrans en lecture seule là où l'on veut agir.** La fiche complète montre presque tout mais ne laisse rien modifier sur place. Le plan, écran principal en cours, ne permet de régler ni le groupe ni les tags (§ 2).
3. **La portée d'un réglage n'est pas dite.** Config Salle mélange des réglages de la salle et des réglages de la classe sans nommer la classe. Plusieurs défauts locaux écrasent en silence les réglages généraux. Les Réglages se disent complets mais ne le sont pas (§ 3, § 5).
4. **Le contexte n'est pas affiché.** Ni le tableur, ni les bilans, ni les titres d'onglet ne disent quelle classe, quelle période, quelle discipline (§ 4).
5. **Le vocabulaire et les icônes divergent** :
   - 📊 désigne 7 fonctions, 📋 en désigne 9, ⚙ en désigne 9 ;
   - la notion de réglage a trois noms : Réglages, Paramètres, Réglages de l'évaluation ;
   - « Notes » survit au sens d'« Informations » ;
   - des aides décrivent des chemins qui n'existent plus (§ 6).
6. **Les impressions et exports ne sont pas toujours là où l'on consulte la donnée.** Les bilans ne s'impriment pas, l'export des notes est caché dans le bandeau, la fiche élève ne s'imprime pas (§ 5.3).

---

## 🎯 Top 15 prioritaire

| # | Constat | Gravité | Effort |
|---|---|---|---|
| 1 | Place réservée à un élève **pas encore arrivé** écrasée en silence (§ 1.1) | 🔴 | faible |
| 2 | **Remettre les compteurs à zéro efface aussi l'historique des rappels faits** ; le ↺ de ligne n'a pas de confirmation (§ 1.2) | 🔴 | faible |
| 3 | Sur le plan, l'**infobulle d'un badge de statut affiche les Informations** de l'élève (« PAI » → texte privé) (§ 1.3) | 🔴 | très faible |
| 4 | **Dispense** d'une question : appliquée au calcul mais invisible et non modifiable (§ 1.4) | 🔴 | moyen |
| 5 | **Projeter** depuis le tableur projette la classe du bandeau, pas celle du tableur (§ 1.5) | 🔴 | très faible |
| 6 | Réglages d'une évaluation : moitié enregistrée tout de suite, moitié au ✓, « Annuler » partiel (§ 1.6) | 🔴 | moyen |
| 7 | Changer le groupe dans une **classe recomposée** le change aussi dans la classe d'origine, sans le dire (§ 1.7) | 🔴 | faible (avertir) |
| 8 | **Absences** : l'onglet Élèves compte une seule classe en disant « tous les appels », la fiche compte toutes les classes (§ 1.8) | 🟠 | faible |
| 9 | Défauts « Touche Entrée » et « Tri des élèves » des Paramètres : **l'un est sans effet, l'autre réimposé à chaque ouverture** (§ 1.9) | 🟠 | faible |
| 10 | **Bilans non imprimables** ; Ctrl+P dans Devoirs affiche un message de développement (§ 5.3) | 🟠 | moyen |
| 11 | Config Salle : **la classe concernée n'est nommée nulle part**, la salle affichée ne suit pas la classe, le conseil de blocage est faux (§ 3.1) | 🟠 | moyen |
| 12 | Fiche complète **en lecture seule** : groupe, tags, place, tablette, AESH, contraintes non cliquables (§ 2.1) | 🟠 | moyen |
| 13 | **Tags d'un élève** modifiables uniquement par sélection multiple ; deux aides promettent d'autres chemins (§ 2.2) | 🟠 | faible |
| 14 | Contexte absent : tableur et bilans **sans classe, période, date** dans leur titre (§ 4) | 🟠 | faible |
| 15 | **Passe de vocabulaire et d'icônes**, et textes d'aide périmés (§ 6) | 🟡 | faible, étalé |

---

## 1. 🔴 Défauts qui trompent ou font perdre quelque chose

Tous vérifiés dans le code.

### 1.1 Place réservée écrasée sans prévenir
La place d'un élève dont la **date d'arrivée est future** reste dans `seating`, mais le plan la dessine **vide, sans aucun repère** (`buildCell`). Déposer un autre élève dessus déclenche `dropOnCell`, qui fait un échange ou renvoie en « non placés » l'élève attendu, sans message.
→ Dessiner la case en fantôme (« 📅 réservé — Prénom, arrive le JJ/MM ») et demander confirmation avant de la prendre.

### 1.2 Les remises à zéro des compteurs effacent l'historique des rappels
Les quatre remises à zéro font toutes `history = []` : ↺ de la ligne (`resetOne`, **sans confirmation**), ↺ de la barre, ↺ de la sélection, « 🗑 Tout effacer » de l'historique. Or `history` contient aussi les entrées `rappel_fait`.
→ Ne retirer que les entrées `oubli` / `nt` ; confirmer le ↺ de ligne ; dire ce qui est effacé.

### 1.3 L'infobulle des statuts montre les Informations
Les badges PPRE, PAP, PPS, ULIS, UPE2A, PAI des cases ont pour infobulle `stu.notes || 'PPRE'` : survoler « PAI » affiche le texte libre des Informations (santé, famille…). C'est **trompeur** et **indiscret** devant la classe ou un parent. Par ailleurs, l'infobulle de la case liste PPRE, PAP, PPS, PAI, -A et +⅓, mais **pas** ULIS, ULIS+, UPE2A ni UPE2A+.
→ Nom du statut dans l'infobulle ; les Informations restent sur le badge 📋.

### 1.4 La dispense n'existe plus qu'en calcul
`ev.notes[sid].excluded` (« retirer cette question pour cet élève ») est **appliqué** au calcul de la note, et la démo en sème. Mais il ne se réglait que dans la **fiche de saisie** `meval-saisie`, retirée du HTML : `_evalOpenSaisie`, `_evalSaisieToggleExcluded` et `_evalSaisieSaveAmen` ne sont plus appelées. Conséquences : une note tapée dans une question dispensée est ignorée sans un mot, et on ne peut pas retirer la dispense. Même chose pour la fiche passation du Type B (`_evalOpenPassationSaisie`).
→ « Dispenser de cette question » au clic droit sur la cellule, cellule hachurée « disp. » dans le tableur, puis supprimer le code mort. La **date individuelle de rattrapage** n'existe qu'en Type C pour la même raison : l'ouvrir aux quatre types.

### 1.5 Projeter depuis le tableur : mauvaise classe
`_renduOpen` lit `input[type=radio]:checked` dans `#meval-tableur-classpicker`. Or ce sélecteur n'est fait que de **boutons**, donc on retombe sur `S.cur`. Sur une évaluation multi-classes, on projette la classe du bandeau, pas celle qu'on saisissait.
→ Lire `meval-tableur.dataset.classid`. Même vérification à faire pour l'Export ENT ouvert depuis la liste *(à confirmer)*.

### 1.6 Réglages d'une évaluation : deux modes d'enregistrement
Dans `meval-edit`, les **classes et dates** s'écrivent tout de suite, le reste attend « ✓ Enregistrer ». Conséquences :
- « Annuler » ne revient pas sur les dates ni les classes ;
- fermer par le fond ou Échap perd les textes sans prévenir (`_evalEditDirty` n'est jamais lu à la fermeture).

→ Un seul modèle : tout en brouillon jusqu'au ✓, avec confirmation si la modale est modifiée.

### 1.7 Le groupe est global à l'élève
`stu.groupe` est unique. Le régler dans l'onglet Élèves d'une **classe recomposée** (DNL, Devoirs faits) change le groupe G1/G2 de la classe d'origine.
→ À court terme, avertir (« ce groupe s'applique aussi en 6e A »). À plus long terme, stocker le groupe par classe *(chantier)*.

### 1.8 Les absences : deux comptes sous le même nom
L'onglet Élèves et la Vue d'ensemble comptent via `getStudentAttendanceStats(classId)`, donc **une seule classe**, alors que l'infobulle dit « sur tous les appels ». La fiche et l'historique additionnent toutes les classes. Dans la Vue d'ensemble, un élève apparaît deux fois (classe d'origine et recomposée) avec des chiffres différents.
→ Le même total partout, ou « dans cette classe » écrit en clair.

### 1.9 Défauts généraux qui ne s'appliquent pas
- **Touche Entrée** : la valeur choisie dans le tableur (`localStorage`) **l'emporte définitivement** sur le défaut des Paramètres. Changer le défaut n'a plus aucun effet sur la machine, sans un mot.
- **Tri des élèves** : à l'inverse, le défaut est **réimposé à chaque ouverture** du tableur, donc le choix fait dans le tableur n'est jamais retenu *(à confirmer en usage)*.
- L'infobulle du sélecteur Entrée décrit encore deux modes retirés (« Élève suivant », « Colonne par colonne »).

→ Une seule source par réglage. Si le tableur garde son choix, retirer le défaut des Paramètres, ou l'effacer à l'enregistrement.

### 1.10 Autres pertes silencieuses, ou textes qui disent le contraire du code
- **Passage semestre ↔ trimestre** (Paramètres d'évaluation) : remappe les évaluations, fusionne les remarques, efface les présences par période, **sans confirmation** — un toast après coup.
- **Paramètres d'évaluation → 💬 Bibliothèque / ⚖ Motifs** : la modale se ferme **sans enregistrer** puis se rouvre depuis `S`. Les modifications en cours sont perdues.
- **« 🔀 Mélanger tout »** : le pied de la modale affirme que décocher une règle « n'affecte que ce placement » et parle d'un « niveau de paires » supprimé. Le code **mémorise** ces règles pour la salle, et les écrit **avant** `pushUndo` : Ctrl+Z ne les annule pas.
- **Activer un statut ou une mention en retire un autre en silence** (« PAP activé » sans « PPRE retiré »).
- **Fiche de prêt des tablettes** : change la salle et la classe mobile actives de la classe, sans les restaurer *(à confirmer)*.

---

## 2. 🟠 Informations visibles mais pas modifiables là où on les voit

### 2.1 La fiche complète
Elle rassemble presque tout, et c'est sa force. Mais seuls ✏️ (Modifier), les 🕓, Informations et Rappels y sont actifs.

| Ligne de la fiche | Aujourd'hui | Attendu |
|---|---|---|
| Groupe, tags, rôle | lecture seule | clic → réglage sur place |
| Place | lecture seule | clic → sélecteur de place (`mseatpick`, il existe) |
| Tablette | mode classe entière seulement, lecture seule | clic → sélecteur de tablette |
| AESH liée | lecture seule (se règle seulement en Config Salle → AESH) | clic → Config Salle, mode AESH |
| Contraintes (places autorisées, paires à séparer) | **absentes** | ligne « Places autorisées : N · À séparer de : … » |
| Départ prévu | ligne « Dates » | aussi un badge dans l'onglet Élèves (seul un départ déjà effectif s'y voit) |
| Moyenne d'une période | 🕓 → historique | clic → détail du calcul (aujourd'hui 4 niveaux plus loin) |

La fiche n'a ni impression ni export, alors que c'est l'écran de l'entretien avec les parents (→ « 🖨 Imprimer la fiche »).

### 2.2 Élève — où se règle quoi (extraits de la matrice)

| Info | Où on la voit | Où on la règle | Manque |
|---|---|---|---|
| **Tags** | Élèves (pastilles non cliquables), plan, fiche | **seulement** sélection multiple → « 🏷 Tags… », ou import | `me`, clic droit, fiche, pastille cliquable comme celle du groupe. Deux aides mentent (Config Salle → Tags : « onglet Élèves → édition élève » ; Réglages → Tags : « Plan Prof → mode Tags »). |
| **Groupe** | Élèves, plan, Vue d'ensemble, fiche | Élèves (clic sur la pastille), sélection multiple, `me`, import | rien sur le plan ni au clic droit, alors que c'est l'écran du cours |
| **Civilité** | Élèves (petit bouton ♂/♀), fiche | Élèves (clic qui fait défiler), `me` | changer la civilité ne redessine pas le plan *(à confirmer)* |
| **Rappels** | plan (badge, élève placé seulement), clic droit, fiche | `mreminders` | **rien dans l'onglet Élèves ni dans la liste des non placés** : un élève non placé n'a qu'un chemin, Élèves → nom → fiche → titre « Rappels » |
| **Statuts** | Élèves (boutons), plan (badges), fiche, non placés | Élèves, clic droit, `me`, import | gestes différents selon l'écran : ULIS à trois états dans Élèves, deux entrées au clic droit ; libellés PPS / GEVAsco/PPS / PPS / Gevasco |
| **AESH liée** | plan (badge 🤝), fiche | **Config Salle → AESH uniquement** | rien au clic droit, dans `me` ni dans la fiche |
| **Mentions de conseil** | fiche | colonne 🎓 du Bilan des notes | le catalogue ne se règle que par ⚙ Réglages, sans lien depuis la colonne |
| **Remarque de l'élève sur une évaluation** | tableur, ✎ du Bilan des notes | tableur **et** clic sur une note du Bilan | un clic sur une note devrait plutôt montrer le détail du calcul (§ 4) |
| **Nom → fiche** | Élèves, bilans | — | le nom n'ouvre pas la fiche dans les tableurs de Devoirs, la Vue d'ensemble, les non placés, Tablettes |

### 2.3 Classe et salle
- **Les salles d'une classe ne figurent pas sur sa carte** (la carte d'une classe recomposée, elle, les montre) et ne se modifient pas dans « Modifier la classe ». Ajouter une salle se fait depuis Élèves ou Plan ; la retirer, **par un clic droit caché** sur le bouton de salle, inopérant au doigt.
- Pour une classe recomposée, le champ « Salle » **ajoute** une salle au lieu de remplacer la salle active.
- **Le niveau d'une classe est déduit de son nom par une expression régulière**, sans réglage possible. « Sixième A », « Bilingue 6e » ou « ULIS » tombent en gris « Autre », ce qui fausse les couleurs, le tri du sélecteur et le récap photocopies. → Champ « Niveau » dans les modales de classe, pré-rempli.
- L'**identifiant** d'une classe réelle est figé après création (modifiable pour une recomposée). Il est invisible alors qu'il part dans l'export QCMCam.
- **Renommer une salle** change en silence les identifiants QCMCam `classe-salle`.
- **Horaires** : saisis salle par salle, sans « appliquer à toutes les salles ». L'emploi du temps est pourtant celui de l'établissement.
- **Tablettes indisponibles** : visibles 🚫 dans le sélecteur de tablette, mais marquables seulement dans la fiche du pool, en bas de l'onglet.
- Les **cartes de classes recomposées** n'affichent ni messages 📣, ni délégué·es, ni disciplines, ni tiers-temps.

### 2.4 Évaluations
- Les statuts qui changent la moyenne sont **invisibles en liste** : facultative (★ seulement dans le Bilan), diagnostique (nulle part), note ajustée ⚖ (ni dans le Bilan ni dans son infobulle).
- **Pondération du Type B** : modifiable aussi depuis une modale de consultation (bilan des compétences d'une évaluation), avec un autre libellé et un autre ordre d'options.
- **Les 4 types ne s'éditent pas de la même façon** :
  - le Type D n'a ni menu clic droit sur l'en-tête, ni « ⊘ non faite par cette classe » ;
  - la colonne Rattrapage n'existe qu'en C ;
  - la date d'une éval mono-classe n'apparaît pas dans le tableur, et en C/D elle ne se règle que dans ⚙.
- **Choix des classes** : toutes les classes à la création, **même niveau seulement** en modification.
- **Modifier une passation** passe par « Éditer en détail », dans une modale titrée « + Nouvelle passation » avec un bouton « ✓ Créer ».
- **Référentiel de compétences** : on ne l'atteint que depuis le Bilan des compétences et les Réglages. Aucun lien « + nouvelle compétence » dans les sélecteurs.
- **Échelle écrite en dur** (« 1–4 », « /4 », « N1 → N4 », `/${20}` littéral) alors que le nombre de niveaux se règle de 2 à 6.

---

## 3. 🟠 La portée des réglages n'est pas dite

### 3.1 Config Salle
- **Titre et contenu en décalage.** Le titre dit « Catalogue partagé entre toutes les classes », mais **4 modes sur 6 sont propres à une classe** : Groupes, Tags, Contraintes, AESH. **La classe concernée n'est écrite nulle part** dans l'onglet. Seule une phrase d'aide dit « Spécifique à la classe sélectionnée » (la classe du bandeau).
- **La salle affichée ne suit pas la classe.** Elle n'est choisie d'après la classe qu'au premier passage. Après un changement de classe, on peut rester sur une salle que la classe n'utilise pas.
- **Le message de blocage est faux.** Il dit « Activez-la depuis l'onglet Plan Prof », ce qui est impossible pour une salle non rattachée. Contraintes et AESH n'ont même pas ce message.

→ Deux groupes de modes : « Salle (toutes classes) : Tables, Îlots » et « Classe **6e A** dans cette salle : Groupes, Tags, Contraintes, AESH ». Synchroniser la salle à l'entrée dans l'onglet. Remplacer le message par un bouton « Rattacher cette salle à 6e A ».

Autres points de l'onglet :
- jargon « ⚡ Auto G1/G2 (no-tables) » ;
- « 🗑 Supprimer cette salle » collé au champ Nom ;
- l'aide du mode Groupes renvoie à un « bouton 🔀 sur un tag » de l'onglet Élèves, qui n'existe plus ;
- l'onglet s'appelle « Config Salle » dans la navigation et « Salles » dans son titre.

### 3.2 Réglages rangés selon leur portée
| Réglage | Portée réelle | Où on le règle | Proposition |
|---|---|---|---|
| Impression **Couleurs / N&B** | **toutes** les impressions (7 chemins) | seulement Plan → 🖨 Imprimer ▾ | Réglages → « 🖨 Impression » (et rappel près de chaque bouton d'impression) |
| Mentions de conseil | toutes les classes | seulement ⚙ Réglages | aussi un ⚙ dans l'en-tête de la colonne 🎓 |
| Motifs de rappel | global | seulement ⚙ Réglages ; la modale Rappels affiche les motifs sans pouvoir les modifier | lien « ✎ motifs » dans la modale, comme pour les commentaires |
| Options de mélange | par salle | seulement en confirmant un mélange complet | bouton « Enregistrer sans mélanger » et entrée en Config Salle |
| Places exclues QCMCam | par salle | onglet QCMCam, via une classe | les montrer aussi en Config Salle |
| Nom de l'enseignant (fiche de prêt) | identité | modale de prêt, stocké hors préfixe (`iprint-prof`) | Réglages → « Enseignant », synchronisé |
| Minuteur, sonomètre | par machine | ⏲ / ⚙ du widget | section « Outils de classe » dans les Réglages |
| Patterns de ramassage | par salle | Config Salle | lien depuis le tri « pattern » du tableur |

**Les Réglages annoncent « Tous les réglages de l'app en un seul endroit », mais il leur manque :** l'impression, les salles et horaires, les classes mobiles, les outils de classe, le dossier des photos et l'enseignant. Soit on les ajoute, au moins sous forme de liens, soit on retire la phrase.

---

## 4. 🟠 Le contexte n'est pas affiché

- **Titres des onglets sans le nom de la classe** (« Élèves », « Bilan des notes ») : la classe ne se lit que dans le sélecteur du bandeau.
- **Le titre du tableur ne dit que le nom de l'évaluation** (« 🎯 Démarche — saisie tableur »), sans classe, période ni date. À 1440 px, il est tronqué (« Déma… ») par une barre de 19 contrôles, dont 12 icônes seules.
- **Une évaluation orpheline ouverte depuis le Bilan** bascule le tableur sur la classe d'origine, sans le dire.
- **Discipline** : quand le sélecteur est masqué (une seule discipline), rien n'indique que remarques de classe et éléments travaillés sont rangés par discipline.
- **Vue Élève** : aucun onglet de la navigation n'est allumé, on ne sait pas où l'on est.
- **Gestes du Bilan des notes** :
  - **clic sur une note** = remarque de l'élève, alors qu'on attend le détail du calcul, aujourd'hui accessible seulement par fiche → 🕓 → Notes → ligne ;
  - le mode d'emploi dit « clic **droit** » sur le code d'une évaluation alors que c'est un clic gauche ;
  - le champ coefficient de l'en-tête est invisible (bordure transparente) ;
  - un ⚙ minuscule y règle l'arrondi de la moyenne.

→ Bandeau de contexte « 6e A · S1 · Physique-chimie » dans les onglets Évaluations et dans le titre du tableur, de la projection et de l'Export ENT. Clic sur une note = petit panneau « détail du calcul · remarque · ouvrir la saisie ».

---

## 5. Organisation globale

### 5.1 Barres d'outils
- **Élèves** : 13 boutons sans regroupement, deux destructifs au milieu (« ↺ Réinitialiser compteurs » orange, « 🗑 Retirer toutes les positions » rouge). Trois boutons agissent sur **toutes** les classes : 🏷 Tags (catalogue), 📊 Vue d'ensemble, et les photos. Deux 📊 voisins ont des fonctions différentes : Vue d'ensemble et « Export » (qui exporte les positions).
  → Groupes : Élèves (Ajouter, Importer) · Photos (Photos, Trombinoscope, Mémoriser) · Positions (Saisir, Exporter, Retirer…) · Suivi (Vue d'ensemble, Snapshots, Imprimer) · actions destructives à droite.
- **Plan Prof** : environ 35 contrôles sur 3 rangées. ↩ / ↪ **n'existent que là** alors que Ctrl+Z est global (→ ↩ ↪ dans le bandeau, ou « Annuler » dans le toast après chaque action destructive). Couleurs de groupe sans légende.
- **Vue Élève** : ordre du zoom inversé (🔍+ 🔍− 100 %) par rapport au Plan (🔍− 100 % 🔍+).
- **Bilans** : les exports sont en tête dans un bilan, en queue dans l'autre ; « Copier tout » dans l'un, « Copier » dans l'autre.
- **Réglages** accessibles depuis un seul onglet : ⚙ Paramètres et 🎓 Disciplines dans Devoirs, « Gérer les compétences » dans le Bilan des compétences, mentions via le bandeau. → Le même groupe ⚙ dans les trois onglets Évaluations.
- **Classes** : « 🗑 Réinitialiser… » agit sur **le fichier entier** (fin d'année, tout effacer, démo). Sa place est dans Données ▾ ou Réglages → Sauvegarde. « 🖨 Bilan » (effectifs et photocopies) se confond avec les deux Bilans d'évaluation → « 🖨 Effectifs ».

### 5.2 Aide
Trois façons de présenter l'aide selon l'onglet :
- **onglets Évaluations** : mode d'emploi **repliable** (✕ / ?) — le bon modèle ;
- **QCMCam** (5 blocs, environ deux tiers de l'écran), **Tablettes** (rappel légal), **Config Salle** : bandeaux permanents ;
- **Plan et Élèves** : infobulles au survol seulement, **invisibles au doigt** sur la Surface en mode tablette.

→ Généraliser le mode d'emploi repliable ; ouvrir les pastilles `?` au toucher.

### 5.3 Impressions et exports — accessibles depuis l'endroit où l'on consulte ?
| Donnée | Impression / export | Problème |
|---|---|---|
| Bilan des notes, Bilan des compétences | **aucune impression** ; Ctrl+P = impression brute du navigateur | données du conseil de classe → « 🖨 Imprimer » |
| Devoirs | Ctrl+P affiche « Impression des évaluations à venir (phase 10 — export ENT) » | message de développement resté en place |
| Notes en XLSX / ODS | **seulement** Données ▾ dans le bandeau | absent de Devoirs et des Bilans |
| Export ENT | ligne de Devoirs (💾), tableur (💾), Bilan des compétences (📤) | absent du Bilan des notes ; deux icônes pour le même export |
| Fiche complète, Vue d'ensemble | rien | entretien avec les parents, suivi des absences |
| Statistiques d'absence (CSV) | Plan → Appels passés → 📊 Stats → export | trois niveaux, rien depuis Élèves |
| Plans QCMCam | 🎯 Marqueurs → « 📋 Choisir les salles… » | caché, libellé trompeur |
| Import des résultats QCMcam | tableur de Devoirs (📂) | aucun renvoi depuis l'onglet QCMCam |
| Trombinoscope | modale 🖼 (onglet Élèves) | absent du menu 🖨 Imprimer du Plan, alors que le Plan a un mode Trombinoscope |
| Positions (CSV) | onglet caché « Export » | colonne « Notes » qui contient les Informations |

---

## 6. 🟡 Compréhension : vocabulaire, icônes, textes périmés

### 6.1 Une icône pour plusieurs fonctions
| Icône | Sens rencontrés |
|---|---|
| 📊 | onglet Devoirs, Vue d'ensemble, Export des positions, Stats d'absence, bilan des compétences d'une évaluation, vue Diagramme… |
| 📋 | **Informations**, Copier (×6), **Dupliquer** une évaluation, Patterns ramassage, Catalogue des disciplines… |
| ⚙ | Réglages, Actions ▾, Paramètres d'évaluation, Réglages d'une évaluation, Gérer les compétences, Config Salle, Sauvegarde auto, sonomètre, minuteur |
| 🎲 | Placer les non placés, Interroger, Mélanger (dans la modale ; 🔀 dans le menu) |
| 🔒 | **Mode confidentiel** et **Contraintes** |
| 🎓 | Disciplines, Conseil de classe, Aménagements, Fin d'année |
| 📷 | onglet QCMCam, Photos |
| 🗑 / ✕ | 🗑 = supprimer presque partout, mais **✕ rouge = supprimer une évaluation** |
| 🎨 | impression couleurs/N&B, coloration du plan, Sobriété du tableur |

→ Une icône par concept. Par exemple : ⧉ pour Dupliquer et Copier, 📋 réservé aux Informations, 🗑 pour toute suppression, 🔀 pour tout mélange, un pictogramme propre aux Contraintes (📐 ou ⛓).

### 6.2 Mots
- **Réglages / Paramètres / Réglages de l'évaluation** : hiérarchie nommée à l'envers. → « Réglages », précisé par sa portée : « Réglages des évaluations », « Réglages de ce devoir ».
- **Devoir / évaluation / éval** ; **flux / discipline** ; **mini-note / question / item** ; « Descriptif » désigne deux champs différents ; « Granulométrie » (→ « arrondi » ou « précision »).
- **Validation** : Enregistrer, Sauvegarder (élève, classe, informations), Valider, OK, Appliquer, Créer. Des modales de consultation se ferment par « Annuler ». → « Enregistrer » partout ; « Fermer » quand rien n'est en attente.
- **Réinitialiser** désigne à la fois les compteurs d'une classe et le fichier entier. « Tout effacer » désigne à la fois l'historique d'un élève et le fichier. Les verbes « Retirer » sont précédés de quatre icônes différentes.
- **« Éditer »** (cartes de classes) vs **« Modifier »** (partout ailleurs).
- **Anglicismes** : Snapshots, Patterns, Tags, no-tables.
- **Tutoiement et vouvoiement mélangés** (Réglages : « Activez… » ; évaluations : « Tu peux… »).
- **Trois notions de sauvegarde sans lien visible** : 📸 Snapshots (onglets), 📌 jalons et versions (derrière « 📂 Ouvrir », dont le libellé ne le laisse pas deviner), Export et backups (Données).

### 6.3 Textes périmés ou faux (corrections rapides)
- « **Notes** » au sens d'Informations : bouton Export (infobulle), colonne de l'export des positions, pastille d'aide du Plan, message de changement de classe d'un élève. Exemple du champ dans `me` : « Aménagements, PAP, observations… », qui pousse à recopier les statuts.
- Pastille d'aide du Plan : « clic droit → déplacer, retirer, notes, rappels » (« déplacer » n'existe pas).
- Tablettes : « affectez un n° **via le menu déroulant** » (le menu déroulant n'existe plus) ; l'état vide renvoie à Plan → Actions alors que le bouton est sur place. L'alerte « 30 élèves sans tablette » additionne les modes G1/G2 même pour une classe qui ne travaille jamais en demi-groupe.
- Config Salle : aides des modes Groupes et Tags (chemins disparus, voir § 3.1).
- Réglages → Tags : « Plan Prof → mode Tags ».
- Infobulles qui citent d'anciens noms d'onglet : « Bilan par compétences », « Bilan des évaluations » ; infobulle de navigation du Bilan des notes (« moyenne par domaine du socle »).
- « Compte dans la moyenne **du semestre** » (faux en mode trimestre). « 1 à 3 compétences » annoncé mais pas imposé.
- Table des raccourcis de ⓘ incomplète :
  - la portée du zoom et des touches 0–3 n'est pas indiquée ;
  - Échap fait plus que ce qui est annoncé ;
  - absents : Ctrl+Maj+Z, le zoom Ctrl+± de la projection, les touches du jeu Mémoriser, Ctrl+V pour coller une photo dans la fiche.
- Casse : « QCMCam » et « QCMcam » dans la même page.

### 6.4 Code couleur des statuts
- **Plan** : ULIS = UPE2A (gris), ULIS+ = UPE2A+ (violet), conformément à l'arbitrage noté dans CLAUDE.md.
- **Onglet Élèves** : ULIS vert, ULIS+ violet, UPE2A sarcelle, UPE2A+ rouge.
- **Menu clic droit** : d'autres pastilles encore.
- **Fiche** : « parti » prend le gris ULIS, « Aussi dans » le violet ULIS+.
- **Tiers-temps** : la couleur de l'agrandissement dans Élèves et `me`, le violet `--tt-fg` sur le plan.

→ Une seule palette, définie par des variables CSS, utilisée partout ; un style neutre pour les badges qui ne sont pas des statuts.

### 6.5 Lisibilité des écrans
- **Carte de classe** : l'effectif tient en une phrase très dense (« 30 inscrits (♂24 ♀4 + 2 ?), 30 placés, 29 normalement présents dont 21 non aménagés, 8 aménagés »). Le « + 2 ? » (civilité non renseignée) est cryptique. « N placés » ne concerne que la salle **active**, sans le dire.
- **Onglet Élèves** : la colonne « Grp » mélange groupe et tags ; la civilité n'est qu'une minuscule icône avant le nom.
- **Bilan des notes** : mentions « F E AT AC » sans légende visible.

---

## 7. Plan d'action proposé (par lots, à valider)

> **Lot A — fait en v2.68.1 (3 octobre 2026) :**
> - place réservée dessinée et protégée par une confirmation (§ 1.1) ;
> - remises à zéro qui gardent les rappels traités, ↺ de ligne confirmé (§ 1.2) ;
> - infobulles des statuts = nom du statut, ULIS et UPE2A ajoutés à l'infobulle de la case (§ 1.3) ;
> - projection **et** Export ENT sur la classe du tableur ouvert (§ 1.5) ;
> - message « phase 10 » remplacé par une indication utile ;
> - confirmation récapitulative avant le passage semestre ↔ trimestre ;
> - pied de « Mélanger tout » corrigé, et règles de mélange écrites après `pushUndo` (annulables) ;
> - textes du § 6.3 corrigés (Informations, menus déroulants des tablettes, aides de Config Salle et des Réglages, anciens noms d'onglet, « moyenne de la période », « une ou plusieurs compétences », infobulle de la touche Entrée, « clic » sur le code d'une évaluation).
>
> **Lot B — fait en v2.68.2 :**
> - Réglages d'une évaluation en brouillon : copie à l'ouverture, confirmation à la fermeture d'une modale modifiée, abandon complet (classes et dates comprises) (§ 1.6) ;
> - tri des élèves et touche Entrée : le tableur retient le choix, les Paramètres donnent la valeur de départ et la réappliquent quand on les change (§ 1.9) ;
> - bibliothèques de commentaires et de motifs ouvertes par-dessus, sans perte de saisie (§ 1.10) ;
> - Réglages : sections « 🖨 Impression » et « 🧭 Autres réglages, rangés là où ils servent », phrase d'en-tête corrigée (§ 3.2).
>
> **Non traité dans ce lot :** la dispense (§ 1.4, demande une nouvelle interface : lot C), `meval-edit` en brouillon (§ 1.6, lot B), le retour des bibliothèques (§ 1.10, lot B), la casse QCMCam / QCMcam et la table des raccourcis (lot F).

| Lot | Contenu | Risque | Taille |
|---|---|---|---|
| **A — Corrections immédiates** | § 1.1 place réservée, § 1.2 historique, § 1.3 infobulle des statuts, § 1.5 projection, message « phase 10 », textes périmés du § 6.3, confirmation du passage semestre/trimestre, pied de « Mélanger tout » | très faible | ½ journée |
| **B — Une seule source par réglage** | § 1.6 `meval-edit` en brouillon, § 1.9 Entrée et tri, § 1.10 retour des bibliothèques, Couleurs/N&B dans les Réglages, compléter les Réglages ou nuancer la phrase | faible | 1 journée |
| **C — Agir là où l'on voit** | fiche cliquable (§ 2.1), tags d'un élève (`me` + clic droit + pastille), groupe au clic droit du plan, rappels dans Élèves et non placés, AESH au clic droit, nom → fiche partout, dispense et rattrapage pour les 4 types (§ 1.4) | moyen | 2 journées |
| **D — Contexte et portée** | bandeau de contexte des Évaluations, titre du tableur, Config Salle en deux groupes avec la classe nommée et la salle synchronisée, salles sur la carte de classe et dans `mce`, niveau de classe réglable | moyen | 1,5 journée |
| **E — Impressions et exports** | impression des deux Bilans, export des notes depuis Devoirs et les Bilans, Export ENT unifié, impression de la fiche, CSV de la Vue d'ensemble, trombinoscope dans 🖨 du Plan, Plans QCMCam dans la barre de l'onglet | faible | 1,5 journée |
| **F — Vocabulaire et icônes** | glossaire (Réglages, Enregistrer, Évaluation, Question, Discipline, Arrondi), une icône par concept, palette unique des statuts, tutoiement *ou* vouvoiement, raccourcis de ⓘ | faible mais transverse | 1 journée |
| **G — Chantiers à arbitrer** | groupe par classe (§ 1.7), horaires d'établissement par défaut, barres d'outils regroupées, aide repliable généralisée et `?` au toucher, couleurs de groupe en Vue Élève | à discuter | — |

**Ordre conseillé : A → B → C**. Le lot A corrige ce qui trompe ou fait perdre quelque chose ; B et C traitent les deux attentes centrales de cet audit, une seule source par réglage et agir là où l'on voit. Le lot F gagne à être fait d'un bloc, pour ne pas mélanger anciens et nouveaux termes.
