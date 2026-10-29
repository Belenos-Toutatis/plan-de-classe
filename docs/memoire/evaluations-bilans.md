# Évaluations — création, devoirs, bilans

> Mémoire détaillée du projet, rangée depuis CLAUDE.md le 2026-10-29 (texte inchangé). Contenu : projection, export tableur des notes, bilan des notes (photo, mini-plan), vers MBN, fenêtres de consultation (détail de la note, résultats, comparer), disciplines, import d’une évaluation, nouvelle évaluation, liste des devoirs, bilans des notes et des compétences, conseil de classe, exports.

## Projection des bilans (modale `mrendu`, mode plein écran)
La modale de rendu d'un bilan (`#mrendu`) a un bouton **📽 Projeter** (`_renduStartProject`) qui passe en plein écran grands caractères (classe `body.rendu-projecting`). Deux panneaux flottants apparaissent alors : la **barre de zoom** (`#mrendu-zoom-bar` : 🔍− / 100% / 🔍+) et le bouton **❌ Quitter la projection** (`#mrendu-exit-project`).

**Panneaux déplaçables** (`_renduMakeDraggable(el)`) : on peut les glisser n'importe où (Pointer Events + `setPointerCapture`, `touch-action:none`, `cursor:move`) pour dégager le contenu en dessous. Un **seuil de 5 px** distingue clic et glissé ; après un glissé, le flag `_renduDragMoved` neutralise le clic synthétique du bouton via le garde `_renduClickAllowed()` (présent dans chaque `onclick` : `_renduClickAllowed()&&_renduZoom(...)` / `&&_renduExitProject()`) — sinon zoomer/quitter se déclencherait en fin de glissé. Le glissé bascule le panneau de `right:…` vers `left/top` (borné au viewport). Positions conservées dans la session (styles inline sur l'élément), réinitialisées au reload. Attaché une seule fois via `el.dataset.dragInit`. Raccourcis projection (`_renduProjectEscHandler`, capture) : Échap quitte, Ctrl±/0 zoom.

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
   Helpers de cellules pré-stylées : `T(v)` (titre), `H(v)` (header), `S0(v, opts)` (cellule normale), `N0(v, opts)` (numérique), `EMPTY()`. Helpers couleurs : `noteCellBg(score20)` (lit `S.evalPrefs.noteThresholds` + auto), `levelCellBg(level)` (lit `S.evalPrefs.maitriseColors`), `textOnHex(hex6)` (choix par contraste WCAG réel via `_wcagContrast` — miroir de `_contrastTextColor` pour le format tableur ; portait le même seuil YIQ mal calibré, donc du blanc sur les cellules orange/vertes des classeurs exportés).

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
XLSX testé avec openpyxl + LibreOffice headless conversion PDF — aucune erreur. ODS idem. Cas limite "classe sans évaluation" produit un classeur minimal valide (Synthèse + Bilans vides + Compétences vide + aucune feuille Eval). Couleurs de fond appliquées via patternFill solid (XLSX) et table-cell-properties fo:background-color (ODS). Texte clair/foncé adapté au fond via `textOnHex` (contraste WCAG réel).

### Dimensions typiques (6e A démo, 30 élèves, 4 évals)
- XLSX : ~140 Ko, 8 feuilles, 30 lignes × 11-17 colonnes par feuille.
- ODS : ~380 Ko (plus de verbosité XML).

### Noms de fichiers
`<nomClasse-sanitized>-notes-YYYYMMDD.<xlsx|ods>` via `safeFilename()` qui retire `[\\/:*?"<>|]` et remplace les espaces par `_`.

## Bilan des notes — photo et mini-plan (v2.140.0)
- **Pastille de l'élève de la ligne** (revue en v2.143.0 après signalement : l'afficher décalait toutes les lignes du tableau) : sa **place est réservée** dans la barre du titre (`visibility`, largeur fixe 210 px, hauteur de la ligne) — afficher, changer d'élève ou agrandir ne déplace plus rien (mesuré). **Clic n'importe où sur la ligne d'un élève** = sa pastille ; **re-clic sur la même ligne** = masquée (un clic dans une case, un bouton ou le nom ne masque jamais) ; la mise au point d'une case de remarque l'affiche aussi. **Clic sur la pastille** = grande photo (150 px) **par-dessus**, sous la pastille (`.bw-big`, position absolue), re-clic = réduite (`_bilanWhoBig`, gardé pour la séance ; `mousedown` neutralisé : le curseur reste dans la remarque). Changement de classe : masquée (`_bilanWhoCheck`, appelé par `_renderTabCtx`) dans la barre du titre des deux bilans (`#bilan-who-bilan` / `-comp`, `_bilanWhoShow`, écouteurs `focusin` / `focusout` sur `textarea.bilan-rem-textarea`). Si la barre du titre est sortie de l'écran, la pastille flotte sous le bandeau (`_bilanWhoPlace`, classe `.float`). **La grande photo est une fenêtre flottante** (v2.143.2, demande de l'utilisateur ; en v2.143.1 c'était la pastille entière qui se déplaçait, refusé) : la pastille reste dans la barre du titre (emplacement réservé `.bilan-who-slot`) ; la grande photo (`.bw-big`, position fixe) se **glisse** n'importe où et se **redimensionne** par le coin en bas à droite (`.bw-rs`, photo carrée, 80 à 600 px), Pointer Events donc souris et doigt (`_bilanWhoBigDrag`) ; ↺ = la remettre sous la pastille à 150 px, ✕ = la fermer. Position et taille retenues sur la machine (`planClasse_bilanWhoGeo` = `{x, y, w}`, x/y absents = sous la pastille), communes aux deux bilans, gardées quand on change d'élève ; ramenées dans la fenêtre par `_bilanWhoClampXY`. Masquée pour un élève caché en mode confidentiel.
- **Bulle d'une note** : le « position n° … au moment du devoir » est remplacé par le **mini-plan** de la salle et du plan du devoir (`_mnpBuild(ev, cls, sid)`, donc `_mnpEvalSeating`). La cellule porte `data-tip` + `data-tip-ev` / `-sid` / `-cls` au lieu de `title` ; la bulle globale `#gtip` ajoute le mini-plan et passe en style clair `.rich` (tokens, donc thème sombre compris). `_evalSeatLabelAtTime` n'est plus appelée.

## 🏫 Vers MBN — favori « MBN · Notes du devoir » (v2.137.0, ex « Remplir MBN »)

Saisir les résultats d'un devoir **directement dans MBN** (Mon Bureau Numérique, Kosmos), sans passer par MBN Typer (projet voisin `../Notes/saisie-mbn`, frappes clavier simulées au niveau du système). Arbitrages de l'utilisateur (2026-10-10) : **tout remplir** (note, motif, compétences, appréciation) ; les cases déjà remplies dans MBN sont **remplacées** ; les codes de compétences de Plan de classe **sont ceux de MBN**.

