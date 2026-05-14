# 🙏 Crédits & remerciements

Plan de Classe est une PWA libre faite par un enseignant pour des enseignants. Plusieurs parties s'appuient sur des travaux existants, et ce projet n'existerait pas sans eux.

---

## 🎯 QCMcam — Sébastien COGEZ

**Site** : <https://qcmcam.net>

QCMcam est un outil libre et gratuit de QCM en classe : les élèves répondent en levant une carte papier munie d'un marqueur ArUco que le professeur scanne avec la webcam ou un smartphone. Aucun équipement par élève.

L'onglet **📷 QCMCam** de Plan de Classe s'appuie entièrement sur ce travail :

- **Export CSV** au format directement importable dans qcmcam.net (identifiants `classe-salle`, numérotation des places compatible avec la limite ArUco 4×4 de 125 marqueurs).
- **Génération locale des marqueurs ArUco** d'une salle (algorithme et mapping des 125 patterns 4×4) — réimplémentation en JavaScript du `markers4x4.js` de qcmcam.net, sous licence CC BY-NC-SA 4.0.
- **Impression du plan QCMCam** avec les numéros visibles sur chaque place (vue prof, sans noms), pratique à coller au bureau du prof ou à afficher au tableau.

> **Licence des composants ArUco** : [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) — utilisation pédagogique non commerciale autorisée, mention de l'auteur conservée, dérivés sous même licence.
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
