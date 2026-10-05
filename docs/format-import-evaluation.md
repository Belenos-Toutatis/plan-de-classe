# Format d'import d'une évaluation — Plan de classe

Ce document décrit le fichier qui permet d'importer **la structure d'une évaluation de type C**
(sommative avec exercices, questions notées en points et compétences évaluées) dans
l'application *Plan de classe*.

Il est écrit pour être donné tel quel à une IA, avec le sujet d'une évaluation, afin qu'elle
produise le fichier.

---

## Consigne pour l'IA

> Tu reçois le sujet (ou le corrigé, ou le barème) d'une évaluation. Produis **un seul objet
> JSON** conforme au format ci-dessous, et rien d'autre : pas de texte avant ni après, pas de
> commentaire dans le JSON. Reprends les exercices et les questions **dans l'ordre du sujet**,
> avec le nombre de points de chaque question tel qu'il est indiqué dans le sujet. Si une
> question n'a pas de barème explicite, propose un nombre de points raisonnable et signale-le
> dans son champ `description`. N'invente pas de compétence : n'utilise que les codes que
> l'enseignant t'a donnés, ou ceux du référentiel par défaut listé plus bas.

---

## Exemple complet

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

---

## Champs

### Racine

| Champ | Obligatoire | Type | Rôle |
|---|---|---|---|
| `format` | oui | texte | Toujours `"plan-de-classe/evaluation"`. |
| `version` | oui | nombre | Toujours `1`. |
| `type` | oui | texte | Toujours `"C"` (seul type importable pour l'instant). |
| `nomCourt` | oui | texte, 20 caractères max | Nom affiché dans les en-têtes de colonnes (ex. `"DS3"`, `"IE2"`). |
| `nomLong` | non | texte, 80 caractères max | Titre complet de l'évaluation. |
| `description` | non | texte, 500 caractères max | Notes libres (affichées en infobulle). |
| `noteMax` | non | nombre > 0 | Note sur laquelle le total est ramené. **Défaut : 20.** Ce n'est pas la somme des points : un sujet sur 25 points peut être noté sur 20. |
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
| `points` | oui | nombre > 0, au plus 100 | Barème de la question. Décimales acceptées (`0.5`, `1.5`). |
| `competences` | non | liste de codes | Codes des compétences évaluées par la question (ex. `["C1", "C3"]`). Liste vide ou absente : la question ne compte pour aucune compétence. |
| `description` | non | texte, 120 caractères max | Intitulé de la question (infobulle). |

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
- Un titre trop long est tronqué ; une question sans points valides est refusée avec un
  message qui dit laquelle.
