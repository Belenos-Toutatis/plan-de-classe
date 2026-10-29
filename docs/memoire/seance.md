# Séance et vie de classe

> Mémoire détaillée du projet, rangée depuis CLAUDE.md le 2026-10-29 (texte inchangé). Contenu : mode appel et appels passés, statistiques d’absence, message à la classe, journal de séance, sonomètre, minuteur, mode confidentiel, listes d’évacuation, fenêtres de la vie de classe (retard, enregistrer l’appel, informations, place, salles, ordres de ramassage, tablettes, impression).

## Mode appel & enregistrement des appels

### Marquage transient (en mémoire)
- Variables globales : `_appelMode` (bool), `_absentToday` (Set de sids), `_lateToday` (Map sid → 'HH:MM'), `_absentDate` (YYYY-MM-DD pour reset auto), `_editingAttendanceId` (id de l'appel en cours d'édition ou null), `_appelSavedSlot` (cf. *État « post-appel »* ci-dessous)
- **Reset auto à minuit** : `_absencesAutoReset()` compare `todayKey()` à `_absentDate` et vide les sets si différent ; clear aussi `_appelSavedSlot`.
- **Bouton 🙋 Mode appel** dans la toolbar Plan Prof — `toggleAppelMode()` :
  - Active/désactive le mode (bouton se met en bleu)
  - À l'activation, **2 pré-marquages automatiques** :
    - `autoMarkUlisAbsent()` : ULIS hors-inclusion (`stu.ulis && !stu.ulis_incl`) + UPE2A hors-inclusion
    - `autoMarkUnplacedAbsent()` : tous les élèves de la classe qui ne sont pas dans `cls.seating` (non placés sur le plan)
    - Toast récap : `Pré-marqués absents : N ULIS + M non placés`. Décochable manuellement.
  - **Esc en mode appel** quitte le mode (équivalent du bouton ↩ Quitter). Si en édition d'appel passé → `cancelEditAttendance`.
  - Désactivé si `_viewingSnapshot` actif
- **Bandeau bleu** (jaune en mode édition) au-dessus de la grille via `updateAppelBanner()` : compteur, boutons **📌 Enregistrer** / **↺ Tout présent** / **↩ Quitter**
- **Cellule en mode appel** : clic gauche = toggle absent (`toggleAbsence`), clic droit **ou appui long tactile 550 ms** = modale ⏰ retard (`promptLateForStudent` → `mlate`, input `type="time"` pré-rempli). Drag&drop, +/-, isel désactivés. CSS `.cell.absent` (gris hachuré + 🚫 + nom barré), `.cell.late` (jaune + ⏰ HH:MM).

