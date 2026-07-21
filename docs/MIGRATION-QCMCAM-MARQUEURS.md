# Note de suivi — Migration du générateur de marqueurs QCMCam

> **Statut : EN ATTENTE.** Ne rien coder tant que Sébastien COGEZ n'a pas publié la
> version **stable** de QCMCam. À ce jour la nouvelle version est « presque finalisée »
> sur une **adresse provisoire** (`q2.qcmcam.net`) — le dictionnaire peut encore bouger.

## Contexte

Mail de Sébastien COGEZ (contact@qcmcam.net) reçu le **2026-07-21** :

> J'ai presque finalisé la nouvelle version de QCMCam […] il faudra te mettre à jour
> car j'ai changé de bibliothèque de marqueurs.

- Nouvelle version (provisoire) : https://q2.qcmcam.net
- Source de référence : `src/lib/js/aruco.js`
  https://forge.apps.education.fr/qcmcam/qcmcam2/-/blob/main/src/lib/js/aruco.js

Il abandonne son `markers4x4.js` maison au profit d'un dictionnaire au format
**js-aruco2** (`{ nBits, tau, codeList }`).

## Ce qui change

| | Version actuelle (cette app) | Nouvelle version QCMCam |
|---|---|---|
| Bibliothèque | `markers4x4.js` (custom Cogez) | Dictionnaire js-aruco2 `QCMCAM_4X4_157h3` |
| Nombre de marqueurs | **125** | **157** |
| Encodage | `id_raw` → 4 chiffres base-4 → `_ARUCO_OPTS` (4 motifs de ligne) | `codeList[i]` = entier **16 bits** déplié directement en grille 4×4 (`nBits: 16`) |
| Numéro → code | mapping `p4` propriétaire | index dans `codeList` (position = id du marqueur) |
| Robustesse | aucune garantie de distance | distance de Hamming min. **3** (`h3`), correction de **1 bit** (`tau: 1`) |

### Avantages de la nouvelle version

1. **Bibliothèque standard et maintenue** (portage JS d'ArUco/OpenCV) au lieu de code propriétaire.
2. **+32 marqueurs** (125 → 157, ~+26 %) → salles/effectifs plus grands, seuil d'overflow relevé.
3. **Détection plus fiable** : la garantie de distance de Hamming 3 + correction 1 bit rend
   le scan robuste aux défauts d'impression, reflets, flou, angle, occlusion partielle.
   C'est vraisemblablement la raison principale du changement.

## ⚠️ Incompatibilité physique

Les deux jeux de marqueurs sont **mutuellement incompatibles**. Une fois la migration faite,
il faudra **réimprimer et recoller tous les marqueurs** collés sur les tables : les anciens
ne seront plus reconnus par le nouveau scanner (et inversement).

## Travaux à faire (le moment venu)

Fichier : `plan de classe.html`

1. **`_arucoDrawMarker` (~ligne 20396)** — remplacer la décomposition base-4 / `_ARUCO_OPTS`
   par un décodage direct des 16 bits du code en grille 4×4 (bordure noire 6×6 conservée).
2. **`_ARUCO_N_TO_RAW` + `_ARUCO_OPTS` (~lignes 20377-20385)** — remplacer par la nouvelle
   `codeList` de 157 entrées (copiée depuis `aruco.js`), indexée par numéro de marqueur.
3. **Limite 1–125 → 1–157** partout :
   - `_qcmNumbering` (~ligne 11830) : seuil d'overflow séquentiel 125 → 157.
   - `_parseArucoNumberList(text, 125)` (~ligne 20499) → 157.
   - Textes UI et bandeaux d'avertissement : lignes ~2784, 2787, 3543, 3574, 3586, 3646, 20219, 20224, 20367.
   - Commentaires « 125 » dans `_qcmNumbering` (lignes 11836, 11841, 11848, 11891, 11898, 11937…).
4. **Doc** : mettre à jour la section QCMCam de `CLAUDE.md` (nombre de marqueurs, encodage),
   `README.md`, `LICENSE` et `CREDITS.md` (mapping « 125 patterns » → nouveau dictionnaire).

## ⚠️ Points à vérifier avant de coder

- **Version stabilisée** : attendre l'adresse définitive (plus de `q2.` provisoire) et vérifier
  que la `codeList` n'a pas changé depuis le mail du 2026-07-21.
- **Convention de bits** à confirmer dans `aruco.js` (forge en 403 à l'analyse) : sens de lecture
  des 16 bits (haut-gauche → bas-droite ?) et valeur `1` = blanc ou noir. Indispensable pour
  générer des marqueurs **réellement scannables** — à valider par un test scanner réel sur
  la nouvelle version.
- **Dual licensing** : les composants ArUco restent sous CC BY-NC-SA 4.0 (Sébastien COGEZ) —
  conserver les crédits (papier à jeter, bandeau QCMCam, modale À propos, LICENSE, CREDITS.md).

## Dictionnaire fourni dans le mail (à re-vérifier contre la version stable)

`QCMCAM_4X4_157h3` — `nBits: 16`, `tau: 1`, 157 codes :

```
47103, 18431, 56687, 32679, 62383, 12255, 14847, 59199, 32367, 62175,
44983, 61823, 43647, 46791, 51519, 15987, 27319, 7087, 28431, 36087,
44487, 28055, 55751, 36711, 52647, 23735, 53991, 48159, 30879, 20406,
25727, 50647, 25439, 7895, 41463, 22111, 15303, 31443, 33743, 34173,
42159, 20195, 19317, 13531, 39603, 52779, 3647, 6781, 34427, 46187,
35751, 42227, 7287, 50071, 5551, 3991, 22631, 9527, 34203, 36959,
9171, 18341, 49515, 3279, 12471, 44299, 40131, 36487, 39141, 447,
3569, 10583, 9907, 55311, 9019, 13027, 31365, 51287, 12879, 35733,
18315, 27971, 24935, 34975, 30215, 4587, 42071, 11925, 4767, 21647,
45651, 50759, 57615, 3926, 34723, 19335, 9462, 20903, 27207, 26403,
10119, 9831, 12051, 20695, 17743, 27701, 27537, 29741, 5243, 19547,
6715, 17979, 10543, 19685, 41639, 3915, 10661, 16943, 7431, 25797,
37927, 2171, 5675, 247, 32879, 51719, 8379, 34581, 25251, 27659,
5299, 877, 10343, 4663, 38987, 3853, 2859, 9035, 36163, 8934,
29253, 33373, 13447, 24790, 37091, 25881, 24937, 49447, 23051, 20006,
9611, 34499, 2531, 9585, 33237, 1462, 18995
```