- **Côté Plan de classe** : 📊 Résultats du devoir → 📤 Export ENT → **🏫 Vers MBN…** (fenêtre `mmbn`, `_mbnOpen`). `_mbnPayload(ev)` reprend les lignes de l'Export ENT (`_evalExportBuildRows`, même classe) : `{ app:'plan-de-classe', type:'mbn-notes', v:1, devoir:{nom, long, classe, date, bareme}, codes, eleves:[{nom, prenom, note|null, motif:'Abs'|'NoN'|null, comps:{code: 1..4}, appr}] }` → presse-papiers (`_mbnCopy`). A → `Abs`, NN → `NoN`. Niveaux ramenés sur les 4 de MBN par `_mbnLevel` (`MBN_LEVELS`). Une case vide ici n'écrit rien dans MBN.
- **Le favori** : code dans `<script type="text/plain" id="mbn-fill-src">` (avant le gros script, comme le fichier des réunions ; ⚠️ ni `</script` ni `<!--`, et **ne jamais citer cette balise dans un commentaire** : le test la cherche par expression régulière et s'arrêtait sur le commentaire). `_mbnBookmarkletCode()` l'enveloppe en `javascript:` ; la fenêtre le propose à glisser dans la barre de favoris (ou ⧉ Copier le code). Dans MBN : panneau, collage Ctrl+V (ou « Lire le presse-papiers »), **aperçu** (devoir de Plan de classe vs titre de la page MBN, conversion de barème si MBN ≠ Plan de classe, codes absents d'un côté ou de l'autre, élèves introuvables / ambigus / verrouillés, ce qui sera remplacé), puis remplissage élève par élève avec progression et « Arrêter », bilan final.
- **Comment MBN enregistre** (relevé par `outils/analyse-mbn.html`, rapports anonymisés du 2026-10-10) : liste `.js-eleve` (`data-elevenom`, `data-eleveprenom`, `data-eleveuid`, `data-verrouille`) ; clic sur l'élève (`afficherEvaluationEleve(event,'uid',…)`) → panneau `aside.evaluations-eleve` (`[id$=eleve__uid]`, motif `[id$=eleve__non-notation]` avec `data-code` Abs/Dis/NoN/NoR/Ina/EA, note `[id$=eleve__note]`, `select.select_competence` valeurs −1 / 1..4 dont le libellé commence par le code, appréciation `[id$=eleve__appreciation]` avec `maxlength`) ; **un seul écouteur « change »** (Prototype) sur le panneau met à jour le champ caché NOTATIONS (JSON de toute la classe) et envoie aussitôt le formulaire (XHR POST `sg.do`, réponse JSON `{status, message, data}`). Le favori **passe par l'interface** (clic, valeur posée, `change` + `blur`) : c'est MBN qui calcule et enregistre ; il attend la fin de chaque requête (`send` de XHR enveloppé, rétabli à la fin) avant le champ suivant, et vérifie la note affichée dans la liste.
- ⚠️ **MBN charge Prototype.js 1.7** (et jQuery 3.7) : pas de méthode d'Array appliquée à une collection DOM (`this.each is not a function`, rencontré), pas de `JSON.stringify` dans le favori. Un test le vérifie.
- **Premier essai sur le vrai MBN (2026-10-10, v2.137.0) : aucune note prise** — la liste affichait « » pour chaque élève, l'aperçu était juste. Poser la valeur puis émettre `change` ne suffisait donc pas. v2.137.1 : la note est **« tapée »** (focus, sélection, chaque caractère avec keydown / keypress / input / keyup et un `keyCode` posé à la main, puis Tab, change, blur), le favori attend la fin des requêtes après l'ouverture d'un élève, une case désactivée est signalée au lieu d'être sautée en silence, le bilan dit pour chaque note refusée ce que contenait la case et combien d'enregistrements MBN a envoyés ; pendant le remplissage le panneau se réduit en bas à droite (on voit MBN travailler). Si ça ne suffit pas : favori **🧩 Code MBN** de `outils/analyse-mbn.html`, qui recopie le code des fonctions de saisie de MBN (`afficherEvaluationEleve`, `enregistrerEvaluationEleve`, `formatNote`…) et des écouteurs du panneau, chaînes anonymisées.
- **Deuxième essai (v2.137.1) : notes et compétences prises, appréciation NON.** v2.137.2 : l'appréciation est elle aussi tapée (retours à la ligne = Entrée), puis le favori **attend jusqu'à 3 s qu'un enregistrement parte** (`waitSave` — hypothèse : MBN l'enregistre en différé après la frappe, pas sur `change`) avant de passer à l'élève suivant ; il relit ensuite le commentaire de l'élève dans le champ caché NOTATIONS (`notationsComment`, entrée trouvée par l'uid) et signale un écart. La fausse page imite ce différé (enregistrement 600 ms après la dernière touche, rien sur `change`).
- **Troisième essai (v2.137.2) : tout passe** — notes, compétences, appréciation (2026-10-10).
- **Nom du favori = texte du lien glissé** : « 📥 MBN · Notes du devoir » (v2.137.3, demande de l'utilisateur) ; deux autres sont prévus, sur le même modèle, pour ce que faisait aussi MBN Typer : **« MBN · Remarques du bulletin »** et **« MBN · Éléments travaillés »** (pages de MBN pas encore analysées). L'observateur de `outils/analyse-mbn.html` regroupe désormais un même changement répété en rafale (`MUTSEEN`, fenêtre de 2 s) : sur la saisie des notes, MBN recalcule ses statistiques des milliers de fois et le journal débordait à 600 lignes.
- **Second favori « 📥 MBN · Bulletin » (v2.138.0, arbitrage : UN favori pour les trois zones, qui sont sur la même page de MBN)** — 📜 Bilan des notes, période choisie (pas « Toutes ») → **🏫 Vers MBN…** (`_mbnBulOpen`) ; même fenêtre `mmbn`, textes posés par `_mbnSetupModal(mode)` (`_mbnMode` = `'devoir'` | `'bulletin'`, table `MBN_FAV` : bloc source et nom du favori — ⚠️ **le nom du lien glissé est le nom du favori**). `_mbnBulPayload(cls, periode)` : `{ type:'mbn-bulletin', contexte:{classe, periode, discipline}, eleves:[{nom, prenom, appr}], classe_appr, elements }`, élèves de `_bilanSidsFor`, discipline affichée (`_currentDiscipline`). Code dans le bloc texte « mbn-bul-src » (copie des outils du premier favori : panneau, suivi XHR, touches imitées — volontairement pas factorisés, le premier favori marche et a été vérifié sur le vrai MBN). Page bulletin de MBN (rapports du 2026-10-10, YUI 2.8.2) : **appréciations des élèves** = tableau YUI (`th.yui-dt-col-appreciation`, nom dans `.bulletin-libelle-eleve` « NOM Prénom », double trait d'union pour les noms composés), clic sur la cellule → éditeur `.yui-dt-editor` (textarea + `button.yui-dt-default` « Valider ») → requête (`CODE_ELEVE`, `APPRECIATION`) ; ⚠️ **la ligne est retrouvée par le nom à chaque élève** (le tableau peut être redessiné après un enregistrement) et la vérification compare sans espaces (les retours à la ligne s'affichent en `<br>`) ; **appréciation de classe** = `textarea.js-content-appreciationGroupe`, enregistrée ~3 s après la dernière touche (requête `APPRECIATION_GROUPE_SEVAL`) → tapée puis attente jusqu'à 8 s ; **éléments travaillés** = `form[id^=form-edition-list]` : `input[id^=ajout-list-]` + `input[id^=bouton-ajouter-list-]` (une requête par ajout), `li` avec `a.supprimer-list-*-action > img` (une requête, pas de confirmation). Aperçu : trois parties à cocher, détail par élève, les deux listes côte à côte ; option **« Remplacer toute la liste »** (cochée : tout supprimer puis ajouter dans l'ordre de Plan de classe ; décochée : seulement ajouter ce qui manque). Fausse page : `test/fixtures/mbn/fake-mbn-bulletin.html`.
- **Premier essai bulletin sur le vrai MBN (2026-10-10)** : appréciations des élèves et de la classe **passées** ; éléments travaillés : **deux réponses « 503 Service indisponible » du serveur de MBN** (MBN affiche alors lui-même une fenêtre avec la page d'erreur), sur des ajouts trop rapprochés. v2.138.1 : opérations de liste **espacées de 2 s** (`LIST_GAP`), **trois essais** avec attente croissante sur un refus du serveur (`listOp` ; les réponses passent par `RES`, `quiet` empêche de compter un refus rattrapé comme une erreur), et le remplacement **garde le début de la liste de MBN s'il est déjà dans le bon ordre** — une relance ne refait que la fin ; le bilan signale une liste finale différente de celle de Plan de classe. La fausse page simule les refus (`window.__fail = N` : POST vers le serveur local de test, qui répond 501).
- **Banc d'essai** : `test/fixtures/mbn/fake-mbn.html` (fausse page de saisie, mêmes classes et attributs, imitation de Prototype, noms inventés). Vérifié dessus : association par nom (accents, traits d'union), barème /40 → /20, motif qui remplace une note, verrouillé ignoré, appréciation, compétences. **Non vérifié : le vrai MBN** — premier essai à faire sur un devoir de test.

## Fenêtres de consultation des évaluations — refonte v2.131.0 (maquette validée le 2026-10-08)

Douze fenêtres, trois regroupements arbitrés par l'utilisateur. CSS dans les blocs « Détail de la note », « Résultats du devoir », « Comparer les classes » et « Petites fenêtres des évaluations » (avant « Import d'élèves »).
- **📊 Détail de la note** (`mnotedet`, `_evalShowNoteDetail(evalId, sid, opts)` → `_ndRender`) : **bande photo + mini-plan en tête** (v2.143.3, `#mnotedet-who`, `_ndWhoRender` / `_ndWhoHTML`) : photo de l'élève et sa place le jour du devoir ; **au survol d'une question (type A) ou d'une passation (type B)** — éléments `[data-nd-sub="mn:id"|"pass:id"]` —, le plan au jour de CETTE question / passation (date et créneau de son groupe ; sans date propre, jour du devoir). Plan par **`_seatingOnDate(ev, cls, date, slot)`** : salle du devoir (`_mnpEvalSeating`), date ≥ aujourd'hui ou absente → plan courant ; sinon appel de ce jour pris dans cette salle (créneau d'abord), puis photo notée avec le devoir, puis plan courant — **la provenance est écrite sous le plan**. Plan masqué pour un élève caché en mode confidentiel. en-tête « devoir · élève », **◀ ▶ = élève voisin sur le même devoir** (`_ndNav` ; ordre = lignes visibles du Bilan des notes s'il est affiché, sinon la classe par nom — `_ndOrder`), « ✏️ Ouvrir la saisie » ; bandeau Note · Moyenne de la classe (médiane) · Rang · Points ; corps **par exercice** (C, D), **par question** (A) ou **par compétence** (B), en pastilles `.nd-q` (valeur, A / NN / disp. / ⊘ non faite, commentaires de case) avec barre et total ; ligne de calcul ; carrés des compétences du devoir ; **remarque du devoir** (`#mnotedet-rem`, `_ndRemInput` : `_evalArmUndo`, `ev.studentRemarks`, ancien `notes[sid].remarque` retiré, enregistrée au fil de la frappe) ; « ⚖ Ajuster la note… » (`_ndAdjust`, le détail se redessine au retour). ⚠️ **La fenêtre « Remarque élève » (`mbilan-stuRem`) a été SUPPRIMÉE** : un clic sur une note du Bilan des notes ouvre ce détail avec le curseur dans la remarque (`_bilanOpenStuRem` n'est plus qu'une redirection). À la fermeture (`_ndAfterClose`, crochet `_modalReturnTo['mnotedet']` marqué `_nd`), Bilan (défilement gardé), fiche et tableur sont redessinés si la remarque a changé.
- **📊 Résultats du devoir** — la fenêtre `mrendu` (les id `mrendu-*` sont gardés pour la projection) **remplace l'ancien « Bilan des compétences » d'un devoir (`meval-bilan-comps`), « Projeter les notes » et « Export ENT » (`meval-export`), supprimés**. `_evalOpenRendu(evalId, mode)` avec `mode` = `'bilan'` | `'proj'` | `'ent'` (`_resSetMode`) ; état `_renduState = { evalId, classId, mode, sort, names, groups }`. Classe en pastilles, tri Nom | Prénom | Note | ordres de ramassage (`_resSids`), **type B : choix des passations affichées, type A : des mini-notes, types C et D : des questions** (v2.131.5 : groupées par exercice dans un cadre `.mres-exo`, la pastille de l'exercice allume ou éteint toutes ses questions, pointillés si en partie ; en-têtes des questions C/D préfixés du numéro de l'exercice, « 2·Q1 », v2.131.6 — vaut aussi pour la copie) (v2.131.2 / v2.131.3, même état — clés = id de passation ou de mini-note, pastilles sous les familles quand « Passations » est cochée, `_renduState.passOff`, remis à zéro au changement de devoir ; `_resTogglePass`, `_resAllPass` — pastilles « toutes » et « aucune » (v2.131.4) — les colonnes Compétences restent calculées sur tout le devoir), colonnes **par familles** (`_RES_GROUPS` : Questions / Passations, Σ exercices, Note, Rang, Compétences, Remarque — `_resToggleGroup`, retenues pour la séance et par mode ; défauts `_resDefaultGroups`). **Bilan** : bandeau (saisis, moyenne, niveau moyen par compétence), notes avec pastille de couleur, rang, compétences en carrés `.lvsq`, pied « Classe » (`_statsCellHTML`), clic sur un élève = détail de la note, 🆚 Comparer, ⧉ Copier (`_resCopy`, TSV de ce qui est affiché). **Projeter** : sans rang ni couleur de note, Nom et prénom | **Prénom et initiale** (v2.131.2 : « Léo M. », avec autant de lettres du nom qu'il en faut pour distinguer deux élèves de la classe au même prénom — `_buildAbbrMap`, au moins une lettre), 🖨 Imprimer, **🖥 Ouvrir dans une fenêtre** (v2.131.1, demande de l'utilisateur : à glisser sur le second écran d'un bureau étendu) — `_resProjOpen` écrit dans une fenêtre `window.open('')` une page qui reprend les `<style>` de l'app et le thème, avec ses propres boutons 🔍− / % / 🔍+ / **⛶ Plein écran** / ✕ (Ctrl ± 0) ; `_resProjPush`, appelé en fin de `_renduRender` en mode Projeter, y recopie le tableau à chaque réglage (clics retirés), la fenêtre suit donc en direct ; le pied propose alors « Afficher » / « Fermer la fenêtre ». Fenêtre bloquée → toast et ancien plein écran dans la page (`_renduStartProject`, gardé pour ce repli). Fermée avec la page. **Export ENT** : `_evalExportRender` (texte brut, tri nom puis prénom imposé), pastilles Note / Compétences / Remarque, CSV et Copier tout ; ⚠️ **une compétence sans niveau sort VIDE, plus « 0 »** (l'ENT y lisait un niveau zéro ; test dans `run.test.js`). Entrées : menu ⋯ d'un devoir (Résultats, Projeter, Export ENT, Comparer), barre du tableur (« 📊 Résultats » à la place de « 📤 ENT » ; le bouton 👀 Projeter y a été retiré en v2.136.14, doublon : Projeter est un mode de Résultats). La pondération du type B, qui était réglable dans l'ancien bilan, se règle dans ⚙ Réglages de l'évaluation. `_evalTableurActiveCls` lit la classe de cette fenêtre quand elle est ouverte.
- **🆚 Comparer les classes** — `mbilan-crosstab` est la seule fenêtre (l'ancienne `meval-crosstab` d'un devoir est supprimée). `_bilanOpenCrossTab(evalId?)` : depuis un devoir, positionnée sur lui et sa période ; sans argument (Bilan des notes), sur la moyenne de la période. Période en boutons (`_bilanCrossTabSetPer`, dont Année), pastilles « Moyenne de la période » + devoirs passés par au moins deux classes. **Une ligne par classe** (`.xc-row`) : de la note la plus basse à la plus haute, moitié centrale (quartiles `_xQuart`), médiane, moyenne de tous ◆ (`.xc-avg`, v2.131.1), moyennes filles ○ / garçons □ (tokens `--civ-f` / `--civ-m`), puis le tableau chiffré (⚠ si moins de 5 élèves) et ⧉ Copier. `_bilanCrossTabBuild` renvoie aussi les listes de notes (`vals`).
- **Petites fenêtres** : colonnes à copier ou exporter du Bilan (`mbilan-export` : pastilles par famille Élève / Devoirs / Synthèse — `out.kinds` posé par `_bilanScrapeTableForExport`, ligne des titres en interrupteur, aperçu `_ccPreviewText`, choix retenu dans `planClasse_bilanExportOff`, boutons CSV et Copier) et « Copier des colonnes » du Tableau des positions (`mcopycols`, **supprimée en v2.134.0**, fondue dans l'onglet) ; **arrondi** des moyennes en boutons avec l'effet sur la classe (`_bilanMeanGranRender`, ex æquo comptés) ; **compétences retirées d'une passation** (`meval-comp-change`, état `_ccState`, cartes Garder de côté / Reporter sur [pastilles] / Effacer, répartition des niveaux saisis ; aussi pour le remplacement d'une compétence) ; **import d'une évaluation** en deux colonnes (fichier glissé `_evalImportDrop`, choisi ou collé | structure lue).
- Défauts corrigés au passage : la copie du Bilan des notes collait un « ✎ » après chaque note portant une remarque ; le texte d'aide de l'ancien bilan d'un devoir affichait « /${20} » (fenêtre supprimée).
- Audit : 0 écart en clair et en sombre sur 16 états (détail en A/C, B, D ; résultats dans les 3 modes et en B ; comparaison devoir et moyenne ; les 5 petites fenêtres) ; 363 px à 375, sans débordement.


## Évaluations — création, liste des devoirs, bilans (extrait de « Évaluations (Types A / B / C) » dans CLAUDE.md)

### 📥 Import de la structure d'une évaluation Type C ou D (v2.77.0, Type D en v2.78.0)

Bouton **« 📥 Importer une évaluation (Type C ou D)… »** en tête de la modale **+ Nouvelle évaluation** (`#meval-new-import-wrap`, masqué en duplication). Ouvre `meval-import` : fichier (`.json`/`.txt`) **ou** texte collé, aperçu en direct, bouton **📄 Format du fichier (pour une IA)**.

- **Le format est décrit dans `docs/format-import-evaluation.md`**, écrit pour être donné tel quel à une IA avec le sujet. La page en embarque une **copie exacte** (`<script type="text/markdown" id="eval-import-spec">`, juste avant le gros script) que le bouton télécharge hors ligne. ⚠️ **Toute modification du format se fait aux DEUX endroits** — un test (`run.test.js`) compare les deux textes.
- Le fichier ne porte que la **structure** : `nomCourt`, `nomLong`, `description`, `noteMax` (défaut 20, ≠ somme des points), `coef`, `exercices[{titre, description, questions[{titre, points, competences[codes], description}]}]`, et une liste `competences[{code, nom, domaine}]` qui ne sert qu'à **créer** les codes inconnus. Classes, date, période, discipline se choisissent dans la modale de création.
- `_evalImportParse(text)` (pure, testée) : garde de la première `{` à la dernière `}` (réponse d'IA entourée de texte ou d'un bloc ```json), virgule décimale acceptée, titres tronqués avec avertissement, **erreurs bloquantes nommées** (« Ex1, question 2 : points invalide »). `_evalImportResolveComps` : codes comparés **sans la casse** au référentiel ; inconnus → créés (nom et domaine du fichier, domaine reconnu par son code `D1.3`…), annoncés dans l'aperçu. `_evalImportApply(evObj, spec)` pose exercices (`label`/`name`) et questions (`label`, `max`, `exerciceId`, `competenceIds`, `name`) — appelée dans `_evalNewSave` **après** `pushUndo`, donc annulable (compétences créées comprises).
- **Type D** (`"type": "D"`) : pas de barème en points par question ; **au moins une compétence par question** (erreur sinon) ; **les points du sujet deviennent des POIDS** (v2.78.1, arbitrage de l'utilisateur) : 1) points (ou `poids`) donnés sur la compétence `{code, points}` — le sujet a fixé les points par compétence ; 2) sinon les `points` de la question sont **partagés à parts égales** entre ses compétences sans points propres (reste après celles qui en ont) ; 3) sinon poids 1. Poids arrondi au centième, borné `TYPED_W_MIN..MAX` (avertissement si ramené) ; seuls les poids ≠ 1 sont stockés dans `mn.compWeights[cid]`. ⚠️ **La consigne à l'IA ne fait plus deviner le type d'après la présence de points** (un sujet à points convient aux deux) : type demandé à l'enseignant, C par défaut avec « Type à confirmer » dans la description ; `bareme` (liste de `nbLevels` nombres ≥ 0 — taille différente → avertissement et barème des Réglages) et `bilanParExercice`. `spec.totalPoints` vaut alors le **maximum atteignable** (Σ poids × plus haut palier). « Utiliser » pose barème et case « bilan par exercice » **dans les champs de la modale** (`.meval-new-typed-pt`, `#meval-new-typed-bilanexo`), que `_evalNewSave` relit déjà — pas de second chemin d'écriture. La structure n'est appliquée que si le type coché est celui du fichier (`_evalNewImport.type`).
- « ✓ Utiliser cette structure » coche le type du fichier, remplit nom court, nom long, descriptif, note max et coef ; la structure attend dans `_evalNewImport` (résumé + ✕ dans le bandeau, « ne s'applique qu'en Type C » si on change de type).

### Nouvelle évaluation / Réglages d'une évaluation — refonte v2.109.0 (maquette validée le 2026-10-07)

- Fenêtres élargies à 980 px. **Type en quatre cartes** (`.ev-types` : mêmes radios `meval-new-type`, habillées par CSS `:has(input:checked)` ; la longue description est en `title`). Le **barème du Type D est visible dès qu'on choisit D**, sous les cartes (arbitrage) — dans Réglages d'une évaluation, il est sous le titre, hors des options. « 📥 Importer depuis un fichier » passe en lien discret dans l'en-tête (`#meval-new-import-wrap`, `#meval-new-import-sum` conservés). Réglages d'une évaluation : le type n'est plus qu'un badge (`#meval-edit-typebadge`, `_evEditPolish`).
- **Deux colonnes `.ev-cols`** : Informations (période en boutons via **`_selSeg(selId)`** — le `<select>` reste caché, c'est lui que lit le code ; note, coefficient et arrondi sur une ligne) | **Classes et dates**.
- **Options repliées** (`<details class="ev-opts" id="<prefix>-opts">`, refermées à chaque ouverture par `_evNewPolish` / `_evEditPolish`), avec un **résumé** d'une ligne `_evOptsSum(prefix)` (moyenne / diagnostique, facultative et son mode, règle de moyenne si visible, pondération du B), recalculé à chaque `change` dans le bloc et au changement de type. Cases → interrupteurs `.sw-chk` (mêmes `id`), mode de la facultative en `.seg-radio` (mêmes `name`).
- Bouton « ✓ Créer et saisir » (`#meval-new-save-btn`).
- **Date par défaut en mode AUTO** pour les types A et B (v2.109.1, demande de l'utilisateur) : `_evalNewDefaultDate()` renvoie `null` (aucune date → auto, « (auto) » affiché) pour A/B, la date du jour pour C/D (le mode auto n'y existe pas). Utilisé par le pré-cochage, le clic sur une pastille de classe et la duplication. Repasser de C/D à A/B remet en auto les dates posées d'office, **pas** celles saisies à la main (`_evalNewState.manual`, rempli par `_evalNewOnClassDateChange`).
- ⚠️ Piège rencontré en écrivant le script de transformation : chercher la fin d'un bloc par `'    </div>\n\n'` attrape aussi `'      </div>\n\n'` (sous-chaîne) — la fin d'un bloc indenté se cherche avec le saut de ligne devant (`'\n    </div>\n\n'`). Le décalage des balises sortait les boutons du bas hors de la fenêtre.
- Audit : 0 écart en clair et en sombre (types A, B, D, options dépliées, facultative) ; 363 px à 375, sans débordement.

### Réglages d'une évaluation (`meval-edit`) = brouillon jusqu'à « ✓ Enregistrer » (v2.68.2)

Les classes et les dates par classe s'écrivent **tout de suite** dans l'éval (elles pilotent l'aperçu des dates et le pré-remplissage des absents), le reste au ✓. Pour que l'ensemble se comporte comme un brouillon : `_evalOpenEditor` garde une **copie JSON de l'éval** et la longueur de `undoStack` (`_evalEditBackup`) ; toute saisie dans la modale (écouteurs `input` / `change`) la marque modifiée. À la fermeture sans enregistrer (Annuler, fond, Échap — `_modalReturnTo['meval-edit'] = _evalEditOnClose`), si quelque chose a changé, la modale **se rouvre telle quelle** et `_uiConfirm` propose « Abandonner les modifications » ; abandonner (`_evalEditDiscard`) remet la copie en place et **tronque `undoStack`** aux étapes d'avant l'ouverture. `_evalEditSave` et `_evalEditDelete` effacent la copie avant de fermer. Avant : « Annuler » laissait les dates et classes modifiées, et une fermeture par le fond perdait les textes sans prévenir (audit 2026-10-03, § 1.6).

### Création / duplication d'évaluation — panneau unique

Plus de modale Réglages intermédiaire. La modale `meval-new` (création + duplication) contient désormais toutes les sections :
1. **Type** (radio A/B/C, verrouillé en duplication)
2. **Informations** (nom court · nom long · descriptif · période · note max · coef · granulométrie)
3. **Classes concernées** : chips compacts en haut (clic = toggle), lignes per-classe en dessous **uniquement pour les classes cochées** (input date + select créneau). État local `_evalNewState = { dates, slotIds }`.
4. **Options avancées** : countsForMean, facultative + 3 modes, weighting (Type B), meanRule (Type B/C — caché Type A)

À ✓ Créer → bascule directement sur le tableur (ouvre Structure si la mini-note/passation initiale manque, puis revient au tableur via `_modalReturnTo['meval-structure']`). Le bouton ⚙ dans la toolbar du tableur permet d'ajuster les options avancées plus tard.

### Bilan des notes — toolbar et colonnes

- **Tri des devoirs** : sélecteur avec 4 modes (Date · Nom · Type+date · Type+nom), boutons d'inversion indépendants (Type A→C / C→A en modes groupés). Persistance via `localStorage.planClasse_bilanSortMode` + `planClasse_bilanSortReverse` + `planClasse_bilanSortReverseType` (clés dédiées, indépendantes de la liste Devoirs). Défaut : Date asc (chronologique, oldest gauche). Toolbar dans le header `.sh` à côté du titre (placeholder `#bilan-sort-toolbar` peuplé par `renderBilanTab`).
- **Toggle « Grouper par période »** : visible uniquement quand le sélecteur de période est sur **Toutes** ET qu'il existe ≥ 2 périodes. Quand actif (défaut), les évaluations sont d'abord triées par ordre canonique des périodes (S1 puis S2, ou T1/T2/T3) avant d'appliquer le tri sélectionné. Persistance `localStorage.planClasse_bilanGroupByPeriod` ('1'/'0').
  - **Repère visuel de période** (condition `_periodGrouping = periode === '' && groupByPeriod && _perOrder.length > 1`) :
    - **Bandeau pleine largeur** par période : une **ligne d'en-tête supplémentaire** en tête du `<thead>`, avec un `<th colspan>` coloré par période couvrant **toutes ses colonnes d'éval**. Couleurs distinctes par index de période via les classes CSS `.bilan-perband` + `.bilan-perband-0/1/2` (bleu ardoise `#33597f` / terracotta `#9d5435` / vert sapin `#3f7a55`), libellé « SEMESTRE 1 » / « TRIMESTRE 1 »… Le colspan de queue couvre les colonnes de synthèse (Moy/Rang/Rem/Conseil).
    - **Frontière de période** : double trait foncé **à creux clair** (3 bandes via `box-shadow` inset : foncé 0-2px · `var(--paper)` 2-5px · foncé 5-7px + `padding-left:13px`), constante `_PER_DIVIDER`, posée sur la 1ʳᵉ colonne d'éval de chaque bloc période (header, cellules, footer). Distinct de la **frontière de type** (tri par type) qui reste un trait fin `border-left:3px solid var(--ink-blue-soft)`. Priorité période > type dans `_brk`.
- **Tooltip cellule note** : enrichi de la **remarque saisie au devoir pour l'élève** quand elle existe (lue dans `ev.studentRemarks[sid]` avec fallback `ev.notes[sid].remarque`), sur une seconde ligne préfixée 📝.
- **Pastille type** (`A`/`B`/`C`) dans chaque en-tête de colonne d'éval (classe `eval-type-badge`).
- **Clic gauche** sur l'en-tête de colonne ouvre la saisie en mode tableur (au lieu d'un clic droit). Tooltip de survol : type + nom + nom long + date + /noteMax + mention facultative + descriptif. Aucune mention « clic droit pour ouvrir ».
- **Tri des évaluations** : date croissante (plus anciennes à gauche), tri secondaire par nom court en cas d'égalité, évals sans date en fin de tableau.
- **Évaluations facultatives** :
  - Badge **★** (étoile orange) dans l'en-tête de colonne, tooltip explicite le mode (improveOnly / bonus / over10).
  - **Cellules non comptées** pour un élève : `opacity:.55` + hachures renforcées (alpha .42, pas 10px) superposées à la couleur de barème. Lisible même sur fond foncé (vert, rouge soutenu). Tooltip : `★ Facultative — NON comptée pour cet élève (mode : X)`. Calcul via `_computeStudentFacultativeCounted(classId, sid, periode)` qui miroie la logique de moyenne pour tracker les facultatives effectivement comptées.
- **Séparateur vertical entre colonnes d'éval** : classe CSS `.bilan-evalcell` (border-right `1px solid var(--rule-line-soft)`) appliquée aux cellules d'éval des deux bilans (Notes + Compétences). Aide à distinguer les valeurs quand un élève a la même note/niveau sur plusieurs colonnes consécutives. Discret par construction (couleur Seyès du design system).
- **Colonne 🎓 Conseil** (par période) à droite de Remarque : boutons-pastilles dont les **mentions sont entièrement paramétrables** (cf. section *Conseil de classe — mentions configurables*). Défauts : `F` Félicitations (bleu) · `E` Encouragements (vert) · `AT` Avertissement travail (orange) · `AC` Avertissement comportement (rouge), avec incompatibilités par défaut `F⊗E`, `E⊗AT`, `E⊗AC`. Storage `S.conseilClasse[classId][disciplineId][sid][periode] = { [mentionId]: true }`. La cellule porte `class="bilan-conseil-cell"` + `data-active="abbr1+abbr2"` (lu par le scrape Copier/CSV). Footer du tableau : totaux par mention sous forme de pastilles. `_toggleConseilClasse` applique les incompatibilités par paires et préserve la position de scroll de `.bilan-table-scroll` lors du re-render.
- **Préservation du scroll au save de remarque élève** (depuis v2.131.0 : `_ndAfterClose`, la remarque se saisit dans le détail de la note) capture `scrollTop`/`scrollLeft` de `.bilan-table-scroll` avant le re-render et les restaure après — sinon le tableau saute en haut à chaque validation, pénible sur une grande classe quand on annote en bas. Même pattern que `_toggleConseilClasse`.

### Onglet Devoirs — bandeau, filtres, rangées (v2.89.0)

Même démarche que les bilans (maquette validée le 2026-10-07 ; le tableur suit dans un lot suivant, avec le liseré de couleur par défaut).
- **Infos par devoir calculées une fois** : `_evalListInfo(ev, cls)` (effectif présent, élèves saisis, résumé de structure, notes finales arrondies, stats) — partagées par le bandeau, les filtres et les rangées.
- **Bandeau** `_evalListBandHTML` (calculé sur TOUS les devoirs de la période, filtre ignoré) : nombre par type · saisies incomplètes (ligne cliquable = filtre) · moyenne des moyennes de classe (ramenées sur 20) · calendrier (dernier / prochain devoir daté).
- **Filtre** (`planClasse_evalListFilter`, `_evalListSetFilter`) : Tous · Type A/B/C/D (seulement les types présents) · Saisie incomplète · Multi-classes. ⚠️ Depuis la v2.91.0, un **menu « ⏷ Filtre ▾ » dans la ligne du titre** (inséré en tête de `#eval-sort-toolbar`, bouton foncé `.evl-filter-on` quand un filtre est actif, avec « n/total ») — la rangée de pastilles prenait trop de place (demande de l'utilisateur). Ici le filtre **retire** les rangées (pas de pied de tableau à préserver). `_bsynthSetFilter('notes', f)` y renvoie.
- **Rangée** `_evalListRowHTML` (`.evl-row`, grille) : titre + ligne de détails · barre d'avancement de la saisie (orange si incomplète) · mini-histogramme des notes ramenées sur 20 (`_bsynthHistBins`, couleurs `_noteColor`) · moyenne avec pastille · **✏️ Saisir** + menu **⋯** (`.dd.dd-right`, menus déroulants existants) : Réglages, Dupliquer, Bilan des compétences, Comparer les classes (si multi-classes), Export ENT, Projeter, Supprimer. Les sept boutons d'icônes de chaque rangée ont disparu (arbitrage de l'utilisateur). Téléphone : histogramme et moyenne masqués.
- Audit de contraste : 0 écart en clair et en sombre, menu ouvert compris.

### Bilans — bandeau de synthèse et filtres de lignes (v2.85.0)

**En-tête collant et cartes réductibles (v2.143.4, demande de l'utilisateur)** — dans les deux bilans, `.bilan-stick` (`#bilan-stick-bilan` / `-comp`, `position:sticky` sous le bandeau, `top: var(--topbar-h)`) regroupe la barre du titre, le mode d'emploi et `#bilan-head-<tab>` : **cartes et pastilles de filtre sont rendues dans cet en-tête**, plus dans `#bilan-wrap` / `#comp-wrap` (`_bsynthRemRefresh` les y cherche). Le tableau prend la hauteur qui reste sous l'en-tête (`_bilanFit(tab)`, au moins 220 px ; appelé par `_renderTabCtx`, au redimensionnement et par un `ResizeObserver` sur l'en-tête et `#topbar` ; pose aussi `--topbar-h`, 0 quand le bandeau n'est pas collant). Barre **`.bsplit`** sous les cartes : glisser = réduire / agrandir la zone des cartes (`.bsynth-box`, qui défile si besoin), jusqu'à 0 (« ▾ cartes de synthèse ») ; double-clic = tout replier / tout afficher ; hauteur retenue sur la machine par onglet (`planClasse_bilanCardsH_<tab>`, absente = entières). Écran de moins de 560 px de haut : en-tête non collant. ⚠️ **L'en-tête se colle à sa position naturelle** (`_bilanFit` pose `style.top` = haut de l'onglet + son remplissage), pas au ras du bandeau : avec `top: var(--topbar-h)` seul, il remontait de la marge de l'onglet (~12 px) au premier tour de molette (signalé, v2.143.6). Mesuré : titre immobile de 0 à 2 000 px de défilement, dans les deux bilans.

Premier lot de la modernisation des deux bilans (maquette validée le 2026-10-07 : bandeau, puis cellules allégées, puis carte de maîtrise). Au-dessus de chaque tableau, des cartes `.bsynth-card` puis une rangée de pastilles `.bsynth-chip`. Code : bloc `_bsynth*` juste avant `renderBilanTab`.
- **Bilan des notes** (`_bsynthNotes`) : moyenne de classe (médiane, σ, min, max ; écart avec la période précédente calculé sur les **mêmes élèves**) · histogramme des moyennes en 5 tranches de 4 points (`_bsynthHistBins`, couleurs `_noteColor`) · remarques rédigées · à surveiller (en baisse ≥ 2 pts, sous 10/20 — lignes cliquables = filtre). Filtres : Tous · Sans remarque · En baisse · Sous 10/20 · Avec mention.
- **Bilan des compétences** (`_bsynthComp`) : niveau moyen · répartition des niveaux (couleurs `maitriseColors`) · 3 compétences les moins acquises (part au niveau ≥ ⌊nb/2⌋+1, ≥ 3 élèves évalués) · remarques · profils (fragile : moyenne < (nb+1)/2 ; très bonne maîtrise : ≥ nb−0,5). Filtres : Tous · Sans remarque · Profils fragiles · Très bonne maîtrise. Les agrégations y passent par un cache local `_agg` (élève × compétence × période), partagé par bandeau, lignes et pied.
- **Vue « Toutes »** : référence = l'année (`_computeStudentMeanForPeriod(…, '')`), comparaison = dernière période ayant des moyennes vs la précédente ; « sans remarque » = vide pour au moins une période où l'élève est concerné (`sidsByPer`).
- ⚠️ **Un filtre MASQUE des lignes (`tr.bf-hide`), il ne les retire pas** : le pied de tableau reste celui de toute la classe (le bandeau le dit). Zébrage recalculé sur les lignes visibles. Entrée et collage multi-lignes dans les remarques **sautent** les lignes masquées. Impression : n'imprime que les lignes visibles (« ce que l'on voit ») ; bandeau et pastilles cachés à l'impression. Exports Copier/CSV : toutes les lignes (ils raclent le DOM).
- **Remarques rédigées en direct** : `_onBilanRemarqueInput` appelle `_bsynthRemRefresh`, qui recompte depuis les champs du tableau (attribut `data-concerned` sur chaque textarea, `data-pers` sur la carte).
- **Mode confidentiel** : filtres coupés (`_bsynthGetFilter` → `'all'`, pastilles remplacées par un message, lignes de carte non cliquables) — masquer « les élèves en baisse » devant un parent dirait qui ils sont. `_confRefresh` re-rend désormais les deux bilans. Les statistiques de classe restent visibles (arbitrage du mode).
- Filtre persisté par onglet : `localStorage.planClasse_bilanFilter_bilan` / `_comp`.
- Cartes sur `--paper` (pas `--paper-warm`, où `--pencil` tombe à 4,26:1). Audit de contraste : 0 écart en clair et en sombre (bandeau, pastilles, pastille active) ; aucun débordement à 375 px.

**Lot 2 (v2.86.0) — corps du Bilan des notes.** Deux interrupteurs à droite de la rangée de filtres (`_bilanDisplayTogglesHTML`, réglages par machine, communs aux deux bilans), défauts arbitrés par l'utilisateur :
- **Couleurs : Pastilles (défaut) / Cases pleines** — `planClasse_bilanCellStyle` (`_bilanCellStyle()` → `'dot'`/`'fill'`). En pastilles (`table.bdots`) : note en encre sur fond neutre précédée d'un `_bdot(bg)`, absent « A » en gris, facultative non comptée en hachures légères, rang en texte simple, pied par devoir = moyenne + petite barre `.bfoot-bar`. Cases pleines = l'affichage historique, inchangé.
- **Remarques : En icône (défaut) / Dans le tableau** — `planClasse_bilanRemMode` (`_bilanRemMode()`). En icône : `_bilanRemIconCell` (✓ rédigée / ✎ à rédiger → fenêtre ✍), le texte voyage dans **`data-rem-text`**, que relisent `_bilanScrapeTableForExport` (Copier/CSV) et `_printSanitizeClone` (l'impression montre le texte). « Dans le tableau » garde la saisie directe et le collage d'une colonne depuis un tableur. Vaut aussi pour le Bilan des compétences.
- **Moyenne** : valeur + courbe des notes /20 de la période dans l'ordre chronologique (`_bilanSparkSVG`, `currentColor`) + écart avec la période précédente (↗/↘ ; en orange `--warn-fg` à −2 pts ou plus, en mode pastilles seulement). Valeur d'export propre dans **`data-export`** (sinon le CSV aurait reçu « 9,36↗0,6 »). Infobulle enrichie.
- **Mentions du conseil grisées** quand non attribuées (`.cm-btn.cm-off`, opacité .45, pleine au survol / focus) — les quatre boutons restent, un seul clic pour attribuer (choix préféré à un dévoilement au survol, peu commode au doigt). S'applique partout où `_conseilBtnHTML` est utilisé.
- En-tête de devoir : coefficient précédé de « × » ; ligne survolée soulignée par un filet (`box-shadow` inset, pas de changement de fond → aucun risque de contraste), désactivé en mode confidentiel.
- Audit : 0 écart en clair et en sombre, dans les deux styles de couleurs et sur le Bilan des compétences.
**Lot 3 (v2.87.0) — carte de maîtrise du Bilan des compétences.**
- Cellules en **carrés** `.lvsq` (couleurs `maitriseColors`, encre `_contrastTextColor`) ; non évaluée = carré en pointillés `.lvsq-none` (distinct d'un niveau 1).
- **Bandeau des domaines** du socle au-dessus des codes (mode « Codes compétences », `.bdomband`, colspan par domaine) ; les compétences sont donc **triées par domaine** (ordre du référentiel, hors socle en dernier) puis par code — exports compris, ils lisent `comps`. Nom court de la compétence sous le code (`.bcomp-name`, tronqué, infobulle complète).
- Colonne **Profil** (`_bilanLevelBarHTML`) : répartition des niveaux de l'élève sur les colonnes affichées ; en pied, celle de toute la classe.
- **Pied « Classe »** : par colonne, barre de répartition + « % au niveau ⌊nb/2⌋+1 ou plus » + μ. ⚠️ Le pied boucle désormais sur **`cols`** et non sur `comps` : en mode « Domaines du socle », il avait autant de cellules que de COMPÉTENCES sous des colonnes de DOMAINES — décalé (défaut antérieur, corrigé au passage ; la ligne « éval(s) » aussi, union des évals des compétences du domaine).
- **Légende** des niveaux en tête (`_bilanLevelLegendHTML`, dans la rangée des filtres), plus en bas.
- Audit : 0 écart en clair et en sombre, modes Codes et Domaines.
- Volontairement écartés : avatar et pastilles d'aménagement dans la colonne Élève — la 1re cellule reste visible en mode confidentiel, un aménagement y fuiterait.

### Conseil de classe — mentions configurables

Les mentions de la colonne 🎓 Conseil (Félicitations, Encouragements, Avertissements…) forment un **catalogue global paramétrable** — comme les tags / disciplines. Plus de `F/E/AT/AC` codés en dur.

#### Modèle
```js
S.conseilMentions = {                              // catalogue global (keyé par id)
  cm_fel: { id, nom: 'Félicitations', abbr: 'F', color: '#2563eb', ord: 0 },
  cm_enc: { id, nom: 'Encouragements', abbr: 'E', color: '#16a34a', ord: 1 },
  cm_avt: { id, nom: 'Avertissement travail', abbr: 'AT', color: '#d97706', ord: 2 },
  cm_avc: { id, nom: 'Avertissement comportement', abbr: 'AC', color: '#dc2626', ord: 3 },
}
S.conseilIncompat = ['cm_enc|cm_fel', 'cm_avt|cm_enc', 'cm_avc|cm_enc']  // paires d'ids triés
S.conseilClasse[classId][disciplineId][sid][periode] = { [mentionId]: true }  // attributions
```
Défauts seedés dans `postLoadHook()` **uniquement si `S.conseilMentions` absent** (= fichier antérieur à la feature → bascule sur les nouveaux défauts : F bleu, E vert, incompatibilités `F⊗E`, `E⊗AT`, `E⊗AC` ; F reste compatible avec les avertissements). Couleurs passées par `_safeColor` au chargement.

#### Incompatibilité = par paires (pas des « groupes »)
Seul modèle capable d'exprimer les règles asymétriques : E exclut les avertissements mais F non, et AT+AC cohabitent. Activer une mention retire automatiquement ses incompatibles chez l'élève (`_toggleConseilClasse`). Helpers : `_conseilIncompatKey(a,b)` (ids triés joints par `|`), `_conseilAreIncompat`, `_conseilToggleIncompat`.

#### Migration des valeurs legacy
`_migrateConseilValues()` (dans `postLoadHook`, APRÈS `_bulletinWrapAll` pour avoir la structure à 4 niveaux) remappe chaque feuillet `{ F, E, AT, AC }` → `{ cm_fel, cm_enc, cm_avt, cm_avc }`. Idempotent (ne réécrit que les feuillets contenant encore une clé legacy).

#### Helpers de lecture / rendu
- `_conseilMentionsSorted()` — mentions triées par `ord` puis `abbr`.
- `_getConseilActive(classId, sid, periode, channel)` — `Set` des mentionIds actifs (filtré aux mentions encore au catalogue).
- `_conseilBtnHTML(mention, isOn, …)` — pastille (couleur du catalogue, texte via `_contrastTextColor`).
- Bilan des notes : colonne + footer bouclent sur `_conseilMentionsSorted()`. Cellules marquées `class="bilan-conseil-cell"` + `data-active` (lu par le scrape export).

#### Configuration (Réglages → 🎓 Conseil de classe → modale `mconseil-mentions`)
`openConseilMentions` / `renderConseilMentions`. Par mention : abréviation éditable (1–4 car. maj., unique), nom, couleur, compteur d'attributions, suppression (cascade `_conseilPurgeMention` : retire la mention de tous les feuillets + nettoie les paires `conseilIncompat`), et pastilles « ⊘ incompatible avec : … » (rouge = incompatible, clic = bascule symétrique). Ajout via formulaire bas de modale. Toutes les mutations : `pushUndo` + `save` + re-render bilan si ouvert (`_conseilRefreshBilan`).

#### Couverture
Exports XLSX/ODS (synthèse + bilan période) et scrape Copier/CSV bouclent sur le catalogue. `_validateImport` whiteliste `conseilMentions` + `conseilIncompat`. `_purgeStudentRefs` / `_purgeClassRefs` inchangés (keyés par sid/classId, agnostiques à la forme du feuillet). Tests de régression dans `test/run.test.js` (migration, incompatibilités, purge).

### Export Copier / CSV — modale de sélection des colonnes (`mbilan-export`)

Les boutons **📋 Copier tout** et **💾 CSV** du Bilan des notes ouvrent désormais une modale intermédiaire qui liste **toutes les colonnes du tableau affiché** (en-têtes scrapés depuis le DOM) avec checkbox. L'utilisateur coche/décoche, puis confirme → export filtré dans l'ordre du tableau.

- État : `_bilanExportState = { mode: 'copy'|'csv', data, checked: boolean[] }`. Reset à chaque ouverture (toutes cochées par défaut).
- Source de vérité = `_bilanScrapeTableForExport()` : scrape head/body/foot du `#bilan-tbl` rendu, gère les textareas (remarques → `.value`), les cellules Conseil (lit `data-active` sur `.bilan-conseil-cell` — abréviations actives séparées par `+`, robuste aux mentions personnalisées), les en-têtes d'éval (libellé + `(×coef)` depuis l'input numéro). Garantit que l'export reflète EXACTEMENT ce que l'utilisateur voit (tri, groupement par période, colonnes masquées, orphelines incluses ou non).
- `_bilanCopyAll()` / `_bilanDownloadCsv()` sont devenus des wrappers vers `_bilanOpenExport('copy'|'csv')`.
- Confirmation (`_bilanExportConfirm`) construit les lignes filtrées et copie au clipboard ou télécharge `bilan-<classe>-<période>.csv`.
- Toast d'avertissement si 0 colonne cochée.

### Comparer classes — modale `mbilan-crosstab`

Accessible depuis le bouton **🆚 Comparer classes** de la toolbar du Bilan des notes. Désactivé si moins de 2 classes ont des notes pour la période courante.

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

Depuis v2.131.0, `meval-crosstab` n'existe plus : un devoir ouvre `mbilan-crosstab` positionnée sur lui. Le tableau croisé affiche la médiane dans chaque cellule (`moy (n) · σ · méd`). La copie TSV inclut les colonnes correspondantes (`F méd`, `M méd`, `Total méd`).

### Boutons par devoir (liste Devoirs)

Dans la liste `#evals-list-wrap`, chaque ligne `.bsg-row` propose : `⚙ Réglages · 📋 Dupliquer · 📊 Bilan compétences? · 🆚 Comparer classes? · 💾 Export ENT · ✕ Supprimer`.

- **📊** visible si `_evalListEvaluatedCompetences(ev, 'code').length > 0` (l'éval évalue ≥ 1 compétence). Wrapper `_evalOpenBilanCompsForEval(evalId)` qui force `meval-tableur-evalid` puis appelle `_evalOpenBilanComps()`.
- **🆚** visible si `_evalClassIds(ev)` ∩ classes vivantes ≥ 2. Wrapper `_evalOpenCrossTabForEval(evalId)` symétrique.

(Historique, avant v2.131.0 — fenêtre remplacée par « Résultats du devoir ».) Le sélecteur de classe (`#meval-bilan-class`) était intégré au header de la modale `meval-bilan-comps` : peuplé par `_evalOpenBilanComps()` avec les classes vivantes de l'éval, défaut `S.cur` si l'éval la couvre, sinon `_evalPrimaryAliveClassId(ev)`. Caché si éval mono-classe. `_evalTableurActiveCls(ev)` consulte ce select en priorité quand `meval-bilan-comps` est ouverte — ainsi la modale fonctionne même ouverte directement depuis la liste Devoirs sans passer par le tableur.

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

**Toggle au clic gauche sur l'en-tête `<th>Élève`** via `_NAME_HEAD_ATTRS()` injecté dans 8 `<th>`. Fonction (et non `const`) car ce bloc est situé après l'appel `init()` ligne ~24159 — un `const` top-level serait en TDZ au 1er render. Idem `var _CUR_ABBR_MAP` (Map<sid, k> du contexte de rendu courant, set par chaque renderer via `_setCurAbbrMap(students)` juste avant sa boucle) et `var _bilanCompState` (assigné par `renderCompetencesTab` ~30 lignes AVANT sa déclaration : en `let`, démarrer l'app sur l'onglet Bilan des compétences levait une TDZ qui interrompait `init()` et laissait ~40 déclarations post-init non initialisées — bug latent reproduit puis corrigé le 2026-07-30). ⚠️ **Toute variable top-level déclarée après `init()` et assignée par un renderer d'onglet doit être en `var`** — un onglet restauré au démarrage exécute son renderer PENDANT `init()`.

L'algo normalise les prénoms via NFD + suppression des combining marks `/[̀-ͯ]/g` + lowercase pour comparer sans tenir compte des accents.

### Filet rouge — masqué quand une modale est ouverte

`body:has(.mo.on)::before { display: none; }` — règle CSS pure. Évite que le filet rouge (`body::before`, z-index 9990) passe au-dessus du tableur d'éval en mode plein écran (99vw).

## Disciplines (catalogue global)

Permet d'enseigner **plusieurs disciplines** à une même classe (ex. Physique-chimie + Physique-chimie bilingue). Refonte mai 2026 : au lieu de stocker 2 noms par classe (`discNamePrimary`/`discNameSecondary`), on a désormais un **catalogue global** `S.disciplines` et chaque classe coche les disciplines qui la concernent. Plus de limite à 2 — une classe peut être enseignée dans 3, 4, N disciplines.

Pour les **classes recomposées** (élèves d'une ou plusieurs classes regroupés autour d'une discipline particulière — ex. Bilingue 6ᵉ, Option DP3), on utilise toujours la feature **virtual classes** (`cls.virtual = true`) — créées via l'onglet Classes → ➕ Nouvelle classe recomposée. La virtual class porte ses propres `disciplineIds` + bilans, indépendamment des classes parentes.

### Modèle

```js
// Catalogue global (au moins une discipline marquée isPrimary).
// `disc_main` est créée par postLoadHook ; on la RENOMME plutôt que d'en créer une à côté
// (c'est ce que fait la démo), sinon « Discipline principale » reste orpheline.
S.disciplines = {
  'disc_main':   { id: 'disc_main',   nom: 'Physique-chimie',          isPrimary: true  },
  'disc_pc_bil': { id: 'disc_pc_bil', nom: 'Physique-chimie bilingue', isPrimary: false },
}

// Par classe : 1 ou plusieurs disciplines (jamais vide)
cls.disciplineIds = ['disc_main', 'disc_pc_bil']

// Par évaluation : la discipline d'appartenance (toujours set après migration)
ev.disciplineId = 'disc_pc_bil'

// Bulletins : clés = disciplineId
S.bulletinRemarques[classId][disciplineId][sid][periode]      = "texte"
S.bulletinClassRemarques[classId][disciplineId][periode]      = "texte"
S.bulletinWorkedItems[classId][disciplineId][periode]         = [items]
S.conseilClasse[classId][disciplineId][sid][periode]          = { [mentionId]: true }
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
  - ⚠️ **`_evalRefreshChannelSelect('meval-new')` doit être appelé APRÈS `_evalRenderNewClassPicker`** (dans `openNewEvalModal` ET `_evalDuplicate`), jamais avant : appelé avec zéro classe cochée, il fige le select caché sur `_disciplinePrimaryId()` — l'éval créée était alors rattachée à une discipline que la classe n'enseigne pas, donc **invisible de Devoirs et des deux bilans sitôt créée** (bug corrigé le 2026-08-02 ; il ne frappait qu'à la 1re ouverture par chargement de page, d'où sa non-détection). Défense en profondeur dans `_evalNewSave` : la valeur du select n'est acceptée que si elle appartient à l'**union des disciplines des classes cochées**, sinon repli sur `_clsDefaultDisciplineId(primaryCls)`. En duplication, la discipline de la SOURCE est pré-sélectionnée si encore proposée.
- **Sélecteur Discipline** dans les toolbars des 3 onglets eval (Devoirs / Bilan notes / Bilan compétences) : visible uniquement si la classe courante a ≥ 2 disciplines. Persistance par classe.
- **Pastille discipline** (`_evalChannelPillHTML`) : affichée si la discipline de l'éval n'est pas la 1re de sa classe.

### Migration (postLoadHook, idempotente)

1. **Catalogue** : crée `S.disciplines` avec `disc_main` (isPrimary) si absent ou vide. Garantit qu'au moins une discipline est `isPrimary`.
2. **Classes** : si `cls.disciplineIds` absent, construit depuis les legacy fields (`discNamePrimary` / `discNameSecondary` / `discPrimaryDisabled`) en trouvant / créant les disciplines au catalogue par nom (matching case-insensitive trim). Supprime les legacy fields. Garantit `disciplineIds.length >= 1`.
3. **Évaluations** : si `ev.disciplineId` absent ou invalide, dérive depuis `ev.discChannel` ('primary' → `cls.disciplineIds[0]`, 'secondary' → `cls.disciplineIds[1] || [0]`). Supprime `ev.discChannel`.
4. **Bulletins** (`_bulletinWrapAll`) : si le `[classId]` contient encore des clés `primary` / `secondary` (anciennes données) OU des clés orphelines (sids/periodes à la racine), migre vers la structure `[disciplineId]` en utilisant `cls.disciplineIds`. Idempotent : skip si toutes les clés sont des disciplineIds connus.

### Démo

`_seedDemoEvaluations` **renomme** la discipline principale du catalogue en « Physique-chimie » (plutôt que d'en créer une à côté, ce qui laissait « Discipline principale » orpheline) et ajoute « Physique-chimie bilingue », attachée à la seule 6A. Les disciplines sont posées **avant** la construction des évaluations : chacune naît avec la bonne `disciplineId`, au lieu d'être réaffectée après coup. La 6A porte 2 évals bilingues (une par semestre, sur 5 élèves) et des remarques de classe propres à ce flux — c'est ce qui démontre la séparation des bilans par discipline.

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

**Migration auto** : si l'utilisateur change `S.evalPrefs.periodMode` (semestre ↔ trimestre), tous les `cls.membership` sont effacés (les codes ne correspondent plus). Toast d'avertissement avec compte des restrictions effacées. En plus, les **`ev.periode` sont remappées** : par DATE quand l'éval en a une (`_periodeForDate(date, mode)` — bornes alignées sur `_periodEndDate` : S1→31/01, T1→30/11, T2→fin février), sinon positionnellement (S1→T1, S2→T3 / T1·T2→S1, T3→S2). Les stores bulletin (`bulletinRemarques`/`bulletinClassRemarques`/`bulletinWorkedItems`) et `conseilClasse` keyés par période sont remappés positionnellement — en cas de collision (T1 et T2 → S1) : textes concaténés, listes fusionnées, mentions unies. Toast récapitulatif.

**Évals diagnostiques (`countsForMean === false`)** : exclues de TOUS les bilans — moyenne /20 (historique) ET niveaux de compétences agrégés (`_aggregateStudentCompetence`, `_computeStudentDomainLevel`, collecte des colonnes de `renderCompetencesTab`). Le tableur de l'éval elle-même reste complet (vue intra-éval).

UI : dans la modale 🧬 Classe recomposée (`mvc`), bloc repliable **🗓 Présence par période** — cf. section *Classes recomposées* ci-dessous.

### Suppression d'une discipline

Refusée si la discipline est utilisée par ≥ 1 classe ou ≥ 1 éval (toast d'avertissement, bouton ✕ désactivé). Pas de cascade automatique — l'utilisateur doit retirer la discipline des classes / évals d'abord. La discipline principale (`isPrimary`) n'est jamais supprimable (peut être renommée).

### Affectation rapide depuis l'onglet Devoirs

Bouton **🎓 Disciplines** dans la toolbar de l'onglet **Devoirs** (uniquement — pas Bilans, qui sont des vues de consultation) → ouvre `mdisciplines` via `openDisciplinesFromTab()` avec un panneau supplémentaire **« 📚 Disciplines enseignées à [classe active] »** (id `mdisc-class-assign`). Checkboxes pour cocher/décocher les disciplines de la classe sans passer par « Modifier classe ». Helper `_discToggleClassAssign(discId, on)` : `pushUndo()` + mute `cls.disciplineIds` + garantit ≥ 1 discipline (retombe sur `_disciplinePrimaryId()` si vide). Re-render auto des toolbars eval.
