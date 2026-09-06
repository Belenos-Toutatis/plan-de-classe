# 🪑 Plan de Classe

> **Application web mono-fichier de gestion de plans de classe et de tablettes pour enseignants.**
> Aucune installation, aucune inscription, aucun cloud obligatoire — vous ouvrez le fichier HTML, vous travaillez.

[![Licence](https://img.shields.io/badge/licence-MIT-blue)](#licence)
[![Plateforme](https://img.shields.io/badge/plateforme-navigateur%20web-green)]()
[![Hors-ligne](https://img.shields.io/badge/fonctionne-hors%20ligne-success)]()

> 🚀 **Essayer en ligne tout de suite** : **[belenos-toutatis.github.io/plan-de-classe/plan%20de%20classe.html](https://belenos-toutatis.github.io/plan-de-classe/plan%20de%20classe.html)**
> 📥 **Télécharger pour installer en local** : bouton vert **`<> Code`** ci-dessus → **Download ZIP** → décompresser → double-clic sur `plan de classe.html` (ou sur le script de lancement adapté à votre système — voir [Démarrage en 30 secondes](#-démarrage-en-30-secondes)).

---

## ✨ En bref

- 🪑 **Placer ses élèves** en glisser-déposer, dans plusieurs salles par classe, avec des contraintes (places autorisées, élèves à séparer) et un mélange aléatoire qui les respecte.
- 🙋 **Faire l'appel** en un clic par élève, garder l'historique, repérer les absences récurrentes.
- 📊 **Noter et évaluer** : quatre types d'évaluation, compétences, bilans par période, préparation du conseil de classe, export tableur.
- 📱 **Gérer les tablettes** : affectation automatique par salle, fiche de prêt à imprimer.
- 📷 **QCMcam** : numérotation des places, marqueurs à imprimer, import des résultats dans une évaluation.
- 🎙 **Outils de classe** : sonomètre, minuteur, tirage au sort d'un élève.
- 🔒 **Vos données restent chez vous** : un seul fichier HTML, hors ligne, sauvegarde dans le dossier de votre choix, synchronisable via Nextcloud.
- 📖 Le détail : [Fonctionnalités](#-fonctionnalités) · [Guide d'utilisation](#-guide-dutilisation).

---

## 📸 Aperçu

### Plan Prof — placement drag & drop, mode appel, snapshots

Vue principale du quotidien : grille de la salle, élèves avec leur prénom/nom, badges G1/G2, n° de tablette « Tab. X », allée centrale visible (cases grisées), panneau des élèves non placés à droite, compteur en haut (placés/G1/G2/classe mobile active).

![Plan Prof — vue principale](./docs/screenshots/plan-prof.png)

### Vue Élève — affichage projection au tableau

Mode épuré pour vidéoprojeter aux élèves : juste les prénoms en grand, sans les badges et compteurs. Les élèves repèrent leur place en un coup d'œil.

![Vue Élève — projection](./docs/screenshots/vue-eleve.png)

### Onglet Élèves — tableau triable avec stats cumulées

Tri par nom, par 📦 matériel oublié, par 📝 travail non fait, par 🚫 absences cumulées, par ⏰ retards cumulés. Édition de position en ligne (Tab pour passer au suivant), saisie directe des compteurs par input numérique (focus auto-sélectionne pour remplacer), badges PPRE / PPS / ULIS, bouton 🕓 pour l'historique détaillé par élève, sélection multiple par clic & glisser pour des actions en lot.

![Onglet Élèves — tableau triable](./docs/screenshots/onglet-eleves.png)

---

## 🎯 Démarrage en 30 secondes

### Méthode 0 — Essayer en ligne (sans rien installer)

Cliquez simplement sur ce lien :
**[https://belenos-toutatis.github.io/plan-de-classe/plan%20de%20classe.html](https://belenos-toutatis.github.io/plan-de-classe/plan%20de%20classe.html)**

L'app se charge directement dans votre navigateur, prête à l'emploi. Pratique pour découvrir l'outil. Vos données restent **dans votre navigateur** (localStorage du domaine `belenos-toutatis.github.io`). Pour un usage durable avec sauvegardes synchronisées sur votre disque, préférez la Méthode 1 ou 2 ci-dessous.

### Méthode 1 — Télécharger et double-clic sur le HTML (le plus simple en local)

1. Sur la page GitHub du dépôt, cliquez sur le bouton vert **`<> Code`** → onglet **Local** → **Download ZIP**
2. Décompressez le ZIP n'importe où sur votre disque
3. Double-cliquez sur **`plan de classe.html`** → il s'ouvre dans votre navigateur par défaut
4. Au **premier lancement**, un modal de bienvenue s'affiche : 6 classes fictives, 4 salles (2 normales + 2 en îlots), 3 classes mobiles et un jeu complet d'évaluations (Type A/B/C, S1+S2, remarques bulletin, éléments travaillés) sont déjà configurés pour explorer
5. Pour partir d'un fichier vierge : onglet **🏫 Classes** → bouton **🗑 Réinitialiser…** → choisir l'option voulue

> **Compatibilité optimale** : Chrome / Edge / Brave / Opera (tout ce qui est Chromium, ≥ v90 environ).
> Firefox et Safari fonctionnent en mode dégradé (téléchargement classique au lieu d'écriture directe dans un dossier).

### Méthode 2 — Scripts de lancement (recommandé pour installer comme application)

Le dépôt fournit trois scripts qui démarrent un mini-serveur Python local et ouvrent automatiquement Chrome sur l'app. **Avantage** : ils permettent ensuite d'**installer l'app comme une vraie application** (icône sur le bureau, fenêtre dédiée sans barre d'adresse, démarrage rapide).

| Système     | Script                        | Utilisation                                                                                                                                                        |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Windows** | `lancer-installation.bat`     | Double-cliquer dessus                                                                                                                                              |
| **Linux**   | `lancer-installation.sh`      | Ouvrir un terminal dans le dossier puis `./lancer-installation.sh` (ou rendre exécutable : `chmod +x lancer-installation.sh`)                                      |
| **macOS**   | `lancer-installation.command` | Double-cliquer dessus dans le Finder (la 1ère fois, faire `chmod +x lancer-installation.command` au préalable, ou autoriser dans *Préférences Système → Sécurité*) |

**Ce que font les scripts** :

1. Vérifient que **Python** est installé (≥ 3.x — généralement déjà présent sur Linux/macOS, à installer sur Windows depuis [python.org](https://www.python.org/downloads/) en cochant *« Add Python to PATH »*)
2. Démarrent un serveur HTTP local sur `http://localhost:8765` à partir du dossier courant
3. Ouvrent Chrome / Edge / Brave (ou navigateur par défaut) sur l'URL `http://localhost:8765/plan de classe.html`
4. Affichent une fenêtre/terminal avec les instructions
5. À la fermeture du terminal (ou *Entrée*), arrêtent proprement le serveur

**Pour installer comme une PWA** (une fois l'app ouverte via le script) :

- **Chrome / Edge / Brave** : icône **⊕** dans la barre d'adresse, ou menu **⋮** → *« Installer Plan de Classe… »*
- L'app apparaît dans le menu Démarrer / le Launcher / le Dock comme une application native
- Plus besoin du serveur après l'installation : l'app fonctionne en mode hors-ligne complet

> **Pourquoi un serveur local plutôt que `file://` ?**
> En mode `file://` (double-clic direct), certaines fonctionnalités ont des restrictions de sécurité (notamment l'installation comme PWA et la persistance fiable des handles de répertoire). Le mini-serveur HTTP local supprime ces restrictions sans rien envoyer sur Internet — tout reste en local sur votre machine.

---

## 📂 Structure du dépôt

```
.
├── plan de classe.html         # L'application complète (HTML + CSS + JS)
├── manifest.json               # Manifeste PWA (installation comme application)
├── sw.js                       # Service worker (mode hors-ligne)
├── icon-192.png / icon-512.png # Icônes PWA
├── lancer-installation.bat     # Script de lancement Windows (serveur local + Chrome)
├── lancer-installation.sh      # Script de lancement Linux
├── lancer-installation.command # Script de lancement macOS (double-cliquable)
├── README.md                   # Ce fichier
├── CLAUDE.md                   # Documentation technique détaillée
├── LICENSE                     # Licence MIT
├── .gitignore                  # Exclut les sauvegardes locales (.json)
└── docs/screenshots/           # Captures d'écran utilisées dans le README
```

Les fichiers `plan-classe-*.json` (sauvegardes manuelles, sync auto, backups horodatés) ne sont **pas** versionnés — ils contiennent vos données utilisateur.

---

## 🧰 Fonctionnalités

### Plan de classe
- **Placement** en glisser-déposer (souris, doigt, stylet), **plusieurs salles par classe**, zoom, filtres par groupe G1/G2/G3, couleur des places par groupe, tag ou genre.
- **Contraintes** : places autorisées par élève, paires d'élèves à séparer — éditables en Config Salle ou directement sur le plan pendant le cours.
- **Mélange aléatoire** qui remplit d'avant en arrière, espace les élèves dans les groupes de tables et respecte toutes les contraintes.
- **AESH** : jusqu'à 6 par salle, élèves accompagnés placés à côté d'elles, présence pointable.
- **Surlignage rose** des derniers déplacements, persistant d'une session à l'autre.
- **Snapshots** datés des plans et des compteurs d'incidents, consultables et restaurables.
- **Fiche complète d'un élève** au clic droit : scolarité, aménagements, place, incidents, appel, rappels, moyennes et remarques.
- **Rappels** attachés à un élève, visibles sur sa place (mot à faire signer, document à rendre…).
- 🚪 **Arrivées et départs en cours d'année** : un élève parti libère sa place mais garde ses notes ; un élève à venir garde sa place réservée.

### Élèves
- **Import** depuis un tableur ou un export Pronote : reconnaissance des colonnes (nom, prénom, classe, groupes, sexe, aménagements…), aperçu corrigeable, codes de groupes `3A-GP1` interprétés, classes créées à la volée et rattachées à une salle commune.
- **Aménagements** : PPRE, PAP, PPS, ULIS, UPE2A, PAI, agrandissement (`-A`) et tiers-temps (`+⅓`), cumulables, visibles sur le plan et sur la liste imprimée.
- **Compteurs** matériel oublié / travail non fait, historique, vue d'ensemble toutes classes, tags cumulables.
- **Classes recomposées** (DNL, bilingue, option, Devoir Fait) : élèves de plusieurs classes, plan et bilans propres, appartenance par période.

### Appel
- Clic = absent, clic droit ou appui long = retard avec heure d'arrivée ; pré-marquage des élèves hors inclusion et non placés.
- Appels enregistrés par créneau horaire, liste filtrable, statistiques par élève et par période, plan de l'appel consultable.
- Les absents de l'appel sont **pré-remplis** dans une évaluation passée le même jour.

### Évaluations
- **Quatre types** : A (mini-notes), B (passations de compétences), C (sommative par exercices), D (sommative par compétences, chaque question évaluée par un niveau).
- Saisie en tableur ou en fiche par élève, codes absent / non noté, commentaires par cellule, ajustement de la note finale avec motif (triche, retard, bonus), mini-calculatrice dans les cellules, noms abrégés automatiques.
- **Multi-classes, multi-périodes** (semestres ou trimestres), dates et créneaux par classe et par groupe, évaluations facultatives et diagnostiques, coefficients, barèmes variés.
- **Bilan des notes** et **Bilan des compétences** par période et par discipline, remarques de bulletin, éléments travaillés, **mentions de conseil de classe** configurables, comparaison entre classes.
- **Disciplines multiples** par classe, bilans séparés par discipline.
- **Export tableur** XLSX ou ODS, un classeur par classe, mis en forme ; export vers l'ENT.
- **Import des résultats QCMcam** (v1 et v2) avec appariement des élèves et détection du barème, de la date et du créneau.

### Tablettes
- Plusieurs **classes mobiles** (chariots), lots, tablettes indisponibles.
- **Affectation automatique** par salle, en classe entière ou par groupe, restreinte à un ou plusieurs lots, avec choix des tables à équiper quand il en manque.
- Changement d'une tablette en deux clics, récap par salle, **fiche de prêt** PDF (registre nominatif de séance).

### QCMcam
- Numérotation automatique des places (lisible ou séquentielle selon la salle), plan visuel, export de la liste d'élèves reconnu par [QCMcam 2](https://q2.qcmcam.net/).
- **Générateur de marqueurs ArUco** intégré : recto-verso, 1, 2 ou 4 par page, orientations tirées pour que deux voisins ne se copient pas, réimpression d'une carte perdue à l'identique.

### Outils de classe
- 🎙 **Sonomètre** : alerte visuelle et sonore quand le niveau reste trop élevé, seuil calibrable, fenêtre toujours au premier plan pour le vidéoprojecteur. Analyse locale, rien n'est enregistré.
- ⏲ **Minuteur** : durées prédéfinies ou libres, annonces vocales, sonneries au choix, fenêtre flottante.
- 🎲 **Interroger** un élève au hasard, avec une carte qui surgit de sa place.

### Impressions
Plan prof, plan élève, plan vide, liste des élèves, bilan des classes (photocopies), fiche de prêt, plans QCMcam, marqueurs ArUco — orientation et couleurs adaptées, mode noir et blanc.

### Données et sauvegarde
- **Un seul fichier HTML**, aucune dépendance, fonctionne hors ligne, installable comme application.
- Sauvegarde dans le navigateur et dans un dossier de votre choix ; **synchronisation automatique** (Nextcloud, Drive…) avec détection des conflits entre postes et backups horodatés en rotation.
- Versions nommées, historique, comparaison avant restauration ; réinitialisation de fin d'année qui conserve salles et réglages.
- Fonctions activables une à une (tablettes, QCMcam, appel, évaluations) pour n'afficher que ce qui vous sert.
- Mode sombre, design « carnet du prof », tactile (Surface, iPad), téléphone et tablette.

---

## 📖 Guide d'utilisation

### Onglets de navigation

| Onglet              | Rôle principal                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| 🏫 **Classes**      | Créer / supprimer / dupliquer des classes ; bouton de réinitialisation                                 |
| 👥 **Élèves**       | Liste avec tri, sélection multi, édition de position, compteurs 📦/📝, historique                      |
| 🪑 **Plan (Prof)**  | Placement drag & drop, mode appel, snapshots, impression                                               |
| ⚙️ **Config Salle** | Catalogue partagé des salles : dimensions, tables, horaires, **AESH** (placement + élèves accompagnés) |
| 📱 **Tablettes**    | Récap par mode, paramétrage des classes mobiles, désaffectation                                        |
| 📷 **QCMCam**       | Export CSV de tous les élèves au format QCMcam                                                         |
| 📊 **Devoirs**      | Création/édition d'évaluations Type A/B/C, saisie tableur ou fiche par élève, multi-classes            |
| 🎯 **Bilan par compétences** | Vue transverse classe : niveau moyen par élève sur chaque compétence évaluée                  |
| 📜 **Bilan des évaluations** | Agrégation période : moyenne /20, rang, remarque bulletin — prêt à coller dans le bulletin     |

Onglets accessibles via boutons (sortis de la nav principale) :

- 👁 **Vue Élève** : affichage grand format pour projection (bouton "🔄 Vue Élève" depuis Plan Prof)
- 📊 **Export positions** : tableau triable des positions + export CSV (bouton "📊 Export positions" depuis Élèves)

### Cas d'usage clés

#### Faire l'appel en 30 secondes

Plan Prof → bouton **🙋 Mode appel** → clic gauche sur une cellule = absent, clic droit = retard (saisie de l'heure d'arrivée). Bouton **📌 Enregistrer** ouvre une modale avec date / créneau / groupe / libellé pré-remplis.

#### Détecter les absences récurrentes

Onglet **Élèves** → bouton **📊 Vue d'ensemble** → tous les élèves de toutes les classes triés par 🚫 absences décroissantes. Filtres "Min. 🚫 / Min. ⏰" pour focaliser.

#### Imprimer les fiches de prêt tablettes

Onglet **Tablettes** → bouton **🖨 Fiche de prêt PDF** → choix de la classe mobile, date, créneau, salle, prof, groupe → génération PDF prête à imprimer. Les n° indisponibles apparaissent grisés "🚫 indisponible".

#### Bascule rapide entre classes mobiles

Vous utilisez normalement CM2 mais elle est réservée ? Onglet **Tablettes** **ou Plan Prof** → cliquez sur **CM1** dans la barre des classes mobiles (les deux onglets ont le même sélecteur, synchronisé automatiquement). L'app garde des affectations distinctes par pool, donc rien n'est perdu lors du changement.

#### Changer la tablette d'un élève en 2 clics

Plan Prof → cliquez directement sur le pavé **"Tab. 7"** dans la cellule de l'élève → la modale **📱 Choisir une tablette** s'ouvre, liste toutes les tablettes du pool actif avec leur statut (✓ libre / 🟦 utilisée par X / 🚫 indispo). Choisissez la nouvelle → si elle est libre, échange immédiat ; si elle est utilisée par un autre élève, confirmation avec récap du swap (« Hugo : Tab. 7 → Tab. 2 / Léa : Tab. 2 → Tab. 7 »). Idem accessible depuis le récap de l'onglet Tablettes (clic sur le pavé Tab. N dans la colonne).

#### Snapshots — archiver une étape

Plan Prof → **📸 Snapshots → Sauvegarder maintenant** avant de tester un nouveau placement. Si l'essai ne marche pas, **↻ Restaurer** ramène la disposition précédente. Idem pour les compteurs d'incidents (onglet Élèves).

#### Imprimer les marqueurs ArUco de votre salle

Onglet **📷 QCMCam** → bouton **🎯 Marqueurs ArUco** (ou **Ctrl+P**) → carte verte *« Imprimer les marqueurs de cette salle »* → choisir **1**, **2** ou **4** marqueurs par page A4.

Génère uniquement les marqueurs des places utiles de votre salle active. Impression **recto-verso bord long** : recto = marqueur, verso = numéro géant centré au dos. Carrés appuyés sur les bords physiques de la feuille avec traits de découpe pour obtenir des cartes parfaitement carrées. Crédits de licence CC BY-NC-SA dans la zone à jeter (pas sur le carré final).

Un jeu de marqueurs par salle suffit, réutilisable entre toutes les classes qui l'utilisent. Sous-section **🔁 Réimprimer des n° précis** pour remplacer des cartes perdues : tapez `5, 12-15, 23` puis relancez l'impression.

⚠️ **Important à l'impression** : choisir **« Marges : Aucune »** dans la boîte de dialogue du navigateur pour que les carrés tombent exactement sur les bords du papier.

#### Configurer une AESH et ses élèves accompagnés

Onglet **⚙️ Config Salle** → mode **🧑‍🏫 AESH** → bouton **+** pour ajouter une AESH dans cette salle. Pour chaque AESH : sélectionne une case puis **📍 Placer AESHn**, et clique sur les chips d'élèves pour lier ceux qu'elle accompagne (un élève = une seule AESH à la fois).

À l'usage : sur le plan, l'AESH apparaît en rose 🧑‍🏫 (sans tablette) et ses élèves liés portent un badge 🤝 rose. Au mélange aléatoire, l'AESH est placée au milieu d'un groupe de tables (jamais en extrémité d'un groupe ≥ 3) et ses élèves liés atterrissent en priorité à côté → derrière → devant. En mode appel, clic sur la cellule AESH = bascule présence (suivi des jours sans AESH dans l'historique).

L'AESH est anonyme — c'est un **slot**, pas une personne nominale (l'app affiche juste « AESH » ou « AESH1 / AESH2 »). Pas de RGPD supplémentaire à gérer.

---

## ⌨️ Raccourcis clavier

| Raccourci           | Action                                                       |
| ------------------- | ------------------------------------------------------------ |
| `Esc`               | Fermer modals / désélectionner élèves                        |
| `Ctrl+Z` / `Ctrl+Y` | Annuler / Refaire                                            |
| `Ctrl+P`            | Imprimer (Plan Prof si onglet Plan, Vue Élève si onglet Vue) |
| `+` / `−` / `=`     | Zoom in / out / 100%                                         |
| `0` / `1` / `2`     | Filtre groupe : Tous / G1 / G2                               |

---

## 🔄 Sauvegardes & synchronisation

### Mode sans cloud (clé USB ou local)

Les modifications sont sauvegardées **automatiquement** dans le `localStorage` du navigateur. Pour exporter manuellement : **⬇ Export JSON** dans le header.

### Mode synchronisé (Nextcloud / Drive / Dropbox / etc.)

1. Bouton **📂 Recharger** dans le header → choisir un dossier
2. Bouton **🔄 Sync OFF** → bascule en **🔄 Sync ON**
3. Toutes les modifications sont écrites dans `plan-classe-auto.json` du dossier choisi (debounce 5s)
4. Au retour sur la fenêtre, l'app détecte si le fichier a été modifié à l'extérieur (ex. par votre PC maison) et propose de recharger
5. Si les deux machines ont modifié les données en parallèle (vraie divergence, pas juste un décalage), une modale **« Versions divergentes »** s'ouvre : **✅ Garder ma version** (archive l'autre appareil dans un fichier séparé) ou **📥 Prendre l'autre version** (archive la vôtre). Rien n'est jamais perdu silencieusement — la version non retenue est toujours conservée dans un fichier d'archive à côté.

### Backups automatiques

Quand la sync est active, des backups horodatés sont créés selon une **rotation par paliers** :

| Âge         | Granularité         | Backups conservés |
| ----------- | ------------------- | ----------------- |
| < 1 heure   | 1 toutes les 10 min | ~6                |
| < 48 heures | 1 par heure         | ~47               |
| < 14 jours  | 1 par jour          | ~12               |
| < 120 jours | 1 par semaine       | ~15               |
| > 120 jours | supprimés           | 0                 |

Total max : **~80 backups sur 4 mois**.

---

## 🔒 Vie privée & RGPD

### Ce qui est stocké

Identité élèves (nom, prénom, civilité, classe), groupes G1/G2/G3, statuts pédagogiques (PPRE, PPS/Gevasco, ULIS, UPE2A, tags), compteurs (oublis matériel, travail non fait), historique d'absences/retards (date, créneau, heure d'arrivée), notes libres et rappels.

⚠️ Certains champs (PPRE, PPS, ULIS, UPE2A) peuvent être considérés comme **données sensibles au sens de l'article 9 RGPD**. À utiliser uniquement si pédagogiquement nécessaire pour votre suivi.

### Où ces données vivent

- `localStorage` du navigateur (votre device)
- Fichiers JSON dans le dossier que vous choisissez (sync auto, exports manuels, backups horodatés)
- **Aucune donnée envoyée sur Internet** — pas de serveur, pas de compte, pas d'inscription, pas de tracking
- 🎙 **Sonomètre** : le micro n'est analysé qu'**en temps réel et en local** — **aucun son n'est enregistré ni transmis**. L'accès au micro exige un contexte sécurisé (HTTPS ou `localhost`) et votre autorisation explicite.
- ⏲ **Minuteur** : sons générés localement (oscillateurs) et synthèse vocale du navigateur — **rien n'est enregistré ni transmis**.

Si vous utilisez un Nextcloud (perso ou pro), les fichiers JSON transitent et résident sur les serveurs de ce service. Sur un Nextcloud fourni par votre employeur, l'administrateur technique a contractuellement accès aux fichiers stockés.

### Vos 4 responsabilités utilisateur (CNIL article 32)

1. **Verrouiller votre poste** quand vous vous absentez (`Win+L` sur Windows, `Ctrl+Cmd+Q` sur macOS)
2. **Activer le chiffrement disque** de votre OS (BitLocker sur Windows Pro, FileVault sur macOS) — protège en cas de vol
3. **Déclarer cet outil à votre DPO d'établissement** (un mail au DPO du rectorat suffit en général : `dpo@ac-<votre-académie>.fr`)
4. **Purger les anciens élèves** en fin d'année / quand un élève quitte votre périmètre (onglet Classes → 🗑 Réinitialiser, ou suppression individuelle)

### Disclaimer

Cette section est une **synthèse pratique**, pas un avis juridique. Pour une validation formelle de la conformité RGPD dans votre contexte, le DPO de votre établissement est l'interlocuteur de référence — il a le registre des traitements à jour.

---

## 🛠 Caractéristiques techniques

- **1 seul fichier HTML** (CSS + JS inclus) — pas de dépendances externes, pas de build
- **Fonctionne hors-ligne** dès le 2e chargement (service worker)
- **Installable comme une PWA** : icône sur le bureau, démarre comme une app native
- **Léger** : < 300 Ko, démarre instantanément
- **API utilisées** : File System Access API (sync), IndexedDB (handles de répertoire), `localStorage` (état + paramètres), `print-color-adjust` (impression couleurs/N&B)
- **Modèle de données** : voir [`CLAUDE.md`](./CLAUDE.md) pour le détail

## 🌐 Compatibilité navigateur

L'application **fonctionne dans tous les navigateurs modernes**, mais certaines fonctionnalités avancées dépendent de l'API *File System Access*, supportée uniquement par les **navigateurs Chromium** (Chrome, Edge, Brave, Opera, Vivaldi).

### Tableau de compatibilité

| Fonctionnalité                                                                                    | Chromium (Chrome/Edge/Brave/Opera)           | Firefox                           | Safari                                          |
| ------------------------------------------------------------------------------------------------- |:--------------------------------------------:|:---------------------------------:|:-----------------------------------------------:|
| Toutes les fonctions principales (placement, appel, snapshots, vue d'ensemble, impressions, etc.) | ✅                                            | ✅                                 | ✅                                               |
| Sauvegarde locale (`localStorage`)                                                                | ✅                                            | ✅                                 | ✅                                               |
| Export / import JSON manuel (téléchargement / fichier picker)                                     | ✅                                            | ✅                                 | ✅                                               |
| Copier-coller (presse-papiers)                                                                    | ✅                                            | ✅                                 | ✅                                               |
| Impression couleurs forcées (badges, fonds…)                                                      | ✅                                            | ✅                                 | ⚠️ partiel                                      |
| Mode hors-ligne (service worker) après 1ère ouverture                                             | ✅                                            | ✅                                 | ✅                                               |
| **Bouton 📂 Ouvrir** (choisir un dossier complet)                                                 | ✅                                            | ❌ *fichier individuel uniquement* | ❌ *fichier individuel uniquement*               |
| **🔄 Sync auto vers un dossier** (Nextcloud / Drive…)                                             | ✅                                            | ❌                                 | ❌                                               |
| **Backups horodatés automatiques** (rotation par paliers)                                         | ✅                                            | ❌                                 | ❌                                               |
| **Détection externe** : popup *« le fichier a été modifié, recharger ? »*                         | ✅                                            | ❌                                 | ❌                                               |
| Persistance du dossier choisi entre sessions                                                      | ✅                                            | ❌                                 | ❌                                               |
| Installation comme PWA (icône desktop, fenêtre dédiée)                                            | ✅                                            | ⚠️ limité                         | ⚠️ iOS uniquement (*« Sur l'écran d'accueil »*) |
| 🎙 Sonomètre — mesure du niveau sonore (micro)                                                    | ✅                                            | ✅                                 | ✅                                               |
| 🎙 Sonomètre — fenêtre **toujours au premier plan** (Picture-in-Picture)                          | ✅                                            | ⚠️ *fenêtre déplaçable, pas au-dessus* | ⚠️ *fenêtre déplaçable, pas au-dessus*     |
| ⏲ Minuteur — fenêtre **toujours au premier plan** (Picture-in-Picture)                           | ✅                                            | ⚠️ *fenêtre déplaçable, pas au-dessus* | ⚠️ *fenêtre déplaçable, pas au-dessus*     |
| ⏲ Minuteur — **annonce vocale** du temps restant (synthèse vocale)                               | ✅                                            | ✅                                 | ⚠️ *voix variable selon l'appareil*             |
| Tactile / mobile                                                                                  | ⚠️ partiel (long-press OK, drag&drop limité) | ⚠️                                | ⚠️                                              |

### Que faire si vous êtes sur Firefox / Safari ?

L'application reste **complètement utilisable** — vous gardez :

- Tous les onglets et toutes les actions (placement, appel, snapshots, impressions, exports CSV, vue d'ensemble…)
- La sauvegarde automatique dans le navigateur
- L'export / import JSON via téléchargement et fichier picker classiques
- Le mode hors-ligne après la première ouverture

Vous perdez seulement la **synchronisation automatique vers un dossier** : à la place, exportez manuellement le JSON via **⬇ Export JSON** et placez-le dans votre dossier Nextcloud/Drive vous-même. Au retour, **📂 Recharger** vous laisse choisir un fichier (et non un dossier complet).

### Recommandation

Pour le confort maximal — surtout si vous utilisez un dossier partagé entre plusieurs machines — utilisez **Chrome, Edge, Brave ou Opera (≥ v90)**. C'est dans cet environnement que la sync auto, les backups en rotation et la détection externe fonctionnent.

---

## 🤝 Contribuer

Les retours, suggestions et issues sont les bienvenus. Workflow :

1. Forkez le dépôt
2. Créez une branche : `git checkout -b ma-feature`
3. Modifiez `plan de classe.html` (tout le code reste dans ce fichier — pas d'éclatement)
4. Testez en double-cliquant sur le fichier (mode `file://`) ou via un mini serveur HTTP
5. Ouvrez une Pull Request

### Conventions

- CSS dans le `<style>`, JS dans le `<script>` en fin de body
- Pas de dépendances externes
- Toute action mutante : `pushUndo()` AVANT la mutation
- `applyAccessorsAll()` après tout chargement de `S` (init / fichier / undo / redo)
- Voir [`CLAUDE.md`](./CLAUDE.md) section "Conventions de développement"

---

## 🗺️ Roadmap

Améliorations envisagées (pas de calendrier) :

### Volet Évaluation — état

- [x] Onglets **Devoirs · Bilan par compétences · Bilan des évaluations**
- [x] Référentiel de compétences personnalisable avec codes courts (C1..C8 pré-installés, modifiables), 8 domaines du socle
- [x] **Type A** : mini-notes pondérées sur une note finale (souvent /20)
- [x] **Type B** : passations de compétences par niveaux de maîtrise configurables 2 à 6 (+ 0 non évalué, A absent)
- [x] **Type C** : sommative avec exercices, questions, compétences inline par question
- [x] Saisie en **tableur** (sélection multi-cellules, copier-coller multi-colonnes Excel-like) et en **fiche par élève**
- [x] Multi-classes par évaluation (dates et créneaux par classe)
- [x] **Bilan par compétences** : niveau moyen par élève × compétence évaluée
- [x] **Bilan des évaluations** : moyenne /20 par élève, rang, remarque bulletin (par élève × période), remarque classe + éléments travaillés synchronisés, sticky thead/tfoot, masquage de colonnes en multi-période
- [x] **Sauvegarde tableur XLSX / ODS** (un fichier par classe, mis en forme avec couleurs) — accessible depuis le menu Données
- [ ] **Type D** : sommative par compétence sans questions intermédiaires
- [ ] Export PDF du bilan par élève (à coller dans le bulletin)

### Autres

- [x] Captures d'écran dans le README
- [ ] Captures d'écran complémentaires (Tablettes, Vue d'ensemble, Mode appel, Snapshots, plan QCMCam)
- [ ] Bouton "Ré-installer la démo" dans le menu reset (pour ré-explorer après un reset)
- [ ] Export PDF de la liste élèves avec photos (si fournies)
- [ ] Mode "tablette pour 2 élèves" (binôme)
- [ ] Internationalisation (anglais)
- [ ] Synchronisation directe via WebDAV (sans dépendre du client Nextcloud) — *bloqué par CORS, voir doc*

---

## 📜 Licence

MIT — voir [LICENSE](./LICENSE).

Vous pouvez utiliser, modifier, redistribuer ce code librement, y compris commercialement. La seule obligation : conserver le crédit d'auteur dans les versions distribuées.

---

## 🙏 Remerciements

- L'enseignant qui a inspiré et testé chaque fonctionnalité depuis sa salle de classe — chaque détail répond à un vrai usage
- Le projet **[QCMcam](https://q2.qcmcam.net/)** pour la possibilité de faire du QCM en classe sans matériel par élève
- Les communautés enseignantes qui ont fait des retours
