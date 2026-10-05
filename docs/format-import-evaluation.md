# Format d'import d'une évaluation — Plan de classe

Ce document décrit le fichier qui permet d'importer **la structure d'une évaluation** dans
l'application *Plan de classe*, pour deux types :

- **Type C** — sommative avec exercices : chaque question est notée **en points**, et peut
  évaluer des compétences.
- **Type D** — sommative par compétences : même découpage en exercices et questions, mais chaque
  question évalue **une ou plusieurs compétences par un niveau de maîtrise** (jamais des points).
  Un barème « niveau → points » convertit ensuite les niveaux en note.

Il est écrit pour être donné tel quel à une IA, avec le sujet d'une évaluation, afin qu'elle
produise le fichier.

---

## Consigne pour l'IA

> Tu reçois le sujet (ou le corrigé, ou le barème) d'une évaluation, et l'enseignant te dit
> s'il la veut en **Type C** (il note chaque question en points) ou en **Type D** (il évalue
> chaque compétence d'une question par un niveau de maîtrise). **Ne déduis pas le type du
> sujet** : un sujet avec des points convient aux deux types. Si l'enseignant ne l'a pas
> précisé, prends le Type C et écris dans `description` : « Type à confirmer (C par défaut) ».
>
> Produis **un seul objet JSON** conforme au format ci-dessous, et rien d'autre : pas de texte
> avant ni après, pas de commentaire dans le JSON. Reprends les exercices et les questions
> **dans l'ordre du sujet**.
>
> - **Type C** : donne à chaque question le nombre de points indiqué dans le sujet. S'il n'y en
>   a pas, propose un nombre raisonnable et signale-le dans son champ `description`.
> - **Type D** : donne à chaque question **au moins une compétence**, et reprends ses points
>   du sujet dans `points` : l'application les partage entre ses compétences. Si le sujet fixe
>   lui-même les points de chaque compétence dans la question, écris-les dans la compétence
>   (`{ "code": "C1", "points": 2 }`) au lieu de `points` de la question.
>
> N'invente pas de compétence : n'utilise que les codes que l'enseignant t'a donnés, ou ceux
> du référentiel par défaut listé plus bas.

---

## Exemple complet — Type C

```json
{
  "format": "plan-de-classe/evaluation",
  "version": 1,
  "type": "C",
  "nomCourt": "DS3",
  "nomLong": "Contrôle chapitre 4 — La lumière",
  "description": "Propagation rectiligne, vitesse de la lumière, année-lumière.",
  "noteMax": 20,
  "coef": 1,
  "competences": [
    { "code": "C1", "nom": "Mobiliser des connaissances", "domaine": "D4" },
    { "code": "C3", "nom": "Mobiliser des langages scientifiques", "domaine": "D1.3" }
  ],
  "exercices": [
    {
      "titre": "Ex1",
      "description": "Propagation de la lumière",
      "questions": [
        { "titre": "1a", "points": 1, "competences": ["C1"], "description": "Définir un milieu transparent" },
        { "titre": "1b", "points": 2, "competences": ["C1", "C3"] }
      ]
    },
    {
      "titre": "Ex2",
      "description": "Calcul d'une distance",
      "questions": [
        { "titre": "2a", "points": 3, "competences": ["C3"] },
        { "titre": "2b", "points": 1.5, "competences": [] }
      ]
    }
  ]
}
```

## Exemple complet — Type D

```json
{
  "format": "plan-de-classe/evaluation",
  "version": 1,
  "type": "D",
  "nomCourt": "DS4",
  "nomLong": "Contrôle chapitre 5 — Énergie",
  "noteMax": 20,
  "coef": 1,
  "bareme": [0, 1, 2, 3],
  "bilanParExercice": true,
  "exercices": [
    {
      "titre": "Ex1",
      "description": "Formes d'énergie",
      "questions": [
        { "titre": "1a", "points": 1, "competences": ["C1"] },
        { "titre": "1b", "competences": [{ "code": "C1", "points": 2 }, { "code": "C3", "points": 1 }], "description": "Chaîne énergétique" }
      ]
    },
    {
      "titre": "Ex2",
      "questions": [
        { "titre": "2a", "points": 3, "competences": ["C2", "C3"] }
      ]
    }
  ]
}
```

---

## Champs

### Racine

| Champ | Obligatoire | Type | Rôle |
|---|---|---|---|
| `format` | oui | texte | Toujours `"plan-de-classe/evaluation"`. |
| `version` | oui | nombre | Toujours `1`. |
| `type` | oui | texte | `"C"` ou `"D"`. Absent : `"C"`. |
| `nomCourt` | oui | texte, 20 caractères max | Nom affiché dans les en-têtes de colonnes (ex. `"DS3"`, `"IE2"`). |
| `nomLong` | non | texte, 80 caractères max | Titre complet de l'évaluation. |
| `description` | non | texte, 500 caractères max | Notes libres (affichées en infobulle). |
| `noteMax` | non | nombre > 0 | Note sur laquelle le total est ramené. **Défaut : 20.** Ce n'est pas la somme des points : un sujet sur 25 points peut être noté sur 20. |
| `bareme` | non, **Type D seulement** | liste de nombres ≥ 0 | Points rapportés par chaque niveau de maîtrise, du plus bas au plus haut. Ex. `[0, 1, 2, 3]` pour 4 niveaux. Doit avoir **autant de valeurs que de niveaux** réglés dans l'application (4 par défaut) ; sinon il est ignoré. Absent : le barème des Réglages de l'enseignant. |
| `bilanParExercice` | non, **Type D seulement** | vrai / faux | Affiche aussi, pour chaque exercice, le niveau atteint sur chaque compétence. Absent : réglage par défaut de l'enseignant. |
| `coef` | non | nombre ≥ 0 | Coefficient dans la moyenne de la période. **Défaut : 1.** |
| `competences` | non | liste | Description des compétences utilisées (voir plus bas). Sert seulement à **créer** celles que l'enseignant n'a pas encore. |
| `exercices` | oui | liste, au moins 1 | Les exercices, dans l'ordre du sujet. |

