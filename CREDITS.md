# 🙏 Crédits & remerciements

Plan de Classe est une PWA libre faite par un enseignant pour des enseignants. Plusieurs parties s'appuient sur des travaux existants, et ce projet n'existerait pas sans eux.

---

## 🎯 QCMcam — Sébastien COGEZ

**Site** : <https://q2.qcmcam.net/>

QCMcam est un outil libre et gratuit de QCM en classe : les élèves répondent en levant une carte papier munie d'un marqueur ArUco que le professeur scanne avec la webcam ou un smartphone. Aucun équipement par élève.

L'onglet **📷 QCMCam** de Plan de Classe s'appuie entièrement sur ce travail :

- **Export CSV** au format directement importable dans QCMcam (identifiants `classe-salle`, en-tête reconnu automatiquement par l'assistant d'import, numérotation des places compatible avec la limite ArUco 4×4 de 157 marqueurs).
- **Import des résultats** (`Session-N-resultats.csv` de QCMcam 2, ou l'ancien `resultats.csv`) directement dans une évaluation.
- **Génération locale des marqueurs ArUco** d'une salle : le dictionnaire `QCMCAM_4X4_157h3` de **QCMcam 2** est repris tel quel, et le rendu est une réimplémentation JavaScript suivant la même convention, pour que les marqueurs imprimés soient reconnus par le scanner de QCMcam.
- **Impression du plan QCMCam** avec les numéros visibles sur chaque place (vue prof, sans noms), pratique à coller au bureau du prof ou à afficher au tableau.

> **Licence des composants ArUco** : le dépôt de [QCMcam 2](https://forge.apps.education.fr/qcmcam/qcmcam2) est publié sous [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) — redistribution libre, attribution conservée et modifications signalées.
> *(Jusqu'à la 2.38.0, l'app embarquait l'ancien dictionnaire de 125 motifs de qcmcam.net v1, sous CC BY-NC-SA 4.0 ; il a été retiré en 2.39.0.)*
>
> Détails dans [LICENSE](./LICENSE) — Part 2.

**Merci à Sébastien** pour cet outil simple, robuste et libre, qui rend possible une vraie pédagogie active sans budget matériel.

---

## 🤝 La communauté enseignante

Chaque fonctionnalité de cette app a été pensée, testée et ajustée au contact d'un usage réel en salle de classe (collège / cycle 4) — placement multi-salles, mode appel, gestion AESH, suivi des incidents, sync Nextcloud entre poste prof et machine perso, impressions adaptées.

Sans les retours patient·e·s et les remarques de terrain, l'app serait beaucoup moins juste.

---

## 📚 Composants techniques libres

- **PWA standards** (manifest.json, service-worker, IndexedDB, File System Access API, localStorage) — implémentations natives des navigateurs modernes Chromium / Firefox / Safari.
- **Polices d'écriture** embarquées en base64 dans le HTML (sous-set Latin) :
  - [Fraunces](https://fonts.google.com/specimen/Fraunces) — serif éditorial variable, sous SIL Open Font License
  - [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) — grotesque sous SIL Open Font License
  - [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — monospace sous SIL Open Font License

---

## ⚖️ Comment créditer cette app à votre tour ?

Plan de Classe est sous licence MIT pour son code et CC BY-NC-SA 4.0 pour ses composants ArUco. Si vous redistribuez tout ou partie :

- Code MIT → mention de l'auteur dans les sources, c'est tout.
- Composants ArUco → mention de **Sébastien COGEZ** + lien CC BY-NC-SA + non-commercial.
- Si vous bâtissez dessus pour votre établissement, on serait ravis d'avoir un retour sur le dépôt GitHub.

---

🏫 *Pour un retour, une suggestion ou un signalement* : <https://github.com/Belenos-Toutatis/plan-de-classe/issues>