### Enregistrement (`S.attendance[classId][recordId]`)
- Bouton **📌 Enregistrer cet appel** dans le bandeau → modal `msaveatt` :
  - Date éditable (défaut : aujourd'hui)
  - Créneau pré-sélectionné via `findCurrentSlot()` (le créneau qui contient l'heure courante si la date = aujourd'hui ; sinon vide)
  - Groupe pré-rempli avec `groupFilter`
  - Libellé auto-suggéré `<slotId> — <date>` ou `Appel — <date>`, suffixé par `· G1/G2` si groupe ≠ 0
- **Toggle édition** : bouton ✏️ Éditer dans la liste des appels passés → recharge les sets dans `_absentToday/_lateToday`, active mode appel, set `_editingAttendanceId`. Au save, le record est mis à jour en place (id, ts d'origine préservés). Bouton ❌ Annuler la modification revient sans sauver.

### État « post-appel » : visuel persistant jusqu'à la fin du créneau
Variable globale `_appelSavedSlot = { date: 'YYYY-MM-DD', slotId, classId, label }` (ou `null`).

**Set après création** d'un record dans `saveAttendanceConfirm` SI `slotId` est défini ET `dateStr === todayKey()`. Sinon (date passée/future, ou pas de slot identifié), reset immédiat comme historiquement (`_absentToday.clear()` + `_lateToday.clear()`).

**Effet quand `_appelSavedSlot` est actif et l'heure courante tombe dans ce slot** (helper `_isStillInSavedSlot()`) :
- `_absentToday` / `_lateToday` sont **conservés** (pas clear après save).
- Dans `buildCell()`, hors mode appel : on applique `.cell.absent` / `.cell.late` (lecture seule — pas de toggle au clic, mais drag/menu contextuel restent disponibles). Tooltip enrichi avec « 🚫 Absent (appel ‹label›) » ou « ⏰ En retard, arrivé(e) à HH:MM ».
- Le compteur `tg-count` (✅ présents / 🚫 absents / ⏰ retards) reste juste automatiquement (il lit `_absentToday`/`_lateToday`).

**Reset automatique** dans `_absencesAutoReset()` (appelé en début de chaque `renderTeacherGrid()`) :
- À minuit (changement de `todayKey()`)
- Quand on quitte le slot enregistré (heure courante hors `[slot.start, slot.end[`) **et** qu'on n'est pas en mode appel actif
- Quand la classe active change (`cls.id !== _appelSavedSlot.classId`)

**Reset explicite** :
- Bouton **↺ Tout présent** (`clearAbsences()`) clear aussi `_appelSavedSlot`.

**Pourquoi `slotId` requis** : sans créneau identifié (ex. un appel hors horaires), il n'y a pas de notion de « fin de créneau » → on retombe sur l'auto-clear historique. Évite que le visuel reste bloqué.

**Persistance dans `localStorage`** : l'état transient (`_absentToday`, `_lateToday`, `_absentDate`, `_appelSavedSlot`) est sauvegardé sous la clé dédiée `planClasse_attTransient` à chaque mutation (`_saveAttTransient()`) et restauré à `init()` via `_loadAttTransient()`. Ainsi un F5 / redémarrage du navigateur en plein cours préserve le visuel hachuré et le compteur juste. La clé est volontairement séparée de `S` (donc absente de la sauvegarde JSON, sync auto, undoStack) — c'est de l'état UI éphémère.

Sites de mutation où `_saveAttTransient()` est appelé : `toggleAbsence`, `promptLateForStudent`, `clearAbsences`, `autoMarkUlisAbsent` (si n>0), `cancelEditAttendance`, `saveAttendanceConfirm` (les 2 branches : update et create), `_absencesAutoReset` (après auto-clean).

### Appels passés — refonte v2.107.0 (maquette validée le 2026-10-07)

- **Une fenêtre, deux vues** (`#matt-view`) : **Appels** | **Par élève** (l'ancienne fenêtre `mattStats` a été **supprimée** ; `openAttStats()` ouvre `openAttendanceModal('stu')`, `openAttStatsFromMatt()` bascule de vue). Classe en pastilles (classe courante | Toutes).
- **État unique `_attF`** `{ view, cls, per, from, to, abs, ret, hz }` ; `_attSet(k, v)` puis **`_attRender()`** qui recopie l'état dans les **anciens champs, gardés cachés** (`matt-f-*`, `msts-*`) — `renderAttendanceList` et `renderAttStats` les lisent toujours. Période en un clic (`#matt-per`) : Cette semaine | **Ce mois (défaut, arbitrage)** | Cette période (`_currentPeriode` → `_periodStartDate` / `_periodEndDate`) | Tout | Dates… (`_attRange`). Pastilles « avec absents », « avec retards » (vue Appels), « masquer 0 / 0 » (vue Par élève).
- **Bandeau** `#matt-synth` (`_attSynthRender`) : appels, absences (élèves concernés), retards, les plus absents (noms masqués en mode confidentiel).
- **Liste groupée par jour** (`.att-day`), une ligne `.att-row` par appel : créneau, (classe en vue Toutes), groupe, pastilles 🚫 / ⏰ / 🧑‍🏫 ou « ✓ aucun absent », libellé seulement s'il a été renommé, puis 🖼 Plan, ✏️ Modifier, 📝, 🗑. **Clic sur la ligne = détail déplié sur place** (`_attOpen`, `_attToggle`) avec « ⧉ Copier la liste ». Le corps du détail est **`_attDetailBodyHTML(r, cid)`**, partagé avec la colonne de droite du plan de l'appel (`mattPlan`, v2.132.0 — la fenêtre `mattDet` a été supprimée).
- Audit : 0 écart en clair et en sombre (deux vues, dates, détail déplié) ; 363 px à 375, sans débordement.
- **Période par défaut : « Cette période »** (v2.108.0, l'utilisateur a changé d'avis après « Ce mois »).
- **Plan de l'appel (`mattPlan`) modernisé et MODIFIABLE (v2.108.0)** : en-tête « 🖼 Appel du <jour> » + sélecteur **Consulter | ✏️ Modifier** (`#mattPlan-mode`, `_mpSetMode`) + ◀ ▶ ; sous-titre classe · groupe · salle · créneau · pastilles. Cases au style du Plan (fond papier, allées hachurées, places vides en pointillé). **« ✏️ Modifier » de la liste ouvre ce plan en mode Modifier** (`editAttRecordOnPlan`) au lieu de basculer l'onglet Plan en mode appel (`editAttendance` reste, plus appelé depuis la liste). En mode Modifier : **clic** = absent / présent (`_mpToggleAbs`, ou AESH `_mpToggleAeshAbs`), **clic droit ou appui long 550 ms** = retard → la fenêtre `mlate` habituelle avec le contexte `_lateCtx = 'rec'` (`promptLateForStudent(sid, 'rec')`, `_lateConfirm` / `_lateRemove` écrivent alors dans `_viewingAttRecord`, pas dans l'appel en cours). Les changements portent sur des **copies** (`absentsSet`, `retardsMap`, `aeshAbsents`) ; **✓ Enregistrer** (`_mpSave`) les écrit dans le record (une entrée d'annulation, identité des nouveaux élèves ajoutée à `r.eleves`), ↺ Annuler les recharge (`_mpReload`). Fermer, Échap ou clic sur le fond avec des modifications → confirmation (hook `_modalReturnTo['mattPlan']`) ; ◀ ▶ refusés tant que ce n'est pas enregistré.
- Défaut ancien corrigé au passage : le nom d'une AESH sur ce plan était en `#880e4f` figé (1,38:1 en sombre) → `var(--aesh-fg)`.

### Modal "📅 Appels passés" (avec filtres)
- Bouton dans toolbar Plan Prof
- Filtres : classe (dropdown avec "Toutes les classes"), date du / au, cases "avec absents" / "avec retards", bouton ↺ reset
- **Tri** : date desc (le record le plus récent en haut), puis `slotId` desc en tie-breaker (S3 > S2 > S1 > M4…), puis `ts` desc en fallback. **Indépendant de la date de saisie**.
- Quand "Toutes" est sélectionné : badge bleu avec nom de classe sur chaque ligne
- ⚠️ *Historique (avant v2.107 / v2.132) — `mattDet` et `mattConflict` n'existent plus.*
- **Actions par record** : **👁 Liste** (sous-modal `mattDet`) / **🖼 Plan** (sous-modal `mattPlan` directement sur la grille) / ✏️ Éditer / 📝 Renommer / 🗑 Supprimer
- **Bascule Liste ↔ Plan** : depuis `mattDet`, bouton **🖼 Vue plan** → ouvre `mattPlan` sur le même record. Inversement depuis `mattPlan`, bouton **📝 Liste** → `switchMattPlanToDet()` ouvre `mattDet`. Permet d'alterner sans repasser par la liste générale.
- **Détail (`mattDet`)** : sections séparées 🚫 Absents et ⏰ Retards (avec heure d'arrivée), bouton 📋 Copier la liste. Badge gris discret **"(non placé)"** après le nom des absents qui n'avaient pas de place au moment de l'appel (détecté via `seatingHash` du record).
- **Plan de l'appel (`mattPlan`)** : grille en lecture seule basée sur le seating snapshot. Section "🚫 Absents non placés (N)" sous la grille listant les élèves absents qui n'avaient pas de place. AESH placées positionnées via `aeshSeatingSnap` (ou état actuel si record antérieur).

### Reconstitution de l'état post-appel après sync sur une autre machine

L'état transient (`_absentToday`, `_lateToday`, `_aeshAbsentToday`, `_appelSavedSlot`) vit dans `localStorage` (clé `planClasse_attTransient`) — **pas synchronisé** entre machines via le fichier JSON. Sur une 2e machine qui charge le fichier sync pendant le créneau d'un appel, `S.attendance` contient bien le record mais le visuel hachuré « post-appel » sur le plan ne se déclencherait pas.

**Fix** : helper **`_restorePostAppelFromAttendance()`** qui, si :
- mode appel inactif ET pas déjà en post-appel pour la classe active,

cherche dans `S.attendance[cls.id]` un record dont `r.date === todayKey()` et `r.slotId === currentSlot.id` (via `getSalleSchedule + findCurrentSlot`). Si trouvé, restaure :
- `_absentToday` ← `r.absents`
- `_lateToday` ← `r.retards`
- `_aeshAbsentToday` ← `r.aeshAbsents` (filtré sur la classe active)
- `_appelSavedSlot` ← `{ date, slotId, classId, salleId, label }`
- Persiste via `_saveAttTransient()`

Appelé à 3 endroits : `init()` (après `_loadAttTransient`), `autoReloadCheck()` (après reload sync), `switchClass()` (bascule vers une classe à appel actif non encore restauré).

## 📣 Message à la classe (Plan Prof)

Le pendant **collectif** des rappels par élève : ce que le prof doit dire à **toute la classe** en début de séance (rendre les copies, mot à faire signer, matériel à apporter). Demandé en usage réel : l'app est ouverte à chaque début de cours, c'est donc là que le pense-bête doit sauter aux yeux.

- **Modèle** : `cls.classMessages = [{ id, text, ts }]`, sur la classe — donc emporté par sa suppression, par la fin d'année et par un rename de classe recomposée, **sans purge dédiée** (aucun sid ni classId dedans). Pas de migration : `_clsMessages(cls)` crée le tableau à la lecture. Un test le couvre.
- **Bandeau `#class-msg-banner`** (statique dans `#tab-plan`, juste avant `.tp`), rendu par `_renderClassMsgBanner()` en tête de `renderTeacherGrid` — donc à chaque changement de classe, salle, undo. Fond `--highlighter` + liseré rouge `--margin-red` + halo pulsant (`cmsgPulse`, coupé au survol), texte en serif 1,18 em. Un ✓ Fait et un ✏️ par message, ➕ pour en ajouter. Masqué en consultation de snapshot.
  - ⚠️ **Encre FIXE `#1a252f`** sur ce bandeau et sur les puces jaunes, comme `.crem-badge` : `--highlighter` est jaune dans les DEUX thèmes, `var(--ink-deep)` y poserait de l'ambre en mode nuit. Mesuré 6,84:1 en sombre, 10,99 en clair.
  - ⚠️ Le bouton toolbar `#btn-class-msg.has-msg` porte des `!important` : la règle globale `.btn-g { background: var(--paper) !important }` (et sa jumelle sombre) battait le jaune sans eux.
  - **Plan Prof seulement** : ni Vue Élève (projetée), ni impression (`@media print` le cache) — un message peut viser un élève nommément.
- **Modale `mclassmsg`** (`openClassMsg(editId?)`, `renderClassMsgModal`) : liste + `<textarea>` (Entrée = valider, Maj+Entrée = retour à la ligne, 300 caractères). Le même formulaire sert à l'ajout et à la modification (`_cmsgEditId`, bouton « ✓ Modifier » + ✕ pour abandonner). Ajouter **ferme** la modale (un message = une action terminée, comme les commentaires d'éval). Dans `_MODAL_RERENDER`.
- **✓ Fait supprime sans archiver** (`markClassMsgDone`) : c'est un pense-bête de séance, pas un fait à consigner — à la différence des rappels par élève, qui vont dans l'historique. Ctrl+Z le ramène ; la modale se ferme d'elle-même sur le dernier.
- **Carte de classe** (onglet Classes) : puce jaune `📣 N message(s) à passer` avec les textes en infobulle — pour voir d'un coup d'œil quelles classes ont quelque chose en attente.
- Démo : deux messages sur la 6A, un sur la 5B (annoncés dans `mwelcome`).
- **Refonte v2.111.0 (maquette validée le 2026-10-07)** :
  - Fenêtre au gabarit des Rappels : en-tête (classe, « N en attente · N programmés », **⚙ Messages courants**), lignes `.rem-row` avec ✓ Fait et **✏️ modification sur place** (`_classMsgEdit` → `_classMsgEditDone` ; le formulaire du bas ne sert plus qu'à l'ajout — `_cmsgEditId` n'est plus utilisé). Le ✏️ du bandeau du plan ouvre la fenêtre et passe ce message en modification.
  - **Messages courants** en puces sous le champ (`S.classMsgPresets`, liste de textes ; défauts `DEFAULT_CLASSMSG_PRESETS`, déclarés avant `init()`) : clic = remplit le champ, **double-clic = ajouté tout de suite**. Réglables dans la fenêtre `mcmsgpresets` (gabarit des fenêtres de liste, glisser ⠿, ↻ défauts), ouverte depuis la fenêtre ou la tuile **📣 Messages courants** des Réglages. ⚠️ Nouvelle section de `S` : initialisée dans `postLoadHook` (liste vide explicite respectée), dans la liste blanche de `_validateImport` et dans `S_SECTION_LABELS` ; c'est un réglage, **conservé en fin d'année**.
  - **Aussi pour** : pastilles des autres classes (`_cmsgAlso`) — le même message est ajouté à chacune (une entrée d'annulation).
  - **À partir du** (`#mcmsg-from`) : champ `m.from` (`YYYY-MM-DD`, posé seulement si dans le futur). **`_clsMsgVisible(cls)`** ne garde que les messages dont la date est passée : c'est lui que lisent le bandeau du plan, le bouton 📣 et les cartes de l'onglet Classes ; la fenêtre montre aussi les programmés (`.cmsg-later`, « s'affiche à partir du »).
  - **Aussi en attente** : lien vers chaque autre classe qui a des messages visibles (`_cmsgGoClass` → `switchClass`).
  - Audit : 0 écart en clair et en sombre (fenêtre avec message programmé, messages courants) ; 363 px à 375.

## Stats absences/retards par élève sur une période (modal `mattStats`)

Vue cross-élèves filtrable par période, accessible depuis la modal **📅 Appels passés** (`matt`) via le bouton **📊 Stats par élève** dans la barre de filtres. À la fermeture, retour automatique à `matt` via `_modalReturnTo['mattStats']`.

### Filtres
- **Période** :
  - Boutons rapides **Semaine** (lundi → dimanche de la semaine en cours) et **Mois** (1er → dernier jour du mois en cours). Le bouton actif passe en bleu.
  - Date pickers **Du** / **Au** (toujours éditables ; toute modif manuelle déshighlight les boutons rapides).
  - Bouton **📅 Aujourd'hui** à côté de **Au** : ramène la date de fin à `todayKey()`.
- **Classe** : dropdown avec « — Toutes les classes — ». Pré-sélectionne la classe courante (`getCls()?.id`). En mode "Toutes", la colonne **Classe** apparaît dans le tableau.
- **0/0 masqués** : checkbox pour cacher les élèves sans absence ni retard sur la période (utile pour focaliser).
- Bouton **↺** : reset → semaine en cours, classe courante, hidezero off.

### Tableau (sortable)
- Colonnes : (Classe?) · Élève · Grp · 🚫 Absences · ⏰ Retards · Total
- Tri par défaut : 🚫 desc (les plus absents en haut). Clic sur en-tête = bascule asc/desc.
- Badges colorés par `oubliColor()` (cohérence visuelle avec les autres tableaux de stats).
- Bandeau d'info en haut à droite : `N élèves · 🚫 X · ⏰ Y · DD/MM/YY → DD/MM/YY`.

### Fonctions clés
- `_ymd(d)` : Date → 'YYYY-MM-DD' en heure locale
- `_statsWeekRange()` / `_statsMonthRange()` : `{from, to}` calculés à la volée
- `getStudentAttendanceStatsInRange(classId, sid, fromYMD, toYMD)` : variante de `getStudentAttendanceStats` filtrée par plage de dates inclusive (utilise la comparaison lexicographique des strings 'YYYY-MM-DD')
- `openAttStatsFromMatt()` : ferme matt, programme le retour, ouvre mattStats
- `openAttStats()`, `renderAttStats()`, `setStatsPeriod(p)`, `setStatsTodayEnd()`, `resetStatsFilters()`, `sortAttStats(col)`, `_highlightStatsPeriodBtn(period)`

### Mécanisme de retour modal → modal
- Variable `_modalReturnTo = { modalId: callback }`
- `closeMod`, `closeMod2`, et le handler Esc déclenchent `_afterModalClose(id)` qui invoque le callback enregistré et le supprime. Le handler Esc appelle directement `closeMod2(id)` (plutôt qu'une fermeture manuelle dupliquée) — garantit que le focus trap (`_modalTeardownA11y`) est démonté sur les 3 voies de fermeture (bouton, backdrop, Échap) sans divergence.
- Utilisé pour : à la fermeture de mhist depuis la vue d'ensemble, rafraîchir `renderOverview()` (au cas où l'historique a été modifié)

## 🎙 Sonomètre — surveillance du niveau sonore

Bouton **🎙** dans le header (entre 💾 Données et ⓘ, id `#btn-noise`, `toggleNoiseMeter()`) — donc accessible **sur tous les onglets**. Active la mesure du bruit ambiant via le micro (Web Audio API) et alerte quand le niveau est trop élevé de façon soutenue.

### Confidentialité & contraintes
- **Analyse 100 % locale, en temps réel** : aucun son enregistré ni transmis. Mentionné dans la modale ⓘ → Vie privée et dans la modale de réglages.
- `getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}})` — on désactive les traitements pour mesurer le niveau **brut** (l'AGC normaliserait le volume et fausserait le sonomètre).
- **Contexte sécurisé requis** : HTTPS (GitHub Pages) ou `localhost`. Échoue en `file://` → toast explicite. Toutes les erreurs (refus, indispo) sont catchées en toast, jamais d'exception non gérée.

### Niveau (relatif, pas des dB calibrés)
`_noiseRawDb()` : RMS du signal temporel (`getByteTimeDomainData`) → dBFS brut (`20·log10(rms + 1e-7)`, ~ −140 .. 0). `_noiseComputeLevel()` mappe ce dBFS sur **0–100** : `(db − floor) / (0 − floor) · 100` clampé, où `floor = _noiseSettings.silenceDb` (= le dBFS qui doit correspondre au niveau 0). 0 dBFS (plein échelle) reste mappé à 100. `_noiseFrame()` (boucle `requestAnimationFrame`) applique un lissage exponentiel (`smooth = smooth·0.75 + raw·0.25`). Pas de vrais décibels → l'utilisateur **calibre le plancher de silence ET le seuil** pour sa salle.

#### Plancher de silence réglable (`_noiseSettings.silenceDb`, défaut −60)
Le plancher (= niveau 0) était figé à −60 dBFS ; il est désormais **réglable** dans la modale `mnoise` (fieldset « 🤫 Plancher de silence (niveau 0) », inséré juste après l'encart « Niveau actuel », avant le seuil d'alerte) pour calibrer le silence réel de la salle — le bruit de fond ventilation/couloir ne descend jamais à −60 dBFS, donc la jauge ne retombait jamais vraiment à 0. Borné par `NOISE_SILENCE_MIN = -80` / `NOISE_SILENCE_MAX = -25` (le span ne peut pas devenir nul). Clampé au chargement dans `_noiseLoadSettings`. Persisté dans `localStorage.planClasse_noiseSettings` comme les autres réglages.
- **Bouton « 🤫 Calibrer le silence »** (`noiseCalibrateSilence()`) : échantillonne `_noiseRawDb()` toutes les 60 ms pendant ~1,5 s, écarte les 20 % d'échantillons les plus forts (ignore un bruit ponctuel), prend la moyenne − 2 dB de marge → fixe `silenceDb`. Désactivé (avec indice rouge `#noise-calib-hint`) si le sonomètre n'est pas actif (`_noise.active`). Garde-fou anti double-clic via `btn.dataset.busy` ; s'interrompt proprement si le micro est coupé en cours de mesure.
- **Curseur de réglage fin** (`#noise-silence-range`, −80..−25, `noiseSetSilence`) + bouton **↺ Défaut** (`noiseResetSilence`). `_noiseSyncSilenceUI()` synchronise curseur + valeur affichée ; appelé par `openNoiseSettings`, la calibration et le reset.

### Logique d'alerte (anti-fausses-alertes)
Alerte déclenchée seulement si le niveau lissé **≥ seuil pendant ≥ `sustainS`** (défaut 3 s) **ET** que la **temporisation `cooldownS`** (défaut 15 s) depuis la dernière alerte est écoulée. `overSince` (début du dépassement continu) remis à 0 dès que le niveau repasse sous le seuil. `_noiseTriggerAlert()` pose l'état visuel (4 s via `alertClearTimer`) + joue le son ; `cooldownS` empêche le re-déclenchement avant expiration.

### Affichages
- **Petit widget flottant** (`#noise-widget`, `position:fixed` bas-droite, z 985 < modales) : barre de niveau à 3 zones 🟢 calme / 🟠 animé / 🔴 trop fort (`_noiseZone` : loud si ≥ seuil, warn si ≥ seuil−18, sinon calm), marqueur de seuil, n° de niveau, état texte. Boutons 🔔/🔕 (couper/réactiver le son — `_noiseWidgetToggleSound`) · ⚙ (réglages) · 🪟 (fenêtre déplaçable) · ✕ (arrêt). L'état `soundOn` est synchronisé entre les 3 surfaces (widget, case de la modale, bouton de la popup) via `_noiseSyncSoundUI()`. **Alerte visuelle par défaut = le widget passe au rouge** (classe `.alert`, halo pulsant). Pendant que le sonomètre est actif, `startNoiseMeter`/`stopNoiseMeter` posent/retirent `body.noise-widget-on` → règle CSS qui **remonte les toasts** (`#toast` à `bottom:112px`) pour qu'ils ne recouvrent pas le widget (même coin bas-droite).
- **Fenêtre flottante projetable** (`noiseOpenWindow()`, async) : ouvre une fenêtre séparée déplaçable sur un 2e écran / vidéoprojecteur. **Deux mécanismes, dans l'ordre :**
  1. **Picture-in-Picture « document »** (`documentPictureInPicture.requestWindow`) si disponible (Chromium/Edge) → fenêtre **toujours au premier plan** (au-dessus des autres fenêtres/applis). C'est la seule manière fiable d'obtenir l'always-on-top depuis le web — `window.open` ne le permet pas.
  2. **Repli `window.open`** (popup `sonometre_classe`) si PiP indisponible (Firefox/Safari) → fenêtre déplaçable **mais pas toujours au-dessus**. Si bloquée → toast.
  - Le contenu est rempli par `_noiseFillWindow(win, thr)` (styles inline + IDs `npw-emoji` / `npw-fill` / `npw-thr` / `npw-num` / `npw-msg`, `body.alert` pour le flash) — partagé entre les deux mécanismes (`document.body.innerHTML` + `<style>` injecté, fonctionne sur l'`about:blank` de window.open comme sur le document PiP).
  - **3 contrôles dans la fenêtre** (`#npw-ctrl`, handlers attachés depuis la fenêtre principale via `addEventListener`) : **🔔/🔕 son** (`_noisePopupToggleSound` → bascule `_noiseSettings.soundOn` + persiste + sync la case de la modale réglages), **⊟ compact** (`_noisePopupToggleCompact` → strip horizontal minimal `body.compact` + `resizeTo(300,130)`), **⛶ agrandir** (`_noisePopupToggleMax` → remplit l'écran via `resizeTo(availWidth,availHeight)` + `moveTo`). État de taille dans `body.dataset.size` ('compact'|'normal'|'max'), helpers `_noisePopupSetSize` / `_noisePopupCurSize`.
  - ⚠️ **Le vrai plein écran (API Fullscreen / F11) n'est PAS autorisé dans une fenêtre Picture-in-Picture** (limite Chromium). D'où « ⛶ agrandir » par **redimensionnement** (remplit l'écran tout en restant au premier plan) plutôt que `requestFullscreen`. `resizeTo`/`moveTo` fonctionnent sur PiP comme sur window.open.
  - **L'analyse audio reste dans la fenêtre principale** ; `_noiseRenderMeters` pousse les mises à jour dans `_noise.popup.document` à chaque frame — il **toggle uniquement la classe `alert`** (pas `body.className =`, qui écraserait `.compact`). Re-clic sur 🪟 = `focus()`. Fermeture (`pagehide`) → `_noise.popup = null`. Remplace l'ancienne grande jauge plein écran (choix utilisateur). ⚠️ La boucle rAF de la fenêtre principale ralentit si celle-ci est **minimisée** ; en usage normal (app visible sur l'écran 1, fenêtre sur l'écran 2) elle tourne normalement.
- Bouton header : `.noise-on` (vert, actif) / `.noise-alert` (rouge pulsant, en alerte).

### Alerte sonore (`noisePlayAlert` + `_noiseBuildPattern`)
Sonneries générées localement aux oscillateurs Web Audio (aucun échantillon). `noisePlayAlert(isTest)` crée un **gain maître** = `volume/100` connecté à `destination`, puis délègue à **`_noiseBuildPattern(type, blip)`** qui programme la série de `blip(freq, start, dur, peak, type?)` du motif choisi et renvoie sa durée totale (sert à fermer l'`AudioContext` éphémère du bouton **▶ Tester**). Réutilise l'`AudioContext` live si présent.

**Catalogue (`_NOISE_SOUND_TYPES`) — 2 groupes dans le `<select>`** :
- **Sons classiques** : `bell` (cloche claire, ding-dong B5+E6 ×3 — défaut), `beep` (4 bips), `chime` (carillon descendant), `alarm` (sirène 2 tons, onde carrée), `digital` (bips numériques carrés), `gong` (fondamentale grave + quinte, triangle), `cuckoo` (tierce sol/mi ×3)
- **Jeux vidéo rétro** (couplet complet qui se résout, ondes carrées) : `pacman` (jingle d'intro ≈ 3 s), `mario` (phrase principale ≈ 5 s), `tetris` (Korobeiniki, phrase A — domaine public), plus **`retro-random`** (🎲 « Au hasard (jeu rétro) ») qui tire au sort un jeu rétro **à chaque déclenchement** via `_pickRetroType()` (pioche dans `_RETRO_GAME_TYPES = ['pacman','mario','tetris']`). Le minuteur a des versions plus longues distinctes.

**Catalogue propre au minuteur** : le minuteur a sa **liste restreinte** `_TIMER_SOUND_TYPES` (mêmes sons que le sonomètre aujourd'hui) ; `timerSetSoundType`/`_timerLoadSettings` valident contre elle, et `_resolveTimerSoundType(t)` convertit `retro-random` en un jeu concret (pool `_TIMER_RETRO_TYPES`). Le mécanisme permet d'exposer des sons différents par module.

> ⚠️ `_noiseBuildPattern` contient en plus des **cas inutilisés / non sélectionnables** (`mario-1up`, `ff-victory`, `zelda-theme`, `dbz`, `saint-seiya`, `one-piece`, `naruto`, `anime-random`) : des transcriptions de morceaux (Final Fantasy, Zelda, génériques d'animés — dont une polyphonie chiptune dérivée d'un MIDI) **retirées des menus**. Code mort conservé pour réintégration éventuelle, mais absent de `_NOISE_SOUND_TYPES` / `_TIMER_SOUND_TYPES` et des `<select>`.

**Bascule + arrêt du son** : `noisePlayAlert(isTest)` mémorise le son en cours dans `_noise.curSound = { ctx, master, oscs, temp, closeTimer }`. Un second clic sur **▶ Tester** appelle `_noiseStopSound()` (ramp master → 0 + `osc.stop()` ; ferme le ctx seulement si `temp`, jamais le ctx live de l'analyseur). `_noiseStopSound()` est aussi appelé à la **fermeture de la fenêtre flottante** (handlers `pagehide` PiP + window.open), à la **fermeture des réglages** (`_modalReturnTo['mnoise']`) et dans `stopNoiseMeter()` — couper le son n'arrête jamais l'analyse micro.

**Calibrage saturation** : les pics par `blip` sont réglés pour qu'à **volume 100 %** le motif frôle 0 dBFS (limite de saturation, pics mesurés ~0.8–0.92 en rendu offline), sans clipping > 1.0 ; le gain maître met tout à l'échelle linéairement (volume 0 → silence, pas de son généré). Les ondes carrées/triangle utilisent des pics un peu plus bas que les sinus (plus d'énergie harmonique).

**Helpers d'écriture des motifs** : table `_NOTE_HZ` (nom de note → fréquence, La4=440) + `seq([[freq|nom, dur], …], peak, wave)` interne à `_noiseBuildPattern` (joue chaque note staccato à 90 % du créneau ; `0`/`''` = silence). Les motifs simples appellent `blip` directement.

### Réglages (modale `mnoise`, `openNoiseSettings()`)
Plancher de silence (calibration + curseur −80..−25, cf. ci-dessus) · curseurs seuil (10–100) · durée (1–10 s) · temporisation (5–60 s) + son on/off + **type (menu groupé)** + **volume (0–100)** + test. Changer le type **ou** bouger le curseur de volume **rejoue un aperçu** (`onchange="… noisePlayAlert(true)"`). « Niveau actuel » mis à jour en direct par `_noiseRenderMeters` quand la modale est ouverte. Persistance `localStorage.planClasse_noiseSettings` (`_noiseLoadSettings` au chargement du script, `_noiseSaveSettings` à chaque modif). Défauts `NOISE_DEFAULTS = { threshold:60, sustainS:3, cooldownS:15, soundOn:true, soundType:'bell', volume:70, silenceDb:-60 }`. `_noiseLoadSettings` **normalise** `soundType` : une valeur devenue invalide (son retiré depuis) retombe sur `'bell'`. `noiseSetVolume(v)` clampe 0–100 ; `noiseSetSoundType(t)` valide contre `_NOISE_SOUND_TYPES`.

### État & cycle de vie
État runtime dans `_noise` (active, starting, popup, ctx, analyser, source, stream, buf, raf, smooth, overSince, lastAlert, alerting, alertClearTimer). `_noise.starting` garde-fou contre un double-clic pendant la demande d'autorisation micro. `stopNoiseMeter()` coupe le flux (`stream.getTracks().stop()`), ferme le ctx, **ferme la popup** si ouverte, cache le widget, reset le bouton. Un `beforeunload` ferme aussi la popup (elle ne serait plus pilotée après un reload). La surveillance **ne survit pas à un reload** (getUserMedia exige un geste utilisateur) ; seuls les réglages persistent. La boucle rAF se met en pause quand la fenêtre principale est en arrière-plan/minimisée (acceptable : l'app est la fenêtre active en classe).

## ⏲ Minuteur — compte à rebours

Bouton **⏲** dans le header (à gauche du sonomètre, id `#btn-timer`, `openTimerSettings()`) — accessible sur tous les onglets. Réutilise le moteur de sonneries rétro du sonomètre (`_noiseBuildPattern`, `_NOTE_HZ`, `_NOISE_SOUND_TYPES`) **et** la synthèse vocale du navigateur. Module JS situé juste après le module sonomètre (avant les raccourcis clavier).

### État & réglages
- `TIMER_DEFAULTS = { soundOn:true, soundType:'mario', volume:80, speechOn:false, announces:[600,300,60], lastDurationS:600 }`. Persisté dans `localStorage.planClasse_timerSettings` (`_timerLoadSettings`/`_timerSaveSettings`). `_timerLoadSettings` normalise `soundType` (repli `'mario'`) et `announces` (entiers > 0, triés desc).
- `_timer` (état runtime éphémère, **ne survit pas à un reload**) : `running, paused, finished, endTime, remainingMs, totalMs, interval, finalTimer, finalCtx, previewCtx, popup, announced (Set)`.
- Le décompte est basé sur l'**horloge murale** (`endTime = Date.now() + totalMs`) via `setInterval(_timerTick, 250)` — robuste au throttling d'arrière-plan. Pause : stocke `remainingMs`, clear l'interval ; reprise : recalcule `endTime`.

### Réglages (modale `mtimer`, `openTimerSettings()`)
- **Durées prédéfinies** : 11 boutons 5→55 min (`timerSetDurationPreset(min)` ferme la modale + démarre aussitôt).
- **Durée libre** : inputs `#timer-min` / `#timer-sec` + bouton ▶ Démarrer (`timerStartFromInputs()`).
- **Annonce vocale** : checkbox `#timer-speech-on` + checkboxes des moments (`#timer-announce-opts`, valeurs en secondes 900/600/300/180/120/60/30/10, `timerToggleAnnounce(secs, on)`). Bouton « Tester la voix » (`_timerSpeak`). Avertissement si `speechSynthesis` indisponible.
- **Sonnerie de fin** : checkbox `#timer-sound-on` + `<select>` type (même catalogue groupé que le sonomètre) + ▶ Tester + volume. Le `<select>` et le volume rejouent un **aperçu court** (`_timerPlaySound`) ; ▶ Tester joue/coupe la sonnerie de fin **réelle** (`_timerTestSound`, bascule).
- Fermer les réglages (`_modalReturnTo['mtimer']`) coupe tout aperçu/test/voix en cours.

### Annonces vocales (`_timerSpeak`, `_timerAnnounceText`)
À chaque tick, pour chaque point `p` de `announces`, si `restant ≤ p` et `!announced.has(p)` → marque + `_timerSpeak('Il reste X minutes/secondes')` (si `speechOn`). Au démarrage, les points `≥ durée` sont **pré-amorcés** dans `announced` (pas de « il reste 10 min » sur un minuteur de 10 min). À la fin : `_timerSpeak('Temps écoulé')`. Voix `fr-FR`, `speechSynthesis.cancel()` avant chaque énoncé.

### Sonnerie de fin (`_timerPlayFinal`)
- **Thèmes** (`_TIMER_THEME_TYPES = ['pacman','mario','tetris']`) → **mélodie longue complétée jouée une seule fois** (`_timerBuildExtendedTheme(type, blip)`, ≈ 10 s pour mario/tetris, ≈ 4,5 s pour pacman) — distincte des couplets plus courts du sonomètre. **On ne répète pas** un fragment.
- **Sons non-thématiques** → motif court de `_noiseBuildPattern` répété pour couvrir ≈ **6 s**.
- L'`AudioContext` est mémorisé dans `_timer.finalCtx` → `_timerStopFinalSound()` le ferme pour **couper le son** (fermeture de la fenêtre via `_timerOnPopupClosed`, ✕ via `timerStop`/`_timerStopInternals`). `_timerPlayFinal` coupe une sonnerie précédente avant d'en lancer une nouvelle.
- `_timerMakeBlip(ctx, master, t0, off)` : fabrique un `blip` décalé de `off` (permet de séquencer les répétitions des sons non-thématiques).

### Tiers-temps — second décompte (v2.47.0)

Pendant une évaluation, deux échéances : celle de la classe, puis celle des élèves qui ont un tiers-temps. Le bouton **+⅓** (widget, fenêtre flottante, et case dans les réglages) affiche un **second décompte** allongé d'un tiers, à côté du premier.

- **Réglage persisté** `_timerSettings.ttOn` (défaut `false`), armable avant le départ ou **en cours de route**.
- ⚠️ **Le second décompte n'a PAS d'échéance propre** : `_timerTtRemainingMs()` se dérive de `endTime` (`+ totalMs/3`). La pause décale `endTime`, donc les deux restent synchronisés sans code supplémentaire — un second `endTime` aurait dû être décalé à la main à chaque pause.
- **Deux sonneries** : `_timerFinish()` sonne pour la classe puis, si `ttOn`, **ne coupe pas l'intervalle** (`_timer.mainDone`) ; `_timerFinishTt()` sonne à la fin du tiers-temps. ⚠️ Ce dernier vide l'intervalle **à la main** plutôt que par `_timerStopInternals()`, qui couperait au passage la sonnerie du temps principal si elle jouait encore.
- ⚠️ **Le tiers-temps n'est JAMAIS écrit plus petit que le temps de la classe.** Première version fautive, corrigée sur retour de l'utilisateur : *« les élèves qui ont besoin d'un tiers-temps sont aussi ceux qui ont besoin d'avoir des choses écrites plus grandes »*. Or ce décompte-là est précisément celui qu'ils lisent. Les deux sont donc à la **même taille** tant que la classe compose ; quand le tiers-temps est affiché, les deux rétrécissent d'autant, **jamais lui seul**. Une fois le temps commun écoulé (`mainDone`), c'est le principal qui s'efface — il est figé à 00:00 — et le tiers-temps qui prend toute la place.
- **La taille est bornée en `vw` autant qu'en `vh`** : sur un vidéoprojecteur large, c'est la largeur qui contraint, et des chiffres dimensionnés en `vh` seul débordent de l'écran. Mesuré à `min(30vh, 17vw)` : **324 px par chiffre en 1920×1080 avec les deux décomptes**, soit exactement la taille d'un décompte seul — la place verticale libre absorbe la seconde ligne, afficher le tiers-temps ne coûte donc rien en lisibilité sur un 16:9. Vérifié sans débordement sur 9 géométries, du 1920×1080 au 380×280.
- Les deux valeurs sont dans une **grille étiquette | valeur** (`#tpw-times`), étiquettes « Classe » et « Tiers-temps » écrites en toutes lettres — plus lisible qu'un `+⅓` pour des élèves à qui la fenêtre est projetée. L'étiquette de la classe est masquée quand le tiers-temps n'est pas affiché (`body:not(.tt-on) .tpw-lbl`), il n'y a alors rien à distinguer.
- ⚠️ **Désarmer pendant que le tiers-temps court termine le minuteur sur-le-champ**, sans seconde sonnerie. Sans ce cas (dans `timerSetTtOn`, dont `timerToggleTt` n'est qu'une enveloppe), il continuait de tourner sans rien afficher puis sonnait à l'heure d'un tiers-temps annulé.
- Les **annonces vocales** s'arrêtent à la fin du temps principal : elles décrivent l'épreuve commune. La voix dit « Temps écoulé. Tiers-temps en cours. » puis « Fin du tiers-temps ».

### Surfaces d'affichage
- **Widget replié** (`#timer-widget`, bas-droite, z 986 ; ⚠️ largeur `max-content` bornée à 200 px mini — figée à 200 px, les 6 boutons d'en-tête débordaient de 25 px et le ✕ sortait du cadre, v2.63.2 ; la barre d'actions en lot de l'onglet Élèves se décale de 286 px pour lui) : titre déplaçable (`_timerInitWidgetDrag`, glisser par `.tw-head`), grand chiffre `MM:SS` (ou `H:MM:SS`) **cliquable = pause/reprise** (`timerTogglePause`, pas de bouton pause dédié), barre de progression, état (« En cours » / « ⏸ En pause » / « ⏰ Terminé ! »). Boutons : 🗣 voix · 🔔 son · ⚙ réglages · 🪟 fenêtre flottante · ✕.
- **Fenêtre flottante** (`timerOpenWindow`, `_timerFillWindow`) : Picture-in-Picture prioritaire (toujours au premier plan, Chromium/Edge) ; repli `window.open` sinon ; le widget reste comme secours. Ouverte automatiquement au démarrage (geste utilisateur actif). Contrôles dans la fenêtre (`#tpw-ctrl`) : 🗣 · 🔔 · ⚙ (focus fenêtre principale + `openTimerSettings`) · ⛶ (remplir l'écran via `resizeTo`) · ✕. **Clic n'importe où dans la fenêtre (hors `#tpw-ctrl`) = pause/reprise**. L'analyse/le décompte tournent dans la fenêtre principale ; `_timerRender` pousse les mises à jour vers le document de la fenêtre à chaque tick.
- **Bascules synchronisées** sur les 3 surfaces via `_timerSyncToggleUI()` (widget, modale, popup). `soundOn`/`speechOn` sont les réglages persistés ; les boutons les togglent directement.
- Bouton header : `.timer-on` (bleu, en cours) / `.timer-alert` (rouge pulsant, terminé).

### Cycle de vie
`timerStart(totalSec)` → reset interne, calcule `endTime`, pré-amorce les annonces, affiche le widget (`body.timer-widget-on` remonte les toasts), ouvre la fenêtre flottante, lance l'interval. `timerStop()` → tout couper (interval, son, popup, voix), cacher le widget. `_timerFinish()` → stoppe l'interval, marque `finished`, voix « Temps écoulé », sonnerie de fin. Un `beforeunload` ferme la popup. Fermer **uniquement** la fenêtre flottante (`_timerOnPopupClosed`) coupe son + voix mais **laisse le décompte continuer** dans le widget.

## 📓 Journal de séance (v2.141.0, prototype)

Demande de l'utilisateur (2026-10-10) : en **Devoirs faits** (classe recomposée), une remarque par élève et par séance, **sans évaluation**. Il utilisait un devoir de type C sans points par séance, avec la remarque du devoir — ce qui ajoutait une colonne vide par séance au Bilan des notes et ne permettait pas de relire les remarques ensemble.
- **Modèle** : `cls.journal = [{ id, date, slot, titre, notes: { sid: texte } }]`, **dans la classe** (toute classe, pas seulement les recomposées) : supprimé avec elle, vidé en fin d'année avec les classes, suivi au renommage d'une recomposée comme `classMessages`. Nettoyé dans `postLoadHook` (bloc par classe), purgé par `_purgeStudentRefs` (et couvert par `purge-coverage.test.js`). Aucune incidence sur les moyennes, les bilans, les colonnes.
- **Fenêtre `mjournal`** (`openJournal(clsId?, sessId?)`, état `_jrn`) : bouton **📓 Journal** de l'onglet Élèves (groupe Suivi). Séances à gauche (« ＋ Séance d'aujourd'hui » = date du jour + créneau en cours de la salle affichée ; reprend la séance existante si elle y est), à droite date, créneau (emploi du temps du jour), sujet, puis **une case par élève** présent à la date (membres de la recomposée pour la période ; 🚫 si absent à un appel de ce jour). Saisie au fil de la frappe (`_evalArmUndo`, enregistrement différé `_jrnSaveTimer`, vidé à la fermeture). Dans `_MODAL_RERENDER`.
- **Pas de reprise automatique des anciens devoirs-séances** : proposée puis retirée à la demande de l'utilisateur (trop peu de devoirs, recopie à la main plus simple — « ne pas alourdir avec des fonctions peu utiles »).
- **Fiche élève** : encadré **« 📓 Noté pendant la période »** (`_rwJournalBlock`) au-dessus de la remarque du bulletin : remarques du journal **et** remarques des devoirs de la période (discipline de la fiche), par date ; **clic sur une ligne = ajoutée à la remarque du bulletin** de la période correspondante (`_rwJrnInsert`). Affiché seulement s'il y a quelque chose (ou un journal) ; 📓 ouvre le journal en parenthèse (`_rwParenthesis`).
- Aussi dans l'onglet **Plan**, groupe Séance (📓 Journal, v2.142.0).
- ⚠️ **Classe sans devoir sur la période** (v2.142.0, signalé par l'utilisateur après avoir supprimé ses devoirs-séances : « je ne peux plus saisir de remarques ») : `_bilanSidsFor` ne gardait que les élèves présents à au moins un devoir de la période — donc **personne**, pour le Bilan, la fiche (navigation) et l'envoi « MBN · Bulletin » ; et le Bilan des notes s'arrêtait sur « Aucune évaluation ». Désormais, sans aucun devoir de la classe sur la période, `_bilanSidsFor` prend les élèves présents au début ou à la fin de la période (membres de la recomposée pour la période), et le Bilan des notes passe en **mode « remarques seules »** (`_bilanRemarksOnlyHTML` : une case de remarque par élève et par période, même saisie que le tableau complet, puis remarque de classe et éléments travaillés ; le nom ouvre la fiche, où se relit le journal). Dans une classe recomposée, les devoirs des classes d'origine apparaissent en « ⤴ Évals d'autres classes » : les masquer avec ce bouton ramène aussi à ce mode.
- Non fait (à discuter) : impression du journal, journal multi-classes.

## Fenêtres de la vie de classe — refonte v2.132.0 (maquette validée le 2026-10-08)

Dix-sept fenêtres, quatre regroupements arbitrés par l'utilisateur. CSS dans le bloc « Groupe 3 — fenêtres de la vie de classe » (avant « Import d'élèves »). Helper **`_stuAvatarFill(elId, sid, still)`** : photo ou initiales dans une pastille `.rem-av` (en-têtes de Retard, Informations, Place, Tablette).
- **⏰ Retard** (`mlate`) : en-tête élève (classe, créneau), heure d'arrivée, « N min après le début du cours » et boutons **Maintenant / +5 / +10 / +15 / +20 min** (depuis le début du créneau : `_lateFindSlot` — créneau de l'appel modifié en contexte `'rec'`, sinon créneau en cours de la salle affichée ; `_lateInfo`).
- **📌 Enregistrer l'appel** (`msaveatt`) : bandeau Présents / Absents / Retards (élèves présents à la date, du groupe choisi), date en champ + Aujourd'hui / Hier, créneaux en pastilles (`_selPillsApply` sur `#msaveatt-slot`, « Hors créneau » en dernier), **groupe modifiable** (`_saveAttSetGrp`), libellé automatique affiché (« modifier » le rend éditable, `dataset.manual`). ⚠️ **La fenêtre « Appel(s) déjà sur ce créneau » (`mattConflict`) et la confirmation d'écrasement ont été SUPPRIMÉES** : `_saveAttRender` affiche les conflits DANS la fenêtre (`.sa-warn`) — même classe = le bouton devient « ⚠️ Remplacer l'appel » et l'enregistrement remplace directement ; autres classes = avertissement + « Voir ces appels » (`_saveAttViewOthers`). Couleurs écrites en dur (`#999`, `#fafafa`, `#e5e5e5`) remplacées par des tokens.
- **🖼 Plan de l'appel** (`mattPlan`) : la liste des absents / retards (`_attDetailBodyHTML`, sur les COPIES en cours de modification, absents non placés marqués) est **dans la colonne de droite** (`#mattPlan-side`, `.mp-wrap`) avec « ⧉ Copier la liste ». ⚠️ **La fenêtre « Liste » (`mattDet`) et `viewAttendance` / `attDetPrev` / `attDetNext` / `switchMattPlanToDet` ont été supprimés** ; l'encart « Absents non placés » sous le plan aussi (doublon).
- **📋 Informations** (`mnotes`) : en-tête élève (classe, groupe, aménagements), ◀ ▶ dans la classe (`_mnOrder` : classe affichée si l'élève en fait partie, triée par nom), puces « Commencer une ligne » (Santé, Famille, Placement, Matériel — `_mnPrefix`), **enregistrement au fil de la frappe** (`_mnInput` : `_evalArmUndo`, `stu.notes` aussitôt, `save` + redessin débouncés par `_mnFlush`). Plus de bouton Enregistrer (`saveCtxNotes` n'est plus qu'un `_mnFlush` + fermeture).
- **📍 Place de l'élève** (`mseatpick`) : en-tête élève, salles en sélecteur `.ip-seg`, allées hachurées comme sur le Plan (`.spk-nt`), ce que fera le clic affiché en pied au survol (`data-tip`).
- **🏷 Tags d'une sélection** (`mtagbulk`) : une pastille par tag avec le compte (« DF · 2/5 ») ; clic = tous → personne → état de départ (`_mtagBulkCycle`, état `_mtagBulkWant`) ; résumé des changements ; pastille modifiée cerclée. Les élèves de la sélection en tête.
- **🏫 Salles** : ⚠️ **« Ajouter une salle à la classe » (`madds`) a été fondue dans `msalle`** : salles du catalogue à gauche (cartes `.sw-card` avec mini-plan `_salleMiniHTML`, dimensions, tables, classes qui l'utilisent — clic = choisir, double-clic = ajouter), nouvelle salle à droite (nom, rangées, colonnes, aperçu, « Partir de » en pastilles sur le `<select id="nsl-dup">` caché). `openAddSalleToClass()` = `openNewSalleModal(true)` ; depuis Config Salle, `openNewSalleModal()` masque la colonne de gauche. Bouton unique `_nsGo` (« Ajouter X » ou « Créer Y »).
- **🗂 Ordres de ramassage** : ⚠️ **`mcollect-edit` a été fondue dans `mcollect`** : liste à gauche, l'ordre choisi modifié à droite (`_collectEditRender`) ; **enregistrement au fil de l'eau** (`_collectCommit`, `_collectRename` : `_evalArmUndo` + `save`), plus de bouton Enregistrer ; remplissages **Serpentin / Rangée par rangée / Colonne par colonne / Effacer** (`_collectFill`, ⚠️ **comptés depuis le tableau** — rangée 0, en bas du plan en vue prof — en commençant à gauche du plan, allées sautées ; v2.132.1, correction de l'utilisateur : « on compte à partir du tableau, à partir du bureau » — la v2.132.0 partait du fond) ; numérotation au glisser en **Pointer Events** (souris, doigt, stylet : `touch-action:none` sur la grille, `elementFromPoint`).
- **📱 Tablettes** : choix d'une tablette (`mipad-picker`) en **grille de numéros par lot** (`.ipk-t` : libre, avec prénom = échanger, actuelle, hors service barrée) ; « Pas assez de tablettes » (`mipovf`) au **gabarit de l'aperçu d'Affecter automatiquement** (`.shf-plan.am-plan`, `.ov-c`, `.ov-gh`) avec compteur en barre `.ovf-bar` (couleurs en dur `#1e40af`, `#d6eaf8`, `#fafafa`… remplacées) ; Désaffecter en trois cartes chiffrées (`.clr-card`, détail par mode, par chariot, par salle) ; Nouvelle classe mobile : départ en pastilles, **nombre de tablettes** (`#mpool-new-count`, lots de la copie ramenés à ce nombre), aperçu des étiquettes (`_mpoolNewPreview`).
- **🖨 Impression** : Plusieurs plans (`mpac`) en pastilles groupées par niveau (« tout le niveau », recomposées en dernier), Couleurs / Noir et blanc, nombre de pages (`_pacSum`) ; **le plan ne tient pas sur une page** (`mPrintChoice`) : trois cartes dessinées en CSS aux couleurs du thème (le SVG à couleurs figées a disparu), bouton Imprimer, case **« Ne plus demander pour <salle> »** — choix retenu **sur cette machine** (`planClasse_printFormatBySalle`, l'imprimante A3 dépend du poste), appliqué par `_doPrintWithOverflowCheck(…, roomId)` quand un seul plan déborde ; oublié par « Redemander » dans ⚙ Réglages (ligne « Grands plans », `#set-printfmt`, `_printFmtForget`).
- Audit : 0 écart en clair et en sombre sur 17 états (731 nœuds mesurés) — trois écarts trouvés en sombre puis corrigés (numéro de la place actuelle, « vide » sur une table cochée) ; 363 px à 375, sans débordement.

## 🔒 Mode confidentiel (montrer l'écran à un parent)

Bouton **🔒** dans le header (`#btn-conf`, `toggleConfMode()`), à gauche du minuteur. Masque sur **Élèves, Plan (Prof), Devoirs (tableurs de saisie), Bilan des notes, Bilan des compétences** tout ce qui relève de la vie scolaire — oublis, travail non fait, absences/retards, aménagements, groupe, tags, notes, niveaux de compétence, remarques, mentions de conseil, rappels — **sauf pour l'élève révélé**. Arbitrages de l'utilisateur (2026-09-25) : on révèle un élève en **cliquant sur son nom** (ou via le sélecteur du bandeau) ; les **noms** des autres restent visibles ; les **statistiques de classe** (pieds de tableaux, remarque de classe) restent toutes visibles ; le mode est **persisté** (`localStorage.planClasse_confMode = {on, sid}`) pour qu'un F5 devant le parent ne réaffiche rien.

- **État** `_conf = { on, sid }` (var, lu pendant `init()`). `_confHides(sid)` · `_confNameClick(sid)` (en mode : révèle l'élève, ou le **désélectionne si on clique à nouveau sur l'élève déjà affiché** — tout redevient masqué —, et renvoie `true` → l'appelant n'exécute pas son action habituelle ; hors mode → `false` → fiche / historique comme d'habitude). Motif utilisateur : recevoir un parent sans savoir encore de qui il est le parent. Sur le plan, la case de l'élève affiché porte le même clic (hors boutons internes et hors mode appel) · `_confReveal(sid)` · `_confRefresh()`.
- **Tableaux : masquage 100 % CSS**, généré par `_confUpdateStyle()` dans `<style id="conf-dyn-style">` : `tr[data-sid]:not([data-sid="<révélé>"]) > td:not(:first-child):not(.conf-keep)` → fond hachuré neutre, texte transparent, enfants `visibility:hidden`, `pointer-events:none` (coupe aussi les infobulles, qui portent de l'information). Aucune reconstruction au changement d'élève. ⚠️ **Contrat pour tout nouveau tableau par élève** : lignes `tr[data-sid]`, **1re cellule = le nom** (restée visible, `onclick="_confNameClick(sid)||…"`), cellules non confidentielles marquées `.conf-keep` (ex. la Position dans Élèves). Les pieds de tableau n'ont pas de `data-sid` : ils restent visibles, c'est voulu. Le Bilan des compétences n'avait pas de `data-sid` sur ses lignes : ajouté.
- **Plan : rendu dépouillé**, pas masqué — couleurs de groupe/tag/genre, badges, compteurs, état d'appel, alertes de contrainte, surlignage d'aménagement sont posés en classes et en contenu, un masque CSS en laisserait fuiter. `buildCell` renvoie `_confBuildHiddenCell` (place, nom, tablette, 🔒) ; clic ou clic droit = révéler ; pas de glisser. Liste des non placés : badges masqués par CSS, clic = révéler. Bandeau 📣 messages à la classe caché (un message peut nommer un élève).
- **Bandeau `#conf-banner`** (dans `#topbar`, tokens `--notice-*`), affiché seulement sur les 5 onglets concernés via `:has(#tab-….on)` : sélecteur de l'élève révélé (`_confRenderBanner`, rafraîchi par `showTab` et `switchClass`) + « 🔓 Quitter ».
- `init()` pose le style et `body.conf-on` **avant le premier rendu**.
- **Onglet Élèves** : le **texte du nom ouvre TOUJOURS la fiche complète**, même en mode confidentiel (`_confOpenFiche` : l'élève devient l'élève affiché, puis `openFiche`) ; le **reste de la cellule du nom** porte le clic afficher / masquer (`<td onclick="_confNameClick(…)">`). En mode, `onEleveRowMouseDown` ne démarre pas de sélection dans cette cellule.
  - ⚠️ **Régression corrigée (v2.61.1)** : `onEleveRowMouseDown` ignore les clics sur `[onclick]` ; le `onclick` posé sur la cellule du nom y faisait avorter TOUTE sélection partant de la 1re colonne, **même hors mode**. D'où `[onclick]:not(td)`. Tout `onclick` ajouté sur une cellule d'une ligne sélectionnable doit tenir compte de ce test.
- **Bouton 🔒 CLIGNOTANT** quand le mode est actif (demande de l'utilisateur : l'affichage inhabituel doit sauter aux yeux), `@keyframes confBlink`, ~0,9 Hz. ⚠️ Le rouge est une **ombre intérieure** (`box-shadow: inset 0 0 0 40px …`), pas un `background` : la règle du design system `.hdr-btn { background: var(--paper) !important; border: … !important }` gagne sur toute animation — une déclaration `!important` bat les keyframes. Même piège pour toute future pastille animée du header.
- **Vue d'ensemble** (`moverview`, bouton 📊 de l'onglet Élèves, tous les élèves de toutes les classes) : masquée comme les tableaux (lignes `tr[data-sid]` ; la 1re cellule est la CLASSE, le nom est marqué `.conf-keep` et porte le clic afficher / masquer). ⚠️ En mode, les **filtres « Min. 🚫/⏰ » et les tris par compteur sont ignorés** (tri classe puis nom) : la présence d'un élève dans une liste filtrée, ou son rang dans un tri par absences, trahirait ce qu'on masque. `_confRefresh` la re-rend si elle est ouverte.
- **Appels passés** : la liste (`matt`) ne montre que des comptes par séance, elle reste telle quelle. Le **détail** (déplié dans la liste, et la colonne de droite du plan de l'appel) ne nomme que l'élève affiché — les autres absents/retards deviennent une ligne « 🔒 N autres élèves — noms masqués » (`_confMaskedLi`), les nombres de la séance restent ; « 📋 Copier la liste » est bloqué. Le **plan de l'appel** (`mattPlan`) n'affiche l'état absent/retard que pour l'élève affiché, et la liste des absents non placés est filtrée de même.
- **Stats par élève** (`mattStats`) : masquées comme la Vue d'ensemble (`tr[data-sid]`, nom `.conf-keep` cliquable) ; « 0/0 masqués » et tris par compteur ignorés ; export CSV bloqué.
- `_confRefresh` re-rend `moverview`, `mattStats` et `mattPlan` s'ils sont ouverts.
- Hors périmètre (non masqué) : Vue Élève (n'affiche que des prénoms), modales centrées sur UN élève ouvertes explicitement (fiche, historique), projection d'un bilan, exports et impressions (hors les deux blocages ci-dessus).
- **Activation** : l'élève affiché est d'emblée celui dont on s'occupe (`_confCurrentFocusSid` : fiche ouverte, ou rendez-vous sélectionné dans « Ce soir » de la réunion parents-professeurs) ; la sélection d'un rendez-vous le change ensuite (`_reuFocusStudent`). La fiche détachée suit le mode (événement `storage` sur `CONF_LS_KEY`) et l'élève affiché (`_confReveal` → `_ficheWinPush`).

## 🚨 Listes d'évacuation (modale `mevac`, v2.144.0)

Demande de l'utilisateur : une liste par classe pour faire l'appel en cas d'évacuation. Entrée **« 🚨 Listes d'évacuation… »** dans le menu 🖨 ▾ du Plan **et** de la Vue Élève (copies, cf. convention), et dans ⋯ Plus de l'onglet Élèves (`openEvacPrint`).
- ⚠️ **Imprimée À L'AVANCE, rien de pré-rempli** (arbitrage : « une évacuation, on évacue ; on ne connaît pas les absents à l'avance ») — pas d'appel du jour reporté.
- Fenêtre : classes en pastilles par niveau (`_evacSel`), classes réelles cochées, recomposées décochées ; interrupteur **« une page par groupe »** (`#evac-groups`, retenu dans `planClasse_evacGroups`, actif par défaut) — une page classe entière + une par groupe présent (`_evacGroups`).
- Page (`_evacPageHTML(cls, g, first)`, A4 portrait, marges 10 mm, couleurs littérales) : en-tête « 🚨 Évacuation — classe · groupe », nombre à appeler ; lignes Date / Heure / Salle / Professeur à remplir ; tableau N° · Élève (NOM Prénom, ordre alphabétique) · Gr. · **☐ Absent au cours** · **☐ Manquant après évacuation** · Observations ; élèves **ULIS / UPE2A hors inclusion grisés « … hors inclusion — ne pas appeler »**, sans numéro ni case, non comptés (`_evacOut`) ; élèves présents aujourd'hui seulement (`_stuActiveOn` ; membres de la période en cours pour une recomposée — `_evacStudents`) ; **AESH** en fin de liste (sur une page de groupe : celles qui accompagnent un élève du groupe) ; pied à remplir : à appeler, absents au cours, présents au rassemblement, manquants, signature (la ligne « manquants signalés à … à … h » a été retirée en v2.144.1, jugée de trop). Hauteur de ligne adaptée au nombre (5,4 à 8 mm) : mesuré ≤ 263 mm pour 36 élèves (place utile 277 mm).
- Un chemin d'impression de plus pour l'audit (écrit dans `#pa`, `document.title` = « Liste(s) d'évacuation … »).

## Mode appel — colonne de droite dépliée (v2.126.0)
À l'activation du mode appel, la colonne de droite (non placés, **absents et retards par ordre alphabétique**) est **dépliée** (`planClasse_attSideCollapsed = '0'` dans `toggleAppelMode`) : c'est la liste à reporter. On peut toujours la replier ensuite par sa barre.