Ne sont **pas** dans le fichier, et se choisissent au moment de l'import : les classes, la date,
le créneau, la période et la discipline.

### Exercice

| Champ | Obligatoire | Type | Rôle |
|---|---|---|---|
| `titre` | oui | texte court, 20 caractères max | Code de l'exercice (ex. `"Ex1"`, `"A"`, `"Partie 1"`). |
| `description` | non | texte, 120 caractères max | Intitulé de l'exercice (infobulle). |
| `questions` | oui | liste, au moins 1 | Les questions de l'exercice, dans l'ordre. |

### Question

| Champ | Obligatoire | Type | Rôle |
|---|---|---|---|
| `titre` | oui | texte **très court**, 8 caractères conseillés (20 max) | Code de la question, affiché en tête de colonne (ex. `"1a"`, `"Q3"`, `"2.b"`). |
| `points` | **Type C : oui** · Type D : non | nombre > 0, au plus 100 | Type C : barème de la question. Type D : points du sujet, **partagés à parts égales** entre les compétences de la question pour en faire leurs poids (voir plus bas). Décimales acceptées (`0.5`, `1.5`). |
| `competences` | **Type D : oui, au moins une** · Type C : non | liste | Compétences évaluées par la question. Chaque élément est un code (`"C1"`) ou, en Type D, un objet `{ "code": "C1", "points": 2 }` quand le sujet fixe les points de chaque compétence (`"poids"` est accepté comme synonyme de `"points"`). En Type C, une liste vide ou absente veut dire que la question ne compte pour aucune compétence. |
| `description` | non | texte, 120 caractères max | Intitulé de la question (infobulle). |

### Poids d'une compétence (Type D)

Dans une question de Type D, chaque compétence rapporte les points de son niveau multipliés par
son **poids**. Un poids de 2 fait compter la compétence double ; il est propre à la question
(la même compétence peut peser 1 ici et 2 là) et doit être compris entre 0,5 et 20.

L'application calcule les poids à partir des points du sujet, dans cet ordre :

1. **Points donnés pour la compétence** (`{ "code": "C1", "points": 2 }`) : ils deviennent son
   poids. C'est le cas quand le sujet a lui-même décidé du nombre de points par compétence.
2. Sinon, **les points de la question sont partagés à parts égales** entre ses compétences qui
   n'ont pas de points propres (ce qui reste après celles qui en ont). Question 2a à 3 points
   avec C2 et C3 : poids 1,5 chacune.
3. Ni points de question, ni points de compétence : poids 1.

Seules les proportions comptent : la note est ensuite ramenée sur `noteMax`.

Exemple : barème `[0, 1, 2, 3]`, question 1b avec C1 (2 points) et C3 (1 point). Un élève au
niveau 3 en C1 et au niveau 2 en C3 obtient 2 × 2 + 1 × 1 = 5 points sur 3 × (2 + 1) = 9.

### Compétence (liste `competences` de la racine)

| Champ | Obligatoire | Type | Rôle |
|---|---|---|---|
| `code` | oui | texte court | Le code utilisé dans les questions (ex. `"C1"`, `"RAI"`). |
| `nom` | non | texte | Libellé de la compétence. |
| `domaine` | non | texte | Domaine du socle : `D1.1`, `D1.2`, `D1.3`, `D1.4`, `D2`, `D3`, `D4` ou `D5`. |

---

## Comment l'application lit les compétences

Les codes sont comparés **sans tenir compte des majuscules** à ceux du référentiel de
l'enseignant (Réglages → Compétences).

- Code **déjà connu** : la question y est rattachée. La description fournie dans `competences`
  est ignorée (le référentiel de l'enseignant prime).
- Code **inconnu** : la compétence est **créée** dans le référentiel, avec le nom et le domaine
  donnés dans `competences` s'ils y figurent. L'aperçu de l'import l'annonce avant de valider.

Référentiel par défaut de l'application (physique-chimie, collège) :

| Code | Nom | Domaine |
|---|---|---|
| C1 | Mobiliser des connaissances | D4 |
| C2 | Pratiquer des démarches scientifiques | D4 |
| C3 | Mobiliser des langages scientifiques | D1.3 |
| C4 | Pratiquer la langue française | D1.1 |
| C5 | Mobiliser des outils et des méthodes | D2 |
| C6 | Adopter un comportement éthique et responsable | D3 |
| C7 | Se situer dans l'espace et le temps | D5 |
| C8 | Langues étrangères et régionales | D1.2 |

L'enseignant a pu modifier ce référentiel : s'il te donne sa liste, utilise-la de préférence.

---

## Tolérances

- Le JSON peut être collé tel quel depuis la réponse d'une IA, **même entouré d'un bloc
  ` ```json … ``` `** ou de quelques phrases : l'application garde ce qui va de la première `{`
  à la dernière `}`.
- Les champs inconnus sont ignorés.
- Un titre trop long est tronqué. Une question de Type C sans points valides, ou de Type D sans
  compétence, est refusée avec un message qui dit laquelle.
